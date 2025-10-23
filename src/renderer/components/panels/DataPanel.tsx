import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, Search, Settings2 } from 'lucide-react'
import { ConversationView } from './ConversationView'
import { ViewToggle } from '../ui/view-toggle'
import { useCapturesStore } from '../../stores/capturesStore'
import { useSessionStore } from '../../stores/sessionStore'
import { useUIStore } from '../../stores/uiStore'
import type { GroupingMode } from '../../stores/uiStore'
import { Button } from '../ui/button'
import { cn } from '../../lib/utils'
import { getConversationColor } from '../../utils/conversationColors'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu'

interface DataPanelProps {
  isCollapsed: boolean
  onToggleCollapse: () => void
}

export function DataPanel({ isCollapsed, onToggleCollapse }: DataPanelProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [timeWindowHours, setTimeWindowHours] = useState(1)

  const { captures, loading, fetchCaptures, searchCaptures, setupAutoRefresh } = useCapturesStore()
  const { addCaptureSession } = useSessionStore()
  const {
    viewMode,
    setViewMode,
    grouping,
    setGroupingEnabled,
    setGroupingMode,
    setTimeWindow,
    collapseAllGroups,
    expandAllGroups,
  } = useUIStore()

  // Fetch captures on mount
  useEffect(() => {
    fetchCaptures({ isArchived: false }) // Only show non-archived by default
  }, [fetchCaptures])

  // Set up auto-refresh for new captures
  useEffect(() => {
    const unsubscribe = setupAutoRefresh()
    return () => unsubscribe()
  }, [setupAutoRefresh])

  // Handle search with debouncing
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.trim()) {
        searchCaptures(searchQuery, { isArchived: false })
      } else {
        fetchCaptures({ isArchived: false })
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [searchQuery, fetchCaptures, searchCaptures])

  // Show only the most recent 10 captures in the panel (for list view)
  const recentCaptures = captures.slice(0, 10)

  // Handle grouping mode change
  const handleGroupingModeChange = (mode: GroupingMode) => {
    setGroupingMode(mode)
    if (mode !== 'none') {
      setGroupingEnabled(true)
      setViewMode('conversation')
    } else {
      setGroupingEnabled(false)
      setViewMode('list')
    }
  }

  // Handle time window change
  const handleTimeWindowChange = (hours: number) => {
    setTimeWindowHours(hours)
    setTimeWindow(hours * 3600000) // Convert hours to milliseconds
  }

  const handleCaptureClick = async (captureId: string) => {
    // Find the capture to get its prompt for the tab name
    const capture = captures.find(c => c.id === captureId)
    if (!capture) return

    // Create a short name from the prompt (max 30 chars)
    const name = capture.prompt
      ? capture.prompt.substring(0, 30) + (capture.prompt.length > 30 ? '...' : '')
      : 'Capture'

    // Open capture as a new tab
    await addCaptureSession(captureId, name)
  }

  const formatTimeAgo = (timestamp: number) => {
    const minutes = Math.floor((Date.now() - timestamp) / 60000)
    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h ago`
    const days = Math.floor(hours / 24)
    return `${days}d ago`
  }

  return (
    <div className="flex h-full flex-col border-l bg-muted/30">
      {/* Data Panel Header */}
      <div className="border-b">
        <div className="flex items-center justify-between px-4 py-3">
          <h3 className="text-sm font-semibold">Captured Research</h3>
          <div className="flex items-center gap-2">
            {/* View Mode Toggle */}
            <ViewToggle
              value={viewMode}
              onChange={(mode) => {
                setViewMode(mode)
                setGroupingEnabled(mode === 'conversation')
              }}
              size="sm"
            />

            {/* Grouping Settings */}
            {viewMode === 'conversation' && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-8 px-3">
                    <Settings2 className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>Grouping Mode</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuRadioGroup
                    value={grouping.mode}
                    onValueChange={(value) => handleGroupingModeChange(value as GroupingMode)}
                  >
                    <DropdownMenuRadioItem value="conversation">
                      Smart Conversation
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="session">
                      By Session
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="topic">
                      By Topic
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="timeWindow">
                      By Time Window
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="messageType">
                      By Message Type
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="provider">
                      By Provider
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="none">
                      No Grouping
                    </DropdownMenuRadioItem>
                  </DropdownMenuRadioGroup>

                  {grouping.mode === 'timeWindow' && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuLabel>Time Window</DropdownMenuLabel>
                      <div className="px-2 py-2">
                        <input
                          type="number"
                          min="0.5"
                          max="24"
                          step="0.5"
                          value={timeWindowHours}
                          onChange={(e) => handleTimeWindowChange(parseFloat(e.target.value))}
                          className="w-full rounded-md border bg-background px-2 py-1 text-sm"
                          placeholder="Hours"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Group messages within {timeWindowHours}h
                        </p>
                      </div>
                    </>
                  )}

                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={collapseAllGroups}>
                    Collapse All Groups
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={expandAllGroups}>
                    Expand All Groups
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            <button
              onClick={onToggleCollapse}
              className="rounded-md p-1 hover:bg-accent transition-colors"
              title={isCollapsed ? 'Expand panel' : 'Collapse panel'}
            >
              {isCollapsed ? (
                <ChevronLeft className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="border-b px-4 py-3">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search responses..."
            className="w-full rounded-md border bg-background pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </div>

      {/* Data Panel Content */}
      <div className="flex-1 overflow-auto p-4">
        <div className="space-y-4 relative">
          {/* Conversation View */}
          <div
            className={cn(
              'transition-all duration-300 ease-in-out',
              viewMode === 'conversation'
                ? 'opacity-100 translate-y-0'
                : 'opacity-0 translate-y-4 absolute inset-0 pointer-events-none'
            )}
          >
            {viewMode === 'conversation' && (
              <ConversationView
                captures={captures}
                onSelectCapture={handleCaptureClick}
                loading={loading}
                showAvatars={true}
                showTimestamps={true}
                showProviderBadges={true}
                showTags={true}
              />
            )}
          </div>

          {/* List View */}
          <div
            className={cn(
              'transition-all duration-300 ease-in-out',
              viewMode === 'list'
                ? 'opacity-100 translate-y-0'
                : 'opacity-0 translate-y-4 absolute inset-0 pointer-events-none'
            )}
          >
            {viewMode === 'list' && (
              <div className="rounded-lg border bg-card p-4">
                <p className="text-sm text-muted-foreground mb-3">
                  {loading ? (
                    'Loading...'
                  ) : (
                    <>
                      Captured AI responses ({captures.length})
                      {recentCaptures.length < captures.length && (
                        <span className="ml-1 text-xs">(showing recent {recentCaptures.length})</span>
                      )}
                    </>
                  )}
                </p>
                <div className="space-y-2">
                  {loading ? (
                    <p className="text-xs text-muted-foreground py-4 text-center">Loading captures...</p>
                  ) : recentCaptures.length === 0 ? (
                    <p className="text-xs text-muted-foreground py-4 text-center">
                      No captures yet. AI responses will appear here automatically.
                    </p>
                  ) : (
                    recentCaptures.map((capture, index) => {
                      const colors = getConversationColor(capture.conversation_id)

                      // Check if previous and next captures have same conversation_id
                      const prevCapture = recentCaptures[index - 1]
                      const nextCapture = recentCaptures[index + 1]
                      const hasPrevInConversation = prevCapture?.conversation_id === capture.conversation_id && capture.conversation_id
                      const hasNextInConversation = nextCapture?.conversation_id === capture.conversation_id && capture.conversation_id

                      return (
                        <div key={capture.id} className="relative">
                          {/* Conversation indicator column */}
                          {capture.conversation_id && (
                            <div className={cn('absolute left-0 top-0 bottom-0 w-1', colors.line)} />
                          )}

                          {/* Message card */}
                          <button
                            onClick={() => handleCaptureClick(capture.id)}
                            className={cn(
                              "w-full rounded border bg-background p-2 text-xs hover:shadow-md hover:border-primary/50 transition-all text-left",
                              capture.conversation_id && 'ml-2'
                            )}
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-medium truncate max-w-[180px]">
                                {capture.prompt ? (
                                  <>
                                    {capture.prompt.substring(0, 50)}
                                    {capture.prompt.length > 50 ? '...' : ''}
                                  </>
                                ) : (
                                  <span className="italic text-muted-foreground">No prompt</span>
                                )}
                              </span>
                              <span className="text-muted-foreground text-[10px]">
                                {formatTimeAgo(capture.timestamp)}
                              </span>
                            </div>
                            <p className="mt-1 text-muted-foreground line-clamp-2">
                              {capture.response.substring(0, 100)}
                              {capture.response.length > 100 ? '...' : ''}
                            </p>
                            <div className="mt-2 flex gap-1 flex-wrap">
                              <span className="rounded bg-blue-100 px-1.5 py-0.5 text-[10px] font-medium text-blue-800 dark:bg-blue-900 dark:text-blue-100">
                                {capture.provider}
                              </span>
                              {capture.tags && (() => {
                                try {
                                  return JSON.parse(capture.tags).slice(0, 2).map((tag: string) => (
                                    <span
                                      key={tag}
                                      className="rounded bg-purple-100 px-1.5 py-0.5 text-[10px] font-medium text-purple-800 dark:bg-purple-900 dark:text-purple-100"
                                    >
                                      {tag}
                                    </span>
                                  ))
                                } catch {
                                  return null
                                }
                              })()}
                            </div>
                          </button>
                        </div>
                      )
                    })
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-950">
            <p className="text-xs text-blue-800 dark:text-blue-200">
              <strong>Tip:</strong> Resize panels by dragging the dividers. Your layout will be
              saved automatically.
            </p>
          </div>

          <div className="rounded-lg border bg-card p-4">
            <h4 className="text-sm font-semibold mb-2">Stats</h4>
            <div className="space-y-1 text-xs text-muted-foreground">
              <div className="flex justify-between">
                <span>Total Responses:</span>
                <span className="font-medium">{captures.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Unique Providers:</span>
                <span className="font-medium">
                  {new Set(captures.map(c => c.provider)).size}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Total Tokens:</span>
                <span className="font-medium">
                  {captures.reduce((sum, c) => sum + (c.token_count || 0), 0).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  )
}
