# DeepResearch Testing Guide

Comprehensive guide for testing the DeepResearch application across all components, layers, and functionality.

**Last Updated:** 2025-10-20  
**Project:** DeepResearch v0.1.0  
**Test Coverage Goal:** 70%+

---

## Table of Contents

1. [Testing Strategy Overview](#testing-strategy-overview)
2. [Tech Stack for Testing](#tech-stack-for-testing)
3. [Project Structure & Testable Components](#project-structure--testable-components)
4. [Unit Testing Guide](#unit-testing-guide)
5. [Integration Testing Guide](#integration-testing-guide)
6. [E2E Testing Guide](#e2e-testing-guide)
7. [Test File Organization](#test-file-organization)
8. [Running Tests](#running-tests)
9. [Coverage Goals](#coverage-goals)
10. [Common Testing Patterns](#common-testing-patterns)

---

## Testing Strategy Overview

### Testing Pyramid

```
              /\
             /  \        E2E Tests (Playwright)
            /____\       Key user workflows
           /      \      5-10 tests
          /        \
         /          \    Integration Tests (Vitest)
        /            \   API/IPC boundaries, stores
       /              \  20-30 tests
      /                \
     /                  \ Unit Tests (Vitest)
    /____________________\ Utilities, logic, components
         100+ tests
```

### Testing Layers

1. **Unit Tests** - Test individual functions, utilities, and components in isolation
2. **Integration Tests** - Test interactions between modules (IPC, stores, database)
3. **E2E Tests** - Test complete user workflows through the UI

---

## Tech Stack for Testing

### Installed Frameworks

- **Vitest** (`v1.2.0`) - Fast unit testing framework with Jest compatibility
- **Playwright** (`v1.41.0`) - E2E and browser testing
- **@types/node** - Node.js type definitions

### Test Environment

- Node.js 18+
- TypeScript 5
- ESM modules (via Vite)

### Key Testing Libraries to Use

```json
{
  "@testing-library/react": "^14.0.0",
  "@testing-library/jest-dom": "^6.0.0",
  "vitest": "^1.2.0",
  "@playwright/test": "^1.41.0",
  "happy-dom": "^12.10.0"
}
```

---

## Project Structure & Testable Components

### Architecture Overview

```
DeepResearch/
├── src/
│   ├── main/                          # Electron main process (IPC handlers, database)
│   │   ├── index.ts                   # App entry, IPC registration
│   │   ├── database/
│   │   │   ├── db.ts                  # DatabaseService (CORE - needs testing)
│   │   │   └── schema.sql             # Database schema
│   │   ├── session/
│   │   │   └── SessionManager.ts      # Session lifecycle (CORE - needs testing)
│   │   ├── capture/
│   │   │   └── ResponseInterceptor.ts # Response capture (HIGH PRIORITY)
│   │   ├── updater/
│   │   │   └── AutoUpdater.ts         # Auto-update logic
│   │   └── ipc/
│   │       └── (IPC handlers in main/index.ts)
│   │
│   ├── preload/
│   │   └── index.ts                   # Context bridge IPC exposure
│   │
│   ├── renderer/                       # React frontend
│   │   ├── App.tsx                    # Main app routing
│   │   ├── main.tsx                   # Renderer entry point
│   │   ├── stores/                    # Zustand stores (NEEDS TESTING)
│   │   │   ├── capturesStore.ts       # Captures state management
│   │   │   ├── sessionStore.ts        # Session state management
│   │   │   ├── uiStore.ts             # UI state
│   │   │   └── settingsStore.ts       # Settings state
│   │   ├── components/
│   │   │   ├── ui/                    # shadcn/ui components (mostly 3rd party)
│   │   │   ├── organisms/             # Complex components (TEST THESE)
│   │   │   │   ├── ResearchDataTable.tsx
│   │   │   │   └── SearchFilterPanel.tsx
│   │   │   ├── panels/                # Layout panels
│   │   │   ├── capture/               # Capture-related dialogs
│   │   │   ├── session/               # Session dialogs
│   │   │   ├── export/                # Export dialogs
│   │   │   └── settings/              # Settings
│   │   ├── layouts/
│   │   │   └── MainLayout.tsx         # Main layout composition
│   │   ├── lib/                       # Utilities (NEEDS TESTING)
│   │   │   ├── utils.ts               # Class name utilities
│   │   │   ├── export-utils.ts        # Export formatting utilities
│   │   │   └── toast.ts               # Toast notifications
│   │   ├── types/                     # TypeScript types
│   │   └── pages/                     # Demo pages
│   │
│   └── shared/
│       └── types/                     # Shared types between processes
│
└── docs/
    ├── TESTING_GUIDE.md               # This file
    └── ...other docs...
```

---

## Unit Testing Guide

### What to Unit Test

#### 1. Database Service (`src/main/database/db.ts`)

**File:** Database operations with SQLite

**Test Coverage:**

```typescript
// db.service.test.ts
describe('DatabaseService', () => {
  // Session Operations
  test('createSession - creates new session with correct data')
  test('createSession - assigns timestamp and active flag')
  test('getSessions - returns active sessions only by default')
  test('getSessions - returns all sessions when includeArchived=true')
  test('getSession - returns session by ID')
  test('getSession - returns undefined for missing ID')
  test('updateSessionActivity - updates last_active timestamp')
  test('setSessionActive - toggles session active status')
  test('updateSessionMetadata - persists JSON metadata')
  test('deleteSession - removes session and cascades captures')

  // Capture Operations
  test('createCapture - creates capture with timestamp')
  test('createCapture - defaults is_archived to 0')
  test('getCapture - retrieves capture by ID')
  test('getCaptures - returns captures with optional filters')
  test('getCaptures - filters by provider')
  test('getCaptures - filters by date range')
  test('getCaptures - filters by archived status')
  test('searchCaptures - performs FTS search')
  test('searchCaptures - respects provider filter with search')
  test('updateCaptureTags - updates JSON tags array')
  test('updateCaptureNotes - updates notes string')
  test('setCaptureArchived - soft deletes capture')
  test('deleteCapture - permanently removes capture')

  // Utility Operations
  test('getStats - returns accurate counts')
  test('getStats - includes database file size')
  test('close - closes database connection')
})
```

**Test Approach:**
- Use in-memory SQLite for fast tests: `new Database(':memory:')`
- Run schema setup in beforeEach
- Test with sample data
- Verify transaction isolation

#### 2. Session Manager (`src/main/session/SessionManager.ts`)

**File:** Session lifecycle and BrowserView management

**Test Coverage:**

```typescript
describe('SessionManager', () => {
  test('createSession - generates UUID for session')
  test('createSession - creates DB entry before BrowserView')
  test('createSession - sets up partition with provider prefix')
  test('createSession - returns Session object')
  test('activateSession - adds BrowserView to window')
  test('activateSession - removes previous active view')
  test('activateSession - updates last_active in DB')
  test('deleteSession - disables interceptor')
  test('deleteSession - removes view from window')
  test('deleteSession - deletes DB entry')
  test('listSessions - returns all or filtered sessions')
  test('getActiveSessionId - returns current active session')
  test('getView - returns BrowserView for session ID')
  test('loadPersistedSessions - restores sessions from DB')
  test('saveSessionState - updates metadata with current URL')
  test('destroy - cleans up all sessions on shutdown')
})
```

**Test Approach:**
- Mock Electron's BrowserView, BrowserWindow, and session APIs
- Mock database (DatabaseService)
- Mock ResponseInterceptor
- Test state transitions

#### 3. Response Interceptor (`src/main/capture/ResponseInterceptor.ts`)

**File:** Chrome DevTools Protocol response capturing

**Test Coverage:**

```typescript
describe('ResponseInterceptor', () => {
  // Initialization
  test('enable - attaches CDP debugger')
  test('enable - enables Fetch domain')
  test('enable - sets up event listeners')
  test('disable - detaches debugger')
  test('disable - idempotent if already disabled')

  // Response Parsing
  test('parseHeaders - converts CDP header format')
  test('parseSSEStream - extracts text from SSE events')
  test('parseSSEStream - ignores [DONE] markers')
  test('extractPromptFromRequest - extracts from various formats')
  test('extractResponseText - finds content in various response structures')
  test('extractModel - gets model name from response or request')
  test('estimateTokens - estimates ~4 chars per token')

  // Provider Patterns
  test('enableFetchDomain - registers Claude URL patterns')
  test('enableFetchDomain - registers OpenAI URL patterns')
  test('enableFetchDomain - registers Gemini URL patterns')
  test('enableFetchDomain - throws for unknown provider')

  // Capture Processing
  test('processResponse - saves capture to database')
  test('processResponse - handles streaming responses')
  test('processResponse - handles JSON responses')
  test('processResponse - emits response:captured event')
})
```

**Test Approach:**
- Mock WebContents and debugger API
- Mock database
- Create realistic CDP response objects
- Test various streaming formats

#### 4. Export Utilities (`src/renderer/lib/export-utils.ts`)

**File:** Data transformation for export

**Test Coverage:**

```typescript
describe('export-utils', () => {
  test('convertToJSON - returns valid JSON string')
  test('convertToJSON - preserves all capture fields')
  
  test('convertToCSV - creates valid CSV header')
  test('convertToCSV - escapes fields with commas')
  test('convertToCSV - escapes fields with quotes')
  test('convertToCSV - escapes fields with newlines')
  test('convertToCSV - handles empty captures array')
  
  test('escapeCsvField - handles null and undefined')
  test('escapeCsvField - escapes internal quotes')
  
  test('getDefaultFileName - includes timestamp')
  test('getDefaultFileName - includes record count when provided')
  
  test('estimateFileSize - returns reasonable estimate')
  test('estimateFileSize - returns 0 for empty array')
  test('estimateFileSize - handles JSON format')
  test('estimateFileSize - handles CSV format')
  
  test('formatBytes - formats bytes to human-readable')
  test('formatBytes - handles edge cases (0, large numbers)')
  
  test('validateExportData - validates array structure')
  test('validateExportData - checks required fields')
  test('validateExportData - returns error for empty data')
  
  test('getFileExtension - returns correct extension')
  test('getMimeType - returns correct MIME type')
})
```

**Test Approach:**
- Use sample capture data
- Verify format compliance (JSON valid, CSV parseable)
- Test boundary conditions (empty, large datasets)

#### 5. Zustand Stores (`src/renderer/stores/*.ts`)

**File:** State management

**Test Coverage - capturesStore:**

```typescript
describe('useCapturesStore', () => {
  test('initial state - empty captures, not loading')
  test('fetchCaptures - sets loading=true during fetch')
  test('fetchCaptures - updates captures on success')
  test('fetchCaptures - sets error on failure')
  test('searchCaptures - calls IPC search with query')
  test('updateTags - updates local capture tags')
  test('updateNotes - updates local capture notes')
  test('setArchived - updates archived status')
  test('deleteCapture - removes from local state')
  test('setSelectedIds - updates selected IDs')
  test('clearSelection - clears selected IDs')
})
```

**Test Coverage - sessionStore:**

```typescript
describe('useSessionStore', () => {
  test('initial state - no sessions')
  test('addSession - creates new session')
  test('addSession - sets as active')
  test('removeSession - deletes session')
  test('removeSession - activates next if removed active')
  test('setActiveSession - marks session as active')
  test('renameSession - updates session name')
  test('updateSessionUrl - updates session URL')
  test('persistence - data persists via zustand middleware')
})
```

**Test Approach:**
- Use `act()` wrapper for state updates
- Mock window.electronAPI for IPC calls
- Test reducer logic (adding, updating, filtering)
- Verify persistence middleware

#### 6. Utility Functions

**File:** `src/renderer/lib/utils.ts`

```typescript
describe('cn utility', () => {
  test('cn - merges class names')
  test('cn - removes Tailwind conflicts')
  test('cn - handles array inputs')
  test('cn - handles conditional classes')
})
```

---

## Integration Testing Guide

### What to Integration Test

#### 1. IPC Communication

**Test:** Main ↔ Renderer IPC handlers

```typescript
describe('IPC Handlers Integration', () => {
  // Session IPC
  test('session:create IPC - creates session and returns data')
  test('session:activate IPC - activates session and returns success')
  test('session:delete IPC - deletes session and cascades')
  test('session:list IPC - returns sessions list')
  test('session:getActive IPC - returns active session ID')

  // Data IPC
  test('data:getCaptures IPC - returns captures with filters')
  test('data:getCapture IPC - returns single capture')
  test('data:searchCaptures IPC - performs search')
  test('data:updateTags IPC - updates tags and returns success')
  test('data:updateNotes IPC - updates notes and returns success')
  test('data:setArchived IPC - archives capture')
  test('data:deleteCapture IPC - deletes capture')
  test('data:getStats IPC - returns database stats')

  // Export IPC
  test('export:showSaveDialog - returns file path')
  test('export:writeJson - writes JSON file')
  test('export:writeJsonStream - streams JSON with progress')
  test('export:writeCsv - writes CSV with progress')
})
```

**Test Approach:**
- Use Vitest with mocked electron module
- Mock file system for export tests
- Verify IPC message format
- Test error handling

#### 2. Database + Session Manager Integration

**Test:** Database persistence with session lifecycle

```typescript
describe('SessionManager + Database Integration', () => {
  test('createSession persists to database')
  test('loadPersistedSessions restores from database')
  test('deleteSession cascades to captures in DB')
  test('updateSessionMetadata syncs with database')
})
```

#### 3. ResponseInterceptor + Database Integration

**Test:** Captured responses are saved

```typescript
describe('ResponseInterceptor + Database Integration', () => {
  test('processResponse saves capture to database')
  test('processResponse creates with correct session_id')
  test('multiple captures are stored independently')
})
```

#### 4. Store + IPC Integration

**Test:** Stores communicate with main process via IPC

```typescript
describe('Store + IPC Integration', () => {
  test('capturesStore.fetchCaptures calls IPC and updates state')
  test('capturesStore.searchCaptures sends query to main process')
  test('sessionStore actions update database via IPC')
})
```

---

## E2E Testing Guide

### Key User Workflows to Test

#### 1. Session Creation and Activation

```typescript
test('User can create and activate a session', async ({ page }) => {
  await page.goto('http://localhost:5173')
  
  // Click "+" to add session
  await page.click('button:has-text("+")')
  
  // Select provider
  await page.click('button:has-text("Claude")')
  
  // Verify session appears
  await expect(page.locator('text=Claude')).toBeVisible()
})
```

#### 2. Data Capture and Display

```typescript
test('User can search and view captured data', async ({ page }) => {
  await page.goto('http://localhost:5173')
  
  // Fill search
  await page.fill('input[placeholder="Search..."]', 'test')
  
  // Verify results
  await expect(page.locator('table tbody tr')).toHaveCount(1)
})
```

#### 3. Export Workflow

```typescript
test('User can export captures as JSON', async ({ page }) => {
  await page.goto('http://localhost:5173')
  
  // Open export dialog
  await page.click('button:has-text("Export")')
  
  // Select format and export
  await page.selectOption('select', 'json')
  await page.click('button:has-text("Export")')
  
  // Handle file download
  const downloadPromise = page.context().waitForEvent('download')
  const download = await downloadPromise
  expect(download.suggestedFilename()).toContain('.json')
})
```

#### 4. Settings Management

```typescript
test('User can update settings and persist changes', async ({ page }) => {
  await page.goto('http://localhost:5173')
  
  // Open settings
  await page.click('button[aria-label="Settings"]')
  
  // Toggle auto-capture
  await page.click('input[type="checkbox"]')
  
  // Reload and verify persistence
  await page.reload()
  await expect(page.locator('input[type="checkbox"]')).toBeChecked()
})
```

---

## Test File Organization

### Directory Structure

```
DeepResearch/
├── src/
│   ├── main/
│   │   ├── database/
│   │   │   ├── db.ts
│   │   │   └── __tests__/
│   │   │       └── db.test.ts
│   │   ├── session/
│   │   │   ├── SessionManager.ts
│   │   │   └── __tests__/
│   │   │       └── SessionManager.test.ts
│   │   └── capture/
│   │       ├── ResponseInterceptor.ts
│   │       └── __tests__/
│   │           └── ResponseInterceptor.test.ts
│   │
│   └── renderer/
│       ├── lib/
│       │   ├── export-utils.ts
│       │   └── __tests__/
│       │       └── export-utils.test.ts
│       ├── stores/
│       │   ├── capturesStore.ts
│       │   └── __tests__/
│       │       └── capturesStore.test.ts
│       └── components/
│           └── organisms/
│               ├── ResearchDataTable.tsx
│               └── __tests__/
│                   └── ResearchDataTable.test.tsx
│
└── tests/
    ├── e2e/
    │   ├── session.spec.ts
    │   ├── export.spec.ts
    │   └── search.spec.ts
    └── integration/
        ├── ipc.test.ts
        └── database-session.test.ts
```

### File Naming Convention

- Unit tests: `<component>.test.ts` or `<component>.test.tsx`
- Integration tests: `<feature>.integration.test.ts`
- E2E tests: `<feature>.spec.ts` (Playwright)

---

## Running Tests

### Setup

```bash
# Install test dependencies
npm install --save-dev @testing-library/react @testing-library/jest-dom happy-dom

# Create vitest config
cat > vitest.config.ts << 'EOF'
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: ['./vitest.setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
        '**/*.test.ts',
        '**/*.test.tsx',
      ]
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@renderer': path.resolve(__dirname, './src/renderer'),
      '@main': path.resolve(__dirname, './src/main'),
    }
  }
})
