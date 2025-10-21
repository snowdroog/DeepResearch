/**
 * Unit tests for capturesStore (Zustand)
 * Tests for capture management, IPC communication, and state mutations
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { useCapturesStore } from '../capturesStore'
import type { Capture, CapturesFilters } from '../capturesStore'

// Mock window.electronAPI
const mockElectronAPI = {
  data: {
    getCaptures: vi.fn(),
    searchCaptures: vi.fn(),
    updateTags: vi.fn(),
    updateNotes: vi.fn(),
    setArchived: vi.fn(),
    deleteCapture: vi.fn(),
  },
}

// Setup global mock
beforeEach(() => {
  // @ts-ignore - Mocking global
  global.window = { electronAPI: mockElectronAPI }

  // Reset store state
  useCapturesStore.setState({
    captures: [],
    loading: false,
    error: null,
    selectedIds: [],
  })

  // Clear all mocks
  vi.clearAllMocks()
})

afterEach(() => {
  vi.restoreAllMocks()
})

// Helper to create mock captures
function createMockCapture(overrides: Partial<Capture> = {}): Capture {
  return {
    id: `capture-${Date.now()}-${Math.random()}`,
    session_id: 'session-123',
    provider: 'claude',
    prompt: 'Test prompt',
    response: 'Test response',
    timestamp: Date.now(),
    is_archived: 0,
    ...overrides,
  }
}

describe('capturesStore', () => {
  describe('State Initialization', () => {
    it('should initialize with empty state', () => {
      const state = useCapturesStore.getState()

      expect(state.captures).toEqual([])
      expect(state.loading).toBe(false)
      expect(state.error).toBe(null)
      expect(state.selectedIds).toEqual([])
    })

    it('should have all required action functions', () => {
      const state = useCapturesStore.getState()

      expect(typeof state.fetchCaptures).toBe('function')
      expect(typeof state.searchCaptures).toBe('function')
      expect(typeof state.updateTags).toBe('function')
      expect(typeof state.updateNotes).toBe('function')
      expect(typeof state.setArchived).toBe('function')
      expect(typeof state.deleteCapture).toBe('function')
      expect(typeof state.setSelectedIds).toBe('function')
      expect(typeof state.clearSelection).toBe('function')
    })
  })

  describe('fetchCaptures', () => {
    it('should fetch captures successfully', async () => {
      const mockCaptures = [
        createMockCapture({ id: '1', provider: 'claude' }),
        createMockCapture({ id: '2', provider: 'chatgpt' }),
      ]

      mockElectronAPI.data.getCaptures.mockResolvedValue({
        success: true,
        captures: mockCaptures,
      })

      await useCapturesStore.getState().fetchCaptures()

      const state = useCapturesStore.getState()
      expect(state.captures).toEqual(mockCaptures)
      expect(state.loading).toBe(false)
      expect(state.error).toBe(null)
      expect(mockElectronAPI.data.getCaptures).toHaveBeenCalledTimes(1)
    })

    it('should set loading state during fetch', async () => {
      mockElectronAPI.data.getCaptures.mockImplementation(() =>
        new Promise(resolve => setTimeout(() => resolve({ success: true, captures: [] }), 100))
      )

      const promise = useCapturesStore.getState().fetchCaptures()

      // Check loading state immediately
      expect(useCapturesStore.getState().loading).toBe(true)

      await promise

      expect(useCapturesStore.getState().loading).toBe(false)
    })

    it('should fetch captures with filters', async () => {
      const filters: CapturesFilters = {
        provider: 'claude',
        startDate: Date.now() - 86400000,
        endDate: Date.now(),
        isArchived: false,
      }

      mockElectronAPI.data.getCaptures.mockResolvedValue({
        success: true,
        captures: [],
      })

      await useCapturesStore.getState().fetchCaptures(filters)

      expect(mockElectronAPI.data.getCaptures).toHaveBeenCalledWith(filters)
    })

    it('should handle fetch error from API', async () => {
      mockElectronAPI.data.getCaptures.mockResolvedValue({
        success: false,
        error: 'Database connection failed',
      })

      await useCapturesStore.getState().fetchCaptures()

      const state = useCapturesStore.getState()
      expect(state.error).toBe('Database connection failed')
      expect(state.loading).toBe(false)
    })

    it('should handle fetch exception', async () => {
      mockElectronAPI.data.getCaptures.mockRejectedValue(
        new Error('Network error')
      )

      await useCapturesStore.getState().fetchCaptures()

      const state = useCapturesStore.getState()
      expect(state.error).toBe('Network error')
      expect(state.loading).toBe(false)
    })
  })

  describe('searchCaptures', () => {
    it('should search captures successfully', async () => {
      const mockCaptures = [
        createMockCapture({ id: '1', prompt: 'React hooks' }),
      ]

      mockElectronAPI.data.searchCaptures.mockResolvedValue({
        success: true,
        captures: mockCaptures,
      })

      await useCapturesStore.getState().searchCaptures('React')

      const state = useCapturesStore.getState()
      expect(state.captures).toEqual(mockCaptures)
      expect(mockElectronAPI.data.searchCaptures).toHaveBeenCalledWith('React', undefined)
    })

    it('should search with query and filters', async () => {
      const filters: CapturesFilters = { provider: 'claude' }

      mockElectronAPI.data.searchCaptures.mockResolvedValue({
        success: true,
        captures: [],
      })

      await useCapturesStore.getState().searchCaptures('test query', filters)

      expect(mockElectronAPI.data.searchCaptures).toHaveBeenCalledWith('test query', filters)
    })

    it('should handle search error', async () => {
      mockElectronAPI.data.searchCaptures.mockResolvedValue({
        success: false,
        error: 'Search failed',
      })

      await useCapturesStore.getState().searchCaptures('test')

      expect(useCapturesStore.getState().error).toBe('Search failed')
    })
  })

  describe('updateTags', () => {
    it('should update tags successfully', async () => {
      const capture = createMockCapture({ id: 'cap-1', tags: '[]' })
      useCapturesStore.setState({ captures: [capture] })

      mockElectronAPI.data.updateTags.mockResolvedValue({
        success: true,
      })

      const newTags = ['typescript', 'react']
      await useCapturesStore.getState().updateTags('cap-1', newTags)

      const state = useCapturesStore.getState()
      expect(state.captures[0].tags).toBe(JSON.stringify(newTags))
      expect(mockElectronAPI.data.updateTags).toHaveBeenCalledWith('cap-1', newTags)
    })

    it('should handle update tags error', async () => {
      const capture = createMockCapture({ id: 'cap-1' })
      useCapturesStore.setState({ captures: [capture] })

      mockElectronAPI.data.updateTags.mockResolvedValue({
        success: false,
        error: 'Update failed',
      })

      await useCapturesStore.getState().updateTags('cap-1', ['test'])

      expect(useCapturesStore.getState().error).toBe('Update failed')
    })

    it('should not modify other captures when updating tags', async () => {
      const capture1 = createMockCapture({ id: 'cap-1', tags: '[]' })
      const capture2 = createMockCapture({ id: 'cap-2', tags: '["other"]' })
      useCapturesStore.setState({ captures: [capture1, capture2] })

      mockElectronAPI.data.updateTags.mockResolvedValue({ success: true })

      await useCapturesStore.getState().updateTags('cap-1', ['new'])

      const state = useCapturesStore.getState()
      expect(state.captures[0].tags).toBe(JSON.stringify(['new']))
      expect(state.captures[1].tags).toBe('["other"]')
    })
  })

  describe('updateNotes', () => {
    it('should update notes successfully', async () => {
      const capture = createMockCapture({ id: 'cap-1', notes: 'old notes' })
      useCapturesStore.setState({ captures: [capture] })

      mockElectronAPI.data.updateNotes.mockResolvedValue({ success: true })

      await useCapturesStore.getState().updateNotes('cap-1', 'new notes')

      const state = useCapturesStore.getState()
      expect(state.captures[0].notes).toBe('new notes')
      expect(mockElectronAPI.data.updateNotes).toHaveBeenCalledWith('cap-1', 'new notes')
    })

    it('should handle update notes error', async () => {
      mockElectronAPI.data.updateNotes.mockResolvedValue({
        success: false,
        error: 'Failed to update notes',
      })

      await useCapturesStore.getState().updateNotes('cap-1', 'notes')

      expect(useCapturesStore.getState().error).toBe('Failed to update notes')
    })
  })

  describe('setArchived', () => {
    it('should archive a capture', async () => {
      const capture = createMockCapture({ id: 'cap-1', is_archived: 0 })
      useCapturesStore.setState({ captures: [capture] })

      mockElectronAPI.data.setArchived.mockResolvedValue({ success: true })

      await useCapturesStore.getState().setArchived('cap-1', true)

      const state = useCapturesStore.getState()
      expect(state.captures[0].is_archived).toBe(1)
      expect(mockElectronAPI.data.setArchived).toHaveBeenCalledWith('cap-1', true)
    })

    it('should unarchive a capture', async () => {
      const capture = createMockCapture({ id: 'cap-1', is_archived: 1 })
      useCapturesStore.setState({ captures: [capture] })

      mockElectronAPI.data.setArchived.mockResolvedValue({ success: true })

      await useCapturesStore.getState().setArchived('cap-1', false)

      const state = useCapturesStore.getState()
      expect(state.captures[0].is_archived).toBe(0)
    })

    it('should handle archive error', async () => {
      mockElectronAPI.data.setArchived.mockResolvedValue({
        success: false,
        error: 'Failed to archive capture',
      })

      await useCapturesStore.getState().setArchived('cap-1', true)

      expect(useCapturesStore.getState().error).toBe('Failed to archive capture')
    })
  })

  describe('deleteCapture', () => {
    it('should delete a capture successfully', async () => {
      const capture1 = createMockCapture({ id: 'cap-1' })
      const capture2 = createMockCapture({ id: 'cap-2' })
      useCapturesStore.setState({ captures: [capture1, capture2] })

      mockElectronAPI.data.deleteCapture.mockResolvedValue({ success: true })

      await useCapturesStore.getState().deleteCapture('cap-1')

      const state = useCapturesStore.getState()
      expect(state.captures).toHaveLength(1)
      expect(state.captures[0].id).toBe('cap-2')
      expect(mockElectronAPI.data.deleteCapture).toHaveBeenCalledWith('cap-1')
    })

    it('should handle delete error', async () => {
      mockElectronAPI.data.deleteCapture.mockResolvedValue({
        success: false,
        error: 'Failed to delete capture',
      })

      await useCapturesStore.getState().deleteCapture('cap-1')

      expect(useCapturesStore.getState().error).toBe('Failed to delete capture')
    })

    it('should handle delete exception', async () => {
      mockElectronAPI.data.deleteCapture.mockRejectedValue(
        new Error('Database error')
      )

      await useCapturesStore.getState().deleteCapture('cap-1')

      expect(useCapturesStore.getState().error).toBe('Database error')
    })
  })

  describe('Selection Management', () => {
    it('should set selected IDs', () => {
      useCapturesStore.getState().setSelectedIds(['cap-1', 'cap-2'])

      expect(useCapturesStore.getState().selectedIds).toEqual(['cap-1', 'cap-2'])
    })

    it('should clear selection', () => {
      useCapturesStore.setState({ selectedIds: ['cap-1', 'cap-2'] })

      useCapturesStore.getState().clearSelection()

      expect(useCapturesStore.getState().selectedIds).toEqual([])
    })

    it('should replace previous selection when setting new IDs', () => {
      useCapturesStore.setState({ selectedIds: ['cap-1'] })

      useCapturesStore.getState().setSelectedIds(['cap-2', 'cap-3'])

      expect(useCapturesStore.getState().selectedIds).toEqual(['cap-2', 'cap-3'])
    })
  })

  describe('State Immutability', () => {
    it('should not mutate state directly when updating captures', async () => {
      const originalCapture = createMockCapture({ id: 'cap-1', notes: 'original' })
      const captures = [originalCapture]
      useCapturesStore.setState({ captures })

      mockElectronAPI.data.updateNotes.mockResolvedValue({ success: true })

      await useCapturesStore.getState().updateNotes('cap-1', 'updated')

      // Original object should not be mutated
      expect(originalCapture.notes).toBe('original')
      // State should have new object
      expect(useCapturesStore.getState().captures[0].notes).toBe('updated')
    })

    it('should create new array when deleting capture', async () => {
      const captures = [createMockCapture({ id: 'cap-1' })]
      useCapturesStore.setState({ captures })

      mockElectronAPI.data.deleteCapture.mockResolvedValue({ success: true })

      const originalArray = useCapturesStore.getState().captures
      await useCapturesStore.getState().deleteCapture('cap-1')

      // Should be a new array reference
      expect(useCapturesStore.getState().captures).not.toBe(originalArray)
    })
  })

  describe('Error Handling', () => {
    it('should clear previous errors on new fetch', async () => {
      useCapturesStore.setState({ error: 'Previous error' })

      mockElectronAPI.data.getCaptures.mockResolvedValue({
        success: true,
        captures: [],
      })

      await useCapturesStore.getState().fetchCaptures()

      expect(useCapturesStore.getState().error).toBe(null)
    })

    it('should preserve captures on error', async () => {
      const mockCaptures = [createMockCapture()]
      useCapturesStore.setState({ captures: mockCaptures })

      mockElectronAPI.data.searchCaptures.mockRejectedValue(
        new Error('Search error')
      )

      await useCapturesStore.getState().searchCaptures('test')

      // Captures should still be there
      expect(useCapturesStore.getState().captures).toEqual(mockCaptures)
      expect(useCapturesStore.getState().error).toBe('Search error')
    })
  })
})
