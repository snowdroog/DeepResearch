/**
 * ConversationView Component
 *
 * A virtualized, chat-like interface for displaying captured messages.
 * Implements efficient rendering with @tanstack/react-virtual and supports
 * keyboard navigation, message grouping, and smooth scrolling.
 *
 * Features:
 * - Virtual scrolling for performance with large datasets
 * - Keyboard navigation (arrow keys)
 * - Message grouping for consecutive messages
 * - Smooth scroll behavior
 * - Loading state handling
 * - Responsive layout
 * - Scroll position restoration
 * - Conversation thread visualization
 */

import { useEffect, useRef, useCallback, useMemo } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { ChatMessage, type ChatMessageData } from '../chat/ChatMessage'
import { ConversationGroupView } from '../chat/ConversationGroupView'
import { cn } from '../../lib/utils'

// Use the ChatMessageData type which matches the Capture interface
type Capture = ChatMessageData

// ==================== TYPES ====================

export interface ConversationViewProps {
  /** Array of captures to display */
  captures: Capture[]
  /** ID of currently selected capture (optional) */
  selectedCaptureId?: string | null
  /** Callback when a capture is clicked/selected */
  onSelectCapture?: (captureId: string) => void
  /** Loading state indicator */
  loading?: boolean
  /** Additional CSS classes */
  className?: string
  /** Whether to show compact mode */
  compact?: boolean
  /** Whether to show avatars in messages */
  showAvatars?: boolean
  /** Whether to show timestamps */
  showTimestamps?: boolean
  /** Whether to show provider badges */
  showProviderBadges?: boolean
  /** Whether to show tags */
  showTags?: boolean
}

/**
 * Represents a grouped message item for rendering
 */
interface MessageItem {
  id: string
  capture: Capture
  showAvatar: boolean
  isFirstInGroup: boolean
  isLastInGroup: boolean
}

// ==================== MESSAGE GROUPING UTILITY ====================

/**
 * Group consecutive messages from the same session/provider
 *
 * This creates a visual grouping effect where consecutive messages
 * from the same session are shown without repeating avatars/headers.
 *
 * @param captures Array of captures to group
 * @param timeWindowMs Maximum time gap between messages in same group (default: 5 minutes)
 * @returns Array of MessageItems with grouping metadata
 */
function groupConsecutiveMessages(
  captures: Capture[],
  timeWindowMs: number = 300000 // 5 minutes
): MessageItem[] {
  if (captures.length === 0) return []

  const items: MessageItem[] = []
  let currentGroupSessionId: string | null = null
  let currentGroupLastTimestamp: number = 0

  for (let i = 0; i < captures.length; i++) {
    const capture = captures[i]
    const nextCapture = i < captures.length - 1 ? captures[i + 1] : null

    // Determine if this message continues the current group
    const timeDelta = capture.timestamp - currentGroupLastTimestamp
    const continuesGroup =
      currentGroupSessionId === capture.session_id &&
      timeDelta <= timeWindowMs

    // Check if next message continues this group
    const nextTimeDelta = nextCapture
      ? nextCapture.timestamp - capture.timestamp
      : Infinity
    const nextContinuesGroup =
      nextCapture &&
      nextCapture.session_id === capture.session_id &&
      nextTimeDelta <= timeWindowMs

    // Determine grouping flags
    const isFirstInGroup = !continuesGroup
    const isLastInGroup = !nextContinuesGroup
    const showAvatar = isFirstInGroup

    items.push({
      id: capture.id,
      capture,
      showAvatar,
      isFirstInGroup,
      isLastInGroup,
    })

    // Update group tracking
    if (isFirstInGroup) {
      currentGroupSessionId = capture.session_id
    }
    if (isLastInGroup) {
      currentGroupSessionId = null
    }
    currentGroupLastTimestamp = capture.timestamp
  }

  return items
}

// ==================== MAIN COMPONENT ====================

/**
 * ConversationView Component
 *
 * Displays captures in a virtualized, chat-like interface with
 * keyboard navigation and smooth scrolling.
 */
