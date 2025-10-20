# DeepResearch - Multi-Provider AI Response Capture & Enrichment

## Project Overview

**DeepResearch** is an Electron desktop application that manages authenticated connections to multiple AI providers (Claude, OpenAI, Gemini, etc.) WITHOUT requiring API keys. It captures, enriches, and processes AI responses into a structured datastore optimized for research and analysis.

**Key Innovation**: Uses browser integration to intercept responses directly from web interfaces, enabling researchers to capture data from their existing authenticated sessions without API costs or rate limits.

---

## Architecture Vision

### High-Level System Design

```
┌─────────────────────────────────────────────────────────────┐
│                   ELECTRON MAIN PROCESS                      │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Session Manager (Multi-Provider Isolation)           │  │
│  │ • persist:claude, persist:openai, persist:gemini     │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Response Interceptor (CDP + Content Injection)       │  │
│  │ • Chrome DevTools Protocol (Fetch domain)            │  │
│  │ • fetch/XHR override via preload scripts             │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Data Pipeline                                        │  │
│  │ • Provider adapters (normalize responses)            │  │
│  │ • Enrichment processors (NER, sentiment, topics)     │  │
│  │ • Storage service (DuckDB + SQLite-vec)              │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            ↕ Type-Safe IPC
┌─────────────────────────────────────────────────────────────┐
│                   ELECTRON RENDERER PROCESS                  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ React 18 + TypeScript UI                            │  │
│  │ • shadcn/ui components + Tailwind CSS               │  │
│  │ • Zustand state management                          │  │
│  │ • TanStack Table (virtual scrolling)                │  │
│  │ • react-resizable-panels (layout)                   │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## Technology Stack

### Core Framework
- **Electron** (latest) - Desktop app framework
- **React 18** - UI framework
- **TypeScript 5** - Type safety
- **Vite** - Build tool (fast HMR)

### Authentication
- **better-auth** - Modern TypeScript-first auth library
- **Google OAuth** - Social login integration
- **Session management** - Secure user sessions with encryption

### Session & Interception
- **Electron Session API** - Isolated partitions per provider
- **Chrome DevTools Protocol** - Network response interception
- **Preload Scripts** - Content injection (fetch/XHR override)

### Data Layer
- **DuckDB** - Primary analytical database (12-35× faster than SQLite for analytics)
- **SQLite + sqlite-vec** - Vector embeddings and semantic search
- **Pydantic** - Data validation and normalization

### UI Components
- **shadcn/ui** - Component library (Radix UI + Tailwind)
- **TanStack Table v8** - Data grid with virtual scrolling
- **react-resizable-panels** - Resizable layout
- **Zustand** - State management (<1KB, simple API)
- **Lucide React** - Icon library

### Additional Tools
- **Vitest** - Unit testing
- **Playwright** - E2E testing
- **electron-builder** - Packaging and distribution
- **@electron-toolkit/typed-ipc** - Type-safe IPC

---

## Core Features

### 0. User Authentication & Authorization
- **Google OAuth Login**: Seamless sign-in with Google accounts
- **User Profiles**: Store user preferences and settings
- **Session Management**: Secure JWT-based sessions with better-auth
- **Multi-User Support**: Each user has isolated data and sessions
- **Permission System**: Role-based access control (future: team features)

### 1. Multi-Provider Session Management
- **Isolated Sessions**: Each AI provider runs in isolated session partition
- **Authentication Persistence**: Cookies and localStorage automatically saved
- **Concurrent Sessions**: Multiple providers active simultaneously
- **Session Controls**: Create, delete, rename, switch between sessions

### 2. Response Capture System
**Two-Layer Interception:**

**Layer 1: Network-Level (CDP)**
- Attach Chrome DevTools Protocol debugger to webContents
- Enable Fetch domain with response stage interception
- Capture response bodies using `Fetch.getResponseBody`
- Pattern matching for AI API endpoints

**Layer 2: Content-Level (Injection)**
- Override `window.fetch()` and `XMLHttpRequest` via preload script
- Capture streaming responses (Server-Sent Events)
- DOM MutationObserver for rendered content
- Secure IPC to send data to main process

### 3. Data Enrichment Pipeline
**Normalization:**
- Provider adapters map responses to common schema
- Standardize fields: tokens, latency, model, finish_reason
- Validate with Pydantic models
- Store raw payloads for provenance

**Enrichment:**
- Entity extraction (NER) - people, places, organizations
- Sentiment analysis - score and label
- Topic detection - automated categorization
- Keyword extraction - important terms
- Vector embeddings - semantic search capability
- Cost calculation - track API equivalent costs

### 4. Storage Architecture

**DuckDB (Primary)** - Optimized for analytical queries
```sql
Tables:
• providers      - AI provider metadata
• sessions       - Conversation grouping
• requests       - Input prompts and parameters
• responses      - AI outputs with usage metrics
• artifacts      - Generated content (code, images)
• enrichments    - Derived metadata (entities, sentiment)
• feedback       - Quality ratings and annotations
• provenance     - Data lineage tracking
```

**SQLite + sqlite-vec (Secondary)** - Semantic search
```sql
Tables:
• embeddings     - Vector representations with metadata
```

**Benefits:**
- DuckDB: Columnar storage, parallel queries, 70% smaller than SQLite
- Automatic compression
- Native Parquet support for export
- Complex analytical queries (aggregations, window functions)

### 5. Search & Discovery
- **Full-Text Search**: Text matching across content
- **Semantic Search**: Vector similarity with embeddings
- **Hybrid Search**: Combine vector + metadata filters
- **Faceted Filters**: Provider, date range, tags, sentiment
- **Saved Searches**: Reusable filter presets

### 6. Export Capabilities
**Multiple Formats:**
- **Parquet**: Columnar format for analytics tools (Pandas, Polars, Spark)
- **JSON-LD**: Semantic web format with rich metadata
- **CSV**: Spreadsheet-friendly format

**Export Options:**
- Filtered exports (apply current filters)
- Custom column selection
- Partitioning by provider/date
- Metadata files (schema version, record counts)
- Data package descriptors (FAIR principles)

---

## Database Schema

### Core Tables

```sql
-- Users: Application users
CREATE TABLE users (
    user_id VARCHAR PRIMARY KEY,
    email VARCHAR UNIQUE NOT NULL,
    name VARCHAR,
    avatar_url VARCHAR,
    google_id VARCHAR UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login_at TIMESTAMP,
    preferences JSON
);

