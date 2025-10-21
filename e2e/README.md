# E2E Tests for DeepResearch

## Overview

This directory contains End-to-End (E2E) tests for the DeepResearch Electron application using Playwright.

## Test Files Created

### 1. `data-capture.spec.ts`
Complete E2E test suite for the data capture workflow covering:
- Displaying captured AI responses in the data panel
- Opening and viewing capture details in a dialog
- Showing multiple captures with stats
- Handling empty state when no captures exist
- Searching and filtering captures
- Editing tags in the capture detail dialog

**Status**: ⚠️ Tests written but require native module rebuild

### 2. `helpers/seed-database.ts`
Database seeding helper that allows tests to:
- Seed test database with mock captures
- Clear captures from the test database
- Get all captures for verification

**Status**: ⚠️ Requires `better-sqlite3` to be rebuilt for Electron

## Current Issues

### Native Module Compatibility
The tests use `better-sqlite3` to seed the test database directly. However, there's a Node.js version mismatch:
- Playwright tests run with system Node.js (v20+, NODE_MODULE_VERSION 127)
- Electron app runs with Electron's Node.js (v18, NODE_MODULE_VERSION 119)

**Solutions**:

#### Option 1: Add Test IPC Handler (Recommended)
Add a test-only IPC handler to create captures:

```typescript
// In src/main/index.ts (only when NODE_ENV === 'test')
if (process.env.NODE_ENV === 'test') {
  ipcMain.handle('test:createCapture', async (_event, captureData) => {
    try {
      const capture = db.createCapture(captureData);
      return { success: true, capture };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('test:clearCaptures', async () => {
    try {
      db.getDb().prepare('DELETE FROM captures').run();
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });
}
```

Then update tests to use this IPC handler instead of direct database access.

#### Option 2: Use SQL File Seeding
Pre-create SQL files with INSERT statements and execute them against the test database using sqlite3 CLI.

#### Option 3: Mock Electron Env in Playwright
Configure Playwright to use Electron's Node.js version for test execution.

## Test Structure

```
e2e/
├── fixtures/
│   └── electron-app.ts          # Test fixtures (electronApp, mainWindow, testDbPath)
├── helpers/
│   ├── test-helpers.ts          # UI interaction helpers
│   └── seed-database.ts         # Database seeding helpers (needs fix)
├── data-capture.spec.ts         # Data capture workflow tests (needs fix)
├── smoke.spec.ts                # Basic smoke tests (passing)
└── README.md                    # This file
```

## Running Tests

```bash
# Run all E2E tests
npm run test:e2e

# Run specific test file
npx playwright test e2e/data-capture.spec.ts

# Run with UI
npx playwright test --ui

# Run in headed mode (see browser)
npx playwright test --headed
```

## Test Coverage

### Implemented
- ✅ Smoke tests (app launch, window title, layout)
- ✅ Data capture UI workflow tests (written, need fixing)
- ✅ Capture detail dialog tests (written, need fixing)
- ✅ Search and filter tests (written, need fixing)

### Needed
- Session management workflow
- Settings dialog
- Export functionality
- CDP interception (requires real provider connections)

## Screenshots

Test screenshots are saved to `e2e-results/screenshots/` including:
- `capture-in-panel.png` - Captures displayed in side panel
- `capture-detail-dialog.png` - Detail view of a capture
- `recent-captures-panel.png` - Panel with multiple captures
- `empty-state.png` - Empty state when no captures exist
- `filtered-captures.png` - Filtered search results
- `capture-tags.png` - Tag editing in detail dialog

## Next Steps

1. Implement Option 1 (Test IPC handlers) to fix native module issues
2. Run tests to verify they pass
3. Add more test coverage for other workflows
4. Set up CI/CD to run E2E tests automatically

## Notes

- Tests use an isolated test database (`test-data/e2e/test-deep-research.db`)
- Each test run starts with a fresh database
- Tests run sequentially to avoid database conflicts
- The app is launched in test mode with `NODE_ENV=test` and `TEST_DB_PATH` set
