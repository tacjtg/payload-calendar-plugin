import type { Config, Plugin } from 'payload'
import { calendarPlugin } from '@payload-calendar/core'
import type { CalendarPluginConfig } from '@payload-calendar/core'
import { FeastDays } from './collections/FeastDays'
import { FastingPeriods } from './collections/FastingPeriods'
import { Saints } from './collections/Saints'
import { LiturgicalReadings } from './collections/LiturgicalReadings'
import type { OrthodoxCalendarPluginConfig, OrthodoxCalendarSources } from './types'

// Re-export collections
export { FeastDays } from './collections/FeastDays'
export { FastingPeriods } from './collections/FastingPeriods'
export { Saints } from './collections/Saints'
export { LiturgicalReadings } from './collections/LiturgicalReadings'

// Re-export types
export * from './types'

// Re-export utilities
export * from './utils/pascha'
export * from './utils/orthocal'

/**
 * Pre-configured Orthodox calendar sources
 *
 * These can be used to seed the CalendarSources collection
 * with Orthodox-specific calendar categories.
 */
export const ORTHODOX_CALENDAR_SOURCES: OrthodoxCalendarSources = {
  feastDays: {
    slug: 'feast-days',
    name: 'Feast Days',
    color: '#C41E3A', // Liturgical red
    icon: 'church',
  },
  fasting: {
    slug: 'fasting',
    name: 'Fasting',
    color: '#6B21A8', // Purple for fasting
    icon: 'utensils-crossed',
  },
  saints: {
    slug: 'saints',
    name: 'Saints',
    color: '#CA8A04', // Gold
    icon: 'user',
  },
  liturgicalServices: {
    slug: 'liturgical-services',
    name: 'Liturgical Services',
    color: '#1D4ED8', // Liturgical blue
    icon: 'book-open',
  },
}

/**
 * Orthodox Calendar Plugin for Payload CMS
 *
 * Extends the core calendar plugin with Orthodox-specific functionality:
 * - Feast Days collection with liturgical classification
 * - Fasting Periods with detailed rules
 * - Saints collection with categories and hymns
 * - Liturgical Readings with scripture references
 * - Pascha date calculation
 * - Orthocal.info API integration
 *
 * @example
 * ```typescript
 * // payload.config.ts
 * import { orthodoxCalendarPlugin } from '@payload-calendar/orthodox'
 *
 * export default buildConfig({
 *   plugins: [
 *     orthodoxCalendarPlugin({
 *       tradition: 'JULIAN',
 *       features: {
 *         feastDays: true,
 *         fastingPeriods: true,
 *         saints: true,
 *         readings: true,
 *         orthocalSync: false,
 *       },
 *     }),
 *   ],
 * })
 * ```
 *
 * @example
 * ```typescript
 * // With core calendar plugin integration
 * import { orthodoxCalendarPlugin } from '@payload-calendar/orthodox'
 *
 * export default buildConfig({
 *   plugins: [
 *     orthodoxCalendarPlugin({
 *       tradition: 'REVISED_JULIAN',
 *       coreConfig: {
 *         features: {
 *           recurrence: true,
 *           icalExport: true,
 *           multiTenant: true,
 *         },
 *         tenantField: 'parish',
 *         tenantCollection: 'parishes',
 *       },
 *     }),
 *   ],
 * })
 * ```
 */
