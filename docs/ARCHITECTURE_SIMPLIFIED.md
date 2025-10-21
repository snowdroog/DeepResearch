# DeepResearch - Simplified Architecture

**Last Updated:** 2025-10-20
**Status:** Active Design
**Philosophy:** Local-first personal productivity tool, NOT enterprise data platform

---

## Overview

DeepResearch is a **local Electron desktop app** that captures AI responses from web chat interfaces (Claude, ChatGPT, Gemini, etc.) without requiring API keys. It embeds browser views, intercepts responses, and stores them in a local SQLite database for research and analysis.

**Core Principle:** Keep it simple. This is a personal tool for one user, not a multi-tenant SaaS platform.

---

## Technology Stack

### Desktop Framework
- **Electron 28.x** - Desktop app container
- **Node.js** - Main process runtime
- **Chromium** - Embedded browser engine

### Frontend
- **React 18** - UI framework
- **TypeScript 5** - Type safety
- **Vite** - Build tool & dev server
- **Tailwind CSS 3** - Styling
- **shadcn/ui** - Component library (Radix UI primitives)
- **Zustand** - State management (lightweight)

### Data Layer
- **SQLite 3** - Single local database
  - **better-sqlite3** - Fast synchronous SQLite bindings
  - **FTS5** - Full-text search (built-in to SQLite)
  - Optional: **sqlite-vec** extension for semantic search (future enhancement)

### UI Components
- **TanStack Table** - Data grid with sorting/filtering
- **React Resizable Panels** - Layout management
- **Lucide React** - Icons

### Development Tools
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **Vitest** - Unit testing (optional)

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                      ELECTRON APP                           │
│                                                             │
│  ┌──────────────────┐         ┌──────────────────────────┐ │
│  │   Renderer       │         │   Main Process           │ │
│  │   (React UI)     │◄───IPC──┤   (Node.js)              │ │
│  │                  │         │                          │ │
│  │  - Session Tabs  │         │  - Session Manager       │ │
│  │  - Data Table    │         │  - Response Interceptor  │ │
│  │  - Search UI     │         │  - SQLite Database       │ │
│  │  - Export Dialog │         │  - IPC Handlers          │ │
│  │                  │         │                          │ │
│  │  [Zustand Store] │         │  [WebContentsView Mgr]   │ │
│  └──────────────────┘         └──────────────────────────┘ │
│                                         │                   │
│                                         ▼                   │
│                              ┌──────────────────┐           │
│                              │  SQLite Database │           │
│                              │  (Local File)    │           │
│                              │                  │           │
│                              │  - sessions      │           │
│                              │  - captures      │           │
│                              │  - tags          │           │
│                              │  - FTS index     │           │
│                              └──────────────────┘           │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐ │
│  │      Embedded Content Views (WebContentsView)         │ │
│  │                                                       │ │
│  │  [Claude Web UI]  [ChatGPT]  [Gemini]  [Perplexity] │ │
│  │                                                       │ │
│  │  Response Interception via:                          │ │
│  │  - Chrome DevTools Protocol (CDP)                    │ │
│  │  - webRequest API                                    │ │
│  │  - Content Scripts (fetch override)                  │ │
│  └───────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

---

## Database Schema (SQLite)

### Simple 3-Table Design

