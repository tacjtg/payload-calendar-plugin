import ICAL from 'ical.js'
import type { CalendarEvent, CalendarSource, ICalFeedConfig, UnifiedCalendarEvent } from '../types'

/**
 * Generate an iCal feed from calendar events
 */
export function generateICalFeed(
  events: CalendarEvent[],
  config: ICalFeedConfig,
): string {
  const calendar = new ICAL.Component(['vcalendar', [], []])

  // Set calendar properties
  calendar.updatePropertyWithValue('version', '2.0')
  calendar.updatePropertyWithValue('prodid', '-//Payload Calendar Plugin//EN')
  calendar.updatePropertyWithValue('calscale', 'GREGORIAN')
  calendar.updatePropertyWithValue('method', 'PUBLISH')
  calendar.updatePropertyWithValue('x-wr-calname', config.name)

  if (config.description) {
    calendar.updatePropertyWithValue('x-wr-caldesc', config.description)
  }

  if (config.timezone) {
    calendar.updatePropertyWithValue('x-wr-timezone', config.timezone)
  }

  if (config.ttl) {
    calendar.updatePropertyWithValue('x-published-ttl', `PT${config.ttl}M`)
  }

  // Add events
  for (const event of events) {
    const vevent = new ICAL.Component('vevent')

    // Required properties
    vevent.updatePropertyWithValue('uid', `${event.id}@payload-calendar`)
    vevent.updatePropertyWithValue('dtstamp', ICAL.Time.now())

    // Start date
    const startDate = ICAL.Time.fromJSDate(new Date(event.startDate), false)
    if (event.allDay) {
      startDate.isDate = true
    }
    vevent.updatePropertyWithValue('dtstart', startDate)

    // End date
    if (event.endDate) {
      const endDate = ICAL.Time.fromJSDate(new Date(event.endDate), false)
      if (event.allDay) {
        endDate.isDate = true
      }
      vevent.updatePropertyWithValue('dtend', endDate)
    }

    // Summary (title)
    vevent.updatePropertyWithValue('summary', event.title)

    // Description
    if (event.description) {
      const desc = typeof event.description === 'string'
        ? event.description
        : extractTextFromRichText(event.description)
      vevent.updatePropertyWithValue('description', desc)
    }

    // Location
    if (event.location) {
      vevent.updatePropertyWithValue('location', event.location)
    }

    // URL
    if (event.url) {
      vevent.updatePropertyWithValue('url', event.url)
    }

    // Status
    const statusMap: Record<string, string> = {
      draft: 'TENTATIVE',
      published: 'CONFIRMED',
      cancelled: 'CANCELLED',
    }
    vevent.updatePropertyWithValue('status', statusMap[event.status] ?? 'CONFIRMED')

    // Recurrence rule
    if (event.isRecurring && event.recurrence?.rrule) {
      // Extract just the RRULE part (remove DTSTART if present)
      const rrulePart = event.recurrence.rrule.replace(/^DTSTART[^:]*:[^\n]*\n?/i, '')
      if (rrulePart.startsWith('RRULE:')) {
        vevent.addPropertyWithValue('rrule', ICAL.Recur.fromString(rrulePart.replace('RRULE:', '')))
      }
    }

    // Exclusion dates
    if (event.recurrence?.excludeDates && event.recurrence.excludeDates.length > 0) {
      for (const excludeDate of event.recurrence.excludeDates) {
        const exdate = ICAL.Time.fromJSDate(new Date(excludeDate), false)
        vevent.addPropertyWithValue('exdate', exdate)
      }
    }

    // Categories (from source)
    if (event.source && typeof event.source === 'object') {
      vevent.updatePropertyWithValue('categories', event.source.name)
    }

    // Timestamps
    vevent.updatePropertyWithValue('created', ICAL.Time.fromJSDate(new Date(event.createdAt), false))
    vevent.updatePropertyWithValue('last-modified', ICAL.Time.fromJSDate(new Date(event.updatedAt), false))

    calendar.addSubcomponent(vevent)
  }

  return calendar.toString()
}

/**
 * Parse an iCal feed and extract events
 */