export const orthodoxCalendarPlugin = (
  pluginConfig: OrthodoxCalendarPluginConfig = {}
): Plugin => {
  const {
    tradition = 'JULIAN',
    collections: collectionConfig = {},
    features = {},
    admin = {},
    multiTenant,
    hooks = {},
    coreConfig = {},
  } = pluginConfig

  // Default feature flags
  const enabledFeatures = {
    feastDays: features.feastDays ?? true,
    fastingPeriods: features.fastingPeriods ?? true,
    saints: features.saints ?? true,
    readings: features.readings ?? true,
    orthocalSync: features.orthocalSync ?? false,
  }

  // Collection slugs
  const feastDaysSlug = collectionConfig.feastDays?.slug ?? 'orthodox-feast-days'
  const fastingPeriodsSlug = collectionConfig.fastingPeriods?.slug ?? 'orthodox-fasting-periods'
  const saintsSlug = collectionConfig.saints?.slug ?? 'orthodox-saints'
  const readingsSlug = collectionConfig.readings?.slug ?? 'orthodox-readings'

  // Admin group
  const adminGroup = admin.group ?? 'Orthodox Calendar'

  return (incomingConfig: Config): Config => {
    // Build Orthodox-specific collections
    const orthodoxCollections = []

    if (enabledFeatures.feastDays) {
      orthodoxCollections.push(
        FeastDays({
          slug: feastDaysSlug,
          multiTenant,
          additionalFields: collectionConfig.feastDays?.fields,
          hooks: hooks.feastDays,
          adminGroup,
        })
      )
    }

    if (enabledFeatures.fastingPeriods) {
      orthodoxCollections.push(
        FastingPeriods({
          slug: fastingPeriodsSlug,
          multiTenant,
          additionalFields: collectionConfig.fastingPeriods?.fields,
          hooks: hooks.fastingPeriods,
          adminGroup,
        })
      )
    }

    if (enabledFeatures.saints) {
      orthodoxCollections.push(
        Saints({
          slug: saintsSlug,
          multiTenant,
          additionalFields: collectionConfig.saints?.fields,
          hooks: hooks.saints,
          adminGroup,
        })
      )
    }

    if (enabledFeatures.readings) {
      orthodoxCollections.push(
        LiturgicalReadings({
          slug: readingsSlug,
          multiTenant,
          additionalFields: collectionConfig.readings?.fields,
          hooks: hooks.readings,
          adminGroup,
        })
      )
    }

    // Merge core plugin config with Orthodox-specific settings
    const mergedCoreConfig: CalendarPluginConfig = {
      ...coreConfig,
      features: {
        ...coreConfig.features,
        multiTenant: !!multiTenant,
      },
      tenantField: multiTenant?.tenantField ?? coreConfig.tenantField,
      tenantCollection: multiTenant?.tenantCollection ?? coreConfig.tenantCollection,
      admin: {
        ...coreConfig.admin,
        group: coreConfig.admin?.group ?? 'Calendar',
      },
    }

    // Apply core calendar plugin first (cast to Config since our plugin is synchronous)
    const coreResult = calendarPlugin(mergedCoreConfig)(incomingConfig)
    let config = coreResult as Config

    // Add Orthodox collections
    config = {
      ...config,
      collections: [...(config.collections ?? []), ...orthodoxCollections],
    }

    // Add custom globals for Orthodox-specific settings
    config = {
      ...config,
      globals: [
        ...(config.globals ?? []),
        {
          slug: 'orthodox-calendar-settings',
          admin: {
            group: adminGroup,
          },
          fields: [
            {
              name: 'tradition',
              type: 'select',
              defaultValue: tradition,
              options: [
                { label: 'Julian Calendar (Old Calendar)', value: 'JULIAN' },
                { label: 'Gregorian Calendar', value: 'GREGORIAN' },
                { label: 'Revised Julian Calendar (New Calendar)', value: 'REVISED_JULIAN' },
              ],
              admin: {
                description: 'Calendar tradition used for Pascha calculation and moveable feasts',
              },
            },
            {
              name: 'displayJulianDates',
              type: 'checkbox',
              defaultValue: tradition === 'JULIAN',
              admin: {
                description: 'Show Julian calendar dates alongside Gregorian',
              },
            },
            {
              name: 'orthocalSyncEnabled',
              type: 'checkbox',
              defaultValue: enabledFeatures.orthocalSync,
              admin: {
                description: 'Enable automatic synchronization with orthocal.info API',
              },
            },
            {
              name: 'lastOrthocalSync',
              type: 'date',
              admin: {
                readOnly: true,
                description: 'Last successful sync with orthocal.info',
              },
            },
          ],
        },
      ],
    }

    return config
  }
}

/**
 * Standalone Orthodox collections plugin
 *
 * Use this if you want just the Orthodox collections without
 * the core calendar plugin. Useful for adding to an existing
 * calendar setup.
 *
 * @example
 * ```typescript
 * import { calendarPlugin } from '@payload-calendar/core'
 * import { orthodoxCollectionsPlugin } from '@payload-calendar/orthodox'
 *
 * export default buildConfig({
 *   plugins: [
 *     calendarPlugin({ ... }),
 *     orthodoxCollectionsPlugin({ ... }),
 *   ],
 * })
 * ```
 */
export const orthodoxCollectionsPlugin = (
  pluginConfig: Omit<OrthodoxCalendarPluginConfig, 'coreConfig'> = {}
): Plugin => {
  const {
    collections: collectionConfig = {},
    features = {},
    admin = {},
    multiTenant,
    hooks = {},
  } = pluginConfig

  // Default feature flags
  const enabledFeatures = {
    feastDays: features.feastDays ?? true,
    fastingPeriods: features.fastingPeriods ?? true,
    saints: features.saints ?? true,
    readings: features.readings ?? true,
  }

  // Collection slugs
  const feastDaysSlug = collectionConfig.feastDays?.slug ?? 'orthodox-feast-days'
  const fastingPeriodsSlug = collectionConfig.fastingPeriods?.slug ?? 'orthodox-fasting-periods'
  const saintsSlug = collectionConfig.saints?.slug ?? 'orthodox-saints'
  const readingsSlug = collectionConfig.readings?.slug ?? 'orthodox-readings'

  // Admin group
  const adminGroup = admin.group ?? 'Orthodox Calendar'

  return (incomingConfig: Config): Config => {
    const orthodoxCollections = []

    if (enabledFeatures.feastDays) {
      orthodoxCollections.push(
        FeastDays({
          slug: feastDaysSlug,
          multiTenant,
          additionalFields: collectionConfig.feastDays?.fields,
          hooks: hooks.feastDays,
          adminGroup,
        })
      )
    }

    if (enabledFeatures.fastingPeriods) {
      orthodoxCollections.push(
        FastingPeriods({
          slug: fastingPeriodsSlug,
          multiTenant,
          additionalFields: collectionConfig.fastingPeriods?.fields,
          hooks: hooks.fastingPeriods,
          adminGroup,
        })
      )
    }

    if (enabledFeatures.saints) {
      orthodoxCollections.push(
        Saints({
          slug: saintsSlug,
          multiTenant,
          additionalFields: collectionConfig.saints?.fields,
          hooks: hooks.saints,
          adminGroup,
        })
      )
    }

    if (enabledFeatures.readings) {
      orthodoxCollections.push(
        LiturgicalReadings({
          slug: readingsSlug,
          multiTenant,
          additionalFields: collectionConfig.readings?.fields,
          hooks: hooks.readings,
          adminGroup,
        })
      )
    }

    return {
      ...incomingConfig,
      collections: [...(incomingConfig.collections ?? []), ...orthodoxCollections],
    }
  }
}

export default orthodoxCalendarPlugin
