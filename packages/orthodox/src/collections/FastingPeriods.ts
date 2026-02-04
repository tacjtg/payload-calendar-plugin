import type { CollectionConfig, Field } from 'payload'
import type { OrthodoxCollectionOptions } from '../types'

/**
 * Fasting Periods Collection
 *
 * Orthodox fasting periods and rules:
 * - Great Lent (moveable, 40 days before Pascha)
 * - Apostles' Fast (moveable, after Pentecost)
 * - Dormition Fast (fixed, August 1-14)
 * - Nativity Fast (fixed, November 15 - December 24)
 * - Weekly fasts (Wednesdays and Fridays)
 * - Single-day fasts (Eve of Theophany, Beheading of John Baptist, etc.)
 */
export const FastingPeriods = (options: OrthodoxCollectionOptions): CollectionConfig => {
  const {
    slug,
    multiTenant,
    additionalFields = [],
    hooks: customHooks = {},
    adminGroup = 'Orthodox Calendar',
  } = options

  const fields: Field[] = [
    // Basic Info
    {
      type: 'row',
      fields: [
        {
          name: 'name',
          type: 'text',
          required: true,
          admin: {
            width: '50%',
            description: 'Fasting period name in English',
          },
        },
        {
          name: 'nameGreek',
          type: 'text',
          admin: {
            width: '50%',
            description: 'Fasting period name in Greek',
          },
        },
      ],
    },

    // Type Classification
    {
      name: 'type',
      type: 'select',
      required: true,
      options: [
        { label: 'Great Lent', value: 'GREAT_LENT' },
        { label: "Apostles' Fast", value: 'APOSTLES_FAST' },
        { label: 'Dormition Fast', value: 'DORMITION_FAST' },
        { label: 'Nativity Fast', value: 'NATIVITY_FAST' },
        { label: 'Weekly Fast (Wed/Fri)', value: 'WEEKLY' },
        { label: 'Single Day Fast', value: 'SINGLE_DAY' },
      ],
      admin: {
        description: 'Type of fasting period',
      },
    },

    // Date Configuration
    {
      name: 'dateType',
      type: 'select',
      required: true,
      defaultValue: 'FIXED',
      options: [
        { label: 'Fixed Dates', value: 'FIXED' },
        { label: 'Moveable (relative to Pascha)', value: 'MOVEABLE' },
      ],
      admin: {
        description: 'Whether this period has fixed dates or moves with Pascha',
      },
    },
    {
      type: 'row',
      fields: [
        {
          name: 'startDate',
          type: 'date',
          admin: {
            width: '50%',
            condition: (data) => data?.dateType === 'FIXED',
            description: 'Start date (year ignored for annual periods)',
            date: {
              pickerAppearance: 'dayOnly',
            },
          },
        },
        {
          name: 'endDate',
          type: 'date',
          admin: {
            width: '50%',
            condition: (data) => data?.dateType === 'FIXED',
            description: 'End date (year ignored for annual periods)',
            date: {
              pickerAppearance: 'dayOnly',
            },
          },
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'paschaOffsetStart',
          type: 'number',
          admin: {
            width: '50%',
            condition: (data) => data?.dateType === 'MOVEABLE',
            description: 'Days from Pascha for start (e.g., -48 for Clean Monday)',
          },
        },
        {
          name: 'paschaOffsetEnd',
          type: 'number',
          admin: {
            width: '50%',
            condition: (data) => data?.dateType === 'MOVEABLE',
            description: 'Days from Pascha for end (e.g., -1 for Holy Saturday)',
          },
        },
      ],
    },

    // Fasting Level
    {
      name: 'defaultLevel',
      type: 'select',
      required: true,
      defaultValue: 'OIL_WINE',
      options: [
        { label: 'Strict - No food until evening, then xerophagy', value: 'STRICT' },
        { label: 'Xerophagy - Dry eating (bread, water, fruit, vegetables)', value: 'XEROPHAGY' },
        { label: 'Oil - Xerophagy + oil', value: 'OIL' },
        { label: 'Wine - Xerophagy + wine', value: 'WINE' },
        { label: 'Oil & Wine - Xerophagy + oil + wine', value: 'OIL_WINE' },
        { label: 'Fish - Fish allowed', value: 'FISH' },
        { label: 'Dairy - Dairy allowed (Cheesefare)', value: 'DAIRY' },
        { label: 'None - No fasting', value: 'NONE' },
      ],
      admin: {
        description: 'Default fasting level for this period (may vary by day)',
      },
    },

    // Special Rules
    {
      name: 'rules',
      type: 'array',
      admin: {
        description: 'Special fasting rules for specific days within the period',
      },
      fields: [
        {
          name: 'dayOfWeek',
          type: 'select',
          options: [
            { label: 'Monday', value: 'MONDAY' },
            { label: 'Tuesday', value: 'TUESDAY' },
            { label: 'Wednesday', value: 'WEDNESDAY' },
            { label: 'Thursday', value: 'THURSDAY' },
            { label: 'Friday', value: 'FRIDAY' },
            { label: 'Saturday', value: 'SATURDAY' },
            { label: 'Sunday', value: 'SUNDAY' },
          ],
          admin: {
            description: 'Day of week this rule applies to',
          },
        },
        {
          name: 'level',
          type: 'select',
          required: true,
          options: [
            { label: 'Strict', value: 'STRICT' },
            { label: 'Xerophagy', value: 'XEROPHAGY' },
            { label: 'Oil', value: 'OIL' },
            { label: 'Wine', value: 'WINE' },
            { label: 'Oil & Wine', value: 'OIL_WINE' },
            { label: 'Fish', value: 'FISH' },
            { label: 'Dairy', value: 'DAIRY' },
            { label: 'None', value: 'NONE' },
          ],
          admin: {
            description: 'Fasting level for this day',
          },
        },
        {
          name: 'note',
          type: 'text',
          admin: {
            description: 'Note explaining this rule',
          },
        },
      ],
    },

    // Description
    {
      name: 'description',
      type: 'richText',
      admin: {
        description: 'Description and spiritual significance of this fasting period',
      },
    },

    // Exceptions
    {
      name: 'exceptions',
      type: 'array',
      admin: {
        description: 'Dates when fasting is relaxed within this period (e.g., Annunciation during Lent)',
      },
      fields: [
        {
          name: 'date',
          type: 'date',
          admin: {
            date: {
              pickerAppearance: 'dayOnly',
            },
          },
        },
        {
          name: 'paschaOffset',
          type: 'number',
          admin: {
            description: 'Or days from Pascha for moveable exceptions',
          },
        },
        {
          name: 'level',
          type: 'select',
          required: true,
          options: [
            { label: 'Fish', value: 'FISH' },
            { label: 'Oil & Wine', value: 'OIL_WINE' },
            { label: 'None', value: 'NONE' },
          ],
        },
        {
          name: 'reason',
          type: 'text',
          admin: {
            description: 'Reason for exception (e.g., "Annunciation")',
          },
        },
      ],
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
              description: 'Parish/Organization this period belongs to',
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
      useAsTitle: 'name',
      defaultColumns: ['name', 'type', 'defaultLevel', 'startDate', 'endDate'],
      group: adminGroup,
      description: 'Orthodox fasting periods and rules',
    },
    fields,
    hooks: customHooks,
    timestamps: true,
  }
}
