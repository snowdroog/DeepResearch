# Research Data Table Component

## Overview

The `ResearchDataTable` component is a powerful, feature-rich data table built with TanStack Table and TanStack Virtual. It's designed to display research capture data with high performance, even with large datasets.

## Features

### ✅ Core Features Implemented

1. **Column Definitions**
   - Timestamp (formatted with date-fns)
   - Provider (with sorting)
   - Model name
   - Prompt preview (truncated to 100 chars)
   - Response preview (truncated to 100 chars)
   - Tags (parsed from JSON, displayed as badges)
   - Token count (formatted with locale)

2. **Sorting**
   - Click column headers to sort
   - Supports ascending/descending order
   - Visual indicators with arrow icons
   - Default sort by timestamp (newest first)

3. **Filtering**
   - Filter by provider name
   - Filter by tags (searches within tag arrays)
   - Real-time filtering as you type

4. **Virtual Scrolling**
   - Powered by TanStack Virtual
   - Renders only visible rows for optimal performance
   - Smooth scrolling even with thousands of rows
   - Configurable overscan (10 rows)
   - Estimated row height: 73px

5. **Row Selection**
   - Select individual rows with checkboxes
   - Select all rows with header checkbox
   - Indeterminate state for partial selections
   - Callback for handling selected rows
   - Visual indication of selected rows

6. **Column Customization**
   - Show/hide columns via dropdown menu
   - Persist column visibility state
   - Visual icons for visible/hidden columns
   - Cannot hide select and essential columns

## File Structure

```
src/renderer/
├── components/
│   ├── organisms/
│   │   └── ResearchDataTable.tsx    # Main data table component
│   └── ui/
│       ├── table.tsx                # Base table components
│       ├── button.tsx               # Button component
│       ├── checkbox.tsx             # Checkbox component (Radix UI)
│       └── input.tsx                # Input component
├── lib/
│   └── utils.ts                     # Utility functions (cn)
└── pages/
    └── ResearchTableDemo.tsx        # Demo page with sample data
```

## Usage

### Basic Usage

```tsx
import { ResearchDataTable } from '@/renderer/components/organisms/ResearchDataTable'

function MyComponent() {
  const data = [
    {
      id: '1',
      session_id: 'session-1',
      provider: 'claude',
      prompt: 'Your prompt here',
      response: 'Response text here',
      timestamp: Date.now(),
      token_count: 1250,
      tags: JSON.stringify(['tag1', 'tag2']),
      is_archived: 0,
    },
    // ... more data
  ]

  return <ResearchDataTable data={data} />
}
```

### With Row Selection Handler

```tsx
import { ResearchDataTable, CaptureData } from '@/renderer/components/organisms/ResearchDataTable'

function MyComponent() {
  const [selectedRows, setSelectedRows] = useState<CaptureData[]>([])

  const handleRowSelectionChange = (rows: CaptureData[]) => {
    setSelectedRows(rows)
    console.log('Selected:', rows)
    // Perform bulk operations on selected rows
  }

  return (
    <ResearchDataTable
      data={data}
      onRowSelectionChange={handleRowSelectionChange}
    />
  )
}
```

## Data Format

The component expects data in the following format:

```typescript
interface CaptureData {
  id: string                    // Unique identifier
  session_id: string            // Session reference
  provider: string              // AI provider (claude, chatgpt, gemini, etc.)
  prompt: string                // User prompt
  response: string              // AI response
  response_format?: string      // Response format (text, json, etc.)
  model?: string                // Model name
  timestamp: number             // Unix timestamp in milliseconds
  token_count?: number          // Token usage
  tags?: string                 // JSON string array of tags
  notes?: string                // Additional notes
  is_archived: number           // Archive status (0 or 1)
}
```

## Component Props

```typescript
interface ResearchDataTableProps {
  data: CaptureData[]                                      // Required: Array of capture data
  onRowSelectionChange?: (selectedRows: CaptureData[]) => void  // Optional: Selection callback
}
```

## Styling

The component uses Tailwind CSS with the shadcn/ui color system. It adapts to your theme and supports dark mode out of the box.

### Customizing Appearance

You can modify the appearance by:

1. **Adjusting table height**: Change the `h-[600px]` class in the table container
2. **Modifying column widths**: Update `max-w-[...]` classes in column definitions
3. **Changing truncation length**: Modify the `truncateText()` function parameters
4. **Styling tags**: Update the tag badge classes

## Performance Considerations

1. **Virtual Scrolling**: Only visible rows are rendered, enabling smooth scrolling with 10,000+ rows
2. **Memoization**: Consider wrapping in `React.memo()` if parent re-renders frequently
3. **Data Updates**: For real-time data, use stable row IDs to prevent unnecessary re-renders
4. **Filtering**: Filters are applied efficiently using TanStack Table's built-in methods

## Integration with Database

To integrate with the SQLite database:

```tsx
import { db } from '@/main/database/db'

function MyComponent() {
  const [captures, setCaptures] = useState<CaptureData[]>([])

  useEffect(() => {
    // Fetch data from database
    const data = db.getCaptures({ isArchived: false })
    setCaptures(data)
  }, [])

  return <ResearchDataTable data={captures} />
}
```

## Demo

See `src/renderer/pages/ResearchTableDemo.tsx` for a complete working example with sample data.

To run the demo:
1. Import the demo page into your router
2. Navigate to the demo route
3. Interact with sorting, filtering, and selection features

## Dependencies

- `@tanstack/react-table` ^8.10.0 - Table logic
- `@tanstack/react-virtual` ^3.0.0 - Virtual scrolling
- `@radix-ui/react-checkbox` - Checkbox components
- `@radix-ui/react-dropdown-menu` - Column visibility dropdown
- `lucide-react` - Icons
- `date-fns` - Date formatting
- `class-variance-authority` - Button variants
- `clsx` + `tailwind-merge` - Utility classes

## Future Enhancements

Potential improvements:

- [ ] Export to CSV/JSON
- [ ] Advanced filtering (date ranges, multi-select)
- [ ] Column resizing
- [ ] Persistent user preferences
- [ ] Keyboard navigation
- [ ] Inline editing
- [ ] Expandable row details
- [ ] Grouping by provider/session

## Troubleshooting

### Table not rendering
- Ensure data array is not null/undefined
- Check that all required fields are present in data objects

### Virtual scrolling not working
- Verify the table container has a fixed height
- Check that `useVirtualizer` has access to the container ref

### Filters not working
- Ensure filter values match data types
- Check column IDs match accessor keys

### Performance issues
- Consider paginating data before passing to component
- Reduce overscan value if needed
- Implement data windowing at the data layer

## Support

For issues or questions, please refer to:
- TanStack Table docs: https://tanstack.com/table/latest
- TanStack Virtual docs: https://tanstack.com/virtual/latest
