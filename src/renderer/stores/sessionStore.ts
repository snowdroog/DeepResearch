import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Session, SessionState, ProviderType } from '../types/session'

const PROVIDER_URLS: Record<ProviderType, string> = {
  claude: 'https://claude.ai',
  chatgpt: 'https://chat.openai.com',
  gemini: 'https://gemini.google.com',
  perplexity: 'https://www.perplexity.ai',
  custom: '',
}

const PROVIDER_NAMES: Record<ProviderType, string> = {
  claude: 'Claude',
  chatgpt: 'ChatGPT',
  gemini: 'Gemini',
  perplexity: 'Perplexity',
  custom: 'Custom',
}

function generateId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

export const useSessionStore = create<SessionState>()(
  persist(
    (set) => ({
      sessions: [],
      activeSessionId: null,

      addSession: (provider: ProviderType, url?: string) => {
        const newSession: Session = {
          id: generateId(),
          name: PROVIDER_NAMES[provider],
          provider,
          url: url || PROVIDER_URLS[provider],
          isActive: false,
          createdAt: new Date(),
          lastActiveAt: new Date(),
        }

        set((state) => {
          const sessions = [...state.sessions, newSession]
          return {
            sessions,
            activeSessionId: newSession.id,
          }
        })
      },

      removeSession: (id: string) => {
        set((state) => {
          const sessions = state.sessions.filter((s) => s.id !== id)
          let activeSessionId = state.activeSessionId

          // If we removed the active session, activate another one
          if (activeSessionId === id) {
            activeSessionId = sessions.length > 0 ? sessions[0].id : null
          }

          return { sessions, activeSessionId }
        })
      },

      setActiveSession: (id: string) => {
        set((state) => {
          const sessions = state.sessions.map((s) => ({
            ...s,
            isActive: s.id === id,
            lastActiveAt: s.id === id ? new Date() : s.lastActiveAt,
          }))

          return {
            sessions,
            activeSessionId: id,
          }
        })
      },

      renameSession: (id: string, name: string) => {
        set((state) => ({
          sessions: state.sessions.map((s) => (s.id === id ? { ...s, name } : s)),
        }))
      },

      updateSessionUrl: (id: string, url: string) => {
        set((state) => ({
          sessions: state.sessions.map((s) => (s.id === id ? { ...s, url } : s)),
        }))
      },
    }),
    {
      name: 'deep-research-sessions',
      version: 1,
    }
  )
)
