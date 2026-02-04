import type { OrthodoxTradition, PaschaDate, MoveableFeastDates } from '../types'

/**
 * Calculate the date of Pascha (Easter) for a given year
 *
 * Uses the Meeus/Jones/Butcher algorithm for the Julian calendar,
 * then converts to Gregorian if needed.
 *
 * The Orthodox Church calculates Pascha based on:
 * 1. The Julian calendar (even when using Revised Julian for fixed feasts)
 * 2. The ecclesiastical full moon (not astronomical)
 * 3. Pascha must be after the Jewish Passover (based on the 325 AD rule)
 *
 * @param year - The year to calculate Pascha for
 * @param tradition - Which calendar tradition to use
 * @returns PaschaDate object with both Julian and Gregorian dates
 */
export function calculatePascha(year: number, tradition: OrthodoxTradition = 'JULIAN'): PaschaDate {
  // Calculate Julian calendar Pascha using the Meeus/Jones/Butcher algorithm
  // This algorithm gives the Julian calendar date directly
  const a = year % 4
  const b = year % 7
  const c = year % 19
  const d = (19 * c + 15) % 30
  const e = (2 * a + 4 * b - d + 34) % 7
  const month = Math.floor((d + e + 114) / 31) // 3 = March, 4 = April
  const day = ((d + e + 114) % 31) + 1

  // Create Julian calendar date (using year, month, day in Julian system)
  const julianDate = new Date(Date.UTC(year, month - 1, day))

  // Convert Julian to Gregorian by adding the offset
  // The offset depends on the century
  const julianOffset = getJulianToGregorianOffset(year)
  const gregorianDate = new Date(julianDate)
  gregorianDate.setUTCDate(gregorianDate.getUTCDate() + julianOffset)

  return {
    year,
    julianDate,
    gregorianDate,
    tradition,
  }
}

/**
 * Get the number of days to add to convert Julian to Gregorian
 *
 * The Julian calendar accumulates approximately 3 days every 400 years
 * compared to the Gregorian calendar.
 *
 * @param year - The year to calculate offset for
 * @returns Number of days to add to Julian date to get Gregorian
 */
export function getJulianToGregorianOffset(year: number): number {
  // The offset started at 10 days in 1582 when the Gregorian calendar was introduced
  // It increases by 3 days every 400 years (approximately 1 day per century,
  // except in years divisible by 100 but not by 400)

  // Calculate the century
  const century = Math.floor(year / 100)

  // The offset formula: century - floor(century/4) - 2
  // This gives us the number of "missing" leap years in Gregorian vs Julian
  // Starting from 1582:
  // 1582-1699: 10 days
  // 1700-1799: 11 days
  // 1800-1899: 12 days
  // 1900-2099: 13 days
  // 2100-2199: 14 days

  if (year < 1582) {
    return 0 // Before Gregorian calendar reform
  }

  return century - Math.floor(century / 4) - 2
}

/**
 * Calculate all moveable feast dates for a given year
 *
 * All moveable feasts are calculated relative to Pascha.
 *
 * @param year - The year to calculate feasts for
 * @param tradition - Which calendar tradition to use
 * @returns Object containing all moveable feast dates
 */
export function calculateMoveableFeastDates(
  year: number,
  tradition: OrthodoxTradition = 'JULIAN'
): MoveableFeastDates {
  const pascha = calculatePascha(year, tradition)
  const paschaDate = tradition === 'JULIAN' ? pascha.julianDate : pascha.gregorianDate

  const addDays = (date: Date, days: number): Date => {
    const result = new Date(date)
    result.setUTCDate(result.getUTCDate() + days)
    return result
  }

  return {
    year,
    pascha: paschaDate,
    // Pre-Lenten
    meatfare: addDays(paschaDate, -56),        // Sunday of the Last Judgment
    cheesefare: addDays(paschaDate, -49),      // Forgiveness Sunday
    // Great Lent
    cleanMonday: addDays(paschaDate, -48),     // First day of Great Lent
    // Holy Week
    palmSunday: addDays(paschaDate, -7),       // Entry into Jerusalem
    holyThursday: addDays(paschaDate, -3),     // Mystical Supper
    holyFriday: addDays(paschaDate, -2),       // Crucifixion
    holySaturday: addDays(paschaDate, -1),     // Great and Holy Saturday
    // Paschal Season
    ascension: addDays(paschaDate, 39),        // 40th day (counting Pascha as day 1)
    pentecost: addDays(paschaDate, 49),        // 50th day
    // After Pentecost
    allSaints: addDays(paschaDate, 56),        // First Sunday after Pentecost
    apostlesFastStart: addDays(paschaDate, 57), // Monday after All Saints
  }
}

/**
 * Get the Pascha offset (days from Pascha) for a given date
 *
 * @param date - The date to calculate offset for
 * @param year - The year (needed to calculate Pascha)
 * @param tradition - Which calendar tradition to use
 * @returns Number of days from Pascha (negative = before, positive = after)
 */
