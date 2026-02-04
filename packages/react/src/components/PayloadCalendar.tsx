/**
 * @fileoverview Main calendar component wrapping FullCalendar
 */

import { useCallback, useMemo, useRef, useEffect } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import listPlugin from '@fullcalendar/list'
import interactionPlugin from '@fullcalendar/interaction'
import type { EventClickArg, DateSelectArg, EventChangeArg, EventInput } from '@fullcalendar/core'
import { useCalendarEvents } from '../hooks/useCalendarEvents'
import type { PayloadCalendarProps, CalendarEvent } from '../types'

/**
 * Converts a CalendarEvent to FullCalendar's EventInput format
 */
function toFullCalendarEvent(event: CalendarEvent): EventInput {
  return {
    id: event.id,
    title: event.title,
    start: event.start,
    end: event.end,
    allDay: event.allDay,
    backgroundColor: event.backgroundColor,
    borderColor: event.borderColor,
    textColor: event.textColor,
    editable: event.editable,
    url: event.url,
    extendedProps: {
      ...event.extendedProps,
      source: event.source,
      description: event.description,
      location: event.location,
      originalEvent: event,
    },
  }
}

/**
 * Extracts the original CalendarEvent from a FullCalendar event
 */
function fromFullCalendarEvent(fcEvent: EventClickArg['event']): CalendarEvent {
  const extendedProps = fcEvent.extendedProps || {}

  // If we stored the original event, return it
  if (extendedProps.originalEvent) {
    return extendedProps.originalEvent as CalendarEvent
  }

  // Otherwise reconstruct from FullCalendar event
  return {
    id: fcEvent.id,
    title: fcEvent.title,
    start: fcEvent.start?.toISOString() || '',
    end: fcEvent.end?.toISOString(),
    allDay: fcEvent.allDay,
    source: extendedProps.source || '',
    description: extendedProps.description,
    location: extendedProps.location,
    backgroundColor: fcEvent.backgroundColor,
    borderColor: fcEvent.borderColor,
    textColor: fcEvent.textColor,
    url: fcEvent.url || undefined,
    extendedProps: extendedProps,
  }
}

/**
 * Default loading component
 */
function DefaultLoadingComponent() {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        minHeight: '400px',
      }}
    >
      <div
        style={{
          width: '40px',
          height: '40px',
          border: '3px solid #f3f3f3',
          borderTop: '3px solid #3788d8',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
        }}
      />
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}

/**
 * Default error component
 */
function DefaultErrorComponent({ error }: { error: Error }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        minHeight: '400px',
        color: '#dc2626',
        flexDirection: 'column',
        gap: '8px',
      }}
    >
      <svg
        width="48"
        height="48"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
      <p style={{ margin: 0 }}>Failed to load calendar</p>
      <p style={{ margin: 0, fontSize: '0.875rem', opacity: 0.7 }}>{error.message}</p>
    </div>
  )
}

/**
 * Main calendar component that wraps FullCalendar with payload-calendar integration
 *
 * @param props - Component props
 * @returns The calendar component
 *
 * @example
 * ```tsx
 * <PayloadCalendar
 *   apiUrl="/api/calendar"
 *   initialView="dayGridMonth"
 *   sources={['events', 'holidays']}
 *   onEventClick={(event) => console.log('Clicked:', event)}
 *   onDateSelect={(start, end, allDay) => console.log('Selected:', start, end, allDay)}
 *   editable
 *   selectable
 * />
 * ```
 */
export function PayloadCalendar({
  apiUrl,
  sources,
  initialView = 'dayGridMonth',
  initialDate,
  onEventClick,
  onDateSelect,
  onEventChange,
  editable = false,
  selectable = false,
  height = 'auto',
  className,
  style,
  headerToolbar = {
    left: 'prev,next today',
    center: 'title',
    right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek',
  },
  weekends = true,
  firstDay = 0,
  locale,
  loading: externalLoading,
  loadingComponent,
  errorComponent,
  onError,
}: PayloadCalendarProps) {
  const calendarRef = useRef<FullCalendar>(null)

  // Track the current date range for fetching events
  const dateRangeRef = useRef<{ start?: Date; end?: Date }>({})

  // Fetch events using the hook
  const {
    events,
    isLoading,
    error,
    refetch,
  } = useCalendarEvents(apiUrl, {
    start: dateRangeRef.current.start,
    end: dateRangeRef.current.end,
    sources,
    onError,
  })

  // Convert events to FullCalendar format
  const fullCalendarEvents = useMemo(() => {
    return events.map(toFullCalendarEvent)
  }, [events])

  // Handle event click
  const handleEventClick = useCallback(
    (info: EventClickArg) => {
      if (onEventClick) {
        const event = fromFullCalendarEvent(info.event)
        onEventClick(event, info)
      }
    },
    [onEventClick]
  )

  // Handle date selection
  const handleDateSelect = useCallback(
    (info: DateSelectArg) => {
      if (onDateSelect) {
        onDateSelect(info.start, info.end, info.allDay, info)
      }
    },
    [onDateSelect]
  )

  // Handle event drag/drop or resize
  const handleEventChange = useCallback(
    (info: EventChangeArg) => {
      if (onEventChange) {
        const event = fromFullCalendarEvent(info.event)

        // Update the event with new dates
        const updatedEvent: CalendarEvent = {
          ...event,
          start: info.event.start?.toISOString() || event.start,
          end: info.event.end?.toISOString() || event.end,
          allDay: info.event.allDay,
        }

        onEventChange(updatedEvent)
      }
    },
    [onEventChange]
  )

  // Handle date range changes (for fetching events)
  const handleDatesSet = useCallback(
    (info: { start: Date; end: Date }) => {
      dateRangeRef.current = { start: info.start, end: info.end }
      refetch()
    },
    [refetch]
  )

  // Refetch when sources change
  useEffect(() => {
    refetch()
  }, [sources, refetch])

  // Determine loading state
  const showLoading = externalLoading ?? isLoading

  // Show loading state
  if (showLoading && events.length === 0) {
    return (
      <div className={className} style={style}>
        {loadingComponent ?? <DefaultLoadingComponent />}
      </div>
    )
  }

  // Show error state
  if (error && events.length === 0) {
    return (
      <div className={className} style={style}>
        {errorComponent ?? <DefaultErrorComponent error={error} />}
      </div>
    )
  }

  return (
    <div className={className} style={style}>
      <FullCalendar
        ref={calendarRef}
        plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
        initialView={initialView}
        initialDate={initialDate}
        headerToolbar={headerToolbar}
        events={fullCalendarEvents}
        eventClick={handleEventClick}
        select={handleDateSelect}
        eventChange={handleEventChange}
        datesSet={handleDatesSet}
        editable={editable}
        selectable={selectable}
        selectMirror={selectable}
        dayMaxEvents={true}
        weekends={weekends}
        firstDay={firstDay}
        locale={locale}
        height={height}
        nowIndicator={true}
        eventTimeFormat={{
          hour: 'numeric',
          minute: '2-digit',
          meridiem: 'short',
        }}
        slotLabelFormat={{
          hour: 'numeric',
          minute: '2-digit',
          meridiem: 'short',
        }}
      />
    </div>
  )
}

export default PayloadCalendar
