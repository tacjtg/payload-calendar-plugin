import type { CollectionConfig, Field } from 'payload'
import type { OrthodoxCollectionOptions } from '../types'

/**
 * Saints Collection
 *
 * Orthodox saints commemorated in the liturgical calendar:
 * - Apostles, Prophets, Martyrs
 * - Hierarchs, Monastics
 * - Equal-to-the-Apostles, Confessors
 * - Righteous, Fools for Christ
 * - New Martyrs
 *
 * Includes feast dates, categories, and liturgical texts
 */
export const Saints = (options: OrthodoxCollectionOptions): CollectionConfig => {
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
            description: 'Saint name in English',
          },
        },
        {
          name: 'nameGreek',
          type: 'text',
          admin: {
            width: '50%',
            description: 'Saint name in Greek',
          },
        },
      ],
    },
    {
      name: 'nameChurchSlavonic',
      type: 'text',
      admin: {
        description: 'Saint name in Church Slavonic',
      },
    },
    {
      name: 'title',
      type: 'text',
      admin: {
        description: 'Title/epithet (e.g., "the Great", "of Assisi", "the New")',
      },
    },

    // Feast Dates
    {
      type: 'row',
      fields: [
        {
          name: 'feastDate',
          type: 'date',
          required: true,
          admin: {
            width: '50%',
            description: 'Primary feast date (year ignored)',
            date: {
              pickerAppearance: 'dayOnly',
            },
          },
        },
        {
          name: 'feastDateSecondary',
          type: 'date',
          admin: {
            width: '50%',
            description: 'Secondary feast date if applicable (e.g., translation of relics)',
            date: {
              pickerAppearance: 'dayOnly',
            },
          },
        },
      ],
    },
    {
      name: 'feastDateMoveable',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description: 'Feast date moves with Pascha (rare for saints)',
      },
    },
    {
      name: 'paschaOffset',
      type: 'number',
      admin: {
        condition: (data) => data?.feastDateMoveable === true,
        description: 'Days from Pascha for moveable feast',
      },
    },

    // Classification
    {
      name: 'category',
      type: 'select',
      required: true,
      options: [
        { label: 'Apostle', value: 'APOSTLE' },
        { label: 'Prophet', value: 'PROPHET' },
        { label: 'Martyr', value: 'MARTYR' },
        { label: 'Great Martyr', value: 'GREAT_MARTYR' },
        { label: 'Hieromartyr', value: 'HIEROMARTYR' },
        { label: 'Confessor', value: 'CONFESSOR' },
        { label: 'Hierarch', value: 'HIERARCH' },
        { label: 'Monastic', value: 'MONASTIC' },
        { label: 'Unmercenary Healer', value: 'UNMERCENARY' },
        { label: 'Fool for Christ', value: 'FOOL_FOR_CHRIST' },
        { label: 'Equal to the Apostles', value: 'EQUAL_TO_APOSTLES' },
        { label: 'Righteous', value: 'RIGHTEOUS' },
        { label: 'Passion Bearer', value: 'PASSION_BEARER' },
        { label: 'New Martyr', value: 'NEW_MARTYR' },
        { label: 'Blessed', value: 'BLESSED' },
      ],
      admin: {
        description: 'Primary category of this saint',
      },
    },
    {
      name: 'categories',
      type: 'select',
      hasMany: true,
      options: [
        { label: 'Apostle', value: 'APOSTLE' },
        { label: 'Prophet', value: 'PROPHET' },
        { label: 'Martyr', value: 'MARTYR' },
        { label: 'Great Martyr', value: 'GREAT_MARTYR' },
        { label: 'Hieromartyr', value: 'HIEROMARTYR' },
        { label: 'Confessor', value: 'CONFESSOR' },
        { label: 'Hierarch', value: 'HIERARCH' },
        { label: 'Monastic', value: 'MONASTIC' },
        { label: 'Unmercenary Healer', value: 'UNMERCENARY' },
        { label: 'Fool for Christ', value: 'FOOL_FOR_CHRIST' },
        { label: 'Equal to the Apostles', value: 'EQUAL_TO_APOSTLES' },
        { label: 'Righteous', value: 'RIGHTEOUS' },
        { label: 'Passion Bearer', value: 'PASSION_BEARER' },
        { label: 'New Martyr', value: 'NEW_MARTYR' },
        { label: 'Blessed', value: 'BLESSED' },
      ],
      admin: {
        description: 'Additional categories (a saint may be both a hierarch and a confessor)',
      },
    },
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
        { label: '4 - Great Feast (rare for saints)', value: '4' },
      ],
      admin: {
        description: 'Typikon feast level',
      },
    },

    // Liturgical Texts
    {
      name: 'troparion',
      type: 'textarea',
      admin: {
        description: 'Troparion (main hymn) for this saint',
      },
    },
    {
      name: 'kontakion',
      type: 'textarea',
      admin: {
        description: 'Kontakion (shorter hymn) for this saint',
      },
    },

    // Biography
    {
      name: 'biography',
      type: 'richText',
      admin: {
        description: 'Life and deeds of this saint',
      },
    },
    {
      type: 'row',
      fields: [
        {
          name: 'birthYear',
          type: 'number',
          admin: {
            width: '50%',
            description: 'Year of birth (approximate, negative for BC)',
          },
        },
        {
          name: 'reposedYear',
          type: 'number',
          admin: {
            width: '50%',
            description: 'Year of repose/martyrdom (approximate)',
          },
        },
      ],
    },
    {
      name: 'region',
      type: 'text',
      admin: {
        description: 'Geographic region associated with this saint',
      },
    },

    // Relics & Veneration
    {
      name: 'relics',
      type: 'textarea',
      admin: {
        description: 'Information about the location of relics',
      },
    },
    {
      name: 'canonizedDate',
      type: 'date',
      admin: {
        description: 'Date of formal canonization (if known)',
      },
    },
    {
      name: 'canonizedBy',
      type: 'text',
      admin: {
        description: 'Church/jurisdiction that canonized this saint',
      },
    },

    // Icon
    {
      name: 'icon',
      type: 'upload',
      relationTo: 'media',
      admin: {
        description: 'Icon of this saint',
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
              description: 'Parish/Organization this saint record belongs to',
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
      defaultColumns: ['name', 'category', 'feastDate', 'feastLevel'],
      group: adminGroup,
      description: 'Orthodox saints and their commemorations',
    },
    fields,
    hooks: customHooks,
    timestamps: true,
  }
}
