/**
 * @fileoverview Hook for fetching calendar events from the API
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import type {
  CalendarEvent,
  UseCalendarEventsReturn,
  UseCalendarEventsOptions,
  CalendarEventsResponse,
} from '../types'

/**
 * Formats a date for API requests
 */
function formatDateForApi(date: Date | string): string {
  if (typeof date === 'string') {
    return date
  }
  return date.toISOString()
}

/**
 * Hook to fetch calendar events from the payload-calendar API
 *
 * @param apiUrl - Base URL for the calendar API
 * @param options - Configuration options for the hook
 * @returns Object containing events, loading state, error, and control functions
 *
 * @example
 * ```tsx
 * const { events, isLoading, error, refetch } = useCalendarEvents(
 *   '/api/calendar',
 *   {
 *     start: new Date('2024-01-01'),
 *     end: new Date('2024-01-31'),
 *     sources: ['events', 'holidays'],
 *   }
 * )
 * ```
 */
export function useCalendarEvents(
  apiUrl: string,
  options: UseCalendarEventsOptions = {}
): UseCalendarEventsReturn {
  const {
    start,
    end,
    sources,
    enabled = true,
    refetchInterval,
    onSuccess,
    onError,
  } = options

  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  // Store callbacks in refs to avoid dependency issues
  const onSuccessRef = useRef(onSuccess)
  const onErrorRef = useRef(onError)
  onSuccessRef.current = onSuccess
  onErrorRef.current = onError

  // Track if component is mounted
  const isMountedRef = useRef(true)
  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
    }
  }, [])

  /**
   * Fetches events from the API
   */
  const fetchEvents = useCallback(async () => {
    if (!enabled) return

    setIsLoading(true)
    setError(null)

    try {
      // Build query parameters
      const params = new URLSearchParams()

      if (start) {
        params.set('start', formatDateForApi(start))
      }

      if (end) {
        params.set('end', formatDateForApi(end))
      }

      if (sources && sources.length > 0) {
        params.set('sources', sources.join(','))
      }

      // Make API request
      const url = `${apiUrl}/events${params.toString() ? `?${params.toString()}` : ''}`
      const response = await fetch(url)

      if (!response.ok) {
        throw new Error(`Failed to fetch events: ${response.status} ${response.statusText}`)
      }

      const data: CalendarEventsResponse = await response.json()

      // Only update state if still mounted
      if (isMountedRef.current) {
        setEvents(data.events)
        onSuccessRef.current?.(data.events)
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to fetch events')

      if (isMountedRef.current) {
        setError(error)
        onErrorRef.current?.(error)
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false)
      }
    }
  }, [apiUrl, start, end, sources, enabled])

  /**
   * Refetch events manually
   */
  const refetch = useCallback(async () => {
    await fetchEvents()
  }, [fetchEvents])

  /**
   * Mutate the events cache directly
   */
  const mutate = useCallback((newEvents: CalendarEvent[]) => {
    setEvents(newEvents)
  }, [])

  // Initial fetch and dependency changes
  useEffect(() => {
    fetchEvents()
  }, [fetchEvents])

  // Set up refetch interval if specified
  useEffect(() => {
    if (!refetchInterval || refetchInterval <= 0) return

    const intervalId = setInterval(() => {
      fetchEvents()
    }, refetchInterval)

    return () => clearInterval(intervalId)
  }, [refetchInterval, fetchEvents])

  return {
    events,
    isLoading,
    error,
    refetch,
    mutate,
  }
}

export default useCalendarEvents
