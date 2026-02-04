import type { Endpoint, PayloadRequest, Where } from 'payload'
import type {
  CalendarEvent,
  CalendarPluginConfig,
  CalendarSource,
} from '../types'
import { generateICalFeed } from '../utils/ical'

export interface ICalEndpointOptions {
  eventsSlug: string
  sourcesSlug: string
  features: CalendarPluginConfig['features']
}

/**
 * Create iCal content-type headers
 */
function createICalHeaders(filename: string): Headers {
  const headers = new Headers()
  headers.set('Content-Type', 'text/calendar; charset=utf-8')
  headers.set('Content-Disposition', `attachment; filename="${filename}"`)
  headers.set('Cache-Control', 'public, max-age=3600') // Cache for 1 hour
  return headers
}

/**
 * Create the source-specific iCal feed endpoint
 * GET /api/calendar/ical/:sourceSlug.ics
 *
 * Exports all published events from a specific source as an iCal feed.
 */
export function createSourceICalEndpoint(options: ICalEndpointOptions): Endpoint {
  const { eventsSlug, sourcesSlug } = options

  return {
    path: '/calendar/ical/:sourceSlug.ics',
    method: 'get',
    handler: async (req: PayloadRequest) => {
      const { payload, routeParams } = req
      const sourceSlug = routeParams?.sourceSlug as string

      if (!sourceSlug) {
        return Response.json(
          { error: 'Source slug is required' },
          { status: 400 },
        )
      }

      try {
        // Find the source by slug
        const sourcesResult = await payload.find({
          collection: sourcesSlug,
          where: {
            slug: {
              equals: sourceSlug,
            },
          },
          limit: 1,
        })

        if (sourcesResult.docs.length === 0) {
          return Response.json(
            { error: 'Calendar source not found' },
            { status: 404 },
          )
        }

        const source = sourcesResult.docs[0] as unknown as CalendarSource

        // Check if source is public (for anonymous access)
        const { user } = req
        if (!source.isPublic && !user) {
          return Response.json(
            { error: 'This calendar requires authentication' },
            { status: 401 },
          )
        }

        // Fetch published events for this source
        const eventsResult = await payload.find({
          collection: eventsSlug,
          where: {
            source: {
              equals: source.id,
            },
            status: {
              equals: 'published',
            },
          },
          limit: 1000, // Reasonable limit for iCal feed
          depth: 1,
          sort: 'startDate',
        })

        const events = eventsResult.docs as unknown as CalendarEvent[]

        // Generate iCal feed
        const icalContent = generateICalFeed(events, {
          name: source.name,
          description: `Calendar events from ${source.name}`,
          timezone: 'UTC',
          ttl: 60, // Suggest refresh every hour
        })

        return new Response(icalContent, {
          status: 200,
          headers: createICalHeaders(`${sourceSlug}.ics`),
        })
      } catch (error) {
        console.error('Error generating iCal feed for source:', error)
        return Response.json(
          { error: 'Failed to generate iCal feed' },
          { status: 500 },
        )
      }
    },
  }
}

/**
 * Create the all-events iCal feed endpoint
 * GET /api/calendar/ical/all.ics
 *
 * Exports all published events from all public sources as an iCal feed.
 */
export function createAllEventsICalEndpoint(options: ICalEndpointOptions): Endpoint {
  const { eventsSlug, sourcesSlug } = options

  return {
    path: '/calendar/ical/all.ics',
    method: 'get',
    handler: async (req: PayloadRequest) => {
      const { payload, user } = req

      try {
        // Build source filter based on authentication
        let sourceWhere: Where

        if (user) {
          // Authenticated users can see all sources
          sourceWhere = {}
        } else {
          // Anonymous users only see public sources
          sourceWhere = {
            isPublic: {
              equals: true,
            },
          }
        }

        // Get accessible sources
        const sourcesResult = await payload.find({
          collection: sourcesSlug,
          where: sourceWhere,
          limit: 100,
        })

        if (sourcesResult.docs.length === 0) {
          // Return empty calendar if no accessible sources
          const emptyCalendar = generateICalFeed([], {
            name: 'Calendar',
            description: 'No events available',
            timezone: 'UTC',
            ttl: 60,
          })

          return new Response(emptyCalendar, {
            status: 200,
            headers: createICalHeaders('calendar.ics'),
          })
        }

        const sources = sourcesResult.docs as unknown as CalendarSource[]
        const sourceIds = sources.map((s) => s.id)

        // Fetch published events from accessible sources
        const eventsResult = await payload.find({
          collection: eventsSlug,
          where: {
            source: {
              in: sourceIds,
            },
            status: {
              equals: 'published',
            },
          },
          limit: 2000, // Higher limit for combined feed
          depth: 1,
          sort: 'startDate',
        })

        const events = eventsResult.docs as unknown as CalendarEvent[]

        // Determine calendar name based on context
        const calendarName = user
          ? 'Full Calendar'
          : 'Public Calendar'

        // Generate iCal feed
        const icalContent = generateICalFeed(events, {
          name: calendarName,
          description: `Combined calendar with ${events.length} events from ${sourcesResult.docs.length} sources`,
          timezone: 'UTC',
          ttl: 60, // Suggest refresh every hour
        })

        return new Response(icalContent, {
          status: 200,
          headers: createICalHeaders('calendar.ics'),
        })
      } catch (error) {
        console.error('Error generating combined iCal feed:', error)
        return Response.json(
          { error: 'Failed to generate iCal feed' },
          { status: 500 },
        )
      }
    },
  }
}

