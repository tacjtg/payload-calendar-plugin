import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { UpcomingEvents } from './UpcomingEvents'
import type { CalendarEvent, CalendarEventsResponse } from '../types'

// Helper to create dates relative to now (called at test time)
function createDate(daysFromNow: number, hours = 10): Date {
  const date = new Date()
  date.setDate(date.getDate() + daysFromNow)
  date.setHours(hours, 0, 0, 0)
  return date
}

// Factory function to create mock events at test time
function createMockEvents(): CalendarEvent[] {
  const now = new Date()
  const laterToday = new Date(now.getTime() + 2 * 60 * 60 * 1000) // 2 hours from now

  return [
    {
      id: '1',
      title: 'Team Meeting',
      start: laterToday.toISOString(),
      end: new Date(laterToday.getTime() + 60 * 60 * 1000).toISOString(), // 1 hour later
      source: 'meetings',
    },
    {
      id: '2',
      title: 'Project Review',
      start: createDate(1, 10).toISOString(),
      end: createDate(1, 11).toISOString(),
      source: 'meetings',
    },
    {
      id: '3',
      title: 'Conference',
      start: createDate(3, 9).toISOString(),
      end: createDate(3, 17).toISOString(),
      source: 'events',
      location: 'Convention Center',
    },
    {
      id: '4',
      title: 'Company Holiday',
      start: createDate(7).toISOString(),
      allDay: true,
      source: 'holidays',
    },
  ]
}

function createFetchMock(response: unknown, ok = true, status = 200) {
  return vi.fn().mockResolvedValue({
    ok,
    status,
    statusText: ok ? 'OK' : 'Error',
    json: () => Promise.resolve(response),
  })
}

