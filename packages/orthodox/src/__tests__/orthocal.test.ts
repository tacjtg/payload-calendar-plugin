import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  fetchOrthocalDay,
  fetchOrthocalRange,
  fetchOrthocalMonth,
  mapOrthocalFeastLevel,
  mapOrthocalFastLevel,
  parseOrthocalReading,
  transformOrthocalToFeastDay,
  transformOrthocalSaints,
  transformOrthocalReadings,
  createOrthocalSync,
} from '../utils/orthocal'
import type { OrthocalDay, OrthocalReading, OrthocalSaint } from '../types'

// Mock fetch globally
const mockFetch = vi.fn()
global.fetch = mockFetch

describe('orthocal utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const mockOrthocalDay: OrthocalDay = {
    year: 2024,
    month: 5,
    day: 5,
    pascha_distance: 0,
    julian_day_number: 2460436,
    weekday: 'Sunday',
    tone: 0,
    titles: ['Pascha', 'The Resurrection of our Lord'],
    feast_level: 9,
    feast_level_description: 'Great Feast',
    fast_level: 0,
    fast_level_description: 'Fast-free',
    saints: [
      { name: 'Righteous Job the Long-Suffering', title: 'Prophet', has_icon: true },
      { name: 'Prophet Isaiah', has_icon: true },
    ],
    readings: [
      {
        source: 'Epistle',
        book: 'Acts',
        description: 'Paschal Epistle',
        display: 'Acts 1:1-8',
        short_display: 'Acts 1:1-8',
      },
      {
        source: 'Gospel',
        book: 'John',
        description: 'Paschal Gospel',
        display: 'John 1:1-17',
        short_display: 'John 1:1-17',
      },
    ],
  }

  describe('fetchOrthocalDay', () => {
    it('should fetch calendar data for a specific date', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockOrthocalDay,
      })

      const result = await fetchOrthocalDay(2024, 5, 5)

      expect(mockFetch).toHaveBeenCalledWith(
        'https://orthocal.info/api/gregorian/2024/5/5/',
        expect.objectContaining({
          headers: { Accept: 'application/json' },
        })
      )
      expect(result).toEqual(mockOrthocalDay)
    })

    it('should use julian calendar when specified', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockOrthocalDay,
      })

      await fetchOrthocalDay(2024, 4, 22, { calendar: 'julian' })

      expect(mockFetch).toHaveBeenCalledWith(
        'https://orthocal.info/api/julian/2024/4/22/',
        expect.any(Object)
      )
    })

    it('should throw error for non-ok response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      })

      await expect(fetchOrthocalDay(2024, 13, 32)).rejects.toThrow(
        'Orthocal API error: 404 Not Found'
      )
    })

    it('should use default gregorian calendar', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockOrthocalDay,
      })

      await fetchOrthocalDay(2024, 5, 5)

      expect(mockFetch).toHaveBeenCalledWith(
        'https://orthocal.info/api/gregorian/2024/5/5/',
        expect.any(Object)
      )
    })
  })

  describe('fetchOrthocalRange', () => {
    it('should fetch calendar data for a date range', async () => {
      const day1 = { ...mockOrthocalDay, day: 1 }
      const day2 = { ...mockOrthocalDay, day: 2 }
      const day3 = { ...mockOrthocalDay, day: 3 }

      mockFetch
        .mockResolvedValueOnce({ ok: true, json: async () => day1 })
        .mockResolvedValueOnce({ ok: true, json: async () => day2 })
        .mockResolvedValueOnce({ ok: true, json: async () => day3 })

      const startDate = new Date(Date.UTC(2024, 4, 1))
      const endDate = new Date(Date.UTC(2024, 4, 3))

      const result = await fetchOrthocalRange(startDate, endDate)

      expect(result).toHaveLength(3)
      expect(result[0].day).toBe(1)
      expect(result[1].day).toBe(2)
      expect(result[2].day).toBe(3)
    })

    it('should continue on individual day fetch failures', async () => {
      const day1 = { ...mockOrthocalDay, day: 1 }
      const day3 = { ...mockOrthocalDay, day: 3 }

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      mockFetch
        .mockResolvedValueOnce({ ok: true, json: async () => day1 })
        .mockRejectedValueOnce(new Error('API Error'))
        .mockResolvedValueOnce({ ok: true, json: async () => day3 })

      const startDate = new Date(Date.UTC(2024, 4, 1))
      const endDate = new Date(Date.UTC(2024, 4, 3))

      const result = await fetchOrthocalRange(startDate, endDate)

      expect(result).toHaveLength(2)
      expect(result[0].day).toBe(1)
      expect(result[1].day).toBe(3)
      expect(consoleSpy).toHaveBeenCalled()

      consoleSpy.mockRestore()
    })
  })

  describe('fetchOrthocalMonth', () => {
    it('should fetch all days in a month', async () => {
      // Mock 31 responses for May
      for (let i = 0; i < 31; i++) {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({ ...mockOrthocalDay, day: i + 1 }),
        })
      }

      const result = await fetchOrthocalMonth(2024, 5)

      expect(result).toHaveLength(31)
      expect(mockFetch).toHaveBeenCalledTimes(31)
    })
  })

  describe('mapOrthocalFeastLevel', () => {
    it('should map orthocal levels 0-2 to our level 0', () => {
      expect(mapOrthocalFeastLevel(0)).toBe(0)
      expect(mapOrthocalFeastLevel(1)).toBe(0)
      expect(mapOrthocalFeastLevel(2)).toBe(0)
    })

    it('should map orthocal levels 3-4 to our level 1', () => {
      expect(mapOrthocalFeastLevel(3)).toBe(1)
      expect(mapOrthocalFeastLevel(4)).toBe(1)
    })

    it('should map orthocal levels 5-6 to our level 2', () => {
      expect(mapOrthocalFeastLevel(5)).toBe(2)
      expect(mapOrthocalFeastLevel(6)).toBe(2)
    })

    it('should map orthocal levels 7-8 to our level 3', () => {
      expect(mapOrthocalFeastLevel(7)).toBe(3)
      expect(mapOrthocalFeastLevel(8)).toBe(3)
    })

    it('should map orthocal level 9 to our level 4 (Great Feast)', () => {
      expect(mapOrthocalFeastLevel(9)).toBe(4)
    })
  })

  describe('mapOrthocalFastLevel', () => {
    it('should map level 0 to NONE', () => {
      expect(mapOrthocalFastLevel(0)).toBe('NONE')
    })

    it('should map level 1 to FISH', () => {
      expect(mapOrthocalFastLevel(1)).toBe('FISH')
    })

    it('should map level 2 to OIL_WINE', () => {
      expect(mapOrthocalFastLevel(2)).toBe('OIL_WINE')
    })

    it('should map level 3 to OIL', () => {
      expect(mapOrthocalFastLevel(3)).toBe('OIL')
    })

    it('should map level 4 to XEROPHAGY', () => {
      expect(mapOrthocalFastLevel(4)).toBe('XEROPHAGY')
    })

    it('should default to XEROPHAGY for unknown levels', () => {
      expect(mapOrthocalFastLevel(5)).toBe('XEROPHAGY')
      expect(mapOrthocalFastLevel(100)).toBe('XEROPHAGY')
    })
  })

  describe('parseOrthocalReading', () => {
    it('should parse a simple reading reference', () => {
      const reading: OrthocalReading = {
        source: 'Epistle',
        book: 'Romans',
        description: 'Epistle',
        display: 'Romans 6:3-11',
        short_display: 'Rom 6:3-11',
      }

      const result = parseOrthocalReading(reading)

      expect(result).toEqual({
        book: 'Romans',
        chapter: 6,
        verseStart: 3,
        verseEnd: 11,
        reference: 'Romans 6:3-11',
      })
    })

    it('should parse a single verse reference', () => {
      const reading: OrthocalReading = {
        source: 'Gospel',
        book: 'John',
        description: 'Gospel',
        display: 'John 3:16',
        short_display: 'John 3:16',
      }

      const result = parseOrthocalReading(reading)

      expect(result).toEqual({
        book: 'John',
        chapter: 3,
        verseStart: 16,
        verseEnd: 16,
        reference: 'John 3:16',
      })
    })

    it('should handle books with numbers in name', () => {
      const reading: OrthocalReading = {
        source: 'Epistle',
        book: '1 Corinthians',
        description: 'Epistle',
        display: '1 Corinthians 15:1-8',
        short_display: '1 Cor 15:1-8',
      }

      const result = parseOrthocalReading(reading)

      expect(result?.book).toBe('1 Corinthians')
      expect(result?.chapter).toBe(15)
      expect(result?.verseStart).toBe(1)
      expect(result?.verseEnd).toBe(8)
    })

    it('should return null for unparseable references', () => {
      const reading: OrthocalReading = {
        source: 'Epistle',
        book: 'Romans',
        description: 'Epistle',
        display: 'Invalid format here',
        short_display: 'Invalid',
      }

      const result = parseOrthocalReading(reading)

      expect(result).toBeNull()
    })
  })

  describe('transformOrthocalToFeastDay', () => {
    it('should transform orthocal day to feast day format', () => {
      const result = transformOrthocalToFeastDay(mockOrthocalDay)

      expect(result).toEqual({
        name: 'Pascha',
        date: '2024-05-05',
        dateType: 'FIXED', // pascha_distance is 0
        feastLevel: 4,
        feastType: 'GREAT_FEAST',
      })
    })

    it('should return MOVEABLE dateType for days within Paschal cycle', () => {
      const moveableDay: OrthocalDay = {
        ...mockOrthocalDay,
        pascha_distance: 49, // Pentecost
        titles: ['Pentecost'],
      }

      const result = transformOrthocalToFeastDay(moveableDay)

      expect(result?.dateType).toBe('MOVEABLE')
      expect(result?.paschaOffset).toBe(49)
    })

    it('should return null for days with no titles', () => {
      const emptyDay: OrthocalDay = {
        ...mockOrthocalDay,
        titles: [],
      }

      const result = transformOrthocalToFeastDay(emptyDay)

      expect(result).toBeNull()
    })

    it('should map feast levels to feast types correctly', () => {
      // Level 4 = GREAT_FEAST
      const greatFeast = transformOrthocalToFeastDay({
        ...mockOrthocalDay,
        feast_level: 9,
      })
      expect(greatFeast?.feastType).toBe('GREAT_FEAST')

      // Level 2-3 = MAJOR
      const majorFeast = transformOrthocalToFeastDay({
        ...mockOrthocalDay,
        feast_level: 6,
      })
      expect(majorFeast?.feastType).toBe('MAJOR')

      // Level 1 = MINOR
      const minorFeast = transformOrthocalToFeastDay({
        ...mockOrthocalDay,
        feast_level: 4,
      })
      expect(minorFeast?.feastType).toBe('MINOR')

      // Level 0 = COMMEMORATION
      const commemoration = transformOrthocalToFeastDay({
        ...mockOrthocalDay,
        feast_level: 1,
      })
      expect(commemoration?.feastType).toBe('COMMEMORATION')
    })

    it('should format date with leading zeros', () => {
      const dayWithSingleDigits: OrthocalDay = {
        ...mockOrthocalDay,
        month: 1,
        day: 5,
      }

      const result = transformOrthocalToFeastDay(dayWithSingleDigits)

      expect(result?.date).toBe('2024-01-05')
    })
  })

  describe('transformOrthocalSaints', () => {
    it('should transform saints with titles', () => {
      const saints: OrthocalSaint[] = [
        { name: 'Job', title: 'the Long-Suffering', has_icon: true },
        { name: 'Isaiah', title: 'Prophet', has_icon: true },
      ]

      const result = transformOrthocalSaints(saints, '2024-05-05')

      expect(result).toHaveLength(2)
      expect(result[0].name).toBe('Job, the Long-Suffering')
      expect(result[0].feastDate).toBe('2024-05-05')
      expect(result[0].category).toBe('RIGHTEOUS')
      expect(result[0].feastLevel).toBe(1)
      expect(result[1].name).toBe('Isaiah, Prophet')
    })

    it('should handle saints without titles', () => {
      const saints: OrthocalSaint[] = [{ name: 'John the Baptist', has_icon: true }]

      const result = transformOrthocalSaints(saints, '2024-01-07')

      expect(result[0].name).toBe('John the Baptist')
    })

    it('should return empty array for no saints', () => {
      const result = transformOrthocalSaints([], '2024-05-05')

      expect(result).toEqual([])
    })
  })

  describe('transformOrthocalReadings', () => {
    it('should transform readings with correct types', () => {
      const readings: OrthocalReading[] = [
        {
          source: 'Epistle',
          book: 'Romans',
          description: 'Epistle',
          display: 'Romans 6:3-11',
          short_display: 'Rom 6:3-11',
        },
        {
          source: 'Gospel',
          book: 'Matthew',
          description: 'Gospel',
          display: 'Matthew 28:1-20',
          short_display: 'Matt 28:1-20',
        },
      ]

      const result = transformOrthocalReadings(readings, '2024-05-05', 0)

      expect(result).toHaveLength(2)
      expect(result[0].readingType).toBe('EPISTLE')
      expect(result[0].reference).toBe('Romans 6:3-11')
      expect(result[0].serviceType).toBe('LITURGY')
      expect(result[1].readingType).toBe('GOSPEL')
    })

    it('should detect Gospel readings correctly', () => {
      const readings: OrthocalReading[] = [
        { source: 'Gospel', book: 'John', description: '', display: 'John 1:1-17', short_display: '' },
        { source: 'Gospel', book: 'Mark', description: '', display: 'Mark 1:1-8', short_display: '' },
        { source: 'Gospel', book: 'Luke', description: '', display: 'Luke 1:1-4', short_display: '' },
        { source: 'Gospel', book: 'Matthew', description: '', display: 'Matthew 1:1-17', short_display: '' },
      ]

      const result = transformOrthocalReadings(readings, '2024-05-05', 0)

      result.forEach((r) => {
        expect(r.readingType).toBe('GOSPEL')
      })
    })

    it('should detect Old Testament readings', () => {
      const readings: OrthocalReading[] = [
        {
          source: 'Old Testament',
          book: 'Genesis',
          description: '',
          display: 'Genesis 1:1-31',
          short_display: '',
        },
        {
          source: 'Old Testament',
          book: 'Proverbs',
          description: '',
          display: 'Proverbs 1:1-9',
          short_display: '',
        },
      ]

      const result = transformOrthocalReadings(readings, '2024-05-05', 0)

      expect(result[0].readingType).toBe('OLD_TESTAMENT')
      expect(result[1].readingType).toBe('OLD_TESTAMENT')
    })

    it('should set MOVEABLE dateType for readings within Paschal cycle', () => {
      const readings: OrthocalReading[] = [
        { source: 'Epistle', book: 'Acts', description: '', display: 'Acts 2:1-11', short_display: '' },
      ]

      const result = transformOrthocalReadings(readings, '2024-06-23', 49) // Pentecost

      expect(result[0].dateType).toBe('MOVEABLE')
      expect(result[0].paschaOffset).toBe(49)
      expect(result[0].date).toBeUndefined()
    })

    it('should set FIXED dateType for readings outside Paschal cycle', () => {
      const readings: OrthocalReading[] = [
        { source: 'Epistle', book: 'Romans', description: '', display: 'Romans 1:1-7', short_display: '' },
      ]

      const result = transformOrthocalReadings(readings, '2024-01-01', 0)

      expect(result[0].dateType).toBe('FIXED')
      expect(result[0].date).toBe('2024-01-01')
      expect(result[0].paschaOffset).toBeUndefined()
    })
  })

  describe('createOrthocalSync', () => {
    beforeEach(() => {
      vi.useFakeTimers()
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('should create a sync function', () => {
      const syncFn = createOrthocalSync()

      expect(typeof syncFn).toBe('function')
    })

    it('should sync data from orthocal to payload', async () => {
      const mockPayload = {
        find: vi.fn().mockResolvedValue({ docs: [] }),
        create: vi.fn().mockResolvedValue({ id: 'created-id' }),
        update: vi.fn().mockResolvedValue({ id: 'updated-id' }),
      }

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockOrthocalDay,
      })

      const syncFn = createOrthocalSync()
      const startDate = new Date(Date.UTC(2024, 4, 5))
      const endDate = new Date(Date.UTC(2024, 4, 5))

      const syncPromise = syncFn(mockPayload, {
        startDate,
        endDate,
      })

      // Advance all timers to complete the sync (100ms delay in the function)
      await vi.runAllTimersAsync()

      const result = await syncPromise

      expect(result.synced).toBeGreaterThan(0)
      expect(result.errors).toBe(0)
      expect(mockPayload.create).toHaveBeenCalled()
    })

    it('should skip existing records when updateExisting is false', async () => {
      const mockPayload = {
        find: vi.fn().mockResolvedValue({ docs: [{ id: 'existing' }] }),
        create: vi.fn().mockResolvedValue({ id: 'created-id' }),
        update: vi.fn().mockResolvedValue({ id: 'updated-id' }),
      }

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockOrthocalDay,
      })

      const syncFn = createOrthocalSync()
      const startDate = new Date(Date.UTC(2024, 4, 5))
      const endDate = new Date(Date.UTC(2024, 4, 5))

      const syncPromise = syncFn(mockPayload, {
        startDate,
        endDate,
        updateExisting: false,
      })

      await vi.runAllTimersAsync()
      await syncPromise

      expect(mockPayload.update).not.toHaveBeenCalled()
    })

    it('should update existing records when updateExisting is true', async () => {
      const mockPayload = {
        find: vi.fn().mockResolvedValue({ docs: [{ id: 'existing' }] }),
        create: vi.fn().mockResolvedValue({ id: 'created-id' }),
        update: vi.fn().mockResolvedValue({ id: 'updated-id' }),
      }

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockOrthocalDay,
      })

      const syncFn = createOrthocalSync()
      const startDate = new Date(Date.UTC(2024, 4, 5))
      const endDate = new Date(Date.UTC(2024, 4, 5))

      const syncPromise = syncFn(mockPayload, {
        startDate,
        endDate,
        updateExisting: true,
      })

      await vi.runAllTimersAsync()
      await syncPromise

      expect(mockPayload.update).toHaveBeenCalled()
    })

    it('should call onProgress callback with progress updates', async () => {
      const mockPayload = {
        find: vi.fn().mockResolvedValue({ docs: [] }),
        create: vi.fn().mockResolvedValue({ id: 'created-id' }),
        update: vi.fn().mockResolvedValue({ id: 'updated-id' }),
      }

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockOrthocalDay,
      })

      const onProgress = vi.fn()
      const syncFn = createOrthocalSync()
      const startDate = new Date(Date.UTC(2024, 4, 5))
      const endDate = new Date(Date.UTC(2024, 4, 5))

      const syncPromise = syncFn(mockPayload, {
        startDate,
        endDate,
        onProgress,
      })

      await vi.runAllTimersAsync()
      await syncPromise

      // onProgress is called with (message, currentDay, totalDays)
      // For same-day range, totalDays is 0 (ceil((end - start) / dayMs))
      // currentDay starts at 1, so first call is ("Syncing 2024-05-05...", 1, 0)
      expect(onProgress).toHaveBeenCalledWith(expect.stringContaining('Syncing'), 1, 0)
      expect(onProgress).toHaveBeenCalledWith('Sync complete', 0, 0)
    })

    it('should handle API errors gracefully', async () => {
      const mockPayload = {
        find: vi.fn().mockResolvedValue({ docs: [] }),
        create: vi.fn().mockResolvedValue({ id: 'created-id' }),
        update: vi.fn().mockResolvedValue({ id: 'updated-id' }),
      }

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      mockFetch.mockRejectedValue(new Error('API Error'))

      const syncFn = createOrthocalSync()
      const startDate = new Date(Date.UTC(2024, 4, 5))
      const endDate = new Date(Date.UTC(2024, 4, 5))

      const syncPromise = syncFn(mockPayload, {
        startDate,
        endDate,
      })

      await vi.runAllTimersAsync()
      const result = await syncPromise

      expect(result.errors).toBe(1)
      expect(consoleSpy).toHaveBeenCalled()

      consoleSpy.mockRestore()
    })

    it('should use custom collection slugs', async () => {
      const mockPayload = {
        find: vi.fn().mockResolvedValue({ docs: [] }),
        create: vi.fn().mockResolvedValue({ id: 'created-id' }),
        update: vi.fn().mockResolvedValue({ id: 'updated-id' }),
      }

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockOrthocalDay,
      })

      const syncFn = createOrthocalSync()
      const startDate = new Date(Date.UTC(2024, 4, 5))
      const endDate = new Date(Date.UTC(2024, 4, 5))

      const syncPromise = syncFn(mockPayload, {
        startDate,
        endDate,
        collections: {
          feastDays: 'custom-feast-days',
          saints: 'custom-saints',
          readings: 'custom-readings',
        },
      })

      await vi.runAllTimersAsync()
      await syncPromise

      expect(mockPayload.find).toHaveBeenCalledWith(
        expect.objectContaining({ collection: 'custom-feast-days' })
      )
    })
  })
})
