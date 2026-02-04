/**
 * @fileoverview Type definitions for @payload-calendar/react components
 */

import type { EventClickArg, DateSelectArg } from '@fullcalendar/core'

/**
 * Calendar view options supported by FullCalendar
 */
export type CalendarView =
  | 'dayGridMonth'
  | 'dayGridWeek'
  | 'dayGridDay'
  | 'timeGridWeek'
  | 'timeGridDay'
  | 'listWeek'
  | 'listMonth'
  | 'listYear'

/**
 * Represents a calendar source/category that events can belong to
 */
export interface CalendarSource {
  /** Unique identifier for the source */
  id: string
  /** Display name for the source */
  name: string
  /** Color used to display events from this source */
  color: string
  /** Optional description of the source */
  description?: string
  /** Whether the source is enabled by default */
  enabled?: boolean
  /** Icon identifier for the source */
  icon?: string
}

/**
 * Represents a calendar event
 */
export interface CalendarEvent {
  /** Unique identifier for the event */
  id: string
  /** Event title/name */
  title: string
  /** Event start date/time (ISO string or Date) */
  start: string | Date
  /** Event end date/time (ISO string or Date) */
  end?: string | Date
  /** Whether this is an all-day event */
  allDay?: boolean
  /** Source/category the event belongs to */
  source: string
  /** Event description */
  description?: string
  /** Location of the event */
  location?: string
  /** URL for more information */
  url?: string
  /** Background color for the event */
  backgroundColor?: string
  /** Border color for the event */
  borderColor?: string
  /** Text color for the event */
  textColor?: string
  /** Whether the event can be edited */
  editable?: boolean
  /** Custom extended properties */
  extendedProps?: Record<string, unknown>
}

/**
 * Parameters for fetching calendar events
 */
export interface CalendarEventParams {
  /** Start of date range (ISO string) */
  start?: string
  /** End of date range (ISO string) */
  end?: string
  /** Filter by source IDs */
  sources?: string[]
  /** Search query */
  search?: string
  /** Maximum number of events to return */
  limit?: number
}

/**
 * API response for calendar events
 */
export interface CalendarEventsResponse {
  /** Array of calendar events */
  events: CalendarEvent[]
  /** Total count of matching events */
  total: number
  /** Whether there are more events available */
  hasMore?: boolean
}

/**
 * API response for calendar sources
 */
export interface CalendarSourcesResponse {
  /** Array of calendar sources */
  sources: CalendarSource[]
}

/**
 * Props for the main PayloadCalendar component
 */
export interface PayloadCalendarProps {
  /** Base URL for the calendar API */
  apiUrl: string
  /** Array of source IDs to display (if not provided, all sources are shown) */
  sources?: string[]
  /** Initial calendar view */
  initialView?: CalendarView
  /** Initial date to display */
  initialDate?: Date | string
  /** Callback when an event is clicked */
  onEventClick?: (event: CalendarEvent, info: EventClickArg) => void
  /** Callback when a date/time range is selected */
  onDateSelect?: (start: Date, end: Date, allDay: boolean, info: DateSelectArg) => void
  /** Callback when an event is moved or resized */
  onEventChange?: (event: CalendarEvent) => void
  /** Whether events can be edited (drag/drop, resize) */
  editable?: boolean
  /** Whether date selection is enabled */
  selectable?: boolean
  /** Height of the calendar (CSS value) */
  height?: string | number
  /** CSS class name for the calendar container */
  className?: string
  /** Additional inline styles */
  style?: React.CSSProperties
  /** Custom header toolbar configuration */
  headerToolbar?: {
    left?: string
    center?: string
    right?: string
  }
  /** Whether to show weekends */
  weekends?: boolean
  /** First day of the week (0 = Sunday, 1 = Monday, etc.) */
  firstDay?: number
  /** Locale for internationalization */
  locale?: string
  /** Loading state indicator */
  loading?: boolean
  /** Custom loading component */
  loadingComponent?: React.ReactNode
  /** Custom error component */
  errorComponent?: React.ReactNode
  /** Callback for API errors */
  onError?: (error: Error) => void
}

/**
 * Props for the MiniCalendar component
 */