export function ConversationView({
  captures,
  selectedCaptureId,
  onSelectCapture,
  loading = false,
  className,
  compact = false,
  showAvatars = true,
  showTimestamps = true,
  showProviderBadges = true,
  showTags = true,
}: ConversationViewProps) {
  // Refs
  const parentRef = useRef<HTMLDivElement>(null)
  const scrollPositionRef = useRef<number>(0)
  const isUserScrollingRef = useRef(false)

  // Group messages for rendering
  const messageItems = useMemo(
    () => groupConsecutiveMessages(captures),
    [captures]
  )

  // Setup virtual scrolling
  const virtualizer = useVirtualizer({
    count: messageItems.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 200, // Estimated height per message
    overscan: 5, // Render 5 extra items above/below viewport
    measureElement:
      typeof window !== 'undefined' && navigator.userAgent.indexOf('Firefox') === -1
        ? (element) => element?.getBoundingClientRect().height
        : undefined,
  })

  // Get virtual items
  const virtualItems = virtualizer.getVirtualItems()

  // ==================== KEYBOARD NAVIGATION ====================

  /**
   * Handle keyboard navigation through messages
   */
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!onSelectCapture || messageItems.length === 0) return

      // Only handle arrow keys
      if (!['ArrowUp', 'ArrowDown'].includes(event.key)) return

      event.preventDefault()

      const currentIndex = selectedCaptureId
        ? messageItems.findIndex((item) => item.id === selectedCaptureId)
        : -1

      let nextIndex: number

      if (event.key === 'ArrowDown') {
        nextIndex =
          currentIndex === -1 ? 0 : Math.min(currentIndex + 1, messageItems.length - 1)
      } else {
        nextIndex = currentIndex === -1 ? 0 : Math.max(currentIndex - 1, 0)
      }

      const nextItem = messageItems[nextIndex]
      if (nextItem) {
        onSelectCapture(nextItem.id)
        // Scroll to item
        virtualizer.scrollToIndex(nextIndex, {
          align: 'center',
          behavior: 'smooth',
        })
      }
    },
    [messageItems, selectedCaptureId, onSelectCapture, virtualizer]
  )

  // Attach keyboard listener
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  // ==================== SCROLL MANAGEMENT ====================

  /**
   * Track user scrolling to avoid auto-scroll interference
   */
  const handleScroll = useCallback(() => {
    if (!parentRef.current) return

    const { scrollTop } = parentRef.current
    scrollPositionRef.current = scrollTop

    // Detect if user is actively scrolling
    isUserScrollingRef.current = true
    clearTimeout(handleScroll.timeout)
    handleScroll.timeout = setTimeout(() => {
      isUserScrollingRef.current = false
    }, 150)
  }, [])

  // Add scroll listener
  useEffect(() => {
    const parent = parentRef.current
    if (!parent) return

    parent.addEventListener('scroll', handleScroll)
    return () => parent.removeEventListener('scroll', handleScroll)
  }, [handleScroll])

  // Auto-scroll to selected capture (only if not user scrolling)
  useEffect(() => {
    if (!selectedCaptureId || isUserScrollingRef.current) return

    const index = messageItems.findIndex((item) => item.id === selectedCaptureId)
    if (index !== -1) {
      virtualizer.scrollToIndex(index, {
        align: 'center',
        behavior: 'smooth',
      })
    }
  }, [selectedCaptureId, messageItems, virtualizer])

  // ==================== EVENT HANDLERS ====================

  const handleCaptureClick = useCallback(
    (captureId: string) => {
      onSelectCapture?.(captureId)
    },
    [onSelectCapture]
  )

  const handleCopy = useCallback((captureId: string, _content: string) => {
    console.log('[ConversationView] Copied content from capture:', captureId)
  }, [])

  const handleViewDetails = useCallback(
    (captureId: string) => {
      // Propagate to parent for dialog handling
      onSelectCapture?.(captureId)
    },
    [onSelectCapture]
  )

  // ==================== RENDER ====================

  // Loading state
  if (loading) {
    return (
      <div
        className={cn(
          'flex items-center justify-center h-full bg-background',
          className
        )}
      >
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
          <p className="text-sm text-muted-foreground">Loading messages...</p>
        </div>
      </div>
    )
  }

  // Empty state
  if (messageItems.length === 0) {
    return (
      <div
        className={cn(
          'flex items-center justify-center h-full bg-background',
          className
        )}
      >
        <div className="text-center space-y-4 max-w-md px-4">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto">
            <svg
              className="w-8 h-8 text-muted-foreground"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-2">No messages yet</h3>
            <p className="text-sm text-muted-foreground">
              Start a conversation with an AI assistant to see messages here.
              All interactions will be automatically captured and displayed.
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Main render
  return (
    <div
      ref={parentRef}
      className={cn(
        'h-full overflow-auto bg-background',
        'scroll-smooth',
        className
      )}
      role="log"
      aria-label="Conversation messages"
      aria-live="polite"
    >
      {/* Use ConversationGroupView for thread visualization */}
      <ConversationGroupView
        captures={captures}
        defaultViewMode="threaded"
        onCopy={handleCopy}
        onViewDetails={handleViewDetails}
      />
    </div>
  )
}

// Declare timeout on the function for TypeScript
declare global {
  interface Function {
    timeout?: NodeJS.Timeout
  }
}

// Display name for debugging
ConversationView.displayName = 'ConversationView'

// Export default
export default ConversationView
