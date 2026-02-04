import type { Config, Plugin } from 'payload'
import { CalendarEvents } from './collections/CalendarEvents'
import { CalendarSources } from './collections/CalendarSources'
import { CalendarSubscriptions } from './collections/CalendarSubscriptions'
import { calendarEndpoints } from './endpoints'
import type { CalendarPluginConfig } from './types'

export { CalendarEvents } from './collections/CalendarEvents'
export { CalendarSources } from './collections/CalendarSources'
export { CalendarSubscriptions } from './collections/CalendarSubscriptions'
export * from './types'
export * from './utils/recurrence'
export * from './utils/ical'

/**
 * Payload Calendar Plugin
 *
 * Adds comprehensive calendar functionality to Payload CMS:
 * - Calendar events with recurrence (RRule)
 * - Calendar sources (categories/calendars)
 * - iCal import/export
 * - Multi-tenant support (optional)
 *
 * @example
 * ```typescript
 * // payload.config.ts
 * import { calendarPlugin } from '@payload-calendar/core'
 *
 * export default buildConfig({
 *   plugins: [
 *     calendarPlugin({
 *       features: {
 *         recurrence: true,
 *         icalExport: true,
 *         icalImport: true,
 *       },
 *     }),
 *   ],
 * })
 * ```
 */
export const calendarPlugin = (pluginConfig: CalendarPluginConfig = {}): Plugin => {
  const {
    collections: collectionConfig = {},
    features = {},
    admin = {},
    hooks = {},
  } = pluginConfig

  // Default feature flags
  const enabledFeatures = {
    recurrence: features.recurrence ?? true,
    icalExport: features.icalExport ?? true,
    icalImport: features.icalImport ?? true,
    multiTenant: features.multiTenant ?? false,
    reminders: features.reminders ?? false,
    ...features,
  }

  return (incomingConfig: Config): Config => {
    // Build collections with custom slugs if provided
    const eventsSlug = collectionConfig.events?.slug ?? 'calendar-events'
    const sourcesSlug = collectionConfig.sources?.slug ?? 'calendar-sources'
    const subscriptionsSlug = collectionConfig.subscriptions?.slug ?? 'calendar-subscriptions'

    // Create collections
    const calendarCollections = [
      CalendarEvents({
        slug: eventsSlug,
        features: enabledFeatures,
        multiTenant: enabledFeatures.multiTenant
          ? { tenantField: pluginConfig.tenantField ?? 'tenant' }
          : undefined,
        sourcesSlug,
        additionalFields: collectionConfig.events?.fields,
        hooks: hooks.events,
      }),
      CalendarSources({
        slug: sourcesSlug,
        multiTenant: enabledFeatures.multiTenant
          ? { tenantField: pluginConfig.tenantField ?? 'tenant' }
          : undefined,
        additionalFields: collectionConfig.sources?.fields,
        hooks: hooks.sources,
      }),
    ]

    // Add subscriptions collection if iCal import is enabled
    if (enabledFeatures.icalImport) {
      calendarCollections.push(
        CalendarSubscriptions({
          slug: subscriptionsSlug,
          sourcesSlug,
          multiTenant: enabledFeatures.multiTenant
            ? { tenantField: pluginConfig.tenantField ?? 'tenant' }
            : undefined,
          additionalFields: collectionConfig.subscriptions?.fields,
          hooks: hooks.subscriptions,
        }),
      )
    }

    // Build endpoints
    const endpoints = calendarEndpoints({
      eventsSlug,
      sourcesSlug,
      subscriptionsSlug,
      features: enabledFeatures,
    })

    return {
      ...incomingConfig,
      collections: [...(incomingConfig.collections ?? []), ...calendarCollections],
      endpoints: [...(incomingConfig.endpoints ?? []), ...endpoints],
      admin: {
        ...incomingConfig.admin,
        components: {
          ...incomingConfig.admin?.components,
          // Add calendar dashboard view if enabled
          ...(admin.calendarView !== false
            ? {
                views: {
                  ...incomingConfig.admin?.components?.views,
                  // Calendar dashboard will be added here
                },
              }
            : {}),
        },
      },
    }
  }
}

export default calendarPlugin
