# Search & Filter System

## Overview

The Search & Filter System provides a comprehensive, user-friendly interface for filtering and searching through research captures. It features real-time text search with debouncing, multi-select filters, date range selection, and saved filter presets.

## Components

### SearchFilterPanel

The main component that provides all filtering capabilities.

**Location**: `src/renderer/components/organisms/SearchFilterPanel.tsx`

**Features**:
- Text search with 300ms debouncing
- Provider multi-select (checkbox-based)
- Tag multi-select (checkbox-based)
- Date range picker (start/end dates)
- Filter presets (save/load/delete)
- Active filter display with badges
- Result count display
- Clear all filters button

## Usage

### Basic Usage

```tsx
import { SearchFilterPanel, SearchFilters } from '@/renderer/components/organisms/SearchFilterPanel'
import { ResearchDataTable, CaptureData } from '@/renderer/components/organisms/ResearchDataTable'

function MyPage() {
  const [filters, setFilters] = useState<SearchFilters>({
    searchText: '',
    providers: [],
    tags: [],
    startDate: undefined,
    endDate: undefined,
  })

  // Your data source
  const allData: CaptureData[] = fetchData()

  // Apply filters
  const filteredData = applyFilters(allData, filters)

  return (
    <>
      <SearchFilterPanel
        onFiltersChange={setFilters}
        resultCount={filteredData.length}
        availableProviders={['claude', 'chatgpt', 'gemini']}
        availableTags={['react', 'typescript', 'api']}
      />
      <ResearchDataTable data={filteredData} />
    </>
  )
}
```

### Filter Logic Example

```tsx
function applyFilters(data: CaptureData[], filters: SearchFilters): CaptureData[] {
  return data.filter((item) => {
    // Text search
    if (filters.searchText) {
      const searchLower = filters.searchText.toLowerCase()
      const matchesSearch =
        item.prompt.toLowerCase().includes(searchLower) ||
        item.response.toLowerCase().includes(searchLower)
      if (!matchesSearch) return false
    }

    // Provider filter
    if (filters.providers.length > 0) {
      if (!filters.providers.includes(item.provider)) return false
    }

    // Tags filter
    if (filters.tags.length > 0) {
      const itemTags = item.tags ? JSON.parse(item.tags) : []
      const hasMatchingTag = filters.tags.some((tag) => itemTags.includes(tag))
      if (!hasMatchingTag) return false
    }

    // Date range
    if (filters.startDate && item.timestamp < filters.startDate.getTime()) {
      return false
    }
    if (filters.endDate) {
      const endOfDay = new Date(filters.endDate)
      endOfDay.setHours(23, 59, 59, 999)
      if (item.timestamp > endOfDay.getTime()) return false
    }

    return true
  })
}
```

## Props

### SearchFilterPanel Props

```typescript
interface SearchFilterPanelProps {
  onFiltersChange: (filters: SearchFilters) => void  // Callback when filters change
  resultCount?: number                                // Number of results to display
  availableProviders?: string[]                       // List of providers to show
  availableTags?: string[]                           // List of tags to show
}
```

### SearchFilters Interface

```typescript
interface SearchFilters {
  searchText: string        // Text to search in prompts/responses
  providers: string[]       // Selected provider names
  tags: string[]           // Selected tag names
  startDate?: Date         // Filter from this date
  endDate?: Date           // Filter to this date
}
```

## Features in Detail

### 1. Text Search with Debouncing

- **Debounce Time**: 300ms
- **Search Scope**: Searches both prompt and response fields
- **Case Insensitive**: All searches are case-insensitive
- **Real-time**: Updates as user types (after debounce delay)

### 2. Provider Multi-Select

- Checkbox-based selection
- Shows all available providers
- Displays count of selected providers
- Supports any provider names passed via props

### 3. Tag Multi-Select

- Checkbox-based selection
- Scrollable list for many tags
- Displays count of selected tags
- Only shows if tags are available

### 4. Date Range Picker

- Uses native HTML5 date inputs for broad compatibility
- Start date and end date independently selectable
- End date includes full day (23:59:59.999)
- Clear button to remove both dates

### 5. Filter Presets

**Save Preset**:
1. Configure your desired filters
2. Click "Presets" button
3. Click "Save Current Filters"
4. Enter a name
5. Click "Save"

**Load Preset**:
1. Click "Presets" button
2. Click on a saved preset name
3. All filters are restored

**Delete Preset**:
1. Click "Presets" button
2. Click the X button next to a preset

**Storage**: Presets are saved to `localStorage` under the key `filter-presets`

