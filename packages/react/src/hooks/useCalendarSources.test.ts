import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { useCalendarSources } from './useCalendarSources'
import type { CalendarSource, CalendarSourcesResponse } from '../types'

// Mock data
const mockSources: CalendarSource[] = [
  {
    id: 'meetings',
    name: 'Meetings',
    color: '#3788d8',
    description: 'Team and client meetings',
    enabled: true,
  },
  {
    id: 'events',
    name: 'Events',
    color: '#10b981',
    description: 'Company events and celebrations',
  },
  {
    id: 'deadlines',
    name: 'Deadlines',
    color: '#ef4444',
    icon: 'calendar-clock',
  },
]

const mockSourcesResponse: CalendarSourcesResponse = {
  sources: mockSources,
}

function createFetchMock(response: unknown, ok = true, status = 200) {
  return vi.fn().mockResolvedValue({
    ok,
    status,
    statusText: ok ? 'OK' : 'Error',
    json: () => Promise.resolve(response),
  })
}

describe('useCalendarSources', () => {
  const apiUrl = '/api/calendar'

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('initial state', () => {
    it('should return empty sources array initially', () => {
      global.fetch = createFetchMock(mockSourcesResponse)

      const { result } = renderHook(() => useCalendarSources(apiUrl))

      expect(result.current.sources).toEqual([])
    })

    it('should set isLoading to true during fetch', async () => {
      let resolvePromise: (value: unknown) => void
      const delayedPromise = new Promise((resolve) => {
        resolvePromise = resolve
      })

      global.fetch = vi.fn().mockImplementation(() => delayedPromise)

      const { result } = renderHook(() => useCalendarSources(apiUrl))

      expect(result.current.isLoading).toBe(true)

      await act(async () => {
        resolvePromise!({
          ok: true,
          json: () => Promise.resolve(mockSourcesResponse),
        })
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })
    })

    it('should have null error initially', () => {
      global.fetch = createFetchMock(mockSourcesResponse)

      const { result } = renderHook(() => useCalendarSources(apiUrl))

      expect(result.current.error).toBeNull()
    })
  })

  describe('successful data fetching', () => {
    it('should fetch sources on mount', async () => {
      global.fetch = createFetchMock(mockSourcesResponse)

      const { result } = renderHook(() => useCalendarSources(apiUrl))

      await waitFor(() => {
        expect(result.current.sources).toEqual(mockSources)
      })

      expect(result.current.isLoading).toBe(false)
      expect(result.current.error).toBeNull()
    })

    it('should call API with correct URL', async () => {
      global.fetch = createFetchMock(mockSourcesResponse)

      renderHook(() => useCalendarSources(apiUrl))

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(`${apiUrl}/sources`)
      })
    })

    it('should call onSuccess callback when fetch succeeds', async () => {
      global.fetch = createFetchMock(mockSourcesResponse)

      const onSuccess = vi.fn()

      renderHook(() => useCalendarSources(apiUrl, { onSuccess }))

      await waitFor(() => {
        expect(onSuccess).toHaveBeenCalledWith(mockSources)
      })
    })

    it('should handle sources with all optional properties', async () => {
      const fullSource: CalendarSource = {
        id: 'full',
        name: 'Full Source',
        color: '#ff0000',
        description: 'A full source with all properties',
        enabled: true,
        icon: 'star',
      }

      global.fetch = createFetchMock({ sources: [fullSource] })

      const { result } = renderHook(() => useCalendarSources(apiUrl))

      await waitFor(() => {
        expect(result.current.sources).toEqual([fullSource])
      })

      expect(result.current.sources[0].description).toBe('A full source with all properties')
      expect(result.current.sources[0].enabled).toBe(true)
      expect(result.current.sources[0].icon).toBe('star')
    })

    it('should handle empty sources array', async () => {
      global.fetch = createFetchMock({ sources: [] })

      const { result } = renderHook(() => useCalendarSources(apiUrl))

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.sources).toEqual([])
      expect(result.current.error).toBeNull()
    })
  })

  describe('error handling', () => {
    it('should set error when fetch fails with non-ok response', async () => {
      global.fetch = createFetchMock({}, false, 500)

      const { result } = renderHook(() => useCalendarSources(apiUrl))

      await waitFor(() => {
        expect(result.current.error).toBeInstanceOf(Error)
      })

      expect(result.current.error?.message).toContain('500')
      expect(result.current.isLoading).toBe(false)
      expect(result.current.sources).toEqual([])
    })

    it('should set error when fetch throws network error', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'))

      const { result } = renderHook(() => useCalendarSources(apiUrl))

      await waitFor(() => {
        expect(result.current.error).toBeInstanceOf(Error)
      })

      expect(result.current.error?.message).toBe('Network error')
    })

    it('should call onError callback when fetch fails', async () => {
      global.fetch = createFetchMock({}, false, 403)

      const onError = vi.fn()

      renderHook(() => useCalendarSources(apiUrl, { onError }))

      await waitFor(() => {
        expect(onError).toHaveBeenCalled()
      })

      expect(onError).toHaveBeenCalledWith(expect.any(Error))
    })

    it('should handle non-Error exceptions', async () => {
      global.fetch = vi.fn().mockRejectedValue('string error')

      const { result } = renderHook(() => useCalendarSources(apiUrl))

      await waitFor(() => {
        expect(result.current.error).toBeInstanceOf(Error)
      })

      expect(result.current.error?.message).toBe('Failed to fetch sources')
    })

    it('should include status code in error message', async () => {
      global.fetch = createFetchMock({}, false, 404)

      const { result } = renderHook(() => useCalendarSources(apiUrl))

      await waitFor(() => {
        expect(result.current.error).toBeInstanceOf(Error)
      })

      expect(result.current.error?.message).toContain('404')
    })
  })

  describe('enabled option', () => {
    it('should not fetch when enabled is false', async () => {
      global.fetch = createFetchMock(mockSourcesResponse)

      const { result } = renderHook(() =>
        useCalendarSources(apiUrl, { enabled: false })
      )

      // Wait a tick to ensure no fetch happened
      await new Promise((resolve) => setTimeout(resolve, 50))

      expect(global.fetch).not.toHaveBeenCalled()
      expect(result.current.sources).toEqual([])
      expect(result.current.isLoading).toBe(false)
    })

    it('should fetch when enabled changes to true', async () => {
      global.fetch = createFetchMock(mockSourcesResponse)

      const { result, rerender } = renderHook(
        ({ enabled }) => useCalendarSources(apiUrl, { enabled }),
        { initialProps: { enabled: false } }
      )

      expect(global.fetch).not.toHaveBeenCalled()

      rerender({ enabled: true })

      await waitFor(() => {
        expect(result.current.sources).toEqual(mockSources)
      })
    })

    it('should default enabled to true', async () => {
      global.fetch = createFetchMock(mockSourcesResponse)

      renderHook(() => useCalendarSources(apiUrl))

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled()
      })
    })
  })

  describe('refetch functionality', () => {
    it('should refetch sources when refetch is called', async () => {
      global.fetch = createFetchMock(mockSourcesResponse)

      const { result } = renderHook(() => useCalendarSources(apiUrl))

      await waitFor(() => {
        expect(result.current.sources).toEqual(mockSources)
      })

      expect(global.fetch).toHaveBeenCalledTimes(1)

      // Update mock to return different data
      const updatedSources: CalendarSource[] = [
        { ...mockSources[0], name: 'Updated Meetings' },
      ]
      global.fetch = createFetchMock({ sources: updatedSources })

      await act(async () => {
        await result.current.refetch()
      })

      expect(result.current.sources).toEqual(updatedSources)
    })

    it('should set isLoading during refetch', async () => {
      global.fetch = createFetchMock(mockSourcesResponse)

      const { result } = renderHook(() => useCalendarSources(apiUrl))

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // Create a delayed fetch for refetch
      let resolvePromise: (value: unknown) => void
      global.fetch = vi.fn().mockImplementation(
        () =>
          new Promise((resolve) => {
            resolvePromise = resolve
          })
      )

      const refetchPromise = result.current.refetch()

      await waitFor(() => {
        expect(result.current.isLoading).toBe(true)
      })

      await act(async () => {
        resolvePromise!({
          ok: true,
          json: () => Promise.resolve(mockSourcesResponse),
        })
      })

      await refetchPromise

      expect(result.current.isLoading).toBe(false)
    })

    it('should clear error on successful refetch', async () => {
      // Start with failed fetch
      global.fetch = createFetchMock({}, false, 500)

      const { result } = renderHook(() => useCalendarSources(apiUrl))

      await waitFor(() => {
        expect(result.current.error).toBeInstanceOf(Error)
      })

      // Now succeed
      global.fetch = createFetchMock(mockSourcesResponse)

      await act(async () => {
        await result.current.refetch()
      })

      expect(result.current.error).toBeNull()
      expect(result.current.sources).toEqual(mockSources)
    })
  })

  describe('unmount handling', () => {
    it('should not update state after unmount', async () => {
      let resolvePromise: (value: unknown) => void
      global.fetch = vi.fn().mockImplementation(
        () =>
          new Promise((resolve) => {
            resolvePromise = resolve
          })
      )

      const { result, unmount } = renderHook(() => useCalendarSources(apiUrl))

      expect(result.current.isLoading).toBe(true)

      // Unmount before fetch completes
      unmount()

      // Resolve fetch after unmount - should not throw
      await act(async () => {
        resolvePromise!({
          ok: true,
          json: () => Promise.resolve(mockSourcesResponse),
        })
      })
    })
  })

  describe('dependency changes', () => {
    it('should refetch when apiUrl changes', async () => {
      global.fetch = createFetchMock(mockSourcesResponse)

      const { rerender } = renderHook(
        ({ url }) => useCalendarSources(url),
        { initialProps: { url: '/api/calendar' } }
      )

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledTimes(1)
      })

      rerender({ url: '/api/calendar-v2' })

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledTimes(2)
      })

      const lastCall = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[1][0]
      expect(lastCall).toBe('/api/calendar-v2/sources')
    })
  })

  describe('callback refs', () => {
    it('should use latest onSuccess callback', async () => {
      let resolvePromise: (value: unknown) => void
      global.fetch = vi.fn().mockImplementation(
        () =>
          new Promise((resolve) => {
            resolvePromise = resolve
          })
      )

      const onSuccess1 = vi.fn()
      const onSuccess2 = vi.fn()

      const { rerender } = renderHook(
        ({ onSuccess }) => useCalendarSources(apiUrl, { onSuccess }),
        { initialProps: { onSuccess: onSuccess1 } }
      )

      // Update the callback before fetch completes
      rerender({ onSuccess: onSuccess2 })

      // Now resolve
      await act(async () => {
        resolvePromise!({
          ok: true,
          json: () => Promise.resolve(mockSourcesResponse),
        })
      })

      await waitFor(() => {
        expect(onSuccess2).toHaveBeenCalledWith(mockSources)
      })

      // The first callback should not have been called
      expect(onSuccess1).not.toHaveBeenCalled()
    })

    it('should use latest onError callback', async () => {
      let resolvePromise: (value: unknown) => void
      global.fetch = vi.fn().mockImplementation(
        () =>
          new Promise((resolve) => {
            resolvePromise = resolve
          })
      )

      const onError1 = vi.fn()
      const onError2 = vi.fn()

      const { rerender } = renderHook(
        ({ onError }) => useCalendarSources(apiUrl, { onError }),
        { initialProps: { onError: onError1 } }
      )

      // Update the callback before fetch completes
      rerender({ onError: onError2 })

      // Now resolve with error
      await act(async () => {
        resolvePromise!({
          ok: false,
          status: 500,
          statusText: 'Error',
          json: () => Promise.resolve({}),
        })
      })

      await waitFor(() => {
        expect(onError2).toHaveBeenCalled()
      })

      // The first callback should not have been called
      expect(onError1).not.toHaveBeenCalled()
    })
  })
})
