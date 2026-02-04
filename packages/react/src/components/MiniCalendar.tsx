/**
 * @fileoverview Small calendar widget for sidebars
 */

import { useState, useCallback, useMemo } from 'react'
import { useCalendarEvents } from '../hooks/useCalendarEvents'
import type { MiniCalendarProps, CalendarEvent } from '../types'

/**
 * Gets the days in a month
 */
function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate()
}

/**
 * Gets the first day of the month (0 = Sunday, 1 = Monday, etc.)
 */
function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay()
}

/**
 * Formats a date as YYYY-MM-DD
 */
function formatDateKey(date: Date): string {
  return date.toISOString().split('T')[0]
}

/**
 * Checks if two dates are the same day
 */
function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  )
}

/**
 * Checks if a date is today
 */
function isToday(date: Date): boolean {
  return isSameDay(date, new Date())
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

/**
 * A small calendar widget for sidebars, showing a month view with event indicators
 *
 * @param props - Component props
 * @returns The mini calendar component
 *
 * @example
 * ```tsx
 * <MiniCalendar
 *   apiUrl="/api/calendar"
 *   selectedDate={selectedDate}
 *   onDateSelect={(date) => setSelectedDate(date)}
 *   onDateClick={(date, events) => setSelectedEvents(events)}
 *   showEventDots
 * />
 * ```
 */
export function MiniCalendar({
  apiUrl,
  sources,
  selectedDate,
  onDateSelect,
  onDateClick,
  className,
  showEventDots = true,
  firstDay = 0,
}: MiniCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(() => {
    const date = selectedDate || new Date()
    return { year: date.getFullYear(), month: date.getMonth() }
  })

  // Calculate the date range for the current month view
  const dateRange = useMemo(() => {
    const start = new Date(currentMonth.year, currentMonth.month, 1)
    const end = new Date(currentMonth.year, currentMonth.month + 1, 0, 23, 59, 59)
    return { start, end }
  }, [currentMonth.year, currentMonth.month])

  // Fetch events for the current month
  const { events } = useCalendarEvents(apiUrl, {
    start: dateRange.start,
    end: dateRange.end,
    sources,
    enabled: showEventDots,
  })

  // Create a map of dates to events for quick lookup
  const eventsByDate = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>()

    events.forEach((event) => {
      const eventStart = new Date(event.start)
      const eventEnd = event.end ? new Date(event.end) : eventStart

      // Add event to each day it spans
      const current = new Date(eventStart)
      while (current <= eventEnd) {
        const key = formatDateKey(current)
        const existing = map.get(key) || []
        existing.push(event)
        map.set(key, existing)
        current.setDate(current.getDate() + 1)
      }
    })

    return map
  }, [events])

  // Handle previous month navigation
  const handlePrevMonth = useCallback(() => {
    setCurrentMonth((prev) => {
      if (prev.month === 0) {
        return { year: prev.year - 1, month: 11 }
      }
      return { year: prev.year, month: prev.month - 1 }
    })
  }, [])

  // Handle next month navigation
  const handleNextMonth = useCallback(() => {
    setCurrentMonth((prev) => {
      if (prev.month === 11) {
        return { year: prev.year + 1, month: 0 }
      }
      return { year: prev.year, month: prev.month + 1 }
    })
  }, [])

  // Handle date click
  const handleDateClick = useCallback(
    (date: Date) => {
      onDateSelect?.(date)

      if (onDateClick) {
        const key = formatDateKey(date)
        const dateEvents = eventsByDate.get(key) || []
        onDateClick(date, dateEvents)
      }
    },
    [onDateSelect, onDateClick, eventsByDate]
  )

  // Build the calendar grid
  const calendarDays = useMemo(() => {
    const daysInMonth = getDaysInMonth(currentMonth.year, currentMonth.month)
    const firstDay = getFirstDayOfMonth(currentMonth.year, currentMonth.month)
    const days: Array<{ date: Date | null; dayOfMonth: number }> = []

    // Add empty cells for days before the first of the month
    for (let i = 0; i < firstDay; i++) {
      days.push({ date: null, dayOfMonth: 0 })
    }

    // Add the days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push({
        date: new Date(currentMonth.year, currentMonth.month, day),
        dayOfMonth: day,
      })
    }

    return days
  }, [currentMonth.year, currentMonth.month])

  // Reorder weekdays based on firstDay
  const orderedWeekdays = useMemo(() => {
    return [...WEEKDAYS.slice(firstDay), ...WEEKDAYS.slice(0, firstDay)]
  }, [firstDay])

  return (
    <div
      className={className}
      style={{
        fontFamily: 'system-ui, -apple-system, sans-serif',
        fontSize: '14px',
        width: '100%',
        maxWidth: '280px',
      }}
    >
      {/* Header with navigation */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '12px',
        }}
      >
        <button
          onClick={handlePrevMonth}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '4px 8px',
            fontSize: '16px',
            color: '#666',
          }}
          aria-label="Previous month"
        >
          &lt;
        </button>
        <span style={{ fontWeight: 600 }}>
          {MONTH_NAMES[currentMonth.month]} {currentMonth.year}
        </span>
        <button
          onClick={handleNextMonth}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '4px 8px',
            fontSize: '16px',
            color: '#666',
          }}
          aria-label="Next month"
        >
          &gt;
        </button>
      </div>

      {/* Weekday headers */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: '2px',
          marginBottom: '4px',
        }}
      >
        {orderedWeekdays.map((day) => (
          <div
            key={day}
            style={{
              textAlign: 'center',
              fontWeight: 500,
              color: '#666',
              fontSize: '12px',
              padding: '4px',
            }}
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: '2px',
        }}
      >
        {calendarDays.map((day, index) => {
          if (!day.date) {
            return <div key={`empty-${index}`} style={{ padding: '8px' }} />
          }

          const dateKey = formatDateKey(day.date)
          const hasEvents = eventsByDate.has(dateKey)
          const isSelected = selectedDate && isSameDay(day.date, selectedDate)
          const isTodayDate = isToday(day.date)

          return (
            <button
              key={dateKey}
              onClick={() => handleDateClick(day.date!)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '6px',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                background: isSelected
                  ? '#3788d8'
                  : isTodayDate
                    ? '#e3f2fd'
                    : 'transparent',
                color: isSelected ? '#fff' : isTodayDate ? '#1976d2' : 'inherit',
                fontWeight: isTodayDate || isSelected ? 600 : 400,
                position: 'relative',
                minHeight: '32px',
              }}
              aria-label={`${day.date.toLocaleDateString()}${hasEvents ? ' (has events)' : ''}`}
              aria-pressed={isSelected}
            >
              <span>{day.dayOfMonth}</span>
              {showEventDots && hasEvents && (
                <span
                  style={{
                    position: 'absolute',
                    bottom: '2px',
                    width: '4px',
                    height: '4px',
                    borderRadius: '50%',
                    background: isSelected ? '#fff' : '#3788d8',
                  }}
                  aria-hidden="true"
                />
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default MiniCalendar
