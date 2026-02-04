import express from 'express'
import payload from 'payload'

const app = express()
const PORT = process.env.PORT || 3000

/**
 * Basic Express server for the calendar plugin example.
 *
 * This server:
 * 1. Initializes Payload CMS with the calendar plugins
 * 2. Serves the Payload admin panel
 * 3. Exposes the calendar API endpoints
 */
async function start() {
  // Initialize Payload
  await payload.init({
    express: app,
    onInit: async () => {
      payload.logger.info(`Payload Admin URL: ${payload.getAdminURL()}`)
      payload.logger.info('')
      payload.logger.info('Calendar Plugin Collections:')
      payload.logger.info('  - calendar-events: Manage calendar events with recurrence')
      payload.logger.info('  - calendar-sources: Organize events by category/calendar')
      payload.logger.info('  - calendar-subscriptions: Import external iCal feeds')
      payload.logger.info('')
      payload.logger.info('Orthodox Calendar Collections:')
      payload.logger.info('  - orthodox-feast-days: Great Feasts and commemoration days')
      payload.logger.info('  - orthodox-fasting-periods: Fasting rules and periods')
      payload.logger.info('  - orthodox-saints: Saints database')
      payload.logger.info('  - orthodox-readings: Liturgical scripture readings')
      payload.logger.info('')
      payload.logger.info('Calendar API Endpoints:')
      payload.logger.info('  GET  /api/calendar/events - List events with date filtering')
      payload.logger.info('  GET  /api/calendar/events/:id/ical - Export single event as iCal')
      payload.logger.info('  GET  /api/calendar/export.ics - Export all events as iCal feed')
    },
  })

  // Health check endpoint
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() })
  })

  // Start server
  app.listen(PORT, () => {
    payload.logger.info(`Server running on http://localhost:${PORT}`)
  })
}

start().catch((error) => {
  console.error('Failed to start server:', error)
  process.exit(1)
})
