/**
 * @fileoverview Entry point for @payload-calendar/react package
 *
 * React components for payload-calendar-plugin - FullCalendar integration,
 * hooks, and widgets for building calendar interfaces.
 *
 * @packageDocumentation
 */

// Components
export { PayloadCalendar } from './components/PayloadCalendar'
export { MiniCalendar } from './components/MiniCalendar'
export { UpcomingEvents } from './components/UpcomingEvents'
export { EventCard } from './components/EventCard'
export { SourceFilter } from './components/SourceFilter'

// Hooks
export { useCalendarEvents } from './hooks/useCalendarEvents'
export { useCalendarSources } from './hooks/useCalendarSources'

// Types
export type {
  // Core types
  CalendarView,
  CalendarSource,
  CalendarEvent,
  CalendarEventParams,
  CalendarEventsResponse,
  CalendarSourcesResponse,
  // Component props
  PayloadCalendarProps,
  MiniCalendarProps,
  UpcomingEventsProps,
  EventCardProps,
  SourceFilterProps,
  // Hook types
  UseCalendarEventsReturn,
  UseCalendarEventsOptions,
  UseCalendarSourcesReturn,
  UseCalendarSourcesOptions,
} from './types'
