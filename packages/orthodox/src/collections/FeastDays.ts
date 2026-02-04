import type { CollectionConfig, Field } from 'payload'
import type { OrthodoxCollectionOptions } from '../types'

/**
 * Feast Days Collection
 *
 * Orthodox feast days with liturgical classifications:
 * - Great Feasts (Pascha + Twelve Great Feasts)
 * - Theotokos Feasts
 * - Major and Minor Saints' Days
 * - Commemorations
 *
 * Supports both fixed dates and moveable feasts (relative to Pascha)
 */
export const FeastDays = (options: OrthodoxCollectionOptions): CollectionConfig => {
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
            description: 'Feast day name in English',
          },
        },
        {
          name: 'nameGreek',
          type: 'text',
          admin: {
            width: '50%',
            description: 'Feast day name in Greek',
          },
        },
      ],
    },
    {
      name: 'nameChurchSlavonic',
      type: 'text',
      admin: {
        description: 'Feast day name in Church Slavonic',
      },
    },

    // Date Configuration
    {
      name: 'dateType',
      type: 'select',
      required: true,
      defaultValue: 'FIXED',
      options: [
        { label: 'Fixed Date', value: 'FIXED' },
        { label: 'Moveable (relative to Pascha)', value: 'MOVEABLE' },
      ],
      admin: {
        description: 'Whether this feast occurs on a fixed calendar date or moves with Pascha',
      },
    },
    {
      name: 'date',
      type: 'date',
      required: true,
      admin: {
        condition: (data) => data?.dateType === 'FIXED',
        description: 'Fixed date for this feast (year is ignored for annual feasts)',
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
        description: 'Days from Pascha (negative = before, positive = after). E.g., -49 for Clean Monday, +49 for Pentecost',
      },
    },

    // Liturgical Classification
    {
      type: 'row',
      fields: [
        {
          name: 'feastLevel',
          type: 'select',
          required: true,
          defaultValue: '1',
          options: [
            { label: '0 - Simple Commemoration', value: '0' },
            { label: '1 - Small Doxology', value: '1' },
            { label: '2 - Great Doxology', value: '2' },
            { label: '3 - Polyeleos', value: '3' },
            { label: '4 - Great Feast', value: '4' },
          ],
          admin: {
            width: '50%',
            description: 'Typikon feast level (0-4)',
          },
        },
        {
          name: 'feastType',
          type: 'select',
          required: true,
          options: [
            { label: 'Pascha', value: 'PASCHA' },
            { label: 'Great Feast', value: 'GREAT_FEAST' },
            { label: 'Theotokos Feast', value: 'THEOTOKOS' },
            { label: 'Major Feast', value: 'MAJOR' },
            { label: 'Minor Feast', value: 'MINOR' },
            { label: 'Commemoration', value: 'COMMEMORATION' },
          ],
          admin: {
            width: '50%',
            description: 'Type of feast',
          },
        },
      ],
    },
    {
      name: 'liturgicalColor',
      type: 'select',
      required: true,
      defaultValue: 'GOLD',
      options: [
        { label: 'White - Pascha, Theophany, Transfiguration', value: 'WHITE' },
        { label: 'Gold - Ordinary Sundays, Major Feasts', value: 'GOLD' },
        { label: 'Red - Martyrs, Holy Cross', value: 'RED' },
        { label: 'Blue - Theotokos Feasts', value: 'BLUE' },
        { label: 'Green - Palm Sunday, Pentecost, Monastic Saints', value: 'GREEN' },
        { label: 'Purple - Great Lent, Advent', value: 'PURPLE' },
        { label: 'Black - Weekdays of Great Lent', value: 'BLACK' },
      ],
      admin: {
        description: 'Liturgical color for vestments and decorations',
      },
    },

    // Liturgical Texts
    {
      name: 'troparion',
      type: 'textarea',
      admin: {
        description: 'Troparion (main hymn) for this feast',
      },
    },
    {
      name: 'kontakion',
      type: 'textarea',
      admin: {
        description: 'Kontakion (shorter hymn) for this feast',
      },
    },
    {
      name: 'description',
      type: 'richText',
      admin: {
        description: 'Description and history of this feast',
      },
    },

    // Additional Info
    {
      name: 'isBankHoliday',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description: 'Is this a civil/bank holiday in traditionally Orthodox countries?',
      },
    },
    {
      name: 'icon',
      type: 'upload',
      relationTo: 'media',
      admin: {
        description: 'Icon image for this feast',
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
              description: 'Parish/Organization this feast belongs to',
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
      defaultColumns: ['name', 'date', 'feastLevel', 'feastType', 'liturgicalColor'],
      group: adminGroup,
      description: 'Orthodox feast days and commemorations',
    },
    fields,
    hooks: customHooks,
    timestamps: true,
  }
}
