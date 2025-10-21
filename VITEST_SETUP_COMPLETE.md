# Vitest Testing Infrastructure Setup - COMPLETE ✅

**Date:** October 20, 2025
**Project:** DeepResearch v0.1.0
**Status:** All tests passing (31/31)

## Summary

Successfully configured Vitest testing infrastructure for the DeepResearch Electron application with full support for both renderer process (React) and main process (Node.js) testing.

## What Was Installed

### Dependencies Added

All dependencies installed with `--legacy-peer-deps` flag to handle peer dependency conflicts:

```json
{
  "@vitest/ui": "^3.2.4",
  "@vitest/coverage-v8": "^3.2.4",
  "happy-dom": "^20.0.7",
  "@testing-library/react": "^16.3.0",
  "@testing-library/user-event": "^14.6.1",
  "@testing-library/jest-dom": "^6.9.1",
  "@testing-library/dom": "^10.4.1"
}
```

**Note:** `vitest` was already present in the project at version `^1.2.0`

## Configuration Files Created

### 1. vitest.config.ts
**Location:** `/home/jeff/VScode_Projects/DeepResearch/vitest.config.ts`

**Purpose:** Main configuration for renderer process tests (React components)

**Key Features:**
- Environment: `happy-dom` for fast DOM testing
- Coverage provider: `v8`
- Coverage thresholds: 70% across all metrics
- Path aliases for `@/`, `@renderer/`, `@main/`, `@shared/`, `@preload/`
- Excludes test utilities, config files, and entry points from coverage
- Setup file: `./src/test-utils/setup.ts`

### 2. vitest.config.main.ts
**Location:** `/home/jeff/VScode_Projects/DeepResearch/vitest.config.main.ts`

**Purpose:** Configuration for main process tests (Electron main/preload)

**Key Features:**
- Environment: `node` for main process code
- Includes only `src/main/**/*.test.ts` and `src/preload/**/*.test.ts`
- Same coverage thresholds: 70%
- Setup file: `./src/test-utils/setup-main.ts`

## Test Utilities Created

### 1. src/test-utils/setup.ts
**Purpose:** Global setup for renderer process tests

**Features:**
- Imports `@testing-library/jest-dom` matchers
- Auto-cleanup after each test
- Mocks `window.electronAPI` with all IPC methods
- Mocks `window.matchMedia`
- Mocks `IntersectionObserver`
- Mocks `ResizeObserver`
- Filters out console noise in tests

### 2. src/test-utils/setup-main.ts
**Purpose:** Global setup for main process tests

**Features:**
- Mocks entire `electron` module (app, BrowserWindow, ipcMain, dialog, shell, etc.)
- Mocks `electron-log`
- Mocks `better-sqlite3` database

### 3. src/test-utils/test-helpers.tsx
**Purpose:** Custom test utilities and helpers

**Exports:**
- `renderWithProviders()` - Renders components with BrowserRouter
- `waitForCondition()` - Wait for async conditions
- `flushPromises()` - Flush pending promises
- `createDeferred()` - Create deferred promises for testing
- `MockLocalStorage` class
- `setupLocalStorageMock()` - Mock localStorage
- `createMockFile()` - Create mock files for upload testing
- `sleep()` - Sleep utility
- Re-exports all `@testing-library/react` utilities
- Re-exports `userEvent` from `@testing-library/user-event`

### 4. src/test-utils/mock-factories.ts
**Purpose:** Factory functions for creating mock data

**Exports:**
- `createMockUser(overrides?)` - Create User object
- `createMockAISession(overrides?)` - Create AISession object
- `createMockCapturedResponse(overrides?)` - Create CapturedResponse object
- `createMockAppSettings(overrides?)` - Create AppSettings object
- `createMockUsers(count)` - Create array of users
- `createMockAISessions(count)` - Create array of sessions
- `createMockCapturedResponses(count)` - Create array of responses
- `createMockElectronAPI()` - Create fully mocked electronAPI
- `generateMockId(prefix)` - Generate unique IDs
- `resetMockIdCounter()` - Reset ID counter for consistent tests

## Smoke Tests Created

### 1. src/test-utils/smoke.test.ts
**Tests:** 16 tests
- Basic Vitest assertions
- Mock factory functionality
- Environment setup verification
- Window, electronAPI, matchMedia, IntersectionObserver, ResizeObserver

### 2. src/renderer/components/smoke.test.tsx
**Tests:** 6 tests
- React component rendering
- React Testing Library integration
- Custom renderWithProviders helper
- Query utilities (getBy, queryBy)

### 3. src/main/smoke.test.ts
**Tests:** 9 tests
- Basic Node.js assertions
- Async operations
- Mock functions
- Promises and error handling
- Database mocking

## NPM Scripts Added

Updated `package.json` with comprehensive test scripts:

```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage",
    "test:run": "vitest run",
    "test:main": "vitest --config vitest.config.main.ts",
    "test:renderer": "vitest --config vitest.config.ts",
    "test:watch": "vitest --watch"
  }
}
```

