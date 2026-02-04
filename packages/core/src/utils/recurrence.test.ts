import { describe, it, expect, beforeEach } from 'vitest'
import {
  generateRRule,
  parseRRule,
  expandRecurringEvent,
  getNextOccurrence,
  getRecurrenceDescription,
  eventToUnified,
} from './recurrence'
import type { RecurrenceConfig, CalendarEvent, CalendarSource } from '../types'

describe('recurrence utilities', () => {
  // Use fixed dates for deterministic tests
  const fixedStartDate = new Date('2024-01-15T10:00:00Z')

  describe('generateRRule', () => {
    describe('frequency settings', () => {
      it('should generate a daily recurrence rule', () => {
        const config: RecurrenceConfig = {
          frequency: 'DAILY',
        }

        const rrule = generateRRule(config, fixedStartDate)

        expect(rrule).toContain('FREQ=DAILY')
        expect(rrule).toContain('INTERVAL=1')
      })

      it('should generate a weekly recurrence rule', () => {
        const config: RecurrenceConfig = {
          frequency: 'WEEKLY',
        }

        const rrule = generateRRule(config, fixedStartDate)

        expect(rrule).toContain('FREQ=WEEKLY')
      })

      it('should generate a monthly recurrence rule', () => {
        const config: RecurrenceConfig = {
          frequency: 'MONTHLY',
        }

        const rrule = generateRRule(config, fixedStartDate)

        expect(rrule).toContain('FREQ=MONTHLY')
      })

      it('should generate a yearly recurrence rule', () => {
        const config: RecurrenceConfig = {
          frequency: 'YEARLY',
        }

        const rrule = generateRRule(config, fixedStartDate)

        expect(rrule).toContain('FREQ=YEARLY')
      })

      it('should default to weekly when frequency is not recognized', () => {
        const config = {
          frequency: 'INVALID' as RecurrenceConfig['frequency'],
        }

        const rrule = generateRRule(config, fixedStartDate)

        expect(rrule).toContain('FREQ=WEEKLY')
      })
    })

    describe('interval settings', () => {
      it('should use custom interval', () => {
        const config: RecurrenceConfig = {
          frequency: 'DAILY',
          interval: 3,
        }

        const rrule = generateRRule(config, fixedStartDate)

        expect(rrule).toContain('INTERVAL=3')
      })

      it('should default to interval of 1', () => {
        const config: RecurrenceConfig = {
          frequency: 'WEEKLY',
        }

        const rrule = generateRRule(config, fixedStartDate)

        expect(rrule).toContain('INTERVAL=1')
      })

      it('should handle bi-weekly recurrence', () => {
        const config: RecurrenceConfig = {
          frequency: 'WEEKLY',
          interval: 2,
        }

        const rrule = generateRRule(config, fixedStartDate)

        expect(rrule).toContain('FREQ=WEEKLY')
        expect(rrule).toContain('INTERVAL=2')
      })
    })

    describe('byDay options', () => {
      it('should include single day constraint', () => {
        const config: RecurrenceConfig = {
          frequency: 'WEEKLY',
          byDay: ['MO'],
        }

        const rrule = generateRRule(config, fixedStartDate)

        expect(rrule).toContain('BYDAY=MO')
      })

      it('should include multiple days', () => {
        const config: RecurrenceConfig = {
          frequency: 'WEEKLY',
          byDay: ['MO', 'WE', 'FR'],
        }

        const rrule = generateRRule(config, fixedStartDate)

        // The order might vary, so check for each day
        expect(rrule).toContain('BYDAY=')
        expect(rrule).toMatch(/MO/)
        expect(rrule).toMatch(/WE/)
        expect(rrule).toMatch(/FR/)
      })

      it('should handle weekend days', () => {
        const config: RecurrenceConfig = {
          frequency: 'WEEKLY',
          byDay: ['SA', 'SU'],
        }

        const rrule = generateRRule(config, fixedStartDate)

        expect(rrule).toMatch(/SA/)
        expect(rrule).toMatch(/SU/)
      })

      it('should ignore empty byDay array', () => {
        const config: RecurrenceConfig = {
          frequency: 'WEEKLY',
          byDay: [],
        }

        const rrule = generateRRule(config, fixedStartDate)

        expect(rrule).not.toContain('BYDAY')
      })

      it('should filter out invalid day values', () => {
        const config: RecurrenceConfig = {
          frequency: 'WEEKLY',
          byDay: ['MO', 'INVALID' as any, 'FR'],
        }

        const rrule = generateRRule(config, fixedStartDate)

        expect(rrule).toContain('BYDAY=')
        expect(rrule).toMatch(/MO/)
        expect(rrule).toMatch(/FR/)
        expect(rrule).not.toContain('INVALID')
      })
    })

    describe('byMonthDay options', () => {
      it('should include single day of month', () => {
        const config: RecurrenceConfig = {
          frequency: 'MONTHLY',
          byMonthDay: [15],
        }

        const rrule = generateRRule(config, fixedStartDate)

        expect(rrule).toContain('BYMONTHDAY=15')
      })

      it('should include multiple days of month', () => {
        const config: RecurrenceConfig = {
          frequency: 'MONTHLY',
          byMonthDay: [1, 15],
        }

        const rrule = generateRRule(config, fixedStartDate)

        expect(rrule).toContain('BYMONTHDAY=')
        expect(rrule).toMatch(/1/)
        expect(rrule).toMatch(/15/)
      })

      it('should handle last day of month with -1', () => {
        const config: RecurrenceConfig = {
          frequency: 'MONTHLY',
          byMonthDay: [-1],
        }

        const rrule = generateRRule(config, fixedStartDate)

        expect(rrule).toContain('BYMONTHDAY=-1')
      })

      it('should ignore empty byMonthDay array', () => {
        const config: RecurrenceConfig = {
          frequency: 'MONTHLY',
          byMonthDay: [],
        }

        const rrule = generateRRule(config, fixedStartDate)

        expect(rrule).not.toContain('BYMONTHDAY')
      })
    })

    describe('byMonth options', () => {
      it('should include single month', () => {
        const config: RecurrenceConfig = {
          frequency: 'YEARLY',
          byMonth: [3],
        }

        const rrule = generateRRule(config, fixedStartDate)

        expect(rrule).toContain('BYMONTH=3')
      })

      it('should include multiple months', () => {
        const config: RecurrenceConfig = {
          frequency: 'YEARLY',
          byMonth: [1, 6, 12],
        }

        const rrule = generateRRule(config, fixedStartDate)

        expect(rrule).toContain('BYMONTH=')
      })

      it('should ignore empty byMonth array', () => {
        const config: RecurrenceConfig = {
          frequency: 'YEARLY',
          byMonth: [],
        }

        const rrule = generateRRule(config, fixedStartDate)

        expect(rrule).not.toContain('BYMONTH')
      })
    })

    describe('until limit', () => {
      it('should include until date', () => {
        const until = new Date('2024-12-31T23:59:59Z')
        const config: RecurrenceConfig = {
          frequency: 'DAILY',
          until,
        }

        const rrule = generateRRule(config, fixedStartDate)

        expect(rrule).toContain('UNTIL=')
      })

      it('should prioritize until over count when both provided', () => {
        const until = new Date('2024-06-30T23:59:59Z')
        const config: RecurrenceConfig = {
          frequency: 'WEEKLY',
          until,
          count: 10,
        }

        const rrule = generateRRule(config, fixedStartDate)

        expect(rrule).toContain('UNTIL=')
        expect(rrule).not.toContain('COUNT=')
      })
    })

    describe('count limit', () => {
      it('should include count limit', () => {
        const config: RecurrenceConfig = {
          frequency: 'WEEKLY',
          count: 10,
        }

        const rrule = generateRRule(config, fixedStartDate)

        expect(rrule).toContain('COUNT=10')
      })

      it('should not include count when until is present', () => {
        const config: RecurrenceConfig = {
          frequency: 'WEEKLY',
          count: 10,
          until: new Date('2024-12-31'),
        }

        const rrule = generateRRule(config, fixedStartDate)

        expect(rrule).not.toContain('COUNT=')
      })
    })

    describe('complex configurations', () => {
      it('should generate rule for MWF meetings', () => {
        const config: RecurrenceConfig = {
          frequency: 'WEEKLY',
          byDay: ['MO', 'WE', 'FR'],
          interval: 1,
        }

        const rrule = generateRRule(config, fixedStartDate)

        expect(rrule).toContain('FREQ=WEEKLY')
        expect(rrule).toMatch(/MO/)
        expect(rrule).toMatch(/WE/)
        expect(rrule).toMatch(/FR/)
      })

      it('should generate rule for quarterly meeting on 15th', () => {
        const config: RecurrenceConfig = {
          frequency: 'MONTHLY',
          interval: 3,
          byMonthDay: [15],
        }

        const rrule = generateRRule(config, fixedStartDate)

        expect(rrule).toContain('FREQ=MONTHLY')
        expect(rrule).toContain('INTERVAL=3')
        expect(rrule).toContain('BYMONTHDAY=15')
      })

      it('should generate rule for annual event in specific months', () => {
        const config: RecurrenceConfig = {
          frequency: 'YEARLY',
          byMonth: [4, 10],
          byMonthDay: [1],
        }

        const rrule = generateRRule(config, fixedStartDate)

        expect(rrule).toContain('FREQ=YEARLY')
        expect(rrule).toContain('BYMONTH=')
        expect(rrule).toContain('BYMONTHDAY=1')
      })
    })
  })

  describe('parseRRule', () => {
    it('should parse a daily rule', () => {
      const rrule = 'DTSTART:20240115T100000Z\nRRULE:FREQ=DAILY;INTERVAL=1'

      const config = parseRRule(rrule)

      expect(config).not.toBeNull()
      expect(config?.frequency).toBe('DAILY')
      expect(config?.interval).toBe(1)
    })

    it('should parse a weekly rule', () => {
      const rrule = 'DTSTART:20240115T100000Z\nRRULE:FREQ=WEEKLY;INTERVAL=2'

      const config = parseRRule(rrule)

      expect(config).not.toBeNull()
      expect(config?.frequency).toBe('WEEKLY')
      expect(config?.interval).toBe(2)
    })

    it('should parse a monthly rule', () => {
      const rrule = 'DTSTART:20240115T100000Z\nRRULE:FREQ=MONTHLY;INTERVAL=1'

      const config = parseRRule(rrule)

      expect(config).not.toBeNull()
      expect(config?.frequency).toBe('MONTHLY')
    })

    it('should parse a yearly rule', () => {
      const rrule = 'DTSTART:20240115T100000Z\nRRULE:FREQ=YEARLY;INTERVAL=1'

      const config = parseRRule(rrule)

      expect(config).not.toBeNull()
      expect(config?.frequency).toBe('YEARLY')
    })

    it('should parse byDay from rule', () => {
      const rrule = 'DTSTART:20240115T100000Z\nRRULE:FREQ=WEEKLY;BYDAY=MO,WE,FR'

      const config = parseRRule(rrule)

      expect(config).not.toBeNull()
      expect(config?.byDay).toBeDefined()
      expect(config?.byDay).toContain('MO')
      expect(config?.byDay).toContain('WE')
      expect(config?.byDay).toContain('FR')
    })

    it('should parse byMonthDay from rule', () => {
      const rrule = 'DTSTART:20240115T100000Z\nRRULE:FREQ=MONTHLY;BYMONTHDAY=1,15'

      const config = parseRRule(rrule)

      expect(config).not.toBeNull()
      expect(config?.byMonthDay).toBeDefined()
      expect(config?.byMonthDay).toContain(1)
      expect(config?.byMonthDay).toContain(15)
    })

    it('should parse byMonth from rule', () => {
      const rrule = 'DTSTART:20240115T100000Z\nRRULE:FREQ=YEARLY;BYMONTH=1,6,12'

      const config = parseRRule(rrule)

      expect(config).not.toBeNull()
      expect(config?.byMonth).toBeDefined()
      expect(config?.byMonth).toContain(1)
      expect(config?.byMonth).toContain(6)
      expect(config?.byMonth).toContain(12)
    })

    it('should parse until date', () => {
      const rrule = 'DTSTART:20240115T100000Z\nRRULE:FREQ=DAILY;UNTIL=20241231T235959Z'

      const config = parseRRule(rrule)

      expect(config).not.toBeNull()
      expect(config?.until).toBeDefined()
      expect(config?.until).toBeInstanceOf(Date)
    })

    it('should parse count', () => {
      const rrule = 'DTSTART:20240115T100000Z\nRRULE:FREQ=WEEKLY;COUNT=10'

      const config = parseRRule(rrule)

      expect(config).not.toBeNull()
      expect(config?.count).toBe(10)
    })

    it('should return null for invalid rule', () => {
      const config = parseRRule('INVALID_RULE')

      expect(config).toBeNull()
    })

    it('should handle empty string (rrule library parses as yearly)', () => {
      // Note: The rrule library parses empty string as a valid yearly rule
      // This is library behavior, not an error case
      const config = parseRRule('')

      // rrule library returns a yearly rule for empty string
      expect(config).not.toBeNull()
      expect(config?.frequency).toBe('YEARLY')
    })

    it('should round-trip with generateRRule', () => {
      const originalConfig: RecurrenceConfig = {
        frequency: 'WEEKLY',
        interval: 2,
        byDay: ['MO', 'FR'],
      }

      const rrule = generateRRule(originalConfig, fixedStartDate)
      const parsedConfig = parseRRule(rrule)

      expect(parsedConfig).not.toBeNull()
      expect(parsedConfig?.frequency).toBe(originalConfig.frequency)
      expect(parsedConfig?.interval).toBe(originalConfig.interval)
      expect(parsedConfig?.byDay).toContain('MO')
      expect(parsedConfig?.byDay).toContain('FR')
    })
  })

  describe('expandRecurringEvent', () => {
    const mockSource: CalendarSource = {
      id: 'source-1',
      name: 'Test Source',
      slug: 'test-source',
      color: '#FF5733',
      isDefault: true,
      isPublic: true,
      sortOrder: 0,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    }

    const createMockEvent = (overrides: Partial<CalendarEvent> = {}): CalendarEvent => ({
      id: 'event-1',
      title: 'Test Event',
      description: 'Test Description',
      startDate: '2024-01-15T10:00:00Z',
      endDate: '2024-01-15T11:00:00Z',
      allDay: false,
      timezone: 'UTC',
      isRecurring: false,
      source: mockSource,
      status: 'published',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
      ...overrides,
    })

    it('should return single event for non-recurring events', () => {
      const event = createMockEvent()
      const rangeStart = new Date('2024-01-01')
      const rangeEnd = new Date('2024-01-31')

      const expanded = expandRecurringEvent(event, rangeStart, rangeEnd)

      expect(expanded).toHaveLength(1)
      expect(expanded[0]?.id).toBe('event-1')
    })

    it('should return single event when isRecurring is false', () => {
      const event = createMockEvent({ isRecurring: false })
      const rangeStart = new Date('2024-01-01')
      const rangeEnd = new Date('2024-01-31')

      const expanded = expandRecurringEvent(event, rangeStart, rangeEnd)

      expect(expanded).toHaveLength(1)
    })

    it('should expand daily recurring events within range', () => {
      const rrule = generateRRule({ frequency: 'DAILY', interval: 1 }, new Date('2024-01-15T10:00:00Z'))
      const event = createMockEvent({
        isRecurring: true,
        recurrence: {
          frequency: 'DAILY',
          interval: 1,
          rrule,
        },
      })
      const rangeStart = new Date('2024-01-15')
      const rangeEnd = new Date('2024-01-20')

      const expanded = expandRecurringEvent(event, rangeStart, rangeEnd)

      // Should have occurrences for Jan 15-19 (5 days when using inclusive between)
      expect(expanded.length).toBeGreaterThanOrEqual(5)
    })

    it('should expand weekly recurring events', () => {
      const rrule = generateRRule({ frequency: 'WEEKLY', interval: 1 }, new Date('2024-01-15T10:00:00Z'))
      const event = createMockEvent({
        isRecurring: true,
        recurrence: {
          frequency: 'WEEKLY',
          interval: 1,
          rrule,
        },
      })
      const rangeStart = new Date('2024-01-01')
      const rangeEnd = new Date('2024-02-29')

      const expanded = expandRecurringEvent(event, rangeStart, rangeEnd)

      // Should have multiple weekly occurrences
      expect(expanded.length).toBeGreaterThanOrEqual(6)
    })

    it('should respect exclusion dates', () => {
      const rrule = generateRRule({ frequency: 'DAILY', interval: 1 }, new Date('2024-01-15T10:00:00Z'))
      const event = createMockEvent({
        isRecurring: true,
        recurrence: {
          frequency: 'DAILY',
          interval: 1,
          rrule,
          excludeDates: ['2024-01-17T10:00:00Z', '2024-01-18T10:00:00Z'],
        },
      })
      const rangeStart = new Date('2024-01-15')
      const rangeEnd = new Date('2024-01-20')

      const expanded = expandRecurringEvent(event, rangeStart, rangeEnd)

      // Should have fewer occurrences due to exclusions
      const expandedWithoutExclusions = expandRecurringEvent(
        createMockEvent({
          isRecurring: true,
          recurrence: { frequency: 'DAILY', interval: 1, rrule },
        }),
        rangeStart,
        rangeEnd
      )

      expect(expanded.length).toBeLessThan(expandedWithoutExclusions.length)
    })

    it('should preserve event duration for occurrences', () => {
      const rrule = generateRRule({ frequency: 'DAILY', interval: 1 }, new Date('2024-01-15T10:00:00Z'))
      const event = createMockEvent({
        startDate: '2024-01-15T10:00:00Z',
        endDate: '2024-01-15T12:00:00Z', // 2 hour duration
        isRecurring: true,
        recurrence: {
          frequency: 'DAILY',
          interval: 1,
          rrule,
        },
      })
      const rangeStart = new Date('2024-01-15')
      const rangeEnd = new Date('2024-01-17')

      const expanded = expandRecurringEvent(event, rangeStart, rangeEnd)

      expect(expanded.length).toBeGreaterThan(0)
      expanded.forEach((occurrence) => {
        if (occurrence.end) {
          const start = new Date(occurrence.start)
          const end = new Date(occurrence.end)
          const durationMs = end.getTime() - start.getTime()
          // 2 hours = 7200000 ms
          expect(durationMs).toBe(7200000)
        }
      })
    })

    it('should mark expanded events as recurrence instances', () => {
      const rrule = generateRRule({ frequency: 'DAILY', interval: 1 }, new Date('2024-01-15T10:00:00Z'))
      const event = createMockEvent({
        isRecurring: true,
        recurrence: {
          frequency: 'DAILY',
          interval: 1,
          rrule,
        },
      })
      const rangeStart = new Date('2024-01-15')
      const rangeEnd = new Date('2024-01-17')

      const expanded = expandRecurringEvent(event, rangeStart, rangeEnd)

      expect(expanded.length).toBeGreaterThan(0)
      expanded.forEach((occurrence) => {
        expect(occurrence.extendedProps.isRecurrenceInstance).toBe(true)
        expect(occurrence.extendedProps.recurringParentId).toBe('event-1')
      })
    })

    it('should generate unique IDs for each occurrence', () => {
      const rrule = generateRRule({ frequency: 'DAILY', interval: 1 }, new Date('2024-01-15T10:00:00Z'))
      const event = createMockEvent({
        isRecurring: true,
        recurrence: {
          frequency: 'DAILY',
          interval: 1,
          rrule,
        },
      })
      const rangeStart = new Date('2024-01-15')
      const rangeEnd = new Date('2024-01-20')

      const expanded = expandRecurringEvent(event, rangeStart, rangeEnd)

      const ids = expanded.map((e) => e.id)
      const uniqueIds = new Set(ids)
      expect(uniqueIds.size).toBe(ids.length)
    })

    it('should handle events with no end date', () => {
      const rrule = generateRRule({ frequency: 'DAILY', interval: 1 }, new Date('2024-01-15T10:00:00Z'))
      const event = createMockEvent({
        startDate: '2024-01-15T10:00:00Z',
        endDate: undefined,
        isRecurring: true,
        recurrence: {
          frequency: 'DAILY',
          interval: 1,
          rrule,
        },
      })
      const rangeStart = new Date('2024-01-15')
      const rangeEnd = new Date('2024-01-17')

      const expanded = expandRecurringEvent(event, rangeStart, rangeEnd)

      expect(expanded.length).toBeGreaterThan(0)
      expanded.forEach((occurrence) => {
        expect(occurrence.end).toBeUndefined()
      })
    })

    it('should handle invalid rrule gracefully', () => {
      const event = createMockEvent({
        isRecurring: true,
        recurrence: {
          frequency: 'DAILY',
          interval: 1,
          rrule: 'INVALID_RRULE',
        },
      })
      const rangeStart = new Date('2024-01-15')
      const rangeEnd = new Date('2024-01-20')

      const expanded = expandRecurringEvent(event, rangeStart, rangeEnd)

      // Should fall back to single event
      expect(expanded).toHaveLength(1)
    })

    it('should include source information in expanded events', () => {
      const rrule = generateRRule({ frequency: 'DAILY', interval: 1 }, new Date('2024-01-15T10:00:00Z'))
      const event = createMockEvent({
        isRecurring: true,
        source: mockSource,
        recurrence: {
          frequency: 'DAILY',
          interval: 1,
          rrule,
        },
      })
      const rangeStart = new Date('2024-01-15')
      const rangeEnd = new Date('2024-01-17')

      const expanded = expandRecurringEvent(event, rangeStart, rangeEnd)

      expect(expanded.length).toBeGreaterThan(0)
      expanded.forEach((occurrence) => {
        expect(occurrence.source.id).toBe(mockSource.id)
        expect(occurrence.source.name).toBe(mockSource.name)
        expect(occurrence.source.slug).toBe(mockSource.slug)
      })
    })

    it('should use event color when source has no color', () => {
      const rrule = generateRRule({ frequency: 'DAILY', interval: 1 }, new Date('2024-01-15T10:00:00Z'))
      const event = createMockEvent({
        isRecurring: true,
        color: '#00FF00',
        recurrence: {
          frequency: 'DAILY',
          interval: 1,
          rrule,
        },
      })
      const rangeStart = new Date('2024-01-15')
      const rangeEnd = new Date('2024-01-17')

      const expanded = expandRecurringEvent(event, rangeStart, rangeEnd)

      expect(expanded.length).toBeGreaterThan(0)
      expanded.forEach((occurrence) => {
        expect(occurrence.color).toBe('#00FF00')
      })
    })
  })

  describe('eventToUnified', () => {
    const mockSource: CalendarSource = {
      id: 'source-1',
      name: 'Test Source',
      slug: 'test-source',
      color: '#FF5733',
      isDefault: true,
      isPublic: true,
      sortOrder: 0,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    }

    const createMockEvent = (overrides: Partial<CalendarEvent> = {}): CalendarEvent => ({
      id: 'event-1',
      title: 'Test Event',
      description: 'Test Description',
      startDate: '2024-01-15T10:00:00Z',
      endDate: '2024-01-15T11:00:00Z',
      allDay: false,
      timezone: 'UTC',
      isRecurring: false,
      source: mockSource,
      status: 'published',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
      ...overrides,
    })

    it('should convert event to unified format', () => {
      const event = createMockEvent()

      const unified = eventToUnified(event)

      expect(unified.id).toBe(event.id)
      expect(unified.title).toBe(event.title)
      expect(unified.start).toBe(event.startDate)
      expect(unified.end).toBe(event.endDate)
      expect(unified.allDay).toBe(event.allDay)
    })

    it('should extract source information from object', () => {
      const event = createMockEvent({ source: mockSource })

      const unified = eventToUnified(event)

      expect(unified.source.id).toBe(mockSource.id)
      expect(unified.source.name).toBe(mockSource.name)
      expect(unified.source.slug).toBe(mockSource.slug)
    })

    it('should handle string source ID', () => {
      const event = createMockEvent({ source: 'source-string-id' })

      const unified = eventToUnified(event)

      expect(unified.source.id).toBe('source-string-id')
      expect(unified.source.name).toBe('')
      expect(unified.source.slug).toBe('')
    })

    it('should include extended props', () => {
      const event = createMockEvent({
        description: 'Event description',
        location: 'Test Location',
        status: 'published',
        isRecurring: true,
      })

      const unified = eventToUnified(event)

      expect(unified.extendedProps.description).toBe('Event description')
      expect(unified.extendedProps.location).toBe('Test Location')
      expect(unified.extendedProps.status).toBe('published')
      expect(unified.extendedProps.isRecurring).toBe(true)
    })

    it('should use event color over source color', () => {
      const event = createMockEvent({
        color: '#0000FF',
        source: mockSource,
      })

      const unified = eventToUnified(event)

      expect(unified.color).toBe('#0000FF')
    })

    it('should fall back to source color when event has no color', () => {
      const event = createMockEvent({
        color: undefined,
        source: mockSource,
      })

      const unified = eventToUnified(event)

      expect(unified.color).toBe(mockSource.color)
    })

    it('should use default color when no color available', () => {
      const event = createMockEvent({
        color: undefined,
        source: 'source-id',
      })

      const unified = eventToUnified(event)

      expect(unified.color).toBe('#3788d8')
    })
  })

  describe('getNextOccurrence', () => {
    it('should return next daily occurrence', () => {
      const rrule = generateRRule(
        { frequency: 'DAILY', interval: 1 },
        new Date('2024-01-15T10:00:00Z')
      )
      const afterDate = new Date('2024-01-17T00:00:00Z')

      const next = getNextOccurrence(rrule, afterDate)

      expect(next).not.toBeNull()
      expect(next!.getTime()).toBeGreaterThanOrEqual(afterDate.getTime())
    })

    it('should return next weekly occurrence', () => {
      const rrule = generateRRule(
        { frequency: 'WEEKLY', interval: 1 },
        new Date('2024-01-15T10:00:00Z')
      )
      const afterDate = new Date('2024-01-16T00:00:00Z')

      const next = getNextOccurrence(rrule, afterDate)

      expect(next).not.toBeNull()
      expect(next!.getTime()).toBeGreaterThanOrEqual(afterDate.getTime())
    })

    it('should return next monthly occurrence', () => {
      const rrule = generateRRule(
        { frequency: 'MONTHLY', interval: 1 },
        new Date('2024-01-15T10:00:00Z')
      )
      const afterDate = new Date('2024-01-20T00:00:00Z')

      const next = getNextOccurrence(rrule, afterDate)

      expect(next).not.toBeNull()
      expect(next!.getTime()).toBeGreaterThanOrEqual(afterDate.getTime())
    })

    it('should return null for invalid rrule', () => {
      const next = getNextOccurrence('INVALID_RRULE', new Date())

      expect(next).toBeNull()
    })

    it('should use current date when no afterDate provided', () => {
      const futureDate = new Date()
      futureDate.setFullYear(futureDate.getFullYear() + 1)
      const rrule = generateRRule(
        { frequency: 'DAILY', interval: 1 },
        futureDate
      )

      const next = getNextOccurrence(rrule)

      expect(next).not.toBeNull()
    })

    it('should return null when rule has finished (count exhausted)', () => {
      const pastDate = new Date('2024-01-15T10:00:00Z')
      const rrule = generateRRule(
        { frequency: 'DAILY', interval: 1, count: 3 },
        pastDate
      )
      // After 3 daily occurrences (Jan 15, 16, 17), should return null for Jan 20
      const afterDate = new Date('2024-01-20T00:00:00Z')

      const next = getNextOccurrence(rrule, afterDate)

      expect(next).toBeNull()
    })

    it('should return null when rule has finished (until passed)', () => {
      const rrule = generateRRule(
        {
          frequency: 'DAILY',
          interval: 1,
          until: new Date('2024-01-20T23:59:59Z'),
        },
        new Date('2024-01-15T10:00:00Z')
      )
      const afterDate = new Date('2024-01-25T00:00:00Z')

      const next = getNextOccurrence(rrule, afterDate)

      expect(next).toBeNull()
    })

    it('should respect byDay constraints', () => {
      // Every Monday
      const rrule = generateRRule(
        { frequency: 'WEEKLY', interval: 1, byDay: ['MO'] },
        new Date('2024-01-15T10:00:00Z') // Jan 15, 2024 is a Monday
      )
      const afterDate = new Date('2024-01-16T00:00:00Z') // Tuesday

      const next = getNextOccurrence(rrule, afterDate)

      expect(next).not.toBeNull()
      // Next occurrence should be Monday Jan 22
      expect(next!.getDay()).toBe(1) // 1 = Monday
    })
  })

  describe('getRecurrenceDescription', () => {
    it('should describe daily recurrence', () => {
      const rrule = generateRRule(
        { frequency: 'DAILY', interval: 1 },
        fixedStartDate
      )

      const description = getRecurrenceDescription(rrule)

      expect(description.toLowerCase()).toContain('day')
    })

    it('should describe weekly recurrence', () => {
      const rrule = generateRRule(
        { frequency: 'WEEKLY', interval: 1 },
        fixedStartDate
      )

      const description = getRecurrenceDescription(rrule)

      expect(description.toLowerCase()).toContain('week')
    })

    it('should describe bi-weekly recurrence', () => {
      const rrule = generateRRule(
        { frequency: 'WEEKLY', interval: 2 },
        fixedStartDate
      )

      const description = getRecurrenceDescription(rrule)

      expect(description.toLowerCase()).toMatch(/2|other|every/)
    })

    it('should describe monthly recurrence', () => {
      const rrule = generateRRule(
        { frequency: 'MONTHLY', interval: 1 },
        fixedStartDate
      )

      const description = getRecurrenceDescription(rrule)

      expect(description.toLowerCase()).toContain('month')
    })

    it('should describe yearly recurrence', () => {
      const rrule = generateRRule(
        { frequency: 'YEARLY', interval: 1 },
        fixedStartDate
      )

      const description = getRecurrenceDescription(rrule)

      expect(description.toLowerCase()).toContain('year')
    })

    it('should return error message for invalid rrule', () => {
      const description = getRecurrenceDescription('INVALID_RRULE')

      expect(description).toBe('Invalid recurrence rule')
    })

    it('should handle empty string (rrule library interprets as yearly)', () => {
      // Note: The rrule library interprets empty string as a valid yearly rule
      const description = getRecurrenceDescription('')

      // rrule library returns 'every year' for empty string
      expect(description.toLowerCase()).toContain('year')
    })

    it('should describe rule with specific days', () => {
      const rrule = generateRRule(
        { frequency: 'WEEKLY', interval: 1, byDay: ['MO', 'WE', 'FR'] },
        fixedStartDate
      )

      const description = getRecurrenceDescription(rrule)

      // Should mention the days or week pattern
      expect(description.length).toBeGreaterThan(0)
    })

    it('should describe rule with count', () => {
      const rrule = generateRRule(
        { frequency: 'DAILY', interval: 1, count: 10 },
        fixedStartDate
      )

      const description = getRecurrenceDescription(rrule)

      expect(description.toLowerCase()).toMatch(/day|10|time/)
    })
  })

  describe('edge cases and error handling', () => {
    it('should handle leap year dates', () => {
      const leapYearDate = new Date('2024-02-29T10:00:00Z')
      const config: RecurrenceConfig = {
        frequency: 'YEARLY',
        interval: 1,
      }

      const rrule = generateRRule(config, leapYearDate)

      expect(rrule).toContain('FREQ=YEARLY')
    })

    it('should handle timezone edge cases', () => {
      // New Year's Eve at 11 PM in a timezone
      const config: RecurrenceConfig = {
        frequency: 'DAILY',
        interval: 1,
      }
      const lateNightDate = new Date('2024-12-31T23:00:00Z')

      const rrule = generateRRule(config, lateNightDate)

      expect(rrule).toBeDefined()
    })

    it('should handle very large intervals', () => {
      const config: RecurrenceConfig = {
        frequency: 'DAILY',
        interval: 365,
      }

      const rrule = generateRRule(config, fixedStartDate)

      expect(rrule).toContain('INTERVAL=365')
    })

    it('should handle all weekdays', () => {
      const config: RecurrenceConfig = {
        frequency: 'WEEKLY',
        byDay: ['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU'],
      }

      const rrule = generateRRule(config, fixedStartDate)

      expect(rrule).toContain('BYDAY=')
    })

    it('should handle all months', () => {
      const config: RecurrenceConfig = {
        frequency: 'YEARLY',
        byMonth: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
      }

      const rrule = generateRRule(config, fixedStartDate)

      expect(rrule).toContain('BYMONTH=')
    })

    it('should handle very distant future until date', () => {
      const config: RecurrenceConfig = {
        frequency: 'DAILY',
        until: new Date('2099-12-31T23:59:59Z'),
      }

      const rrule = generateRRule(config, fixedStartDate)

      expect(rrule).toContain('UNTIL=')
    })

    it('should handle very large count', () => {
      const config: RecurrenceConfig = {
        frequency: 'WEEKLY',
        count: 1000,
      }

      const rrule = generateRRule(config, fixedStartDate)

      expect(rrule).toContain('COUNT=1000')
    })
  })
})
