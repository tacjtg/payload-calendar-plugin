import type { CollectionConfig, Field } from 'payload'
import type { CalendarPluginConfig } from '@payload-calendar/core'

/**
 * Orthodox calendar tradition (for Pascha calculation)
 */
export type OrthodoxTradition = 'JULIAN' | 'GREGORIAN' | 'REVISED_JULIAN'

/**
 * Feast level in the Orthodox typikon
 * 0 = Simple commemoration
 * 1 = Small doxology
 * 2 = Great doxology
 * 3 = Polyeleos
 * 4 = Great Feast (Twelve Great Feasts + Pascha)
 */
export type FeastLevel = 0 | 1 | 2 | 3 | 4

/**
 * Feast type categorization
 */
export type FeastType =
  | 'PASCHA'
  | 'GREAT_FEAST'
  | 'THEOTOKOS'
  | 'MAJOR'
  | 'MINOR'
  | 'COMMEMORATION'

/**
 * Liturgical colors used in Orthodox services
 */
export type LiturgicalColor =
  | 'WHITE'     // Pascha, Theophany, Transfiguration, funerals
  | 'GOLD'      // Ordinary Sundays, major feasts
  | 'RED'       // Martyrs, Holy Cross
  | 'BLUE'      // Theotokos feasts
  | 'GREEN'     // Palm Sunday, Pentecost, monastic saints
  | 'PURPLE'    // Great Lent, Advent
  | 'BLACK'     // Weekdays of Great Lent

/**
 * Fasting period types
 */
export type FastingPeriodType =
  | 'GREAT_LENT'
  | 'APOSTLES_FAST'
  | 'DORMITION_FAST'
  | 'NATIVITY_FAST'
  | 'WEEKLY'
  | 'SINGLE_DAY'

/**
 * Fasting levels
 */
export type FastingLevel =
  | 'STRICT'     // No food until evening, then xerophagy
  | 'XEROPHAGY'  // Dry eating - bread, water, fruit, vegetables
  | 'OIL'        // Xerophagy + oil
  | 'WINE'       // Xerophagy + wine
  | 'OIL_WINE'   // Xerophagy + oil + wine
  | 'FISH'       // Fish allowed
  | 'DAIRY'      // Dairy allowed (Cheesefare week)
  | 'NONE'       // No fasting

/**
 * Saint category
 */
export type SaintCategory =
  | 'APOSTLE'
  | 'PROPHET'
  | 'MARTYR'
  | 'GREAT_MARTYR'
  | 'HIEROMARTYR'
  | 'CONFESSOR'
  | 'HIERARCH'
  | 'MONASTIC'
  | 'UNMERCENARY'
  | 'FOOL_FOR_CHRIST'
  | 'EQUAL_TO_APOSTLES'
  | 'RIGHTEOUS'
  | 'PASSION_BEARER'
  | 'NEW_MARTYR'
  | 'BLESSED'

/**
 * Liturgical reading type
 */
export type ReadingType =
  | 'EPISTLE'
  | 'GOSPEL'
  | 'OLD_TESTAMENT'
  | 'PROPHECY'
  | 'PRAXIS'  // Acts of the Apostles (Paschal season)

/**
 * Feast day document
 */
export interface FeastDay {
  id: string
  name: string
  nameGreek?: string
  nameChurchSlavonic?: string
  date: string
  dateType: 'FIXED' | 'MOVEABLE'
  paschaOffset?: number  // Days from Pascha for moveable feasts
  feastLevel: FeastLevel
  feastType: FeastType
  liturgicalColor: LiturgicalColor
  isBankHoliday?: boolean
  troparion?: string
  kontakion?: string
  description?: string
  icon?: string
  createdAt: string
  updatedAt: string
}

/**
 * Fasting period document
 */
export interface FastingPeriod {
  id: string
  name: string
  nameGreek?: string
  type: FastingPeriodType
  startDate?: string
  endDate?: string
  paschaOffsetStart?: number  // For moveable periods
  paschaOffsetEnd?: number
  defaultLevel: FastingLevel
  description?: string
  createdAt: string
  updatedAt: string
}

/**
 * Saint document
 */
export interface Saint {
  id: string
  name: string
  nameGreek?: string
  nameChurchSlavonic?: string
  feastDate: string
  feastDateSecondary?: string  // Some saints have two feast days
  category: SaintCategory
  categories?: SaintCategory[]  // Multiple categories possible
  feastLevel: FeastLevel
  troparion?: string
  kontakion?: string
  biography?: string
  icon?: string
  relics?: string
  createdAt: string
  updatedAt: string
}