### 6. Active Filter Display

- Shows badge for each active filter
- Click X on any badge to remove that filter
- "Clear All" button removes all filters at once
- Active filter count displayed in header

### 7. Result Count

- Shows total number of filtered results
- Updates in real-time as filters change
- Grammatically correct (1 result vs 2 results)

## UI Components Used

- **Button**: For triggers and actions
- **Input**: For text search and dates
- **Badge**: For active filters and counts
- **Popover**: For dropdown panels
- **Checkbox**: For multi-select options

## File Structure

```
src/renderer/
├── components/
│   ├── organisms/
│   │   └── SearchFilterPanel.tsx    # Main filter component
│   └── ui/
│       ├── button.tsx               # Button component
│       ├── input.tsx                # Input component
│       ├── badge.tsx                # Badge component
│       ├── popover.tsx              # Popover component
│       └── checkbox.tsx             # Checkbox component
└── pages/
    └── SearchFilterDemo.tsx         # Demo page
```

## Integration with ResearchDataTable

The SearchFilterPanel is designed to work alongside ResearchDataTable:

1. **SearchFilterPanel** - Collects user filter preferences
2. **Parent Component** - Applies filters to data
3. **ResearchDataTable** - Displays filtered results

This separation of concerns allows for:
- Better performance (filter before table processing)
- Flexibility in filter logic
- Easier testing
- Reusable components

## Performance Considerations

### Debouncing

Text search is debounced to prevent excessive re-renders:
- Waits 300ms after last keystroke
- Prevents filtering on every character
- Improves performance with large datasets

### Filter Application

Apply filters before passing data to table:
```tsx
// Good - Filter once
const filtered = applyFilters(data, filters)
<ResearchDataTable data={filtered} />

// Bad - Table does all the work
<ResearchDataTable data={data} filters={filters} />
```

### Large Tag Lists

For datasets with 100+ unique tags:
- Consider pagination or virtual scrolling in tag list
- Add tag search within the popover
- Group tags by category

## Customization

### Adding New Filter Types

To add a new filter type (e.g., model filter):

1. Update `SearchFilters` interface:
```typescript
export interface SearchFilters {
  // ...existing filters
  models: string[]
}
```

2. Add state and UI in SearchFilterPanel:
```tsx
const [selectedModels, setSelectedModels] = useState<string[]>([])

// Add to filter construction
const filters: SearchFilters = {
  // ...existing
  models: selectedModels,
}

// Add popover UI similar to providers
```

3. Apply filter in parent component:
```tsx
if (filters.models.length > 0) {
  if (!filters.models.includes(item.model)) return false
}
```

### Styling

The component uses Tailwind CSS and adapts to your theme:
- Supports dark mode automatically
- Uses CSS custom properties from tailwind.config
- Responsive grid layout (1/2/4 columns)

### Preset Storage

By default, presets use localStorage. To use a different storage:

```tsx
// Custom storage hooks
const useFilterPresets = () => {
  // Load from your backend/database
  const load = async () => { /* ... */ }
  const save = async (presets) => { /* ... */ }
  return { presets, save, load }
}
```

## Accessibility

- Keyboard navigable
- Proper ARIA labels on checkboxes
- Focus management in popovers
- Clear visual feedback

## Browser Compatibility

- Modern browsers (Chrome, Firefox, Safari, Edge)
- HTML5 date input support required
- For older browsers, consider using a date picker library

## Demo

See `src/renderer/pages/SearchFilterDemo.tsx` for a complete working example with:
- Sample data
- Filter application logic
- Integration with ResearchDataTable
- Selected rows display

## Troubleshooting

### Filters not working
- Ensure `onFiltersChange` is called correctly
- Check filter logic in parent component
- Verify data structure matches CaptureData interface

### Presets not persisting
- Check browser localStorage is enabled
- Verify no errors in console
- Check localStorage quota not exceeded

### Tags not showing
- Pass `availableTags` prop with array of tag names
- Extract tags from your data source
- Ensure tags are unique

### Performance issues
- Increase debounce delay (default 300ms)
- Filter data before other operations
- Consider pagination for very large datasets
- Use React.memo for child components

## Future Enhancements

Potential improvements:
- [ ] Advanced search syntax (AND/OR/NOT)
- [ ] Regex search support
- [ ] Export current filter configuration
- [ ] Import filter configurations
- [ ] Filter templates for common use cases
- [ ] Search history
- [ ] Keyboard shortcuts
- [ ] Custom date presets (last 7 days, last month, etc.)
- [ ] Tag autocomplete
- [ ] Filter analytics (most used filters)
