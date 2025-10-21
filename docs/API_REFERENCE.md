# DeepResearch API Reference

Complete reference for the IPC (Inter-Process Communication) API between the renderer process (React UI) and main process (Electron backend).

---

## Table of Contents

- [Overview](#overview)
- [Type Definitions](#type-definitions)
- [Window Controls](#window-controls)
- [Authentication API](#authentication-api)
- [Session Management API](#session-management-api)
- [Data Operations API](#data-operations-api)
- [Export API](#export-api)
- [Error Handling](#error-handling)
- [Usage Examples](#usage-examples)

---

## Overview

DeepResearch uses Electron's IPC (Inter-Process Communication) to enable secure communication between the renderer process (your React UI) and the main process (Node.js backend with database access).

### Architecture

```
┌─────────────────────────────────────────────┐
│  Renderer Process (React)                   │
│  ┌───────────────────────────────────────┐  │
│  │  window.electronAPI                   │  │
│  │  ├── window                            │  │
│  │  ├── auth                              │  │
│  │  ├── sessions                          │  │
│  │  ├── data                              │  │
│  │  └── export                            │  │
│  └───────────────────────────────────────┘  │
└─────────────────────────────────────────────┘
                    ↕ IPC
┌─────────────────────────────────────────────┐
│  Main Process (Electron/Node.js)            │
│  ┌───────────────────────────────────────┐  │
│  │  IPC Handlers                          │  │
│  │  ├── Session Manager                   │  │
│  │  ├── Database Operations               │  │
│  │  ├── File System                       │  │
│  │  └── BrowserView Controller            │  │
│  └───────────────────────────────────────┘  │
└─────────────────────────────────────────────┘
```

### Accessing the API

All APIs are exposed via the `window.electronAPI` object in the renderer process:

```typescript
// TypeScript
const api = window.electronAPI

// Access namespaced APIs
api.sessions.create(...)
api.data.getCaptures(...)
api.export.writeJson(...)
```

---

## Type Definitions

### Core Types

#### User

```typescript
interface User {
  userId: string          // Unique user identifier
  email: string           // User's email address
  name: string            // Display name
  avatarUrl?: string      // Optional profile picture URL
  googleId?: string       // Google OAuth ID (if using Google auth)
  createdAt: Date         // Account creation timestamp
  lastLoginAt?: Date      // Last login timestamp
}
```

#### AISession

```typescript
interface AISession {
  sessionId: string       // Unique session identifier (UUID)
  userId: string          // Owner user ID
  provider: 'claude' | 'openai' | 'gemini' | 'custom'  // AI provider type
  sessionName: string     // User-friendly session name
  active: boolean         // Is session currently active
  lastActivity: Date      // Last interaction timestamp
  contextTags: string[]   // Associated tags for organization
}
```

#### CapturedResponse

```typescript
interface CapturedResponse {
  responseId: string      // Unique capture identifier (UUID)
  sessionId: string       // Parent session ID
  content: string         // AI response content
  timestamp: Date         // Capture timestamp
  provider: string        // AI provider name
  tokens: {               // Token usage information
    input: number         // Input tokens
    output: number        // Output tokens
    total: number         // Total tokens
  }
  metadata: Record<string, unknown>  // Additional metadata
}
```

#### Session Config

```typescript
interface SessionConfig {
  provider: 'claude' | 'openai' | 'gemini' | 'custom'
  name: string            // Session display name
  url?: string            // Custom URL (required for 'custom' provider)
}
```

#### Filters

```typescript
interface CaptureFilters {
  provider?: string | string[]     // Filter by provider(s)
  sessionId?: string               // Filter by session
  startDate?: Date                 // Filter by date range start
  endDate?: Date                   // Filter by date range end
  tags?: string[]                  // Filter by tags (AND logic)
  isArchived?: boolean             // Include/exclude archived
  limit?: number                   // Max results to return
  offset?: number                  // Pagination offset
}
```

---

## Window Controls

Basic window management functions.

### minimizeWindow()

Minimizes the application window.

**Syntax:**
```typescript
window.electronAPI.minimizeWindow(): void
```

**Example:**
```typescript
const handleMinimize = () => {
  window.electronAPI.minimizeWindow()
}
```

### maximizeWindow()

Maximizes or restores the application window.

**Syntax:**
```typescript
window.electronAPI.maximizeWindow(): void
```

**Example:**
```typescript
const handleMaximize = () => {
  window.electronAPI.maximizeWindow()
}
```

### closeWindow()

Closes the application window.

**Syntax:**
```typescript
window.electronAPI.closeWindow(): void
```

**Example:**
```typescript
const handleClose = () => {
  if (confirm('Are you sure you want to close?')) {
    window.electronAPI.closeWindow()
  }
}
```

---

## Authentication API

> **Note:** Auth API is currently a placeholder for future OAuth implementation.

### auth.login()

Initiates OAuth login flow for a provider.

**Syntax:**
```typescript
window.electronAPI.auth.login(provider: string): Promise<User>
```

**Parameters:**
- `provider` (string): OAuth provider ('google', 'github', etc.)

**Returns:**
- Promise resolving to User object

**Example:**
```typescript
const handleLogin = async () => {
  try {
    const user = await window.electronAPI.auth.login('google')
    console.log('Logged in:', user.name)
  } catch (error) {
    console.error('Login failed:', error)
  }
}
```

### auth.logout()

Logs out the current user.

**Syntax:**
```typescript
window.electronAPI.auth.logout(): Promise<void>
```

**Example:**
```typescript
const handleLogout = async () => {
  await window.electronAPI.auth.logout()
  // Redirect to login page
}
```

### auth.getSession()

Retrieves the current user session.

**Syntax:**
```typescript
window.electronAPI.auth.getSession(): Promise<User | null>
```

**Returns:**
- Promise resolving to User object if logged in, null otherwise

**Example:**
```typescript
const checkAuth = async () => {
  const user = await window.electronAPI.auth.getSession()
  if (!user) {
    // Redirect to login
  }
}
```

---

## Session Management API

Manage AI provider sessions (tabs).

### sessions.create()

Creates a new AI provider session.

**Syntax:**
```typescript
window.electronAPI.sessions.create(config: SessionConfig): Promise<AISession>
```

**Parameters:**
- `config` (SessionConfig):
  - `provider`: 'claude' | 'openai' | 'gemini' | 'custom'
  - `name`: Session display name
  - `url?`: Custom URL (required if provider is 'custom')

**Returns:**
- Promise resolving to created AISession object

**Example:**
```typescript
// Create Claude session
const session = await window.electronAPI.sessions.create({
  provider: 'claude',
  name: 'Research Project A'
})

// Create custom session
const customSession = await window.electronAPI.sessions.create({
  provider: 'custom',
  name: 'Local AI',
  url: 'http://localhost:8000'
})
```

**Errors:**
- Throws if provider is 'custom' but url is not provided
- Throws if session creation fails

### sessions.activate()

Activates a session (makes it the active tab).

**Syntax:**
```typescript
window.electronAPI.sessions.activate(sessionId: string): Promise<void>
```

**Parameters:**
- `sessionId` (string): ID of session to activate

**Example:**
```typescript
await window.electronAPI.sessions.activate(session.sessionId)
```

### sessions.delete()

Deletes a session.

**Syntax:**
```typescript
window.electronAPI.sessions.delete(sessionId: string): Promise<void>
```

**Parameters:**
- `sessionId` (string): ID of session to delete

**Example:**
```typescript
const handleDeleteSession = async (id: string) => {
  if (confirm('Delete this session? Captured data will be preserved.')) {
    await window.electronAPI.sessions.delete(id)
  }
}
```

**Note:** Deleting a session does NOT delete captured responses from that session.

### sessions.list()

Lists all sessions.

**Syntax:**
```typescript
window.electronAPI.sessions.list(includeInactive?: boolean): Promise<AISession[]>
```

**Parameters:**
- `includeInactive` (boolean, optional): Include inactive/closed sessions (default: false)

**Returns:**
- Promise resolving to array of AISession objects

**Example:**
```typescript
// Get active sessions only
const activeSessions = await window.electronAPI.sessions.list()

// Get all sessions including inactive
const allSessions = await window.electronAPI.sessions.list(true)
```

### sessions.getActive()

Gets the currently active session.

**Syntax:**
```typescript
window.electronAPI.sessions.getActive(): Promise<AISession | null>
```

**Returns:**
- Promise resolving to active AISession or null

**Example:**
```typescript
const activeSession = await window.electronAPI.sessions.getActive()
if (activeSession) {
  console.log('Active:', activeSession.sessionName)
}
```

---

## Data Operations API

Manage captured AI responses.

### data.getCaptures()

Retrieves captured responses with optional filters.

**Syntax:**
```typescript
window.electronAPI.data.getCaptures(filters?: CaptureFilters): Promise<CapturedResponse[]>
```

**Parameters:**
- `filters` (CaptureFilters, optional): Filter criteria

**Returns:**
- Promise resolving to array of CapturedResponse objects

**Example:**
```typescript
// Get all captures
const allCaptures = await window.electronAPI.data.getCaptures()

// Get captures from specific provider
const claudeCaptures = await window.electronAPI.data.getCaptures({
  provider: 'claude'
})

// Get recent captures (last 7 days)
const recentCaptures = await window.electronAPI.data.getCaptures({
  startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
})

// Get captures with pagination
const pageOne = await window.electronAPI.data.getCaptures({
  limit: 50,
  offset: 0
})
```

### data.getCapture()

Retrieves a single capture by ID.

**Syntax:**
```typescript
window.electronAPI.data.getCapture(captureId: string): Promise<CapturedResponse | null>
```

**Parameters:**
- `captureId` (string): ID of capture to retrieve

**Returns:**
- Promise resolving to CapturedResponse or null if not found

**Example:**
```typescript
const capture = await window.electronAPI.data.getCapture('abc-123')
if (capture) {
  console.log('Prompt:', capture.content)
}
```

### data.searchCaptures()

Full-text search across all captures.

**Syntax:**
```typescript
window.electronAPI.data.searchCaptures(
  query: string,
  filters?: CaptureFilters
): Promise<CapturedResponse[]>
```

**Parameters:**
- `query` (string): Search query (uses FTS5 full-text search)
- `filters` (CaptureFilters, optional): Additional filters

**Returns:**
- Promise resolving to array of matching CapturedResponse objects

**Example:**
```typescript
// Simple search
const results = await window.electronAPI.data.searchCaptures('python')

// Search with filters
const filteredResults = await window.electronAPI.data.searchCaptures('python', {
  provider: 'claude',
  startDate: new Date('2025-01-01')
})

// Phrase search
const phraseResults = await window.electronAPI.data.searchCaptures('"machine learning"')
```

**Search Syntax:**
- Simple: `"python"` - finds "python" anywhere
- Multiple: `"python flask"` - finds captures with both terms
- Phrase: `"machine learning"` - exact phrase match
- Exclude: `"python -django"` - python but not django

### data.updateTags()

Updates tags for a capture.

**Syntax:**
```typescript
window.electronAPI.data.updateTags(
  captureId: string,
  tags: string[]
): Promise<void>
```

**Parameters:**
- `captureId` (string): ID of capture to update
- `tags` (string[]): New array of tags (replaces existing)

**Example:**
```typescript
// Set tags
await window.electronAPI.data.updateTags('abc-123', [
  'python',
  'tutorial',
  'project-x'
])

// Clear tags
await window.electronAPI.data.updateTags('abc-123', [])
```

### data.updateNotes()

Updates notes for a capture.

**Syntax:**
```typescript
window.electronAPI.data.updateNotes(
  captureId: string,
  notes: string
): Promise<void>
```

**Parameters:**
- `captureId` (string): ID of capture to update
- `notes` (string): Note text (replaces existing)

**Example:**
```typescript
await window.electronAPI.data.updateNotes(
  'abc-123',
  'Great explanation of recursion. Use for CS101 tutorial.'
)
```

### data.setArchived()

Archives or unarchives a capture.

**Syntax:**
```typescript
window.electronAPI.data.setArchived(
  captureId: string,
  isArchived: boolean
): Promise<void>
```

**Parameters:**
- `captureId` (string): ID of capture to update
- `isArchived` (boolean): true to archive, false to unarchive

**Example:**
```typescript
// Archive
await window.electronAPI.data.setArchived('abc-123', true)

// Unarchive
await window.electronAPI.data.setArchived('abc-123', false)
```

### data.deleteCapture()

Permanently deletes a capture.

**Syntax:**
```typescript
window.electronAPI.data.deleteCapture(captureId: string): Promise<void>
```

**Parameters:**
- `captureId` (string): ID of capture to delete

**Example:**
```typescript
const handleDelete = async (id: string) => {
  if (confirm('Permanently delete this capture?')) {
    await window.electronAPI.data.deleteCapture(id)
  }
}
```

**Warning:** This is permanent and cannot be undone.

### data.getStats()

Gets database statistics.

**Syntax:**
```typescript
window.electronAPI.data.getStats(): Promise<{
  totalCaptures: number
  capturesByProvider: Record<string, number>
  oldestCapture: Date | null
  newestCapture: Date | null
  totalTags: number
  databaseSize: number  // bytes
}>
```

**Returns:**
- Promise resolving to statistics object

**Example:**
```typescript
const stats = await window.electronAPI.data.getStats()
console.log(`Total captures: ${stats.totalCaptures}`)
console.log(`Database size: ${(stats.databaseSize / 1024 / 1024).toFixed(2)} MB`)
```

---

## Export API

Export captured data to various formats.

### export.showSaveDialog()

Shows native save file dialog.

**Syntax:**
```typescript
window.electronAPI.export.showSaveDialog(options: {
  defaultPath?: string
  filters?: Array<{ name: string; extensions: string[] }>
}): Promise<string | null>
```

**Parameters:**
- `options`:
  - `defaultPath`: Suggested filename
  - `filters`: File type filters

**Returns:**
- Promise resolving to selected file path or null if cancelled

**Example:**
```typescript
const filePath = await window.electronAPI.export.showSaveDialog({
  defaultPath: 'deepresearch-export.json',
  filters: [
    { name: 'JSON', extensions: ['json'] },
    { name: 'All Files', extensions: ['*'] }
  ]
})

if (filePath) {
  // User selected a path
}
```

### export.writeJson()

Writes data to JSON file.

**Syntax:**
```typescript
window.electronAPI.export.writeJson(
  filePath: string,
  data: any
): Promise<void>
```

**Parameters:**
- `filePath` (string): Destination file path
- `data` (any): Data to serialize to JSON

**Example:**
```typescript
const captures = await window.electronAPI.data.getCaptures()
await window.electronAPI.export.writeJson(
  '/path/to/export.json',
  captures
)
```

### export.writeJsonStream()

Streams captures to JSON file (memory efficient for large datasets).

**Syntax:**
```typescript
window.electronAPI.export.writeJsonStream(
  filePath: string,
  filters?: CaptureFilters
): Promise<void>
```

**Parameters:**
- `filePath` (string): Destination file path
- `filters` (CaptureFilters, optional): Filter criteria

**Example:**
```typescript
// Export all captures (streaming)
await window.electronAPI.export.writeJsonStream('/path/to/export.json')

// Export filtered captures
await window.electronAPI.export.writeJsonStream('/path/to/claude.json', {
  provider: 'claude'
})
```

**Benefits:**
- Memory efficient (processes in chunks)
- Progress events
- Works with large datasets (10,000+ captures)

### export.writeCsv()

Exports captures to CSV file.

**Syntax:**
```typescript
window.electronAPI.export.writeCsv(
  filePath: string,
  filters?: CaptureFilters
): Promise<void>
```

**Parameters:**
- `filePath` (string): Destination file path
- `filters` (CaptureFilters, optional): Filter criteria

**Example:**
```typescript
await window.electronAPI.export.writeCsv('/path/to/export.csv', {
  provider: 'claude',
  startDate: new Date('2025-01-01')
})
```

**CSV Columns:**
- responseId
- sessionId
- provider
- content
- timestamp
- tags (comma-separated)
- notes

### export.onProgress()

Subscribes to export progress events.

**Syntax:**
```typescript
window.electronAPI.export.onProgress(
  callback: (progress: {
    processed: number
    total: number
    percentage: number
  }) => void
): () => void
```

**Parameters:**
- `callback`: Function called with progress updates

**Returns:**
- Cleanup function to remove listener

**Example:**
```typescript
const ProgressBar = () => {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const cleanup = window.electronAPI.export.onProgress((prog) => {
      setProgress(prog.percentage)
    })

    return cleanup  // Remove listener on unmount
  }, [])

  return <progress value={progress} max={100} />
}
```

---

## Error Handling

All IPC methods return Promises and should be wrapped in try-catch blocks.

### Error Types

```typescript
interface IPCError {
  code: string      // Error code (e.g., 'NOT_FOUND', 'VALIDATION_ERROR')
  message: string   // Human-readable error message
  details?: any     // Additional error context
}
```

### Common Error Codes

| Code | Description | Resolution |
|------|-------------|------------|
| `NOT_FOUND` | Resource not found | Verify ID exists |
| `VALIDATION_ERROR` | Invalid input | Check parameters |
| `PERMISSION_DENIED` | Insufficient permissions | Check user permissions |
| `DATABASE_ERROR` | Database operation failed | Check database integrity |
| `FILE_ERROR` | File operation failed | Check file permissions |

### Example Error Handling

```typescript
try {
  const session = await window.electronAPI.sessions.create({
    provider: 'claude',
    name: 'My Session'
  })
} catch (error) {
  if (error.code === 'VALIDATION_ERROR') {
    alert('Invalid session configuration')
  } else if (error.code === 'DATABASE_ERROR') {
    alert('Failed to save session. Please try again.')
  } else {
    console.error('Unexpected error:', error)
  }
}
```

---

## Usage Examples

### Complete Workflow Examples

#### Creating a Session and Viewing Captures

```typescript
// 1. Create a new Claude session
const session = await window.electronAPI.sessions.create({
  provider: 'claude',
  name: 'Research Session'
})

// 2. Activate the session
await window.electronAPI.sessions.activate(session.sessionId)

// 3. User interacts with Claude in the embedded browser
// ... captures happen automatically ...

// 4. Retrieve captures from this session
const captures = await window.electronAPI.data.getCaptures({
  sessionId: session.sessionId
})

// 5. Display captures in UI
console.log(`Captured ${captures.length} responses`)
```

#### Search and Export Workflow

```typescript
// 1. Search for Python-related captures
const results = await window.electronAPI.data.searchCaptures('python')

// 2. Show save dialog
const filePath = await window.electronAPI.export.showSaveDialog({
  defaultPath: 'python-captures.json',
  filters: [{ name: 'JSON', extensions: ['json'] }]
})

if (!filePath) return  // User cancelled

// 3. Export with progress tracking
const cleanup = window.electronAPI.export.onProgress((progress) => {
  console.log(`Export progress: ${progress.percentage}%`)
})

try {
  await window.electronAPI.export.writeJsonStream(filePath, {
    // Export only Python-related captures
  })
  console.log('Export complete!')
} finally {
  cleanup()  // Remove progress listener
}
```

#### Tag Management

```typescript
// 1. Get all captures
const captures = await window.electronAPI.data.getCaptures()

// 2. Bulk tag captures from a project
for (const capture of captures) {
  const currentTags = capture.metadata.tags || []
  await window.electronAPI.data.updateTags(capture.responseId, [
    ...currentTags,
    'project-x',
    'research'
  ])
}

// 3. Search by tag
const projectCaptures = await window.electronAPI.data.getCaptures({
  tags: ['project-x']
})
```

---

## TypeScript Support

DeepResearch is fully typed. Import types from the shared types module:

```typescript
import type {
  AISession,
  CapturedResponse,
  User
} from '@/shared/types'

// Access API with full type safety
const api = window.electronAPI

// TypeScript knows the return types
const sessions: AISession[] = await api.sessions.list()
const captures: CapturedResponse[] = await api.data.getCaptures()
```

---

## Security Considerations

### IPC Security

- All IPC communication is validated in the main process
- Input sanitization prevents injection attacks
- Context isolation ensures renderer cannot access Node.js directly
- Only whitelisted IPC channels are exposed

### Best Practices

1. **Never trust user input** - Validate all parameters
2. **Use parameterized queries** - Prevent SQL injection
3. **Sanitize file paths** - Prevent directory traversal
4. **Rate limit operations** - Prevent abuse
5. **Log errors** - Aid debugging without exposing sensitive data

---

## Performance Tips

### Efficient Data Fetching

```typescript
// ✅ Good: Use filters to limit results
const recent = await window.electronAPI.data.getCaptures({
  limit: 100,
  startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
})

// ❌ Bad: Fetch all data then filter in JS
const all = await window.electronAPI.data.getCaptures()
const recent = all.filter(c => c.timestamp > someDate)
```

### Streaming Large Exports

```typescript
// ✅ Good: Use streaming for large datasets
await window.electronAPI.export.writeJsonStream(path, filters)

// ❌ Bad: Load all in memory then write
const data = await window.electronAPI.data.getCaptures()
await window.electronAPI.export.writeJson(path, data)
```

### Debounce Search

```typescript
// ✅ Good: Debounce search input
const debouncedSearch = debounce(async (query) => {
  const results = await window.electronAPI.data.searchCaptures(query)
  setResults(results)
}, 300)

// ❌ Bad: Search on every keystroke
onChange={(e) => {
  window.electronAPI.data.searchCaptures(e.target.value)
}}
```

---

## Further Reading

- [Architecture Documentation](./ARCHITECTURE_SIMPLIFIED.md)
- [Usage Guide](./USAGE_GUIDE.md)
- [Zustand Stores](./ZUSTAND_STORES.md)
- [Electron IPC Documentation](https://www.electronjs.org/docs/latest/tutorial/ipc)

---

**Questions or Issues?** [Open an issue](https://github.com/yourusername/DeepResearch/issues) or [start a discussion](https://github.com/yourusername/DeepResearch/discussions)
