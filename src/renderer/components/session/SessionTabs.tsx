import { useState, useEffect, useRef } from 'react'
import * as Tabs from '@radix-ui/react-tabs'
import { Plus, X, Download, ChevronLeft, ChevronRight } from 'lucide-react'
import { useSessionStore } from '../../stores/sessionStore'
import { ProviderType } from '../../types/session'
import { ProviderSelectionDialog } from './ProviderSelectionDialog'
import { CloseSessionDialog } from './CloseSessionDialog'
import { useWebContentsViewBounds } from '../../hooks/useWebContentsViewBounds'
import { useCapturesStore } from '../../stores/capturesStore'
import CaptureTabContent from '../capture/CaptureTabContent'

const PROVIDER_COLORS: Record<ProviderType, string> = {
  claude: 'bg-blue-500',
  chatgpt: 'bg-green-500',
  gemini: 'bg-purple-500',
  perplexity: 'bg-cyan-500',
  custom: 'bg-gray-500',
}

interface SessionTabProps {
  id: string
  name: string
  provider?: ProviderType
  isActive: boolean
  onClose: () => void
  onRename: (newName: string) => void
  onSelect: () => void
}

function SessionTab({
  id,
  name,
  provider,
  isActive,
  onClose,
  onRename,
  onSelect,
}: SessionTabProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(name)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  const handleDoubleClick = () => {
    setIsEditing(true)
  }

  const handleRename = () => {
    if (editValue.trim() && editValue !== name) {
      onRename(editValue.trim())
    }
    setIsEditing(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleRename()
    } else if (e.key === 'Escape') {
      setEditValue(name)
      setIsEditing(false)
    }
  }

  return (
    <Tabs.Trigger
      value={id}
      className={`group relative flex items-center gap-2 border-r border-border px-4 py-2.5 text-sm transition-colors ${
        isActive
          ? 'bg-background text-foreground'
          : 'bg-muted/30 text-muted-foreground hover:bg-muted/50'
      }`}
      onClick={onSelect}
    >
      {/* Provider Indicator */}
      {provider && <div className={`h-2 w-2 rounded-full ${PROVIDER_COLORS[provider]}`}></div>}

      {/* Session Name */}
      {isEditing ? (
        <input
          ref={inputRef}
          type="text"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleRename}
          onKeyDown={handleKeyDown}
          className="w-24 rounded border bg-background px-1 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
          onClick={(e) => e.stopPropagation()}
        />
      ) : (
        <span
          className="max-w-[120px] truncate font-medium"
          onDoubleClick={handleDoubleClick}
        >
          {name}
        </span>
      )}

      {/* Close Button */}
      <button
        onClick={(e) => {
          e.stopPropagation()
          onClose()
        }}
        className="ml-1 rounded p-0.5 opacity-0 transition-opacity hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
        title="Close session"
      >
        <X className="h-3 w-3" />
      </button>
    </Tabs.Trigger>
  )
}

interface SessionTabContentProps {
  session: {
    id: string
    name: string
    type: 'provider' | 'capture'
    provider?: ProviderType
    url?: string
    captureId?: string
  }
  isActive: boolean
}

function SessionTabContent({ session, isActive }: SessionTabContentProps) {
  // Use the custom hook to manage WebContentsView bounds only for provider sessions
  const containerRef = useWebContentsViewBounds(
    isActive && session.type === 'provider' ? session.id : null,
    isActive && session.type === 'provider'
  )

  return (
    <Tabs.Content
      key={session.id}
      value={session.id}
      className="flex-1 overflow-hidden"
    >
      {session.type === 'provider' ? (
        // Container for WebContentsView (provider sessions)
        <div
          ref={containerRef}
          className="h-full w-full bg-background"
          style={{ position: 'relative' }}
        >
          {/* WebContentsView will be positioned here by Electron */}
          {/* The view is rendered natively by Electron, not in React */}
        </div>
      ) : session.captureId ? (
        // React content for capture sessions
        <CaptureTabContent captureId={session.captureId} />
      ) : (
        // Fallback for capture sessions without captureId
        <div className="h-full w-full overflow-auto bg-background p-4">
          <div className="mx-auto max-w-4xl">
            <p className="text-muted-foreground">
              Error: Capture session missing capture ID
            </p>
          </div>
        </div>
      )}
    </Tabs.Content>
  )
}

