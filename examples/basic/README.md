# Basic Calendar Plugin Example

A minimal example demonstrating the `@payload-calendar/core` and `@payload-calendar/orthodox` plugins for Payload CMS 3.x.

## Features Demonstrated

### Core Calendar Plugin
- **Calendar Events** - Create and manage events with optional recurrence (RRule)
- **Calendar Sources** - Organize events into categories/calendars
- **Calendar Subscriptions** - Import external iCal feeds
- **iCal Export** - Export events as `.ics` files

### Orthodox Calendar Plugin
- **Feast Days** - Great Feasts with liturgical classifications
- **Fasting Periods** - Lenten and other fasting rules
- **Saints** - Saints database with commemorations
- **Liturgical Readings** - Scripture readings for services
- **Pascha Calculation** - Julian/Gregorian calendar support

## Quick Start

### 1. Install dependencies

From the monorepo root:

```bash
pnpm install
```

### 2. Build the plugins

```bash
pnpm build
```

### 3. Run the example

```bash
cd examples/basic
pnpm dev
```

### 4. Access the admin panel

Open [http://localhost:3000/admin](http://localhost:3000/admin) in your browser.

On first run, you'll be prompted to create an admin user.

## Project Structure

```
examples/basic/
  src/
    payload.config.ts   # Payload configuration with plugins
    server.ts           # Express server setup
  data/                 # SQLite database (auto-created)
  package.json
  tsconfig.json
```

## Configuration

### Core Calendar Plugin

```typescript
import { calendarPlugin } from '@payload-calendar/core'

calendarPlugin({
  features: {
    recurrence: true,      // Enable RRule-based recurrence
    icalExport: true,      // Enable iCal export endpoint
    icalImport: true,      // Enable iCal subscription imports
    reminders: false,      // Disable reminders
  },
})
```

### Orthodox Calendar Plugin

```typescript
import { orthodoxCalendarPlugin } from '@payload-calendar/orthodox'

orthodoxCalendarPlugin({
  tradition: 'JULIAN',     // 'JULIAN' | 'GREGORIAN' | 'REVISED_JULIAN'
  features: {
    feastDays: true,       // Enable feast days collection
    fastingPeriods: true,  // Enable fasting periods
    saints: true,          // Enable saints database
    readings: true,        // Enable liturgical readings
    orthocalSync: false,   // Disable orthocal.info sync
  },
})
```

## API Endpoints

### Calendar Events

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/calendar-events` | List all events |
| POST | `/api/calendar-events` | Create new event |
| GET | `/api/calendar-events/:id` | Get single event |
| PATCH | `/api/calendar-events/:id` | Update event |
| DELETE | `/api/calendar-events/:id` | Delete event |

### iCal Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/calendar/events` | Events with date filtering |
| GET | `/api/calendar/events/:id/ical` | Export single event as iCal |
| GET | `/api/calendar/export.ics` | Export all events as iCal feed |

### Orthodox Calendar

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/orthodox-feast-days` | List feast days |
| GET | `/api/orthodox-fasting-periods` | List fasting periods |
| GET | `/api/orthodox-saints` | List saints |
| GET | `/api/orthodox-readings` | List liturgical readings |

## Database

This example uses SQLite for simplicity. The database is automatically created at `data/database.db` when you first run the server.

To reset the database, simply delete the `data/` directory and restart.

## Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

| Variable | Description | Default |
|----------|-------------|---------|
| `PAYLOAD_SECRET` | Secret key for JWT signing | Required |
| `PORT` | Server port | `3000` |

## Next Steps

- Explore the admin panel to create calendar events
- Set up calendar sources to categorize events
- Try exporting events as iCal
- Add feast days and fasting periods for Orthodox calendar
- See the [full documentation](../../docs/) for advanced usage
