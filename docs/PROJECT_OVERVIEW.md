# DeepResearch - Project Overview

Comprehensive technical overview of the DeepResearch codebase for understanding architecture, components, and testing needs.

**Version:** 0.1.0  
**Last Updated:** 2025-10-20  
**Status:** Active Development  

---

## Table of Contents

1. [Project Summary](#project-summary)
2. [Architecture Overview](#architecture-overview)
3. [Tech Stack](#tech-stack)
4. [Project Structure](#project-structure)
5. [Core Components](#core-components)
6. [Data Flow](#data-flow)
7. [Testing Needs Assessment](#testing-needs-assessment)
8. [Key Modules to Test](#key-modules-to-test)
9. [Development Patterns](#development-patterns)

---

## Project Summary

### What is DeepResearch?

DeepResearch is a local-first Electron desktop application that:

- **Captures** AI responses from multiple providers (Claude, ChatGPT, Gemini, Perplexity)
- **Stores** all data locally in SQLite database
- **Organizes** captures with tags, notes, and full-text search
- **Exports** data in multiple formats (JSON, CSV)
- **Runs** without requiring API keys (uses web session interception)

### Key Innovation

Browser-based interception using Chrome DevTools Protocol (CDP) + content injection to capture responses without API access or costs.

### Use Cases

- **Research:** Gather and organize AI responses for analysis
- **Knowledge Base:** Build searchable archive of interactions
- **Comparison:** Compare responses across providers
- **Data Collection:** Export for further analysis

---

## Architecture Overview

### High-Level System Design

```
┌─────────────────────────────────────────────────────┐
│         ELECTRON MAIN PROCESS (Node.js)             │
├─────────────────────────────────────────────────────┤
│ ┌────────────────────────────────────────────────┐ │
│ │ Session Manager (BrowserView management)       │ │
│ │ - Creates isolated browser sessions             │ │
│ │ - Manages provider partitions                   │ │
│ │ - Lifecycle: create, activate, delete           │ │
│ └────────────────────────────────────────────────┘ │
│                                                     │
│ ┌────────────────────────────────────────────────┐ │
│ │ Response Interceptor (CDP + Content Inject)    │ │
│ │ - Attaches Chrome DevTools Protocol            │ │
│ │ - Monitors Fetch domain for API calls          │ │
│ │ - Extracts response bodies                     │ │
│ │ - Parses SSE streams                           │ │
│ └────────────────────────────────────────────────┘ │
│                                                     │
│ ┌────────────────────────────────────────────────┐ │
│ │ Database Service (SQLite)                      │ │
│ │ - CRUD operations for sessions & captures      │ │
│ │ - FTS5 full-text search                        │ │
│ │ - Query filtering and aggregation              │ │
│ └────────────────────────────────────────────────┘ │
│                                                     │
│ ┌────────────────────────────────────────────────┐ │
│ │ IPC Handler Registration                       │ │
│ │ - Session operations (create, delete, list)    │ │
│ │ - Data operations (get, search, update)        │ │
│ │ - Export operations (JSON, CSV streaming)      │ │
│ └────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
              ↕ Type-Safe IPC Messages ↕
┌─────────────────────────────────────────────────────┐
│      ELECTRON RENDERER PROCESS (React 18)           │
├─────────────────────────────────────────────────────┤
│ ┌────────────────────────────────────────────────┐ │
│ │ React App (React Router)                       │ │
│ │ - Login page (future: with better-auth)        │ │
│ │ - Main layout with resizable panels             │ │
│ └────────────────────────────────────────────────┘ │
│                                                     │
│ ┌────────────────────────────────────────────────┐ │
│ │ Zustand State Stores                           │ │
│ │ - capturesStore (research data state)          │ │
│ │ - sessionStore (session management)            │ │
│ │ - uiStore (UI state)                           │ │
│ │ - settingsStore (user preferences)             │ │
│ └────────────────────────────────────────────────┘ │
│                                                     │
│ ┌────────────────────────────────────────────────┐ │
│ │ UI Components (shadcn/ui + Tailwind)           │ │
│ │ - ResearchDataTable (TanStack Table)            │ │
│ │ - SearchFilterPanel (filtering & search)        │ │
│ │ - Session management dialogs                   │ │
│ │ - Export dialog                                │ │
│ │ - Settings dialog                              │ │
│ └────────────────────────────────────────────────┘ │
│                                                     │
│ ┌────────────────────────────────────────────────┐ │
│ │ Utility Libraries                              │ │
│ │ - export-utils.ts (data formatting)            │ │
│ │ - utils.ts (classname utilities)               │ │
│ │ - toast.ts (notifications)                     │ │
│ └────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

### Process Communication

- **IPC Channel:** Electron's `ipcMain.handle()` ↔ `window.electronAPI`
- **Preload Script:** Exposes safe IPC API via contextBridge
- **Security:** Context isolation, no Node.js in renderer

---

## Tech Stack

### Core Framework
| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| Desktop | Electron | 28.x | Cross-platform app framework |
| Runtime | Node.js | 18+ | Main process runtime |
| Build | Vite | 5.x | Fast dev server & builder |
| Language | TypeScript | 5.3+ | Type safety |

### Frontend
| Component | Technology | Version | Purpose |
|-----------|-----------|---------|---------|
| UI Framework | React | 18.2 | Component-based UI |
| State Management | Zustand | 4.5 | Lightweight stores |
| UI Components | shadcn/ui | - | Radix UI + Tailwind |
| Data Grid | TanStack Table | 8.10 | Virtual scrolling table |
| Styling | Tailwind CSS | 3.4 | Utility-first CSS |
| Icons | Lucide React | 0.300 | Icon library |
| Routing | React Router | 6.21 | Client-side navigation |
| Toast | Sonner | 2.0 | Notifications |
| Panels | react-resizable-panels | 2.0 | Layout management |
| Dates | date-fns | 3.0 | Date utilities |

### Data Layer
| Component | Technology | Version | Purpose |
|-----------|-----------|---------|---------|
| Database | SQLite 3 | - | Local storage |
| Driver | better-sqlite3 | 9.3 | Synchronous bindings |
| Full-Text Search | FTS5 | - | SQLite extension |
| Optional | DuckDB | 0.10 | Analytical queries (future) |

### Development & Testing
| Tool | Version | Purpose |
|------|---------|---------|
| Vitest | 1.2 | Unit testing |
| Playwright | 1.41 | E2E testing |
| ESLint | 8.56 | Code linting |
| Prettier | 3.2 | Code formatting |

---

## Project Structure

### Detailed File Organization

```
DeepResearch/
│
├── src/
│   │
│   ├── main/                          # Electron Main Process
│   │   ├── index.ts                   # App entry point, IPC registration
│   │   │   └── Responsibilities:
│   │   │       - Window creation & lifecycle
│   │   │       - Database initialization
│   │   │       - SessionManager instantiation
│   │   │       - IPC handler registration
│   │   │
│   │   ├── database/
│   │   │   ├── db.ts                  # DatabaseService (Singleton)
│   │   │   │   └── Key Methods:
│   │   │   │       - initialize(), close()
│   │   │   │       - Session: create, read, update, delete
│   │   │   │       - Capture: create, read, update, delete, search
│   │   │   │       - getStats()
│   │   │   │
│   │   │   ├── schema.sql              # SQLite schema (CREATE TABLE statements)
│   │   │   │   └── Tables:
│   │   │   │       - sessions (provider tabs)
│   │   │   │       - captures (AI responses)
│   │   │   │       - captures_fts (full-text search virtual table)
│   │   │   │
│   │   │   └── test-db.ts             # Database test/demo
│   │   │
│   │   ├── session/
│   │   │   └── SessionManager.ts      # Session & BrowserView Manager
│   │   │       └── Key Methods:
│   │   │           - createSession(config)
│   │   │           - activateSession(id)
│   │   │           - deleteSession(id)
│   │   │           - listSessions()
│   │   │           - loadPersistedSessions()
│   │   │           - destroy()
│   │   │
│   │   ├── capture/
│   │   │   └── ResponseInterceptor.ts # CDP Response Capture
│   │   │       └── Key Methods:
│   │   │           - enable()
│   │   │           - disable()
│   │   │           - attachDebugger()
│   │   │           - enableFetchDomain()
│   │   │           - parseSSEStream()
│   │   │           - extractPrompt(), extractModel()
│   │   │
│   │   └── updater/
│   │       └── AutoUpdater.ts         # electron-updater wrapper
│   │
│   ├── preload/
│   │   └── index.ts                   # Preload script
│   │       └── Exposes via contextBridge:
│   │           - electronAPI.session.*
│   │           - electronAPI.data.*
│   │           - electronAPI.export.*
│   │
│   ├── renderer/                      # React Frontend (Vite)
│   │   │
│   │   ├── main.tsx                   # React entry point
│   │   ├── App.tsx                    # Root component with routing
│   │   │
│   │   ├── stores/                    # Zustand State Management
│   │   │   ├── capturesStore.ts       # Research data state
│   │   │   │   └── State:
│   │   │   │       - captures: Capture[]
│   │   │   │       - loading, error
│   │   │   │       - selectedIds
│   │   │   │   └── Actions:
│   │   │   │       - fetchCaptures(filters)
│   │   │   │       - searchCaptures(query, filters)
│   │   │   │       - updateTags, updateNotes, setArchived
│   │   │   │
│   │   │   ├── sessionStore.ts        # Session management state
│   │   │   │   └── State:
│   │   │   │       - sessions: Session[]
│   │   │   │       - activeSessionId
│   │   │   │   └── Actions:
│   │   │   │       - addSession, removeSession
│   │   │   │       - setActiveSession, renameSession
│   │   │   │
│   │   │   ├── uiStore.ts             # UI state (sidebar, modals)
│   │   │   ├── settingsStore.ts       # User preferences
│   │   │   └── index.ts               # Store exports
│   │   │
│   │   ├── components/
│   │   │   ├── ui/                    # Shadcn/UI Components
│   │   │   │   ├── button.tsx         # Radix UI Button
│   │   │   │   ├── dialog.tsx         # Radix UI Dialog
│   │   │   │   ├── input.tsx          # Text input
│   │   │   │   ├── select.tsx         # Dropdown
│   │   │   │   ├── table.tsx          # Table primitives
│   │   │   │   └── ... other UI primitives
│   │   │   │
│   │   │   ├── organisms/             # Complex Components
│   │   │   │   ├── ResearchDataTable.tsx
│   │   │   │   │   └── Responsibilities:
│   │   │   │   │       - Displays capture data in virtual table
│   │   │   │   │       - Sorting, column visibility
│   │   │   │   │       - Row selection
│   │   │   │   │       - Click handlers for edit/delete
│   │   │   │   │
│   │   │   │   └── SearchFilterPanel.tsx
│   │   │   │       └── Responsibilities:
│   │   │   │           - Search input (debounced)
│   │   │   │           - Date range picker
│   │   │   │           - Provider multi-select
│   │   │   │           - Tag chips
│   │   │   │           - Filter reset
│   │   │   │
│   │   │   ├── panels/                # Layout Panels
│   │   │   │   ├── DataPanel.tsx      # Research data panel
│   │   │   │   ├── ProviderTabsPanel.tsx  # Session tabs
│   │   │   │   └── SessionListPanel.tsx   # Session list
│   │   │   │
│   │   │   ├── session/               # Session Dialogs
│   │   │   │   ├── ProviderSelectionDialog.tsx
│   │   │   │   ├── CloseSessionDialog.tsx
│   │   │   │   └── SessionTabs.tsx
│   │   │   │
│   │   │   ├── capture/               # Capture Dialogs
│   │   │   │   ├── CaptureDetailDialog.tsx
│   │   │   │   └── DeleteCaptureDialog.tsx
│   │   │   │
│   │   │   ├── export/                # Export Feature
│   │   │   │   └── ExportDialog.tsx
│   │   │   │
│   │   │   └── settings/              # Settings Feature
│   │   │       └── SettingsDialog.tsx
│   │   │
│   │   ├── layouts/
│   │   │   └── MainLayout.tsx         # Main layout composition
│   │   │       └── Combines:
│   │   │           - Header
│   │   │           - Sidebar
│   │   │           - Session tabs
│   │   │           - Provider panel
│   │   │           - Data panel
│   │   │
│   │   ├── lib/                       # Utilities
│   │   │   ├── export-utils.ts        # Export formatting
│   │   │   │   └── Functions:
│   │   │   │       - convertToJSON()
│   │   │   │       - convertToCSV()
│   │   │   │       - escapeCsvField()
│   │   │   │       - estimateFileSize()
│   │   │   │       - formatBytes()
│   │   │   │       - validateExportData()
│   │   │   │
│   │   │   ├── utils.ts               # Tailwind class utilities
│   │   │   │   └── Functions:
│   │   │   │       - cn() [clsx + tailwind-merge]
│   │   │   │
│   │   │   └── toast.ts               # Toast notifications
│   │   │
│   │   ├── types/                     # TypeScript Types
│   │   │   ├── session.ts             # Session related types
│   │   │   ├── settings.ts            # Settings types
│   │   │   └── global.d.ts            # Global declarations
│   │   │
│   │   ├── pages/                     # Demo Pages
│   │   │   ├── ResearchTableDemo.tsx
│   │   │   └── SearchFilterDemo.tsx
│   │   │
│   │   └── styles/
│   │       └── globals.css            # Tailwind + global styles
│   │
│   └── shared/
│       └── types/
│           └── index.ts               # Types shared between main & renderer
│               └── Interfaces:
│                   - User
│                   - AISession
│                   - CapturedResponse
│
├── docs/                              # Documentation
│   ├── TESTING_GUIDE.md               # This testing guide
│   ├── ARCHITECTURE.md                # Architecture details
│   ├── SETUP.md                       # Setup instructions
│   ├── README.md                      # User documentation
│   └── ...other docs
│
├── tests/                             # Test files (optional structure)
│   ├── e2e/                           # Playwright E2E tests
│   ├── integration/                   # Integration tests
│   └── fixtures/                      # Test data
│
├── build/                             # Electron builder config
│   └── entitlements.mac.plist
│
├── package.json                       # Dependencies & scripts
├── tsconfig.json                      # TypeScript config
├── vite.config.ts                     # Vite config (Electron + React)
├── vitest.config.ts                   # Vitest config (will create)
├── playwright.config.ts               # Playwright config
├── .eslintrc.json                     # ESLint config
├── .prettierrc                        # Prettier config
└── index.html                         # HTML entry point
```

---

## Core Components

### 1. DatabaseService (src/main/database/db.ts)

**Purpose:** Manage all SQLite database operations

**Key Interfaces:**
```typescript
interface Session {
  id: string;                   // UUID
  provider: 'claude' | 'openai' | 'gemini' | 'custom'
  name: string;                 // User-friendly name
  partition: string;            // Electron partition ID
  created_at: number;           // Unix timestamp
  last_active: number;          // Unix timestamp
  is_active: number;            // 0 = archived
  metadata?: string;            // JSON: {lastUrl, etc}
}

interface Capture {
  id: string;                   // UUID
  session_id: string;           // FK to sessions
  provider: string;             // Denormalized
  prompt: string;               // User's input
  response: string;             // AI's response
  response_format?: string;     // 'text', 'markdown', 'code', 'json'
  model?: string;               // 'claude-3-sonnet', 'gpt-4', etc
  timestamp: number;            // Unix timestamp
  token_count?: number;         // Estimated tokens
  tags?: string;                // JSON array
  notes?: string;               // User notes
  is_archived: number;          // 0 or 1
}
```

**Methods:**
- Session CRUD: `createSession()`, `getSession()`, `getSessions()`, `updateSessionActivity()`, `setSessionActive()`, `deleteSession()`
- Capture CRUD: `createCapture()`, `getCapture()`, `getCaptures()`, `searchCaptures()`, `updateCaptureTags()`, `updateCaptureNotes()`, `setCaptureArchived()`, `deleteCapture()`
- Utility: `getStats()`, `initialize()`, `close()`

**Testing Needs:**
- All CRUD operations with various input combinations
- Filter combinations (provider + date range + archived)
- Full-text search accuracy
- Transaction isolation
- Cascade deletes

---

### 2. SessionManager (src/main/session/SessionManager.ts)

**Purpose:** Manage BrowserView instances and session lifecycle

**Key Responsibilities:**
- Create isolated BrowserView for each provider session
- Maintain session state in memory and database
- Handle activation/deactivation of sessions
- Coordinate with ResponseInterceptor for each session
- Persist and restore sessions on app restart

**Methods:**
```typescript
async createSession(config: SessionConfig): Promise<Session>
activateSession(sessionId: string): boolean
async deleteSession(sessionId: string): Promise<boolean>
listSessions(includeInactive?: boolean): Session[]
getActiveSessionId(): string | null
async loadPersistedSessions(): Promise<void>
saveSessionState(sessionId: string): void
async destroy(): Promise<void>
```

**Testing Needs:**
- Session creation with correct partition names
- Activation/deactivation without memory leaks
- Database persistence integration
- ResponseInterceptor lifecycle coordination
- Graceful shutdown

---

### 3. ResponseInterceptor (src/main/capture/ResponseInterceptor.ts)

**Purpose:** Capture AI responses using Chrome DevTools Protocol

**Key Features:**
- CDP debugger attachment
- Fetch domain interception with URL patterns
- SSE (Server-Sent Events) stream parsing
- Request/response body extraction
- Provider-specific parsing logic

**Provider Patterns:**
```typescript
Claude: 
  - *://claude.ai/api/.../completion
  - *://api.anthropic.com/v1/messages

OpenAI:
  - *://chat.openai.com/backend-api/conversation
  - *://api.openai.com/v1/chat/completions

Gemini:
  - *://gemini.google.com/*/conversation
  - *://generativelanguage.googleapis.com/*/models/*:generateContent
```

**Data Extraction:**
- Prompt from request body
- Response text from various JSON/SSE formats
- Model name from request or response
- Token estimation (rough approximation)

**Testing Needs:**
- CDP debugger lifecycle
- URL pattern matching
- SSE stream parsing with various formats
- JSON response parsing
- Error handling and recovery
- Request/response body extraction

---

### 4. Zustand Stores (src/renderer/stores/*.ts)

**capturesStore:**
- State: captures[], loading, error, selectedIds
- Actions: fetchCaptures(), searchCaptures(), updateTags(), updateNotes(), setArchived(), deleteCapture()
- Calls IPC methods to main process

**sessionStore:**
- State: sessions[], activeSessionId
- Actions: addSession(), removeSession(), setActiveSession(), renameSession()
- Uses Zustand persist middleware

**uiStore:**
- State: UI flags (sidebar open, modal open, etc)
- Actions: UI state setters

**settingsStore:**
- State: User preferences (theme, notifications, export settings)
- Actions: Setting updates
- Uses Zustand persist middleware

**Testing Needs:**
- State initialization
- State updates via actions
- IPC call integration
- Async action handling
- Persistence middleware

---

### 5. Export Utilities (src/renderer/lib/export-utils.ts)

**Functions:**
- `convertToJSON(captures)` - JSON string output
- `convertToCSV(captures)` - CSV string output
- `escapeCsvField(field)` - CSV escaping
- `estimateFileSize(captures, format)` - File size prediction
- `formatBytes(bytes)` - Human-readable bytes
- `validateExportData(captures)` - Data validation
- `getDefaultFileName()` - Timestamp-based naming

**Testing Needs:**
- CSV escaping (quotes, commas, newlines)
- JSON formatting
- File size estimation accuracy
- Edge cases (empty data, special characters)
- Format-specific validation

---

## Data Flow

### 1. Session Creation Flow

```
User clicks "+" button in UI
    ↓
UI opens ProviderSelectionDialog
    ↓
User selects provider → UI calls window.electronAPI.session.create()
    ↓
IPC → Main process ipcMain.handle('session:create')
    ↓
SessionManager.createSession():
  - Creates DB entry via db.createSession()
  - Creates BrowserView with partition
  - Creates ResponseInterceptor for session
  - Loads initial URL (claude.ai, chat.openai.com, etc)
    ↓
ResponseInterceptor.enable():
  - Attaches CDP debugger
  - Enables Fetch domain with URL patterns
  - Sets up event listeners
    ↓
Returns Session object to renderer
    ↓
UI updates sessionStore with new session
    ↓
SessionTabs component renders new tab
```

### 2. Response Capture Flow

```
User types prompt in provider's UI (e.g., claude.ai)
    ↓
User presses Enter → Provider's frontend makes API request
    ↓
CDP Fetch.requestPaused event triggered (matching URL pattern)
    ↓
ResponseInterceptor.handleRequestPaused():
  - Retrieves response body via CDP
  - Parses headers and body
  - Decodes base64 if needed
    ↓
processResponse():
  - Detects if SSE or JSON
  - Parses SSE stream or JSON
  - Extracts: prompt, response, model, tokens
    ↓
db.createCapture():
  - Saves to captures table
  - Triggers FTS trigger → updates captures_fts
  - Emits 'response:captured' event
    ↓
Renderer receives event (optional notification)
    ↓
User refreshes data → IPC data:getCaptures()
    ↓
Renderer updates capturesStore → UI re-renders table with new capture
```

### 3. Search Flow

```
User types in search input
    ↓
SearchFilterPanel (debounced) → calls capturesStore.searchCaptures(query)
    ↓
IPC → Main process ipcMain.handle('data:searchCaptures')
    ↓
db.searchCaptures(query, filters):
  - Executes: SELECT c.* FROM captures c
              JOIN captures_fts fts ON c.rowid = fts.rowid
              WHERE captures_fts MATCH ?
  - Applies additional filters (provider, date, archived)
  - Returns ordered by FTS rank
    ↓
Returns captures[] to renderer
    ↓
capturesStore.captures updated
    ↓
ResearchDataTable re-renders with new results
```

### 4. Export Flow

```
User opens ExportDialog and selects captures to export
    ↓
User clicks "Export" → IPC export:showSaveDialog()
    ↓
Dialog returns file path
    ↓
User confirms format (JSON/CSV)
    ↓
IPC export:writeJsonStream() or export:writeCsv()
    ↓
Main process streams data:
  - Gets captures from DB
  - Converts to format (JSON or CSV)
  - Writes to file with progress updates
  - Emits 'export:progress' events
    ↓
Renderer receives progress updates → UI shows progress bar
    ↓
Export completes → Toast notification
    ↓
File saved to user's filesystem
```

---

## Testing Needs Assessment

### High Priority (Must Test)

1. **DatabaseService** (db.ts)
   - Why: Central to all data operations
   - Coverage: 85%+
   - Key tests: CRUD, search, filtering, constraints
   - Complexity: Medium (SQL knowledge needed)

2. **SessionManager** (SessionManager.ts)
   - Why: Manages critical Electron API
   - Coverage: 80%+
   - Key tests: Creation, activation, deletion, persistence
   - Complexity: Medium (Electron API mocking needed)

3. **Zustand Stores** (stores/*.ts)
   - Why: Powers UI state management
   - Coverage: 85%+
   - Key tests: State updates, IPC integration, persistence
   - Complexity: Low-Medium

### Medium Priority (Should Test)

4. **ResponseInterceptor** (ResponseInterceptor.ts)
   - Why: Complex business logic for capture
   - Coverage: 75%+
   - Key tests: Parsing, pattern matching, CDP lifecycle
   - Complexity: High (CDP protocol knowledge needed)

5. **Export Utilities** (export-utils.ts)
   - Why: User-facing functionality
   - Coverage: 90%+
   - Key tests: Formatting, escaping, validation
   - Complexity: Low

6. **IPC Handlers** (main/index.ts)
   - Why: Integration point
   - Coverage: 70%+
   - Key tests: Message format, error handling
   - Complexity: Medium

### Lower Priority (Nice to Have)

7. **React Components** (organisms/, panels/)
   - Coverage: 50-60%
   - Key tests: Rendering, user interactions
   - Complexity: Medium (React Testing Library needed)

8. **UI Utilities** (lib/utils.ts)
   - Coverage: 95%+
   - Key tests: Class merging, edge cases
   - Complexity: Very Low

---

## Key Modules to Test

### Module Dependency Graph

```
Test Priority Order:
1. export-utils.ts (no dependencies on main process)
   ↓
2. DatabaseService (db.ts) (only depends on better-sqlite3)
   ↓
3. Zustand Stores (depends on DatabaseService via IPC)
   ↓
4. SessionManager (depends on DatabaseService, ResponseInterceptor)
   ↓
5. ResponseInterceptor (standalone, depends on WebContents)
   ↓
6. IPC Handlers (integration of all above)
   ↓
7. React Components (depends on Stores)
   ↓
8. E2E Tests (integration of entire system)
```

### Testable Units by Layer

**Main Process (Node.js Runtime):**
- DatabaseService ✓ High Priority
- SessionManager ✓ High Priority
- ResponseInterceptor ✓ Medium Priority
- AutoUpdater ◑ Lower Priority
- IPC Handlers ✓ Medium Priority

**Renderer Process (React Runtime):**
- capturesStore ✓ High Priority
- sessionStore ✓ High Priority
- uiStore ◑ Medium Priority
- settingsStore ◑ Medium Priority
- export-utils.ts ✓ High Priority
- React Components ◑ Lower Priority

**Shared:**
- Type definitions (no testing needed - TypeScript checked)

---

## Development Patterns

### IPC Communication Pattern

```typescript
// Main Process Handler (src/main/index.ts)
ipcMain.handle('data:getCaptures', async (_event, filters = {}) => {
  try {
    const captures = db.getCaptures(filters)
    return { success: true, captures }
  } catch (error) {
    return { success: false, error: (error as Error).message }
  }
})

// Renderer Store Action (src/renderer/stores/capturesStore.ts)
fetchCaptures: async (filters?: CapturesFilters) => {
  set({ loading: true, error: null })
  try {
    const result = await window.electronAPI.data.getCaptures(filters)
    if (result.success) {
      set({ captures: result.captures, loading: false })
    } else {
      set({ error: result.error, loading: false })
    }
  } catch (error) {
    set({ error: (error as Error).message, loading: false })
  }
}

// Preload Script (src/preload/index.ts) - exposes API
contextBridge.exposeInMainWorld('electronAPI', {
  data: {
    getCaptures: (filters) => ipcRenderer.invoke('data:getCaptures', filters),
    // ... other handlers
  }
})
```

### Store Pattern (Zustand)

```typescript
// Define store interface
interface CapturesStore {
  captures: Capture[]
  loading: boolean
  error: string | null
  
  // Actions
  fetchCaptures: (filters?: CapturesFilters) => Promise<void>
  updateTags: (id: string, tags: string[]) => Promise<void>
}

// Create store
export const useCapturesStore = create<CapturesStore>((set, get) => ({
  // Initial state
  captures: [],
  loading: false,
  error: null,
  
  // Action implementations
  fetchCaptures: async (filters) => {
    set({ loading: true })
    // ... logic
  }
}))

// Use in component
function MyComponent() {
  const captures = useCapturesStore(state => state.captures)
  const fetch = useCapturesStore(state => state.fetchCaptures)
}
```

### Database Operation Pattern

```typescript
// CRUD with error handling
createCapture(capture: Omit<Capture, 'timestamp' | 'is_archived'>): Capture {
  if (!this.db) throw new Error('Database not initialized')
  
  const fullCapture: Capture = {
    ...capture,
    timestamp: Date.now(),
    is_archived: 0,
  }
  
  const stmt = this.db.prepare(`
    INSERT INTO captures (id, session_id, ...) 
    VALUES (?, ?, ...)
  `)
  
  stmt.run(fullCapture.id, fullCapture.session_id, ...)
  return fullCapture
}

// Query with filtering
getCaptures(filters: SearchFilters = {}): Capture[] {
  if (!this.db) throw new Error('Database not initialized')
  
  let query = 'SELECT * FROM captures WHERE 1=1'
  const params: any[] = []
  
  if (filters.provider) {
    query += ' AND provider = ?'
    params.push(filters.provider)
  }
  
  // ... more filters
  
  return this.db.prepare(query).all(...params) as Capture[]
}
```

---

## Summary Matrix

| Component | Layer | Type | Priority | Coverage | Complexity | Dependencies |
|-----------|-------|------|----------|----------|-----------|--------------|
| db.ts | Main | Service | High | 85%+ | Medium | better-sqlite3 |
| SessionManager.ts | Main | Manager | High | 80%+ | Medium | Electron, db.ts |
| ResponseInterceptor.ts | Main | Service | Medium | 75%+ | High | Electron, db.ts |
| capturesStore.ts | Renderer | Store | High | 85%+ | Low | IPC |
| sessionStore.ts | Renderer | Store | High | 85%+ | Low | IPC |
| export-utils.ts | Renderer | Utility | High | 90%+ | Low | None |
| IPC Handlers | Main | Integration | Medium | 70%+ | Medium | All main process |
| React Components | Renderer | UI | Low | 50%+ | Medium | Stores, Utils |

---

## Next Steps

See **TESTING_GUIDE.md** for detailed testing instructions, test patterns, and implementation roadmap.

