import type { CollectionConfig, Field } from 'payload'

/**
 * Configuration options for the Calendar Plugin
 */
export interface CalendarPluginConfig {
  /**
   * Collection configuration overrides
   */
  collections?: {
    events?: {
      /** Custom slug for the events collection (default: 'calendar-events') */
      slug?: string
      /** Additional fields to add to the events collection */
      fields?: Field[]
    }
    sources?: {
      /** Custom slug for the sources collection (default: 'calendar-sources') */
      slug?: string
      /** Additional fields to add to the sources collection */
      fields?: Field[]
    }
    subscriptions?: {
      /** Custom slug for the subscriptions collection (default: 'calendar-subscriptions') */
      slug?: string
      /** Additional fields to add to the subscriptions collection */
      fields?: Field[]
    }
  }

  /**
   * Feature flags to enable/disable functionality
   */
  features?: {
    /** Enable recurring events with RRule (default: true) */
    recurrence?: boolean
    /** Enable iCal feed export (default: true) */
    icalExport?: boolean
    /** Enable iCal feed import/subscriptions (default: true) */
    icalImport?: boolean
    /** Enable multi-tenant support with tenant field (default: false) */
    multiTenant?: boolean
    /** Enable event reminders (default: false) */
    reminders?: boolean
  }

  /**
   * Admin panel configuration
   */
  admin?: {
    /** Enable calendar dashboard view (default: true) */
    calendarView?: boolean
    /** Admin group name for collections (default: 'Calendar') */
    group?: string
  }

  /**
   * Field name for multi-tenant isolation (default: 'tenant')
   */
  tenantField?: string

  /**
   * Collection slug for tenant relationship (default: 'tenants')
   */
  tenantCollection?: string

  /**
   * Custom hooks for collections
   */
  hooks?: {
    events?: CollectionConfig['hooks']
    sources?: CollectionConfig['hooks']
    subscriptions?: CollectionConfig['hooks']
  }
}

/**
 * Calendar event status
 */
export type CalendarEventStatus = 'draft' | 'published' | 'cancelled'

/**
 * Recurrence frequency
 */
export type RecurrenceFrequency = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY'

/**
 * Day of week for recurrence
 */
export type DayOfWeek = 'MO' | 'TU' | 'WE' | 'TH' | 'FR' | 'SA' | 'SU'

/**
 * Recurrence configuration
 */
export interface RecurrenceConfig {
  frequency: RecurrenceFrequency
  interval?: number
  byDay?: DayOfWeek[]
  byMonthDay?: number[]
  byMonth?: number[]
  until?: Date
  count?: number
}

/**
 * Calendar event document shape
 */
export interface CalendarEvent {
  id: string
  title: string
  description?: string
  location?: string
  startDate: string
  endDate?: string
  allDay: boolean
  timezone: string
  isRecurring: boolean
  recurrence?: {
    frequency: RecurrenceFrequency
    interval: number
    byDay?: DayOfWeek[]
    until?: string
    count?: number
    rrule: string
    excludeDates?: string[]
  }
  recurringParent?: string | CalendarEvent
  source: string | CalendarSource
  color?: string
  status: CalendarEventStatus
  url?: string
  image?: string | Media
  reminders?: Reminder[]
  createdAt: string
  updatedAt: string
}

/**
 * Calendar source (category) document shape
 */
export interface CalendarSource {
  id: string
  name: string
  slug: string
  color: string
  icon?: string
  isDefault: boolean
  isPublic: boolean
  sortOrder: number
  createdAt: string
  updatedAt: string
}

/**
 * Calendar subscription (iCal import) document shape
 */
export interface CalendarSubscription {
  id: string
  name: string
  url: string
  source: string | CalendarSource
  syncInterval: 'HOURLY' | 'DAILY' | 'WEEKLY'
  lastSynced?: string
  syncStatus: 'OK' | 'ERROR' | 'PENDING'
  syncError?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

/**
 * Reminder configuration
 */
export interface Reminder {
  type: 'EMAIL' | 'PUSH' | 'SMS'
  timing: number // minutes before event
  sent: boolean
}

/**
 * Media document (from Payload)
 */
export interface Media {
  id: string
  url: string
  filename: string
  mimeType: string
  filesize: number
  width?: number
  height?: number
}

/**
 * Unified calendar event for API responses
 */
export interface UnifiedCalendarEvent {
  id: string
  title: string
  start: string
  end?: string
  allDay: boolean
  color: string
  source: {
    id: string
    name: string
    slug: string
  }
  url?: string
  extendedProps: {
    description?: string
    location?: string
    status: CalendarEventStatus
    isRecurring: boolean
    isRecurrenceInstance?: boolean
    recurringParentId?: string
  }
}

/**
 * Calendar API query parameters
 */
export interface CalendarQueryParams {
  startDate: string
  endDate: string
  sources?: string[]
  status?: CalendarEventStatus[]
  expand?: boolean // expand recurring events
  tenant?: string
}

/**
 * iCal feed configuration
 */
export interface ICalFeedConfig {
  name: string
  description?: string
  timezone?: string
  ttl?: number // refresh interval in minutes
}

/**
 * Collection builder options
 */
export interface CollectionBuilderOptions {
  slug: string
  features?: CalendarPluginConfig['features']
  multiTenant?: {
    tenantField: string
    tenantCollection?: string
  }
  additionalFields?: Field[]
  hooks?: CollectionConfig['hooks']
}

/**
 * Events collection builder options
 */
export interface EventsCollectionOptions extends CollectionBuilderOptions {
  sourcesSlug: string
}

/**
 * Sources collection builder options
 */
export interface SourcesCollectionOptions extends CollectionBuilderOptions {}

/**
 * Subscriptions collection builder options
 */
export interface SubscriptionsCollectionOptions extends CollectionBuilderOptions {
  sourcesSlug: string
}
