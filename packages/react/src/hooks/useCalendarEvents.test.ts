import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { useCalendarEvents } from './useCalendarEvents'
import type { CalendarEvent, CalendarEventsResponse } from '../types'

// Mock data
const mockEvents: CalendarEvent[] = [
  {
    id: '1',
    title: 'Team Meeting',
    start: '2024-01-15T10:00:00Z',
    end: '2024-01-15T11:00:00Z',
    source: 'meetings',
    description: 'Weekly team sync',
  },
  {
    id: '2',
    title: 'Project Deadline',
    start: '2024-01-20T00:00:00Z',
    allDay: true,
    source: 'deadlines',
  },
  {
    id: '3',
    title: 'Conference',
    start: '2024-01-25T09:00:00Z',
    end: '2024-01-26T17:00:00Z',
    source: 'events',
    location: 'Convention Center',
  },
]

const mockEventsResponse: CalendarEventsResponse = {
  events: mockEvents,
  total: mockEvents.length,
}

function createFetchMock(response: unknown, ok = true, status = 200) {
  return vi.fn().mockResolvedValue({
    ok,
    status,
    statusText: ok ? 'OK' : 'Error',
    json: () => Promise.resolve(response),
  })
}

describe('useCalendarEvents', () => {
  const apiUrl = '/api/calendar'

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('initial state', () => {
    it('should return empty events array initially', () => {
      global.fetch = createFetchMock(mockEventsResponse)

      const { result } = renderHook(() => useCalendarEvents(apiUrl))

      expect(result.current.events).toEqual([])
    })

    it('should set isLoading to true during fetch', async () => {
      let resolvePromise: (value: unknown) => void
      const delayedPromise = new Promise((resolve) => {
        resolvePromise = resolve
      })

      global.fetch = vi.fn().mockImplementation(() => delayedPromise)

      const { result } = renderHook(() => useCalendarEvents(apiUrl))

      expect(result.current.isLoading).toBe(true)

      await act(async () => {
        resolvePromise!({
          ok: true,
          json: () => Promise.resolve(mockEventsResponse),
        })
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })
    })

    it('should have null error initially', () => {
      global.fetch = createFetchMock(mockEventsResponse)

      const { result } = renderHook(() => useCalendarEvents(apiUrl))

      expect(result.current.error).toBeNull()
    })
  })

  describe('successful data fetching', () => {
    it('should fetch events on mount', async () => {
      global.fetch = createFetchMock(mockEventsResponse)

      const { result } = renderHook(() => useCalendarEvents(apiUrl))

      await waitFor(() => {
        expect(result.current.events).toEqual(mockEvents)
      })

      expect(result.current.isLoading).toBe(false)
      expect(result.current.error).toBeNull()
    })

    it('should call API with correct URL', async () => {
      global.fetch = createFetchMock(mockEventsResponse)

      renderHook(() => useCalendarEvents(apiUrl))

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(`${apiUrl}/events`)
      })
    })

    it('should include start parameter in URL when provided', async () => {
      global.fetch = createFetchMock(mockEventsResponse)

      const start = new Date('2024-01-01T00:00:00Z')

      renderHook(() => useCalendarEvents(apiUrl, { start }))

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('start=2024-01-01')
        )
      })
    })

    it('should include end parameter in URL when provided', async () => {
      global.fetch = createFetchMock(mockEventsResponse)

      const end = new Date('2024-01-31T23:59:59Z')

      renderHook(() => useCalendarEvents(apiUrl, { end }))

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('end=2024-01-31')
        )
      })
    })

    it('should include sources parameter in URL when provided', async () => {
      global.fetch = createFetchMock(mockEventsResponse)

      const sources = ['meetings', 'events']

      renderHook(() => useCalendarEvents(apiUrl, { sources }))

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('sources=meetings%2Cevents')
        )
      })
    })

    it('should include all parameters when provided', async () => {
      global.fetch = createFetchMock(mockEventsResponse)

      const start = '2024-01-01'
      const end = '2024-01-31'
      const sources = ['meetings']

      renderHook(() => useCalendarEvents(apiUrl, { start, end, sources }))

      await waitFor(() => {
        const fetchCall = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0][0] as string
        expect(fetchCall).toContain('start=2024-01-01')
        expect(fetchCall).toContain('end=2024-01-31')
        expect(fetchCall).toContain('sources=meetings')
      })
    })

    it('should call onSuccess callback when fetch succeeds', async () => {
      global.fetch = createFetchMock(mockEventsResponse)

      const onSuccess = vi.fn()

      renderHook(() => useCalendarEvents(apiUrl, { onSuccess }))

      await waitFor(() => {
        expect(onSuccess).toHaveBeenCalledWith(mockEvents)
      })
    })
  })

  describe('error handling', () => {
    it('should set error when fetch fails with non-ok response', async () => {
      global.fetch = createFetchMock({}, false, 500)

      const { result } = renderHook(() => useCalendarEvents(apiUrl))

      await waitFor(() => {
        expect(result.current.error).toBeInstanceOf(Error)
      })

      expect(result.current.error?.message).toContain('500')
      expect(result.current.isLoading).toBe(false)
      expect(result.current.events).toEqual([])
    })

    it('should set error when fetch throws', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'))

      const { result } = renderHook(() => useCalendarEvents(apiUrl))

      await waitFor(() => {
        expect(result.current.error).toBeInstanceOf(Error)
      })

      expect(result.current.error?.message).toBe('Network error')
    })

    it('should call onError callback when fetch fails', async () => {
      global.fetch = createFetchMock({}, false, 404)

      const onError = vi.fn()

      renderHook(() => useCalendarEvents(apiUrl, { onError }))

      await waitFor(() => {
        expect(onError).toHaveBeenCalled()
      })

      expect(onError).toHaveBeenCalledWith(expect.any(Error))
    })

    it('should handle non-Error exceptions', async () => {
      global.fetch = vi.fn().mockRejectedValue('string error')

      const { result } = renderHook(() => useCalendarEvents(apiUrl))

      await waitFor(() => {
        expect(result.current.error).toBeInstanceOf(Error)
      })

      expect(result.current.error?.message).toBe('Failed to fetch events')
    })
  })

  describe('enabled option', () => {
    it('should not fetch when enabled is false', async () => {
      global.fetch = createFetchMock(mockEventsResponse)

      const { result } = renderHook(() =>
        useCalendarEvents(apiUrl, { enabled: false })
      )

      // Wait a tick to ensure no fetch happened
      await new Promise((resolve) => setTimeout(resolve, 50))

      expect(global.fetch).not.toHaveBeenCalled()
      expect(result.current.events).toEqual([])
      expect(result.current.isLoading).toBe(false)
    })

    it('should fetch when enabled changes to true', async () => {
      global.fetch = createFetchMock(mockEventsResponse)

      const { result, rerender } = renderHook(
        ({ enabled }) => useCalendarEvents(apiUrl, { enabled }),
        { initialProps: { enabled: false } }
      )

      expect(global.fetch).not.toHaveBeenCalled()

      rerender({ enabled: true })

      await waitFor(() => {
        expect(result.current.events).toEqual(mockEvents)
      })
    })
  })

  describe('refetch functionality', () => {
    it('should refetch events when refetch is called', async () => {
      global.fetch = createFetchMock(mockEventsResponse)

      const { result } = renderHook(() => useCalendarEvents(apiUrl))

      await waitFor(() => {
        expect(result.current.events).toEqual(mockEvents)
      })

      expect(global.fetch).toHaveBeenCalledTimes(1)

      // Update mock to return different data
      const updatedEvents = [{ ...mockEvents[0], title: 'Updated Meeting' }]
      global.fetch = createFetchMock({ events: updatedEvents, total: 1 })

      await act(async () => {
        await result.current.refetch()
      })

      expect(result.current.events).toEqual(updatedEvents)
    })

    it('should set isLoading during refetch', async () => {
      global.fetch = createFetchMock(mockEventsResponse)

      const { result } = renderHook(() => useCalendarEvents(apiUrl))

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
          json: () => Promise.resolve(mockEventsResponse),
        })
      })

      await refetchPromise

      expect(result.current.isLoading).toBe(false)
    })
  })

  describe('mutate functionality', () => {
    it('should update events when mutate is called', async () => {
      global.fetch = createFetchMock(mockEventsResponse)

      const { result } = renderHook(() => useCalendarEvents(apiUrl))

      await waitFor(() => {
        expect(result.current.events).toEqual(mockEvents)
      })

      const newEvents: CalendarEvent[] = [
        { id: '99', title: 'New Event', start: '2024-02-01', source: 'test' },
      ]

      act(() => {
        result.current.mutate(newEvents)
      })

      expect(result.current.events).toEqual(newEvents)
    })
  })

  describe('refetchInterval', () => {
    it('should set up an interval when refetchInterval is specified', async () => {
      global.fetch = createFetchMock(mockEventsResponse)

      const { result } = renderHook(() =>
        useCalendarEvents(apiUrl, { refetchInterval: 100 })
      )

      // Wait for initial fetch
      await waitFor(() => {
        expect(result.current.events).toEqual(mockEvents)
      })

      const initialCallCount = (global.fetch as ReturnType<typeof vi.fn>).mock.calls.length

      // Wait for interval to fire (using real timers)
      await new Promise((resolve) => setTimeout(resolve, 150))

      // Should have more calls due to interval
      expect((global.fetch as ReturnType<typeof vi.fn>).mock.calls.length).toBeGreaterThan(
        initialCallCount
      )
    })

    it('should not set up interval when refetchInterval is 0', async () => {
      global.fetch = createFetchMock(mockEventsResponse)

      const { result } = renderHook(() =>
        useCalendarEvents(apiUrl, { refetchInterval: 0 })
      )

      await waitFor(() => {
        expect(result.current.events).toEqual(mockEvents)
      })

      const callCountAfterInitial = (global.fetch as ReturnType<typeof vi.fn>).mock.calls.length

      // Wait some time - should not fetch again
      await new Promise((resolve) => setTimeout(resolve, 150))

      expect(global.fetch).toHaveBeenCalledTimes(callCountAfterInitial)
    })

    it('should clear interval on unmount', async () => {
      global.fetch = createFetchMock(mockEventsResponse)

      const { result, unmount } = renderHook(() =>
        useCalendarEvents(apiUrl, { refetchInterval: 100 })
      )

      await waitFor(() => {
        expect(result.current.events).toEqual(mockEvents)
      })

      const callCountBeforeUnmount = (global.fetch as ReturnType<typeof vi.fn>).mock.calls.length

      unmount()

      // Wait for potential interval fire
      await new Promise((resolve) => setTimeout(resolve, 200))

      // Should stay the same because interval was cleared on unmount
      expect(global.fetch).toHaveBeenCalledTimes(callCountBeforeUnmount)
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

      const { result, unmount } = renderHook(() => useCalendarEvents(apiUrl))

      expect(result.current.isLoading).toBe(true)

      // Unmount before fetch completes
      unmount()

      // Resolve fetch after unmount - should not throw
      await act(async () => {
        resolvePromise!({
          ok: true,
          json: () => Promise.resolve(mockEventsResponse),
        })
      })
    })
  })

  describe('dependency changes', () => {
    it('should refetch when apiUrl changes', async () => {
      global.fetch = createFetchMock(mockEventsResponse)

      const { result, rerender } = renderHook(
        ({ url }) => useCalendarEvents(url),
        { initialProps: { url: '/api/calendar' } }
      )

      // Wait for initial fetch to complete
      await waitFor(() => {
        expect(result.current.events).toEqual(mockEvents)
      })

      const initialCallCount = (global.fetch as ReturnType<typeof vi.fn>).mock.calls.length

      rerender({ url: '/api/calendar-v2' })

      await waitFor(() => {
        expect((global.fetch as ReturnType<typeof vi.fn>).mock.calls.length).toBeGreaterThan(initialCallCount)
      })

      const lastCall = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[
        (global.fetch as ReturnType<typeof vi.fn>).mock.calls.length - 1
      ][0]
      expect(lastCall).toContain('/api/calendar-v2')
    })

    it('should refetch when sources change', async () => {
      global.fetch = createFetchMock(mockEventsResponse)

      const { result, rerender } = renderHook(
        ({ sources }) => useCalendarEvents(apiUrl, { sources }),
        { initialProps: { sources: ['meetings'] as string[] } }
      )

      // Wait for initial fetch to complete
      await waitFor(() => {
        expect(result.current.events).toEqual(mockEvents)
      })

      const initialCallCount = (global.fetch as ReturnType<typeof vi.fn>).mock.calls.length

      rerender({ sources: ['meetings', 'events'] })

      await waitFor(() => {
        expect((global.fetch as ReturnType<typeof vi.fn>).mock.calls.length).toBeGreaterThan(initialCallCount)
      })
    })
  })
})
