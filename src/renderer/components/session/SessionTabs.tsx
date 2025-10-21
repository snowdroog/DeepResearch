import { useState, useEffect, useRef } from 'react'
import * as Tabs from '@radix-ui/react-tabs'
import { Plus, X } from 'lucide-react'
import { useSessionStore } from '../../stores/sessionStore'
import { ProviderType } from '../../types/session'
import { Badge } from '../ui/badge'
import { ProviderSelectionDialog } from './ProviderSelectionDialog'
import { CloseSessionDialog } from './CloseSessionDialog'

const PROVIDER_COLORS: Record<ProviderType, string> = {
  claude: 'bg-blue-500',
  chatgpt: 'bg-green-500',
  gemini: 'bg-purple-500',
  perplexity: 'bg-cyan-500',
  custom: 'bg-gray-500',
}

const PROVIDER_NAMES: Record<ProviderType, string> = {
  claude: 'Claude',
  chatgpt: 'ChatGPT',
  gemini: 'Gemini',
  perplexity: 'Perplexity',
  custom: 'Custom',
}

interface SessionTabProps {
  id: string
  name: string
  provider: ProviderType
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
      <div className={`h-2 w-2 rounded-full ${PROVIDER_COLORS[provider]}`}></div>

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

export function SessionTabs() {
  const { sessions, activeSessionId, addSession, removeSession, setActiveSession, renameSession } =
    useSessionStore()

  const [showProviderDialog, setShowProviderDialog] = useState(false)
  const [showCloseDialog, setShowCloseDialog] = useState(false)
  const [sessionToClose, setSessionToClose] = useState<{ id: string; name: string } | null>(null)

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

  // Initialize with a default session if none exist
  useEffect(() => {
    if (sessions.length === 0) {
      addSession('claude')
    }
  }, [])

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

  const handleConfirmClose = () => {
    if (sessionToClose) {
      removeSession(sessionToClose.id)
      setSessionToClose(null)
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
        <Tabs.List className="flex items-center border-b bg-muted/30">
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

        {/* Add Session Button */}
        <button
          onClick={handleAddSession}
          className="flex items-center gap-1 border-r border-border px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
          title="Add new session (Cmd/Ctrl+T)"
        >
          <Plus className="h-4 w-4" />
        </button>

        {/* Keyboard Shortcuts Hint */}
        <div className="ml-auto px-4 text-xs text-muted-foreground">
          <span className="hidden lg:inline">
            Cmd/Ctrl+T: New • Cmd/Ctrl+W: Close • Cmd/Ctrl+1-9: Switch
          </span>
        </div>
      </Tabs.List>

      {/* Tab Content */}
      {sessions.map((session) => (
        <Tabs.Content
          key={session.id}
          value={session.id}
          className="flex-1 overflow-auto"
        >
          {/* This is where BrowserView will be embedded */}
          <div className="flex h-full items-center justify-center bg-muted/10">
            <div className="text-center">
              <div className={`mx-auto mb-4 h-16 w-16 rounded-full ${PROVIDER_COLORS[session.provider]}`}></div>
              <h3 className="text-lg font-semibold">{session.name}</h3>
              <Badge variant="secondary" className="mt-2">
                {PROVIDER_NAMES[session.provider]}
              </Badge>
              <p className="mt-3 text-sm text-muted-foreground">{session.url}</p>
              <p className="mt-4 text-xs text-muted-foreground">
                BrowserView will be embedded here
              </p>
            </div>
          </div>
        </Tabs.Content>
      ))}
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
