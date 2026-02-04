import type { CollectionConfig, Field } from 'payload'
import type { OrthodoxCollectionOptions } from '../types'

/**
 * Liturgical Readings Collection
 *
 * Scripture readings for Orthodox liturgical services:
 * - Epistle readings (Apostol)
 * - Gospel readings
 * - Old Testament readings (for Vespers, Great Feasts)
 * - Prophecy readings (Holy Week, Great Feasts)
 *
 * Supports both fixed dates and moveable readings (relative to Pascha)
 */
export const LiturgicalReadings = (options: OrthodoxCollectionOptions): CollectionConfig => {
  const {
    slug,
    multiTenant,
    additionalFields = [],
    hooks: customHooks = {},
    adminGroup = 'Orthodox Calendar',
  } = options

  const fields: Field[] = [
    // Date Configuration
    {
      name: 'dateType',
      type: 'select',
      required: true,
      defaultValue: 'MOVEABLE',
      options: [
        { label: 'Fixed Date', value: 'FIXED' },
        { label: 'Moveable (relative to Pascha)', value: 'MOVEABLE' },
      ],
      admin: {
        description: 'Whether this reading is for a fixed date or moves with Pascha',
      },
    },
    {
      name: 'date',
      type: 'date',
      admin: {
        condition: (data) => data?.dateType === 'FIXED',
        description: 'Fixed date for this reading (year ignored)',
        date: {
          pickerAppearance: 'dayOnly',
        },
      },
    },
    {
      name: 'paschaOffset',
      type: 'number',
      admin: {
        condition: (data) => data?.dateType === 'MOVEABLE',
        description: 'Days from Pascha (e.g., 0 for Pascha, -49 for Clean Monday)',
      },
    },

    // Reading Type
    {
      type: 'row',
      fields: [
        {
          name: 'readingType',
          type: 'select',
          required: true,
          options: [
            { label: 'Epistle', value: 'EPISTLE' },
            { label: 'Gospel', value: 'GOSPEL' },
            { label: 'Old Testament', value: 'OLD_TESTAMENT' },
            { label: 'Prophecy', value: 'PROPHECY' },
            { label: 'Praxis (Acts - Paschal season)', value: 'PRAXIS' },
          ],
          admin: {
            width: '50%',
            description: 'Type of reading',
          },
        },
        {
          name: 'serviceType',
          type: 'select',
          required: true,
          defaultValue: 'LITURGY',
          options: [
            { label: 'Divine Liturgy', value: 'LITURGY' },
            { label: 'Vespers', value: 'VESPERS' },
            { label: 'Matins', value: 'MATINS' },
            { label: 'Hours', value: 'HOURS' },
            { label: 'Presanctified Liturgy', value: 'PRESANCTIFIED' },
          ],
          admin: {
            width: '50%',
            description: 'Service where this reading is used',
          },
        },
      ],
    },

    // Scripture Reference
    {
      name: 'book',
      type: 'select',
      required: true,
      options: [
        // Old Testament
        { label: 'Genesis', value: 'GEN' },
        { label: 'Exodus', value: 'EXO' },
        { label: 'Leviticus', value: 'LEV' },
        { label: 'Numbers', value: 'NUM' },
        { label: 'Deuteronomy', value: 'DEU' },
        { label: 'Joshua', value: 'JOS' },
        { label: 'Judges', value: 'JDG' },
        { label: 'Ruth', value: 'RUT' },
        { label: '1 Samuel (1 Kingdoms)', value: '1SA' },
        { label: '2 Samuel (2 Kingdoms)', value: '2SA' },
        { label: '1 Kings (3 Kingdoms)', value: '1KI' },
        { label: '2 Kings (4 Kingdoms)', value: '2KI' },
        { label: '1 Chronicles', value: '1CH' },
        { label: '2 Chronicles', value: '2CH' },
        { label: 'Ezra', value: 'EZR' },
        { label: 'Nehemiah', value: 'NEH' },
        { label: 'Esther', value: 'EST' },
        { label: 'Job', value: 'JOB' },
        { label: 'Psalms', value: 'PSA' },
        { label: 'Proverbs', value: 'PRO' },
        { label: 'Ecclesiastes', value: 'ECC' },
        { label: 'Song of Solomon', value: 'SNG' },
        { label: 'Isaiah', value: 'ISA' },
        { label: 'Jeremiah', value: 'JER' },
        { label: 'Lamentations', value: 'LAM' },
        { label: 'Ezekiel', value: 'EZK' },
        { label: 'Daniel', value: 'DAN' },
        { label: 'Hosea', value: 'HOS' },
        { label: 'Joel', value: 'JOL' },
        { label: 'Amos', value: 'AMO' },
        { label: 'Obadiah', value: 'OBA' },
        { label: 'Jonah', value: 'JON' },
        { label: 'Micah', value: 'MIC' },
        { label: 'Nahum', value: 'NAM' },
        { label: 'Habakkuk', value: 'HAB' },
        { label: 'Zephaniah', value: 'ZEP' },
        { label: 'Haggai', value: 'HAG' },
        { label: 'Zechariah', value: 'ZEC' },
        { label: 'Malachi', value: 'MAL' },
        // Deuterocanonical
        { label: 'Tobit', value: 'TOB' },
        { label: 'Judith', value: 'JDT' },
        { label: 'Wisdom of Solomon', value: 'WIS' },
        { label: 'Sirach (Ecclesiasticus)', value: 'SIR' },
        { label: 'Baruch', value: 'BAR' },
        { label: '1 Maccabees', value: '1MA' },
        { label: '2 Maccabees', value: '2MA' },
        { label: '3 Maccabees', value: '3MA' },
        // New Testament
        { label: 'Matthew', value: 'MAT' },
        { label: 'Mark', value: 'MRK' },
        { label: 'Luke', value: 'LUK' },
        { label: 'John', value: 'JHN' },
        { label: 'Acts', value: 'ACT' },
        { label: 'Romans', value: 'ROM' },
        { label: '1 Corinthians', value: '1CO' },
        { label: '2 Corinthians', value: '2CO' },
        { label: 'Galatians', value: 'GAL' },
        { label: 'Ephesians', value: 'EPH' },
        { label: 'Philippians', value: 'PHP' },
        { label: 'Colossians', value: 'COL' },
        { label: '1 Thessalonians', value: '1TH' },
        { label: '2 Thessalonians', value: '2TH' },
        { label: '1 Timothy', value: '1TI' },
        { label: '2 Timothy', value: '2TI' },
        { label: 'Titus', value: 'TIT' },
        { label: 'Philemon', value: 'PHM' },
        { label: 'Hebrews', value: 'HEB' },
        { label: 'James', value: 'JAS' },
        { label: '1 Peter', value: '1PE' },
        { label: '2 Peter', value: '2PE' },
        { label: '1 John', value: '1JN' },
        { label: '2 John', value: '2JN' },
        { label: '3 John', value: '3JN' },
        { label: 'Jude', value: 'JUD' },
        { label: 'Revelation', value: 'REV' },
      ],
      admin: {
        description: 'Book of the Bible',
      },
    },
    {
      type: 'row',
      fields: [
        {
          name: 'chapter',
          type: 'number',
          required: true,
          min: 1,
          admin: {
            width: '33%',
            description: 'Chapter number',
          },
        },
        {
          name: 'verseStart',
          type: 'number',
          required: true,
          min: 1,
          admin: {
            width: '33%',
            description: 'Starting verse',
          },
        },
        {
          name: 'verseEnd',
          type: 'number',
          required: true,
          min: 1,
          admin: {
            width: '33%',
            description: 'Ending verse',
          },
        },
      ],
    },
    {
      name: 'reference',
      type: 'text',
      required: true,
      admin: {
        description: 'Full reference (e.g., "Romans 6:3-11")',
      },
      hooks: {
        beforeValidate: [
          ({ value, data }) => {
            // Auto-generate reference if not provided
            if (!value && data?.book && data?.chapter && data?.verseStart) {
              const bookNames: Record<string, string> = {
                GEN: 'Genesis', EXO: 'Exodus', LEV: 'Leviticus', NUM: 'Numbers',
                DEU: 'Deuteronomy', JOS: 'Joshua', JDG: 'Judges', RUT: 'Ruth',
                '1SA': '1 Samuel', '2SA': '2 Samuel', '1KI': '1 Kings', '2KI': '2 Kings',
                '1CH': '1 Chronicles', '2CH': '2 Chronicles', EZR: 'Ezra', NEH: 'Nehemiah',
                EST: 'Esther', JOB: 'Job', PSA: 'Psalms', PRO: 'Proverbs',
                ECC: 'Ecclesiastes', SNG: 'Song of Solomon', ISA: 'Isaiah', JER: 'Jeremiah',
                LAM: 'Lamentations', EZK: 'Ezekiel', DAN: 'Daniel', HOS: 'Hosea',
                JOL: 'Joel', AMO: 'Amos', OBA: 'Obadiah', JON: 'Jonah',
                MIC: 'Micah', NAM: 'Nahum', HAB: 'Habakkuk', ZEP: 'Zephaniah',
                HAG: 'Haggai', ZEC: 'Zechariah', MAL: 'Malachi',
                TOB: 'Tobit', JDT: 'Judith', WIS: 'Wisdom', SIR: 'Sirach',
                BAR: 'Baruch', '1MA': '1 Maccabees', '2MA': '2 Maccabees', '3MA': '3 Maccabees',
                MAT: 'Matthew', MRK: 'Mark', LUK: 'Luke', JHN: 'John',
                ACT: 'Acts', ROM: 'Romans', '1CO': '1 Corinthians', '2CO': '2 Corinthians',
                GAL: 'Galatians', EPH: 'Ephesians', PHP: 'Philippians', COL: 'Colossians',
                '1TH': '1 Thessalonians', '2TH': '2 Thessalonians',
                '1TI': '1 Timothy', '2TI': '2 Timothy', TIT: 'Titus', PHM: 'Philemon',
                HEB: 'Hebrews', JAS: 'James', '1PE': '1 Peter', '2PE': '2 Peter',
                '1JN': '1 John', '2JN': '2 John', '3JN': '3 John', JUD: 'Jude', REV: 'Revelation',
              }
              const bookName = bookNames[data.book as string] ?? data.book
              const verseRange = data.verseEnd && data.verseEnd !== data.verseStart
                ? `${data.verseStart}-${data.verseEnd}`
                : String(data.verseStart)
              return `${bookName} ${data.chapter}:${verseRange}`
            }
            return value
          },
        ],
      },
    },

    // Text
    {
      name: 'text',
      type: 'richText',
      admin: {
        description: 'Full text of the reading (optional - can be fetched from API)',
      },
    },

    // Occasion
    {
      name: 'occasion',
      type: 'text',
      admin: {
        description: 'Specific feast or occasion (e.g., "Nativity of Christ", "Sunday of Orthodoxy")',
      },
    },
    {
      name: 'weekNumber',
      type: 'number',
      admin: {
        description: 'Week number in the liturgical cycle (for ordinary readings)',
      },
    },
    {
      name: 'tone',
      type: 'select',
      options: [
        { label: 'Tone 1', value: '1' },
        { label: 'Tone 2', value: '2' },
        { label: 'Tone 3', value: '3' },
        { label: 'Tone 4', value: '4' },
        { label: 'Tone 5', value: '5' },
        { label: 'Tone 6', value: '6' },
        { label: 'Tone 7', value: '7' },
        { label: 'Tone 8', value: '8' },
      ],
      admin: {
        description: 'Octoechos tone (for weekly cycle readings)',
      },
    },

    // Priority
    {
      name: 'priority',
      type: 'number',
      defaultValue: 0,
      admin: {
        description: 'Priority for when multiple readings apply (higher = more important)',
      },
    },

    // Multi-tenant field (if enabled)
    ...(multiTenant
      ? [
          {
            name: multiTenant.tenantField,
            type: 'relationship',
            relationTo: multiTenant.tenantCollection ?? 'tenants',
            required: true,
            admin: {
              position: 'sidebar',
              description: 'Parish/Organization this reading belongs to',
            },
          } as Field,
        ]
      : []),

    // Additional custom fields
    ...additionalFields,
  ]

  return {
    slug,
    admin: {
      useAsTitle: 'reference',
      defaultColumns: ['reference', 'readingType', 'serviceType', 'occasion', 'paschaOffset'],
      group: adminGroup,
      description: 'Liturgical scripture readings',
    },
    fields,
    hooks: customHooks,
    timestamps: true,
  }
}
