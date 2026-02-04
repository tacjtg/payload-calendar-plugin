import { RRule, RRuleSet, Weekday } from 'rrule'
import type { CalendarEvent, RecurrenceConfig, UnifiedCalendarEvent } from '../types'

/**
 * Generate an RRule string from a recurrence configuration
 */
export function generateRRule(config: RecurrenceConfig, startDate: Date): string {
  const frequencyMap: Record<string, number> = {
    DAILY: RRule.DAILY,
    WEEKLY: RRule.WEEKLY,
    MONTHLY: RRule.MONTHLY,
    YEARLY: RRule.YEARLY,
  }

  const dayMap: Record<string, Weekday> = {
    MO: RRule.MO,
    TU: RRule.TU,
    WE: RRule.WE,
    TH: RRule.TH,
    FR: RRule.FR,
    SA: RRule.SA,
    SU: RRule.SU,
  }

  const options: Partial<ConstructorParameters<typeof RRule>[0]> = {
    freq: frequencyMap[config.frequency] ?? RRule.WEEKLY,
    interval: config.interval ?? 1,
    dtstart: startDate,
  }

  if (config.byDay && config.byDay.length > 0) {
    const weekdays = config.byDay
      .map((day) => dayMap[day])
      .filter((d): d is Weekday => d !== undefined)
    if (weekdays.length > 0) {
      options.byweekday = weekdays
    }
  }

  if (config.byMonthDay && config.byMonthDay.length > 0) {
    options.bymonthday = config.byMonthDay
  }

  if (config.byMonth && config.byMonth.length > 0) {
    options.bymonth = config.byMonth
  }

  if (config.until) {
    options.until = config.until
  }

  if (config.count && !config.until) {
    options.count = config.count
  }

  const rule = new RRule(options as ConstructorParameters<typeof RRule>[0])
  return rule.toString()
}

/**
 * Parse an RRule string into a configuration object
 */
export function parseRRule(rruleString: string): RecurrenceConfig | null {
  try {
    const rule = RRule.fromString(rruleString)
    const options = rule.options

    const frequencyMap: Record<number, RecurrenceConfig['frequency']> = {
      [RRule.DAILY]: 'DAILY',
      [RRule.WEEKLY]: 'WEEKLY',
      [RRule.MONTHLY]: 'MONTHLY',
      [RRule.YEARLY]: 'YEARLY',
    }

    const dayMap: Record<number, string> = {
      0: 'MO',
      1: 'TU',
      2: 'WE',
      3: 'TH',
      4: 'FR',
      5: 'SA',
      6: 'SU',
    }

    return {
      frequency: frequencyMap[options.freq] ?? 'WEEKLY',
      interval: options.interval ?? 1,
      byDay: options.byweekday?.map((d) => {
        const weekdayNum = typeof d === 'number' ? d : (d as Weekday).weekday
        return dayMap[weekdayNum] as RecurrenceConfig['byDay'] extends (infer T)[] ? T : never
      }),
      byMonthDay: options.bymonthday as number[] | undefined,
      byMonth: options.bymonth as number[] | undefined,
      until: options.until ?? undefined,
      count: options.count ?? undefined,
    }
  } catch {
    return null
  }
}

/**
 * Expand a recurring event into individual occurrences within a date range
 */
export function expandRecurringEvent(
  event: CalendarEvent,
  rangeStart: Date,
  rangeEnd: Date,
): UnifiedCalendarEvent[] {
  if (!event.isRecurring || !event.recurrence?.rrule) {
    return [eventToUnified(event)]
  }

  try {
    // Create RRuleSet to handle exclusions
    const ruleSet = new RRuleSet()

    // Parse the main rule
    const rule = RRule.fromString(event.recurrence.rrule)
    ruleSet.rrule(rule)

    // Add exclusion dates if any
    if (event.recurrence.excludeDates) {
      for (const excludeDate of event.recurrence.excludeDates) {
        ruleSet.exdate(new Date(excludeDate))
      }
    }

    // Get occurrences within the range
    const occurrences = ruleSet.between(rangeStart, rangeEnd, true)

    // Calculate event duration
    const duration = event.endDate
      ? new Date(event.endDate).getTime() - new Date(event.startDate).getTime()
      : 0

    // Create an event instance for each occurrence
    return occurrences.map((occurrenceDate, index) => {
      const endDate = duration > 0
        ? new Date(occurrenceDate.getTime() + duration)
        : undefined

      return {
        id: `${event.id}_${index}`,
        title: event.title,
        start: occurrenceDate.toISOString(),
        end: endDate?.toISOString(),
        allDay: event.allDay,
        color: event.color ?? (typeof event.source === 'object' ? event.source.color : '#3788d8'),
        source: typeof event.source === 'object'
          ? { id: event.source.id, name: event.source.name, slug: event.source.slug }
          : { id: event.source, name: '', slug: '' },
        url: event.url,
        extendedProps: {
          description: typeof event.description === 'string' ? event.description : undefined,
          location: event.location,
          status: event.status,
          isRecurring: true,
          isRecurrenceInstance: true,
          recurringParentId: event.id,
        },
      }
    })
  } catch (error) {
    console.error('Error expanding recurring event:', error)
    return [eventToUnified(event)]
  }
}

/**
 * Convert a CalendarEvent to UnifiedCalendarEvent format
 */
export function eventToUnified(event: CalendarEvent): UnifiedCalendarEvent {
  return {
    id: event.id,
    title: event.title,
    start: event.startDate,
    end: event.endDate,
    allDay: event.allDay,
    color: event.color ?? (typeof event.source === 'object' ? event.source.color : '#3788d8'),
    source: typeof event.source === 'object'
      ? { id: event.source.id, name: event.source.name, slug: event.source.slug }
      : { id: event.source, name: '', slug: '' },
    url: event.url,
    extendedProps: {
      description: typeof event.description === 'string' ? event.description : undefined,
      location: event.location,
      status: event.status,
      isRecurring: event.isRecurring,
    },
  }
}

/**
 * Get the next occurrence of a recurring event after a given date
 */
export function getNextOccurrence(rruleString: string, afterDate: Date = new Date()): Date | null {
  try {
    const rule = RRule.fromString(rruleString)
    const next = rule.after(afterDate, true)
    return next
  } catch {
    return null
  }
}

/**
 * Get human-readable description of recurrence
 */
export function getRecurrenceDescription(rruleString: string): string {
  try {
    const rule = RRule.fromString(rruleString)
    return rule.toText()
  } catch {
    return 'Invalid recurrence rule'
  }
}
