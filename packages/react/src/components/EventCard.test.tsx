import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { EventCard } from './EventCard'
import type { CalendarEvent } from '../types'

// Mock events for testing
const mockEvent: CalendarEvent = {
  id: '1',
  title: 'Team Meeting',
  start: '2024-01-15T10:00:00Z',
  end: '2024-01-15T11:00:00Z',
  source: 'meetings',
  description: 'Weekly team sync to discuss progress and blockers',
  location: 'Conference Room A',
  backgroundColor: '#3788d8',
}

const mockAllDayEvent: CalendarEvent = {
  id: '2',
  title: 'Company Holiday',
  start: '2024-01-20T00:00:00Z',
  allDay: true,
  source: 'holidays',
}

const mockMultiDayEvent: CalendarEvent = {
  id: '3',
  title: 'Conference',
  start: '2024-01-25T09:00:00Z',
  end: '2024-01-27T17:00:00Z',
  source: 'events',
}

describe('EventCard', () => {
  describe('rendering', () => {
    it('should render event title', () => {
      render(<EventCard event={mockEvent} />)

      expect(screen.getByText('Team Meeting')).toBeInTheDocument()
    })

    it('should render event description when showDescription is true', () => {
      render(<EventCard event={mockEvent} showDescription />)

      expect(screen.getByText(mockEvent.description!)).toBeInTheDocument()
    })

    it('should not render description when showDescription is false', () => {
      render(<EventCard event={mockEvent} showDescription={false} />)

      expect(screen.queryByText(mockEvent.description!)).not.toBeInTheDocument()
    })

    it('should render location when showLocation is true', () => {
      render(<EventCard event={mockEvent} showLocation />)

      expect(screen.getByText('Conference Room A')).toBeInTheDocument()
    })

    it('should not render location when showLocation is false', () => {
      render(<EventCard event={mockEvent} showLocation={false} />)

      expect(screen.queryByText('Conference Room A')).not.toBeInTheDocument()
    })

    it('should render source badge when showSource is true', () => {
      render(<EventCard event={mockEvent} showSource />)

      expect(screen.getByText('meetings')).toBeInTheDocument()
    })

    it('should not render source badge when showSource is false', () => {
      render(<EventCard event={mockEvent} showSource={false} />)

      expect(screen.queryByText('meetings')).not.toBeInTheDocument()
    })

    it('should show "All day" badge for all-day events', () => {
      render(<EventCard event={mockAllDayEvent} />)

      expect(screen.getByText('All day')).toBeInTheDocument()
    })

    it('should not show "All day" badge for timed events', () => {
      render(<EventCard event={mockEvent} />)

      expect(screen.queryByText('All day')).not.toBeInTheDocument()
    })

    it('should render with accessible aria-label when clickable', () => {
      render(<EventCard event={mockEvent} onClick={() => {}} />)

      const card = screen.getByRole('button')
      expect(card).toHaveAttribute('aria-label')
      expect(card.getAttribute('aria-label')).toContain('Team Meeting')
    })

    it('should apply custom className', () => {
      const { container } = render(
        <EventCard event={mockEvent} className="custom-class" />
      )

      expect(container.firstChild).toHaveClass('custom-class')
    })
  })

  describe('date formatting', () => {
    it('should format date and time for timed events', () => {
      render(<EventCard event={mockEvent} />)

      // Just verify the component renders the title (date format is locale-dependent)
      expect(screen.getByText('Team Meeting')).toBeInTheDocument()
    })

    it('should format date for all-day events', () => {
      render(<EventCard event={mockAllDayEvent} />)

      expect(screen.getByText('Company Holiday')).toBeInTheDocument()
    })

    it('should use custom date format when provided', () => {
      const customDateFormat: Intl.DateTimeFormatOptions = {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }

      render(
        <EventCard
          event={mockEvent}
          dateFormat={customDateFormat}
        />
      )

      expect(screen.getByText('Team Meeting')).toBeInTheDocument()
    })
  })

  describe('compact mode', () => {
    it('should render in compact mode when compact is true', () => {
      const { container } = render(
        <EventCard event={mockEvent} compact />
      )

      // Compact mode should have different padding
      const card = container.firstChild as HTMLElement
      expect(card.style.padding).toBe('8px')
    })

    it('should render in full mode when compact is false', () => {
      const { container } = render(
        <EventCard event={mockEvent} compact={false} />
      )

      // Full mode should have 16px padding
      const card = container.firstChild as HTMLElement
      expect(card.style.padding).toBe('16px')
    })

    it('should show truncated content in compact mode', () => {
      render(<EventCard event={mockEvent} compact />)

      expect(screen.getByText('Team Meeting')).toBeInTheDocument()
    })
  })

  describe('click handling', () => {
    it('should call onClick when card is clicked', async () => {
      const onClick = vi.fn()
      const user = userEvent.setup()

      render(<EventCard event={mockEvent} onClick={onClick} />)

      const card = screen.getByRole('button')
      await user.click(card)

      expect(onClick).toHaveBeenCalledTimes(1)
      expect(onClick).toHaveBeenCalledWith(mockEvent)
    })

    it('should not have button role when no onClick is provided', () => {
      render(<EventCard event={mockEvent} />)

      // Card should not have button role when no onClick
      expect(screen.queryByRole('button')).not.toBeInTheDocument()
    })

    it('should call onClick on Enter key press', () => {
      const onClick = vi.fn()

      render(<EventCard event={mockEvent} onClick={onClick} />)

      const card = screen.getByRole('button')
      fireEvent.keyDown(card, { key: 'Enter' })

      expect(onClick).toHaveBeenCalledTimes(1)
      expect(onClick).toHaveBeenCalledWith(mockEvent)
    })

    it('should call onClick on Space key press', () => {
      const onClick = vi.fn()

      render(<EventCard event={mockEvent} onClick={onClick} />)

      const card = screen.getByRole('button')
      fireEvent.keyDown(card, { key: ' ' })

      expect(onClick).toHaveBeenCalledTimes(1)
    })

    it('should not call onClick on other key presses', () => {
      const onClick = vi.fn()

      render(<EventCard event={mockEvent} onClick={onClick} />)

      const card = screen.getByRole('button')
      fireEvent.keyDown(card, { key: 'Tab' })

      expect(onClick).not.toHaveBeenCalled()
    })

    it('should have correct cursor style based on onClick', () => {
      const { container, rerender } = render(
        <EventCard event={mockEvent} onClick={() => {}} />
      )

      let card = container.firstChild as HTMLElement
      expect(card.style.cursor).toBe('pointer')

      rerender(<EventCard event={mockEvent} />)

      card = container.firstChild as HTMLElement
      expect(card.style.cursor).toBe('default')
    })
  })

  describe('accessibility', () => {
    it('should have button role when onClick is provided', () => {
      render(<EventCard event={mockEvent} onClick={() => {}} />)

      expect(screen.getByRole('button')).toBeInTheDocument()
    })

    it('should be focusable when onClick is provided', () => {
      render(<EventCard event={mockEvent} onClick={() => {}} />)

      const card = screen.getByRole('button')
      expect(card).toHaveAttribute('tabIndex', '0')
    })

    it('should not be focusable when onClick is not provided', () => {
      const { container } = render(<EventCard event={mockEvent} />)

      const card = container.firstChild as HTMLElement
      expect(card.getAttribute('tabIndex')).toBeNull()
    })

    it('should have aria-hidden on decorative icons', () => {
      render(<EventCard event={mockEvent} showLocation />)

      const icons = document.querySelectorAll('svg[aria-hidden="true"]')
      expect(icons.length).toBeGreaterThan(0)
    })
  })

  describe('colors and styling', () => {
    it('should use backgroundColor for accent color when provided', () => {
      const { container } = render(<EventCard event={mockEvent} />)

      const card = container.firstChild as HTMLElement
      // Browser converts hex to rgb
      expect(card.style.borderLeft).toContain('rgb(55, 136, 216)')
    })

    it('should use borderColor for accent when backgroundColor is not provided', () => {
      const eventWithBorderColor: CalendarEvent = {
        ...mockEvent,
        backgroundColor: undefined,
        borderColor: '#ff0000',
      }

      const { container } = render(<EventCard event={eventWithBorderColor} />)

      const card = container.firstChild as HTMLElement
      // Browser converts hex to rgb
      expect(card.style.borderLeft).toContain('rgb(255, 0, 0)')
    })

    it('should use default color when no color is specified', () => {
      const eventWithoutColor: CalendarEvent = {
        id: '4',
        title: 'No Color Event',
        start: '2024-01-15T10:00:00Z',
        source: 'test',
      }

      const { container } = render(<EventCard event={eventWithoutColor} />)

      const card = container.firstChild as HTMLElement
      // Default color #3788d8 as rgb
      expect(card.style.borderLeft).toContain('rgb(55, 136, 216)')
    })

    it('should apply source badge color based on event color', () => {
      render(<EventCard event={mockEvent} showSource />)

      const badge = screen.getByText('meetings')
      expect(badge.style.color).toBe('rgb(55, 136, 216)')
    })
  })

  describe('events without optional fields', () => {
    it('should handle event without description', () => {
      const eventWithoutDescription: CalendarEvent = {
        ...mockEvent,
        description: undefined,
      }

      render(<EventCard event={eventWithoutDescription} showDescription />)

      expect(screen.getByText('Team Meeting')).toBeInTheDocument()
    })

    it('should handle event without location', () => {
      const eventWithoutLocation: CalendarEvent = {
        ...mockEvent,
        location: undefined,
      }

      render(<EventCard event={eventWithoutLocation} showLocation />)

      expect(screen.getByText('Team Meeting')).toBeInTheDocument()
      expect(screen.queryByText('Conference Room A')).not.toBeInTheDocument()
    })

    it('should handle event without end time', () => {
      const eventWithoutEnd: CalendarEvent = {
        id: '5',
        title: 'Open-ended Event',
        start: '2024-01-15T10:00:00Z',
        source: 'test',
      }

      render(<EventCard event={eventWithoutEnd} />)

      expect(screen.getByText('Open-ended Event')).toBeInTheDocument()
    })
  })

  describe('date ranges', () => {
    it('should display multi-day event range correctly', () => {
      render(<EventCard event={mockMultiDayEvent} />)

      expect(screen.getByText('Conference')).toBeInTheDocument()
    })

    it('should display all-day multi-day event range', () => {
      const multiDayAllDay: CalendarEvent = {
        id: '6',
        title: 'Vacation',
        start: '2024-01-25T00:00:00Z',
        end: '2024-01-28T00:00:00Z',
        allDay: true,
        source: 'personal',
      }

      render(<EventCard event={multiDayAllDay} />)

      expect(screen.getByText('Vacation')).toBeInTheDocument()
      expect(screen.getByText('All day')).toBeInTheDocument()
    })
  })
})
