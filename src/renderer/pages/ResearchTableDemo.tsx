import { useState } from 'react'
import { ResearchDataTable, CaptureData } from '@/renderer/components/organisms/ResearchDataTable'

// Sample data for testing
const sampleData: CaptureData[] = [
  {
    id: '1',
    session_id: 'session-1',
    provider: 'claude',
    prompt: 'What is the difference between React hooks and class components?',
    response: 'React hooks are functions that let you use state and other React features in functional components. Class components use ES6 classes and lifecycle methods. Hooks provide a more concise and easier to understand way to manage state and side effects.',
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
    response: 'The virtual DOM is a lightweight copy of the actual DOM. React uses it to optimize rendering by comparing the virtual DOM with the real DOM and only updating what has changed. This process is called reconciliation.',
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
    response: 'TypeScript adds static typing to JavaScript, which helps catch errors during development rather than at runtime. It provides better IDE support with autocomplete, refactoring tools, and inline documentation. TypeScript also enables better code organization through interfaces and type definitions.',
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
    response: 'TanStack Table (formerly React Table) is a headless UI library for building powerful tables and datagrids. It provides: 1) Full control over markup and styles, 2) Built-in sorting, filtering, pagination, 3) Excellent performance with virtual scrolling, 4) TypeScript support, 5) Framework agnostic core with adapters for React, Vue, Solid, and Svelte.',
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
    response: 'Database indexing improves query performance by creating data structures that enable faster data retrieval. Common strategies include: B-tree indexes for range queries, Hash indexes for equality comparisons, Bitmap indexes for columns with low cardinality, and Full-text indexes for text search. Choose indexes based on query patterns and data characteristics.',
    response_format: 'text',
    model: 'pplx-70b-online',
    timestamp: Date.now() - 18000000, // 5 hours ago
    token_count: 1680,
    tags: JSON.stringify(['database', 'indexing', 'performance', 'sql']),
    notes: 'Good technical depth',
    is_archived: 0,
  },
]

export function ResearchTableDemo() {
  const [selectedRows, setSelectedRows] = useState<CaptureData[]>([])

  const handleRowSelectionChange = (rows: CaptureData[]) => {
    setSelectedRows(rows)
    console.log('Selected rows:', rows)
  }

  return (
    <div className="container mx-auto py-10">
      <div className="space-y-4">
        <div>
          <h1 className="text-3xl font-bold">Research Data Table Demo</h1>
          <p className="text-muted-foreground mt-2">
            Demonstrating TanStack Table with virtual scrolling, sorting,
            filtering, and row selection
          </p>
        </div>

        {selectedRows.length > 0 && (
          <div className="p-4 border rounded-md bg-muted/50">
            <h3 className="font-semibold mb-2">Selected Items:</h3>
            <ul className="space-y-1">
              {selectedRows.map((row) => (
                <li key={row.id} className="text-sm">
                  {row.provider} - {row.prompt.substring(0, 50)}...
                </li>
              ))}
            </ul>
          </div>
        )}

        <ResearchDataTable
          data={sampleData}
          onRowSelectionChange={handleRowSelectionChange}
        />
      </div>
    </div>
  )
}
