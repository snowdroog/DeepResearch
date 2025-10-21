import { useState, useMemo } from 'react'
import {
  SearchFilterPanel,
  SearchFilters,
} from '@/renderer/components/organisms/SearchFilterPanel'
import {
  ResearchDataTable,
  CaptureData,
} from '@/renderer/components/organisms/ResearchDataTable'

// Sample data for testing
const sampleData: CaptureData[] = [
  {
    id: '1',
    session_id: 'session-1',
    provider: 'claude',
    prompt: 'What is the difference between React hooks and class components?',
    response:
      'React hooks are functions that let you use state and other React features in functional components. Class components use ES6 classes and lifecycle methods. Hooks provide a more concise and easier to understand way to manage state and side effects.',
    response_format: 'text',
    model: 'claude-3-opus-20240229',
    timestamp: Date.now() - 3600000, // 1 hour ago
    token_count: 1250,
    tags: JSON.stringify(['react', 'hooks', 'tutorial']),
    notes: 'Good explanation for beginners',
    is_archived: 0,
  },
  {
    id: '2',
    session_id: 'session-1',
    provider: 'chatgpt',
    prompt: 'Explain the concept of virtual DOM',
    response:
      'The virtual DOM is a lightweight copy of the actual DOM. React uses it to optimize rendering by comparing the virtual DOM with the real DOM and only updating what has changed. This process is called reconciliation.',
    response_format: 'text',
    model: 'gpt-4',
    timestamp: Date.now() - 7200000, // 2 hours ago
    token_count: 850,
    tags: JSON.stringify(['react', 'virtual-dom', 'performance']),
    notes: undefined,
    is_archived: 0,
  },
  {
    id: '3',
    session_id: 'session-2',
    provider: 'gemini',
    prompt: 'How does TypeScript improve JavaScript development?',
    response:
      'TypeScript adds static typing to JavaScript, which helps catch errors during development rather than at runtime. It provides better IDE support with autocomplete, refactoring tools, and inline documentation. TypeScript also enables better code organization through interfaces and type definitions.',
    response_format: 'text',
    model: 'gemini-pro',
    timestamp: Date.now() - 10800000, // 3 hours ago
    token_count: 1450,
    tags: JSON.stringify(['typescript', 'javascript', 'types']),
    notes: 'Comprehensive overview',
    is_archived: 0,
  },
  {
    id: '4',
    session_id: 'session-2',
    provider: 'claude',
    prompt: 'What are the benefits of using TanStack Table?',
    response:
      'TanStack Table (formerly React Table) is a headless UI library for building powerful tables and datagrids. It provides: 1) Full control over markup and styles, 2) Built-in sorting, filtering, pagination, 3) Excellent performance with virtual scrolling, 4) TypeScript support, 5) Framework agnostic core with adapters for React, Vue, Solid, and Svelte.',
    response_format: 'text',
    model: 'claude-3-sonnet-20240229',
    timestamp: Date.now() - 14400000, // 4 hours ago
    token_count: 2100,
    tags: JSON.stringify(['tanstack', 'react', 'tables', 'ui']),
    notes: undefined,
    is_archived: 0,
  },
  {
    id: '5',
    session_id: 'session-3',
    provider: 'perplexity',
    prompt: 'Explain database indexing strategies',
    response:
      'Database indexing improves query performance by creating data structures that enable faster data retrieval. Common strategies include: B-tree indexes for range queries, Hash indexes for equality comparisons, Bitmap indexes for columns with low cardinality, and Full-text indexes for text search. Choose indexes based on query patterns and data characteristics.',
    response_format: 'text',
    model: 'pplx-70b-online',
    timestamp: Date.now() - 18000000, // 5 hours ago
    token_count: 1680,
    tags: JSON.stringify(['database', 'indexing', 'performance', 'sql']),
    notes: 'Good technical depth',
    is_archived: 0,
  },
  {
    id: '6',
    session_id: 'session-4',
    provider: 'chatgpt',
    prompt: 'Best practices for API design',
    response:
      'Key API design principles: 1) Use RESTful conventions (GET, POST, PUT, DELETE), 2) Version your API (/v1/), 3) Use proper HTTP status codes, 4) Implement pagination for large datasets, 5) Provide clear error messages, 6) Document with OpenAPI/Swagger, 7) Use authentication and rate limiting, 8) Keep responses consistent.',
    response_format: 'text',
    model: 'gpt-4-turbo',
    timestamp: Date.now() - 86400000, // 1 day ago
    token_count: 950,
    tags: JSON.stringify(['api', 'rest', 'design', 'best-practices']),
    notes: undefined,
    is_archived: 0,
  },
  {
    id: '7',
    session_id: 'session-5',
    provider: 'gemini',
    prompt: 'What is dependency injection?',
    response:
      'Dependency injection is a design pattern where dependencies are provided to a class rather than the class creating them itself. This promotes loose coupling, testability, and flexibility. Common approaches include constructor injection, setter injection, and interface injection.',
    response_format: 'text',
    model: 'gemini-pro',
    timestamp: Date.now() - 172800000, // 2 days ago
    token_count: 720,
    tags: JSON.stringify(['design-patterns', 'di', 'architecture']),
    notes: 'Clear explanation',
    is_archived: 0,
  },
  {
    id: '8',
    session_id: 'session-6',
    provider: 'claude',
    prompt: 'Explain microservices architecture',
    response:
      'Microservices architecture structures an application as a collection of loosely coupled services. Each service is independently deployable, scalable, and maintainable. Benefits include: better scalability, technology diversity, fault isolation, and easier deployment. Challenges: distributed system complexity, data consistency, and inter-service communication.',
    response_format: 'text',
    model: 'claude-3-opus-20240229',
    timestamp: Date.now() - 259200000, // 3 days ago
    token_count: 1850,
    tags: JSON.stringify(['microservices', 'architecture', 'distributed']),
    notes: undefined,
    is_archived: 0,
  },
]

