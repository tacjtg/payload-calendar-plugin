/**
 * @fileoverview Checkbox list to filter by calendar source
 */

import { useCallback, useMemo } from 'react'
import type { SourceFilterProps, CalendarSource } from '../types'

/**
 * A filter component for selecting which calendar sources to display
 *
 * @param props - Component props
 * @returns The source filter component
 *
 * @example
 * ```tsx
 * const [selectedSources, setSelectedSources] = useState<string[]>([])
 *
 * <SourceFilter
 *   sources={sources}
 *   selectedSources={selectedSources}
 *   onSelectionChange={setSelectedSources}
 *   showSelectAll
 *   showColors
 * />
 * ```
 */
export function SourceFilter({
  sources,
  selectedSources,
  onSelectionChange,
  className,
  title = 'Filter by Source',
  showSelectAll = true,
  showColors = true,
  orientation = 'vertical',
}: SourceFilterProps) {
  // Check if all sources are selected
  const allSelected = useMemo(() => {
    return sources.length > 0 && sources.every((source) => selectedSources.includes(source.id))
  }, [sources, selectedSources])

  // Check if some but not all sources are selected
  const someSelected = useMemo(() => {
    return (
      selectedSources.length > 0 &&
      selectedSources.length < sources.length &&
      sources.some((source) => selectedSources.includes(source.id))
    )
  }, [sources, selectedSources])

  // Handle toggling a single source
  const handleToggleSource = useCallback(
    (sourceId: string) => {
      if (selectedSources.includes(sourceId)) {
        onSelectionChange(selectedSources.filter((id) => id !== sourceId))
      } else {
        onSelectionChange([...selectedSources, sourceId])
      }
    },
    [selectedSources, onSelectionChange]
  )

  // Handle select all / deselect all
  const handleToggleAll = useCallback(() => {
    if (allSelected) {
      onSelectionChange([])
    } else {
      onSelectionChange(sources.map((source) => source.id))
    }
  }, [allSelected, sources, onSelectionChange])

  // Keyboard handler for checkbox items
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, sourceId: string) => {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault()
        handleToggleSource(sourceId)
      }
    },
    [handleToggleSource]
  )

  // Keyboard handler for select all
  const handleSelectAllKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault()
        handleToggleAll()
      }
    },
    [handleToggleAll]
  )

  const isHorizontal = orientation === 'horizontal'

  return (
    <div
      className={className}
      style={{
        fontFamily: 'system-ui, -apple-system, sans-serif',
        fontSize: '14px',
      }}
    >
      {/* Title */}
      {title && (
        <h3
          style={{
            margin: '0 0 12px 0',
            fontSize: '14px',
            fontWeight: 600,
            color: '#374151',
          }}
        >
          {title}
        </h3>
      )}

      {/* Select All option */}
      {showSelectAll && sources.length > 0 && (
        <div
          style={{
            marginBottom: '8px',
            paddingBottom: '8px',
            borderBottom: '1px solid #e5e7eb',
          }}
        >
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              cursor: 'pointer',
              userSelect: 'none',
            }}
            onKeyDown={handleSelectAllKeyDown}
            tabIndex={0}
            role="checkbox"
            aria-checked={allSelected ? 'true' : someSelected ? 'mixed' : 'false'}
          >
            <span
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '18px',
                height: '18px',
                borderRadius: '4px',
                border: `2px solid ${allSelected || someSelected ? '#3788d8' : '#d1d5db'}`,
                background: allSelected || someSelected ? '#3788d8' : '#fff',
                transition: 'all 0.15s ease',
                flexShrink: 0,
              }}
            >
              {allSelected && (
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#fff"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
              {someSelected && !allSelected && (
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#fff"
                  strokeWidth="3"
                  strokeLinecap="round"
                  aria-hidden="true"
                >
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
              )}
            </span>
            <input
              type="checkbox"
              checked={allSelected}
              onChange={handleToggleAll}
              style={{ display: 'none' }}
              aria-hidden="true"
            />
            <span style={{ fontWeight: 500 }}>
              {allSelected ? 'Deselect All' : 'Select All'}
            </span>
          </label>
        </div>
      )}

      {/* Source list */}
      <div
        style={{
          display: 'flex',
          flexDirection: isHorizontal ? 'row' : 'column',
          flexWrap: isHorizontal ? 'wrap' : 'nowrap',
          gap: isHorizontal ? '12px' : '8px',
        }}
        role="group"
        aria-label="Calendar sources"
      >
        {sources.map((source) => {
          const isSelected = selectedSources.includes(source.id)

          return (
            <label
              key={source.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer',
                userSelect: 'none',
                padding: '4px',
                borderRadius: '4px',
                transition: 'background 0.15s ease',
              }}
              onKeyDown={(e) => handleKeyDown(e, source.id)}
              tabIndex={0}
              role="checkbox"
              aria-checked={isSelected}
              aria-label={`${source.name}${source.description ? `: ${source.description}` : ''}`}
            >
              <span
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '18px',
                  height: '18px',
                  borderRadius: '4px',
                  border: `2px solid ${isSelected ? source.color || '#3788d8' : '#d1d5db'}`,
                  background: isSelected ? source.color || '#3788d8' : '#fff',
                  transition: 'all 0.15s ease',
                  flexShrink: 0,
                }}
              >
                {isSelected && (
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#fff"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </span>
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => handleToggleSource(source.id)}
                style={{ display: 'none' }}
                aria-hidden="true"
              />

              {/* Source color indicator */}
              {showColors && (
                <span
                  style={{
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    background: source.color || '#3788d8',
                    flexShrink: 0,
                  }}
                  aria-hidden="true"
                />
              )}

              {/* Source name */}
              <span
                style={{
                  color: '#374151',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {source.name}
              </span>
            </label>
          )
        })}
      </div>

      {/* Empty state */}
      {sources.length === 0 && (
        <div
          style={{
            padding: '16px',
            textAlign: 'center',
            color: '#666',
            fontSize: '13px',
          }}
        >
          No calendar sources available
        </div>
      )}
    </div>
  )
}

export default SourceFilter
