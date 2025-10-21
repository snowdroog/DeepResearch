/**
 * Unit tests for uiStore (Zustand)
 * Tests for UI state management, dialogs, panels, theme, and layout preferences
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { useUIStore } from '../uiStore'
import type { DialogState, PanelState } from '../uiStore'

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

// Default states
const DEFAULT_DIALOG_STATE: DialogState = {
  settings: false,
  export: false,
  captureDetail: false,
}

const DEFAULT_PANEL_STATE: PanelState = {
  isDataPanelCollapsed: false,
  sidebar: {
    size: 20,
    isCollapsed: false,
  },
  main: {
    size: 50,
  },
  data: {
    size: 30,
    isCollapsed: false,
  },
}

// Setup global mocks
beforeEach(() => {
  // @ts-ignore - Mock localStorage
  global.localStorage = localStorageMock

  // Reset store state
  useUIStore.setState({
    dialogs: DEFAULT_DIALOG_STATE,
    panels: DEFAULT_PANEL_STATE,
    theme: 'system',
    layout: {
      compactMode: false,
      showToolbar: true,
      sidebarPosition: 'left',
    },
  })

  // Clear localStorage
  localStorageMock.clear()
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('uiStore', () => {
  describe('State Initialization', () => {
    it('should initialize with default dialog states', () => {
      const state = useUIStore.getState()

      expect(state.dialogs).toEqual(DEFAULT_DIALOG_STATE)
      expect(state.dialogs.settings).toBe(false)
      expect(state.dialogs.export).toBe(false)
      expect(state.dialogs.captureDetail).toBe(false)
    })

    it('should initialize with default panel states', () => {
      const state = useUIStore.getState()

      expect(state.panels).toEqual(DEFAULT_PANEL_STATE)
      expect(state.panels.sidebar.size).toBe(20)
      expect(state.panels.main.size).toBe(50)
      expect(state.panels.data.size).toBe(30)
    })

    it('should initialize with system theme', () => {
      const state = useUIStore.getState()

      expect(state.theme).toBe('system')
    })

    it('should initialize with default layout preferences', () => {
      const state = useUIStore.getState()

      expect(state.layout.compactMode).toBe(false)
      expect(state.layout.showToolbar).toBe(true)
      expect(state.layout.sidebarPosition).toBe('left')
    })

    it('should have all required action functions', () => {
      const state = useUIStore.getState()

      expect(typeof state.setDialogOpen).toBe('function')
      expect(typeof state.closeAllDialogs).toBe('function')
      expect(typeof state.setPanelCollapsed).toBe('function')
      expect(typeof state.setPanelSize).toBe('function')
      expect(typeof state.resetPanelLayout).toBe('function')
      expect(typeof state.setTheme).toBe('function')
      expect(typeof state.updateLayout).toBe('function')
    })
  })

  describe('Dialog Management', () => {
    it('should open settings dialog', () => {
      useUIStore.getState().setDialogOpen('settings', true)

      const state = useUIStore.getState()
      expect(state.dialogs.settings).toBe(true)
      expect(state.dialogs.export).toBe(false)
      expect(state.dialogs.captureDetail).toBe(false)
    })

    it('should close settings dialog', () => {
      useUIStore.setState({
        dialogs: { ...DEFAULT_DIALOG_STATE, settings: true },
      })

      useUIStore.getState().setDialogOpen('settings', false)

      const state = useUIStore.getState()
      expect(state.dialogs.settings).toBe(false)
    })

    it('should open export dialog', () => {
      useUIStore.getState().setDialogOpen('export', true)

      const state = useUIStore.getState()
      expect(state.dialogs.export).toBe(true)
      expect(state.dialogs.settings).toBe(false)
    })

    it('should open captureDetail dialog', () => {
      useUIStore.getState().setDialogOpen('captureDetail', true)

      const state = useUIStore.getState()
      expect(state.dialogs.captureDetail).toBe(true)
    })

    it('should handle multiple dialogs being open simultaneously', () => {
      useUIStore.getState().setDialogOpen('settings', true)
      useUIStore.getState().setDialogOpen('export', true)

      const state = useUIStore.getState()
      expect(state.dialogs.settings).toBe(true)
      expect(state.dialogs.export).toBe(true)
    })

    it('should close all dialogs at once', () => {
      useUIStore.setState({
        dialogs: {
          settings: true,
          export: true,
          captureDetail: true,
        },
      })

      useUIStore.getState().closeAllDialogs()

      const state = useUIStore.getState()
      expect(state.dialogs).toEqual(DEFAULT_DIALOG_STATE)
      expect(state.dialogs.settings).toBe(false)
      expect(state.dialogs.export).toBe(false)
      expect(state.dialogs.captureDetail).toBe(false)
    })
  })

  describe('Panel Management', () => {
    it('should collapse sidebar', () => {
      useUIStore.getState().setPanelCollapsed('sidebar', true)

      const state = useUIStore.getState()
      expect(state.panels.sidebar.isCollapsed).toBe(true)
    })

    it('should expand sidebar', () => {
      useUIStore.setState({
        panels: {
          ...DEFAULT_PANEL_STATE,
          sidebar: { ...DEFAULT_PANEL_STATE.sidebar, isCollapsed: true },
        },
      })

      useUIStore.getState().setPanelCollapsed('sidebar', false)

      const state = useUIStore.getState()
      expect(state.panels.sidebar.isCollapsed).toBe(false)
    })

    it('should collapse data panel', () => {
      useUIStore.getState().setPanelCollapsed('data', true)

      const state = useUIStore.getState()
      expect(state.panels.data.isCollapsed).toBe(true)
      expect(state.panels.isDataPanelCollapsed).toBe(true)
    })

    it('should expand data panel', () => {
      useUIStore.setState({
        panels: {
          ...DEFAULT_PANEL_STATE,
          data: { ...DEFAULT_PANEL_STATE.data, isCollapsed: true },
          isDataPanelCollapsed: true,
        },
      })

      useUIStore.getState().setPanelCollapsed('data', false)

      const state = useUIStore.getState()
      expect(state.panels.data.isCollapsed).toBe(false)
      expect(state.panels.isDataPanelCollapsed).toBe(false)
    })

    it('should resize sidebar panel', () => {
      useUIStore.getState().setPanelSize('sidebar', 30)

      const state = useUIStore.getState()
      expect(state.panels.sidebar.size).toBe(30)
    })

    it('should resize main panel', () => {
      useUIStore.getState().setPanelSize('main', 60)

      const state = useUIStore.getState()
      expect(state.panels.main.size).toBe(60)
    })

    it('should resize data panel', () => {
      useUIStore.getState().setPanelSize('data', 40)

      const state = useUIStore.getState()
      expect(state.panels.data.size).toBe(40)
    })

    it('should handle multiple panel resizes', () => {
      useUIStore.getState().setPanelSize('sidebar', 25)
      useUIStore.getState().setPanelSize('main', 55)
      useUIStore.getState().setPanelSize('data', 20)

      const state = useUIStore.getState()
      expect(state.panels.sidebar.size).toBe(25)
      expect(state.panels.main.size).toBe(55)
      expect(state.panels.data.size).toBe(20)
    })

    it('should reset panel layout to defaults', () => {
      // Modify panels
      useUIStore.setState({
        panels: {
          isDataPanelCollapsed: true,
          sidebar: { size: 30, isCollapsed: true },
          main: { size: 60 },
          data: { size: 10, isCollapsed: true },
        },
      })

      useUIStore.getState().resetPanelLayout()

      const state = useUIStore.getState()
      expect(state.panels).toEqual(DEFAULT_PANEL_STATE)
    })
  })

  describe('Theme Management', () => {
    it('should set theme to light', () => {
      useUIStore.getState().setTheme('light')

      const state = useUIStore.getState()
      expect(state.theme).toBe('light')
    })

    it('should set theme to dark', () => {
      useUIStore.getState().setTheme('dark')

      const state = useUIStore.getState()
      expect(state.theme).toBe('dark')
    })

    it('should set theme to system', () => {
      useUIStore.setState({ theme: 'dark' })

      useUIStore.getState().setTheme('system')

      const state = useUIStore.getState()
      expect(state.theme).toBe('system')
    })

    it('should switch between themes', () => {
      useUIStore.getState().setTheme('light')
      expect(useUIStore.getState().theme).toBe('light')

      useUIStore.getState().setTheme('dark')
      expect(useUIStore.getState().theme).toBe('dark')

      useUIStore.getState().setTheme('system')
      expect(useUIStore.getState().theme).toBe('system')
    })
  })

  describe('Layout Preferences', () => {
    it('should toggle compact mode', () => {
      useUIStore.getState().updateLayout({ compactMode: true })

      const state = useUIStore.getState()
      expect(state.layout.compactMode).toBe(true)
    })

    it('should toggle toolbar visibility', () => {
      useUIStore.getState().updateLayout({ showToolbar: false })

      const state = useUIStore.getState()
      expect(state.layout.showToolbar).toBe(false)
    })

    it('should change sidebar position to right', () => {
      useUIStore.getState().updateLayout({ sidebarPosition: 'right' })

      const state = useUIStore.getState()
      expect(state.layout.sidebarPosition).toBe('right')
    })

    it('should update multiple layout preferences at once', () => {
      useUIStore.getState().updateLayout({
        compactMode: true,
        showToolbar: false,
        sidebarPosition: 'right',
      })

      const state = useUIStore.getState()
      expect(state.layout.compactMode).toBe(true)
      expect(state.layout.showToolbar).toBe(false)
      expect(state.layout.sidebarPosition).toBe('right')
    })

    it('should preserve unmodified layout preferences', () => {
      useUIStore.getState().updateLayout({ compactMode: true })

      const state = useUIStore.getState()
      expect(state.layout.compactMode).toBe(true)
      expect(state.layout.showToolbar).toBe(true) // Should remain
      expect(state.layout.sidebarPosition).toBe('left') // Should remain
    })
  })

  describe('State Immutability', () => {
    it('should not mutate original dialog state', () => {
      const originalDialogs = useUIStore.getState().dialogs

      useUIStore.getState().setDialogOpen('settings', true)

      expect(originalDialogs.settings).toBe(false)
      expect(useUIStore.getState().dialogs.settings).toBe(true)
    })

    it('should not mutate original panel state', () => {
      const originalPanels = useUIStore.getState().panels

      useUIStore.getState().setPanelSize('sidebar', 30)

      expect(originalPanels.sidebar.size).toBe(20)
      expect(useUIStore.getState().panels.sidebar.size).toBe(30)
    })

    it('should not mutate original layout state', () => {
      const originalLayout = useUIStore.getState().layout

      useUIStore.getState().updateLayout({ compactMode: true })

      expect(originalLayout.compactMode).toBe(false)
      expect(useUIStore.getState().layout.compactMode).toBe(true)
    })
  })

  describe('Persistence', () => {
    it('should have persist middleware configured', () => {
      // Note: Testing actual localStorage persistence requires integration tests
      // Here we verify the store structure supports persistence
      const state = useUIStore.getState()

      expect(state.dialogs).toBeDefined()
      expect(state.panels).toBeDefined()
      expect(state.theme).toBeDefined()
      expect(state.layout).toBeDefined()
    })

    it('should maintain state consistency after multiple operations', () => {
      useUIStore.getState().setTheme('dark')
      useUIStore.getState().updateLayout({ compactMode: true })
      useUIStore.getState().setPanelSize('sidebar', 25)
      useUIStore.getState().resetPanelLayout()

      const state = useUIStore.getState()
      expect(state.theme).toBe('dark')
      expect(state.layout.compactMode).toBe(true)
      expect(state.panels).toEqual(DEFAULT_PANEL_STATE)
    })

    it('should preserve dialog states independently', () => {
      useUIStore.getState().setDialogOpen('settings', true)
      useUIStore.getState().setDialogOpen('export', true)
      useUIStore.getState().setDialogOpen('settings', false)

      const state = useUIStore.getState()
      expect(state.dialogs.settings).toBe(false)
      expect(state.dialogs.export).toBe(true)
      expect(state.dialogs.captureDetail).toBe(false)
    })
  })

  describe('Complex Scenarios', () => {
    it('should handle multiple UI state changes correctly', () => {
      useUIStore.getState().setTheme('dark')
      useUIStore.getState().setDialogOpen('settings', true)
      useUIStore.getState().setPanelCollapsed('sidebar', true)
      useUIStore.getState().updateLayout({ compactMode: true })

      const state = useUIStore.getState()
      expect(state.theme).toBe('dark')
      expect(state.dialogs.settings).toBe(true)
      expect(state.panels.sidebar.isCollapsed).toBe(true)
      expect(state.layout.compactMode).toBe(true)
    })

    it('should maintain panel sizes when collapsing and expanding', () => {
      useUIStore.getState().setPanelSize('sidebar', 25)
      useUIStore.getState().setPanelCollapsed('sidebar', true)
      useUIStore.getState().setPanelCollapsed('sidebar', false)

      const state = useUIStore.getState()
      expect(state.panels.sidebar.size).toBe(25)
      expect(state.panels.sidebar.isCollapsed).toBe(false)
    })

    it('should handle rapid dialog open/close operations', () => {
      useUIStore.getState().setDialogOpen('settings', true)
      useUIStore.getState().setDialogOpen('settings', false)
      useUIStore.getState().setDialogOpen('export', true)
      useUIStore.getState().closeAllDialogs()

      const state = useUIStore.getState()
      expect(state.dialogs).toEqual(DEFAULT_DIALOG_STATE)
    })
  })
})