/**
 * Create iCal feed endpoint with date range filtering
 * GET /api/calendar/ical/range.ics?startDate=...&endDate=...
 *
 * Exports events within a specific date range.
 */
export function createRangeICalEndpoint(options: ICalEndpointOptions): Endpoint {
  const { eventsSlug, sourcesSlug } = options

  return {
    path: '/calendar/ical/range.ics',
    method: 'get',
    handler: async (req: PayloadRequest) => {
      const { payload, user } = req

      try {
        const url = new URL(req.url ?? '', 'http://localhost')
        const searchParams = url.searchParams

        const startDateParam = searchParams.get('startDate')
        const endDateParam = searchParams.get('endDate')
        const sourcesParam = searchParams.get('sources')

        // Validate date range if provided
        let dateWhere: Where = {}
        if (startDateParam || endDateParam) {
          dateWhere.startDate = {}
          if (startDateParam) {
            const startDate = new Date(startDateParam)
            if (isNaN(startDate.getTime())) {
              return Response.json(
                { error: 'Invalid startDate format' },
                { status: 400 },
              )
            }
            dateWhere.startDate.greater_than_equal = startDateParam
          }
          if (endDateParam) {
            const endDate = new Date(endDateParam)
            if (isNaN(endDate.getTime())) {
              return Response.json(
                { error: 'Invalid endDate format' },
                { status: 400 },
              )
            }
            dateWhere.startDate.less_than_equal = endDateParam
          }
        }

        // Build source filter
        let sourceFilter: Where = {}

        if (sourcesParam) {
          // Filter by specific sources
          const requestedSources = sourcesParam.split(',').filter(Boolean)
          sourceFilter.source = {
            in: requestedSources,
          }
        } else if (!user) {
          // Anonymous users - filter by public sources
          const publicSourcesResult = await payload.find({
            collection: sourcesSlug,
            where: {
              isPublic: {
                equals: true,
              },
            },
            limit: 100,
          })

          const publicSources = publicSourcesResult.docs as unknown as CalendarSource[]
          const publicSourceIds = publicSources.map((s) => s.id)
          if (publicSourceIds.length > 0) {
            sourceFilter.source = {
              in: publicSourceIds,
            }
          }
        }

        // Combine filters
        const eventWhere: Where = {
          status: {
            equals: 'published',
          },
          ...dateWhere,
          ...sourceFilter,
        }

        // Fetch events
        const eventsResult = await payload.find({
          collection: eventsSlug,
          where: eventWhere,
          limit: 2000,
          depth: 1,
          sort: 'startDate',
        })

        const events = eventsResult.docs as unknown as CalendarEvent[]

        // Build description
        const dateRangeDesc = startDateParam && endDateParam
          ? ` from ${startDateParam} to ${endDateParam}`
          : startDateParam
            ? ` starting from ${startDateParam}`
            : endDateParam
              ? ` until ${endDateParam}`
              : ''

        // Generate iCal feed
        const icalContent = generateICalFeed(events, {
          name: `Calendar Export${dateRangeDesc}`,
          description: `${events.length} events${dateRangeDesc}`,
          timezone: 'UTC',
          ttl: 60,
        })

        return new Response(icalContent, {
          status: 200,
          headers: createICalHeaders('calendar-export.ics'),
        })
      } catch (error) {
        console.error('Error generating range iCal feed:', error)
        return Response.json(
          { error: 'Failed to generate iCal feed' },
          { status: 500 },
        )
      }
    },
  }
}

/**
 * Create all iCal endpoints
 */
export function createICalEndpoints(options: ICalEndpointOptions): Endpoint[] {
  const endpoints: Endpoint[] = []

  // Only add iCal endpoints if the feature is enabled
  if (options.features?.icalExport !== false) {
    endpoints.push(
      createSourceICalEndpoint(options),
      createAllEventsICalEndpoint(options),
      createRangeICalEndpoint(options),
    )
  }

  return endpoints
}
