import type { CollectionBeforeChangeHook } from 'payload'

/**
 * Hook to validate event dates
 *
 * Ensures:
 * - End date is after start date (if provided)
 * - All-day events have proper date handling
 * - Recurrence until date is after start date
 */
export const validateDatesHook: CollectionBeforeChangeHook = async ({ data, operation }) => {
  if (!data) return data

  const errors: string[] = []

  // Validate start and end dates
  if (data.startDate && data.endDate) {
    const start = new Date(data.startDate)
    const end = new Date(data.endDate)

    if (end < start) {
      errors.push('End date must be after start date')
    }
  }

  // Validate recurrence until date
  if (data.isRecurring && data.recurrence?.until && data.startDate) {
    const start = new Date(data.startDate)
    const until = new Date(data.recurrence.until)

    if (until < start) {
      errors.push('Recurrence end date must be after start date')
    }
  }

  // For all-day events, normalize times to midnight
  if (data.allDay && data.startDate) {
    const start = new Date(data.startDate)
    start.setHours(0, 0, 0, 0)
    data.startDate = start.toISOString()

    if (data.endDate) {
      const end = new Date(data.endDate)
      end.setHours(23, 59, 59, 999)
      data.endDate = end.toISOString()
    }
  }

  // Throw validation error if any issues found
  if (errors.length > 0) {
    throw new Error(errors.join('. '))
  }

  return data
}