```sql
-- AI Provider Sessions (tabs)
CREATE TABLE sessions (
  id TEXT PRIMARY KEY,                  -- UUID
  provider TEXT NOT NULL,               -- 'claude' | 'openai' | 'gemini' | 'perplexity'
  name TEXT NOT NULL,                   -- User-friendly name
  partition TEXT NOT NULL UNIQUE,       -- Electron session partition ID
  created_at INTEGER NOT NULL,          -- Unix timestamp
  last_active INTEGER NOT NULL,         -- Unix timestamp
  is_active BOOLEAN DEFAULT 1,          -- 0 = archived
  metadata TEXT                         -- JSON: {cookies, user_agent, custom_settings}
);

-- Captured AI Responses
CREATE TABLE captures (
  id TEXT PRIMARY KEY,                  -- UUID
  session_id TEXT NOT NULL,             -- FK to sessions.id
  provider TEXT NOT NULL,               -- Denormalized for faster queries

  -- Request data
  prompt TEXT NOT NULL,                 -- User's input

  -- Response data
  response TEXT NOT NULL,               -- AI's full response
  response_format TEXT DEFAULT 'text',  -- 'text' | 'markdown' | 'code' | 'json'

  -- Metadata
  model TEXT,                           -- e.g., 'claude-3-5-sonnet', 'gpt-4'
  timestamp INTEGER NOT NULL,           -- Unix timestamp
  token_count INTEGER,                  -- Estimated tokens (if available)

  -- Organization
  tags TEXT,                            -- JSON array: ["research", "coding"]
  notes TEXT,                           -- User's personal notes
  is_archived BOOLEAN DEFAULT 0,        -- Soft delete

  FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
);

-- Create full-text search index
CREATE VIRTUAL TABLE captures_fts USING fts5(
  prompt,
  response,
  tags,
  notes,
  content=captures,
  content_rowid=rowid
);

-- Triggers to keep FTS in sync
CREATE TRIGGER captures_ai AFTER INSERT ON captures BEGIN
  INSERT INTO captures_fts(rowid, prompt, response, tags, notes)
  VALUES (new.rowid, new.prompt, new.response, new.tags, new.notes);
END;

CREATE TRIGGER captures_ad AFTER DELETE ON captures BEGIN
  DELETE FROM captures_fts WHERE rowid = old.rowid;
END;

CREATE TRIGGER captures_au AFTER UPDATE ON captures BEGIN
  UPDATE captures_fts SET
    prompt = new.prompt,
    response = new.response,
    tags = new.tags,
    notes = new.notes
  WHERE rowid = new.rowid;
END;

-- Indexes for performance
CREATE INDEX idx_captures_session ON captures(session_id);
CREATE INDEX idx_captures_provider ON captures(provider);
CREATE INDEX idx_captures_timestamp ON captures(timestamp DESC);
CREATE INDEX idx_captures_archived ON captures(is_archived);
```

**Why This Schema?**
- **Simple:** Only 3 tables (sessions, captures, captures_fts)
- **Fast:** Indexed on common query patterns
- **Searchable:** FTS5 for instant full-text search
- **Flexible:** JSON columns for metadata without schema changes
- **Local:** Single SQLite file, easy to backup

---

## Core Features (MVP)

### 1. Session Management
**What:** Create isolated browser sessions for each AI provider
**How:** Electron BrowserView with session partitions
**UI:** Tab interface showing active sessions

```typescript
// Example: Create Claude session
const session = {
  id: crypto.randomUUID(),
  provider: 'claude',
  name: 'Claude Research',
  partition: 'persist:claude-main',
  created_at: Date.now(),
  last_active: Date.now(),
  is_active: true
};
```

### 2. Response Interception
**What:** Capture AI responses without API keys
**Methods:**
1. **Primary:** Chrome DevTools Protocol (CDP) - Intercept fetch responses
2. **Fallback:** Content script injection - Override window.fetch()
3. **Manual:** "Capture This" button for edge cases

```typescript
// CDP Example (simplified)
session.debugger.attach('1.3');
session.debugger.sendCommand('Fetch.enable', {
  patterns: [
    { urlPattern: '*claude.ai/api/*', requestStage: 'Response' },
    { urlPattern: '*openai.com/backend-api/*', requestStage: 'Response' },
    { urlPattern: '*gemini.google.com/api/*', requestStage: 'Response' }
  ]
});

session.debugger.on('message', (event, method, params) => {
  if (method === 'Fetch.requestPaused') {
    const responseBody = session.debugger.sendCommand('Fetch.getResponseBody', {
      requestId: params.requestId
    });
    // Process and save responseBody
  }
});
```

### 3. Data Storage
**What:** Save captures to SQLite with metadata
**How:** better-sqlite3 for synchronous writes (fast, simple)

```typescript
// Save capture
db.prepare(`
  INSERT INTO captures (id, session_id, provider, prompt, response, model, timestamp)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`).run(
  capture.id,
  capture.session_id,
  capture.provider,
  capture.prompt,
  capture.response,
  capture.model,
  Date.now()
);
```

### 4. Search & Discovery
**What:** Full-text search across all captures
**How:** SQLite FTS5 (built-in, no external dependencies)

```typescript
// Search example
const results = db.prepare(`
  SELECT c.* FROM captures c
  JOIN captures_fts fts ON c.rowid = fts.rowid
  WHERE captures_fts MATCH ?
  ORDER BY rank
  LIMIT 50
`).all(searchQuery);
```

### 5. Basic Export
**What:** Export captures to JSON or CSV
**Formats:**
- **JSON:** Full data export with metadata
- **CSV:** Spreadsheet-friendly for analysis
- **Markdown:** (Future) For documentation

