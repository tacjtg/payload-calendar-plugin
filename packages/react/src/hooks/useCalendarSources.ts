/**
 * @fileoverview Hook for fetching available calendar sources from the API
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import type {
  CalendarSource,
  UseCalendarSourcesReturn,
  UseCalendarSourcesOptions,
  CalendarSourcesResponse,
} from '../types'

/**
 * Hook to fetch available calendar sources from the payload-calendar API
 *
 * @param apiUrl - Base URL for the calendar API
 * @param options - Configuration options for the hook
 * @returns Object containing sources, loading state, error, and refetch function
 *
 * @example
 * ```tsx
 * const { sources, isLoading, error, refetch } = useCalendarSources('/api/calendar')
 *
 * // Use with SourceFilter component
 * <SourceFilter
 *   sources={sources}
 *   selectedSources={selectedSources}
 *   onSelectionChange={setSelectedSources}
 * />
 * ```
 */
export function useCalendarSources(
  apiUrl: string,
  options: UseCalendarSourcesOptions = {}
): UseCalendarSourcesReturn {
  const { enabled = true, onSuccess, onError } = options

  const [sources, setSources] = useState<CalendarSource[]>([])
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
   * Fetches sources from the API
   */
  const fetchSources = useCallback(async () => {
    if (!enabled) return

    setIsLoading(true)
    setError(null)

    try {
      const url = `${apiUrl}/sources`
      const response = await fetch(url)

      if (!response.ok) {
        throw new Error(`Failed to fetch sources: ${response.status} ${response.statusText}`)
      }

      const data: CalendarSourcesResponse = await response.json()

      // Only update state if still mounted
      if (isMountedRef.current) {
        setSources(data.sources)
        onSuccessRef.current?.(data.sources)
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to fetch sources')

      if (isMountedRef.current) {
        setError(error)
        onErrorRef.current?.(error)
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false)
      }
    }
  }, [apiUrl, enabled])

  /**
   * Refetch sources manually
   */
  const refetch = useCallback(async () => {
    await fetchSources()
  }, [fetchSources])

  // Initial fetch
  useEffect(() => {
    fetchSources()
  }, [fetchSources])

  return {
    sources,
    isLoading,
    error,
    refetch,
  }
}

export default useCalendarSources
