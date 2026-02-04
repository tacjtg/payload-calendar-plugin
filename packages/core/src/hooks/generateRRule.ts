import type { CollectionBeforeChangeHook } from 'payload'
import { RRule } from 'rrule'

/**
 * Hook to generate RRule string from recurrence configuration
 *
 * Runs before save to compute the rrule string from user-friendly fields
 */
export const generateRRuleHook: CollectionBeforeChangeHook = async ({ data, operation }) => {
  // Only process if this is a recurring event
  if (!data?.isRecurring || !data?.recurrence) {
    return data
  }

  const { recurrence, startDate } = data

  if (!recurrence.frequency) {
    return data
  }

  try {
    // Map frequency string to RRule constant
    const frequencyMap: Record<string, number> = {
      DAILY: RRule.DAILY,
      WEEKLY: RRule.WEEKLY,
      MONTHLY: RRule.MONTHLY,
      YEARLY: RRule.YEARLY,
    }

    // Map day strings to RRule weekday objects
    const dayMap: Record<string, ReturnType<typeof RRule.MO>> = {
      MO: RRule.MO,
      TU: RRule.TU,
      WE: RRule.WE,
      TH: RRule.TH,
      FR: RRule.FR,
      SA: RRule.SA,
      SU: RRule.SU,
    }

    // Build RRule options
    const options: Partial<ConstructorParameters<typeof RRule>[0]> = {
      freq: frequencyMap[recurrence.frequency] ?? RRule.WEEKLY,
      interval: recurrence.interval ?? 1,
      dtstart: startDate ? new Date(startDate) : new Date(),
    }

    // Add byweekday if specified (for weekly recurrence)
    if (recurrence.byDay && recurrence.byDay.length > 0) {
      options.byweekday = recurrence.byDay.map((day: string) => dayMap[day]).filter(Boolean)
    }

    // Add until date if specified
    if (recurrence.until) {
      options.until = new Date(recurrence.until)
    }

    // Add count if specified (and no until date)
    if (recurrence.count && !recurrence.until) {
      options.count = recurrence.count
    }

    // Generate the RRule
    const rule = new RRule(options as ConstructorParameters<typeof RRule>[0])

    // Store the generated RRule string
    return {
      ...data,
      recurrence: {
        ...recurrence,
        rrule: rule.toString(),
      },
    }
  } catch (error) {
    console.error('Error generating RRule:', error)
    // Return data unchanged if RRule generation fails
    return data
  }
}
