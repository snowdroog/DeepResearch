import { useState, useEffect } from 'react'
import { Calendar, Filter, X, Save, Search as SearchIcon } from 'lucide-react'
import { format } from 'date-fns'
import { Button } from '@/renderer/components/ui/button'
import { Input } from '@/renderer/components/ui/input'
import { Badge } from '@/renderer/components/ui/badge'
import { Popover, PopoverContent, PopoverTrigger } from '@/renderer/components/ui/popover'
import { Checkbox } from '@/renderer/components/ui/checkbox'

export interface SearchFilters {
  searchText: string
  providers: string[]
  tags: string[]
  startDate?: Date
  endDate?: Date
}

export interface FilterPreset {
  id: string
  name: string
  filters: SearchFilters
}

interface SearchFilterPanelProps {
  onFiltersChange: (filters: SearchFilters) => void
  resultCount?: number
  availableProviders?: string[]
  availableTags?: string[]
}

const DEFAULT_PROVIDERS = ['claude', 'chatgpt', 'gemini', 'perplexity', 'custom']

export function SearchFilterPanel({
  onFiltersChange,
  resultCount,
  availableProviders = DEFAULT_PROVIDERS,
  availableTags = [],
}: SearchFilterPanelProps) {
  const [searchText, setSearchText] = useState('')
  const [debouncedSearchText, setDebouncedSearchText] = useState('')
  const [selectedProviders, setSelectedProviders] = useState<string[]>([])
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [startDate, setStartDate] = useState<string>('')
  const [endDate, setEndDate] = useState<string>('')
  const [presets, setPresets] = useState<FilterPreset[]>([])
  const [showPresetSave, setShowPresetSave] = useState(false)
  const [presetName, setPresetName] = useState('')

  // Debounce search text
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchText(searchText)
    }, 300)

    return () => clearTimeout(timer)
  }, [searchText])

  // Notify parent of filter changes
  useEffect(() => {
    const filters: SearchFilters = {
      searchText: debouncedSearchText,
      providers: selectedProviders,
      tags: selectedTags,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    }
    onFiltersChange(filters)
  }, [debouncedSearchText, selectedProviders, selectedTags, startDate, endDate, onFiltersChange])

  // Load presets from localStorage
  useEffect(() => {
    const savedPresets = localStorage.getItem('filter-presets')
    if (savedPresets) {
      try {
        setPresets(JSON.parse(savedPresets))
      } catch (e) {
        console.error('Failed to load filter presets:', e)
      }
    }
  }, [])

  const handleProviderToggle = (provider: string) => {
    setSelectedProviders((prev) =>
      prev.includes(provider)
        ? prev.filter((p) => p !== provider)
        : [...prev, provider]
    )
  }

  const handleTagToggle = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    )
  }

  const handleClearFilters = () => {
    setSearchText('')
    setDebouncedSearchText('')
    setSelectedProviders([])
    setSelectedTags([])
    setStartDate('')
    setEndDate('')
  }

  const handleSavePreset = () => {
    if (!presetName.trim()) return

    const newPreset: FilterPreset = {
      id: Date.now().toString(),
      name: presetName,
      filters: {
        searchText: debouncedSearchText,
        providers: selectedProviders,
        tags: selectedTags,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
      },
    }

    const updatedPresets = [...presets, newPreset]
    setPresets(updatedPresets)
    localStorage.setItem('filter-presets', JSON.stringify(updatedPresets))
    setPresetName('')
    setShowPresetSave(false)
  }

  const handleLoadPreset = (preset: FilterPreset) => {
    setSearchText(preset.filters.searchText)
    setDebouncedSearchText(preset.filters.searchText)
    setSelectedProviders(preset.filters.providers)
    setSelectedTags(preset.filters.tags)
    setStartDate(preset.filters.startDate ? format(preset.filters.startDate, 'yyyy-MM-dd') : '')
    setEndDate(preset.filters.endDate ? format(preset.filters.endDate, 'yyyy-MM-dd') : '')
  }

  const handleDeletePreset = (presetId: string) => {
    const updatedPresets = presets.filter((p) => p.id !== presetId)
    setPresets(updatedPresets)
    localStorage.setItem('filter-presets', JSON.stringify(updatedPresets))
  }

  const activeFilterCount =
    (debouncedSearchText ? 1 : 0) +
    selectedProviders.length +
    selectedTags.length +
    (startDate ? 1 : 0) +
    (endDate ? 1 : 0)

  return (
    <div className="space-y-4 p-4 border rounded-lg bg-card">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="h-5 w-5" />
          <h3 className="font-semibold">Search & Filters</h3>
          {activeFilterCount > 0 && (
            <Badge variant="secondary">{activeFilterCount} active</Badge>
          )}
        </div>
        {activeFilterCount > 0 && (
          <Button variant="ghost" size="sm" onClick={handleClearFilters}>
            <X className="h-4 w-4 mr-1" />
            Clear All
          </Button>
        )}
      </div>

      {/* Search Input */}
      <div className="relative">
        <SearchIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search prompts and responses..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Filters Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Provider Filter */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="justify-between">
              Providers
              {selectedProviders.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {selectedProviders.length}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64">
            <div className="space-y-2">
              <h4 className="font-medium text-sm mb-2">Select Providers</h4>
              {availableProviders.map((provider) => (
                <div key={provider} className="flex items-center space-x-2">
                  <Checkbox
                    id={`provider-${provider}`}
                    checked={selectedProviders.includes(provider)}
                    onCheckedChange={() => handleProviderToggle(provider)}
                  />
                  <label
                    htmlFor={`provider-${provider}`}
                    className="text-sm capitalize cursor-pointer flex-1"
                  >
                    {provider}
                  </label>
                </div>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        {/* Tag Filter */}
        {availableTags.length > 0 && (
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="justify-between">
                Tags
                {selectedTags.length > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {selectedTags.length}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 max-h-96 overflow-y-auto">
              <div className="space-y-2">
                <h4 className="font-medium text-sm mb-2">Select Tags</h4>
                {availableTags.map((tag) => (
                  <div key={tag} className="flex items-center space-x-2">
                    <Checkbox
                      id={`tag-${tag}`}
                      checked={selectedTags.includes(tag)}
                      onCheckedChange={() => handleTagToggle(tag)}
                    />
                    <label
                      htmlFor={`tag-${tag}`}
                      className="text-sm cursor-pointer flex-1"
                    >
                      {tag}
                    </label>
                  </div>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        )}

        {/* Date Range */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="justify-between">
              <Calendar className="h-4 w-4 mr-2" />
              Date Range
              {(startDate || endDate) && (
                <Badge variant="secondary" className="ml-2">
                  Set
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80">
            <div className="space-y-4">
              <h4 className="font-medium text-sm">Select Date Range</h4>
              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">From</label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">To</label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
              {(startDate || endDate) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setStartDate('')
                    setEndDate('')
                  }}
                  className="w-full"
                >
                  Clear Dates
                </Button>
              )}
            </div>
          </PopoverContent>
        </Popover>

        {/* Presets */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline">
              <Save className="h-4 w-4 mr-2" />
              Presets
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80">
            <div className="space-y-4">
              <h4 className="font-medium text-sm">Filter Presets</h4>

              {/* Save New Preset */}
              {showPresetSave ? (
                <div className="space-y-2">
                  <Input
                    placeholder="Preset name..."
                    value={presetName}
                    onChange={(e) => setPresetName(e.target.value)}
                  />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleSavePreset}>
                      Save
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setShowPresetSave(false)
                        setPresetName('')
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowPresetSave(true)}
                  className="w-full"
                  disabled={activeFilterCount === 0}
                >
                  Save Current Filters
                </Button>
              )}

              {/* Preset List */}
              {presets.length > 0 ? (
                <div className="space-y-2">
                  {presets.map((preset) => (
                    <div
                      key={preset.id}
                      className="flex items-center justify-between p-2 rounded border hover:bg-accent"
                    >
                      <button
                        onClick={() => handleLoadPreset(preset)}
                        className="text-sm flex-1 text-left"
                      >
                        {preset.name}
                      </button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeletePreset(preset.id)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No saved presets</p>
              )}
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Active Filters */}
      {activeFilterCount > 0 && (
        <div className="flex flex-wrap gap-2">
          {debouncedSearchText && (
            <Badge variant="outline" className="gap-1">
              Search: "{debouncedSearchText}"
              <button
                onClick={() => {
                  setSearchText('')
                  setDebouncedSearchText('')
                }}
                className="ml-1"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {selectedProviders.map((provider) => (
            <Badge key={provider} variant="outline" className="gap-1">
              {provider}
              <button onClick={() => handleProviderToggle(provider)}>
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
          {selectedTags.map((tag) => (
            <Badge key={tag} variant="outline" className="gap-1">
              #{tag}
              <button onClick={() => handleTagToggle(tag)}>
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
          {startDate && (
            <Badge variant="outline" className="gap-1">
              From: {format(new Date(startDate), 'MMM dd, yyyy')}
              <button onClick={() => setStartDate('')}>
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {endDate && (
            <Badge variant="outline" className="gap-1">
              To: {format(new Date(endDate), 'MMM dd, yyyy')}
              <button onClick={() => setEndDate('')}>
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
        </div>
      )}

      {/* Result Count */}
      {resultCount !== undefined && (
        <div className="text-sm text-muted-foreground">
          {resultCount} result{resultCount !== 1 ? 's' : ''} found
        </div>
      )}
    </div>
  )
}
