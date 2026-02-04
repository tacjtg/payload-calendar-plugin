import { buildConfig } from 'payload'
import { sqliteAdapter } from '@payloadcms/db-sqlite'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { calendarPlugin } from '@payload-calendar/core'
import { orthodoxCalendarPlugin } from '@payload-calendar/orthodox'
import path from 'path'
import { fileURLToPath } from 'url'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

/**
 * Basic example Payload configuration demonstrating the calendar plugin.
 *
 * This example shows:
 * 1. Core calendar plugin with events, sources, and subscriptions
 * 2. Orthodox calendar plugin with feast days, fasting, saints, and readings
 * 3. SQLite database for simplicity (no external database required)
 */
export default buildConfig({
  secret: process.env.PAYLOAD_SECRET || 'your-secret-key-change-in-production',

  // Use SQLite for simple local development
  db: sqliteAdapter({
    client: {
      url: path.resolve(dirname, '../data/database.db'),
    },
  }),

  // Rich text editor
  editor: lexicalEditor(),

  // Basic Users collection for authentication
  collections: [
    {
      slug: 'users',
      auth: true,
      admin: {
        useAsTitle: 'email',
      },
      fields: [
        {
          name: 'name',
          type: 'text',
        },
      ],
    },
  ],

  // Calendar plugins
  plugins: [
    // Core calendar plugin - adds calendar-events, calendar-sources, calendar-subscriptions
    calendarPlugin({
      features: {
        recurrence: true,      // Enable RRule-based recurrence
        icalExport: true,      // Enable iCal export endpoint
        icalImport: true,      // Enable iCal subscription imports
        reminders: false,      // Disable reminders (not implemented yet)
      },
      admin: {
        calendarView: true,    // Add calendar dashboard view
      },
    }),

    // Orthodox calendar plugin - adds Orthodox-specific collections and settings
    orthodoxCalendarPlugin({
      tradition: 'JULIAN',     // Use Julian calendar for Pascha calculation
      features: {
        feastDays: true,       // Great Feasts, feast classifications
        fastingPeriods: true,  // Lent, Apostles' Fast, etc.
        saints: true,          // Saints with commemorations
        readings: true,        // Liturgical scripture readings
        orthocalSync: false,   // Disable orthocal.info sync (requires API setup)
      },
      admin: {
        group: 'Orthodox Calendar',
      },
    }),
  ],

  // Admin panel configuration
  admin: {
    user: 'users',
    meta: {
      titleSuffix: ' | Calendar Plugin Example',
    },
  },

  // TypeScript configuration
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
})
