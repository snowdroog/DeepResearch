import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface DialogState {
  settings: boolean
  export: boolean
  captureDetail: boolean
}

export interface PanelState {
  isDataPanelCollapsed: boolean
  sidebar: {
    size: number
    isCollapsed: boolean
  }
  main: {
    size: number
  }
  data: {
    size: number
    isCollapsed: boolean
  }
}

interface UIStore {
  // Dialog states
  dialogs: DialogState
  setDialogOpen: (dialog: keyof DialogState, open: boolean) => void
  closeAllDialogs: () => void

  // Panel states
  panels: PanelState
  setPanelCollapsed: (panel: 'sidebar' | 'data', collapsed: boolean) => void
  setPanelSize: (panel: 'sidebar' | 'main' | 'data', size: number) => void
  resetPanelLayout: () => void

  // Theme and appearance
  theme: 'light' | 'dark' | 'system'
  setTheme: (theme: 'light' | 'dark' | 'system') => void

  // Layout preferences
  layout: {
    compactMode: boolean
    showToolbar: boolean
    sidebarPosition: 'left' | 'right'
  }
  updateLayout: (layout: Partial<UIStore['layout']>) => void
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

const DEFAULT_DIALOG_STATE: DialogState = {
  settings: false,
  export: false,
  captureDetail: false,
}

export const useUIStore = create<UIStore>()(
  persist(
    (set) => ({
      // Dialog state
      dialogs: DEFAULT_DIALOG_STATE,
      setDialogOpen: (dialog, open) =>
        set((state) => ({
          dialogs: {
            ...state.dialogs,
            [dialog]: open,
          },
        })),
      closeAllDialogs: () =>
        set({
          dialogs: DEFAULT_DIALOG_STATE,
        }),

      // Panel state
      panels: DEFAULT_PANEL_STATE,
      setPanelCollapsed: (panel, collapsed) =>
        set((state) => ({
          panels: {
            ...state.panels,
            [panel]: {
              ...state.panels[panel],
              isCollapsed: collapsed,
            },
            ...(panel === 'data' && { isDataPanelCollapsed: collapsed }),
          },
        })),
      setPanelSize: (panel, size) =>
        set((state) => ({
          panels: {
            ...state.panels,
            [panel]: {
              ...state.panels[panel],
              size,
            },
          },
        })),
      resetPanelLayout: () =>
        set({
          panels: DEFAULT_PANEL_STATE,
        }),

      // Theme
      theme: 'system',
      setTheme: (theme) => set({ theme }),

      // Layout preferences
      layout: {
        compactMode: false,
        showToolbar: true,
        sidebarPosition: 'left',
      },
      updateLayout: (newLayout) =>
        set((state) => ({
          layout: {
            ...state.layout,
            ...newLayout,
          },
        })),
    }),
    {
      name: 'deep-research-ui',
      version: 1,
    }
  )
)