/**
 * Liturgical reading document
 */
export interface LiturgicalReading {
  id: string
  date: string
  dateType: 'FIXED' | 'MOVEABLE'
  paschaOffset?: number
  readingType: ReadingType
  book: string
  chapter: number
  verseStart: number
  verseEnd: number
  reference: string  // e.g., "Romans 6:3-11"
  text?: string
  serviceType: 'LITURGY' | 'VESPERS' | 'MATINS' | 'HOURS'
  occasion?: string  // Feast or occasion this reading is for
  createdAt: string
  updatedAt: string
}

/**
 * Orthodox calendar plugin configuration
 */
export interface OrthodoxCalendarPluginConfig {
  /**
   * Tradition for Pascha calculation (default: JULIAN)
   */
  tradition?: OrthodoxTradition

  /**
   * Collection configuration overrides
   */
  collections?: {
    feastDays?: {
      slug?: string
      fields?: Field[]
    }
    fastingPeriods?: {
      slug?: string
      fields?: Field[]
    }
    saints?: {
      slug?: string
      fields?: Field[]
    }
    readings?: {
      slug?: string
      fields?: Field[]
    }
  }

  /**
   * Feature flags
   */
  features?: {
    /** Enable feast days collection (default: true) */
    feastDays?: boolean
    /** Enable fasting periods collection (default: true) */
    fastingPeriods?: boolean
    /** Enable saints collection (default: true) */
    saints?: boolean
    /** Enable liturgical readings collection (default: true) */
    readings?: boolean
    /** Enable orthocal.info API sync (default: false) */
    orthocalSync?: boolean
  }

  /**
   * Admin panel configuration
   */
  admin?: {
    /** Admin group name (default: 'Orthodox Calendar') */
    group?: string
  }

  /**
   * Multi-tenant configuration (inherited from core plugin)
   */
  multiTenant?: {
    tenantField: string
    tenantCollection?: string
  }

  /**
   * Custom hooks for collections
   */
  hooks?: {
    feastDays?: CollectionConfig['hooks']
    fastingPeriods?: CollectionConfig['hooks']
    saints?: CollectionConfig['hooks']
    readings?: CollectionConfig['hooks']
  }

  /**
   * Core calendar plugin config to extend
   */
  coreConfig?: CalendarPluginConfig
}

/**
 * Orthodox collection builder options
 */
export interface OrthodoxCollectionOptions {
  slug: string
  multiTenant?: {
    tenantField: string
    tenantCollection?: string
  }
  additionalFields?: Field[]
  hooks?: CollectionConfig['hooks']
  adminGroup?: string
}

/**
 * Pascha calculation result
 */
export interface PaschaDate {
  year: number
  julianDate: Date
  gregorianDate: Date
  tradition: OrthodoxTradition
}

/**
 * Moveable feast dates for a given year
 */
export interface MoveableFeastDates {
  year: number
  pascha: Date
  meatfare: Date
  cheesefare: Date
  cleanMonday: Date
  palmSunday: Date
  holyThursday: Date
  holyFriday: Date
  holySaturday: Date
  ascension: Date
  pentecost: Date
  allSaints: Date
  apostlesFastStart: Date
}

/**
 * Orthocal.info API response types
 */
export interface OrthocalDay {
  year: number
  month: number
  day: number
  pascha_distance: number
  julian_day_number: number
  weekday: string
  tone: number
  titles: string[]
  feast_level: number
  feast_level_description: string
  fast_level: number
  fast_level_description: string
  fast_exception?: string
  saints: OrthocalSaint[]
  readings: OrthocalReading[]
}

export interface OrthocalSaint {
  name: string
  title?: string
  has_icon: boolean
}

export interface OrthocalReading {
  source: string
  book: string
  description: string
  display: string
  short_display: string
  passage?: string
}

/**
 * Pre-configured Orthodox calendar sources
 */
export interface OrthodoxCalendarSources {
  feastDays: {
    slug: string
    name: string
    color: string
    icon: string
  }
  fasting: {
    slug: string
    name: string
    color: string
    icon: string
  }
  saints: {
    slug: string
    name: string
    color: string
    icon: string
  }
  liturgicalServices: {
    slug: string
    name: string
    color: string
    icon: string
  }
}
