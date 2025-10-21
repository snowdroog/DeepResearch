import { create } from 'zustand'
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

// Map renderer provider types to Electron provider types
function mapProviderType(provider: ProviderType): 'claude' | 'openai' | 'gemini' | 'custom' {
  if (provider === 'chatgpt') return 'openai'
  if (provider === 'perplexity') return 'custom'
  return provider as 'claude' | 'openai' | 'gemini' | 'custom'
}

export const useSessionStore = create<SessionState>()((set) => ({
      sessions: [],
      activeSessionId: null,

      addSession: async (provider: ProviderType, url?: string) => {
        // Create session via IPC
        const result = await window.electronAPI.sessions.create({
          provider: mapProviderType(provider),
          name: PROVIDER_NAMES[provider],
          url: url || PROVIDER_URLS[provider],
        })

        if (!result.success) {
          console.error('[SessionStore] Failed to create session:', result.error)
          return
        }

        console.log('[SessionStore] Session created:', result.session)

        const newSession: Session = {
          id: result.session.id,
          name: result.session.name,
          provider,
          url: url || PROVIDER_URLS[provider],
          isActive: false,
          createdAt: new Date(result.session.created_at),
          lastActiveAt: new Date(result.session.last_active),
        }

        set((state) => {
          const sessions = [...state.sessions, newSession]
          return {
            sessions,
            activeSessionId: newSession.id,
          }
        })

        // Activate the newly created session
        await window.electronAPI.sessions.activate(newSession.id)
      },

      removeSession: async (id: string) => {
        // Delete session via IPC
        const result = await window.electronAPI.sessions.delete(id)

        if (!result.success) {
          console.error('[SessionStore] Failed to delete session:', result.error)
          return
        }

        console.log('[SessionStore] Session deleted:', id)

        set((state) => {
          const sessions = state.sessions.filter((s) => s.id !== id)
          let activeSessionId = state.activeSessionId

          // If we removed the active session, activate another one
          if (activeSessionId === id) {
            activeSessionId = sessions.length > 0 ? sessions[0].id : null
            // Activate the new active session via IPC
            if (activeSessionId) {
              window.electronAPI.sessions.activate(activeSessionId)
            }
          }

          return { sessions, activeSessionId }
        })
      },

      setActiveSession: async (id: string) => {
        // Activate session via IPC
        const result = await window.electronAPI.sessions.activate(id)

        if (!result.success) {
          console.error('[SessionStore] Failed to activate session:', result.error)
          return
        }

        console.log('[SessionStore] Session activated:', id)

        set((state) => {
          const sessions = state.sessions.map((s) => ({
            ...s,
            isActive: s.id === id,
            lastActiveAt: s.id === id ? new Date() : s.lastActiveAt,
          }))

          // Hide all other views
          state.sessions.forEach((s) => {
            if (s.id !== id) {
              window.electronAPI.views.setVisible(s.id, false)
            }
          })

          // Show the active view
          window.electronAPI.views.setVisible(id, true)

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
    })
  )
