import type { Endpoint, PayloadRequest, Where } from 'payload'
import type {
  CalendarEvent,
  CalendarEventStatus,
  CalendarPluginConfig,
  CalendarSource,
} from '../types'

export interface EventsEndpointOptions {
  eventsSlug: string
  sourcesSlug: string
  features: CalendarPluginConfig['features']
}

/**
 * Build query filters from request search params
 */
function buildEventFilters(
  searchParams: URLSearchParams,
): Where {
  const where: Where = {}

  // Date range filtering
  const startDate = searchParams.get('startDate')
  const endDate = searchParams.get('endDate')

  if (startDate || endDate) {
    where.startDate = {}
    if (startDate) {
      where.startDate.greater_than_equal = startDate
    }
    if (endDate) {
      where.startDate.less_than_equal = endDate
    }
  }

  // Source filtering
  const sources = searchParams.get('sources')
  if (sources) {
    const sourceIds = sources.split(',').filter(Boolean)
    if (sourceIds.length > 0) {
      where.source = {
        in: sourceIds,
      }
    }
  }

  // Status filtering
  const status = searchParams.get('status')
  if (status) {
    const statuses = status.split(',').filter(Boolean) as CalendarEventStatus[]
    if (statuses.length > 0) {
      where.status = {
        in: statuses,
      }
    }
  }

  return where
}

/**
 * Create the list events endpoint
 * GET /api/calendar/events
 */
export function createListEventsEndpoint(options: EventsEndpointOptions): Endpoint {
  const { eventsSlug, sourcesSlug } = options

  return {
    path: '/calendar/events',
    method: 'get',
    handler: async (req: PayloadRequest) => {
      const { payload } = req

      try {
        const url = new URL(req.url ?? '', 'http://localhost')
        const searchParams = url.searchParams

        const where = buildEventFilters(searchParams)

        // Pagination
        const page = parseInt(searchParams.get('page') ?? '1', 10)
        const limit = Math.min(parseInt(searchParams.get('limit') ?? '50', 10), 100)

        // Sorting
        const sort = searchParams.get('sort') ?? '-startDate'

        const result = await payload.find({
          collection: eventsSlug,
          where,
          page,
          limit,
          sort,
          depth: 1, // Include source relationship
        })

        return Response.json({
          docs: result.docs,
          totalDocs: result.totalDocs,
          totalPages: result.totalPages,
          page: result.page,
          limit: result.limit,
          hasNextPage: result.hasNextPage,
          hasPrevPage: result.hasPrevPage,
        })
      } catch (error) {
        console.error('Error listing calendar events:', error)
        return Response.json(
          { error: 'Failed to list calendar events' },
          { status: 500 },
        )
      }
    },
  }
}

/**
 * Create the get single event endpoint
 * GET /api/calendar/events/:id
 */
export function createGetEventEndpoint(options: EventsEndpointOptions): Endpoint {
  const { eventsSlug } = options

  return {
    path: '/calendar/events/:id',
    method: 'get',
    handler: async (req: PayloadRequest) => {
      const { payload, routeParams } = req
      const id = routeParams?.id as string

      if (!id) {
        return Response.json(
          { error: 'Event ID is required' },
          { status: 400 },
        )
      }

      try {
        const event = await payload.findByID({
          collection: eventsSlug,
          id,
          depth: 2, // Include source and related data
        })

        if (!event) {
          return Response.json(
            { error: 'Event not found' },
            { status: 404 },
          )
        }

        return Response.json({ doc: event })
      } catch (error) {
        console.error('Error fetching calendar event:', error)

        // Check if it's a not found error
        if (error instanceof Error && error.message.includes('not found')) {
          return Response.json(
            { error: 'Event not found' },
            { status: 404 },
          )
        }

        return Response.json(
          { error: 'Failed to fetch calendar event' },
          { status: 500 },
        )
      }
    },
  }
}

/**
 * Create the create event endpoint
 * POST /api/calendar/events
 */