export interface MiniCalendarProps {
  /** Base URL for the calendar API */
  apiUrl: string
  /** Array of source IDs to display */
  sources?: string[]
  /** Currently selected date */
  selectedDate?: Date
  /** Callback when a date is selected */
  onDateSelect?: (date: Date) => void
  /** Callback when a date with events is clicked */
  onDateClick?: (date: Date, events: CalendarEvent[]) => void
  /** CSS class name for the container */
  className?: string
  /** Whether to show event dots on dates */
  showEventDots?: boolean
  /** First day of the week */
  firstDay?: number
}

/**
 * Props for the UpcomingEvents component
 */
export interface UpcomingEventsProps {
  /** Base URL for the calendar API */
  apiUrl: string
  /** Array of source IDs to display */
  sources?: string[]
  /** Maximum number of events to show */
  limit?: number
  /** Number of days to look ahead */
  daysAhead?: number
  /** Callback when an event is clicked */
  onEventClick?: (event: CalendarEvent) => void
  /** CSS class name for the container */
  className?: string
  /** Title for the widget */
  title?: string
  /** Whether to show the event time */
  showTime?: boolean
  /** Whether to show the event source/category */
  showSource?: boolean
  /** Custom empty state component */
  emptyComponent?: React.ReactNode
  /** Date format string */
  dateFormat?: Intl.DateTimeFormatOptions
}

/**
 * Props for the EventCard component
 */
export interface EventCardProps {
  /** The event to display */
  event: CalendarEvent
  /** Callback when the card is clicked */
  onClick?: (event: CalendarEvent) => void
  /** Whether to show the full description */
  showDescription?: boolean
  /** Whether to show the location */
  showLocation?: boolean
  /** Whether to show the source/category */
  showSource?: boolean
  /** CSS class name for the card */
  className?: string
  /** Whether the card is compact/condensed */
  compact?: boolean
  /** Date/time format options */
  dateFormat?: Intl.DateTimeFormatOptions
  /** Time format options */
  timeFormat?: Intl.DateTimeFormatOptions
}

/**
 * Props for the SourceFilter component
 */
export interface SourceFilterProps {
  /** Available calendar sources */
  sources: CalendarSource[]
  /** Currently selected source IDs */
  selectedSources: string[]
  /** Callback when selection changes */
  onSelectionChange: (selectedIds: string[]) => void
  /** CSS class name for the container */
  className?: string
  /** Title for the filter section */
  title?: string
  /** Whether to show a "Select All" option */
  showSelectAll?: boolean
  /** Whether to show source colors */
  showColors?: boolean
  /** Layout orientation */
  orientation?: 'vertical' | 'horizontal'
}

/**
 * Return type for useCalendarEvents hook
 */
export interface UseCalendarEventsReturn {
  /** Array of calendar events */
  events: CalendarEvent[]
  /** Whether the events are loading */
  isLoading: boolean
  /** Error if the fetch failed */
  error: Error | null
  /** Function to manually refetch events */
  refetch: () => Promise<void>
  /** Function to mutate the events cache */
  mutate: (events: CalendarEvent[]) => void
}

/**
 * Options for useCalendarEvents hook
 */
export interface UseCalendarEventsOptions {
  /** Start of date range */
  start?: Date | string
  /** End of date range */
  end?: Date | string
  /** Source IDs to filter by */
  sources?: string[]
  /** Whether to enable automatic refetching */
  enabled?: boolean
  /** Refetch interval in milliseconds */
  refetchInterval?: number
  /** Callback on successful fetch */
  onSuccess?: (events: CalendarEvent[]) => void
  /** Callback on fetch error */
  onError?: (error: Error) => void
}

/**
 * Return type for useCalendarSources hook
 */
export interface UseCalendarSourcesReturn {
  /** Array of calendar sources */
  sources: CalendarSource[]
  /** Whether the sources are loading */
  isLoading: boolean
  /** Error if the fetch failed */
  error: Error | null
  /** Function to manually refetch sources */
  refetch: () => Promise<void>
}

/**
 * Options for useCalendarSources hook
 */
export interface UseCalendarSourcesOptions {
  /** Whether to enable automatic fetching */
  enabled?: boolean
  /** Callback on successful fetch */
  onSuccess?: (sources: CalendarSource[]) => void
  /** Callback on fetch error */
  onError?: (error: Error) => void
}