export function getPaschaOffset(
  date: Date,
  year: number,
  tradition: OrthodoxTradition = 'JULIAN'
): number {
  const pascha = calculatePascha(year, tradition)
  const paschaDate = tradition === 'JULIAN' ? pascha.julianDate : pascha.gregorianDate

  const diffTime = date.getTime() - paschaDate.getTime()
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24))

  return diffDays
}

/**
 * Get the date for a given Pascha offset
 *
 * @param year - The year
 * @param offset - Days from Pascha (negative = before, positive = after)
 * @param tradition - Which calendar tradition to use
 * @returns The date corresponding to the offset
 */
export function getDateFromPaschaOffset(
  year: number,
  offset: number,
  tradition: OrthodoxTradition = 'JULIAN'
): Date {
  const pascha = calculatePascha(year, tradition)
  const paschaDate = tradition === 'JULIAN' ? pascha.julianDate : pascha.gregorianDate

  const result = new Date(paschaDate)
  result.setUTCDate(result.getUTCDate() + offset)

  return result
}

/**
 * Convert a Julian calendar date to Gregorian
 *
 * @param julianDate - Date in Julian calendar
 * @returns Date in Gregorian calendar
 */
export function julianToGregorian(julianDate: Date): Date {
  const year = julianDate.getUTCFullYear()
  const offset = getJulianToGregorianOffset(year)

  const gregorianDate = new Date(julianDate)
  gregorianDate.setUTCDate(gregorianDate.getUTCDate() + offset)

  return gregorianDate
}

/**
 * Convert a Gregorian calendar date to Julian
 *
 * @param gregorianDate - Date in Gregorian calendar
 * @returns Date in Julian calendar
 */
export function gregorianToJulian(gregorianDate: Date): Date {
  const year = gregorianDate.getUTCFullYear()
  const offset = getJulianToGregorianOffset(year)

  const julianDate = new Date(gregorianDate)
  julianDate.setUTCDate(julianDate.getUTCDate() - offset)

  return julianDate
}

/**
 * Check if a year has Pascha on the same date for Eastern and Western churches
 *
 * This is relatively rare but does occur periodically.
 *
 * @param year - The year to check
 * @returns Boolean indicating if Pascha/Easter coincide
 */
export function isPaschaShared(year: number): boolean {
  const easternPascha = calculatePascha(year, 'JULIAN')
  const westernPascha = calculateWesternEaster(year)

  return easternPascha.gregorianDate.getTime() === westernPascha.getTime()
}

/**
 * Calculate Western Easter (Gregorian calendar computation)
 *
 * Uses the Anonymous Gregorian algorithm.
 *
 * @param year - The year to calculate Easter for
 * @returns Date of Western Easter
 */
export function calculateWesternEaster(year: number): Date {
  const a = year % 19
  const b = Math.floor(year / 100)
  const c = year % 100
  const d = Math.floor(b / 4)
  const e = b % 4
  const f = Math.floor((b + 8) / 25)
  const g = Math.floor((b - f + 1) / 3)
  const h = (19 * a + b - d - g + 15) % 30
  const i = Math.floor(c / 4)
  const k = c % 4
  const l = (32 + 2 * e + 2 * i - h - k) % 7
  const m = Math.floor((a + 11 * h + 22 * l) / 451)
  const month = Math.floor((h + l - 7 * m + 114) / 31)
  const day = ((h + l - 7 * m + 114) % 31) + 1

  return new Date(Date.UTC(year, month - 1, day))
}

/**
 * Get the liturgical year for a given date
 *
 * The Orthodox liturgical year begins on September 1 (Old Style September 14)
 *
 * @param date - The date to check
 * @param tradition - Which calendar tradition to use
 * @returns The liturgical year
 */
export function getLiturgicalYear(date: Date, tradition: OrthodoxTradition = 'JULIAN'): number {
  const year = date.getUTCFullYear()
  const month = date.getUTCMonth() // 0-indexed

  // Liturgical year starts September 1
  // If we're in September-December, we're in the liturgical year that started this calendar year
  // If we're in January-August, we're in the liturgical year that started last calendar year
  if (month >= 8) {
    // September (8) or later
    return year
  } else {
    return year - 1
  }
}

/**
 * Pre-calculated Pascha dates for common years (for performance)
 *
 * Gregorian dates when Pascha falls using the Julian calculation
 */
export const PASCHA_DATES: Record<number, string> = {
  2020: '2020-04-19',
  2021: '2021-05-02',
  2022: '2022-04-24',
  2023: '2023-04-16',
  2024: '2024-05-05',
  2025: '2025-04-20',
  2026: '2026-04-12',
  2027: '2027-05-02',
  2028: '2028-04-16',
  2029: '2029-04-08',
  2030: '2030-04-28',
  2031: '2031-04-13',
  2032: '2032-05-02',
  2033: '2033-04-24',
  2034: '2034-04-09',
  2035: '2035-04-29',
}
