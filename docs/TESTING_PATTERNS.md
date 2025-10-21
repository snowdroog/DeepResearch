# Testing Patterns & Code Examples

Practical code examples and testing patterns for the DeepResearch Electron application. This document provides copy-paste ready examples for common testing scenarios.

**Last Updated:** 2025-10-21
**For:** DeepResearch v0.1.0

---

## Table of Contents

1. [Database Testing Patterns](#database-testing-patterns)
2. [Zustand Store Testing Patterns](#zustand-store-testing-patterns)
3. [React Component Testing Patterns](#react-component-testing-patterns)
4. [IPC Handler Testing Patterns](#ipc-handler-testing-patterns)
5. [E2E Testing Patterns](#e2e-testing-patterns)
6. [Mocking Patterns](#mocking-patterns)
7. [Async Testing Patterns](#async-testing-patterns)
8. [Error Handling Patterns](#error-handling-patterns)

---

## Database Testing Patterns

### Pattern 1: Testing CRUD Operations with In-Memory SQLite

```typescript
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

// Unmock better-sqlite3 to use real in-memory database
vi.unmock('better-sqlite3');

class TestDatabaseService {
  private db: Database.Database | null = null;

  initialize(): void {
    this.db = new Database(':memory:');
    this.db.pragma('foreign_keys = ON');

    // Load schema
    const schemaPath = path.join(__dirname, '../schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf-8');
    this.db.exec(schema);
  }

  getDb(): Database.Database {
    if (!this.db) throw new Error('Database not initialized');
    return this.db;
  }

  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }

  createSession(session: any) {
    if (!this.db) throw new Error('Database not initialized');

    const stmt = this.db.prepare(`
      INSERT INTO sessions (id, provider, name, partition, created_at, last_active, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      session.id,
      session.provider,
      session.name,
      session.partition,
      Date.now(),
      Date.now(),
      1
    );

    return this.db.prepare('SELECT * FROM sessions WHERE id = ?').get(session.id);
  }
}

describe('DatabaseService', () => {
  let db: TestDatabaseService;

  beforeEach(() => {
    db = new TestDatabaseService();
    db.initialize();
  });

  afterEach(() => {
    db.close();
  });

  describe('Session CRUD Operations', () => {
    it('should create session with auto-generated timestamp', () => {
      const before = Date.now();

      const session = db.createSession({
        id: 'session-1',
        provider: 'claude',
        name: 'Test Session',
        partition: 'persist:claude-1',
      });

      expect(session.id).toBe('session-1');
      expect(session.created_at).toBeGreaterThanOrEqual(before);
      expect(session.is_active).toBe(1);
    });

    it('should enforce foreign key constraints', () => {
      // This should fail because session doesn't exist
      expect(() => {
        db.getDb().prepare(`
          INSERT INTO captures (id, session_id, provider, prompt, response, timestamp)
          VALUES (?, ?, ?, ?, ?, ?)
        `).run('cap-1', 'non-existent', 'claude', 'test', 'test', Date.now());
      }).toThrow();
    });
  });
});
```

### Pattern 2: Testing Full-Text Search (FTS5)

```typescript
describe('Full-Text Search', () => {
  beforeEach(() => {
    db = new TestDatabaseService();
    db.initialize();

    // Create session
    db.createSession({
      id: 'session-1',
      provider: 'claude',
      name: 'Test Session',
      partition: 'persist:claude-1',
    });

    // Create test captures
    const captures = [
      {
        id: 'cap-1',
        session_id: 'session-1',
        provider: 'claude',
        prompt: 'What is TypeScript?',
        response: 'TypeScript is a typed superset of JavaScript.',
      },
      {
        id: 'cap-2',
        session_id: 'session-1',
        provider: 'claude',
        prompt: 'Explain React hooks',
        response: 'React hooks are functions that let you use state.',
      },
    ];

    captures.forEach(capture => {
      db.getDb().prepare(`
        INSERT INTO captures (id, session_id, provider, prompt, response, timestamp, is_archived)
        VALUES (?, ?, ?, ?, ?, ?, 0)
      `).run(
        capture.id,
        capture.session_id,
        capture.provider,
        capture.prompt,
        capture.response,
        Date.now()
      );
    });
  });

  it('should search by keyword in prompt', () => {
    const results = db.getDb().prepare(`
      SELECT c.* FROM captures c
      JOIN captures_fts fts ON c.rowid = fts.rowid
      WHERE captures_fts MATCH ?
      ORDER BY rank
    `).all('TypeScript') as any[];

    expect(results.length).toBeGreaterThan(0);
    expect(results.some(r => r.id === 'cap-1')).toBe(true);
  });

  it('should search by keyword in response', () => {
    const results = db.getDb().prepare(`
      SELECT c.* FROM captures c
      JOIN captures_fts fts ON c.rowid = fts.rowid
      WHERE captures_fts MATCH ?
      ORDER BY rank
    `).all('hooks') as any[];

    expect(results.some(r => r.id === 'cap-2')).toBe(true);
  });
});
```

### Pattern 3: Testing Transactions

```typescript
describe('Transaction Handling', () => {
  it('should rollback on error', () => {
    const db = new TestDatabaseService();
    db.initialize();

    const transaction = db.getDb().transaction(() => {
      db.getDb().prepare(`
        INSERT INTO sessions (id, provider, name, partition, created_at, last_active, is_active)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run('session-1', 'claude', 'Test', 'persist:1', Date.now(), Date.now(), 1);

      // Simulate error
      throw new Error('Rollback transaction');
    });

    expect(() => transaction()).toThrow('Rollback transaction');

    // Verify no data was committed
    const sessions = db.getDb().prepare('SELECT * FROM sessions').all();
    expect(sessions).toHaveLength(0);

    db.close();
  });

  it('should commit on success', () => {
    const db = new TestDatabaseService();
    db.initialize();

    const transaction = db.getDb().transaction(() => {
      db.getDb().prepare(`
        INSERT INTO sessions (id, provider, name, partition, created_at, last_active, is_active)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run('session-1', 'claude', 'Test', 'persist:1', Date.now(), Date.now(), 1);
    });

    transaction();

    // Verify data was committed
    const sessions = db.getDb().prepare('SELECT * FROM sessions').all();
    expect(sessions).toHaveLength(1);

    db.close();
  });
});
```

---

## Zustand Store Testing Patterns

### Pattern 1: Testing Store State Mutations

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useCapturesStore } from '../capturesStore';

// Mock window.electronAPI
const mockElectronAPI = {
  data: {
    getCaptures: vi.fn(),
    searchCaptures: vi.fn(),
    updateTags: vi.fn(),
    updateNotes: vi.fn(),
    setArchived: vi.fn(),
    deleteCapture: vi.fn(),
  },
};

beforeEach(() => {
  // @ts-ignore
  global.window = { electronAPI: mockElectronAPI };

  // Reset store state
  useCapturesStore.setState({
    captures: [],
    loading: false,
    error: null,
    selectedIds: [],
  });

  vi.clearAllMocks();
});

describe('capturesStore', () => {
  describe('fetchCaptures', () => {
    it('should set loading state during fetch', async () => {
      mockElectronAPI.data.getCaptures.mockImplementation(() =>
        new Promise(resolve => {
          setTimeout(() => resolve({ success: true, captures: [] }), 100);
        })
      );

      const promise = useCapturesStore.getState().fetchCaptures();

      // Check loading state immediately
      expect(useCapturesStore.getState().loading).toBe(true);

      await promise;

      expect(useCapturesStore.getState().loading).toBe(false);
    });

    it('should update captures on success', async () => {
      const mockCaptures = [
        { id: '1', prompt: 'Test', response: 'Response' },
      ];

      mockElectronAPI.data.getCaptures.mockResolvedValue({
        success: true,
        captures: mockCaptures,
      });

      await useCapturesStore.getState().fetchCaptures();

      expect(useCapturesStore.getState().captures).toEqual(mockCaptures);
      expect(useCapturesStore.getState().error).toBe(null);
    });

    it('should handle API errors', async () => {
      mockElectronAPI.data.getCaptures.mockResolvedValue({
        success: false,
        error: 'Database error',
      });

      await useCapturesStore.getState().fetchCaptures();

      expect(useCapturesStore.getState().error).toBe('Database error');
      expect(useCapturesStore.getState().loading).toBe(false);
    });
  });

  describe('State Immutability', () => {
    it('should not mutate state directly', async () => {
      const originalCapture = {
        id: 'cap-1',
        notes: 'original',
        prompt: 'test',
        response: 'test',
      };

      useCapturesStore.setState({ captures: [originalCapture] });

      mockElectronAPI.data.updateNotes.mockResolvedValue({ success: true });

      await useCapturesStore.getState().updateNotes('cap-1', 'updated');

      // Original object should not be mutated
      expect(originalCapture.notes).toBe('original');
      // State should have new object
      expect(useCapturesStore.getState().captures[0].notes).toBe('updated');
    });
  });
});
```

### Pattern 2: Testing Store Persistence

```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

describe('Store Persistence', () => {
  it('should persist state to localStorage', () => {
    const useTestStore = create(
      persist(
        (set) => ({
          count: 0,
          increment: () => set((state) => ({ count: state.count + 1 })),
        }),
        {
          name: 'test-storage',
        }
      )
    );

    // Increment count
    useTestStore.getState().increment();

    // Check localStorage
    const stored = localStorage.getItem('test-storage');
    expect(stored).toBeTruthy();
    expect(JSON.parse(stored!).state.count).toBe(1);
  });

  it('should restore state from localStorage', () => {
    // Set initial state in localStorage
    localStorage.setItem(
      'test-storage',
      JSON.stringify({ state: { count: 5 }, version: 0 })
    );

    const useTestStore = create(
      persist(
        (set) => ({
          count: 0,
          increment: () => set((state) => ({ count: state.count + 1 })),
        }),
        {
          name: 'test-storage',
        }
      )
    );

    // State should be restored
    expect(useTestStore.getState().count).toBe(5);
  });
});
```

---

## React Component Testing Patterns

### Pattern 1: Testing Component Rendering

```typescript
import { describe, it, expect, vi } from 'vitest';
import { renderWithProviders, screen } from '@/test-utils/test-helpers';
import { ResearchDataTable } from '../ResearchDataTable';
import { createMockCaptures } from '@/test-utils/mock-factories';

describe('ResearchDataTable', () => {
  it('should render with data', () => {
    const mockData = createMockCaptures(3);

    renderWithProviders(<ResearchDataTable data={mockData} />);

    expect(screen.getByRole('table')).toBeInTheDocument();

    // Verify column headers
    expect(screen.getByText('Timestamp')).toBeInTheDocument();
    expect(screen.getByText('Provider')).toBeInTheDocument();
    expect(screen.getByText('Prompt')).toBeInTheDocument();
  });

  it('should render empty state', () => {
    renderWithProviders(<ResearchDataTable data={[]} />);

    expect(screen.getByText('No results.')).toBeInTheDocument();
  });

  it('should handle missing optional fields', () => {
    const mockData = [
      {
        id: '1',
        session_id: 's1',
        provider: 'claude',
        prompt: 'Test',
        response: 'Response',
        timestamp: Date.now(),
        is_archived: 0,
        // No model, token_count, tags, or notes
      },
    ];

    renderWithProviders(<ResearchDataTable data={mockData} />);

    expect(screen.getByText('N/A')).toBeInTheDocument(); // For model
    expect(screen.getByText('No tags')).toBeInTheDocument();
  });
});
```

### Pattern 2: Testing User Interactions

```typescript
import userEvent from '@testing-library/user-event';
import { waitFor } from '@testing-library/react';

describe('User Interactions', () => {
  it('should handle button clicks', async () => {
    const user = userEvent.setup();
    const onClickMock = vi.fn();

    renderWithProviders(
      <button onClick={onClickMock}>Click Me</button>
    );

    await user.click(screen.getByRole('button', { name: /click me/i }));

    expect(onClickMock).toHaveBeenCalledTimes(1);
  });

  it('should handle form input', async () => {
    const user = userEvent.setup();
    const onSubmitMock = vi.fn();

    renderWithProviders(
      <form onSubmit={onSubmitMock}>
        <input type="text" placeholder="Search..." />
        <button type="submit">Submit</button>
      </form>
    );

    const input = screen.getByPlaceholderText('Search...');
    await user.type(input, 'test query');

    expect(input).toHaveValue('test query');

    await user.click(screen.getByRole('button', { name: /submit/i }));

    expect(onSubmitMock).toHaveBeenCalled();
  });

  it('should handle checkbox selection', async () => {
    const user = userEvent.setup();
    const onChangeMock = vi.fn();

    renderWithProviders(
      <input
        type="checkbox"
        aria-label="Select item"
        onChange={onChangeMock}
      />
    );

    const checkbox = screen.getByRole('checkbox');

    await user.click(checkbox);

    expect(onChangeMock).toHaveBeenCalled();
    expect(checkbox).toBeChecked();
  });
});
```

### Pattern 3: Testing Async Components

```typescript
describe('Async Data Loading', () => {
  it('should show loading state then data', async () => {
    const mockFetch = vi.fn(() =>
      new Promise(resolve =>
        setTimeout(() => resolve({ data: ['item1', 'item2'] }), 100)
      )
    );

    renderWithProviders(<AsyncComponent fetchData={mockFetch} />);

    // Initially shows loading
    expect(screen.getByText(/loading/i)).toBeInTheDocument();

    // Wait for data to load
    await waitFor(() => {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
    });

    // Verify data is displayed
    expect(screen.getByText('item1')).toBeInTheDocument();
    expect(screen.getByText('item2')).toBeInTheDocument();
  });

  it('should handle fetch errors', async () => {
    const mockFetch = vi.fn(() =>
      Promise.reject(new Error('Network error'))
    );

    renderWithProviders(<AsyncComponent fetchData={mockFetch} />);

    await waitFor(() => {
      expect(screen.getByText(/error/i)).toBeInTheDocument();
    });
  });
});
```

---

## IPC Handler Testing Patterns

### Pattern 1: Testing IPC Handlers

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ipcMain } from 'electron';

describe('IPC Handlers', () => {
  let mockDb: any;

  beforeEach(() => {
    mockDb = {
      getCaptures: vi.fn(),
      createSession: vi.fn(),
      updateTags: vi.fn(),
    };

    vi.clearAllMocks();
  });

  describe('data:getCaptures', () => {
    it('should return captures from database', async () => {
      const mockCaptures = [
        { id: '1', prompt: 'Test', response: 'Response' },
      ];

      mockDb.getCaptures.mockReturnValue(mockCaptures);

      // Simulate IPC handler
      const handler = async (_event: any, filters: any) => {
        try {
          const captures = mockDb.getCaptures(filters);
          return { success: true, captures };
        } catch (error: any) {
          return { success: false, error: error.message };
        }
      };

      const result = await handler(null, { provider: 'claude' });

      expect(result.success).toBe(true);
      expect(result.captures).toEqual(mockCaptures);
      expect(mockDb.getCaptures).toHaveBeenCalledWith({ provider: 'claude' });
    });

    it('should handle database errors', async () => {
      mockDb.getCaptures.mockImplementation(() => {
        throw new Error('Database connection failed');
      });

      const handler = async (_event: any, filters: any) => {
        try {
          const captures = mockDb.getCaptures(filters);
          return { success: true, captures };
        } catch (error: any) {
          return { success: false, error: error.message };
        }
      };

      const result = await handler(null, {});

      expect(result.success).toBe(false);
      expect(result.error).toBe('Database connection failed');
    });
  });
});
```

### Pattern 2: Testing IPC Communication Flow

```typescript
describe('IPC Communication Flow', () => {
  it('should handle renderer to main communication', async () => {
    const mockMainHandler = vi.fn(async (filters) => {
      return {
        success: true,
        captures: [{ id: '1', prompt: 'Test' }],
      };
    });

    // Mock ipcMain.handle
    (ipcMain.handle as any).mockImplementation((channel: string, handler: Function) => {
      if (channel === 'data:getCaptures') {
        return handler;
      }
    });

    // Simulate renderer calling IPC
    const result = await mockMainHandler({ provider: 'claude' });

    expect(result.success).toBe(true);
    expect(result.captures).toHaveLength(1);
  });
});
```

---

## E2E Testing Patterns

### Pattern 1: Basic E2E Test Structure

```typescript
import { test, expect } from './fixtures/electron-app';
import { waitForAppReady } from './helpers/test-helpers';

test.describe('Session Management E2E', () => {
  test('should create and activate session', async ({ electronApp, mainWindow }) => {
    await waitForAppReady(mainWindow);

    // Click add session button
    await mainWindow.click('button[aria-label="Add Session"]');

    // Select provider
    await mainWindow.click('text=Claude');

    // Verify session appears in tab bar
    await expect(mainWindow.locator('text=Claude Session')).toBeVisible();

    // Take screenshot for verification
    await mainWindow.screenshot({
      path: 'e2e-results/screenshots/session-created.png',
    });
  });

  test('should navigate to session URL', async ({ mainWindow }) => {
    await waitForAppReady(mainWindow);

    // Create session
    await mainWindow.click('button[aria-label="Add Session"]');
    await mainWindow.click('text=Claude');

    // Wait for session to load
    await mainWindow.waitForTimeout(2000);

    // Verify URL changed (implementation specific)
    const currentUrl = await mainWindow.evaluate(() => window.location.href);
    expect(currentUrl).toBeTruthy();
  });
});
```

### Pattern 2: Testing with Test Database

```typescript
import { test, expect } from './fixtures/electron-app';
import { seedDatabase } from './helpers/seed-database';

test.describe('Search and Filter E2E', () => {
  test('should search captures', async ({ mainWindow, testDbPath }) => {
    // Seed test database with sample data
    await seedDatabase(testDbPath, {
      sessions: 1,
      captures: 10,
    });

    await waitForAppReady(mainWindow);

    // Navigate to data table
    await mainWindow.click('text=Data');

    // Enter search query
    await mainWindow.fill('input[placeholder*="Search"]', 'typescript');

    // Wait for results
    await mainWindow.waitForSelector('table tbody tr');

    // Verify filtered results
    const rows = await mainWindow.locator('table tbody tr').count();
    expect(rows).toBeGreaterThan(0);
  });
});
```

### Pattern 3: Testing File Operations

```typescript
import fs from 'fs';
import path from 'path';

test.describe('Export E2E', () => {
  test('should export data as JSON', async ({ mainWindow }) => {
    await waitForAppReady(mainWindow);

    // Open export dialog
    await mainWindow.click('button:has-text("Export")');

    // Select JSON format
    await mainWindow.selectOption('select[aria-label="Format"]', 'json');

    // Mock file save dialog to use test path
    const exportPath = path.join(process.cwd(), 'e2e-results/export-test.json');

    // Click export button (this would trigger file save in real app)
    await mainWindow.click('button:has-text("Export Data")');

    // Wait for export to complete
    await mainWindow.waitForSelector('text=Export successful', { timeout: 5000 });

    // In a real scenario with mocked dialog, verify file exists
    // expect(fs.existsSync(exportPath)).toBe(true);
  });
});
```

---

## Mocking Patterns

### Pattern 1: Mocking Electron APIs

```typescript
import { vi } from 'vitest';

vi.mock('electron', () => ({
  app: {
    getPath: vi.fn((name: string) => `/mock/path/${name}`),
    getName: vi.fn(() => 'DeepResearch-Test'),
    quit: vi.fn(),
    on: vi.fn(),
  },
  BrowserWindow: vi.fn().mockImplementation(() => ({
    loadURL: vi.fn(),
    webContents: {
      send: vi.fn(),
      on: vi.fn(),
    },
    show: vi.fn(),
    close: vi.fn(),
  })),
  WebContentsView: class MockWebContentsView {
    webContents = {
      loadURL: vi.fn().mockResolvedValue(undefined),
      send: vi.fn(),
      on: vi.fn(),
      destroy: vi.fn(),
    };
    setBounds = vi.fn();
  },
  ipcMain: {
    handle: vi.fn(),
    on: vi.fn(),
  },
}));
```

### Pattern 2: Mocking window.electronAPI

```typescript
beforeAll(() => {
  global.window.electronAPI = {
    data: {
      getCaptures: vi.fn(() => Promise.resolve({
        success: true,
        captures: [],
      })),
      saveCapture: vi.fn(() => Promise.resolve({
        success: true,
      })),
    },
    session: {
      create: vi.fn(() => Promise.resolve({
        success: true,
        sessionId: 'mock-session-id',
      })),
    },
  };
});
```

### Pattern 3: Partial Mocking

```typescript
import * as utils from '../utils';

describe('Partial Mocking', () => {
  it('should mock specific function while keeping others real', () => {
    // Spy on specific function
    const exportSpy = vi.spyOn(utils, 'exportToJSON');
    exportSpy.mockReturnValue('{"mocked": true}');

    // Use mocked function
    const result = utils.exportToJSON([]);
    expect(result).toBe('{"mocked": true}');

    // Other functions still work normally
    const formatted = utils.formatDate(new Date());
    expect(formatted).toBeTruthy();

    // Restore original
    exportSpy.mockRestore();
  });
});
```

---

## Async Testing Patterns

### Pattern 1: Testing Promises

```typescript
describe('Promise Testing', () => {
  it('should resolve promise', async () => {
    const asyncFunction = async () => {
      return new Promise(resolve => {
        setTimeout(() => resolve('success'), 100);
      });
    };

    const result = await asyncFunction();
    expect(result).toBe('success');
  });

  it('should reject promise', async () => {
    const asyncFunction = async () => {
      return new Promise((_, reject) => {
        setTimeout(() => reject(new Error('failed')), 100);
      });
    };

    await expect(asyncFunction()).rejects.toThrow('failed');
  });
});
```

### Pattern 2: Testing with waitFor

```typescript
import { waitFor } from '@testing-library/react';

describe('Async State Updates', () => {
  it('should wait for state update', async () => {
    const store = useTestStore();

    store.fetchData();

    await waitFor(() => {
      expect(store.getState().loading).toBe(false);
    });

    expect(store.getState().data).toBeTruthy();
  });

  it('should timeout if condition not met', async () => {
    const store = useTestStore();

    await expect(
      waitFor(() => {
        expect(store.getState().neverTrue).toBe(true);
      }, { timeout: 1000 })
    ).rejects.toThrow();
  });
});
```

### Pattern 3: Testing Debounced/Throttled Functions

```typescript
import { vi } from 'vitest';

describe('Debounced Functions', () => {
  it('should debounce function calls', async () => {
    vi.useFakeTimers();

    const mockFn = vi.fn();
    const debouncedFn = debounce(mockFn, 500);

    debouncedFn();
    debouncedFn();
    debouncedFn();

    expect(mockFn).not.toHaveBeenCalled();

    vi.advanceTimersByTime(500);

    expect(mockFn).toHaveBeenCalledTimes(1);

    vi.useRealTimers();
  });
});
```

---

## Error Handling Patterns

### Pattern 1: Testing Error Boundaries

```typescript
import { ErrorBoundary } from 'react-error-boundary';

const ThrowError = () => {
  throw new Error('Test error');
};

describe('Error Boundaries', () => {
  it('should catch errors and display fallback', () => {
    const onError = vi.fn();

    renderWithProviders(
      <ErrorBoundary
        fallback={<div>Something went wrong</div>}
        onError={onError}
      >
        <ThrowError />
      </ErrorBoundary>
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(onError).toHaveBeenCalled();
  });
});
```

### Pattern 2: Testing Try-Catch Blocks

```typescript
describe('Error Handling', () => {
  it('should handle errors gracefully', async () => {
    const mockFn = vi.fn().mockRejectedValue(new Error('Network error'));

    const result = await safeAsyncCall(mockFn);

    expect(result.success).toBe(false);
    expect(result.error).toBe('Network error');
  });

  it('should retry on failure', async () => {
    let attempts = 0;
    const mockFn = vi.fn(() => {
      attempts++;
      if (attempts < 3) {
        throw new Error('Retry');
      }
      return 'success';
    });

    const result = await retryAsync(mockFn, 3);

    expect(result).toBe('success');
    expect(attempts).toBe(3);
  });
});
```

### Pattern 3: Testing Validation Errors

```typescript
describe('Input Validation', () => {
  it('should validate required fields', () => {
    const validate = (data: any) => {
      const errors: string[] = [];
      if (!data.name) errors.push('Name is required');
      if (!data.email) errors.push('Email is required');
      return errors;
    };

    const errors = validate({ name: '' });

    expect(errors).toContain('Name is required');
    expect(errors).toContain('Email is required');
  });

  it('should validate email format', () => {
    const validateEmail = (email: string) => {
      const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return regex.test(email);
    };

    expect(validateEmail('invalid')).toBe(false);
    expect(validateEmail('valid@example.com')).toBe(true);
  });
});
```

---

## Additional Resources

- [TESTING_GUIDE.md](./TESTING_GUIDE.md) - Comprehensive testing guide
- [Vitest Examples](https://vitest.dev/guide/examples.html)
- [Testing Library Examples](https://testing-library.com/docs/react-testing-library/example-intro)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)

---

**Last Updated:** 2025-10-21
**Maintained By:** DeepResearch Development Team
