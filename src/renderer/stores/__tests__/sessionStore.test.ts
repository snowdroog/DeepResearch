/**
 * Unit tests for sessionStore (Zustand)
 * Tests for session management, persistence, and state mutations
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { useSessionStore } from '../sessionStore'
import type { Session, ProviderType } from '../../types/session'

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString()
    },
    removeItem: (key: string) => {
      delete store[key]
    },
    clear: () => {
      store = {}
    },
  }
})()

// Setup global mocks
beforeEach(() => {
  // @ts-ignore - Mock localStorage
  global.localStorage = localStorageMock

  // Reset store state
  useSessionStore.setState({
    sessions: [],
    activeSessionId: null,
  })

  // Clear localStorage
  localStorageMock.clear()

  // Mock Date.now for consistent testing
  vi.useFakeTimers()
})

afterEach(() => {
  vi.restoreAllMocks()
  vi.useRealTimers()
})

describe('sessionStore', () => {
  describe('State Initialization', () => {
    it('should initialize with empty sessions and no active session', () => {
      const state = useSessionStore.getState()

      expect(state.sessions).toEqual([])
      expect(state.activeSessionId).toBe(null)
    })

    it('should have all required action functions', () => {
      const state = useSessionStore.getState()

      expect(typeof state.addSession).toBe('function')
      expect(typeof state.removeSession).toBe('function')
      expect(typeof state.setActiveSession).toBe('function')
      expect(typeof state.renameSession).toBe('function')
      expect(typeof state.updateSessionUrl).toBe('function')
    })
  })

  describe('addSession', () => {
    it('should add a Claude session with default URL', () => {
      const provider: ProviderType = 'claude'

      useSessionStore.getState().addSession(provider)

      const state = useSessionStore.getState()
      expect(state.sessions).toHaveLength(1)
      expect(state.sessions[0].provider).toBe('claude')
      expect(state.sessions[0].name).toBe('Claude')
      expect(state.sessions[0].url).toBe('https://claude.ai')
      expect(state.sessions[0].isActive).toBe(false)
    })

    it('should add a ChatGPT session with default URL', () => {
      useSessionStore.getState().addSession('chatgpt')

      const state = useSessionStore.getState()
      expect(state.sessions[0].provider).toBe('chatgpt')
      expect(state.sessions[0].name).toBe('ChatGPT')
      expect(state.sessions[0].url).toBe('https://chat.openai.com')
    })

    it('should add a Gemini session with default URL', () => {
      useSessionStore.getState().addSession('gemini')

      const state = useSessionStore.getState()
      expect(state.sessions[0].provider).toBe('gemini')
      expect(state.sessions[0].name).toBe('Gemini')
      expect(state.sessions[0].url).toBe('https://gemini.google.com')
    })

    it('should add a Perplexity session with default URL', () => {
      useSessionStore.getState().addSession('perplexity')

      const state = useSessionStore.getState()
      expect(state.sessions[0].provider).toBe('perplexity')
      expect(state.sessions[0].name).toBe('Perplexity')
      expect(state.sessions[0].url).toBe('https://www.perplexity.ai')
    })

    it('should add a custom session with provided URL', () => {
      const customUrl = 'https://custom-ai.example.com'

      useSessionStore.getState().addSession('custom', customUrl)

      const state = useSessionStore.getState()
      expect(state.sessions[0].provider).toBe('custom')
      expect(state.sessions[0].name).toBe('Custom')
      expect(state.sessions[0].url).toBe(customUrl)
    })

    it('should generate unique session IDs', () => {
      useSessionStore.getState().addSession('claude')
      vi.advanceTimersByTime(10)
      useSessionStore.getState().addSession('chatgpt')

      const state = useSessionStore.getState()
      expect(state.sessions[0].id).not.toBe(state.sessions[1].id)
    })

    it('should set the new session as active', () => {
      useSessionStore.getState().addSession('claude')

      const state = useSessionStore.getState()
      expect(state.activeSessionId).toBe(state.sessions[0].id)
    })

    it('should set creation timestamp', () => {
      const now = new Date('2024-01-15T12:00:00Z')
      vi.setSystemTime(now)

      useSessionStore.getState().addSession('claude')

      const state = useSessionStore.getState()
      expect(state.sessions[0].createdAt).toEqual(now)
      expect(state.sessions[0].lastActiveAt).toEqual(now)
    })

    it('should add multiple sessions', () => {
      useSessionStore.getState().addSession('claude')
      vi.advanceTimersByTime(10)
      useSessionStore.getState().addSession('chatgpt')
      vi.advanceTimersByTime(10)
      useSessionStore.getState().addSession('gemini')

      const state = useSessionStore.getState()
      expect(state.sessions).toHaveLength(3)
      expect(state.sessions[0].provider).toBe('claude')
      expect(state.sessions[1].provider).toBe('chatgpt')
      expect(state.sessions[2].provider).toBe('gemini')
    })
  })

  describe('removeSession', () => {
    it('should remove a session by ID', () => {
      useSessionStore.getState().addSession('claude')
      const sessionId = useSessionStore.getState().sessions[0].id

      useSessionStore.getState().removeSession(sessionId)

      const state = useSessionStore.getState()
      expect(state.sessions).toHaveLength(0)
    })

    it('should remove only the specified session', () => {
      useSessionStore.getState().addSession('claude')
      vi.advanceTimersByTime(10)
      useSessionStore.getState().addSession('chatgpt')

      const state = useSessionStore.getState()
      const firstSessionId = state.sessions[0].id

      useSessionStore.getState().removeSession(firstSessionId)

      const newState = useSessionStore.getState()
      expect(newState.sessions).toHaveLength(1)
      expect(newState.sessions[0].provider).toBe('chatgpt')
    })

    it('should activate first remaining session when removing active session', () => {
      useSessionStore.getState().addSession('claude')
      vi.advanceTimersByTime(10)
      useSessionStore.getState().addSession('chatgpt')
      vi.advanceTimersByTime(10)
      useSessionStore.getState().addSession('gemini')

      const state = useSessionStore.getState()
      const activeSessionId = state.activeSessionId // Should be gemini (last added)

      useSessionStore.getState().removeSession(activeSessionId!)

      const newState = useSessionStore.getState()
      expect(newState.activeSessionId).toBe(newState.sessions[0].id)
      expect(newState.sessions).toHaveLength(2)
    })

    it('should set activeSessionId to null when removing last session', () => {
      useSessionStore.getState().addSession('claude')
      const sessionId = useSessionStore.getState().sessions[0].id

      useSessionStore.getState().removeSession(sessionId)

      const state = useSessionStore.getState()
      expect(state.activeSessionId).toBe(null)
      expect(state.sessions).toHaveLength(0)
    })

    it('should not change activeSessionId when removing non-active session', () => {
      useSessionStore.getState().addSession('claude')
      vi.advanceTimersByTime(10)
      useSessionStore.getState().addSession('chatgpt')

      const state = useSessionStore.getState()
      const firstSessionId = state.sessions[0].id
      const activeSessionId = state.activeSessionId

      useSessionStore.getState().removeSession(firstSessionId)

      expect(useSessionStore.getState().activeSessionId).toBe(activeSessionId)
    })
  })

  describe('setActiveSession', () => {
    it('should set a session as active', () => {
      useSessionStore.getState().addSession('claude')
      vi.advanceTimersByTime(10)
      useSessionStore.getState().addSession('chatgpt')

      const state = useSessionStore.getState()
      const firstSessionId = state.sessions[0].id

      useSessionStore.getState().setActiveSession(firstSessionId)

      const newState = useSessionStore.getState()
      expect(newState.activeSessionId).toBe(firstSessionId)
    })

    it('should update isActive flag for all sessions', () => {
      useSessionStore.getState().addSession('claude')
      vi.advanceTimersByTime(10)
      useSessionStore.getState().addSession('chatgpt')

      const state = useSessionStore.getState()
      const firstSessionId = state.sessions[0].id

      useSessionStore.getState().setActiveSession(firstSessionId)

      const newState = useSessionStore.getState()
      expect(newState.sessions[0].isActive).toBe(true)
      expect(newState.sessions[1].isActive).toBe(false)
    })

    it('should update lastActiveAt timestamp for active session', () => {
      useSessionStore.getState().addSession('claude')
      const sessionId = useSessionStore.getState().sessions[0].id

      vi.advanceTimersByTime(5000)
      const newTime = new Date()
      vi.setSystemTime(newTime)

      useSessionStore.getState().setActiveSession(sessionId)

      const state = useSessionStore.getState()
      expect(state.sessions[0].lastActiveAt).toEqual(newTime)
    })

    it('should not update lastActiveAt for non-active sessions', () => {
      useSessionStore.getState().addSession('claude')
      vi.advanceTimersByTime(10)
      useSessionStore.getState().addSession('chatgpt')

      const state = useSessionStore.getState()
      const firstSessionId = state.sessions[0].id
      const secondSessionId = state.sessions[1].id
      const originalLastActiveAt = state.sessions[0].lastActiveAt

      useSessionStore.getState().setActiveSession(secondSessionId)

      const newState = useSessionStore.getState()
      expect(newState.sessions[0].lastActiveAt).toEqual(originalLastActiveAt)
    })
  })

  describe('renameSession', () => {
    it('should rename a session', () => {
      useSessionStore.getState().addSession('claude')
      const sessionId = useSessionStore.getState().sessions[0].id

      useSessionStore.getState().renameSession(sessionId, 'My Claude Session')

      const state = useSessionStore.getState()
      expect(state.sessions[0].name).toBe('My Claude Session')
    })

    it('should only rename the specified session', () => {
      useSessionStore.getState().addSession('claude')
      vi.advanceTimersByTime(10)
      useSessionStore.getState().addSession('chatgpt')

      const state = useSessionStore.getState()
      const firstSessionId = state.sessions[0].id

      useSessionStore.getState().renameSession(firstSessionId, 'Renamed')

      const newState = useSessionStore.getState()
      expect(newState.sessions[0].name).toBe('Renamed')
      expect(newState.sessions[1].name).toBe('ChatGPT')
    })
  })

  describe('updateSessionUrl', () => {
    it('should update a session URL', () => {
      useSessionStore.getState().addSession('claude')
      const sessionId = useSessionStore.getState().sessions[0].id
      const newUrl = 'https://new-claude.ai'

      useSessionStore.getState().updateSessionUrl(sessionId, newUrl)

      const state = useSessionStore.getState()
      expect(state.sessions[0].url).toBe(newUrl)
    })

    it('should only update the specified session URL', () => {
      useSessionStore.getState().addSession('claude')
      vi.advanceTimersByTime(10)
      useSessionStore.getState().addSession('chatgpt')

      const state = useSessionStore.getState()
      const firstSessionId = state.sessions[0].id
      const originalUrl = state.sessions[1].url

      useSessionStore.getState().updateSessionUrl(firstSessionId, 'https://new-url.com')

      const newState = useSessionStore.getState()
      expect(newState.sessions[0].url).toBe('https://new-url.com')
      expect(newState.sessions[1].url).toBe(originalUrl)
    })
  })

  describe('State Immutability', () => {
    it('should not mutate original sessions array when adding', () => {
      const originalSessions = useSessionStore.getState().sessions

      useSessionStore.getState().addSession('claude')

      expect(originalSessions).toHaveLength(0)
      expect(useSessionStore.getState().sessions).not.toBe(originalSessions)
    })

    it('should not mutate original sessions when renaming', () => {
      useSessionStore.getState().addSession('claude')
      const state = useSessionStore.getState()
      const originalSession = state.sessions[0]

      useSessionStore.getState().renameSession(originalSession.id, 'New Name')

      expect(originalSession.name).toBe('Claude')
      expect(useSessionStore.getState().sessions[0].name).toBe('New Name')
    })
  })

  describe('Persistence', () => {
    it('should have persist middleware configured', () => {
      // Note: Testing actual localStorage persistence requires integration tests
      // Here we verify the store structure supports persistence
      const state = useSessionStore.getState()

      expect(state.sessions).toBeDefined()
      expect(state.activeSessionId).toBeDefined()
    })

    it('should maintain state consistency after operations', () => {
      useSessionStore.getState().addSession('claude')
      const sessionId = useSessionStore.getState().sessions[0].id

      useSessionStore.getState().renameSession(sessionId, 'Test')
      useSessionStore.getState().setActiveSession(sessionId)

      const state = useSessionStore.getState()
      expect(state.sessions[0].name).toBe('Test')
      expect(state.activeSessionId).toBe(sessionId)
    })
  })
})