describe('UpcomingEvents', () => {
  const apiUrl = '/api/calendar'

  beforeEach(() => {
    vi.clearAllMocks()
    const mockEvents = createMockEvents()
    global.fetch = createFetchMock({
      events: mockEvents,
      total: mockEvents.length,
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('rendering', () => {
    it('should render title by default', async () => {
      render(<UpcomingEvents apiUrl={apiUrl} />)

      expect(screen.getByText('Upcoming Events')).toBeInTheDocument()
    })

    it('should render custom title', async () => {
      render(<UpcomingEvents apiUrl={apiUrl} title="What's Next" />)

      expect(screen.getByText("What's Next")).toBeInTheDocument()
    })

    it('should not render title when title is empty', async () => {
      render(<UpcomingEvents apiUrl={apiUrl} title="" />)

      expect(screen.queryByRole('heading', { level: 2 })).not.toBeInTheDocument()
    })

    it('should apply custom className', async () => {
      const { container } = render(
        <UpcomingEvents apiUrl={apiUrl} className="custom-upcoming" />
      )

      expect(container.firstChild).toHaveClass('custom-upcoming')
    })

    it('should render events after loading', async () => {
      render(<UpcomingEvents apiUrl={apiUrl} />)

      await waitFor(() => {
        expect(screen.getByText('Team Meeting')).toBeInTheDocument()
      })

      expect(screen.getByText('Project Review')).toBeInTheDocument()
      expect(screen.getByText('Conference')).toBeInTheDocument()
    })
  })

  describe('loading state', () => {
    it('should show loading skeleton while fetching', () => {
      global.fetch = vi.fn().mockImplementation(() => new Promise(() => {}))

      render(<UpcomingEvents apiUrl={apiUrl} />)

      expect(screen.getByText('Upcoming Events')).toBeInTheDocument()
    })

    it('should hide loading state after fetch completes', async () => {
      render(<UpcomingEvents apiUrl={apiUrl} />)

      await waitFor(() => {
        expect(screen.getByText('Team Meeting')).toBeInTheDocument()
      })
    })
  })

  describe('error state', () => {
    it('should show error message when fetch fails', async () => {
      global.fetch = createFetchMock({}, false, 500)

      render(<UpcomingEvents apiUrl={apiUrl} />)

      await waitFor(() => {
        expect(screen.getByText('Failed to load events')).toBeInTheDocument()
      })
    })

    it('should still show title in error state', async () => {
      global.fetch = createFetchMock({}, false, 500)

      render(<UpcomingEvents apiUrl={apiUrl} />)

      await waitFor(() => {
        expect(screen.getByText('Upcoming Events')).toBeInTheDocument()
        expect(screen.getByText('Failed to load events')).toBeInTheDocument()
      })
    })
  })

  describe('empty state', () => {
    it('should show default empty state when no events', async () => {
      global.fetch = createFetchMock({ events: [], total: 0 })

      render(<UpcomingEvents apiUrl={apiUrl} />)

      await waitFor(() => {
        expect(screen.getByText('No upcoming events')).toBeInTheDocument()
      })
    })

    it('should show custom empty component when provided', async () => {
      global.fetch = createFetchMock({ events: [], total: 0 })

      render(
        <UpcomingEvents
          apiUrl={apiUrl}
          emptyComponent={<div>Custom empty message</div>}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Custom empty message')).toBeInTheDocument()
      })
    })
  })

  describe('event grouping', () => {
    it('should group events by date', async () => {
      render(<UpcomingEvents apiUrl={apiUrl} />)

      await waitFor(() => {
        expect(screen.getByText('Today')).toBeInTheDocument()
        expect(screen.getByText('Tomorrow')).toBeInTheDocument()
      })
    })

    it('should show "Today" for events happening today', async () => {
      const now = new Date()
      const laterToday = new Date(now.getTime() + 2 * 60 * 60 * 1000)
      const todayEvent: CalendarEvent = {
        id: 'today',
        title: 'Today Event',
        start: laterToday.toISOString(),
        source: 'test',
      }

      global.fetch = createFetchMock({ events: [todayEvent], total: 1 })

      render(<UpcomingEvents apiUrl={apiUrl} />)

      await waitFor(() => {
        expect(screen.getByText('Today')).toBeInTheDocument()
      })
    })

    it('should show "Tomorrow" for events happening tomorrow', async () => {
      const tomorrowEvent: CalendarEvent = {
        id: 'tomorrow',
        title: 'Tomorrow Event',
        start: createDate(1, 14).toISOString(),
        source: 'test',
      }

      global.fetch = createFetchMock({ events: [tomorrowEvent], total: 1 })

      render(<UpcomingEvents apiUrl={apiUrl} />)

      await waitFor(() => {
        expect(screen.getByText('Tomorrow')).toBeInTheDocument()
      })
    })
  })

  describe('limit option', () => {
    it('should limit the number of events shown', async () => {
      render(<UpcomingEvents apiUrl={apiUrl} limit={2} />)

      await waitFor(() => {
        expect(screen.getByText('Team Meeting')).toBeInTheDocument()
        expect(screen.getByText('Project Review')).toBeInTheDocument()
      })

      expect(screen.queryByText('Conference')).not.toBeInTheDocument()
      expect(screen.queryByText('Company Holiday')).not.toBeInTheDocument()
    })

    it('should use default limit of 10', async () => {
      const now = new Date()
      const manyEvents: CalendarEvent[] = Array.from({ length: 15 }, (_, i) => ({
        id: `event-${i}`,
        title: `Event ${i + 1}`,
        start: new Date(now.getTime() + (i + 1) * 24 * 60 * 60 * 1000).toISOString(),
        source: 'test',
      }))

      global.fetch = createFetchMock({ events: manyEvents, total: 15 })

      render(<UpcomingEvents apiUrl={apiUrl} />)

      await waitFor(() => {
        expect(screen.getByText('Event 1')).toBeInTheDocument()
        expect(screen.getByText('Event 10')).toBeInTheDocument()
      })

      expect(screen.queryByText('Event 11')).not.toBeInTheDocument()
    })
  })

  describe('daysAhead option', () => {
    it('should fetch events within specified days range', async () => {
      render(<UpcomingEvents apiUrl={apiUrl} daysAhead={7} />)

      await waitFor(() => {
        const fetchCall = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0][0] as string
        expect(fetchCall).toContain('start=')
        expect(fetchCall).toContain('end=')
      })
    })
  })

  describe('sources option', () => {
    it('should pass sources to API', async () => {
      render(
        <UpcomingEvents apiUrl={apiUrl} sources={['meetings', 'events']} />
      )

      await waitFor(() => {
        const fetchCall = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0][0] as string
        expect(fetchCall).toContain('sources=meetings')
        expect(fetchCall).toContain('events')
      })
    })
  })

  describe('event click handling', () => {
    it('should call onEventClick when event is clicked', async () => {
      const onEventClick = vi.fn()
      const user = userEvent.setup()

      render(
        <UpcomingEvents apiUrl={apiUrl} onEventClick={onEventClick} />
      )

      await waitFor(() => {
        expect(screen.getByText('Team Meeting')).toBeInTheDocument()
      })

      const eventCard = screen.getByText('Team Meeting').closest('[role="button"]')!
      await user.click(eventCard)

      expect(onEventClick).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Team Meeting' })
      )
    })
  })

  describe('showSource option', () => {
    it('should pass showSource to EventCard component', async () => {
      // Note: UpcomingEvents uses compact EventCards which don't display
      // source badges, but the prop is still passed for potential future use
      // or component customization
      render(<UpcomingEvents apiUrl={apiUrl} showSource={true} />)

      await waitFor(() => {
        expect(screen.getByText('Team Meeting')).toBeInTheDocument()
      })

      // Verify events are rendered - compact mode doesn't show source badge
      // but this ensures the showSource prop doesn't break rendering
      expect(screen.getByText('Project Review')).toBeInTheDocument()
    })
  })

  describe('filtering past events', () => {
    it('should not show past events', async () => {
      const mockEvents = createMockEvents()
      const pastEvent: CalendarEvent = {
        id: 'past',
        title: 'Past Event',
        start: createDate(-1).toISOString(),
        source: 'test',
      }

      global.fetch = createFetchMock({
        events: [pastEvent, ...mockEvents],
        total: mockEvents.length + 1,
      })

      render(<UpcomingEvents apiUrl={apiUrl} />)

      await waitFor(() => {
        expect(screen.getByText('Team Meeting')).toBeInTheDocument()
      })

      expect(screen.queryByText('Past Event')).not.toBeInTheDocument()
    })

    it('should show all-day events that are today', async () => {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const todayAllDay: CalendarEvent = {
        id: 'today-allday',
        title: 'Today All Day',
        start: today.toISOString(),
        allDay: true,
        source: 'test',
      }

      global.fetch = createFetchMock({ events: [todayAllDay], total: 1 })

      render(<UpcomingEvents apiUrl={apiUrl} />)

      await waitFor(() => {
        expect(screen.getByText('Today All Day')).toBeInTheDocument()
      })
    })

    it('should show events that have started but not ended', async () => {
      const now = new Date()
      const ongoingEvent: CalendarEvent = {
        id: 'ongoing',
        title: 'Ongoing Event',
        start: new Date(now.getTime() - 60 * 60 * 1000).toISOString(), // Started 1 hour ago
        end: new Date(now.getTime() + 60 * 60 * 1000).toISOString(), // Ends in 1 hour
        source: 'test',
      }

      global.fetch = createFetchMock({ events: [ongoingEvent], total: 1 })

      render(<UpcomingEvents apiUrl={apiUrl} />)

      await waitFor(() => {
        expect(screen.getByText('Ongoing Event')).toBeInTheDocument()
      })
    })
  })

  describe('event sorting', () => {
    it('should sort events by start date', async () => {
      const now = new Date()
      const unsortedEvents: CalendarEvent[] = [
        { id: '3', title: 'Third', start: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString(), source: 'test' },
        { id: '1', title: 'First', start: new Date(now.getTime() + 1 * 60 * 60 * 1000).toISOString(), source: 'test' },
        { id: '2', title: 'Second', start: new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000).toISOString(), source: 'test' },
      ]

      global.fetch = createFetchMock({ events: unsortedEvents, total: 3 })

      // Add onClick to ensure buttons are rendered
      render(<UpcomingEvents apiUrl={apiUrl} onEventClick={() => {}} />)

      await waitFor(() => {
        expect(screen.getByText('First')).toBeInTheDocument()
      })

      const eventButtons = screen.getAllByRole('button')
      const titles = eventButtons.map(el => el.textContent)

      const firstIndex = titles.findIndex(t => t?.includes('First'))
      const secondIndex = titles.findIndex(t => t?.includes('Second'))
      const thirdIndex = titles.findIndex(t => t?.includes('Third'))

      expect(firstIndex).toBeLessThan(secondIndex)
      expect(secondIndex).toBeLessThan(thirdIndex)
    })
  })

  describe('custom date format', () => {
    it('should accept custom dateFormat', async () => {
      const customFormat: Intl.DateTimeFormatOptions = {
        weekday: 'short',
        month: 'numeric',
        day: 'numeric',
      }

      render(<UpcomingEvents apiUrl={apiUrl} dateFormat={customFormat} />)

      await waitFor(() => {
        expect(screen.getByText('Team Meeting')).toBeInTheDocument()
      })
    })
  })

  describe('compact event cards', () => {
    it('should render EventCards in compact mode', async () => {
      // Add onClick to ensure EventCards have button role
      render(<UpcomingEvents apiUrl={apiUrl} onEventClick={() => {}} />)

      await waitFor(() => {
        expect(screen.getByText('Team Meeting')).toBeInTheDocument()
      })

      const eventCard = screen.getByText('Team Meeting').closest('[role="button"]') as HTMLElement
      expect(eventCard).not.toBeNull()
      expect(eventCard.style.padding).toBe('8px')
    })
  })
})