```typescript
// JSON export
const captures = db.prepare('SELECT * FROM captures WHERE is_archived = 0').all();
fs.writeFileSync('export.json', JSON.stringify(captures, null, 2));

// CSV export (simple)
const headers = 'timestamp,provider,prompt,response\n';
const rows = captures.map(c =>
  `${c.timestamp},"${c.provider}","${c.prompt}","${c.response}"`
).join('\n');
fs.writeFileSync('export.csv', headers + rows);
```

---

## IPC Communication (Type-Safe)

### Main Process → Renderer

```typescript
// src/shared/types/ipc.ts
export interface ElectronAPI {
  // Session management
  sessions: {
    create(provider: string, name: string): Promise<Session>;
    delete(sessionId: string): Promise<void>;
    list(): Promise<Session[]>;
    activate(sessionId: string): Promise<void>;
  };

  // Data operations
  data: {
    search(query: string, filters?: Filters): Promise<Capture[]>;
    getById(id: string): Promise<Capture | null>;
    updateTags(id: string, tags: string[]): Promise<void>;
    archive(id: string): Promise<void>;
    export(format: 'json' | 'csv', filters?: Filters): Promise<string>; // Returns file path
  };

  // Window controls
  window: {
    minimize(): void;
    maximize(): void;
    close(): void;
  };
}
```

### Implementation (Preload Script)

```typescript
// src/preload/index.ts
import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  sessions: {
    create: (provider, name) => ipcRenderer.invoke('session:create', provider, name),
    delete: (id) => ipcRenderer.invoke('session:delete', id),
    list: () => ipcRenderer.invoke('session:list'),
    activate: (id) => ipcRenderer.invoke('session:activate', id),
  },
  data: {
    search: (query, filters) => ipcRenderer.invoke('data:search', query, filters),
    getById: (id) => ipcRenderer.invoke('data:get', id),
    updateTags: (id, tags) => ipcRenderer.invoke('data:update-tags', id, tags),
    archive: (id) => ipcRenderer.invoke('data:archive', id),
    export: (format, filters) => ipcRenderer.invoke('data:export', format, filters),
  },
  window: {
    minimize: () => ipcRenderer.send('window:minimize'),
    maximize: () => ipcRenderer.send('window:maximize'),
    close: () => ipcRenderer.send('window:close'),
  },
});
```

---

## File Structure (Simplified)

```
/DeepResearch/
├── src/
│   ├── main/                       # Electron main process
│   │   ├── index.ts               # App entry point
│   │   ├── database/
│   │   │   ├── db.ts             # SQLite connection & queries
│   │   │   ├── schema.sql        # Database schema
│   │   │   └── migrations/       # Schema updates
│   │   ├── session/
│   │   │   ├── session-manager.ts    # BrowserView lifecycle
│   │   │   └── providers-config.ts   # Provider URLs & patterns
│   │   ├── interceptor/
│   │   │   ├── cdp-interceptor.ts    # Chrome DevTools Protocol
│   │   │   └── response-handler.ts   # Process captured responses
│   │   └── ipc/
│   │       ├── session-handlers.ts   # session:* IPC
│   │       ├── data-handlers.ts      # data:* IPC
│   │       └── window-handlers.ts    # window:* IPC
│   │
│   ├── preload/
│   │   └── index.ts               # IPC bridge (contextBridge)
│   │
│   ├── renderer/                   # React frontend
│   │   ├── main.tsx               # React entry
│   │   ├── App.tsx                # Router
│   │   ├── components/
│   │   │   ├── ui/                # shadcn/ui components
│   │   │   ├── SessionTabs.tsx    # Multi-session tab interface
│   │   │   ├── DataTable.tsx      # TanStack Table
│   │   │   ├── SearchBar.tsx      # Search input
│   │   │   ├── CaptureDetail.tsx  # View single capture
│   │   │   └── ExportDialog.tsx   # Export options
│   │   ├── stores/
│   │   │   ├── sessionStore.ts    # Zustand: active sessions
│   │   │   ├── dataStore.ts       # Zustand: captures data
│   │   │   └── uiStore.ts         # Zustand: UI state
│   │   └── styles/
│   │       └── globals.css        # Tailwind + theme
│   │
│   └── shared/
│       └── types/
│           ├── index.ts           # Shared TypeScript types
│           └── ipc.ts             # IPC interface definitions
│
├── data/                           # Local data directory
│   └── deepresearch.db            # SQLite database (gitignored)
│
├── docs/
│   ├── ARCHITECTURE_SIMPLIFIED.md # This file
│   └── README.md                  # User-facing docs
│
├── package.json
├── vite.config.ts
├── tsconfig.json
└── tailwind.config.js
```

