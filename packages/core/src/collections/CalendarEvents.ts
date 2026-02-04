import type { CollectionConfig, Field } from 'payload'
import type { EventsCollectionOptions } from '../types'
import { generateRRuleHook } from '../hooks/generateRRule'
import { validateDatesHook } from '../hooks/validateDates'

/**
 * Calendar Events Collection
 *
 * The main collection for storing calendar events with support for:
 * - Basic event info (title, description, location)
 * - Date/time with timezone support
 * - All-day events
 * - Recurring events (RRule)
 * - Event sources/categories
 * - Status workflow (draft, published, cancelled)
 */
export const CalendarEvents = (options: EventsCollectionOptions): CollectionConfig => {
  const {
    slug,
    features,
    multiTenant,
    sourcesSlug,
    additionalFields = [],
    hooks: customHooks = {},
  } = options

  const fields: Field[] = [
    // Basic Info
    {
      name: 'title',
      type: 'text',
      required: true,
      admin: {
        description: 'Event title',
      },
    },
    {
      name: 'description',
      type: 'richText',
      admin: {
        description: 'Event description with formatting',
      },
    },
    {
      name: 'location',
      type: 'text',
      admin: {
        description: 'Physical location or virtual meeting link',
      },
    },

    // Date & Time
    {
      type: 'row',
      fields: [
        {
          name: 'startDate',
          type: 'date',
          required: true,
          admin: {
            date: {
              pickerAppearance: 'dayAndTime',
            },
            width: '50%',
            description: 'Event start date and time',
          },
        },
        {
          name: 'endDate',
          type: 'date',
          admin: {
            date: {
              pickerAppearance: 'dayAndTime',
            },
            width: '50%',
            description: 'Event end date and time (optional for all-day events)',
          },
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'allDay',
          type: 'checkbox',
          defaultValue: false,
          admin: {
            width: '50%',
            description: 'All-day event (no specific time)',
          },
        },
        {
          name: 'timezone',
          type: 'text',
          defaultValue: 'UTC',
          admin: {
            width: '50%',
            description: 'Timezone (e.g., America/New_York)',
          },
        },
      ],
    },

    // Recurrence
    {
      name: 'isRecurring',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description: 'Enable recurring event',
      },
    },
    {
      name: 'recurrence',
      type: 'group',
      admin: {
        condition: (data) => data?.isRecurring === true,
        description: 'Recurrence settings',
      },
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'frequency',
              type: 'select',
              required: true,
              options: [
                { label: 'Daily', value: 'DAILY' },
                { label: 'Weekly', value: 'WEEKLY' },
                { label: 'Monthly', value: 'MONTHLY' },
                { label: 'Yearly', value: 'YEARLY' },
              ],
              defaultValue: 'WEEKLY',
              admin: {
                width: '50%',
              },
            },
            {
              name: 'interval',
              type: 'number',
              defaultValue: 1,
              min: 1,
              max: 99,
              admin: {
                width: '50%',
                description: 'Repeat every X days/weeks/months/years',
              },
            },
          ],
        },
        {
          name: 'byDay',
          type: 'select',
          hasMany: true,
          options: [
            { label: 'Monday', value: 'MO' },
            { label: 'Tuesday', value: 'TU' },
            { label: 'Wednesday', value: 'WE' },
            { label: 'Thursday', value: 'TH' },
            { label: 'Friday', value: 'FR' },
            { label: 'Saturday', value: 'SA' },
            { label: 'Sunday', value: 'SU' },
          ],
          admin: {
            condition: (data, siblingData) => siblingData?.frequency === 'WEEKLY',
            description: 'Repeat on these days',
          },
        },
        {
          type: 'row',
          fields: [
            {
              name: 'until',
              type: 'date',
              admin: {
                width: '50%',
                description: 'End recurrence on this date',
              },
            },
            {
              name: 'count',
              type: 'number',
              min: 1,
              max: 999,
              admin: {
                width: '50%',
                description: 'Or after this many occurrences',
              },
            },
          ],
        },
        {
          name: 'rrule',
          type: 'text',
          admin: {
            readOnly: true,
            description: 'Generated RRule string (auto-computed)',
          },
        },
        {
          name: 'excludeDates',
          type: 'array',
          admin: {
            description: 'Dates to skip (exceptions)',
          },
          fields: [
            {
              name: 'date',
              type: 'date',
              required: true,
            },
          ],
        },
      ],
    },
    {
      name: 'recurringParent',
      type: 'relationship',
      relationTo: slug,
      admin: {
        condition: () => false, // Hidden - used internally for recurrence instances
        description: 'Parent event for modified recurrence instances',
      },
    },

    // Categorization
    {
      name: 'source',
      type: 'relationship',
      relationTo: sourcesSlug,
      required: true,
      admin: {
        description: 'Calendar/category this event belongs to',
      },
    },
    {
      name: 'color',
      type: 'text',
      admin: {
        description: 'Custom color override (hex, e.g., #FF5733)',
      },
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'draft',
      options: [
        { label: 'Draft', value: 'draft' },
        { label: 'Published', value: 'published' },
        { label: 'Cancelled', value: 'cancelled' },
      ],
      admin: {
        position: 'sidebar',
        description: 'Event visibility status',
      },
    },

    // Additional
    {
      name: 'url',
      type: 'text',
      admin: {
        description: 'External link (website, registration, etc.)',
      },
    },
    {
      name: 'image',
      type: 'upload',
      relationTo: 'media',
      admin: {
        description: 'Event image/banner',
      },
    },

    // Reminders (if enabled)
    ...(features?.reminders
      ? [
          {
            name: 'reminders',
            type: 'array',
            admin: {
              description: 'Event reminders',
            },
            fields: [
              {
                type: 'row',
                fields: [
                  {
                    name: 'type',
                    type: 'select',
                    required: true,
                    options: [
                      { label: 'Email', value: 'EMAIL' },
                      { label: 'Push Notification', value: 'PUSH' },
                      { label: 'SMS', value: 'SMS' },
                    ],
                    admin: { width: '50%' },
                  },
                  {
                    name: 'timing',
                    type: 'number',
                    required: true,
                    defaultValue: 60,
                    admin: {
                      width: '50%',
                      description: 'Minutes before event',
                    },
                  },
                ],
              },
              {
                name: 'sent',
                type: 'checkbox',
                defaultValue: false,
                admin: {
                  readOnly: true,
                  description: 'Has this reminder been sent?',
                },
              },
            ],
          } as Field,
        ]
      : []),

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
              description: 'Tenant this event belongs to',
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
      useAsTitle: 'title',
      defaultColumns: ['title', 'startDate', 'source', 'status'],
      group: 'Calendar',
      description: 'Calendar events with recurrence support',
    },
    fields,
    hooks: {
      beforeChange: [
        generateRRuleHook,
        validateDatesHook,
        ...(customHooks.beforeChange ?? []),
      ],
      ...(customHooks.afterChange ? { afterChange: customHooks.afterChange } : {}),
      ...(customHooks.beforeRead ? { beforeRead: customHooks.beforeRead } : {}),
      ...(customHooks.afterRead ? { afterRead: customHooks.afterRead } : {}),
      ...(customHooks.beforeDelete ? { beforeDelete: customHooks.beforeDelete } : {}),
      ...(customHooks.afterDelete ? { afterDelete: customHooks.afterDelete } : {}),
    },
    timestamps: true,
    versions: {
      drafts: true,
    },
  }
}
