import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, Search } from 'lucide-react'
import { CaptureDetailDialog } from '../capture/CaptureDetailDialog'
import { useCapturesStore } from '../../stores/capturesStore'
import { useSessionStore } from '../../stores/sessionStore'

interface DataPanelProps {
  isCollapsed: boolean
  onToggleCollapse: () => void
}

export function DataPanel({ isCollapsed, onToggleCollapse }: DataPanelProps) {
  const [selectedCaptureId, setSelectedCaptureId] = useState<string | null>(null)
  const [showDetailDialog, setShowDetailDialog] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const { captures, loading, fetchCaptures, searchCaptures } = useCapturesStore()
  const { activeSessionId } = useSessionStore()

  // Fetch captures on mount
  useEffect(() => {
    fetchCaptures({ isArchived: false }) // Only show non-archived by default
  }, [fetchCaptures])

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

  // Show only the most recent 10 captures in the panel
  const recentCaptures = captures.slice(0, 10)

  const handleCaptureClick = (captureId: string) => {
    setSelectedCaptureId(captureId)
    setShowDetailDialog(true)
    // Hide active WebContentsView so dialog appears on top
    if (activeSessionId) {
      window.electronAPI.views.setVisible(activeSessionId, false)
    }
  }

  const handleDialogClose = () => {
    setShowDetailDialog(false)
    setSelectedCaptureId(null)
    // Show active WebContentsView again
    if (activeSessionId) {
      window.electronAPI.views.setVisible(activeSessionId, true)
    }
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
      <div className="flex items-center justify-between border-b px-4 py-3">
        <h3 className="text-sm font-semibold">Captured Research</h3>
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
        <div className="space-y-4">
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
                recentCaptures.map((capture) => (
                  <button
                    key={capture.id}
                    onClick={() => handleCaptureClick(capture.id)}
                    className="w-full rounded border bg-background p-2 text-xs hover:shadow-md hover:border-primary/50 transition-all text-left"
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
                ))
              )}
            </div>
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

      {/* Capture Detail Dialog */}
      <CaptureDetailDialog
        capture={selectedCaptureId ? captures.find(c => c.id === selectedCaptureId) || null : null}
        open={showDetailDialog}
        onOpenChange={handleDialogClose}
      />
    </div>
  )
}
