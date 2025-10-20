import { Plus } from 'lucide-react'
import { useSessionStore } from '../../stores/sessionStore'
import { ProviderType } from '../../types/session'
import { formatDistanceToNow } from 'date-fns'

const PROVIDER_COLORS: Record<ProviderType, string> = {
  claude: 'bg-blue-500',
  chatgpt: 'bg-green-500',
  gemini: 'bg-purple-500',
  perplexity: 'bg-cyan-500',
  custom: 'bg-gray-500',
}

export function SessionListPanel() {
  const { sessions, activeSessionId, addSession, setActiveSession } = useSessionStore()

  const handleAddSession = () => {
    // Default to Claude for now
    addSession('claude')
  }

  return (
    <aside className="h-full border-r bg-muted/30 p-4 overflow-y-auto">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold">Sessions</h3>
            <p className="text-xs text-muted-foreground">
              {sessions.length} active {sessions.length === 1 ? 'session' : 'sessions'}
            </p>
          </div>
          <button
            onClick={handleAddSession}
            className="rounded-md p-1.5 hover:bg-accent transition-colors"
            title="Add new session"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>

        {/* Session List */}
        <div className="space-y-2">
          {sessions.map((session) => (
            <button
              key={session.id}
              onClick={() => setActiveSession(session.id)}
              className={`w-full rounded-lg border bg-background p-3 text-left transition-all hover:shadow-md ${
                session.id === activeSessionId ? 'ring-2 ring-ring ring-offset-1' : ''
              }`}
            >
              <div className="flex items-center gap-2">
                <div className={`h-2 w-2 rounded-full ${PROVIDER_COLORS[session.provider]}`}></div>
                <span className="text-sm font-medium">{session.name}</span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {formatDistanceToNow(session.lastActiveAt, { addSuffix: true })}
              </p>
            </button>
          ))}
        </div>

        {/* Add Session Button */}
        {sessions.length === 0 && (
          <button
            onClick={handleAddSession}
            className="w-full rounded-lg border-2 border-dashed border-border p-3 text-sm text-muted-foreground hover:border-primary hover:text-primary transition-colors"
          >
            + Add Provider Session
          </button>
        )}
      </div>
    </aside>
  )
}
