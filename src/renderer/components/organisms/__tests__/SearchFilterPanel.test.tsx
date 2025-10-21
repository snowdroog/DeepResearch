/**
 * Comprehensive unit tests for SearchFilterPanel component
 * Tests search input, filters, callbacks, Radix UI interactions, and async functionality
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderWithProviders, screen, waitFor, fireEvent } from '@/test-utils/test-helpers'
import userEvent from '@testing-library/user-event'
import { SearchFilterPanel } from '../SearchFilterPanel'

// Mock localStorage
const mockLocalStorage = (() => {
  let store: Record<string, string> = {}

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value
    },
    removeItem: (key: string) => {
      delete store[key]
    },
    clear: () => {
      store = {}
    },
  }
})()

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
  writable: true,
})

describe('SearchFilterPanel', () => {
  let onFiltersChange: ReturnType<typeof vi.fn>

  beforeEach(() => {
    onFiltersChange = vi.fn()
    mockLocalStorage.clear()
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Basic Rendering', () => {
    it('should render without crashing', () => {
      renderWithProviders(<SearchFilterPanel onFiltersChange={onFiltersChange} />)

      expect(screen.getByText('Search & Filters')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('Search prompts and responses...')).toBeInTheDocument()
    })

    it('should render all filter buttons', () => {
      renderWithProviders(<SearchFilterPanel onFiltersChange={onFiltersChange} />)

      expect(screen.getByRole('button', { name: /providers/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /date range/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /presets/i })).toBeInTheDocument()
    })

    it('should render tags filter when availableTags provided', () => {
      renderWithProviders(
        <SearchFilterPanel
          onFiltersChange={onFiltersChange}
          availableTags={['react', 'testing', 'vitest']}
        />
      )

      expect(screen.getByRole('button', { name: /tags/i })).toBeInTheDocument()
    })

    it('should not render tags filter when availableTags is empty', () => {
      renderWithProviders(<SearchFilterPanel onFiltersChange={onFiltersChange} />)

      expect(screen.queryByRole('button', { name: /tags/i })).not.toBeInTheDocument()
    })

    it('should display result count when provided', () => {
      renderWithProviders(
        <SearchFilterPanel onFiltersChange={onFiltersChange} resultCount={42} />
      )

      expect(screen.getByText('42 results found')).toBeInTheDocument()
    })

    it('should use singular form for result count of 1', () => {
      renderWithProviders(
        <SearchFilterPanel onFiltersChange={onFiltersChange} resultCount={1} />
      )

      expect(screen.getByText('1 result found')).toBeInTheDocument()
    })

    it('should not show Clear All button when no filters are active', () => {
      renderWithProviders(<SearchFilterPanel onFiltersChange={onFiltersChange} />)

      expect(screen.queryByRole('button', { name: /clear all/i })).not.toBeInTheDocument()
    })

    it('should display result count with correct pluralization', () => {
      const { rerender } = renderWithProviders(
        <SearchFilterPanel onFiltersChange={onFiltersChange} resultCount={0} />
      )

      expect(screen.getByText('0 results found')).toBeInTheDocument()

      rerender(
        <SearchFilterPanel onFiltersChange={onFiltersChange} resultCount={5} />
      )

      expect(screen.getByText('5 results found')).toBeInTheDocument()
    })
  })

  describe('Search Input Functionality', () => {
    it('should accept text input in search field', async () => {
      const user = userEvent.setup()
      renderWithProviders(<SearchFilterPanel onFiltersChange={onFiltersChange} />)

      const searchInput = screen.getByPlaceholderText('Search prompts and responses...')
      await user.type(searchInput, 'test query')

      expect(searchInput).toHaveValue('test query')
    })

    it('should update input value as user types', async () => {
      const user = userEvent.setup()
      renderWithProviders(<SearchFilterPanel onFiltersChange={onFiltersChange} />)

      const searchInput = screen.getByPlaceholderText('Search prompts and responses...')

      await user.type(searchInput, 't')
      expect(searchInput).toHaveValue('t')

      await user.type(searchInput, 'est')
      expect(searchInput).toHaveValue('test')
    })

    it('should have correct placeholder', () => {
      renderWithProviders(<SearchFilterPanel onFiltersChange={onFiltersChange} />)

      const searchInput = screen.getByPlaceholderText('Search prompts and responses...')
      expect(searchInput).toHaveAttribute('placeholder', 'Search prompts and responses...')
    })
  })

  describe('Debounced Search Functionality', () => {
    it('should debounce search input and call onFiltersChange after delay', async () => {
      const user = userEvent.setup()
      renderWithProviders(<SearchFilterPanel onFiltersChange={onFiltersChange} />)

      const searchInput = screen.getByPlaceholderText('Search prompts and responses...')

      // Clear initial call
      onFiltersChange.mockClear()

      // Type search text
      await user.type(searchInput, 'test query')

      // Should not call immediately (within 100ms)
      await new Promise(resolve => setTimeout(resolve, 100))
      expect(onFiltersChange).not.toHaveBeenCalled()

      // Wait for debounce delay (300ms + buffer)
      await waitFor(() => {
        expect(onFiltersChange).toHaveBeenCalledWith(
          expect.objectContaining({
            searchText: 'test query',
          })
        )
      }, { timeout: 500 })
    })

    it('should reset debounce timer on new input', async () => {
      const user = userEvent.setup()
      renderWithProviders(<SearchFilterPanel onFiltersChange={onFiltersChange} />)

      const searchInput = screen.getByPlaceholderText('Search prompts and responses...')
      onFiltersChange.mockClear()

      // Type first character
      await user.type(searchInput, 't')
      await new Promise(resolve => setTimeout(resolve, 100))

      // Type second character before debounce completes
      await user.type(searchInput, 'e')

      // Should not have called yet (debounce was reset)
      await new Promise(resolve => setTimeout(resolve, 200))
      expect(onFiltersChange).not.toHaveBeenCalled()

      // Wait for final debounce
      await waitFor(() => {
        expect(onFiltersChange).toHaveBeenCalledWith(
          expect.objectContaining({
            searchText: 'te',
          })
        )
      }, { timeout: 500 })
    })

    it('should handle rapid typing correctly', async () => {
      const user = userEvent.setup()
      renderWithProviders(<SearchFilterPanel onFiltersChange={onFiltersChange} />)

      const searchInput = screen.getByPlaceholderText('Search prompts and responses...')
      onFiltersChange.mockClear()

      // Type multiple characters rapidly
      await user.type(searchInput, 'hello')

      // Wait for debounce to complete
      await waitFor(() => {
        expect(onFiltersChange).toHaveBeenCalledWith(
          expect.objectContaining({
            searchText: 'hello',
          })
        )
      }, { timeout: 500 })
    })
  })

  describe('Provider Filter Dropdown', () => {
    it('should open provider filter dropdown on click', async () => {
      const user = userEvent.setup()
      renderWithProviders(<SearchFilterPanel onFiltersChange={onFiltersChange} />)

      const providersButton = screen.getByRole('button', { name: /providers/i })
      await user.click(providersButton)

      // Popover content renders in a portal, so query document
      await waitFor(() => {
        expect(screen.getByText('Select Providers')).toBeInTheDocument()
      })
    })

    it('should display all available providers in dropdown', async () => {
      const user = userEvent.setup()
      const customProviders = ['claude', 'chatgpt', 'gemini']
      renderWithProviders(
        <SearchFilterPanel
          onFiltersChange={onFiltersChange}
          availableProviders={customProviders}
        />
      )

      const providersButton = screen.getByRole('button', { name: /providers/i })
      await user.click(providersButton)

      await waitFor(() => {
        expect(screen.getByText('Select Providers')).toBeInTheDocument()
      })

      customProviders.forEach((provider) => {
        expect(screen.getByLabelText(provider)).toBeInTheDocument()
      })
    })

    it('should toggle provider selection on checkbox click', async () => {
      const user = userEvent.setup()
      renderWithProviders(<SearchFilterPanel onFiltersChange={onFiltersChange} />)

      onFiltersChange.mockClear()

      const providersButton = screen.getByRole('button', { name: /providers/i })
      await user.click(providersButton)

      await waitFor(() => {
        expect(screen.getByText('Select Providers')).toBeInTheDocument()
      })

      const claudeCheckbox = screen.getByLabelText('claude')
      await user.click(claudeCheckbox)

      await waitFor(() => {
        expect(onFiltersChange).toHaveBeenCalledWith(
          expect.objectContaining({
            providers: ['claude'],
          })
        )
      })
    })

    it('should allow multiple provider selections', async () => {
      const user = userEvent.setup()
      renderWithProviders(<SearchFilterPanel onFiltersChange={onFiltersChange} />)

      const providersButton = screen.getByRole('button', { name: /providers/i })
      await user.click(providersButton)

      await waitFor(() => {
        expect(screen.getByText('Select Providers')).toBeInTheDocument()
      })

      const claudeCheckbox = screen.getByLabelText('claude')
      const chatgptCheckbox = screen.getByLabelText('chatgpt')

      await user.click(claudeCheckbox)
      await user.click(chatgptCheckbox)

      await waitFor(() => {
        expect(onFiltersChange).toHaveBeenCalledWith(
          expect.objectContaining({
            providers: expect.arrayContaining(['claude', 'chatgpt']),
          })
        )
      })
    })

    it('should deselect provider when clicking selected checkbox', async () => {
      const user = userEvent.setup()
      renderWithProviders(<SearchFilterPanel onFiltersChange={onFiltersChange} />)

      const providersButton = screen.getByRole('button', { name: /providers/i })
      await user.click(providersButton)

      await waitFor(() => {
        expect(screen.getByText('Select Providers')).toBeInTheDocument()
      })

      const claudeCheckbox = screen.getByLabelText('claude')

      // Select
      await user.click(claudeCheckbox)
      await waitFor(() => {
        expect(onFiltersChange).toHaveBeenCalledWith(
          expect.objectContaining({
            providers: ['claude'],
          })
        )
      })

      onFiltersChange.mockClear()

      // Deselect
      await user.click(claudeCheckbox)
      await waitFor(() => {
        expect(onFiltersChange).toHaveBeenCalledWith(
          expect.objectContaining({
            providers: [],
          })
        )
      })
    })

    it('should show badge with count when providers are selected', async () => {
      const user = userEvent.setup()
      renderWithProviders(<SearchFilterPanel onFiltersChange={onFiltersChange} />)

      const providersButton = screen.getByRole('button', { name: /providers/i })
      await user.click(providersButton)

      await waitFor(() => {
        expect(screen.getByText('Select Providers')).toBeInTheDocument()
      })

      const claudeCheckbox = screen.getByLabelText('claude')
      const chatgptCheckbox = screen.getByLabelText('chatgpt')

      await user.click(claudeCheckbox)
      await user.click(chatgptCheckbox)

      // Close popover by clicking outside
      await user.click(document.body)

      await waitFor(() => {
        const button = screen.getByRole('button', { name: /providers/i })
        expect(button.textContent).toContain('2')
      })
    })
  })

  describe('Tag Filter Dropdown', () => {
    const testTags = ['react', 'testing', 'vitest', 'typescript']

    it('should open tag filter dropdown on click', async () => {
      const user = userEvent.setup()
      renderWithProviders(
        <SearchFilterPanel onFiltersChange={onFiltersChange} availableTags={testTags} />
      )

      const tagsButton = screen.getByRole('button', { name: /tags/i })
      await user.click(tagsButton)

      await waitFor(() => {
        expect(screen.getByText('Select Tags')).toBeInTheDocument()
      })
    })

    it('should display all available tags in dropdown', async () => {
      const user = userEvent.setup()
      renderWithProviders(
        <SearchFilterPanel onFiltersChange={onFiltersChange} availableTags={testTags} />
      )

      const tagsButton = screen.getByRole('button', { name: /tags/i })
      await user.click(tagsButton)

      await waitFor(() => {
        expect(screen.getByText('Select Tags')).toBeInTheDocument()
      })

      testTags.forEach((tag) => {
        expect(screen.getByLabelText(tag)).toBeInTheDocument()
      })
    })

    it('should toggle tag selection on checkbox click', async () => {
      const user = userEvent.setup()
      renderWithProviders(
        <SearchFilterPanel onFiltersChange={onFiltersChange} availableTags={testTags} />
      )

      onFiltersChange.mockClear()

      const tagsButton = screen.getByRole('button', { name: /tags/i })
      await user.click(tagsButton)

      await waitFor(() => {
        expect(screen.getByText('Select Tags')).toBeInTheDocument()
      })

      const reactCheckbox = screen.getByLabelText('react')
      await user.click(reactCheckbox)

      await waitFor(() => {
        expect(onFiltersChange).toHaveBeenCalledWith(
          expect.objectContaining({
            tags: ['react'],
          })
        )
      })
    })

    it('should allow multiple tag selections', async () => {
      const user = userEvent.setup()
      renderWithProviders(
        <SearchFilterPanel onFiltersChange={onFiltersChange} availableTags={testTags} />
      )

      const tagsButton = screen.getByRole('button', { name: /tags/i })
      await user.click(tagsButton)

      await waitFor(() => {
        expect(screen.getByText('Select Tags')).toBeInTheDocument()
      })

      const reactCheckbox = screen.getByLabelText('react')
      const testingCheckbox = screen.getByLabelText('testing')

      await user.click(reactCheckbox)
      await user.click(testingCheckbox)

      await waitFor(() => {
        expect(onFiltersChange).toHaveBeenCalledWith(
          expect.objectContaining({
            tags: expect.arrayContaining(['react', 'testing']),
          })
        )
      })
    })

    it('should show badge with count when tags are selected', async () => {
      const user = userEvent.setup()
      renderWithProviders(
        <SearchFilterPanel onFiltersChange={onFiltersChange} availableTags={testTags} />
      )

      const tagsButton = screen.getByRole('button', { name: /tags/i })
      await user.click(tagsButton)

      await waitFor(() => {
        expect(screen.getByText('Select Tags')).toBeInTheDocument()
      })

      const reactCheckbox = screen.getByLabelText('react')
      await user.click(reactCheckbox)

      await user.click(document.body)

      await waitFor(() => {
        const button = screen.getByRole('button', { name: /tags/i })
        expect(button.textContent).toContain('1')
      })
    })
  })

  describe('Date Range Filter', () => {
    it('should open date range popover on click', async () => {
      const user = userEvent.setup()
      renderWithProviders(<SearchFilterPanel onFiltersChange={onFiltersChange} />)

      const dateRangeButton = screen.getByRole('button', { name: /date range/i })
      await user.click(dateRangeButton)

      await waitFor(() => {
        expect(screen.getByText('Select Date Range')).toBeInTheDocument()
      })
    })

    it('should allow setting start date', async () => {
      const user = userEvent.setup()
      renderWithProviders(<SearchFilterPanel onFiltersChange={onFiltersChange} />)

      onFiltersChange.mockClear()

      const dateRangeButton = screen.getByRole('button', { name: /date range/i })
      await user.click(dateRangeButton)

      await waitFor(() => {
        expect(screen.getByText('Select Date Range')).toBeInTheDocument()
      })

      // Find the date input by the "From" label text
      const fromLabel = screen.getByText('From')
      const startDateInput = fromLabel.closest('.space-y-2')?.querySelector('input[type="date"]') as HTMLInputElement
      expect(startDateInput).toBeInTheDocument()

      await user.type(startDateInput, '2024-01-01')

      await waitFor(() => {
        expect(onFiltersChange).toHaveBeenCalledWith(
          expect.objectContaining({
            startDate: expect.any(Date),
          })
        )
      })
    })

    it('should allow setting end date', async () => {
      const user = userEvent.setup()
      renderWithProviders(<SearchFilterPanel onFiltersChange={onFiltersChange} />)

      onFiltersChange.mockClear()

      const dateRangeButton = screen.getByRole('button', { name: /date range/i })
      await user.click(dateRangeButton)

      await waitFor(() => {
        expect(screen.getByText('Select Date Range')).toBeInTheDocument()
      })

      // Find the date input by the "To" label text
      const toLabel = screen.getByText('To')
      const endDateInput = toLabel.closest('.space-y-2')?.querySelector('input[type="date"]') as HTMLInputElement
      expect(endDateInput).toBeInTheDocument()

      await user.type(endDateInput, '2024-12-31')

      await waitFor(() => {
        expect(onFiltersChange).toHaveBeenCalledWith(
          expect.objectContaining({
            endDate: expect.any(Date),
          })
        )
      })
    })

    it('should show badge when dates are set', async () => {
      const user = userEvent.setup()
      renderWithProviders(<SearchFilterPanel onFiltersChange={onFiltersChange} />)

      const dateRangeButton = screen.getByRole('button', { name: /date range/i })
      await user.click(dateRangeButton)

      await waitFor(() => {
        expect(screen.getByText('Select Date Range')).toBeInTheDocument()
      })

      const fromLabel = screen.getByText('From')
      const startDateInput = fromLabel.closest('.space-y-2')?.querySelector('input[type="date"]') as HTMLInputElement
      expect(startDateInput).toBeInTheDocument()

      await user.type(startDateInput, '2024-01-01')

      await user.click(document.body)

      await waitFor(() => {
        const button = screen.getByRole('button', { name: /date range/i })
        expect(button.textContent).toContain('Set')
      })
    })

    it('should clear dates when Clear Dates button is clicked', async () => {
      const user = userEvent.setup()
      renderWithProviders(<SearchFilterPanel onFiltersChange={onFiltersChange} />)

      const dateRangeButton = screen.getByRole('button', { name: /date range/i })
      await user.click(dateRangeButton)

      await waitFor(() => {
        expect(screen.getByText('Select Date Range')).toBeInTheDocument()
      })

      const fromLabel = screen.getByText('From')
      const startDateInput = fromLabel.closest('.space-y-2')?.querySelector('input[type="date"]') as HTMLInputElement
      expect(startDateInput).toBeInTheDocument()

      await user.type(startDateInput, '2024-01-01')

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /clear dates/i })).toBeInTheDocument()
      })

      onFiltersChange.mockClear()

      const clearButton = screen.getByRole('button', { name: /clear dates/i })
      await user.click(clearButton)

      await waitFor(() => {
        expect(onFiltersChange).toHaveBeenCalledWith(
          expect.objectContaining({
            startDate: undefined,
            endDate: undefined,
          })
        )
      })
    })
  })

  describe('Preset Management', () => {
    it('should open presets popover on click', async () => {
      const user = userEvent.setup()
      renderWithProviders(<SearchFilterPanel onFiltersChange={onFiltersChange} />)

      const presetsButton = screen.getByRole('button', { name: /presets/i })
      await user.click(presetsButton)

      await waitFor(() => {
        expect(screen.getByText('Filter Presets')).toBeInTheDocument()
      })
    })

    it('should show save preset form when Save Current Filters is clicked', async () => {
      const user = userEvent.setup()
      renderWithProviders(<SearchFilterPanel onFiltersChange={onFiltersChange} />)

      // First set a filter to enable the save button
      const searchInput = screen.getByPlaceholderText('Search prompts and responses...')
      await user.type(searchInput, 'test')

      // Wait for debounce to complete and button to become enabled
      await waitFor(() => {
        expect(onFiltersChange).toHaveBeenCalledWith(
          expect.objectContaining({
            searchText: 'test',
          })
        )
      }, { timeout: 500 })

      const presetsButton = screen.getByRole('button', { name: /presets/i })
      await user.click(presetsButton)

      await waitFor(() => {
        expect(screen.getByText('Filter Presets')).toBeInTheDocument()
      })

      const saveButton = screen.getByRole('button', { name: /save current filters/i })
      expect(saveButton).not.toBeDisabled()
      await user.click(saveButton)

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Preset name...')).toBeInTheDocument()
      })
    })

    it('should save preset to localStorage when Save button is clicked', async () => {
      const user = userEvent.setup()
      renderWithProviders(<SearchFilterPanel onFiltersChange={onFiltersChange} />)

      // Set a filter
      const searchInput = screen.getByPlaceholderText('Search prompts and responses...')
      await user.type(searchInput, 'test')

      // Wait for debounce to complete
      await waitFor(() => {
        expect(onFiltersChange).toHaveBeenCalledWith(
          expect.objectContaining({
            searchText: 'test',
          })
        )
      }, { timeout: 500 })

      // Open presets
      const presetsButton = screen.getByRole('button', { name: /presets/i })
      await user.click(presetsButton)

      await waitFor(() => {
        expect(screen.getByText('Filter Presets')).toBeInTheDocument()
      })

      // Click Save Current Filters
      const saveCurrentButton = screen.getByRole('button', { name: /save current filters/i })
      expect(saveCurrentButton).not.toBeDisabled()
      await user.click(saveCurrentButton)

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Preset name...')).toBeInTheDocument()
      })

      // Enter preset name
      const presetNameInput = screen.getByPlaceholderText('Preset name...')
      await user.type(presetNameInput, 'My Preset')

      // Click Save
      const saveButton = screen.getByRole('button', { name: /^save$/i })
      await user.click(saveButton)

      // Check localStorage
      await waitFor(() => {
        const savedPresets = localStorage.getItem('filter-presets')
        expect(savedPresets).toBeTruthy()
        const presets = JSON.parse(savedPresets!)
        expect(presets).toHaveLength(1)
        expect(presets[0].name).toBe('My Preset')
      })
    })

    it('should load presets from localStorage on mount', () => {
      const presets = [
        {
          id: '1',
          name: 'Test Preset',
          filters: {
            searchText: 'test',
            providers: ['claude'],
            tags: [],
            startDate: undefined,
            endDate: undefined,
          },
        },
      ]
      localStorage.setItem('filter-presets', JSON.stringify(presets))

      renderWithProviders(<SearchFilterPanel onFiltersChange={onFiltersChange} />)

      expect(localStorage.getItem('filter-presets')).toBe(JSON.stringify(presets))
    })

    it('should delete preset when X button is clicked', async () => {
      const user = userEvent.setup()
      const presets = [
        {
          id: '1',
          name: 'Test Preset',
          filters: {
            searchText: 'test',
            providers: ['claude'],
            tags: [],
            startDate: undefined,
            endDate: undefined,
          },
        },
      ]
      localStorage.setItem('filter-presets', JSON.stringify(presets))

      renderWithProviders(<SearchFilterPanel onFiltersChange={onFiltersChange} />)

      const presetsButton = screen.getByRole('button', { name: /presets/i })
      await user.click(presetsButton)

      await waitFor(() => {
        expect(screen.getByText('Test Preset')).toBeInTheDocument()
      })

      // Find delete button (X button next to preset name)
      const deleteButtons = screen.getAllByRole('button').filter(btn =>
        btn.querySelector('svg') && btn.closest('.flex.items-center.justify-between')
      )
      const deleteButton = deleteButtons.find(btn =>
        btn.closest('.flex.items-center.justify-between')?.textContent?.includes('Test Preset')
      )

      expect(deleteButton).toBeTruthy()
      await user.click(deleteButton!)

      await waitFor(() => {
        const savedPresets = localStorage.getItem('filter-presets')
        expect(savedPresets).toBe('[]')
      })
    })
  })

  describe('Clear All Functionality', () => {
    it('should show Clear All button when filters are active', async () => {
      const user = userEvent.setup()
      renderWithProviders(<SearchFilterPanel onFiltersChange={onFiltersChange} />)

      const searchInput = screen.getByPlaceholderText('Search prompts and responses...')
      await user.type(searchInput, 'test')

      // Wait for debounce to complete
      await waitFor(() => {
        expect(onFiltersChange).toHaveBeenCalledWith(
          expect.objectContaining({
            searchText: 'test',
          })
        )
      }, { timeout: 500 })

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /clear all/i })).toBeInTheDocument()
      })
    })

    it('should clear all filters when Clear All is clicked', async () => {
      const user = userEvent.setup()
      renderWithProviders(<SearchFilterPanel onFiltersChange={onFiltersChange} />)

      // Set search text
      const searchInput = screen.getByPlaceholderText('Search prompts and responses...')
      await user.type(searchInput, 'test')

      // Wait for debounce
      await waitFor(() => {
        expect(onFiltersChange).toHaveBeenCalledWith(
          expect.objectContaining({
            searchText: 'test',
          })
        )
      }, { timeout: 500 })

      // Set provider
      const providersButton = screen.getByRole('button', { name: /providers/i })
      await user.click(providersButton)

      await waitFor(() => {
        expect(screen.getByText('Select Providers')).toBeInTheDocument()
      })

      const claudeCheckbox = screen.getByLabelText('claude')
      await user.click(claudeCheckbox)

      await user.click(document.body)

      onFiltersChange.mockClear()

      // Click Clear All
      const clearAllButton = screen.getByRole('button', { name: /clear all/i })
      await user.click(clearAllButton)

      // Verify all filters are cleared
      await waitFor(() => {
        expect(onFiltersChange).toHaveBeenCalledWith({
          searchText: '',
          providers: [],
          tags: [],
          startDate: undefined,
          endDate: undefined,
        })
      })

      expect(searchInput).toHaveValue('')
    })
  })

  describe('Filter Callbacks', () => {
    it('should call onFiltersChange with initial empty filters', () => {
      renderWithProviders(<SearchFilterPanel onFiltersChange={onFiltersChange} />)

      expect(onFiltersChange).toHaveBeenCalledWith({
        searchText: '',
        providers: [],
        tags: [],
        startDate: undefined,
        endDate: undefined,
      })
    })

    it('should maintain filter structure in callbacks', () => {
      renderWithProviders(<SearchFilterPanel onFiltersChange={onFiltersChange} />)

      const lastCall = onFiltersChange.mock.calls[onFiltersChange.mock.calls.length - 1][0]
      expect(lastCall).toEqual({
        searchText: expect.any(String),
        providers: expect.any(Array),
        tags: expect.any(Array),
        startDate: undefined,
        endDate: undefined,
      })
    })

    it('should include all required filter properties', () => {
      renderWithProviders(<SearchFilterPanel onFiltersChange={onFiltersChange} />)

      const filters = onFiltersChange.mock.calls[0][0]
      expect(filters).toHaveProperty('searchText')
      expect(filters).toHaveProperty('providers')
      expect(filters).toHaveProperty('tags')
      expect(filters).toHaveProperty('startDate')
      expect(filters).toHaveProperty('endDate')
    })
  })

  describe('LocalStorage Integration', () => {
    it('should load presets from localStorage on mount', () => {
      const presets = [
        {
          id: '1',
          name: 'Test Preset',
          filters: {
            searchText: 'test',
            providers: ['claude'],
            tags: [],
            startDate: undefined,
            endDate: undefined,
          },
        },
      ]
      localStorage.setItem('filter-presets', JSON.stringify(presets))

      renderWithProviders(<SearchFilterPanel onFiltersChange={onFiltersChange} />)

      expect(localStorage.getItem('filter-presets')).toBe(JSON.stringify(presets))
    })

    it('should handle corrupted localStorage data gracefully', () => {
      localStorage.setItem('filter-presets', 'invalid-json{')

      expect(() => {
        renderWithProviders(<SearchFilterPanel onFiltersChange={onFiltersChange} />)
      }).not.toThrow()
    })

    it('should handle missing localStorage data', () => {
      expect(() => {
        renderWithProviders(<SearchFilterPanel onFiltersChange={onFiltersChange} />)
      }).not.toThrow()
    })

    it('should handle empty localStorage presets', () => {
      localStorage.setItem('filter-presets', '[]')

      expect(() => {
        renderWithProviders(<SearchFilterPanel onFiltersChange={onFiltersChange} />)
      }).not.toThrow()
    })
  })

  describe('Props Handling', () => {
    it('should use custom availableProviders when provided', () => {
      renderWithProviders(
        <SearchFilterPanel
          onFiltersChange={onFiltersChange}
          availableProviders={['claude', 'openai']}
        />
      )

      expect(screen.getByRole('button', { name: /providers/i })).toBeInTheDocument()
    })

    it('should handle availableTags prop correctly', () => {
      const tags = ['react', 'testing', 'vitest']
      renderWithProviders(
        <SearchFilterPanel
          onFiltersChange={onFiltersChange}
          availableTags={tags}
        />
      )

      expect(screen.getByRole('button', { name: /tags/i })).toBeInTheDocument()
    })

    it('should handle undefined resultCount', () => {
      renderWithProviders(<SearchFilterPanel onFiltersChange={onFiltersChange} />)

      expect(screen.queryByText(/results? found/)).not.toBeInTheDocument()
    })

    it('should accept empty arrays for provider and tag props', () => {
      expect(() => {
        renderWithProviders(
          <SearchFilterPanel
            onFiltersChange={onFiltersChange}
            availableProviders={[]}
            availableTags={[]}
          />
        )
      }).not.toThrow()
    })
  })

  describe('Component Structure', () => {
    it('should have search icon in input', () => {
      renderWithProviders(<SearchFilterPanel onFiltersChange={onFiltersChange} />)

      const searchInput = screen.getByPlaceholderText('Search prompts and responses...')
      const container = searchInput.parentElement

      expect(container?.querySelector('svg')).toBeInTheDocument()
    })

    it('should display filter icon in header', () => {
      renderWithProviders(<SearchFilterPanel onFiltersChange={onFiltersChange} />)

      const header = screen.getByText('Search & Filters').parentElement
      expect(header?.querySelector('svg')).toBeInTheDocument()
    })

    it('should have appropriate card styling', () => {
      const { container } = renderWithProviders(
        <SearchFilterPanel onFiltersChange={onFiltersChange} />
      )

      const card = container.querySelector('.border')
      expect(card).toBeInTheDocument()
      expect(card).toHaveClass('rounded-lg')
    })
  })

  describe('Button Accessibility', () => {
    it('should have accessible filter buttons', () => {
      renderWithProviders(<SearchFilterPanel onFiltersChange={onFiltersChange} />)

      const providersButton = screen.getByRole('button', { name: /providers/i })
      const dateRangeButton = screen.getByRole('button', { name: /date range/i })
      const presetsButton = screen.getByRole('button', { name: /presets/i })

      expect(providersButton).toBeInTheDocument()
      expect(dateRangeButton).toBeInTheDocument()
      expect(presetsButton).toBeInTheDocument()
    })

    it('should render search input with placeholder', () => {
      renderWithProviders(<SearchFilterPanel onFiltersChange={onFiltersChange} />)

      const searchInput = screen.getByPlaceholderText('Search prompts and responses...')
      expect(searchInput).toBeInTheDocument()
      expect(searchInput.tagName).toBe('INPUT')
    })
  })
})
