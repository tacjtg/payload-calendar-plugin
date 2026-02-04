import type { CollectionConfig, Field } from 'payload'
import type { SubscriptionsCollectionOptions } from '../types'

/**
 * Calendar Subscriptions Collection
 *
 * iCal feed subscriptions for importing external calendars:
 * - Subscribe to external .ics feeds
 * - Automatic sync on configurable intervals
 * - Map imported events to a calendar source
 */
export const CalendarSubscriptions = (options: SubscriptionsCollectionOptions): CollectionConfig => {
  const {
    slug,
    sourcesSlug,
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
        description: 'Name for this subscription (e.g., "Google Calendar", "Parish Website")',
      },
    },
    {
      name: 'url',
      type: 'text',
      required: true,
      admin: {
        description: 'iCal feed URL (.ics)',
      },
      validate: (value: string | null | undefined) => {
        if (value && !value.startsWith('http://') && !value.startsWith('https://')) {
          return 'URL must start with http:// or https://'
        }
        return true
      },
    },
    {
      name: 'source',
      type: 'relationship',
      relationTo: sourcesSlug,
      required: true,
      admin: {
        description: 'Import events into this calendar source',
      },
    },
    {
      type: 'row',
      fields: [
        {
          name: 'syncInterval',
          type: 'select',
          required: true,
          defaultValue: 'DAILY',
          options: [
            { label: 'Hourly', value: 'HOURLY' },
            { label: 'Daily', value: 'DAILY' },
            { label: 'Weekly', value: 'WEEKLY' },
          ],
          admin: {
            width: '50%',
            description: 'How often to sync this feed',
          },
        },
        {
          name: 'isActive',
          type: 'checkbox',
          defaultValue: true,
          admin: {
            width: '50%',
            description: 'Enable automatic syncing',
          },
        },
      ],
    },

    // Sync status (read-only)
    {
      type: 'row',
      fields: [
        {
          name: 'lastSynced',
          type: 'date',
          admin: {
            readOnly: true,
            width: '50%',
            date: {
              pickerAppearance: 'dayAndTime',
            },
            description: 'Last successful sync',
          },
        },
        {
          name: 'syncStatus',
          type: 'select',
          defaultValue: 'PENDING',
          options: [
            { label: 'OK', value: 'OK' },
            { label: 'Error', value: 'ERROR' },
            { label: 'Pending', value: 'PENDING' },
          ],
          admin: {
            readOnly: true,
            width: '50%',
            description: 'Current sync status',
          },
        },
      ],
    },
    {
      name: 'syncError',
      type: 'textarea',
      admin: {
        readOnly: true,
        condition: (data) => data?.syncStatus === 'ERROR',
        description: 'Last sync error message',
      },
    },
    {
      name: 'eventCount',
      type: 'number',
      defaultValue: 0,
      admin: {
        readOnly: true,
        description: 'Number of events imported from this feed',
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
              description: 'Tenant this subscription belongs to',
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
      defaultColumns: ['name', 'source', 'syncInterval', 'lastSynced', 'syncStatus'],
      group: 'Calendar',
      description: 'External calendar feed subscriptions',
    },
    fields,
    hooks: customHooks,
    timestamps: true,
  }
}
