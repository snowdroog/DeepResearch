export type ProviderType = 'claude' | 'chatgpt' | 'gemini' | 'perplexity' | 'custom'

export interface Session {
  id: string
  name: string
  provider: ProviderType
  url: string
  isActive: boolean
  createdAt: Date
  lastActiveAt: Date
}

export interface SessionState {
  sessions: Session[]
  activeSessionId: string | null

  // Actions
  loadSessions: () => Promise<void>
  addSession: (provider: ProviderType, url?: string) => Promise<void>
  removeSession: (id: string) => Promise<void>
  setActiveSession: (id: string) => Promise<void>
  renameSession: (id: string, name: string) => void
  updateSessionUrl: (id: string, url: string) => void
}
