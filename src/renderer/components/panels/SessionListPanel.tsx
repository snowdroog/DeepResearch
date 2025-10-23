import { Plus } from 'lucide-react'
import { useSessionStore } from '../../stores/sessionStore'
import { ProviderType } from '../../types/session'
import { useState } from 'react'
import { ProviderSelectionDialog } from '../session/ProviderSelectionDialog'

const PROVIDER_COLORS: Record<ProviderType, string> = {
  claude: 'bg-blue-500',
  chatgpt: 'bg-green-500',
  gemini: 'bg-purple-500',
  perplexity: 'bg-cyan-500',
  custom: 'bg-gray-500',
}

const PROVIDER_LABELS: Record<ProviderType, string> = {
  claude: 'Claude',
  chatgpt: 'ChatGPT',
  gemini: 'Gemini',
  perplexity: 'Perplexity',
  custom: 'Custom',
}

// All available providers
const ALL_PROVIDERS: ProviderType[] = ['claude', 'chatgpt', 'gemini', 'perplexity']

export function SessionListPanel() {
  const { sessions, activeSessionId, addSession, setActiveSession } = useSessionStore()
  const [showProviderDialog, setShowProviderDialog] = useState(false)

  // Group sessions by provider (should only be one per provider)
  // Only count provider sessions, not capture sessions
  const sessionsByProvider = new Map<ProviderType, string>()
  sessions.filter(s => s.type === 'provider' && s.provider).forEach(session => {
    sessionsByProvider.set(session.provider!, session.id)
  })

  // Find which providers are available but not connected
  const availableProviders = ALL_PROVIDERS.filter(provider => !sessionsByProvider.has(provider))

  const handleProviderClick = (provider: ProviderType) => {
    const sessionId = sessionsByProvider.get(provider)
    if (sessionId) {
      setActiveSession(sessionId)
    }
  }

  const handleAddProvider = (provider: ProviderType, customUrl?: string) => {
    addSession(provider, customUrl)
  }

  return (
    <>
      <aside className="h-full border-r bg-muted/30 p-4 overflow-y-auto">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold">AI Providers</h3>
              <p className="text-xs text-muted-foreground">
                {sessionsByProvider.size} of {ALL_PROVIDERS.length} connected
              </p>
            </div>
            {availableProviders.length > 0 && (
              <button
                onClick={() => setShowProviderDialog(true)}
                className="rounded-md p-1.5 hover:bg-accent transition-colors"
                title="Add provider"
              >
                <Plus className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Connected Providers */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Connected</p>
            {ALL_PROVIDERS.map((provider) => {
              const sessionId = sessionsByProvider.get(provider)
              const isConnected = !!sessionId
              const isActive = sessionId === activeSessionId

              if (!isConnected) return null

              return (
                <button
                  key={provider}
                  onClick={() => handleProviderClick(provider)}
                  className={`w-full rounded-lg border bg-background p-3 text-left transition-all hover:shadow-md ${
                    isActive ? 'ring-2 ring-ring ring-offset-1' : ''
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div className={`h-2 w-2 rounded-full ${PROVIDER_COLORS[provider]}`}></div>
                    <span className="text-sm font-medium">{PROVIDER_LABELS[provider]}</span>
                  </div>
                  <p className="mt-1 text-xs text-green-600 dark:text-green-400">
                    ● Connected
                  </p>
                </button>
              )
            })}
          </div>

          {/* Available Providers */}
          {availableProviders.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Available</p>
              {availableProviders.map((provider) => (
                <button
                  key={provider}
                  onClick={() => setShowProviderDialog(true)}
                  className="w-full rounded-lg border-2 border-dashed border-border bg-background/50 p-3 text-left transition-all hover:border-primary hover:bg-background"
                >
                  <div className="flex items-center gap-2">
                    <div className={`h-2 w-2 rounded-full ${PROVIDER_COLORS[provider]} opacity-50`}></div>
                    <span className="text-sm font-medium text-muted-foreground">{PROVIDER_LABELS[provider]}</span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Click to connect
                  </p>
                </button>
              ))}
            </div>
          )}

          {/* Empty State */}
          {sessionsByProvider.size === 0 && (
            <div className="text-center py-8">
              <p className="text-sm text-muted-foreground mb-3">No providers connected</p>
              <button
                onClick={() => setShowProviderDialog(true)}
                className="text-sm text-primary hover:underline"
              >
                + Connect your first provider
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Provider Selection Dialog */}
      <ProviderSelectionDialog
        open={showProviderDialog}
        onOpenChange={setShowProviderDialog}
        onSelect={handleAddProvider}
      />
    </>
  )
}
