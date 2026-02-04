/**
 * @fileoverview Single event card display component
 */

import { useMemo, useCallback } from 'react'
import type { EventCardProps, CalendarEvent } from '../types'

/**
 * Default date format options
 */
const DEFAULT_DATE_FORMAT: Intl.DateTimeFormatOptions = {
  weekday: 'short',
  month: 'short',
  day: 'numeric',
}

/**
 * Default time format options
 */
const DEFAULT_TIME_FORMAT: Intl.DateTimeFormatOptions = {
  hour: 'numeric',
  minute: '2-digit',
}

/**
 * Formats a date range for display
 */
function formatDateRange(
  start: string | Date,
  end: string | Date | undefined,
  allDay: boolean | undefined,
  dateFormat: Intl.DateTimeFormatOptions,
  timeFormat: Intl.DateTimeFormatOptions
): string {
  const startDate = typeof start === 'string' ? new Date(start) : start
  const endDate = end ? (typeof end === 'string' ? new Date(end) : end) : undefined

  const dateStr = startDate.toLocaleDateString(undefined, dateFormat)

  if (allDay) {
    if (endDate && startDate.toDateString() !== endDate.toDateString()) {
      const endDateStr = endDate.toLocaleDateString(undefined, dateFormat)
      return `${dateStr} - ${endDateStr}`
    }
    return dateStr
  }

  const startTimeStr = startDate.toLocaleTimeString(undefined, timeFormat)

  if (endDate) {
    const endTimeStr = endDate.toLocaleTimeString(undefined, timeFormat)

    if (startDate.toDateString() === endDate.toDateString()) {
      return `${dateStr}, ${startTimeStr} - ${endTimeStr}`
    }

    const endDateStr = endDate.toLocaleDateString(undefined, dateFormat)
    return `${dateStr} ${startTimeStr} - ${endDateStr} ${endTimeStr}`
  }

  return `${dateStr}, ${startTimeStr}`
}

/**
 * A card component for displaying a single calendar event
 *
 * @param props - Component props
 * @returns The event card component
 *
 * @example
 * ```tsx
 * <EventCard
 *   event={event}
 *   onClick={(e) => openEventDetail(e)}
 *   showDescription
 *   showLocation
 *   showSource
 * />
 * ```
 */
export function EventCard({
  event,
  onClick,
  showDescription = true,
  showLocation = true,
  showSource = false,
  className,
  compact = false,
  dateFormat = DEFAULT_DATE_FORMAT,
  timeFormat = DEFAULT_TIME_FORMAT,
}: EventCardProps) {
  // Format the date/time range
  const formattedDateTime = useMemo(() => {
    return formatDateRange(event.start, event.end, event.allDay, dateFormat, timeFormat)
  }, [event.start, event.end, event.allDay, dateFormat, timeFormat])

  // Handle card click
  const handleClick = useCallback(() => {
    onClick?.(event)
  }, [onClick, event])

  // Handle keyboard interaction
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        onClick?.(event)
      }
    },
    [onClick, event]
  )

  // Determine the accent color
  const accentColor = event.backgroundColor || event.borderColor || '#3788d8'

  // Compact card styles
  if (compact) {
    return (
      <div
        className={className}
        onClick={onClick ? handleClick : undefined}
        onKeyDown={onClick ? handleKeyDown : undefined}
        role={onClick ? 'button' : undefined}
        tabIndex={onClick ? 0 : undefined}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px',
          borderRadius: '4px',
          cursor: onClick ? 'pointer' : 'default',
          background: '#fff',
          border: '1px solid #e5e7eb',
          transition: 'box-shadow 0.2s ease',
        }}
        aria-label={`Event: ${event.title} on ${formattedDateTime}`}
      >
        <div
          style={{
            width: '4px',
            height: '100%',
            minHeight: '24px',
            borderRadius: '2px',
            background: accentColor,
            flexShrink: 0,
          }}
          aria-hidden="true"
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontWeight: 500,
              fontSize: '14px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {event.title}
          </div>
          <div
            style={{
              fontSize: '12px',
              color: '#666',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {formattedDateTime}
          </div>
        </div>
      </div>
    )
  }

  // Full card styles
  return (
    <div
      className={className}
      onClick={onClick ? handleClick : undefined}
      onKeyDown={onClick ? handleKeyDown : undefined}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      style={{
        padding: '16px',
        borderRadius: '8px',
        cursor: onClick ? 'pointer' : 'default',
        background: '#fff',
        border: '1px solid #e5e7eb',
        borderLeft: `4px solid ${accentColor}`,
        transition: 'box-shadow 0.2s ease, transform 0.2s ease',
      }}
      aria-label={`Event: ${event.title} on ${formattedDateTime}`}
    >
      {/* Header with title and source */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: '8px',
          marginBottom: '8px',
        }}
      >
        <h3
          style={{
            margin: 0,
            fontSize: '16px',
            fontWeight: 600,
            lineHeight: 1.3,
          }}
        >
          {event.title}
        </h3>
        {showSource && event.source && (
          <span
            style={{
              fontSize: '12px',
              padding: '2px 8px',
              borderRadius: '12px',
              background: `${accentColor}20`,
              color: accentColor,
              flexShrink: 0,
            }}
          >
            {event.source}
          </span>
        )}
      </div>

      {/* Date/time */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          fontSize: '14px',
          color: '#666',
          marginBottom: showDescription || showLocation ? '8px' : 0,
        }}
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
        <span>{formattedDateTime}</span>
        {event.allDay && (
          <span
            style={{
              fontSize: '11px',
              padding: '1px 6px',
              borderRadius: '4px',
              background: '#f3f4f6',
              color: '#666',
            }}
          >
            All day
          </span>
        )}
      </div>

      {/* Location */}
      {showLocation && event.location && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '14px',
            color: '#666',
            marginBottom: showDescription && event.description ? '8px' : 0,
          }}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
          <span>{event.location}</span>
        </div>
      )}

      {/* Description */}
      {showDescription && event.description && (
        <p
          style={{
            margin: 0,
            fontSize: '14px',
            color: '#666',
            lineHeight: 1.5,
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {event.description}
        </p>
      )}
    </div>
  )
}

export default EventCard