---

## Security Model (Simple & Effective)

### Electron Security
```typescript
// Main window creation
const mainWindow = new BrowserWindow({
  webPreferences: {
    nodeIntegration: false,        // ✅ No Node.js in renderer
    contextIsolation: true,        // ✅ Isolated context
    sandbox: true,                 // ✅ Sandboxed renderer
    preload: path.join(__dirname, '../preload/index.js'),
  },
});
```

### BrowserView Security (for AI provider sessions)
```typescript
// Each AI provider session runs in isolated partition
const browserView = new BrowserView({
  webPreferences: {
    partition: 'persist:claude-session-1',  // Isolated cookies/storage
    nodeIntegration: false,
    contextIsolation: true,
    sandbox: true,
  },
});
```

**Why This Works:**
- Renderer process has NO access to Node.js APIs (secure)
- All IPC goes through preload script (validated)
- Each AI provider session is isolated (cookies don't mix)
- No user authentication needed (local app)

---

## Development Workflow

### Setup
```bash
npm install
npm run electron:dev    # Start dev server + Electron
```

### Build
```bash
npm run build           # Production build
npm run package         # Create distributable (macOS/Windows/Linux)
```

### Testing
```bash
npm run lint            # ESLint
npm run format          # Prettier
npm test                # Vitest (optional)
```

---

## Deployment

### Single-User Local App
- **Package:** electron-builder creates .dmg (Mac), .exe (Windows), .AppImage (Linux)
- **Distribution:** Direct download (no app store)
- **Updates:** Manual (optional: electron-updater for auto-update)
- **Data:** Stored in user's app data directory (`~/Library/Application Support/DeepResearch`)

### No Backend Required
- No server infrastructure
- No cloud dependencies
- No API keys to manage
- Works completely offline (after initial AI session login)

---

## Future Enhancements (Post-MVP)

### Phase 2 (Optional)
- **Semantic search** with sqlite-vec (vector embeddings)
- **Conversation threading** (link related captures)
- **Custom themes** (beyond dark/light)
- **Cloud sync** (optional Dropbox/Google Drive backup)
- **Browser extension** (capture from any browser, not just embedded)

### Phase 3 (Advanced)
- **Local LLM integration** for auto-tagging/summarization
- **Export to Obsidian/Notion** with proper formatting
- **Scheduled exports** (auto-backup)
- **Multi-device sync** (self-hosted backend)

---

## Why This Architecture?

### Principles
1. **Local-First:** No cloud dependencies, no authentication
2. **Simple:** One database, straightforward schema
3. **Fast:** Synchronous SQLite, indexed queries
4. **Secure:** Electron best practices, session isolation
5. **Maintainable:** Small codebase, clear structure

### What We Avoided
- ❌ Multi-user authentication (local app doesn't need it)
- ❌ DuckDB (SQLite is sufficient for this use case)
- ❌ Complex enrichment pipelines (YAGNI)
- ❌ Vector search in MVP (FTS5 is enough to start)
- ❌ Multiple databases (one is plenty)
- ❌ Over-engineered export formats (JSON/CSV is fine)

### Build Timeline Estimate
- **Week 1:** Session management + basic UI
- **Week 2:** Response interception (CDP)
- **Week 3:** SQLite integration + search
- **Week 4:** Export + polish

**Total: 3-4 weeks to functional MVP** (vs 4-6 months with old architecture)

---

## Questions & Decisions

### Q: Why not use Prisma/Drizzle ORM?
**A:** better-sqlite3 is simpler, faster, and sufficient for this schema. ORMs add complexity without benefits here.

### Q: Why not Pydantic for validation?
**A:** This is a JavaScript/TypeScript app. Use Zod or plain TypeScript types.

### Q: Do we need authentication?
**A:** No. This is a single-user local desktop app. No login required.

### Q: What about multi-device sync?
**A:** Out of scope for MVP. User can manually backup the SQLite file. Future: cloud sync option.

### Q: Can we support custom AI providers?
**A:** Yes, but post-MVP. Start with Claude/ChatGPT/Gemini. Add plugin system later.

---

## Success Metrics

### MVP Complete When:
- ✅ Can create sessions for 3+ AI providers
- ✅ Successfully captures 90%+ of AI responses
- ✅ Full-text search returns relevant results in <100ms
- ✅ Can export data to JSON and CSV
- ✅ UI is responsive and intuitive
- ✅ Works offline (after initial provider login)
- ✅ Database file is portable (can be copied/backed up)

---

**End of Simplified Architecture Document**