export function SearchFilterDemo() {
  const [selectedRows, setSelectedRows] = useState<CaptureData[]>([])
  const [filters, setFilters] = useState<SearchFilters>({
    searchText: '',
    providers: [],
    tags: [],
    startDate: undefined,
    endDate: undefined,
  })

  // Extract unique providers and tags from sample data
  const availableProviders = useMemo(() => {
    return Array.from(new Set(sampleData.map((d) => d.provider)))
  }, [])

  const availableTags = useMemo(() => {
    const allTags = new Set<string>()
    sampleData.forEach((d) => {
      if (d.tags) {
        try {
          const tags = JSON.parse(d.tags)
          tags.forEach((tag: string) => allTags.add(tag))
        } catch (e) {
          // ignore
        }
      }
    })
    return Array.from(allTags).sort()
  }, [])

  // Apply filters to data
  const filteredData = useMemo(() => {
    return sampleData.filter((item) => {
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
        try {
          const itemTags = item.tags ? JSON.parse(item.tags) : []
          const hasMatchingTag = filters.tags.some((tag) =>
            itemTags.includes(tag)
          )
          if (!hasMatchingTag) return false
        } catch (e) {
          return false
        }
      }

      // Date range filter
      if (filters.startDate) {
        if (item.timestamp < filters.startDate.getTime()) return false
      }
      if (filters.endDate) {
        // End of day
        const endOfDay = new Date(filters.endDate)
        endOfDay.setHours(23, 59, 59, 999)
        if (item.timestamp > endOfDay.getTime()) return false
      }

      return true
    })
  }, [filters])

  const handleRowSelectionChange = (rows: CaptureData[]) => {
    setSelectedRows(rows)
    console.log('Selected rows:', rows)
  }

  return (
    <div className="container mx-auto py-10">
      <div className="space-y-4">
        <div>
          <h1 className="text-3xl font-bold">
            Search & Filter System Demo
          </h1>
          <p className="text-muted-foreground mt-2">
            Comprehensive filtering with text search, date ranges, multi-select,
            and saved presets
          </p>
        </div>

        {/* Search and Filter Panel */}
        <SearchFilterPanel
          onFiltersChange={setFilters}
          resultCount={filteredData.length}
          availableProviders={availableProviders}
          availableTags={availableTags}
        />

        {/* Selected rows info */}
        {selectedRows.length > 0 && (
          <div className="p-4 border rounded-md bg-muted/50">
            <h3 className="font-semibold mb-2">
              Selected Items ({selectedRows.length}):
            </h3>
            <ul className="space-y-1">
              {selectedRows.map((row) => (
                <li key={row.id} className="text-sm">
                  {row.provider} - {row.prompt.substring(0, 50)}...
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Data Table */}
        <ResearchDataTable
          data={filteredData}
          onRowSelectionChange={handleRowSelectionChange}
        />
      </div>
    </div>
  )
}
