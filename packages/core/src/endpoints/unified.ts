import type { Endpoint, PayloadRequest, Where } from 'payload'
import type {
  CalendarEvent,
  CalendarEventStatus,
  CalendarPluginConfig,
  CalendarSource,
  UnifiedCalendarEvent,
} from '../types'
import { expandRecurringEvent, eventToUnified } from '../utils/recurrence'

export interface UnifiedEndpointOptions {
  eventsSlug: string
  sourcesSlug: string
  features: CalendarPluginConfig['features']
}

/**
 * Create the unified calendar endpoint
 * GET /api/calendar/unified
 *
 * Returns an aggregated view of all calendar events from all sources,
 * with optional recurrence expansion.
 */
export function createUnifiedCalendarEndpoint(options: UnifiedEndpointOptions): Endpoint {
  const { eventsSlug, sourcesSlug, features } = options
  const recurrenceEnabled = features?.recurrence !== false

  return {
    path: '/calendar/unified',
    method: 'get',
    handler: async (req: PayloadRequest) => {
      const { payload } = req

      try {
        const url = new URL(req.url ?? '', 'http://localhost')
        const searchParams = url.searchParams

        // Required: Date range for the unified view
        const startDateParam = searchParams.get('startDate')
        const endDateParam = searchParams.get('endDate')

        if (!startDateParam || !endDateParam) {
          return Response.json(
            { error: 'startDate and endDate query parameters are required' },
            { status: 400 },
          )
        }

        const rangeStart = new Date(startDateParam)
        const rangeEnd = new Date(endDateParam)

        if (isNaN(rangeStart.getTime()) || isNaN(rangeEnd.getTime())) {
          return Response.json(
            { error: 'Invalid date format. Use ISO 8601 format (YYYY-MM-DD or YYYY-MM-DDTHH:mm:ss.sssZ)' },
            { status: 400 },
          )
        }

        if (rangeStart > rangeEnd) {
          return Response.json(
            { error: 'startDate must be before endDate' },
            { status: 400 },
          )
        }

        // Limit range to prevent excessive computation
        const maxRangeDays = 366 // 1 year max
        const rangeDays = (rangeEnd.getTime() - rangeStart.getTime()) / (1000 * 60 * 60 * 24)
        if (rangeDays > maxRangeDays) {
          return Response.json(
            { error: `Date range cannot exceed ${maxRangeDays} days` },
            { status: 400 },
          )
        }

        // Build query filters
        const where: Where = {
          status: {
            not_equals: 'cancelled',
          },
        }

        // Source filtering
        const sourcesParam = searchParams.get('sources')
        if (sourcesParam) {
          const sourceIds = sourcesParam.split(',').filter(Boolean)
          if (sourceIds.length > 0) {
            where.source = {
              in: sourceIds,
            }
          }
        }

        // Status filtering (override default)
        const statusParam = searchParams.get('status')
        if (statusParam) {
          const statuses = statusParam.split(',').filter(Boolean) as CalendarEventStatus[]
          if (statuses.length > 0) {
            where.status = {
              in: statuses,
            }
          }
        }

        // Option to expand recurring events
        const expandParam = searchParams.get('expand')
        const shouldExpand = recurrenceEnabled && expandParam !== 'false'

        // For unified view, we need events that:
        // 1. Start within the range, OR
        // 2. Are recurring and could have occurrences in the range
        const eventWhere: Where = {
          ...where,
          or: [
            // Non-recurring events that start within range
            {
              and: [
                { isRecurring: { equals: false } },
                { startDate: { greater_than_equal: startDateParam } },
                { startDate: { less_than_equal: endDateParam } },
              ],
            },
            // Recurring events that started before range end
            // (we'll filter occurrences after expansion)
            {
              and: [
                { isRecurring: { equals: true } },
                { startDate: { less_than_equal: endDateParam } },
              ],
            },
            // Events with no end that start before range end
            {
              and: [
                { isRecurring: { equals: false } },
                { startDate: { less_than_equal: endDateParam } },
                { endDate: { greater_than_equal: startDateParam } },
              ],
            },
          ],
        }

        // Fetch all matching events (with generous limit for aggregation)
        const result = await payload.find({
          collection: eventsSlug,
          where: eventWhere,
          limit: 1000, // High limit for aggregation
          depth: 1, // Include source relationship
          sort: 'startDate',
        })

        const events = result.docs as unknown as CalendarEvent[]
        const unifiedEvents: UnifiedCalendarEvent[] = []

        // Process each event
        for (const event of events) {
          if (event.isRecurring && shouldExpand && event.recurrence?.rrule) {
            // Expand recurring event
            const occurrences = expandRecurringEvent(event, rangeStart, rangeEnd)
            unifiedEvents.push(...occurrences)
          } else if (!event.isRecurring) {
            // Non-recurring event - check if it falls within range
            const eventStart = new Date(event.startDate)
            const eventEnd = event.endDate ? new Date(event.endDate) : eventStart

            // Event is in range if it overlaps with the query range
            if (eventStart <= rangeEnd && eventEnd >= rangeStart) {
              unifiedEvents.push(eventToUnified(event))
            }
          } else {
            // Recurring event but expansion disabled - just show the base event
            unifiedEvents.push(eventToUnified(event))
          }
        }

        // Sort by start date
        unifiedEvents.sort((a, b) => {
          return new Date(a.start).getTime() - new Date(b.start).getTime()
        })

        // Fetch sources for reference
        const sourcesResult = await payload.find({
          collection: sourcesSlug,
          limit: 100,
          sort: 'sortOrder',
        })

        const sources = sourcesResult.docs as unknown as CalendarSource[]

        return Response.json({
          events: unifiedEvents,
          meta: {
            startDate: startDateParam,
            endDate: endDateParam,
            totalEvents: unifiedEvents.length,
            sourcesIncluded: sourcesParam?.split(',').filter(Boolean) ?? 'all',
            recurrenceExpanded: shouldExpand,
          },
          sources: sources.map((source) => ({
            id: source.id,
            name: source.name,
            slug: source.slug,
            color: source.color,
            isPublic: source.isPublic,
          })),
        })
      } catch (error) {
        console.error('Error fetching unified calendar:', error)
        return Response.json(
          { error: 'Failed to fetch unified calendar' },
          { status: 500 },
        )
      }
    },
  }
}

/**
 * Create all unified endpoints
 */
export function createUnifiedEndpoints(options: UnifiedEndpointOptions): Endpoint[] {
  return [
    createUnifiedCalendarEndpoint(options),
  ]
}
