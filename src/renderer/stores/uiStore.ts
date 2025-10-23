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

export type GroupingMode = 'none' | 'session' | 'topic' | 'timeWindow' | 'messageType' | 'provider' | 'conversation'

export interface GroupingState {
  enabled: boolean
  mode: GroupingMode
  timeWindowMs: number
  collapsedGroupIds: Set<string>
}

export type ViewMode = 'list' | 'conversation'

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

  // Message grouping
  grouping: GroupingState
  setGroupingEnabled: (enabled: boolean) => void
  setGroupingMode: (mode: GroupingMode) => void
  setTimeWindow: (ms: number) => void
  toggleGroupCollapse: (groupId: string) => void
  collapseAllGroups: () => void
  expandAllGroups: () => void

  // View mode
  viewMode: ViewMode
  setViewMode: (mode: ViewMode) => void
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

const DEFAULT_GROUPING_STATE: GroupingState = {
  enabled: true,
  mode: 'conversation',
  timeWindowMs: 3600000, // 1 hour
  collapsedGroupIds: new Set<string>(),
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

      // Message grouping
      grouping: DEFAULT_GROUPING_STATE,
      setGroupingEnabled: (enabled) =>
        set((state) => ({
          grouping: {
            ...state.grouping,
            enabled,
          },
        })),
      setGroupingMode: (mode) =>
        set((state) => ({
          grouping: {
            ...state.grouping,
            mode,
          },
        })),
      setTimeWindow: (ms) =>
        set((state) => ({
          grouping: {
            ...state.grouping,
            timeWindowMs: ms,
          },
        })),
      toggleGroupCollapse: (groupId) =>
        set((state) => {
          const newCollapsedIds = new Set(state.grouping.collapsedGroupIds)
          if (newCollapsedIds.has(groupId)) {
            newCollapsedIds.delete(groupId)
          } else {
            newCollapsedIds.add(groupId)
          }
          return {
            grouping: {
              ...state.grouping,
              collapsedGroupIds: newCollapsedIds,
            },
          }
        }),
      collapseAllGroups: () =>
        set((state) => ({
          grouping: {
            ...state.grouping,
            collapsedGroupIds: new Set<string>(),
          },
        })),
      expandAllGroups: () =>
        set((state) => ({
          grouping: {
            ...state.grouping,
            collapsedGroupIds: new Set<string>(),
          },
        })),

      // View mode
      viewMode: 'list',
      setViewMode: (mode) => set({ viewMode: mode }),
    }),
    {
      name: 'deep-research-ui',
      version: 1,
      storage: {
        getItem: (name) => {
          const str = localStorage.getItem(name)
          if (!str) return null
          const { state } = JSON.parse(str)
          // Deserialize Set from array
          if (state.grouping?.collapsedGroupIds) {
            state.grouping.collapsedGroupIds = new Set(state.grouping.collapsedGroupIds)
          }
          return { state }
        },
        setItem: (name, value) => {
          const { state } = value
          // Serialize Set to array for storage
          const stateToStore = {
            ...state,
            grouping: state.grouping
              ? {
                  ...state.grouping,
                  collapsedGroupIds: Array.from(state.grouping.collapsedGroupIds),
                }
              : DEFAULT_GROUPING_STATE,
          }
          localStorage.setItem(name, JSON.stringify({ state: stateToStore }))
        },
        removeItem: (name) => localStorage.removeItem(name),
      },
    }
  )
)
