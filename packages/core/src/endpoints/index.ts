import type { Endpoint } from 'payload'
import type { CalendarPluginConfig } from '../types'
import { createEventsEndpoints, type EventsEndpointOptions } from './events'
import { createUnifiedEndpoints, type UnifiedEndpointOptions } from './unified'
import { createICalEndpoints, type ICalEndpointOptions } from './ical'

export { createEventsEndpoints, type EventsEndpointOptions } from './events'
export { createUnifiedEndpoints, type UnifiedEndpointOptions } from './unified'
export { createICalEndpoints, type ICalEndpointOptions } from './ical'

/**
 * Configuration options for calendar endpoints
 */
export interface CalendarEndpointsOptions {
  /** Slug for the events collection (default: 'calendar-events') */
  eventsSlug: string
  /** Slug for the sources collection (default: 'calendar-sources') */
  sourcesSlug: string
  /** Slug for the subscriptions collection (default: 'calendar-subscriptions') */
  subscriptionsSlug: string
  /** Feature flags for enabling/disabling functionality */
  features: CalendarPluginConfig['features']
}

/**
 * Create all calendar API endpoints
 *
 * This function generates an array of Payload endpoint configurations
 * that provide the calendar REST API functionality.
 *
 * @example
 * ```typescript
 * // In your payload.config.ts
 * import { calendarEndpoints } from '@payload-calendar/core'
 *
 * export default buildConfig({
 *   endpoints: [
 *     ...calendarEndpoints({
 *       eventsSlug: 'calendar-events',
 *       sourcesSlug: 'calendar-sources',
 *       subscriptionsSlug: 'calendar-subscriptions',
 *       features: {
 *         recurrence: true,
 *         icalExport: true,
 *       },
 *     }),
 *   ],
 * })
 * ```
 *
 * ## Available Endpoints
 *
 * ### Events CRUD
 * - `GET /api/calendar/events` - List events with filtering
 * - `GET /api/calendar/events/:id` - Get single event
 * - `POST /api/calendar/events` - Create event (auth required)
 * - `PATCH /api/calendar/events/:id` - Update event (auth required)
 * - `DELETE /api/calendar/events/:id` - Delete event (auth required)
 *
 * ### Unified Calendar
 * - `GET /api/calendar/unified` - Aggregated view with recurrence expansion
 *
 * ### iCal Feeds (when icalExport enabled)
 * - `GET /api/calendar/ical/:sourceSlug.ics` - Export source as iCal
 * - `GET /api/calendar/ical/all.ics` - Export all public events
 * - `GET /api/calendar/ical/range.ics` - Export with date range filter
 */
export function calendarEndpoints(options: CalendarEndpointsOptions): Endpoint[] {
  const { eventsSlug, sourcesSlug, subscriptionsSlug, features } = options

  const endpoints: Endpoint[] = []

  // Events CRUD endpoints
  const eventsOptions: EventsEndpointOptions = {
    eventsSlug,
    sourcesSlug,
    features,
  }
  endpoints.push(...createEventsEndpoints(eventsOptions))

  // Unified calendar endpoint
  const unifiedOptions: UnifiedEndpointOptions = {
    eventsSlug,
    sourcesSlug,
    features,
  }
  endpoints.push(...createUnifiedEndpoints(unifiedOptions))

  // iCal feed endpoints
  const icalOptions: ICalEndpointOptions = {
    eventsSlug,
    sourcesSlug,
    features,
  }
  endpoints.push(...createICalEndpoints(icalOptions))

  return endpoints
}

export default calendarEndpoints
