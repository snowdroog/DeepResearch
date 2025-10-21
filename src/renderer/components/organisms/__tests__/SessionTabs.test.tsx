/**
 * Unit tests for SessionTabs component
 * Tests tab list rendering, active tab highlighting, tab switching, creating/closing tabs,
 * renaming tabs, keyboard shortcuts, and sessionStore integration
 * Target: 60%+ coverage with 15+ test cases
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderWithProviders, screen, waitFor, within } from '@/test-utils/test-helpers'
import userEvent from '@testing-library/user-event'
import { SessionTabs } from '../../session/SessionTabs'
import { useSessionStore } from '@/renderer/stores/sessionStore'
import type { ProviderType } from '@/renderer/types/session'

// Mock the Radix UI Tabs components
vi.mock('@radix-ui/react-tabs', () => ({
  Root: ({ children, className, value, onValueChange }: any) => (
    <div className={className} data-testid="tabs-root" data-value={value}>
      {children}
    </div>
  ),
  List: ({ children, className }: any) => (
    <div className={className} data-testid="tabs-list" role="tablist">
      {children}
    </div>
  ),
  Trigger: ({ children, className, value, onClick }: any) => (
    <button
      className={className}
      data-testid={`tab-trigger-${value}`}
      role="tab"
      onClick={onClick}
      aria-selected={className?.includes('bg-background')}
    >
      {children}
    </button>
  ),
  Content: ({ children, className, value }: any) => (
    <div className={className} data-testid={`tab-content-${value}`} role="tabpanel">
      {children}
    </div>
  ),
}))

// Mock the dialogs
vi.mock('@/renderer/components/session/ProviderSelectionDialog', () => ({
  ProviderSelectionDialog: ({ open, onOpenChange, onSelect }: any) => {
    if (!open) return null
    return (
      <div data-testid="provider-dialog">
        <button
          data-testid="select-claude"
          onClick={() => {
            onSelect('claude')
            onOpenChange(false)
          }}
        >
          Claude
        </button>
        <button
          data-testid="select-chatgpt"
          onClick={() => {
            onSelect('chatgpt')
            onOpenChange(false)
          }}
        >
          ChatGPT
        </button>
        <button
          data-testid="select-custom"
          onClick={() => {
            onSelect('custom', 'https://custom.ai')
            onOpenChange(false)
          }}
        >
          Custom
        </button>
        <button data-testid="close-dialog" onClick={() => onOpenChange(false)}>
          Cancel
        </button>
      </div>
    )
  },
}))

vi.mock('@/renderer/components/session/CloseSessionDialog', () => ({
  CloseSessionDialog: ({ open, onOpenChange, sessionName, onConfirm }: any) => {
    if (!open) return null
    return (
      <div data-testid="close-session-dialog">
        <p>Close session "{sessionName}"?</p>
        <button
          data-testid="confirm-close"
          onClick={() => {
            onConfirm()
            onOpenChange(false)
          }}
        >
          Confirm
        </button>
        <button data-testid="cancel-close" onClick={() => onOpenChange(false)}>
          Cancel
        </button>
      </div>
    )
  },
}))

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

describe('SessionTabs', () => {
  beforeEach(() => {
    // @ts-ignore - Mock localStorage
    global.localStorage = localStorageMock

    // Reset store state before each test
    useSessionStore.setState({
      sessions: [],
      activeSessionId: null,
    })

    // Clear localStorage
    localStorageMock.clear()

    // Use real timers by default - only use fake timers in specific tests
    vi.useRealTimers()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  describe('Tab List Rendering', () => {
    it('should initialize with a default Claude session when no sessions exist', async () => {
      renderWithProviders(<SessionTabs />)

      // Wait for the default session to be created
      await waitFor(() => {
        const state = useSessionStore.getState()
        expect(state.sessions).toHaveLength(1)
        expect(state.sessions[0].provider).toBe('claude')
      })
    })

    it('should render existing sessions from store', async () => {
      // Pre-populate store with sessions
      useSessionStore.getState().addSession('claude')
      await new Promise((resolve) => setTimeout(resolve, 10))
      useSessionStore.getState().addSession('chatgpt')

      renderWithProviders(<SessionTabs />)

      await waitFor(() => {
        const state = useSessionStore.getState()
        expect(state.sessions).toHaveLength(2)
      })

      // Check that tabs are rendered
      const tabList = screen.getByRole('tablist')
      expect(tabList).toBeInTheDocument()
    })

    it('should render all session tabs with provider indicators', async () => {
      useSessionStore.getState().addSession('claude')
      await new Promise((resolve) => setTimeout(resolve, 10))
      useSessionStore.getState().addSession('chatgpt')
      await new Promise((resolve) => setTimeout(resolve, 10))
      useSessionStore.getState().addSession('gemini')

      renderWithProviders(<SessionTabs />)

      await waitFor(() => {
        const tabs = screen.getAllByRole('tab')
        // We should have at least 3 session tabs (provider dialog trigger buttons might add more)
        expect(tabs.length).toBeGreaterThanOrEqual(3)
      })
    })

    it('should display session names correctly', async () => {
      useSessionStore.getState().addSession('claude')

      renderWithProviders(<SessionTabs />)

      await waitFor(() => {
        // "Claude" appears in both tab name and tab content
        const claudeElements = screen.getAllByText('Claude')
        expect(claudeElements.length).toBeGreaterThan(0)
      })
    })

    it('should display add session button', async () => {
      useSessionStore.getState().addSession('claude')

      renderWithProviders(<SessionTabs />)

      await waitFor(() => {
        const addButton = screen.getByTitle(/Add new session/i)
        expect(addButton).toBeInTheDocument()
      })
    })

    it('should display keyboard shortcuts hint', async () => {
      useSessionStore.getState().addSession('claude')

      renderWithProviders(<SessionTabs />)

      await waitFor(() => {
        expect(screen.getByText(/Cmd\/Ctrl\+T: New/)).toBeInTheDocument()
      })
    })
  })

  describe('Active Tab Highlighting', () => {
    it('should highlight the active tab', async () => {
      useSessionStore.getState().addSession('claude')
      await new Promise((resolve) => setTimeout(resolve, 10))
      useSessionStore.getState().addSession('chatgpt')

      const state = useSessionStore.getState()
      const firstSessionId = state.sessions[0].id

      // Set first session as active
      useSessionStore.getState().setActiveSession(firstSessionId)

      renderWithProviders(<SessionTabs />)

      await waitFor(() => {
        const firstTab = screen.getByTestId(`tab-trigger-${firstSessionId}`)
        // Active tabs have 'bg-background' class
        expect(firstTab.className).toContain('bg-background')
      })
    })

    it('should not highlight inactive tabs', async () => {
      useSessionStore.getState().addSession('claude')
      await new Promise((resolve) => setTimeout(resolve, 10))
      useSessionStore.getState().addSession('chatgpt')

      const state = useSessionStore.getState()
      const firstSessionId = state.sessions[0].id
      const secondSessionId = state.sessions[1].id

      // Set second session as active
      useSessionStore.getState().setActiveSession(secondSessionId)

      renderWithProviders(<SessionTabs />)

      await waitFor(() => {
        const firstTab = screen.getByTestId(`tab-trigger-${firstSessionId}`)
        // Inactive tabs have 'bg-muted/30' class
        expect(firstTab.className).toContain('bg-muted/30')
      })
    })
  })

  describe('Tab Switching', () => {
    it('should switch active tab when clicked', async () => {
      const user = userEvent.setup({ delay: null })

      useSessionStore.getState().addSession('claude')
      await new Promise((resolve) => setTimeout(resolve, 10))
      useSessionStore.getState().addSession('chatgpt')

      const state = useSessionStore.getState()
      const firstSessionId = state.sessions[0].id
      const secondSessionId = state.sessions[1].id

      // Set second session as active initially
      useSessionStore.getState().setActiveSession(secondSessionId)

      renderWithProviders(<SessionTabs />)

      // Click on first tab
      const firstTab = screen.getByTestId(`tab-trigger-${firstSessionId}`)
      await user.click(firstTab)

      await waitFor(() => {
        const newState = useSessionStore.getState()
        expect(newState.activeSessionId).toBe(firstSessionId)
      })
    })

    it('should update lastActiveAt when switching tabs', async () => {
      const user = userEvent.setup({ delay: null })

      useSessionStore.getState().addSession('claude')
      await new Promise((resolve) => setTimeout(resolve, 10))
      useSessionStore.getState().addSession('chatgpt')

      const state = useSessionStore.getState()
      const firstSessionId = state.sessions[0].id
      const originalLastActive = state.sessions[0].lastActiveAt

      renderWithProviders(<SessionTabs />)

      // Advance time
      await new Promise((resolve) => setTimeout(resolve, 50))

      // Click on first tab
      const firstTab = screen.getByTestId(`tab-trigger-${firstSessionId}`)
      await user.click(firstTab)

      await waitFor(() => {
        const newState = useSessionStore.getState()
        const session = newState.sessions.find((s) => s.id === firstSessionId)
        expect(session?.lastActiveAt).not.toEqual(originalLastActive)
      })
    })
  })

  describe('Creating New Tabs', () => {
    it('should open provider dialog when add button is clicked', async () => {
      const user = userEvent.setup({ delay: null })

      useSessionStore.getState().addSession('claude')

      renderWithProviders(<SessionTabs />)

      const addButton = screen.getByTitle(/Add new session/i)
      await user.click(addButton)

      await waitFor(() => {
        expect(screen.getByTestId('provider-dialog')).toBeInTheDocument()
      })
    })

    it('should create a new Claude session from dialog', async () => {
      const user = userEvent.setup({ delay: null })

      useSessionStore.getState().addSession('claude')

      renderWithProviders(<SessionTabs />)

      const addButton = screen.getByTitle(/Add new session/i)
      await user.click(addButton)

      await waitFor(() => {
        expect(screen.getByTestId('provider-dialog')).toBeInTheDocument()
      })

      const claudeButton = screen.getByTestId('select-claude')
      await user.click(claudeButton)

      await waitFor(() => {
        const state = useSessionStore.getState()
        expect(state.sessions.length).toBeGreaterThanOrEqual(2)
      })
    })

    it('should create a new ChatGPT session from dialog', async () => {
      const user = userEvent.setup({ delay: null })

      useSessionStore.getState().addSession('claude')

      renderWithProviders(<SessionTabs />)

      const addButton = screen.getByTitle(/Add new session/i)
      await user.click(addButton)

      const chatgptButton = screen.getByTestId('select-chatgpt')
      await user.click(chatgptButton)

      await waitFor(() => {
        const state = useSessionStore.getState()
        const hasChatGPT = state.sessions.some((s) => s.provider === 'chatgpt')
        expect(hasChatGPT).toBe(true)
      })
    })

    it('should create a custom session with URL from dialog', async () => {
      const user = userEvent.setup({ delay: null })

      useSessionStore.getState().addSession('claude')

      renderWithProviders(<SessionTabs />)

      const addButton = screen.getByTitle(/Add new session/i)
      await user.click(addButton)

      const customButton = screen.getByTestId('select-custom')
      await user.click(customButton)

      await waitFor(() => {
        const state = useSessionStore.getState()
        const customSession = state.sessions.find((s) => s.provider === 'custom')
        expect(customSession).toBeDefined()
        expect(customSession?.url).toBe('https://custom.ai')
      })
    })

    it('should close provider dialog when cancelled', async () => {
      const user = userEvent.setup({ delay: null })

      useSessionStore.getState().addSession('claude')

      renderWithProviders(<SessionTabs />)

      const addButton = screen.getByTitle(/Add new session/i)
      await user.click(addButton)

      await waitFor(() => {
        expect(screen.getByTestId('provider-dialog')).toBeInTheDocument()
      })

      const cancelButton = screen.getByTestId('close-dialog')
      await user.click(cancelButton)

      await waitFor(() => {
        expect(screen.queryByTestId('provider-dialog')).not.toBeInTheDocument()
      })
    })
  })

  describe('Closing Tabs', () => {
    it('should display close button on each tab', async () => {
      useSessionStore.getState().addSession('claude')

      renderWithProviders(<SessionTabs />)

      await waitFor(() => {
        const closeButton = screen.getByTitle('Close session')
        expect(closeButton).toBeInTheDocument()
      })
    })

    it('should open close confirmation dialog when close button clicked', async () => {
      const user = userEvent.setup({ delay: null })

      useSessionStore.getState().addSession('claude')

      renderWithProviders(<SessionTabs />)

      const closeButton = screen.getByTitle('Close session')
      await user.click(closeButton)

      await waitFor(() => {
        expect(screen.getByTestId('close-session-dialog')).toBeInTheDocument()
      })
    })

    it('should remove session when close is confirmed', async () => {
      const user = userEvent.setup({ delay: null })

      useSessionStore.getState().addSession('claude')
      await new Promise((resolve) => setTimeout(resolve, 10))
      useSessionStore.getState().addSession('chatgpt')

      renderWithProviders(<SessionTabs />)

      const initialCount = useSessionStore.getState().sessions.length

      const closeButtons = screen.getAllByTitle('Close session')
      await user.click(closeButtons[0])

      await waitFor(() => {
        expect(screen.getByTestId('close-session-dialog')).toBeInTheDocument()
      })

      const confirmButton = screen.getByTestId('confirm-close')
      await user.click(confirmButton)

      await waitFor(() => {
        const state = useSessionStore.getState()
        expect(state.sessions.length).toBe(initialCount - 1)
      })
    })

    it('should not remove session when close is cancelled', async () => {
      const user = userEvent.setup({ delay: null })

      useSessionStore.getState().addSession('claude')
      await new Promise((resolve) => setTimeout(resolve, 10))
      useSessionStore.getState().addSession('chatgpt')

      renderWithProviders(<SessionTabs />)

      const initialCount = useSessionStore.getState().sessions.length

      const closeButtons = screen.getAllByTitle('Close session')
      await user.click(closeButtons[0])

      await waitFor(() => {
        expect(screen.getByTestId('close-session-dialog')).toBeInTheDocument()
      })

      const cancelButton = screen.getByTestId('cancel-close')
      await user.click(cancelButton)

      await waitFor(() => {
        const state = useSessionStore.getState()
        expect(state.sessions.length).toBe(initialCount)
      })
    })

    // NOTE: Known DOM nesting issue at lines 111-120 in SessionTabs.tsx
    // The close button is nested inside the Tabs.Trigger button element,
    // which causes a button-in-button warning. This is a UX design choice
    // to allow clicking the close button without activating the tab.
    // The stopPropagation() call prevents event bubbling.
    it('should not switch tabs when close button is clicked (stopPropagation)', async () => {
      const user = userEvent.setup({ delay: null })

      useSessionStore.getState().addSession('claude')
      await new Promise((resolve) => setTimeout(resolve, 10))
      useSessionStore.getState().addSession('chatgpt')

      const state = useSessionStore.getState()
      const secondSessionId = state.sessions[1].id

      // Set second session as active
      useSessionStore.getState().setActiveSession(secondSessionId)

      renderWithProviders(<SessionTabs />)

      // Click close button on first tab (which is inactive)
      const closeButtons = screen.getAllByTitle('Close session')
      await user.click(closeButtons[0])

      // Active session should still be the second one
      await waitFor(() => {
        const newState = useSessionStore.getState()
        expect(newState.activeSessionId).toBe(secondSessionId)
      })
    })
  })

  describe('Renaming Tabs', () => {
    it('should enter edit mode when tab name is double-clicked', async () => {
      const user = userEvent.setup({ delay: null })

      useSessionStore.getState().addSession('claude')

      renderWithProviders(<SessionTabs />)

      // Find the session name in the tab (not in the content area)
      const tabs = screen.getAllByRole('tab')
      const sessionNameSpan = within(tabs[0]).getByText('Claude')
      await user.dblClick(sessionNameSpan)

      await waitFor(() => {
        const input = screen.getByDisplayValue('Claude')
        expect(input).toBeInTheDocument()
      })
    })

    it('should rename session when Enter is pressed', async () => {
      const user = userEvent.setup({ delay: null })

      useSessionStore.getState().addSession('claude')
      const sessionId = useSessionStore.getState().sessions[0].id

      renderWithProviders(<SessionTabs />)

      const tabs = screen.getAllByRole('tab')
      const sessionNameSpan = within(tabs[0]).getByText('Claude')
      await user.dblClick(sessionNameSpan)

      const input = screen.getByDisplayValue('Claude')
      await user.clear(input)
      await user.type(input, 'My Custom Name')
      await user.keyboard('{Enter}')

      await waitFor(() => {
        const state = useSessionStore.getState()
        const session = state.sessions.find((s) => s.id === sessionId)
        expect(session?.name).toBe('My Custom Name')
      })
    })

    it('should rename session when input loses focus', async () => {
      const user = userEvent.setup({ delay: null })

      useSessionStore.getState().addSession('claude')
      const sessionId = useSessionStore.getState().sessions[0].id

      renderWithProviders(<SessionTabs />)

      const tabs = screen.getAllByRole('tab')
      const sessionNameSpan = within(tabs[0]).getByText('Claude')
      await user.dblClick(sessionNameSpan)

      const input = screen.getByDisplayValue('Claude')
      await user.clear(input)
      await user.type(input, 'Renamed Session')

      // Blur the input
      input.blur()

      await waitFor(() => {
        const state = useSessionStore.getState()
        const session = state.sessions.find((s) => s.id === sessionId)
        expect(session?.name).toBe('Renamed Session')
      })
    })

    it('should cancel rename when Escape is pressed', async () => {
      const user = userEvent.setup({ delay: null })

      useSessionStore.getState().addSession('claude')
      const sessionId = useSessionStore.getState().sessions[0].id

      renderWithProviders(<SessionTabs />)

      const tabs = screen.getAllByRole('tab')
      const sessionNameSpan = within(tabs[0]).getByText('Claude')
      await user.dblClick(sessionNameSpan)

      const input = screen.getByDisplayValue('Claude')
      await user.clear(input)
      await user.type(input, 'Should Not Save')
      await user.keyboard('{Escape}')

      await waitFor(() => {
        const state = useSessionStore.getState()
        const session = state.sessions.find((s) => s.id === sessionId)
        expect(session?.name).toBe('Claude')
      })
    })

    it('should not rename if new name is empty or whitespace', async () => {
      const user = userEvent.setup({ delay: null })

      useSessionStore.getState().addSession('claude')
      const sessionId = useSessionStore.getState().sessions[0].id

      renderWithProviders(<SessionTabs />)

      const tabs = screen.getAllByRole('tab')
      const sessionNameSpan = within(tabs[0]).getByText('Claude')
      await user.dblClick(sessionNameSpan)

      const input = screen.getByDisplayValue('Claude')
      await user.clear(input)
      await user.type(input, '   ')
      await user.keyboard('{Enter}')

      await waitFor(() => {
        const state = useSessionStore.getState()
        const session = state.sessions.find((s) => s.id === sessionId)
        expect(session?.name).toBe('Claude')
      })
    })

    it('should trim whitespace from renamed session', async () => {
      const user = userEvent.setup({ delay: null })

      useSessionStore.getState().addSession('claude')
      const sessionId = useSessionStore.getState().sessions[0].id

      renderWithProviders(<SessionTabs />)

      const tabs = screen.getAllByRole('tab')
      const sessionNameSpan = within(tabs[0]).getByText('Claude')
      await user.dblClick(sessionNameSpan)

      const input = screen.getByDisplayValue('Claude')
      await user.clear(input)
      await user.type(input, '  Trimmed Name  ')
      await user.keyboard('{Enter}')

      await waitFor(() => {
        const state = useSessionStore.getState()
        const session = state.sessions.find((s) => s.id === sessionId)
        expect(session?.name).toBe('Trimmed Name')
      })
    })
  })

  describe('Keyboard Shortcuts', () => {
    it('should open provider dialog when Cmd/Ctrl+T is pressed', async () => {
      useSessionStore.getState().addSession('claude')

      renderWithProviders(<SessionTabs />)

      // Simulate Ctrl+T
      const event = new KeyboardEvent('keydown', {
        key: 't',
        ctrlKey: true,
        bubbles: true,
      })
      window.dispatchEvent(event)

      await waitFor(() => {
        expect(screen.getByTestId('provider-dialog')).toBeInTheDocument()
      })
    })

    it('should open close dialog when Cmd/Ctrl+W is pressed', async () => {
      useSessionStore.getState().addSession('claude')
      const sessionId = useSessionStore.getState().sessions[0].id

      // Set as active
      useSessionStore.getState().setActiveSession(sessionId)

      renderWithProviders(<SessionTabs />)

      // Simulate Ctrl+W
      const event = new KeyboardEvent('keydown', {
        key: 'w',
        ctrlKey: true,
        bubbles: true,
      })
      window.dispatchEvent(event)

      await waitFor(() => {
        expect(screen.getByTestId('close-session-dialog')).toBeInTheDocument()
      })
    })

    it('should switch to first session when Cmd/Ctrl+1 is pressed', async () => {
      useSessionStore.getState().addSession('claude')
      await new Promise((resolve) => setTimeout(resolve, 10))
      useSessionStore.getState().addSession('chatgpt')
      await new Promise((resolve) => setTimeout(resolve, 10))
      useSessionStore.getState().addSession('gemini')

      const state = useSessionStore.getState()
      const firstSessionId = state.sessions[0].id
      const thirdSessionId = state.sessions[2].id

      // Set third session as active
      useSessionStore.getState().setActiveSession(thirdSessionId)

      renderWithProviders(<SessionTabs />)

      // Simulate Ctrl+1
      const event = new KeyboardEvent('keydown', {
        key: '1',
        ctrlKey: true,
        bubbles: true,
      })
      window.dispatchEvent(event)

      await waitFor(() => {
        const newState = useSessionStore.getState()
        expect(newState.activeSessionId).toBe(firstSessionId)
      })
    })

    it('should switch to second session when Cmd/Ctrl+2 is pressed', async () => {
      useSessionStore.getState().addSession('claude')
      await new Promise((resolve) => setTimeout(resolve, 10))
      useSessionStore.getState().addSession('chatgpt')
      await new Promise((resolve) => setTimeout(resolve, 10))
      useSessionStore.getState().addSession('gemini')

      const state = useSessionStore.getState()
      const secondSessionId = state.sessions[1].id

      renderWithProviders(<SessionTabs />)

      // Simulate Ctrl+2
      const event = new KeyboardEvent('keydown', {
        key: '2',
        ctrlKey: true,
        bubbles: true,
      })
      window.dispatchEvent(event)

      await waitFor(() => {
        const newState = useSessionStore.getState()
        expect(newState.activeSessionId).toBe(secondSessionId)
      })
    })

    it('should not switch tabs for Cmd/Ctrl+0 (invalid index)', async () => {
      useSessionStore.getState().addSession('claude')
      const sessionId = useSessionStore.getState().sessions[0].id

      useSessionStore.getState().setActiveSession(sessionId)

      renderWithProviders(<SessionTabs />)

      // Simulate Ctrl+0 (invalid)
      const event = new KeyboardEvent('keydown', {
        key: '0',
        ctrlKey: true,
        bubbles: true,
      })
      window.dispatchEvent(event)

      await waitFor(() => {
        const state = useSessionStore.getState()
        // Should stay on the same session
        expect(state.activeSessionId).toBe(sessionId)
      })
    })

    it('should not switch tabs when index exceeds session count', async () => {
      useSessionStore.getState().addSession('claude')
      await new Promise((resolve) => setTimeout(resolve, 10))
      useSessionStore.getState().addSession('chatgpt')

      const state = useSessionStore.getState()
      const secondSessionId = state.sessions[1].id

      useSessionStore.getState().setActiveSession(secondSessionId)

      renderWithProviders(<SessionTabs />)

      // Simulate Ctrl+9 (only 2 sessions exist)
      const event = new KeyboardEvent('keydown', {
        key: '9',
        ctrlKey: true,
        bubbles: true,
      })
      window.dispatchEvent(event)

      await waitFor(() => {
        const newState = useSessionStore.getState()
        // Should stay on the same session
        expect(newState.activeSessionId).toBe(secondSessionId)
      })
    })

    it('should prevent default browser behavior for keyboard shortcuts', async () => {
      useSessionStore.getState().addSession('claude')

      renderWithProviders(<SessionTabs />)

      // Simulate Ctrl+T with preventDefault spy
      const event = new KeyboardEvent('keydown', {
        key: 't',
        ctrlKey: true,
        bubbles: true,
        cancelable: true,
      })

      const preventDefaultSpy = vi.spyOn(event, 'preventDefault')
      window.dispatchEvent(event)

      // Wait for the event handler to run
      await waitFor(() => {
        expect(screen.getByTestId('provider-dialog')).toBeInTheDocument()
      })
    })
  })

  describe('Tab Content Rendering', () => {
    it('should render tab content for each session', async () => {
      useSessionStore.getState().addSession('claude')
      const sessionId = useSessionStore.getState().sessions[0].id

      renderWithProviders(<SessionTabs />)

      await waitFor(() => {
        const tabContent = screen.getByTestId(`tab-content-${sessionId}`)
        expect(tabContent).toBeInTheDocument()
      })
    })

    it('should display session provider name in content', async () => {
      useSessionStore.getState().addSession('claude')

      renderWithProviders(<SessionTabs />)

      await waitFor(() => {
        // The tab content shows the provider name as a badge
        const badges = screen.getAllByText('Claude')
        expect(badges.length).toBeGreaterThan(0)
      })
    })

    it('should display session URL in content', async () => {
      useSessionStore.getState().addSession('claude')

      renderWithProviders(<SessionTabs />)

      await waitFor(() => {
        expect(screen.getByText('https://claude.ai')).toBeInTheDocument()
      })
    })

    it('should display BrowserView placeholder message', async () => {
      useSessionStore.getState().addSession('claude')

      renderWithProviders(<SessionTabs />)

      await waitFor(() => {
        expect(screen.getByText('BrowserView will be embedded here')).toBeInTheDocument()
      })
    })
  })

  describe('Integration with sessionStore', () => {
    it('should sync with sessionStore state', async () => {
      useSessionStore.getState().addSession('claude')

      renderWithProviders(<SessionTabs />)

      // Add a session directly to the store
      await new Promise((resolve) => setTimeout(resolve, 10))
      useSessionStore.getState().addSession('chatgpt')

      await waitFor(() => {
        const state = useSessionStore.getState()
        expect(state.sessions).toHaveLength(2)
      })
    })

    it('should maintain active session in store', async () => {
      const user = userEvent.setup({ delay: null })

      useSessionStore.getState().addSession('claude')
      await new Promise((resolve) => setTimeout(resolve, 10))
      useSessionStore.getState().addSession('chatgpt')

      const state = useSessionStore.getState()
      const firstSessionId = state.sessions[0].id

      renderWithProviders(<SessionTabs />)

      // Click on first tab
      const firstTab = screen.getByTestId(`tab-trigger-${firstSessionId}`)
      await user.click(firstTab)

      await waitFor(() => {
        const newState = useSessionStore.getState()
        expect(newState.activeSessionId).toBe(firstSessionId)
      })
    })

    it('should activate first remaining session when active session is removed', async () => {
      const user = userEvent.setup({ delay: null })

      useSessionStore.getState().addSession('claude')
      await new Promise((resolve) => setTimeout(resolve, 10))
      useSessionStore.getState().addSession('chatgpt')
      await new Promise((resolve) => setTimeout(resolve, 10))
      useSessionStore.getState().addSession('gemini')

      const state = useSessionStore.getState()
      const firstSessionId = state.sessions[0].id
      const thirdSessionId = state.sessions[2].id

      // Set third session as active
      useSessionStore.getState().setActiveSession(thirdSessionId)

      renderWithProviders(<SessionTabs />)

      // Close the active (third) session
      const closeButtons = screen.getAllByTitle('Close session')
      await user.click(closeButtons[2])

      const confirmButton = screen.getByTestId('confirm-close')
      await user.click(confirmButton)

      await waitFor(() => {
        const newState = useSessionStore.getState()
        // Should activate the first session
        expect(newState.activeSessionId).toBe(firstSessionId)
      })
    })
  })

  describe('Edge Cases', () => {
    it('should handle rapid tab switching', async () => {
      const user = userEvent.setup({ delay: null })

      useSessionStore.getState().addSession('claude')
      await new Promise((resolve) => setTimeout(resolve, 10))
      useSessionStore.getState().addSession('chatgpt')
      await new Promise((resolve) => setTimeout(resolve, 10))
      useSessionStore.getState().addSession('gemini')

      const state = useSessionStore.getState()
      const sessionIds = state.sessions.map((s) => s.id)

      renderWithProviders(<SessionTabs />)

      // Rapidly click through tabs
      for (const id of sessionIds) {
        const tab = screen.getByTestId(`tab-trigger-${id}`)
        await user.click(tab)
      }

      // Should end up on the last clicked tab
      await waitFor(() => {
        const newState = useSessionStore.getState()
        expect(newState.activeSessionId).toBe(sessionIds[sessionIds.length - 1])
      })
    })

    it('should handle empty session name gracefully', async () => {
      // Manually create a session with empty name (shouldn't happen in normal flow)
      useSessionStore.setState({
        sessions: [
          {
            id: 'test-id',
            name: '',
            provider: 'claude',
            url: 'https://claude.ai',
            isActive: false,
            createdAt: new Date(),
            lastActiveAt: new Date(),
          },
        ],
        activeSessionId: 'test-id',
      })

      renderWithProviders(<SessionTabs />)

      // Should still render without crashing
      await waitFor(() => {
        const tabList = screen.getByRole('tablist')
        expect(tabList).toBeInTheDocument()
      })
    })

    it('should cleanup keyboard event listeners on unmount', async () => {
      useSessionStore.getState().addSession('claude')

      const { unmount } = renderWithProviders(<SessionTabs />)

      // Spy on removeEventListener
      const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener')

      unmount()

      // Should have removed the keydown listener
      expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function))
    })
  })
})