export function SessionTabs() {
  const { sessions, activeSessionId, addSession, removeSession, setActiveSession, renameSession } =
    useSessionStore()
  const { fetchCaptures } = useCapturesStore()

  const [showProviderDialog, setShowProviderDialog] = useState(false)
  const [showCloseDialog, setShowCloseDialog] = useState(false)
  const [sessionToClose, setSessionToClose] = useState<{ id: string; name: string } | null>(null)
  const [isCapturing, setIsCapturing] = useState(false)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)
  const tabListRef = useRef<HTMLDivElement>(null)

  // Check scroll position for navigation buttons
  useEffect(() => {
    const checkScroll = () => {
      if (!tabListRef.current) return

      const { scrollLeft, scrollWidth, clientWidth } = tabListRef.current
      setCanScrollLeft(scrollLeft > 0)
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1)
    }

    const tabList = tabListRef.current
    if (tabList) {
      checkScroll()
      tabList.addEventListener('scroll', checkScroll)
      window.addEventListener('resize', checkScroll)

      return () => {
        tabList.removeEventListener('scroll', checkScroll)
        window.removeEventListener('resize', checkScroll)
      }
    }
  }, [sessions])

  // Scroll navigation functions
  const scrollTabs = (direction: 'left' | 'right') => {
    if (!tabListRef.current) return
    const scrollAmount = 200
    tabListRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth'
    })
  }

  // Hide/show active WebContentsView when any dialog opens/closes
  // This prevents dialogs from appearing behind the native Electron view
  useEffect(() => {
    if (!activeSessionId) return

    const activeSession = sessions.find(s => s.id === activeSessionId)
    if (!activeSession) return

    const anyDialogOpen = showProviderDialog || showCloseDialog

    // If active session is a capture session, hide all provider views
    if (activeSession.type === 'capture') {
      sessions.filter(s => s.type === 'provider').forEach(s => {
        window.electronAPI.views.setVisible(s.id, false)
      })
      return
    }

    // For provider sessions, manage visibility based on dialog state
    if (activeSession.type === 'provider') {
      if (anyDialogOpen) {
        // Hide the view when a dialog opens
        window.electronAPI.views.setVisible(activeSessionId, false)
      } else {
        // Show the view when all dialogs are closed
        window.electronAPI.views.setVisible(activeSessionId, true)
      }
    }
  }, [activeSessionId, sessions, showProviderDialog, showCloseDialog])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + T: New session
      if ((e.metaKey || e.ctrlKey) && e.key === 't') {
        e.preventDefault()
        setShowProviderDialog(true)
      }

      // Cmd/Ctrl + W: Close active session
      if ((e.metaKey || e.ctrlKey) && e.key === 'w' && activeSessionId) {
        e.preventDefault()
        const session = sessions.find((s) => s.id === activeSessionId)
        if (session) {
          setSessionToClose({ id: session.id, name: session.name })
          setShowCloseDialog(true)
        }
      }

      // Cmd/Ctrl + 1-9: Switch to session by index
      if ((e.metaKey || e.ctrlKey) && /^[1-9]$/.test(e.key)) {
        e.preventDefault()
        const index = parseInt(e.key) - 1
        if (sessions[index]) {
          setActiveSession(sessions[index].id)
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [sessions, activeSessionId, setActiveSession])

  // Removed: Auto-create session on startup
  // User should manually create sessions via the "+" button

  const handleAddSession = () => {
    setShowProviderDialog(true)
  }

  const handleSelectProvider = (provider: ProviderType, customUrl?: string) => {
    addSession(provider, customUrl)
  }

  const handleRequestClose = (sessionId: string, sessionName: string) => {
    setSessionToClose({ id: sessionId, name: sessionName })
    setShowCloseDialog(true)
  }

  const handleConfirmClose = async () => {
    if (sessionToClose) {
      await removeSession(sessionToClose.id)
      setSessionToClose(null)
      setShowCloseDialog(false)
    }
  }

  const handleCaptureCurrentPage = async () => {
    if (!activeSessionId) return

    setIsCapturing(true)
    try {
      const result = await window.electronAPI.sessions.captureCurrentPage(activeSessionId)
      if (result.success) {
        console.log('[SessionTabs] Page captured successfully')
        // Refresh captures list
        await fetchCaptures({ isArchived: false })
      } else {
        console.error('[SessionTabs] Failed to capture page:', result.error)
      }
    } catch (error) {
      console.error('[SessionTabs] Error capturing page:', error)
    } finally {
      setIsCapturing(false)
    }
  }

  return (
    <>
      <Tabs.Root
        value={activeSessionId || undefined}
        onValueChange={setActiveSession}
        className="flex h-full flex-col"
      >
        {/* Tab List */}
        <div className="flex items-center border-b bg-muted/30">
          {/* Left scroll button */}
          {canScrollLeft && (
            <button
              onClick={() => scrollTabs('left')}
              className="flex-shrink-0 border-r border-border px-2 py-2.5 text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
              title="Scroll left"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
          )}

          <Tabs.List
            ref={tabListRef}
            className="flex items-center overflow-x-auto overflow-y-hidden flex-1 scrollbar-hide"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {sessions.map((session) => (
              <SessionTab
                key={session.id}
                id={session.id}
                name={session.name}
                provider={session.provider}
                isActive={session.id === activeSessionId}
                onClose={() => handleRequestClose(session.id, session.name)}
                onRename={(newName) => renameSession(session.id, newName)}
                onSelect={() => setActiveSession(session.id)}
              />
            ))}
          </Tabs.List>

          {/* Right scroll button */}
          {canScrollRight && (
            <button
              onClick={() => scrollTabs('right')}
              className="flex-shrink-0 border-l border-border px-2 py-2.5 text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
              title="Scroll right"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          )}

          {/* Add Session Button */}
          <button
            onClick={handleAddSession}
            className="flex-shrink-0 flex items-center gap-1 border-l border-border px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
            title="Add new session (Cmd/Ctrl+T)"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>

        {/* Action Bar - Capture and Keyboard Shortcuts */}
        <div className="flex items-center justify-between border-b bg-muted/20 px-4 py-1.5">
          {/* Capture Current Page Button */}
          <div>
            {activeSessionId && sessions.find(s => s.id === activeSessionId)?.type === 'provider' && (
              <button
                onClick={handleCaptureCurrentPage}
                disabled={isCapturing}
                className="flex items-center gap-2 rounded-md px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground disabled:opacity-50"
                title="Capture current conversation"
              >
                <Download className={`h-3.5 w-3.5 ${isCapturing ? 'animate-bounce' : ''}`} />
                {isCapturing ? 'Capturing...' : 'Capture Page'}
              </button>
            )}
          </div>

          {/* Keyboard Shortcuts Hint */}
          <div className="text-xs text-muted-foreground">
            <span className="hidden lg:inline">
              Cmd/Ctrl+T: New • Cmd/Ctrl+W: Close • Cmd/Ctrl+1-9: Switch
            </span>
          </div>
        </div>

      {/* Tab Content */}
      {sessions.length === 0 ? (
        <div className="flex flex-1 items-center justify-center bg-muted/10">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-muted-foreground">No Sessions Open</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Click the <span className="font-semibold">+</span> button above to create your first AI session
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Keyboard shortcut: <kbd className="rounded bg-muted px-1.5 py-0.5">Cmd/Ctrl+T</kbd>
            </p>
          </div>
        </div>
      ) : (
        sessions.map((session) => {
          const isActive = session.id === activeSessionId
          return (
            <SessionTabContent
              key={session.id}
              session={session}
              isActive={isActive}
            />
          )
        })
      )}
      </Tabs.Root>

      {/* Provider Selection Dialog */}
      <ProviderSelectionDialog
        open={showProviderDialog}
        onOpenChange={setShowProviderDialog}
        onSelect={handleSelectProvider}
      />

      {/* Close Confirmation Dialog */}
      <CloseSessionDialog
        open={showCloseDialog}
        onOpenChange={setShowCloseDialog}
        sessionName={sessionToClose?.name || ''}
        onConfirm={handleConfirmClose}
      />
    </>
  )
}