-- Auth Sessions: better-auth session management
CREATE TABLE auth_sessions (
    session_id VARCHAR PRIMARY KEY,
    user_id VARCHAR REFERENCES users(user_id),
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Providers: AI service metadata
CREATE TABLE providers (
    provider_id VARCHAR PRIMARY KEY,
    provider_name VARCHAR NOT NULL,
    api_version VARCHAR,
    capabilities JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sessions: Conversation grouping (per-user)
CREATE TABLE sessions (
    session_id VARCHAR PRIMARY KEY,
    user_id VARCHAR REFERENCES users(user_id),
    session_name VARCHAR,
    context_tags VARCHAR[],
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    session_metadata JSON
);

-- Requests: User prompts
CREATE TABLE requests (
    request_id VARCHAR PRIMARY KEY,
    session_id VARCHAR REFERENCES sessions(session_id),
    provider_id VARCHAR REFERENCES providers(provider_id),
    prompt TEXT NOT NULL,
    system_prompt TEXT,
    model_name VARCHAR NOT NULL,
    temperature FLOAT,
    max_tokens INTEGER,
    requested_at TIMESTAMP,
    raw_request JSON,
    tags VARCHAR[]
);

-- Responses: AI outputs
CREATE TABLE responses (
    response_id VARCHAR PRIMARY KEY,
    request_id VARCHAR REFERENCES requests(request_id),
    content TEXT,
    finish_reason VARCHAR,
    received_at TIMESTAMP,
    latency_ms INTEGER,
    input_tokens INTEGER,
    output_tokens INTEGER,
    total_tokens INTEGER,
    estimated_cost_usd DECIMAL(10, 6),
    raw_response JSON
);

-- Enrichments: Derived metadata
CREATE TABLE enrichments (
    enrichment_id VARCHAR PRIMARY KEY,
    target_type VARCHAR,
    target_id VARCHAR,
    enrichment_type VARCHAR,
    extracted_entities JSON,
    sentiment_score FLOAT,
    sentiment_label VARCHAR,
    detected_topics VARCHAR[],
    keywords VARCHAR[],
    enriched_at TIMESTAMP,
    confidence FLOAT
);

-- Embeddings: Vector search
CREATE TABLE embeddings (
    embedding_id VARCHAR PRIMARY KEY,
    target_type VARCHAR,
    target_id VARCHAR,
    embedding FLOAT[],
    embedding_model VARCHAR,
    text_content TEXT,
    created_at TIMESTAMP
);
```

---

## UI/UX Design

### Layout Structure

```
┌──────────────────────────────────────────────────────────┐
│ Header: App Title + Controls                             │
├────────┬─────────────────────────────────────────────────┤
│        │ ┌─────────────────────────────────────────────┐ │
│        │ │ Session Tabs                                │ │
│        │ │ [Claude] [ChatGPT] [Gemini] [+]             │ │
│ Side-  │ ├─────────────────────────────────────────────┤ │
│ bar    │ │                                             │ │
│        │ │ Active Provider Panel                       │ │
│ Sess-  │ │ (Embedded browser view)                     │ │
│ ion    │ │                                             │ │
│ List   │ │                                             │ │
│        │ └─────────────────────────────────────────────┘ │
│        │ ════════════════════════════════════════════════ │
│        │ ┌─────────────────────────────────────────────┐ │
│        │ │ Research Data Panel                         │ │
│        │ │ [Filters] [Search] [Export]                 │ │
│        │ │ ┌───┬────────┬─────────┬────────┬─────────┐ │ │
│        │ │ │□  │ Time   │ Provider│ Content│ Tags    │ │ │
│        │ │ ├───┼────────┼─────────┼────────┼─────────┤ │ │
│        │ │ │□  │ 2:30pm │ Claude  │ The... │ research│ │ │
│        │ │ │□  │ 2:28pm │ OpenAI  │ Here...│ code    │ │ │
│        │ │ └───┴────────┴─────────┴────────┴─────────┘ │ │
│        │ └─────────────────────────────────────────────┘ │
└────────┴─────────────────────────────────────────────────┘
```

### Key Components

**SessionTabs**
- Tab for each active provider
- Color-coded indicators
- Close buttons (hover)
- Keyboard shortcuts (Cmd+T, Cmd+W)

**ProviderPanel**
- Embedded WebContentsView
- Full browser experience
- Transparent interception (user unaware)

**DataTable**
- Virtual scrolling (TanStack Virtual)
- Sort, filter, paginate
- Row selection
- Column customization

**Filters**
- Text search (debounced)
- Date range picker
- Provider multi-select
- Tag chips
- Sentiment filter
- Saved presets

---

## Security Architecture

### Critical Security Rules (Electron Best Practices)

1. **Context Isolation**: ✅ Always enabled
   ```javascript
   webPreferences: {
     nodeIntegration: false,
     contextIsolation: true,
     sandbox: true
   }
   ```

2. **Limited IPC Surface**: Only expose necessary APIs via contextBridge
   ```javascript
   contextBridge.exposeInMainWorld('electronAPI', {
     'session:create': (data) => ipcRenderer.invoke('session:create', data),
     // ... only needed methods
   })
   ```

3. **Navigation Restrictions**: Allowlist AI provider domains
   ```javascript
   webContents.on('will-navigate', (event, url) => {
     if (!isAllowedDomain(url)) {
       event.preventDefault()
     }
   })
   ```

4. **Input Validation**: All IPC messages validated and sanitized

5. **Session Isolation**: Each provider in separate partition (no cross-contamination)

---

## Development Roadmap

### Phase 0: Authentication Setup (Week 1)
- [ ] Set up better-auth with Google OAuth
- [ ] Create user authentication UI (login screen)
- [ ] Implement user session management
- [ ] Add user profile storage in DuckDB
- [ ] Create protected routes and auth guards

### Phase 1: Foundation (Weeks 2-3)
- [ ] Set up Electron + React + TypeScript + Vite
- [ ] Configure BaseWindow + WebContentsView
- [ ] Implement session manager with partitions
- [ ] Create secure IPC layer with type safety
- [ ] Set up project structure (feature-based)

### Phase 2: Data Capture (Weeks 3-4)
- [ ] Implement CDP Fetch domain integration
- [ ] Build content injection (fetch/XHR override)
- [ ] Create response interceptor service
- [ ] Add provider-specific pattern matching
- [ ] Test concurrent session handling

### Phase 3: Storage & Pipeline (Weeks 5-6)
- [ ] Design and implement DuckDB schema
- [ ] Build provider adapters (Anthropic, OpenAI, Google)
- [ ] Create enrichment processors
- [ ] Implement SQLite + sqlite-vec for embeddings
- [ ] Add data validation with Pydantic

### Phase 4: UI Implementation (Weeks 7-8)
- [ ] Set up shadcn/ui + Tailwind
- [ ] Build Zustand stores
- [ ] Create resizable panel layout
- [ ] Implement session tabs
- [ ] Build data table with virtual scrolling
- [ ] Add search and filter interface

### Phase 5: Advanced Features (Weeks 9-10)
- [ ] Implement semantic search
- [ ] Build export functionality (Parquet, JSON-LD, CSV)
- [ ] Add data visualization dashboards
- [ ] Create keyboard shortcuts
- [ ] Implement theme support (dark/light)

### Phase 6: Quality & Deploy (Weeks 11-12)
- [ ] Security hardening audit
- [ ] Add testing suite (Vitest + Playwright)
- [ ] Performance optimization
- [ ] Write documentation
- [ ] Configure electron-builder
- [ ] Set up auto-updater
- [ ] Create installer packages

---

## Project Structure

```
DeepResearch/
├── src/
│   ├── main/                      # Electron main process
│   │   ├── index.ts               # Entry point
│   │   ├── window-manager.ts      # Window lifecycle
│   │   ├── session/
│   │   │   ├── session-manager.ts
│   │   │   └── providers-config.ts
│   │   ├── interceptor/
│   │   │   ├── cdp-interceptor.ts
│   │   │   ├── content-injector.ts
│   │   │   └── stream-processor.ts
│   │   ├── storage/
│   │   │   ├── duckdb-service.ts
│   │   │   ├── sqlite-vec-service.ts
│   │   │   └── schemas/
│   │   ├── pipeline/
│   │   │   ├── adapters/
│   │   │   ├── enrichment/
│   │   │   └── export/
│   │   └── ipc/
│   │       └── handlers.ts
│   ├── preload/
│   │   └── index.ts               # Context bridge
│   ├── renderer/
│   │   ├── components/
│   │   │   ├── ui/                # shadcn/ui components
│   │   │   ├── atoms/
│   │   │   ├── molecules/
│   │   │   └── organisms/
│   │   ├── features/
│   │   │   ├── sessions/
│   │   │   ├── research-data/
│   │   │   └── ai-providers/
│   │   ├── layouts/
│   │   ├── stores/                # Zustand stores
│   │   ├── hooks/
│   │   ├── types/
│   │   └── utils/
│   └── shared/
│       ├── types/
│       └── constants/
├── tests/
│   ├── unit/
│   └── e2e/
├── docs/
│   ├── architecture.md
│   ├── setup.md
│   └── api-reference.md
├── plan.md                        # User's plan file
├── ARCHITECTURE.md                # This file
├── package.json
├── tsconfig.json
├── vite.config.ts
├── electron-builder.yml
└── README.md
```

---

## Key Dependencies

```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "better-auth": "^1.0.0",
    "@better-auth/react": "^1.0.0",
    "zustand": "^4.4.0",
    "@tanstack/react-table": "^8.10.0",
    "@tanstack/react-virtual": "^3.0.0",
    "react-resizable-panels": "^1.0.0",
    "react-router-dom": "^6.20.0",
    "lucide-react": "^0.300.0",
    "date-fns": "^2.30.0",
    "clsx": "^2.0.0",
    "tailwind-merge": "^2.0.0",
    "duckdb": "^0.9.0",
    "better-sqlite3": "^9.0.0"
  },
  "devDependencies": {
    "electron": "^27.0.0",
    "typescript": "^5.2.0",
    "vite": "^5.0.0",
    "@electron-toolkit/typed-ipc": "^1.0.0",
    "tailwindcss": "^3.3.0",
    "@types/react": "^18.2.0",
    "electron-builder": "^24.0.0",
    "vitest": "^1.0.0",
    "@playwright/test": "^1.40.0"
  }
}
```

---

## Success Metrics

### Technical Metrics
- **Performance**: <100ms response capture latency
- **Scalability**: Handle 10,000+ captured responses efficiently
- **Reliability**: 99.9% uptime during active sessions
- **Test Coverage**: 70%+ code coverage
- **Memory**: <500MB memory footprint per session

### User Experience Metrics
- **Transparency**: Users should not notice interception
- **Responsiveness**: UI remains responsive during data capture
- **Search Speed**: <200ms for typical queries
- **Export Speed**: 10,000 records in <5 seconds

---

## Research References

This plan is based on comprehensive research from:
- Official Electron documentation (security, APIs, best practices)
- React 18 documentation (hooks, performance, patterns)
- TypeScript 5 best practices
- DuckDB documentation (analytical queries, performance)
- Modern UI/UX patterns (2024/2025 standards)

---

## Next Steps

1. **Immediate**: Set up project scaffold with Vite + Electron + React + TypeScript
2. **Week 1**: Implement session manager and basic UI layout
3. **Week 2**: Build response interception (CDP + content injection)
4. **Week 3**: Create storage layer (DuckDB schema)
5. **Week 4**: Develop UI components (tabs, table, filters)

**To Get Started:**
```bash
# Initialize project
npm create vite@latest deep-research -- --template react-ts
cd deep-research
npm install

# Add Electron
npm install -D electron electron-builder vite-plugin-electron

# Add UI dependencies
npm install zustand @tanstack/react-table react-resizable-panels

# Start development
npm run dev
```

---

## Conclusion

DeepResearch represents a novel approach to AI research data collection by eliminating the need for API keys and leveraging browser integration to capture responses directly from authenticated web sessions. The architecture prioritizes:

- **Security**: Context isolation, sandboxing, validated IPC
- **Performance**: DuckDB for analytics, virtual scrolling for UI
- **Scalability**: Normalized schema, efficient storage
- **Extensibility**: Provider adapters, pluggable enrichment
- **User Experience**: Modern UI, responsive design, intuitive workflows

With this foundation, researchers can capture, enrich, and analyze AI responses across multiple providers in a unified interface, enabling deeper insights and more efficient research workflows.

---

**Status**: ✅ Planning Complete - Ready for Implementation

**Last Updated**: 2025-10-20

**Project Lead**: Research Team

**Estimated Completion**: 12 weeks from project start
