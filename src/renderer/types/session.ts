export type ProviderType = 'claude' | 'chatgpt' | 'gemini' | 'perplexity' | 'custom'
export type SessionType = 'provider' | 'capture'

export interface Session {
  id: string
  type: SessionType
  name: string
  provider?: ProviderType
  url?: string
  captureId?: string
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
  addCaptureSession: (captureId: string, name: string) => Promise<void>
  removeSession: (id: string) => Promise<void>
  setActiveSession: (id: string) => Promise<void>
  renameSession: (id: string, name: string) => void
  updateSessionUrl: (id: string, url: string) => void
  setupAutoRefresh: () => (() => void)
}
