import { describe, it, expect } from 'vitest'
import {
  calculatePascha,
  getJulianToGregorianOffset,
  calculateMoveableFeastDates,
  getPaschaOffset,
  getDateFromPaschaOffset,
  julianToGregorian,
  gregorianToJulian,
  isPaschaShared,
  calculateWesternEaster,
  getLiturgicalYear,
  PASCHA_DATES,
} from '../utils/pascha'
import type { OrthodoxTradition } from '../types'

describe('pascha utilities', () => {
  describe('calculatePascha', () => {
    describe('JULIAN tradition (Orthodox Eastern)', () => {
      it('should calculate Pascha 2024 correctly (May 5 Gregorian)', () => {
        const pascha = calculatePascha(2024, 'JULIAN')

        expect(pascha.year).toBe(2024)
        expect(pascha.tradition).toBe('JULIAN')
        // Orthodox Pascha 2024 falls on May 5 in Gregorian calendar
        expect(pascha.gregorianDate.getUTCFullYear()).toBe(2024)
        expect(pascha.gregorianDate.getUTCMonth()).toBe(4) // May is month 4 (0-indexed)
        expect(pascha.gregorianDate.getUTCDate()).toBe(5)
      })

      it('should calculate Pascha 2025 correctly (April 20 Gregorian)', () => {
        const pascha = calculatePascha(2025, 'JULIAN')

        expect(pascha.year).toBe(2025)
        // Orthodox Pascha 2025 falls on April 20 in Gregorian calendar
        expect(pascha.gregorianDate.getUTCFullYear()).toBe(2025)
        expect(pascha.gregorianDate.getUTCMonth()).toBe(3) // April is month 3
        expect(pascha.gregorianDate.getUTCDate()).toBe(20)
      })

      it('should calculate Pascha 2023 correctly (April 16 Gregorian)', () => {
        const pascha = calculatePascha(2023, 'JULIAN')

        expect(pascha.gregorianDate.getUTCFullYear()).toBe(2023)
        expect(pascha.gregorianDate.getUTCMonth()).toBe(3) // April
        expect(pascha.gregorianDate.getUTCDate()).toBe(16)
      })

      it('should calculate Pascha 2026 correctly (April 12 Gregorian)', () => {
        const pascha = calculatePascha(2026, 'JULIAN')

        expect(pascha.gregorianDate.getUTCFullYear()).toBe(2026)
        expect(pascha.gregorianDate.getUTCMonth()).toBe(3) // April
        expect(pascha.gregorianDate.getUTCDate()).toBe(12)
      })

      it('should default to JULIAN tradition when not specified', () => {
        const pascha = calculatePascha(2024)
        expect(pascha.tradition).toBe('JULIAN')
      })

      it('should return both Julian and Gregorian dates', () => {
        const pascha = calculatePascha(2024, 'JULIAN')

        expect(pascha.julianDate).toBeInstanceOf(Date)
        expect(pascha.gregorianDate).toBeInstanceOf(Date)
        // Gregorian date should be 13 days ahead of Julian in 20th-21st century
        const diffMs = pascha.gregorianDate.getTime() - pascha.julianDate.getTime()
        const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24))
        expect(diffDays).toBe(13)
      })
    })

    describe('GREGORIAN tradition', () => {
      // Note: calculatePascha always uses Julian Pascha algorithm
      // The tradition parameter only affects which date is returned for offsets
      it('should set GREGORIAN as the tradition', () => {
        const pascha = calculatePascha(2024, 'GREGORIAN')

        expect(pascha.tradition).toBe('GREGORIAN')
      })

      it('should still calculate Julian-based Pascha (algorithm does not change)', () => {
        // The calculatePascha function always uses Julian Pascha algorithm
        // Only the tradition label changes - moveable feasts will use gregorianDate
        const paschaJulian = calculatePascha(2024, 'JULIAN')
        const paschaGregorian = calculatePascha(2024, 'GREGORIAN')

        // Both should have the same underlying dates calculated
        expect(paschaGregorian.gregorianDate.getTime()).toBe(paschaJulian.gregorianDate.getTime())
        expect(paschaGregorian.julianDate.getTime()).toBe(paschaJulian.julianDate.getTime())
      })
    })

    describe('REVISED_JULIAN tradition', () => {
      it('should calculate Pascha using Julian calendar for Pascha computation', () => {
        // Revised Julian still uses Julian calendar for Pascha calculation
        const pascha = calculatePascha(2024, 'REVISED_JULIAN')

        expect(pascha.tradition).toBe('REVISED_JULIAN')
        // Should be same as JULIAN for Pascha
        expect(pascha.gregorianDate.getUTCMonth()).toBe(4) // May
        expect(pascha.gregorianDate.getUTCDate()).toBe(5)
      })
    })

    describe('historical years', () => {
      it('should calculate Pascha for year 2020 correctly', () => {
        const pascha = calculatePascha(2020, 'JULIAN')

        expect(pascha.gregorianDate.getUTCFullYear()).toBe(2020)
        expect(pascha.gregorianDate.getUTCMonth()).toBe(3) // April
        expect(pascha.gregorianDate.getUTCDate()).toBe(19)
      })

      it('should calculate Pascha for year 2030 correctly', () => {
        const pascha = calculatePascha(2030, 'JULIAN')

        expect(pascha.gregorianDate.getUTCFullYear()).toBe(2030)
        expect(pascha.gregorianDate.getUTCMonth()).toBe(3) // April
        expect(pascha.gregorianDate.getUTCDate()).toBe(28)
      })
    })

    describe('Pascha dates constant verification', () => {
      it('should match pre-calculated PASCHA_DATES constant', () => {
        for (const [yearStr, dateStr] of Object.entries(PASCHA_DATES)) {
          const year = parseInt(yearStr, 10)
          const pascha = calculatePascha(year, 'JULIAN')
          const expectedDate = new Date(dateStr)

          expect(pascha.gregorianDate.getUTCFullYear()).toBe(expectedDate.getUTCFullYear())
          expect(pascha.gregorianDate.getUTCMonth()).toBe(expectedDate.getUTCMonth())
          expect(pascha.gregorianDate.getUTCDate()).toBe(expectedDate.getUTCDate())
        }
      })
    })
  })

  describe('getJulianToGregorianOffset', () => {
    it('should return 0 for years before 1582', () => {
      expect(getJulianToGregorianOffset(1500)).toBe(0)
      expect(getJulianToGregorianOffset(1581)).toBe(0)
    })

    it('should return 10 for years 1582-1699', () => {
      expect(getJulianToGregorianOffset(1582)).toBe(10)
      expect(getJulianToGregorianOffset(1600)).toBe(10)
      expect(getJulianToGregorianOffset(1699)).toBe(10)
    })

    it('should return 11 for years 1700-1799', () => {
      expect(getJulianToGregorianOffset(1700)).toBe(11)
      expect(getJulianToGregorianOffset(1750)).toBe(11)
      expect(getJulianToGregorianOffset(1799)).toBe(11)
    })

    it('should return 12 for years 1800-1899', () => {
      expect(getJulianToGregorianOffset(1800)).toBe(12)
      expect(getJulianToGregorianOffset(1850)).toBe(12)
      expect(getJulianToGregorianOffset(1899)).toBe(12)
    })

    it('should return 13 for years 1900-2099', () => {
      expect(getJulianToGregorianOffset(1900)).toBe(13)
      expect(getJulianToGregorianOffset(2000)).toBe(13)
      expect(getJulianToGregorianOffset(2024)).toBe(13)
      expect(getJulianToGregorianOffset(2099)).toBe(13)
    })

    it('should return 14 for years 2100-2199', () => {
      expect(getJulianToGregorianOffset(2100)).toBe(14)
      expect(getJulianToGregorianOffset(2150)).toBe(14)
    })
  })

  describe('calculateMoveableFeastDates', () => {
    it('should return all moveable feast dates for a given year', () => {
      const feasts = calculateMoveableFeastDates(2024, 'JULIAN')

      expect(feasts.year).toBe(2024)
      expect(feasts.pascha).toBeInstanceOf(Date)
      expect(feasts.meatfare).toBeInstanceOf(Date)
      expect(feasts.cheesefare).toBeInstanceOf(Date)
      expect(feasts.cleanMonday).toBeInstanceOf(Date)
      expect(feasts.palmSunday).toBeInstanceOf(Date)
      expect(feasts.holyThursday).toBeInstanceOf(Date)
      expect(feasts.holyFriday).toBeInstanceOf(Date)
      expect(feasts.holySaturday).toBeInstanceOf(Date)
      expect(feasts.ascension).toBeInstanceOf(Date)
      expect(feasts.pentecost).toBeInstanceOf(Date)
      expect(feasts.allSaints).toBeInstanceOf(Date)
      expect(feasts.apostlesFastStart).toBeInstanceOf(Date)
    })

    it('should calculate correct offsets from Pascha', () => {
      const feasts = calculateMoveableFeastDates(2024, 'JULIAN')
      const paschaTime = feasts.pascha.getTime()
      const dayMs = 24 * 60 * 60 * 1000

      // Meatfare is 56 days before Pascha
      expect(Math.round((paschaTime - feasts.meatfare.getTime()) / dayMs)).toBe(56)

      // Cheesefare is 49 days before Pascha
      expect(Math.round((paschaTime - feasts.cheesefare.getTime()) / dayMs)).toBe(49)

      // Clean Monday is 48 days before Pascha
      expect(Math.round((paschaTime - feasts.cleanMonday.getTime()) / dayMs)).toBe(48)

      // Palm Sunday is 7 days before Pascha
      expect(Math.round((paschaTime - feasts.palmSunday.getTime()) / dayMs)).toBe(7)

      // Holy Thursday is 3 days before Pascha
      expect(Math.round((paschaTime - feasts.holyThursday.getTime()) / dayMs)).toBe(3)

      // Holy Friday is 2 days before Pascha
      expect(Math.round((paschaTime - feasts.holyFriday.getTime()) / dayMs)).toBe(2)

      // Holy Saturday is 1 day before Pascha
      expect(Math.round((paschaTime - feasts.holySaturday.getTime()) / dayMs)).toBe(1)

      // Ascension is 39 days after Pascha
      expect(Math.round((feasts.ascension.getTime() - paschaTime) / dayMs)).toBe(39)

      // Pentecost is 49 days after Pascha
      expect(Math.round((feasts.pentecost.getTime() - paschaTime) / dayMs)).toBe(49)

      // All Saints is 56 days after Pascha
      expect(Math.round((feasts.allSaints.getTime() - paschaTime) / dayMs)).toBe(56)

      // Apostles Fast Start is 57 days after Pascha
      expect(Math.round((feasts.apostlesFastStart.getTime() - paschaTime) / dayMs)).toBe(57)
    })

    it('should use gregorianDate for non-JULIAN traditions', () => {
      const feastsJulian = calculateMoveableFeastDates(2024, 'JULIAN')
      const feastsGregorian = calculateMoveableFeastDates(2024, 'GREGORIAN')

      // For JULIAN tradition, the function uses julianDate
      // For GREGORIAN tradition, the function uses gregorianDate
      // The pascha dates should differ by 13 days (the Julian-Gregorian offset)
      const diffMs = feastsGregorian.pascha.getTime() - feastsJulian.pascha.getTime()
      const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24))
      expect(diffDays).toBe(13)
    })
  })

  describe('getPaschaOffset', () => {
    it('should return 0 for Pascha date itself (Julian)', () => {
      const pascha = calculatePascha(2024, 'JULIAN')
      // For JULIAN tradition, getPaschaOffset compares against julianDate
      const offset = getPaschaOffset(pascha.julianDate, 2024, 'JULIAN')

      expect(offset).toBe(0)
    })

    it('should return negative offset for dates before Pascha', () => {
      const pascha = calculatePascha(2024, 'JULIAN')
      const weekBefore = new Date(pascha.julianDate)
      weekBefore.setUTCDate(weekBefore.getUTCDate() - 7)

      const offset = getPaschaOffset(weekBefore, 2024, 'JULIAN')
      expect(offset).toBe(-7)
    })

    it('should return positive offset for dates after Pascha', () => {
      const pascha = calculatePascha(2024, 'JULIAN')
      const dayAfter = new Date(pascha.julianDate)
      dayAfter.setUTCDate(dayAfter.getUTCDate() + 49)

      const offset = getPaschaOffset(dayAfter, 2024, 'JULIAN')
      expect(offset).toBe(49) // Pentecost
    })

    it('should use gregorianDate when tradition is GREGORIAN', () => {
      const pascha = calculatePascha(2024, 'GREGORIAN')
      // For GREGORIAN tradition, getPaschaOffset compares against gregorianDate
      const offset = getPaschaOffset(pascha.gregorianDate, 2024, 'GREGORIAN')

      expect(offset).toBe(0)
    })
  })

  describe('getDateFromPaschaOffset', () => {
    it('should return Pascha date for offset 0', () => {
      const pascha = calculatePascha(2024, 'JULIAN')
      const dateFromOffset = getDateFromPaschaOffset(2024, 0, 'JULIAN')

      expect(dateFromOffset.getTime()).toBe(pascha.julianDate.getTime())
    })

    it('should return correct date for Pentecost (offset 49)', () => {
      const feasts = calculateMoveableFeastDates(2024, 'JULIAN')
      const pentecostFromOffset = getDateFromPaschaOffset(2024, 49, 'JULIAN')

      expect(pentecostFromOffset.getTime()).toBe(feasts.pentecost.getTime())
    })

    it('should return correct date for Palm Sunday (offset -7)', () => {
      const feasts = calculateMoveableFeastDates(2024, 'JULIAN')
      const palmSundayFromOffset = getDateFromPaschaOffset(2024, -7, 'JULIAN')

      expect(palmSundayFromOffset.getTime()).toBe(feasts.palmSunday.getTime())
    })

    it('should be the inverse of getPaschaOffset', () => {
      const year = 2024
      const tradition: OrthodoxTradition = 'JULIAN'

      // Test round-trip for several offsets
      const offsets = [-56, -49, -7, 0, 39, 49, 56]

      for (const offset of offsets) {
        const date = getDateFromPaschaOffset(year, offset, tradition)
        const calculatedOffset = getPaschaOffset(date, year, tradition)
        expect(calculatedOffset).toBe(offset)
      }
    })
  })

  describe('julianToGregorian', () => {
    it('should convert Julian date to Gregorian correctly', () => {
      // Julian April 22, 2024 should be Gregorian May 5, 2024
      const julianDate = new Date(Date.UTC(2024, 3, 22)) // April 22 in Julian
      const gregorianDate = julianToGregorian(julianDate)

      expect(gregorianDate.getUTCMonth()).toBe(4) // May
      expect(gregorianDate.getUTCDate()).toBe(5)
    })

    it('should add 13 days in the 20th-21st century', () => {
      const julianDate = new Date(Date.UTC(2024, 0, 1)) // Jan 1, 2024 Julian
      const gregorianDate = julianToGregorian(julianDate)

      expect(gregorianDate.getUTCMonth()).toBe(0) // January
      expect(gregorianDate.getUTCDate()).toBe(14) // Jan 14
    })
  })

  describe('gregorianToJulian', () => {
    it('should convert Gregorian date to Julian correctly', () => {
      // Gregorian May 5, 2024 should be Julian April 22, 2024
      const gregorianDate = new Date(Date.UTC(2024, 4, 5)) // May 5
      const julianDate = gregorianToJulian(gregorianDate)

      expect(julianDate.getUTCMonth()).toBe(3) // April
      expect(julianDate.getUTCDate()).toBe(22)
    })

    it('should subtract 13 days in the 20th-21st century', () => {
      const gregorianDate = new Date(Date.UTC(2024, 0, 14)) // Jan 14, 2024 Gregorian
      const julianDate = gregorianToJulian(gregorianDate)

      expect(julianDate.getUTCMonth()).toBe(0) // January
      expect(julianDate.getUTCDate()).toBe(1) // Jan 1
    })

    it('should be the inverse of julianToGregorian', () => {
      const originalJulian = new Date(Date.UTC(2024, 5, 15))
      const gregorian = julianToGregorian(originalJulian)
      const backToJulian = gregorianToJulian(gregorian)

      expect(backToJulian.getTime()).toBe(originalJulian.getTime())
    })
  })

  describe('isPaschaShared', () => {
    it('should return true when Eastern and Western Easter coincide', () => {
      // 2025 is a year when they coincide (both April 20)
      expect(isPaschaShared(2025)).toBe(true)
    })

    it('should return false when Eastern and Western Easter differ', () => {
      // 2024: Western is March 31, Eastern is May 5
      expect(isPaschaShared(2024)).toBe(false)
    })
  })

  describe('calculateWesternEaster', () => {
    it('should calculate Western Easter 2024 correctly (March 31)', () => {
      const easter = calculateWesternEaster(2024)

      expect(easter.getUTCFullYear()).toBe(2024)
      expect(easter.getUTCMonth()).toBe(2) // March
      expect(easter.getUTCDate()).toBe(31)
    })

    it('should calculate Western Easter 2025 correctly (April 20)', () => {
      const easter = calculateWesternEaster(2025)

      expect(easter.getUTCFullYear()).toBe(2025)
      expect(easter.getUTCMonth()).toBe(3) // April
      expect(easter.getUTCDate()).toBe(20)
    })

    it('should calculate Western Easter 2023 correctly (April 9)', () => {
      const easter = calculateWesternEaster(2023)

      expect(easter.getUTCFullYear()).toBe(2023)
      expect(easter.getUTCMonth()).toBe(3) // April
      expect(easter.getUTCDate()).toBe(9)
    })
  })

  describe('getLiturgicalYear', () => {
    it('should return the same year for September-December dates', () => {
      // October 15, 2024 is in liturgical year 2024
      const date = new Date(Date.UTC(2024, 9, 15)) // October
      expect(getLiturgicalYear(date, 'JULIAN')).toBe(2024)
    })

    it('should return previous year for January-August dates', () => {
      // March 15, 2024 is in liturgical year 2023
      const date = new Date(Date.UTC(2024, 2, 15)) // March
      expect(getLiturgicalYear(date, 'JULIAN')).toBe(2023)
    })

    it('should return current year for September 1 (liturgical new year)', () => {
      const date = new Date(Date.UTC(2024, 8, 1)) // September 1
      expect(getLiturgicalYear(date, 'JULIAN')).toBe(2024)
    })

    it('should return previous year for August 31', () => {
      const date = new Date(Date.UTC(2024, 7, 31)) // August 31
      expect(getLiturgicalYear(date, 'JULIAN')).toBe(2023)
    })
  })
})