## Test Results

All 31 tests passing:

```
✓ src/test-utils/smoke.test.ts (16 tests)
  ✓ Vitest Setup - Smoke Tests (11 tests)
  ✓ Environment Setup (5 tests)

✓ src/renderer/components/smoke.test.tsx (6 tests)
  ✓ React Testing Library Integration (5 tests)
  ✓ Custom Test Helpers (1 test)

✓ src/main/smoke.test.ts (9 tests)
  ✓ Main Process - Basic Node.js Tests (5 tests)
  ✓ Database Mocking (1 test)
  ✓ Utility Functions (3 tests)

Test Files: 3 passed (3)
Tests: 31 passed (31)
Duration: ~2.4s
```

## How to Use

### Running Tests

```bash
# Run all tests (watch mode)
npm test

# Run all tests once (CI mode)
npm run test:run

# Run with interactive UI
npm run test:ui

# Run with coverage report
npm run test:coverage

# Run only renderer tests
npm run test:renderer

# Run only main process tests
npm run test:main
```

### Writing Tests

#### Example: React Component Test

```tsx
import { describe, it, expect } from 'vitest';
import { renderWithProviders, screen } from '@/test-utils/test-helpers';
import { MyComponent } from './MyComponent';

describe('MyComponent', () => {
  it('should render correctly', () => {
    renderWithProviders(<MyComponent />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });
});
```

#### Example: Using Mock Factories

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { createMockUser, resetMockIdCounter } from '@/test-utils/mock-factories';

describe('User Service', () => {
  beforeEach(() => {
    resetMockIdCounter();
  });

  it('should process user data', () => {
    const user = createMockUser({ email: 'test@example.com' });
    expect(user.email).toBe('test@example.com');
  });
});
```

#### Example: Main Process Test

```typescript
import { describe, it, expect } from 'vitest';

describe('Database Service', () => {
  it('should save data correctly', async () => {
    const Database = (await import('better-sqlite3')).default;
    const db = new Database(':memory:');

    // Test your database logic
    expect(db).toBeDefined();
  });
});
```

## Project Structure

```
DeepResearch/
├── src/
│   ├── main/
│   │   └── smoke.test.ts             # Main process smoke tests
│   ├── renderer/
│   │   └── components/
│   │       └── smoke.test.tsx        # React component smoke tests
│   └── test-utils/
│       ├── setup.ts                  # Renderer test setup
│       ├── setup-main.ts             # Main process test setup
│       ├── test-helpers.tsx          # Test utilities
│       ├── mock-factories.ts         # Mock data factories
│       └── smoke.test.ts             # Test infrastructure smoke tests
├── vitest.config.ts                  # Renderer tests config
├── vitest.config.main.ts             # Main process tests config
└── package.json                      # Updated with test scripts
```

## Coverage Configuration

Coverage thresholds set to 70% for:
- Lines
- Functions
- Branches
- Statements

Excluded from coverage:
- `node_modules/`
- `dist/`, `release/`, `build/`
- `src/test-utils/`
- `**/*.d.ts` (type definitions)
- `**/*.config.*` (config files)
- `**/*.test.{ts,tsx}` (test files)
- Entry points: `src/main/index.ts`, `src/preload/index.ts`, `src/renderer/main.tsx`

## Known Limitations

1. **Electron Module Mocking**: The Electron module is mocked in `setup-main.ts`, but actual Electron features need to be tested with integration or E2E tests using Playwright.

2. **React Router Warnings**: React Router 6 shows future flag warnings in tests. These are harmless but can be suppressed if needed.

3. **Path Aliases**: All path aliases (`@/`, `@renderer/`, `@main/`, etc.) are configured and working in tests.

## Next Steps

To expand test coverage:

1. **Write Unit Tests** for:
   - Database operations (`src/main/database/`)
   - Zustand stores (`src/renderer/stores/`)
   - Utility functions (`src/renderer/lib/`)
   - Components (`src/renderer/components/`)

2. **Write Integration Tests** for:
   - IPC communication between main and renderer
   - Database + Session Manager
   - Store + IPC interactions

3. **Write E2E Tests** using Playwright for:
   - Complete user workflows
   - Session management
   - Data capture and export

## Documentation

For comprehensive testing strategies and patterns, see:
- `/home/jeff/VScode_Projects/DeepResearch/docs/TESTING_GUIDE.md`

## Troubleshooting

### Peer Dependency Issues

If you encounter peer dependency errors:

```bash
npm install --legacy-peer-deps
```

### Test Failures

Clear cache and reinstall:

```bash
rm -rf node_modules package-lock.json
npm install
npm run test:run
```

### Coverage Reports

Generate HTML coverage report:

```bash
npm run test:coverage
open coverage/index.html
```

---

**Setup completed successfully!** All infrastructure is in place and verified with passing smoke tests. You can now start writing comprehensive tests for your application.