export function createCreateEventEndpoint(options: EventsEndpointOptions): Endpoint {
  const { eventsSlug } = options

  return {
    path: '/calendar/events',
    method: 'post',
    handler: async (req: PayloadRequest) => {
      const { payload, user } = req

      // Require authentication
      if (!user) {
        return Response.json(
          { error: 'Authentication required' },
          { status: 401 },
        )
      }

      try {
        const body = await req.json?.() ?? {}

        // Validate required fields
        if (!body.title || typeof body.title !== 'string') {
          return Response.json(
            { error: 'Title is required' },
            { status: 400 },
          )
        }

        if (!body.startDate) {
          return Response.json(
            { error: 'Start date is required' },
            { status: 400 },
          )
        }

        if (!body.source) {
          return Response.json(
            { error: 'Source is required' },
            { status: 400 },
          )
        }

        const event = await payload.create({
          collection: eventsSlug,
          data: {
            title: body.title,
            description: body.description,
            location: body.location,
            startDate: body.startDate,
            endDate: body.endDate,
            allDay: body.allDay ?? false,
            timezone: body.timezone ?? 'UTC',
            isRecurring: body.isRecurring ?? false,
            recurrence: body.recurrence,
            source: body.source,
            color: body.color,
            status: body.status ?? 'draft',
            url: body.url,
            image: body.image,
            reminders: body.reminders,
          },
          user,
        })

        return Response.json({ doc: event }, { status: 201 })
      } catch (error) {
        console.error('Error creating calendar event:', error)

        if (error instanceof Error && error.message.includes('validation')) {
          return Response.json(
            { error: error.message },
            { status: 400 },
          )
        }

        return Response.json(
          { error: 'Failed to create calendar event' },
          { status: 500 },
        )
      }
    },
  }
}

/**
 * Create the update event endpoint
 * PATCH /api/calendar/events/:id
 */
export function createUpdateEventEndpoint(options: EventsEndpointOptions): Endpoint {
  const { eventsSlug } = options

  return {
    path: '/calendar/events/:id',
    method: 'patch',
    handler: async (req: PayloadRequest) => {
      const { payload, user, routeParams } = req
      const id = routeParams?.id as string

      // Require authentication
      if (!user) {
        return Response.json(
          { error: 'Authentication required' },
          { status: 401 },
        )
      }

      if (!id) {
        return Response.json(
          { error: 'Event ID is required' },
          { status: 400 },
        )
      }

      try {
        const body = await req.json?.() ?? {}

        // Build update data - only include fields that are provided
        const updateData: Record<string, unknown> = {}

        const allowedFields = [
          'title',
          'description',
          'location',
          'startDate',
          'endDate',
          'allDay',
          'timezone',
          'isRecurring',
          'recurrence',
          'source',
          'color',
          'status',
          'url',
          'image',
          'reminders',
        ]

        for (const field of allowedFields) {
          if (body[field] !== undefined) {
            updateData[field] = body[field]
          }
        }

        if (Object.keys(updateData).length === 0) {
          return Response.json(
            { error: 'No valid fields to update' },
            { status: 400 },
          )
        }

        const event = await payload.update({
          collection: eventsSlug,
          id,
          data: updateData,
          user,
        })

        return Response.json({ doc: event })
      } catch (error) {
        console.error('Error updating calendar event:', error)

        if (error instanceof Error && error.message.includes('not found')) {
          return Response.json(
            { error: 'Event not found' },
            { status: 404 },
          )
        }

        if (error instanceof Error && error.message.includes('validation')) {
          return Response.json(
            { error: error.message },
            { status: 400 },
          )
        }

        return Response.json(
          { error: 'Failed to update calendar event' },
          { status: 500 },
        )
      }
    },
  }
}

/**
 * Create the delete event endpoint
 * DELETE /api/calendar/events/:id
 */
export function createDeleteEventEndpoint(options: EventsEndpointOptions): Endpoint {
  const { eventsSlug } = options

  return {
    path: '/calendar/events/:id',
    method: 'delete',
    handler: async (req: PayloadRequest) => {
      const { payload, user, routeParams } = req
      const id = routeParams?.id as string

      // Require authentication
      if (!user) {
        return Response.json(
          { error: 'Authentication required' },
          { status: 401 },
        )
      }

      if (!id) {
        return Response.json(
          { error: 'Event ID is required' },
          { status: 400 },
        )
      }

      try {
        await payload.delete({
          collection: eventsSlug,
          id,
          user,
        })

        return Response.json({ success: true, id })
      } catch (error) {
        console.error('Error deleting calendar event:', error)

        if (error instanceof Error && error.message.includes('not found')) {
          return Response.json(
            { error: 'Event not found' },
            { status: 404 },
          )
        }

        return Response.json(
          { error: 'Failed to delete calendar event' },
          { status: 500 },
        )
      }
    },
  }
}

/**
 * Create all events endpoints
 */
export function createEventsEndpoints(options: EventsEndpointOptions): Endpoint[] {
  return [
    createListEventsEndpoint(options),
    createGetEventEndpoint(options),
    createCreateEventEndpoint(options),
    createUpdateEventEndpoint(options),
    createDeleteEventEndpoint(options),
  ]
}
