import type { OrthocalDay, OrthocalReading, OrthocalSaint, FastingLevel, FeastLevel } from '../types'

/**
 * Orthocal.info API client
 *
 * Fetches Orthodox calendar data from the orthocal.info API,
 * which provides:
 * - Daily feast information
 * - Saints commemorated
 * - Fasting rules
 * - Scripture readings
 *
 * @see https://orthocal.info/api/
 */

const ORTHOCAL_BASE_URL = 'https://orthocal.info/api'

/**
 * Orthocal API configuration
 */
export interface OrthocalConfig {
  /**
   * Calendar to use (default: 'gregorian')
   * - 'gregorian' - New Calendar (Revised Julian for most Orthodox)
   * - 'julian' - Old Calendar (Julian dates)
   */
  calendar?: 'gregorian' | 'julian'

  /**
   * Language for feast names (default: 'en')
   */
  language?: string

  /**
   * Request timeout in milliseconds (default: 10000)
   */
  timeout?: number
}

/**
 * Fetch calendar data for a specific date
 *
 * @param year - Year (4 digits)
 * @param month - Month (1-12)
 * @param day - Day of month (1-31)
 * @param config - API configuration
 * @returns OrthocalDay data
 */
export async function fetchOrthocalDay(
  year: number,
  month: number,
  day: number,
  config: OrthocalConfig = {}
): Promise<OrthocalDay> {
  const { calendar = 'gregorian', timeout = 10000 } = config

  const url = `${ORTHOCAL_BASE_URL}/${calendar}/${year}/${month}/${day}/`

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`Orthocal API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json() as OrthocalDay
    return data
  } finally {
    clearTimeout(timeoutId)
  }
}

/**
 * Fetch calendar data for a date range
 *
 * @param startDate - Start date
 * @param endDate - End date
 * @param config - API configuration
 * @returns Array of OrthocalDay data
 */
export async function fetchOrthocalRange(
  startDate: Date,
  endDate: Date,
  config: OrthocalConfig = {}
): Promise<OrthocalDay[]> {
  const days: OrthocalDay[] = []
  const currentDate = new Date(startDate)

  while (currentDate <= endDate) {
    const year = currentDate.getUTCFullYear()
    const month = currentDate.getUTCMonth() + 1
    const day = currentDate.getUTCDate()

    try {
      const dayData = await fetchOrthocalDay(year, month, day, config)
      days.push(dayData)
    } catch (error) {
      console.error(`Failed to fetch orthocal data for ${year}-${month}-${day}:`, error)
      // Continue with next day instead of failing entirely
    }

    currentDate.setUTCDate(currentDate.getUTCDate() + 1)
  }

  return days
}

/**
 * Fetch calendar data for a specific month
 *
 * @param year - Year (4 digits)
 * @param month - Month (1-12)
 * @param config - API configuration
 * @returns Array of OrthocalDay data for the month
 */
export async function fetchOrthocalMonth(
  year: number,
  month: number,
  config: OrthocalConfig = {}
): Promise<OrthocalDay[]> {
  const startDate = new Date(Date.UTC(year, month - 1, 1))
  const endDate = new Date(Date.UTC(year, month, 0)) // Last day of month

  return fetchOrthocalRange(startDate, endDate, config)
}

/**
 * Convert Orthocal feast level to our FeastLevel type
 *
 * Orthocal uses levels 0-9, we use 0-4
 * - 0: No feast
 * - 1-2: Simple commemoration (our 0)
 * - 3-4: Small doxology (our 1)
 * - 5-6: Great doxology (our 2)
 * - 7-8: Polyeleos (our 3)
 * - 9: Great Feast (our 4)
 */
export function mapOrthocalFeastLevel(orthocalLevel: number): FeastLevel {
  if (orthocalLevel <= 2) return 0
  if (orthocalLevel <= 4) return 1
  if (orthocalLevel <= 6) return 2
  if (orthocalLevel <= 8) return 3
  return 4
}

/**
 * Convert Orthocal fast level to our FastingLevel type
 *
 * Orthocal fast levels:
 * - 0: Fast-free
 * - 1: Fish allowed
 * - 2: Wine and oil allowed
 * - 3: Oil allowed
 * - 4: Strict fast (xerophagy)
 */
export function mapOrthocalFastLevel(orthocalLevel: number): FastingLevel {
  switch (orthocalLevel) {
    case 0:
      return 'NONE'
    case 1:
      return 'FISH'
    case 2:
      return 'OIL_WINE'
    case 3:
      return 'OIL'
    case 4:
    default:
      return 'XEROPHAGY'
  }
}

/**
 * Parse Orthocal reading reference to structured data
 *
 * @param reading - Orthocal reading object
 * @returns Structured reading data
 */
export function parseOrthocalReading(reading: OrthocalReading): {
  book: string
  chapter: number
  verseStart: number
  verseEnd: number
  reference: string
} | null {
  // Orthocal display format is like "Romans 6:3-11" or "Matthew 1:1-25"
  const displayMatch = reading.display.match(/^(\d?\s?\w+)\s+(\d+):(\d+)(?:-(\d+))?/)

  if (!displayMatch) {
    return null
  }

  const [, bookName, chapterStr, verseStartStr, verseEndStr] = displayMatch

  return {
    book: bookName?.trim() ?? '',
    chapter: parseInt(chapterStr ?? '1', 10),
    verseStart: parseInt(verseStartStr ?? '1', 10),
    verseEnd: verseEndStr ? parseInt(verseEndStr, 10) : parseInt(verseStartStr ?? '1', 10),
    reference: reading.display,
  }
}

/**
 * Transform Orthocal data to our FeastDay format
 *
 * @param orthocalDay - Data from Orthocal API
 * @returns Partial FeastDay data for creating/updating records
 */
export function transformOrthocalToFeastDay(orthocalDay: OrthocalDay): {
  name: string
  date: string
  dateType: 'FIXED' | 'MOVEABLE'
  paschaOffset?: number
  feastLevel: FeastLevel
  feastType: 'GREAT_FEAST' | 'MAJOR' | 'MINOR' | 'COMMEMORATION'
} | null {
  if (orthocalDay.titles.length === 0) {
    return null
  }

  const feastLevel = mapOrthocalFeastLevel(orthocalDay.feast_level)
  const dateStr = `${orthocalDay.year}-${String(orthocalDay.month).padStart(2, '0')}-${String(orthocalDay.day).padStart(2, '0')}`

  // Determine feast type based on level
  let feastType: 'GREAT_FEAST' | 'MAJOR' | 'MINOR' | 'COMMEMORATION'
  if (feastLevel === 4) {
    feastType = 'GREAT_FEAST'
  } else if (feastLevel >= 2) {
    feastType = 'MAJOR'
  } else if (feastLevel >= 1) {
    feastType = 'MINOR'
  } else {
    feastType = 'COMMEMORATION'
  }

  // Determine if moveable (Pascha-dependent)
  const isMoveable = orthocalDay.pascha_distance !== 0 &&
    Math.abs(orthocalDay.pascha_distance) <= 70 // Within Paschal cycle

  return {
    name: orthocalDay.titles[0] ?? 'Unknown Feast',
    date: dateStr,
    dateType: isMoveable ? 'MOVEABLE' : 'FIXED',
    ...(isMoveable ? { paschaOffset: orthocalDay.pascha_distance } : {}),
    feastLevel,
    feastType,
  }
}

/**
 * Transform Orthocal saints to our Saint format
 *
 * @param saints - Saints from Orthocal API
 * @param date - The date string (YYYY-MM-DD)
 * @returns Array of partial Saint data
 */
export function transformOrthocalSaints(
  saints: OrthocalSaint[],
  date: string
): Array<{
  name: string
  feastDate: string
  category: 'RIGHTEOUS'
  feastLevel: FeastLevel
}> {
  return saints.map((saint) => ({
    name: saint.title ? `${saint.name}, ${saint.title}` : saint.name,
    feastDate: date,
    category: 'RIGHTEOUS' as const, // Default category - would need more data to determine
    feastLevel: 1 as FeastLevel, // Default to small doxology
  }))
}

/**
 * Transform Orthocal readings to our LiturgicalReading format
 *
 * @param readings - Readings from Orthocal API
 * @param date - The date string (YYYY-MM-DD)
 * @param paschaOffset - Days from Pascha
 * @returns Array of partial LiturgicalReading data
 */
export function transformOrthocalReadings(
  readings: OrthocalReading[],
  date: string,
  paschaOffset: number
): Array<{
  reference: string
  readingType: 'EPISTLE' | 'GOSPEL' | 'OLD_TESTAMENT'
  serviceType: 'LITURGY'
  dateType: 'FIXED' | 'MOVEABLE'
  date?: string
  paschaOffset?: number
}> {
  return readings.map((reading) => {
    // Determine reading type from source/book
    let readingType: 'EPISTLE' | 'GOSPEL' | 'OLD_TESTAMENT' = 'EPISTLE'

    const gospels = ['Matthew', 'Mark', 'Luke', 'John']
    if (gospels.some((g) => reading.display.startsWith(g))) {
      readingType = 'GOSPEL'
    } else if (reading.source === 'Old Testament' || reading.book === 'Proverbs' || reading.book === 'Genesis') {
      readingType = 'OLD_TESTAMENT'
    }

    const isMoveable = paschaOffset !== 0 && Math.abs(paschaOffset) <= 70

    return {
      reference: reading.display,
      readingType,
      serviceType: 'LITURGY' as const,
      dateType: isMoveable ? 'MOVEABLE' as const : 'FIXED' as const,
      ...(isMoveable ? { paschaOffset } : { date }),
    }
  })
}

/**
 * Sync data from Orthocal.info to Payload collections
 *
 * This is a utility function that can be called from a scheduled job
 * or admin action to populate the Orthodox calendar collections.
 *
 * @param payload - Payload instance
 * @param options - Sync options
 */
export interface OrthocalSyncOptions {
  /** Date range start (default: today) */
  startDate?: Date
  /** Date range end (default: 1 year from today) */
  endDate?: Date
  /** Orthocal API configuration */
  orthocalConfig?: OrthocalConfig
  /** Collection slugs */
  collections?: {
    feastDays?: string
    saints?: string
    readings?: string
  }
  /** Whether to update existing records (default: false - skip existing) */
  updateExisting?: boolean
  /** Callback for progress updates */
  onProgress?: (message: string, current: number, total: number) => void
}

/**
 * Create a sync function for use with Payload
 *
 * Usage in a custom endpoint or scheduled job:
 * ```typescript
 * import { createOrthocalSync } from '@payload-calendar/orthodox/utils'
 *
 * const syncOrthodoxCalendar = createOrthocalSync()
 *
 * // In your endpoint handler:
 * await syncOrthodoxCalendar(payload, {
 *   startDate: new Date(),
 *   endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
 * })
 * ```
 */
export function createOrthocalSync() {
  return async function syncOrthodoxCalendar(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    payload: any, // Payload instance type varies by version
    options: OrthocalSyncOptions = {}
  ): Promise<{ synced: number; errors: number }> {
    const {
      startDate = new Date(),
      endDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      orthocalConfig = {},
      collections = {},
      updateExisting = false,
      onProgress,
    } = options

    const feastDaysSlug = collections.feastDays ?? 'orthodox-feast-days'
    const saintsSlug = collections.saints ?? 'orthodox-saints'
    const readingsSlug = collections.readings ?? 'orthodox-readings'

    let synced = 0
    let errors = 0

    // Calculate total days for progress
    const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
    let currentDay = 0

    const currentDate = new Date(startDate)

    while (currentDate <= endDate) {
      currentDay++
      const year = currentDate.getUTCFullYear()
      const month = currentDate.getUTCMonth() + 1
      const day = currentDate.getUTCDate()
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`

      try {
        onProgress?.(`Syncing ${dateStr}...`, currentDay, totalDays)

        const orthocalData = await fetchOrthocalDay(year, month, day, orthocalConfig)

        // Sync feast day
        const feastData = transformOrthocalToFeastDay(orthocalData)
        if (feastData) {
          try {
            // Check if exists
            const existing = await payload.find({
              collection: feastDaysSlug,
              where: { date: { equals: feastData.date }, name: { equals: feastData.name } },
              limit: 1,
            })

            if (existing.docs.length === 0) {
              await payload.create({
                collection: feastDaysSlug,
                data: feastData,
              })
              synced++
            } else if (updateExisting) {
              await payload.update({
                collection: feastDaysSlug,
                id: existing.docs[0].id,
                data: feastData,
              })
              synced++
            }
          } catch (e) {
            errors++
            console.error(`Failed to sync feast day for ${dateStr}:`, e)
          }
        }

        // Sync saints
        const saintsData = transformOrthocalSaints(orthocalData.saints, dateStr)
        for (const saintData of saintsData) {
          try {
            const existing = await payload.find({
              collection: saintsSlug,
              where: { feastDate: { equals: saintData.feastDate }, name: { equals: saintData.name } },
              limit: 1,
            })

            if (existing.docs.length === 0) {
              await payload.create({
                collection: saintsSlug,
                data: saintData,
              })
              synced++
            } else if (updateExisting) {
              await payload.update({
                collection: saintsSlug,
                id: existing.docs[0].id,
                data: saintData,
              })
              synced++
            }
          } catch (e) {
            errors++
            console.error(`Failed to sync saint ${saintData.name}:`, e)
          }
        }

        // Sync readings
        const readingsData = transformOrthocalReadings(
          orthocalData.readings,
          dateStr,
          orthocalData.pascha_distance
        )
        for (const readingData of readingsData) {
          try {
            const existing = await payload.find({
              collection: readingsSlug,
              where: {
                reference: { equals: readingData.reference },
                ...(readingData.date ? { date: { equals: readingData.date } } : {}),
                ...(readingData.paschaOffset !== undefined ? { paschaOffset: { equals: readingData.paschaOffset } } : {}),
              },
              limit: 1,
            })

            if (existing.docs.length === 0) {
              await payload.create({
                collection: readingsSlug,
                data: readingData,
              })
              synced++
            } else if (updateExisting) {
              await payload.update({
                collection: readingsSlug,
                id: existing.docs[0].id,
                data: readingData,
              })
              synced++
            }
          } catch (e) {
            errors++
            console.error(`Failed to sync reading ${readingData.reference}:`, e)
          }
        }
      } catch (e) {
        errors++
        console.error(`Failed to fetch orthocal data for ${dateStr}:`, e)
      }

      // Move to next day
      currentDate.setUTCDate(currentDate.getUTCDate() + 1)

      // Small delay to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 100))
    }

    onProgress?.('Sync complete', totalDays, totalDays)

    return { synced, errors }
  }
}
