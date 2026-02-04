import type { CollectionConfig, Field } from 'payload'
import type { SourcesCollectionOptions } from '../types'

/**
 * Calendar Sources Collection
 *
 * Categories/calendars for organizing events:
 * - Name and slug for identification
 * - Color for visual distinction
 * - Public/private visibility
 * - Sort order for display
 */
export const CalendarSources = (options: SourcesCollectionOptions): CollectionConfig => {
  const {
    slug,
    multiTenant,
    additionalFields = [],
    hooks: customHooks = {},
  } = options

  const fields: Field[] = [
    {
      name: 'name',
      type: 'text',
      required: true,
      admin: {
        description: 'Display name for this calendar/category',
      },
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: !multiTenant, // Only globally unique if not multi-tenant
      admin: {
        description: 'URL-safe identifier (e.g., "parish-events", "feast-days")',
      },
      hooks: {
        beforeValidate: [
          ({ value, data }) => {
            // Auto-generate slug from name if not provided
            if (!value && data?.name) {
              return data.name
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/^-|-$/g, '')
            }
            return value
          },
        ],
      },
    },
    {
      name: 'color',
      type: 'text',
      required: true,
      defaultValue: '#3788d8',
      admin: {
        description: 'Hex color for events in this calendar (e.g., #3788d8)',
      },
      validate: (value: string | null | undefined) => {
        if (value && !/^#[0-9A-Fa-f]{6}$/.test(value)) {
          return 'Color must be a valid hex code (e.g., #3788d8)'
        }
        return true
      },
    },
    {
      name: 'icon',
      type: 'text',
      admin: {
        description: 'Icon name (e.g., Lucide icon name: "calendar", "church", "cross")',
      },
    },
    {
      name: 'description',
      type: 'textarea',
      admin: {
        description: 'Optional description of this calendar',
      },
    },
    {
      type: 'row',
      fields: [
        {
          name: 'isDefault',
          type: 'checkbox',
          defaultValue: false,
          admin: {
            width: '33%',
            description: 'Default calendar for new events',
          },
        },
        {
          name: 'isPublic',
          type: 'checkbox',
          defaultValue: true,
          admin: {
            width: '33%',
            description: 'Show in public calendar views',
          },
        },
        {
          name: 'sortOrder',
          type: 'number',
          defaultValue: 0,
          admin: {
            width: '33%',
            description: 'Display order (lower = first)',
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
              description: 'Tenant this source belongs to',
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
      defaultColumns: ['name', 'slug', 'color', 'isPublic', 'sortOrder'],
      group: 'Calendar',
      description: 'Calendar categories and sources',
    },
    fields,
    hooks: customHooks,
    timestamps: true,
  }
}
