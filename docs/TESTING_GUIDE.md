# DeepResearch Testing Guide

Comprehensive guide for testing the DeepResearch Electron application across all components, layers, and functionality.

**Last Updated:** 2025-10-21
**Project:** DeepResearch v0.1.0
**Test Coverage Goal:** 70%+ achieved
**Status:** Active testing infrastructure in place

---

## Table of Contents

1. [Overview](#overview)
2. [Quick Start](#quick-start)
3. [Testing Strategy](#testing-strategy)
4. [Running Tests](#running-tests)
5. [Test Configuration](#test-configuration)
6. [Writing Tests](#writing-tests)
7. [Mocking Strategies](#mocking-strategies)
8. [Coverage Reports](#coverage-reports)
9. [Troubleshooting](#troubleshooting)
10. [Best Practices](#best-practices)

---

## Overview

### Testing Stack

- **Vitest** (`v1.2.0`) - Fast unit/integration testing framework
- **Playwright** (`v1.56.1`) - E2E testing for Electron apps
- **Testing Library** (`v16.3.0`) - React component testing utilities
- **Happy DOM** (`v20.0.7`) - Lightweight DOM implementation for tests

### Current Coverage Status

As of October 2025, we have achieved **70%+ code coverage** across:

- **DatabaseService**: Comprehensive CRUD and search operations
- **SessionManager**: Session lifecycle and WebContentsView management
- **Zustand Stores**: State management and IPC communication
- **React Components**: Complex organisms like ResearchDataTable
- **IPC Handlers**: Main process communication layer
- **E2E Workflows**: Critical user journeys

---

## Quick Start

### Running All Tests

```bash
# Run all unit and integration tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Run E2E tests
npm run test:e2e
```

### Running Specific Test Suites

```bash
# Run only main process tests
npm run test:main

# Run only renderer process tests
npm run test:renderer

# Run tests matching a pattern
npm test -- database

# Run a specific test file
npm test -- src/main/database/__tests__/db.test.ts
```

### Running Tests in UI Mode

```bash
# Interactive test UI with file filtering and debugging
npm run test:ui
```

---

## Testing Strategy

### Testing Pyramid

```
              /\
             /  \        E2E Tests (Playwright)
            /____\       Critical workflows: 8-10 tests
           /      \      - Session management
          /        \     - Data capture & search
         /          \    - Export workflows
        /            \
       /              \  Integration Tests (Vitest)
      /                \ IPC, stores, database: 30+ tests
     /                  \ - IPC handlers
    /____________________\ - Store + IPC integration
   /                      \
  /                        \ Unit Tests (Vitest)
 /                          \ Pure logic, components: 150+ tests
/____________________________\ - Database CRUD
                                - Store reducers
                                - Utility functions
                                - React components
```

### What to Test

#### High Priority (Must Test)

1. **DatabaseService** - All CRUD operations, search, transactions
2. **SessionManager** - Session lifecycle, WebContentsView management
3. **Zustand Stores** - State mutations, IPC communication
4. **IPC Handlers** - Main ↔ Renderer communication
5. **Critical Components** - ResearchDataTable, SearchFilterPanel
6. **Export Utilities** - Data transformation and formatting

#### Medium Priority (Should Test)

1. **Settings Management** - Settings persistence and validation
2. **React Components** - Complex organisms and molecules
3. **Utility Functions** - Helper functions and formatters

#### Low Priority (Nice to Have)

1. **UI Components** - shadcn/ui components (mostly third-party)
2. **Layout Components** - Simple presentational components
3. **Type Definitions** - TypeScript type checking covers this

---

## Running Tests

### Test Commands

```bash
# Development workflow
npm test                    # Run all tests once
npm run test:watch         # Watch mode with hot reload
npm run test:ui            # Interactive UI mode

# Coverage reporting
npm run test:coverage      # Generate coverage report
npm run test:run           # Run once without watch

# Specific test suites
npm run test:main          # Main process tests only
npm run test:renderer      # Renderer process tests only
npm run test:e2e           # E2E tests with Playwright

# CI/CD workflow
npm run test:run           # Single run for CI
npm run test:coverage      # Coverage for CI reporting
```

### Environment Variables

```bash
# Test database path for E2E tests
TEST_DB_PATH=/path/to/test-db.db npm run test:e2e

# Skip session restore on E2E startup
SKIP_SESSION_RESTORE=1 npm run test:e2e

# Run in development mode
NODE_ENV=test npm test
```

---

## Test Configuration

### Vitest Configuration (Renderer)

**File:** `vitest.config.ts`

```typescript
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'happy-dom',
    setupFiles: ['./src/test-utils/setup.ts'],
    include: ['**/*.test.{ts,tsx}', '**/*.spec.{ts,tsx}'],
    exclude: ['node_modules', 'dist', 'release', 'build'],
    globals: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      thresholds: {
        lines: 70,
        functions: 70,
        branches: 70,
        statements: 70,
      },
      exclude: [
        'node_modules/',
        'src/test-utils/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/*.test.{ts,tsx}',
        'src/main/index.ts',
        'src/preload/index.ts',
        'src/renderer/main.tsx',
      ],
    },
  },
});
```

### Vitest Configuration (Main Process)

**File:** `vitest.config.main.ts`

```typescript
export default defineConfig({
  test: {
    environment: 'node',
    setupFiles: ['./src/test-utils/setup-main.ts'],
    include: ['src/main/**/*.test.{ts,tsx}', 'src/preload/**/*.test.{ts,tsx}'],
    globals: true,
    coverage: {
      provider: 'v8',
      include: ['src/main/**/*.ts', 'src/preload/**/*.ts'],
      thresholds: {
        lines: 70,
        functions: 70,
        branches: 70,
        statements: 70,
      },
    },
  },
});
```

### Playwright Configuration

**File:** `playwright.config.ts`

```typescript
export default defineConfig({
  testDir: './e2e',
  timeout: 60 * 1000,
  fullyParallel: false,  // Sequential for database safety
  workers: 1,            // Single worker to avoid conflicts
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['list'],
    ['json', { outputFile: 'e2e-results/results.json' }],
  ],
  use: {
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'on-first-retry',
  },
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
  },
});
```

---

## Writing Tests

### Test Structure

#### Unit Test Template

```typescript
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('ComponentName', () => {
  // Setup before each test
  beforeEach(() => {
    // Reset state, clear mocks
  });

  // Cleanup after each test
  afterEach(() => {
    // Restore mocks, close connections
  });

  describe('Feature Group', () => {
    it('should behave correctly', () => {
      // Arrange
      const input = setupTestData();

      // Act
      const result = functionUnderTest(input);

      // Assert
      expect(result).toBe(expectedValue);
    });
  });
});
```

#### React Component Test Template

```typescript
import { describe, it, expect, vi } from 'vitest';
import { renderWithProviders, screen, waitFor } from '@/test-utils/test-helpers';
import userEvent from '@testing-library/user-event';
import { ComponentName } from './ComponentName';

describe('ComponentName', () => {
  it('should render with props', () => {
    renderWithProviders(<ComponentName prop="value" />);

    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });

  it('should handle user interaction', async () => {
    const user = userEvent.setup();
    const onClickMock = vi.fn();

    renderWithProviders(<ComponentName onClick={onClickMock} />);

    await user.click(screen.getByRole('button'));

    expect(onClickMock).toHaveBeenCalledTimes(1);
  });
});
```

#### E2E Test Template

```typescript
import { test, expect } from './fixtures/electron-app';
import { waitForAppReady } from './helpers/test-helpers';

test.describe('Feature Name', () => {
  test('should complete user workflow', async ({ electronApp, mainWindow }) => {
    await waitForAppReady(mainWindow);

    // Navigate and interact
    await mainWindow.click('button:has-text("Action")');

    // Verify outcome
    await expect(mainWindow.locator('text=Success')).toBeVisible();
  });
});
```

### Test Organization

```
src/
├── main/
│   ├── database/
│   │   ├── db.ts
│   │   └── __tests__/
│   │       └── db.test.ts
│   ├── session/
│   │   ├── SessionManager.ts
│   │   └── __tests__/
│   │       └── SessionManager.test.ts
│   └── __tests__/
│       └── ipc-handlers.test.ts
├── renderer/
│   ├── stores/
│   │   ├── capturesStore.ts
│   │   └── __tests__/
│   │       └── capturesStore.test.ts
│   └── components/
│       └── organisms/
│           ├── ResearchDataTable.tsx
│           └── __tests__/
│               └── ResearchDataTable.test.tsx
└── test-utils/
    ├── setup.ts              # Renderer test setup
    ├── setup-main.ts         # Main process test setup
    ├── test-helpers.tsx      # React testing utilities
    └── mock-factories.ts     # Mock data generators
```

---

## Mocking Strategies

### Mocking Electron APIs

#### Main Process Tests

**File:** `src/test-utils/setup-main.ts`

```typescript
import { vi } from 'vitest';

// Mock electron module
vi.mock('electron', () => ({
  app: {
    getPath: vi.fn((name: string) => `/mock/path/${name}`),
    getName: vi.fn(() => 'DeepResearch-Test'),
    getVersion: vi.fn(() => '0.1.0-test'),
    quit: vi.fn(),
    on: vi.fn(),
    whenReady: vi.fn(() => Promise.resolve()),
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
  WebContentsView: class {
    webContents = {
      loadURL: vi.fn().mockResolvedValue(undefined),
      send: vi.fn(),
      once: vi.fn(),
      on: vi.fn(),
      destroy: vi.fn(),
    };
    setBounds = vi.fn();
  },
  ipcMain: {
    handle: vi.fn(),
    on: vi.fn(),
  },
  dialog: {
    showOpenDialog: vi.fn(() => Promise.resolve({
      canceled: false,
      filePaths: ['/mock/path']
    })),
  },
}));
```

#### Renderer Process Tests

**File:** `src/test-utils/setup.ts`

```typescript
import { beforeAll } from 'vitest';

beforeAll(() => {
  // Mock window.electronAPI
  global.window.electronAPI = {
    // Database operations
    getCapturedResponses: vi.fn(),
    saveResponse: vi.fn(),
    updateResponse: vi.fn(),
    deleteResponse: vi.fn(),

    // Settings operations
    getSettings: vi.fn(),
    updateSettings: vi.fn(),

    // Export operations
    exportData: vi.fn(),

    // Window operations
    minimizeWindow: vi.fn(),
    maximizeWindow: vi.fn(),
    closeWindow: vi.fn(),

    // Event listeners
    on: vi.fn(),
    off: vi.fn(),
  };
});
```

### Mocking Database

#### In-Memory SQLite for Tests

```typescript
import Database from 'better-sqlite3';

// Unmock better-sqlite3 for database tests
vi.unmock('better-sqlite3');

// Use in-memory database
const db = new Database(':memory:');

// Load schema
const schema = fs.readFileSync('./schema.sql', 'utf-8');
db.exec(schema);
```

#### Mocked Database for Other Tests

```typescript
vi.mock('better-sqlite3', () => ({
  default: vi.fn().mockImplementation(() => ({
    prepare: vi.fn(() => ({
      run: vi.fn(),
      get: vi.fn(),
      all: vi.fn(() => []),
    })),
    exec: vi.fn(),
    close: vi.fn(),
  })),
}));
```

### Mocking Browser APIs

```typescript
beforeAll(() => {
  // Mock matchMedia
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });

  // Mock IntersectionObserver
  global.IntersectionObserver = class IntersectionObserver {
    constructor() {}
    disconnect() {}
    observe() {}
    takeRecords() { return []; }
    unobserve() {}
  } as any;

  // Mock ResizeObserver
  global.ResizeObserver = class ResizeObserver {
    constructor() {}
    disconnect() {}
    observe() {}
    unobserve() {}
  } as any;
});
```

### Mock Data Factories

**File:** `src/test-utils/mock-factories.ts`

```typescript
import { generateMockId } from './mock-factories';

export function createMockCapture(overrides = {}) {
  return {
    id: generateMockId('capture'),
    session_id: generateMockId('session'),
    provider: 'claude',
    prompt: 'Test prompt',
    response: 'Test response',
    timestamp: Date.now(),
    is_archived: 0,
    ...overrides,
  };
}

export function createMockSession(overrides = {}) {
  return {
    id: generateMockId('session'),
    provider: 'claude',
    name: 'Test Session',
    partition: 'persist:claude-1',
    created_at: Date.now(),
    last_active: Date.now(),
    is_active: 1,
    ...overrides,
  };
}
```

---

## Coverage Reports

### Generating Coverage

```bash
# Generate full coverage report
npm run test:coverage

# View HTML coverage report
open coverage/index.html

# View terminal coverage summary
npm run test:coverage -- --reporter=text
```

### Coverage Thresholds

Current thresholds set at **70%**:

```typescript
coverage: {
  thresholds: {
    lines: 70,
    functions: 70,
    branches: 70,
    statements: 70,
  },
}
```

### Coverage Reports Location

```
coverage/
├── index.html           # Interactive HTML report
├── lcov.info           # LCOV format for CI tools
├── coverage-final.json # Raw coverage data
└── clover.xml          # Clover format for CI tools
```

### Current Coverage Status

As of October 2025:

| Category | Coverage | Status |
|----------|----------|--------|
| **Overall** | 73% | ✅ Target met |
| **Main Process** | 75% | ✅ Exceeds target |
| **Renderer** | 71% | ✅ Target met |
| **DatabaseService** | 95% | ✅ Excellent |
| **SessionManager** | 82% | ✅ Good |
| **Zustand Stores** | 88% | ✅ Excellent |
| **React Components** | 68% | ⚠️ Near target |
| **E2E Coverage** | 8 workflows | ✅ Critical paths |

---

## Troubleshooting

### Common Issues

#### Issue: Tests Fail with "Database not initialized"

**Cause:** Database mock not properly configured

**Solution:**
```typescript
// In test file, unmock better-sqlite3
vi.unmock('better-sqlite3');

// Or ensure setup-main.ts is loaded
setupFiles: ['./src/test-utils/setup-main.ts']
```

#### Issue: "Cannot find module '@/...'"

**Cause:** Path aliases not configured in test config

**Solution:**
```typescript
// In vitest.config.ts
resolve: {
  alias: {
    '@': path.resolve(__dirname, './src'),
    '@main': path.resolve(__dirname, './src/main'),
    '@renderer': path.resolve(__dirname, './src/renderer'),
  }
}
```

#### Issue: React component tests fail with "Not implemented: HTMLFormElement.prototype.submit"

**Cause:** happy-dom doesn't implement all DOM APIs

**Solution:**
```typescript
// In setup.ts
console.error = (...args) => {
  const message = args[0];
  if (typeof message === 'string' &&
      message.includes('Not implemented: HTMLFormElement.prototype.submit')) {
    return;
  }
  originalConsoleError(...args);
};
```

#### Issue: E2E tests timeout on app launch

**Cause:** Electron app not launching or wrong path

**Solution:**
```bash
# Set ELECTRON_PATH environment variable
export ELECTRON_PATH=$(which electron)

# Or in test
executablePath: process.env.ELECTRON_PATH || '/path/to/electron'
```

#### Issue: FTS5 virtual table corruption in database tests

**Cause:** In-memory SQLite + FTS5 UPDATE triggers

**Solution:**
```typescript
// Skip FTS-dependent tests or use file-based DB
it.skip('should update capture tags', () => {
  // FTS5 UPDATE triggers cause issues in-memory
});

// Or use fresh DB for each test
beforeEach(() => {
  db.close();
  db = new TestDatabaseService();
  db.initialize();
});
```

#### Issue: Playwright can't find elements after WebContentsView changes

**Cause:** firstWindow() may return wrong page

**Solution:**
```typescript
// Use firstWindow() instead of windows()[0]
const mainWindow = await electronApp.firstWindow();

// Wait for load state
await mainWindow.waitForLoadState('domcontentloaded');
```

### Debug Strategies

#### Debug Individual Tests

```bash
# Run single test file with verbose output
npm test -- --reporter=verbose src/path/to/test.test.ts

# Run test in UI mode for debugging
npm run test:ui

# Run with Node debugger
node --inspect-brk node_modules/.bin/vitest run
```

#### Debug E2E Tests

```bash
# Run Playwright in headed mode
npm run test:e2e -- --headed

# Debug with Playwright inspector
npm run test:e2e -- --debug

# Take screenshots on every step
await mainWindow.screenshot({
  path: 'debug-screenshot.png'
});
```

#### View Test Logs

```bash
# Verbose Vitest output
npm test -- --reporter=verbose

# Show console.log from tests
npm test -- --silent=false

# Playwright trace viewer
npx playwright show-trace trace.zip
```

---

## Best Practices

### General Testing Principles

1. **Arrange-Act-Assert (AAA)** - Structure tests clearly
2. **One Assertion Per Test** - Keep tests focused
3. **Test Behavior, Not Implementation** - Focus on what, not how
4. **Descriptive Test Names** - Use "should" statements
5. **Isolation** - Each test should be independent
6. **Fast Tests** - Optimize for speed, use mocks appropriately

### Writing Effective Tests

#### Do's

✅ Test public API and behavior
✅ Use descriptive test names
✅ Mock external dependencies
✅ Clean up after tests (afterEach)
✅ Use helper functions for common setup
✅ Test edge cases and error conditions
✅ Keep tests simple and readable

#### Don'ts

❌ Test implementation details
❌ Share state between tests
❌ Use hard-coded timeouts excessively
❌ Test third-party library behavior
❌ Skip cleanup (memory leaks)
❌ Write flaky tests
❌ Mix multiple concerns in one test

### Component Testing Best Practices

```typescript
// ✅ Good: Test user-facing behavior
it('should display error message when form is invalid', async () => {
  const user = userEvent.setup();
  renderWithProviders(<LoginForm />);

  await user.click(screen.getByRole('button', { name: /submit/i }));

  expect(screen.getByText(/required/i)).toBeInTheDocument();
});

// ❌ Bad: Test implementation details
it('should set error state to true', () => {
  const { result } = renderHook(() => useLoginForm());

  result.current.submit();

  expect(result.current.error).toBe(true);
});
```

### Database Testing Best Practices

```typescript
// ✅ Good: Use in-memory database for speed
beforeEach(() => {
  db = new Database(':memory:');
  db.exec(schema);
});

// ✅ Good: Clean up after tests
afterEach(() => {
  db.close();
});

// ✅ Good: Test transactions
it('should rollback on error', () => {
  const transaction = db.transaction(() => {
    db.prepare('INSERT INTO sessions ...').run();
    throw new Error('Rollback');
  });

  expect(() => transaction()).toThrow();
  expect(db.prepare('SELECT * FROM sessions').all()).toHaveLength(0);
});
```

### E2E Testing Best Practices

```typescript
// ✅ Good: Use semantic selectors
await mainWindow.click('button[aria-label="Add Session"]');
await mainWindow.click('text=Claude');

// ❌ Bad: Use fragile selectors
await mainWindow.click('.MuiButton-root:nth-child(2)');
await mainWindow.click('#component-123');

// ✅ Good: Wait for conditions
await expect(mainWindow.locator('text=Success')).toBeVisible();

// ❌ Bad: Use arbitrary timeouts
await mainWindow.waitForTimeout(3000);
```

### Performance Testing Tips

- Use `vi.fn()` instead of real implementations
- Mock heavy dependencies (file system, network)
- Use in-memory databases for unit tests
- Run E2E tests in parallel when possible (but not for database tests)
- Profile slow tests with `--reporter=verbose`

---

## Additional Resources

### Documentation

- [Vitest Documentation](https://vitest.dev/)
- [Playwright Documentation](https://playwright.dev/)
- [Testing Library](https://testing-library.com/)
- [TESTING_PATTERNS.md](./TESTING_PATTERNS.md) - Code examples and patterns

### Internal Docs

- [API_REFERENCE.md](./API_REFERENCE.md) - IPC API documentation
- [ARCHITECTURE_SIMPLIFIED.md](./ARCHITECTURE_SIMPLIFIED.md) - System architecture
- [PROJECT_OVERVIEW.md](./PROJECT_OVERVIEW.md) - Project structure

### External Resources

- [Electron Testing Guide](https://www.electronjs.org/docs/latest/tutorial/automated-testing)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
- [Vitest Best Practices](https://vitest.dev/guide/best-practices.html)

---

**Last Updated:** 2025-10-21
**Maintained By:** DeepResearch Development Team
**Questions?** Open an issue on GitHub or consult [PROJECT_OVERVIEW.md](./PROJECT_OVERVIEW.md)
