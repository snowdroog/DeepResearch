import * as React from 'react'
import { List, MessageSquare } from 'lucide-react'
import { cn } from '@/renderer/lib/utils'

export type ViewMode = 'list' | 'conversation'

export interface ViewToggleProps {
  /**
   * The current view mode
   */
  value: ViewMode
  /**
   * Callback fired when the view mode changes
   */
  onChange: (value: ViewMode) => void
  /**
   * Optional className for the container
   */
  className?: string
  /**
   * Optional size variant
   * @default 'default'
   */
  size?: 'sm' | 'default' | 'lg'
  /**
   * Disable the toggle
   */
  disabled?: boolean
}

const sizeClasses = {
  sm: 'h-7',
  default: 'h-9',
  lg: 'h-11',
}

const iconSizeClasses = {
  sm: 'h-3.5 w-3.5',
  default: 'h-4 w-4',
  lg: 'h-5 w-5',
}

const paddingClasses = {
  sm: 'px-2.5',
  default: 'px-3',
  lg: 'px-4',
}

/**
 * ViewToggle - A toggle button group for switching between List and Conversation view modes
 *
 * @example
 * ```tsx
 * const [viewMode, setViewMode] = useState<ViewMode>('list')
 *
 * <ViewToggle value={viewMode} onChange={setViewMode} />
 * ```
 */
export const ViewToggle = React.forwardRef<HTMLDivElement, ViewToggleProps>(
  ({ value, onChange, className, size = 'default', disabled = false }, ref) => {
    const handleKeyDown = (e: React.KeyboardEvent, mode: ViewMode) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        if (!disabled) {
          onChange(mode)
        }
      }
    }

    return (
      <div
        ref={ref}
        className={cn(
          'inline-flex items-center rounded-md border bg-background p-0.5',
          disabled && 'opacity-50 cursor-not-allowed',
          className
        )}
        role="group"
        aria-label="View mode toggle"
      >
        {/* List View Button */}
        <button
          type="button"
          role="radio"
          aria-checked={value === 'list'}
          aria-label="List view"
          disabled={disabled}
          onClick={() => !disabled && onChange('list')}
          onKeyDown={(e) => handleKeyDown(e, 'list')}
          className={cn(
            'inline-flex items-center justify-center rounded-sm text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
            sizeClasses[size],
            paddingClasses[size],
            value === 'list'
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
          )}
          tabIndex={value === 'list' ? 0 : -1}
        >
          <List className={iconSizeClasses[size]} aria-hidden="true" />
          <span className="ml-2 hidden sm:inline">List</span>
        </button>

        {/* Conversation View Button */}
        <button
          type="button"
          role="radio"
          aria-checked={value === 'conversation'}
          aria-label="Conversation view"
          disabled={disabled}
          onClick={() => !disabled && onChange('conversation')}
          onKeyDown={(e) => handleKeyDown(e, 'conversation')}
          className={cn(
            'inline-flex items-center justify-center rounded-sm text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
            sizeClasses[size],
            paddingClasses[size],
            value === 'conversation'
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
          )}
          tabIndex={value === 'conversation' ? 0 : -1}
        >
          <MessageSquare className={iconSizeClasses[size]} aria-hidden="true" />
          <span className="ml-2 hidden sm:inline">Conversation</span>
        </button>
      </div>
    )
  }
)

ViewToggle.displayName = 'ViewToggle'
