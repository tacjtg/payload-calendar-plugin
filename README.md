# Payload Calendar Plugin

A comprehensive calendar plugin for [Payload CMS](https://payloadcms.com/) with support for recurring events, iCal import/export, and multi-tenant isolation.

## Features

### Core Plugin (`@payload-calendar/core`)
- **Calendar Events Collection** - Full event management with title, description, dates, location, and status
- **Calendar Sources Collection** - Categorize events with colors and icons
- **Recurring Events** - RFC 5545 compliant recurrence rules (RRule) with exclusion dates
- **iCal Integration** - Import from and export to iCal feeds
- **Calendar Subscriptions** - Subscribe to external iCal feeds with automatic syncing
- **Multi-Tenant Support** - Optional tenant field for organization isolation
- **REST API Endpoints** - Query events by date range, source, and search terms

### React Components (`@payload-calendar/react`)
- **PayloadCalendar** - Full-featured calendar using FullCalendar
- **MiniCalendar** - Compact calendar for sidebars
- **UpcomingEvents** - List of upcoming events
- **EventCard** - Individual event display
- **SourceFilter** - Filter events by calendar source
- **React Hooks** - `useCalendarEvents`, `useCalendarSources`

## Installation

```bash
# Using pnpm (recommended)
pnpm add @payload-calendar/core

# With React components
pnpm add @payload-calendar/core @payload-calendar/react
```

## Quick Start

### Basic Setup

```typescript
// payload.config.ts
import { buildConfig } from 'payload'
import { calendarPlugin } from '@payload-calendar/core'

export default buildConfig({
  plugins: [
    calendarPlugin({
      features: {
        recurrence: true,
        icalExport: true,
        icalImport: true,
      },
    }),
  ],
  // ... rest of config
})
```

### With Multi-Tenant Support

```typescript
import { calendarPlugin } from '@payload-calendar/core'

export default buildConfig({
  plugins: [
    calendarPlugin({
      features: {
        recurrence: true,
        multiTenant: true,
      },
      tenantField: 'organization',
      tenantCollection: 'organizations',
    }),
  ],
})
```

### Using React Components

```tsx
import { PayloadCalendar, useCalendarEvents } from '@payload-calendar/react'

function CalendarPage() {
  return (
    <PayloadCalendar
      apiUrl="/api/calendar/events"
      initialView="dayGridMonth"
      onEventClick={(event) => console.log(event)}
    />
  )
}
```

## API Endpoints

The plugin adds the following API endpoints:

### Events
- `GET /api/calendar/events` - List events with filtering
- `GET /api/calendar/events/:id` - Get single event
- `POST /api/calendar/events` - Create event
- `PATCH /api/calendar/events/:id` - Update event
- `DELETE /api/calendar/events/:id` - Delete event

### Query Parameters
- `start` - Filter events starting after this date (ISO 8601)
- `end` - Filter events ending before this date (ISO 8601)
- `source` - Filter by calendar source slug
- `search` - Full-text search in title and description
- `expand` - Set to `true` to expand recurring events

### iCal Feed
- `GET /api/calendar/ical/:sourceSlug` - Export iCal feed for a source
- `GET /api/calendar/ical` - Export all events as iCal

### Unified Events
- `GET /api/calendar/unified` - Get events from all sources unified

## Recurrence Rules

The plugin uses [rrule](https://github.com/jakubroztocil/rrule) for RFC 5545 compliant recurrence:

```typescript
// Creating a recurring event
const event = await payload.create({
  collection: 'calendar-events',
  data: {
    title: 'Weekly Meeting',
    startDate: '2025-01-06T10:00:00Z',
    endDate: '2025-01-06T11:00:00Z',
    isRecurring: true,
    recurrence: {
      frequency: 'WEEKLY',
      interval: 1,
      byDay: ['MO'], // Every Monday
      count: 52,
    },
  },
})
```

## Packages

| Package | Description | Size |
|---------|-------------|------|
| `@payload-calendar/core` | Core calendar functionality | ~54KB |
| `@payload-calendar/react` | React components & hooks | ~27KB |

## Requirements

- Payload CMS 3.0+
- Node.js 18+
- React 18+ (for React package)

## License

MIT License - see [LICENSE](LICENSE) for details.

## Contributing

Contributions are welcome! Please read the contributing guidelines before submitting a pull request.

## Credits

- Built for [Payload CMS](https://payloadcms.com/)
- Recurrence powered by [rrule](https://github.com/jakubroztocil/rrule)
- iCal support via [ical.js](https://github.com/kewisch/ical.js)
- Calendar UI via [FullCalendar](https://fullcalendar.io/)
