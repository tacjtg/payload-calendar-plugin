/**
 * @fileoverview List of upcoming events widget component
 */

import { useMemo } from 'react'
import { useCalendarEvents } from '../hooks/useCalendarEvents'
import { EventCard } from './EventCard'
import type { UpcomingEventsProps, CalendarEvent } from '../types'

/**
 * Default date format for grouping
 */
const GROUP_DATE_FORMAT: Intl.DateTimeFormatOptions = {
  weekday: 'long',
  month: 'long',
  day: 'numeric',
}

/**
 * Gets the date key for grouping events
 */
function getDateKey(date: Date): string {
  return date.toDateString()
}

/**
 * Formats a date for display as a group header
 */
function formatGroupDate(date: Date, format: Intl.DateTimeFormatOptions): string {
  const today = new Date()
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  if (date.toDateString() === today.toDateString()) {
    return 'Today'
  }

  if (date.toDateString() === tomorrow.toDateString()) {
    return 'Tomorrow'
  }

  return date.toLocaleDateString(undefined, format)
}

/**
 * Groups events by date
 */
function groupEventsByDate(events: CalendarEvent[]): Map<string, CalendarEvent[]> {
  const groups = new Map<string, CalendarEvent[]>()

  events.forEach((event) => {
    const startDate = new Date(event.start)
    const key = getDateKey(startDate)

    const existing = groups.get(key) || []
    existing.push(event)
    groups.set(key, existing)
  })

  return groups
}

/**
 * Default empty state component
 */
function DefaultEmptyComponent() {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '32px',
        color: '#666',
        textAlign: 'center',
      }}
    >
      <svg
        width="48"
        height="48"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ marginBottom: '12px', opacity: 0.5 }}
        aria-hidden="true"
      >
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </svg>
      <p style={{ margin: 0, fontSize: '14px' }}>No upcoming events</p>
    </div>
  )
}

/**
 * Loading state component
 */
function LoadingComponent() {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        padding: '16px',
      }}
    >
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          style={{
            height: '60px',
            borderRadius: '8px',
            background: 'linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 50%, #f3f4f6 75%)',
            backgroundSize: '200% 100%',
            animation: 'shimmer 1.5s infinite',
          }}
        />
      ))}
      <style>{`
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  )
}

/**
 * A widget component displaying a list of upcoming events
 *
 * @param props - Component props
 * @returns The upcoming events widget
 *
 * @example
 * ```tsx
 * <UpcomingEvents
 *   apiUrl="/api/calendar"
 *   sources={['events', 'meetings']}
 *   limit={10}
 *   daysAhead={30}
 *   onEventClick={(event) => openEventDetail(event)}
 *   showTime
 *   showSource
 * />
 * ```
 */
export function UpcomingEvents({
  apiUrl,
  sources,
  limit = 10,
  daysAhead = 30,
  onEventClick,
  className,
  title = 'Upcoming Events',
  showTime = true,
  showSource = false,
  emptyComponent,
  dateFormat = GROUP_DATE_FORMAT,
}: UpcomingEventsProps) {
  // Calculate the date range
  const dateRange = useMemo(() => {
    const start = new Date()
    start.setHours(0, 0, 0, 0)

    const end = new Date(start)
    end.setDate(end.getDate() + daysAhead)
    end.setHours(23, 59, 59, 999)

    return { start, end }
  }, [daysAhead])

  // Fetch events
  const { events, isLoading, error } = useCalendarEvents(apiUrl, {
    start: dateRange.start,
    end: dateRange.end,
    sources,
  })

  // Filter and sort upcoming events
  const upcomingEvents = useMemo(() => {
    const now = new Date()

    return events
      .filter((event) => {
        const eventStart = new Date(event.start)
        // Include events that haven't ended yet, or all-day events that are today or later
        if (event.allDay) {
          const eventDate = new Date(eventStart)
          eventDate.setHours(0, 0, 0, 0)
          const today = new Date()
          today.setHours(0, 0, 0, 0)
          return eventDate >= today
        }
        return eventStart >= now || (event.end && new Date(event.end) >= now)
      })
      .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
      .slice(0, limit)
  }, [events, limit])

  // Group events by date
  const groupedEvents = useMemo(() => {
    return groupEventsByDate(upcomingEvents)
  }, [upcomingEvents])

  // Loading state
  if (isLoading && events.length === 0) {
    return (
      <div className={className}>
        {title && (
          <h2
            style={{
              margin: '0 0 16px 0',
              fontSize: '18px',
              fontWeight: 600,
            }}
          >
            {title}
          </h2>
        )}
        <LoadingComponent />
      </div>
    )
  }

  // Error state
  if (error && events.length === 0) {
    return (
      <div className={className}>
        {title && (
          <h2
            style={{
              margin: '0 0 16px 0',
              fontSize: '18px',
              fontWeight: 600,
            }}
          >
            {title}
          </h2>
        )}
        <div
          style={{
            padding: '16px',
            color: '#dc2626',
            textAlign: 'center',
            fontSize: '14px',
          }}
        >
          Failed to load events
        </div>
      </div>
    )
  }

  // Empty state
  if (upcomingEvents.length === 0) {
    return (
      <div className={className}>
        {title && (
          <h2
            style={{
              margin: '0 0 16px 0',
              fontSize: '18px',
              fontWeight: 600,
            }}
          >
            {title}
          </h2>
        )}
        {emptyComponent ?? <DefaultEmptyComponent />}
      </div>
    )
  }

  // Render grouped events
  return (
    <div className={className}>
      {title && (
        <h2
          style={{
            margin: '0 0 16px 0',
            fontSize: '18px',
            fontWeight: 600,
          }}
        >
          {title}
        </h2>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {Array.from(groupedEvents.entries()).map(([dateKey, dateEvents]) => {
          const date = new Date(dateKey)
          const formattedDate = formatGroupDate(date, dateFormat)

          return (
            <div key={dateKey}>
              {/* Date header */}
              <h3
                style={{
                  margin: '0 0 8px 0',
                  fontSize: '14px',
                  fontWeight: 600,
                  color: '#666',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}
              >
                {formattedDate}
              </h3>

              {/* Events for this date */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {dateEvents.map((event) => (
                  <EventCard
                    key={event.id}
                    event={event}
                    onClick={onEventClick}
                    showDescription={false}
                    showLocation={false}
                    showSource={showSource}
                    compact
                    dateFormat={
                      showTime
                        ? undefined
                        : { weekday: 'short', month: 'short', day: 'numeric' }
                    }
                  />
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default UpcomingEvents
