import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SourceFilter } from './SourceFilter'
import type { CalendarSource } from '../types'

// Mock sources for testing
const mockSources: CalendarSource[] = [
  {
    id: 'meetings',
    name: 'Meetings',
    color: '#3788d8',
    description: 'Team and client meetings',
  },
  {
    id: 'events',
    name: 'Events',
    color: '#10b981',
    description: 'Company events',
  },
  {
    id: 'deadlines',
    name: 'Deadlines',
    color: '#ef4444',
  },
]

describe('SourceFilter', () => {
  const defaultProps = {
    sources: mockSources,
    selectedSources: [] as string[],
    onSelectionChange: vi.fn(),
  }

  describe('rendering', () => {
    it('should render all sources', () => {
      render(<SourceFilter {...defaultProps} />)

      expect(screen.getByText('Meetings')).toBeInTheDocument()
      expect(screen.getByText('Events')).toBeInTheDocument()
      expect(screen.getByText('Deadlines')).toBeInTheDocument()
    })

    it('should render title by default', () => {
      render(<SourceFilter {...defaultProps} />)

      expect(screen.getByText('Filter by Source')).toBeInTheDocument()
    })

    it('should render custom title', () => {
      render(
        <SourceFilter {...defaultProps} title="Select Categories" />
      )

      expect(screen.getByText('Select Categories')).toBeInTheDocument()
    })

    it('should not render title when title is empty', () => {
      render(<SourceFilter {...defaultProps} title="" />)

      expect(screen.queryByText('Filter by Source')).not.toBeInTheDocument()
    })

    it('should render Select All option by default', () => {
      render(<SourceFilter {...defaultProps} />)

      expect(screen.getByText('Select All')).toBeInTheDocument()
    })

    it('should not render Select All when showSelectAll is false', () => {
      render(<SourceFilter {...defaultProps} showSelectAll={false} />)

      expect(screen.queryByText('Select All')).not.toBeInTheDocument()
      expect(screen.queryByText('Deselect All')).not.toBeInTheDocument()
    })

    it('should render empty state when no sources provided', () => {
      render(<SourceFilter {...defaultProps} sources={[]} />)

      expect(screen.getByText('No calendar sources available')).toBeInTheDocument()
    })

    it('should apply custom className', () => {
      const { container } = render(
        <SourceFilter {...defaultProps} className="custom-filter" />
      )

      expect(container.firstChild).toHaveClass('custom-filter')
    })

    it('should render color indicators when showColors is true', () => {
      const { container } = render(
        <SourceFilter {...defaultProps} showColors />
      )

      // Color indicators are circular spans
      const colorIndicators = container.querySelectorAll('span[style*="border-radius: 50%"]')
      expect(colorIndicators.length).toBe(3) // One for each source
    })

    it('should not render color indicators when showColors is false', () => {
      const { container } = render(
        <SourceFilter {...defaultProps} showColors={false} />
      )

      const colorIndicators = container.querySelectorAll('span[style*="border-radius: 50%"]')
      expect(colorIndicators.length).toBe(0)
    })
  })

  describe('selection handling', () => {
    it('should show checkmark for selected sources', () => {
      render(
        <SourceFilter {...defaultProps} selectedSources={['meetings']} />
      )

      const checkboxes = screen.getAllByRole('checkbox')
      const meetingsCheckbox = checkboxes.find(cb =>
        cb.getAttribute('aria-label')?.includes('Meetings')
      )

      expect(meetingsCheckbox).toHaveAttribute('aria-checked', 'true')
    })

    it('should call onSelectionChange when source is selected', async () => {
      const onSelectionChange = vi.fn()
      const user = userEvent.setup()

      render(
        <SourceFilter
          {...defaultProps}
          selectedSources={[]}
          onSelectionChange={onSelectionChange}
        />
      )

      const meetingsLabel = screen.getByText('Meetings').closest('label')!
      await user.click(meetingsLabel)

      expect(onSelectionChange).toHaveBeenCalledWith(['meetings'])
    })

    it('should call onSelectionChange when source is deselected', async () => {
      const onSelectionChange = vi.fn()
      const user = userEvent.setup()

      render(
        <SourceFilter
          {...defaultProps}
          selectedSources={['meetings', 'events']}
          onSelectionChange={onSelectionChange}
        />
      )

      const meetingsLabel = screen.getByText('Meetings').closest('label')!
      await user.click(meetingsLabel)

      expect(onSelectionChange).toHaveBeenCalledWith(['events'])
    })

    it('should select all sources when Select All is clicked', async () => {
      const onSelectionChange = vi.fn()
      const user = userEvent.setup()

      render(
        <SourceFilter
          {...defaultProps}
          selectedSources={[]}
          onSelectionChange={onSelectionChange}
        />
      )

      const selectAllLabel = screen.getByText('Select All').closest('label')!
      await user.click(selectAllLabel)

      expect(onSelectionChange).toHaveBeenCalledWith(['meetings', 'events', 'deadlines'])
    })

    it('should deselect all sources when Deselect All is clicked', async () => {
      const onSelectionChange = vi.fn()
      const user = userEvent.setup()

      render(
        <SourceFilter
          {...defaultProps}
          selectedSources={['meetings', 'events', 'deadlines']}
          onSelectionChange={onSelectionChange}
        />
      )

      const deselectAllLabel = screen.getByText('Deselect All').closest('label')!
      await user.click(deselectAllLabel)

      expect(onSelectionChange).toHaveBeenCalledWith([])
    })

    it('should show "Deselect All" when all sources are selected', () => {
      render(
        <SourceFilter
          {...defaultProps}
          selectedSources={['meetings', 'events', 'deadlines']}
        />
      )

      expect(screen.getByText('Deselect All')).toBeInTheDocument()
      expect(screen.queryByText('Select All')).not.toBeInTheDocument()
    })
  })

  describe('keyboard interaction', () => {
    it('should toggle source on Enter key press', () => {
      const onSelectionChange = vi.fn()

      render(
        <SourceFilter
          {...defaultProps}
          selectedSources={[]}
          onSelectionChange={onSelectionChange}
        />
      )

      const meetingsLabel = screen.getByText('Meetings').closest('label')!
      fireEvent.keyDown(meetingsLabel, { key: 'Enter' })

      expect(onSelectionChange).toHaveBeenCalledWith(['meetings'])
    })

    it('should toggle source on Space key press', () => {
      const onSelectionChange = vi.fn()

      render(
        <SourceFilter
          {...defaultProps}
          selectedSources={['meetings']}
          onSelectionChange={onSelectionChange}
        />
      )

      const meetingsLabel = screen.getByText('Meetings').closest('label')!
      fireEvent.keyDown(meetingsLabel, { key: ' ' })

      expect(onSelectionChange).toHaveBeenCalledWith([])
    })

    it('should toggle Select All on Enter key press', () => {
      const onSelectionChange = vi.fn()

      render(
        <SourceFilter
          {...defaultProps}
          selectedSources={[]}
          onSelectionChange={onSelectionChange}
        />
      )

      const selectAllLabel = screen.getByText('Select All').closest('label')!
      fireEvent.keyDown(selectAllLabel, { key: 'Enter' })

      expect(onSelectionChange).toHaveBeenCalledWith(['meetings', 'events', 'deadlines'])
    })

    it('should prevent default on Space to avoid scrolling', () => {
      const onSelectionChange = vi.fn()

      render(
        <SourceFilter
          {...defaultProps}
          selectedSources={[]}
          onSelectionChange={onSelectionChange}
        />
      )

      const meetingsLabel = screen.getByText('Meetings').closest('label')!
      const event = fireEvent.keyDown(meetingsLabel, { key: ' ' })

      // fireEvent returns false if preventDefault was called
      expect(event).toBe(false)
    })
  })

  describe('accessibility', () => {
    it('should have checkbox role on source items', () => {
      render(<SourceFilter {...defaultProps} selectedSources={['meetings']} />)

      const checkboxes = screen.getAllByRole('checkbox')
      expect(checkboxes.length).toBeGreaterThan(0)
    })

    it('should have aria-checked attribute reflecting selection state', () => {
      render(
        <SourceFilter {...defaultProps} selectedSources={['meetings']} />
      )

      const checkboxes = screen.getAllByRole('checkbox')
      const meetingsCheckbox = checkboxes.find(cb =>
        cb.getAttribute('aria-label')?.includes('Meetings')
      )
      const eventsCheckbox = checkboxes.find(cb =>
        cb.getAttribute('aria-label')?.includes('Events')
      )

      expect(meetingsCheckbox).toHaveAttribute('aria-checked', 'true')
      expect(eventsCheckbox).toHaveAttribute('aria-checked', 'false')
    })

    it('should have aria-label including source description', () => {
      render(<SourceFilter {...defaultProps} />)

      const checkboxes = screen.getAllByRole('checkbox')
      const meetingsCheckbox = checkboxes.find(cb =>
        cb.getAttribute('aria-label')?.includes('Meetings')
      )

      expect(meetingsCheckbox?.getAttribute('aria-label')).toContain('Team and client meetings')
    })

    it('should have group role on source list', () => {
      render(<SourceFilter {...defaultProps} />)

      expect(screen.getByRole('group', { name: 'Calendar sources' })).toBeInTheDocument()
    })

    it('should have focusable source items', () => {
      render(<SourceFilter {...defaultProps} />)

      const checkboxes = screen.getAllByRole('checkbox')
      checkboxes.forEach(checkbox => {
        expect(checkbox).toHaveAttribute('tabIndex', '0')
      })
    })

    it('should show indeterminate state when some sources are selected', () => {
      render(
        <SourceFilter {...defaultProps} selectedSources={['meetings']} />
      )

      const selectAllCheckbox = screen.getAllByRole('checkbox').find(cb =>
        cb.getAttribute('aria-label') === null // Select All doesn't have description
      )

      expect(selectAllCheckbox).toHaveAttribute('aria-checked', 'mixed')
    })

    it('should have aria-hidden on decorative icons', () => {
      render(
        <SourceFilter {...defaultProps} selectedSources={['meetings']} />
      )

      const icons = document.querySelectorAll('svg[aria-hidden="true"]')
      expect(icons.length).toBeGreaterThan(0)
    })
  })

  describe('orientation', () => {
    it('should render vertically by default', () => {
      const { container } = render(<SourceFilter {...defaultProps} />)

      const sourceList = container.querySelector('[role="group"]')
      expect(sourceList).toHaveStyle({ flexDirection: 'column' })
    })

    it('should render horizontally when orientation is horizontal', () => {
      const { container } = render(
        <SourceFilter {...defaultProps} orientation="horizontal" />
      )

      const sourceList = container.querySelector('[role="group"]')
      expect(sourceList).toHaveStyle({ flexDirection: 'row' })
    })

    it('should wrap items in horizontal mode', () => {
      const { container } = render(
        <SourceFilter {...defaultProps} orientation="horizontal" />
      )

      const sourceList = container.querySelector('[role="group"]')
      expect(sourceList).toHaveStyle({ flexWrap: 'wrap' })
    })

    it('should not wrap items in vertical mode', () => {
      const { container } = render(
        <SourceFilter {...defaultProps} orientation="vertical" />
      )

      const sourceList = container.querySelector('[role="group"]')
      expect(sourceList).toHaveStyle({ flexWrap: 'nowrap' })
    })
  })

  describe('checkbox visual states', () => {
    it('should show colored checkbox when source is selected', () => {
      const { container } = render(
        <SourceFilter {...defaultProps} selectedSources={['meetings']} />
      )

      // Find checkbox visual indicator (the styled span)
      const checkboxes = container.querySelectorAll('span[style*="border: 2px solid"]')
      const meetingsCheckbox = Array.from(checkboxes).find(cb =>
        (cb as HTMLElement).style.background === 'rgb(55, 136, 216)'
      )

      expect(meetingsCheckbox).toBeTruthy()
    })

    it('should show unchecked state with gray border', () => {
      const { container } = render(
        <SourceFilter {...defaultProps} selectedSources={[]} />
      )

      // Find unchecked checkbox visual indicators
      const checkboxVisuals = container.querySelectorAll('span[style*="border: 2px solid rgb(209, 213, 219)"]')
      expect(checkboxVisuals.length).toBeGreaterThan(0)
    })
  })

  describe('edge cases', () => {
    it('should handle single source', () => {
      const singleSource: CalendarSource[] = [
        { id: 'only', name: 'Only Source', color: '#000' }
      ]

      render(
        <SourceFilter
          {...defaultProps}
          sources={singleSource}
          selectedSources={[]}
        />
      )

      expect(screen.getByText('Only Source')).toBeInTheDocument()
      expect(screen.getByText('Select All')).toBeInTheDocument()
    })

    it('should handle source without description in aria-label', () => {
      render(<SourceFilter {...defaultProps} />)

      const deadlinesCheckbox = screen.getAllByRole('checkbox').find(cb =>
        cb.getAttribute('aria-label') === 'Deadlines'
      )

      expect(deadlinesCheckbox).toBeInTheDocument()
    })

    it('should use default color when source color is not provided', () => {
      const sourcesWithoutColor: CalendarSource[] = [
        { id: 'no-color', name: 'No Color', color: '' }
      ]

      const { container } = render(
        <SourceFilter
          {...defaultProps}
          sources={sourcesWithoutColor}
          selectedSources={['no-color']}
          showColors
        />
      )

      // Default color should be applied
      const colorIndicator = container.querySelector('span[style*="border-radius: 50%"]')
      expect(colorIndicator).toHaveStyle({ background: 'rgb(55, 136, 216)' })
    })

    it('should not show Select All when sources list is empty', () => {
      render(
        <SourceFilter {...defaultProps} sources={[]} showSelectAll />
      )

      expect(screen.queryByText('Select All')).not.toBeInTheDocument()
    })
  })
})