export function parseICalFeed(icalString: string): Partial<CalendarEvent>[] {
  const events: Partial<CalendarEvent>[] = []

  try {
    const jcalData = ICAL.parse(icalString)
    const calendar = new ICAL.Component(jcalData)
    const vevents = calendar.getAllSubcomponents('vevent')

    for (const vevent of vevents) {
      const event = new ICAL.Event(vevent)

      const calendarEvent: Partial<CalendarEvent> = {
        title: event.summary ?? 'Untitled Event',
        description: event.description,
        location: event.location,
        startDate: event.startDate?.toJSDate()?.toISOString(),
        endDate: event.endDate?.toJSDate()?.toISOString(),
        allDay: event.startDate?.isDate ?? false,
        status: mapICalStatus(vevent.getFirstPropertyValue('status') as string | undefined),
        url: vevent.getFirstPropertyValue('url') as string | undefined,
        isRecurring: !!event.isRecurring(),
      }

      // Handle recurrence
      if (event.isRecurring()) {
        const rrule = vevent.getFirstPropertyValue('rrule') as ICAL.Recur | null
        if (rrule) {
          calendarEvent.recurrence = {
            rrule: `RRULE:${rrule.toString()}`,
            frequency: mapRRuleFrequency(rrule.freq as string | undefined),
            interval: (rrule.interval as number | undefined) ?? 1,
          }
        }
      }

      events.push(calendarEvent)
    }
  } catch (error) {
    console.error('Error parsing iCal feed:', error)
  }

  return events
}

/**
 * Fetch and parse an iCal feed from a URL
 */
export async function fetchICalFeed(url: string): Promise<Partial<CalendarEvent>[]> {
  try {
    const response = await fetch(url, {
      headers: {
        'Accept': 'text/calendar',
      },
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch iCal feed: ${response.status} ${response.statusText}`)
    }

    const icalString = await response.text()
    return parseICalFeed(icalString)
  } catch (error) {
    console.error('Error fetching iCal feed:', error)
    throw error
  }
}

/**
 * Map iCal status to CalendarEvent status
 */
function mapICalStatus(status: string | undefined): CalendarEvent['status'] {
  switch (status?.toUpperCase()) {
    case 'TENTATIVE':
      return 'draft'
    case 'CANCELLED':
      return 'cancelled'
    case 'CONFIRMED':
    default:
      return 'published'
  }
}

/**
 * Map RRule frequency to string
 */
function mapRRuleFrequency(freq: string | undefined): 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY' {
  switch (freq?.toUpperCase()) {
    case 'DAILY':
      return 'DAILY'
    case 'WEEKLY':
      return 'WEEKLY'
    case 'MONTHLY':
      return 'MONTHLY'
    case 'YEARLY':
      return 'YEARLY'
    default:
      return 'WEEKLY'
  }
}

/**
 * Extract plain text from Payload rich text content
 */
function extractTextFromRichText(richText: unknown): string {
  if (typeof richText === 'string') {
    return richText
  }

  if (!richText || typeof richText !== 'object') {
    return ''
  }

  // Handle Lexical rich text format
  if ('root' in richText && typeof richText.root === 'object') {
    return extractTextFromLexicalNode(richText.root as LexicalNode)
  }

  // Handle Slate rich text format
  if (Array.isArray(richText)) {
    return richText.map((node) => extractTextFromSlateNode(node)).join('\n')
  }

  return ''
}

interface LexicalNode {
  children?: LexicalNode[]
  text?: string
  type?: string
}

function extractTextFromLexicalNode(node: LexicalNode): string {
  if (node.text) {
    return node.text
  }

  if (node.children && Array.isArray(node.children)) {
    return node.children.map(extractTextFromLexicalNode).join('')
  }

  return ''
}

interface SlateNode {
  children?: SlateNode[]
  text?: string
}

function extractTextFromSlateNode(node: SlateNode): string {
  if (node.text) {
    return node.text
  }

  if (node.children && Array.isArray(node.children)) {
    return node.children.map(extractTextFromSlateNode).join('')
  }

  return ''
}
