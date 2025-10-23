import { create } from 'zustand'

export interface Capture {
  id: string
  session_id: string
  provider: string
  prompt: string
  response: string
  response_format?: string
  model?: string
  timestamp: number
  token_count?: number
  tags?: string
  notes?: string
  is_archived: number
}

export interface CapturesFilters extends Record<string, unknown> {
  provider?: string
  startDate?: number
  endDate?: number
  isArchived?: boolean
}

interface CapturesStore {
  captures: Capture[]
  loading: boolean
  error: string | null
  selectedIds: string[]

  // Actions
  fetchCaptures: (filters?: CapturesFilters) => Promise<void>
  searchCaptures: (query: string, filters?: CapturesFilters) => Promise<void>
  updateTags: (captureId: string, tags: string[]) => Promise<void>
  updateNotes: (captureId: string, notes: string) => Promise<void>
  setArchived: (captureId: string, isArchived: boolean) => Promise<void>
  deleteCapture: (captureId: string) => Promise<void>
  setSelectedIds: (ids: string[]) => void
  clearSelection: () => void
  setupAutoRefresh: () => (() => void)
}

export const useCapturesStore = create<CapturesStore>((set, get) => ({
  captures: [],
  loading: false,
  error: null,
  selectedIds: [],

  fetchCaptures: async (filters?: CapturesFilters) => {
    set({ loading: true, error: null })
    try {
      const result = await window.electronAPI.data.getCaptures(filters)
      if (result.success) {
        set({ captures: result.captures, loading: false })
      } else {
        set({ error: result.error || 'Failed to fetch captures', loading: false })
      }
    } catch (error) {
      set({ error: (error as Error).message, loading: false })
    }
  },

  searchCaptures: async (query: string, filters?: CapturesFilters) => {
    set({ loading: true, error: null })
    try {
      const result = await window.electronAPI.data.searchCaptures(query, filters)
      if (result.success) {
        set({ captures: result.captures, loading: false })
      } else {
        set({ error: result.error || 'Failed to search captures', loading: false })
      }
    } catch (error) {
      set({ error: (error as Error).message, loading: false })
    }
  },

  updateTags: async (captureId: string, tags: string[]) => {
    try {
      const result = await window.electronAPI.data.updateTags(captureId, tags)
      if (result.success) {
        // Update local state
        const captures = get().captures.map(c =>
          c.id === captureId ? { ...c, tags: JSON.stringify(tags) } : c
        )
        set({ captures })
      } else {
        set({ error: result.error || 'Failed to update tags' })
      }
    } catch (error) {
      set({ error: (error as Error).message })
    }
  },

  updateNotes: async (captureId: string, notes: string) => {
    try {
      const result = await window.electronAPI.data.updateNotes(captureId, notes)
      if (result.success) {
        // Update local state
        const captures = get().captures.map(c =>
          c.id === captureId ? { ...c, notes } : c
        )
        set({ captures })
      } else {
        set({ error: result.error || 'Failed to update notes' })
      }
    } catch (error) {
      set({ error: (error as Error).message })
    }
  },

  setArchived: async (captureId: string, isArchived: boolean) => {
    try {
      const result = await window.electronAPI.data.setArchived(captureId, isArchived)
      if (result.success) {
        // Update local state
        const captures = get().captures.map(c =>
          c.id === captureId ? { ...c, is_archived: isArchived ? 1 : 0 } : c
        )
        set({ captures })
      } else {
        set({ error: result.error || 'Failed to archive capture' })
      }
    } catch (error) {
      set({ error: (error as Error).message })
    }
  },

  deleteCapture: async (captureId: string) => {
    try {
      const result = await window.electronAPI.data.deleteCapture(captureId)
      if (result.success) {
        // Remove from local state
        const captures = get().captures.filter(c => c.id !== captureId)
        set({ captures })
      } else {
        set({ error: result.error || 'Failed to delete capture' })
      }
    } catch (error) {
      set({ error: (error as Error).message })
    }
  },

  setSelectedIds: (ids: string[]) => set({ selectedIds: ids }),

  clearSelection: () => set({ selectedIds: [] }),

  setupAutoRefresh: () => {
    // Set up listener for new captures
    const unsubscribe = window.electronAPI.data.onCapture((data) => {
      console.log('[CapturesStore] New capture detected:', data.captureId);

      // Refresh the captures list to include the new capture
      get().fetchCaptures();
    });

    return unsubscribe;
  },
}))
