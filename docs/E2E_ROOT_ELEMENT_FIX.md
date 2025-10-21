# E2E Test #root Element Fix - Investigation & Solution

## Executive Summary

**Problem:** 29/38 E2E tests were failing with "#root element not found" errors and "Internal error: step id not found: fixture@XX" messages.

**Root Cause:** Playwright's `electronApp.windows()[0]` was unreliably returning WebContentsView Page objects instead of the main BrowserWindow Page when the app had active provider sessions loaded.

**Solution:**
1. Use `electronApp.firstWindow()` instead of `windows()[0]`
2. Skip session restoration in test mode via `SKIP_SESSION_RESTORE` environment variable
3. Updated fixture implementation

**Result:** All smoke tests (4/4) now pass. Remaining test failures are unrelated test-specific issues (strict mode violations, search functionality).

---

## Technical Deep Dive

### Problem Analysis

#### Initial Symptoms
- **29/38 E2E tests failing** with identical error:
  ```
  Error: expect(locator).toBeAttached() failed
  Locator: locator('#root')
  Expected: attached
  Timeout: 10000ms
  Error: element(s) not found
  ```

- **"Internal error: step id not found: fixture@XX"** appearing before test execution

- **Smoke tests passing initially**, then failing after rebuild

- **Screenshots showed app fully rendered** with all UI components visible

#### Investigation Process

1. **File Analysis**
   - `e2e/fixtures/electron-app.ts:86-95` - Fixture using `windows()[0]`
   - `e2e/helpers/test-helpers.ts:197-206` - `waitForAppReady()` expecting `#root`
   - `index.html:10` - Standard `<div id="root"></div>` present
   - `src/renderer/main.tsx:7` - React rendering to `#root` correctly

2. **Critical Discovery in Error Context**
   - `e2e-results/artifacts/.../error-context.md` showed:
     ```yaml
     - link "Sign in" [ref=e4]:
       - /url: https://accounts.google.com/ServiceLogin...gemini.google.com
     ```
   - **Playwright was seeing Google Gemini sign-in page, not the DeepResearch app!**

3. **WebContentsView Investigation**
   - `src/main/session/SessionManager.ts:62` creates `WebContentsView` instances
   - `src/main/session/SessionManager.ts:134` calls `mainWindow.contentView.addChildView(view)`
   - `src/main/index.ts:76-78` loads persisted sessions on startup
   - SessionManager creates WebContentsView instances for Claude, OpenAI, Gemini sessions

4. **Web Research Findings**
   - GitHub Issue #6760: "Page is not a BrowserWindow" - Playwright creates separate Page objects for each BrowserView
   - `electronApp.windows()` returns array including both BrowserWindow AND all BrowserView Pages
   - **Array order is unpredictable** - `windows()[0]` might return any Page object
   - **Solution:** Use `electronApp.firstWindow()` which reliably returns the first BrowserWindow

### Root Cause

**Playwright + Electron + WebContentsView Interaction:**

```
┌─────────────────────────────────────────────────┐
│  Electron App Startup                           │
│  ├── Create BrowserWindow (main)                │
│  ├── Load persisted sessions                    │
│  └── Create WebContentsView for each session    │
│      ├── Claude session → WebContentsView       │
│      ├── OpenAI session → WebContentsView       │
│      └── Gemini session → WebContentsView       │
└─────────────────────────────────────────────────┘
            ↓
┌─────────────────────────────────────────────────┐
│  Playwright electronApp.windows()               │
│  Returns: [Page, Page, Page, Page]              │
│           ↑     ↑     ↑     ↑                   │
│           │     └─────┴─────┘                   │
│           │     WebContentsViews                │
│           └─ Main Window (maybe!)               │
└─────────────────────────────────────────────────┘
            ↓
┌─────────────────────────────────────────────────┐
│  Test Fixture: windows()[0]                     │
│  Problem: Might get WebContentsView Page!       │
│  Result: Looking at claude.ai or                │
│          gemini.google.com instead of           │
│          app's #root element                    │
└─────────────────────────────────────────────────┘
```

**Why It Appeared Intermittent:**
- Fresh test database → No persisted sessions → No WebContentsViews → Tests pass
- Database with saved sessions → WebContentsViews created → `windows()[0]` unreliable → Tests fail

---

## Solution Implementation

### 1. Updated Electron Fixture (`e2e/fixtures/electron-app.ts`)

**Changes:**

```typescript
// BEFORE
electronApp: async ({ testDbPath }, use) => {
  const app = await electron.launch({
    args: [path.join(__dirname, '../../dist/main/index.js')],
    env: {
      ...process.env,
      NODE_ENV: 'test',
      TEST_DB_PATH: testDbPath,
      ELECTRON_IS_DEV: '0',
    },
    executablePath: process.env.ELECTRON_PATH,
  });

  await app.context().waitForEvent('page', { timeout: 30000 });
  await use(app);
  await app.close();
},

mainWindow: async ({ electronApp }, use) => {
  const windows = electronApp.windows();
  const mainWindow = windows[0] || (await electronApp.waitForEvent('window'));
  await mainWindow.waitForLoadState('domcontentloaded');
  await use(mainWindow);
},
```

```typescript
// AFTER
electronApp: async ({ testDbPath }, use) => {
  const app = await electron.launch({
    args: [path.join(__dirname, '../../dist/main/index.js')],
    env: {
      ...process.env,
      NODE_ENV: 'test',
      TEST_DB_PATH: testDbPath,
      ELECTRON_IS_DEV: '0',
      // ✅ Prevent loading persisted sessions
      SKIP_SESSION_RESTORE: '1',
    },
    executablePath: process.env.ELECTRON_PATH,
  });

  // ✅ Use firstWindow() to ensure main BrowserWindow is ready
  await app.firstWindow();
  await use(app);
  await app.close();
},

mainWindow: async ({ electronApp }, use) => {
  // ✅ Use firstWindow() to reliably get the main BrowserWindow
  // This is crucial when BrowserViews are present
  const mainWindow = await electronApp.firstWindow();
  await mainWindow.waitForLoadState('domcontentloaded');
  await use(mainWindow);
},
```

**Key Changes:**
1. **Added `SKIP_SESSION_RESTORE: '1'`** - Prevents SessionManager from loading persisted sessions
2. **Replaced `windows()[0]` with `firstWindow()`** - Guaranteed to return main BrowserWindow
3. **Replaced `waitForEvent('page')` with `firstWindow()`** - More reliable waiting strategy

### 2. Updated Main Process (`src/main/index.ts`)

**Changes:**

```typescript
// BEFORE
// Initialize session manager
sessionManager = new SessionManager(window)

// Load persisted sessions
sessionManager.loadPersistedSessions().catch(error => {
  console.error('[App] Failed to load persisted sessions:', error)
})
```

```typescript
// AFTER
// Initialize session manager
sessionManager = new SessionManager(window)

// Load persisted sessions (skip in test mode to avoid BrowserView interference)
if (process.env.SKIP_SESSION_RESTORE !== '1') {
  sessionManager.loadPersistedSessions().catch(error => {
    console.error('[App] Failed to load persisted sessions:', error)
  })
} else {
  console.log('[App] Skipping session restore (test mode)')
}
```

**Rationale:** Tests should start with a clean slate. Individual tests can create sessions as needed via IPC test helpers.

---

## Test Results

### Before Fix
```
  ✘  29/38 tests failing
  - Error: #root element not found
  - Internal error: step id not found: fixture@XX
  - Playwright seeing BrowserView content instead of main window
```

### After Fix
```
  ✓  Smoke tests: 4/4 passing (100%)
  ✓  Data-capture: 2/6 passing (33% improvement)
  ✓  #root element found in ALL tests
  ✗  Remaining failures are unrelated (strict mode violations, search UX issues)
```

### Smoke Tests (All Passing)
```bash
$ npx playwright test e2e/smoke.spec.ts
  ✓  should launch Electron app successfully (1.8s)
  ✓  should have correct window title (1.7s)
  ✓  should render main application layout (2.0s)
  ✓  should have database initialized (1.4s)

  4 passed (10.0s)
```

---

## Remaining Issues (Unrelated to #root Fix)

### 1. Strict Mode Violations (Test Selector Issues)
**Example:**
```
Error: strict mode violation: locator('text=/quantum computing/i')
  resolved to 2 elements
```

**Cause:** Test selectors are too broad and match multiple elements (both title and content in the main window).

**Solution:** Use more specific selectors:
```typescript
// ❌ Too broad
mainWindow.locator('text=/quantum computing/i')

// ✅ Specific
mainWindow.getByRole('button', { name: /quantum computing/i }).first()
// or
mainWindow.locator('[data-testid="capture-card"]').filter({ hasText: /quantum computing/i })
```

### 2. Search Functionality Not Working
**Example:**
```
Error: element(s) not found after search
  - Test fills search input with "Docker"
  - Expected filtered results not appearing
```

**Possible Causes:**
- Search debouncing timing
- Store not updating correctly
- IPC data not being indexed for search

**Recommended Investigation:**
- Check `src/renderer/stores/captureStore.ts` search implementation
- Verify database query in search handlers
- Test search manually in dev mode

---

## Best Practices Learned

### Playwright + Electron + WebContentsView

1. **Always use `firstWindow()` for main window access**
   ```typescript
   const mainWindow = await electronApp.firstWindow();
   ```

2. **Disable WebContentsView creation in tests unless specifically testing that feature**
   ```typescript
   env: { SKIP_SESSION_RESTORE: '1' }
   ```

3. **Access WebContentsViews as separate windows**
   ```typescript
   const allWindows = electronApp.windows();
   const claudeSession = allWindows.find(async (page) => {
     return (await page.url()).includes('claude.ai');
   });
   ```

4. **Listen for dynamic window creation**
   ```typescript
   electronApp.on('window', async (page: Page) => {
     console.log('New WebContentsView:', await page.url());
   });
   ```

5. **Screenshot each view separately**
   ```typescript
   // Won't capture WebContentsView content
   await mainWindow.screenshot({ path: 'main.png' });

   // Capture each view
   for (const window of electronApp.windows()) {
     await window.screenshot({ path: `view-${index}.png` });
   }
   ```

---

## Migration Note: BrowserView → WebContentsView

**Status:** ✅ **MIGRATION COMPLETE** (2025-10-21)

DeepResearch has been successfully migrated from the deprecated BrowserView API to the modern WebContentsView API.

**Key Changes:**
```typescript
// Old (BrowserView - Deprecated)
const view = new BrowserView({ webPreferences: {...} });
mainWindow.addBrowserView(view);
mainWindow.removeBrowserView(view);

// New (WebContentsView - Current)
const view = new WebContentsView({ webPreferences: {...} });
mainWindow.contentView.addChildView(view);
mainWindow.contentView.removeChildView(view);
```

**Playwright Compatibility:** The same `firstWindow()` solution applies identically to WebContentsView. All E2E testing patterns documented in this file work without modification.

**Important:** Both BrowserView and WebContentsView create separate Page objects in Playwright's `windows()` array. The fix using `firstWindow()` is the recommended approach for both APIs.

**Complete Migration Guide:** See `docs/WEBCONTENTSVIEW_MIGRATION.md`

**Electron Documentation:** https://www.electronjs.org/blog/migrate-to-webcontentsview

---

## Files Changed

### Modified Files
1. **`e2e/fixtures/electron-app.ts`** - Updated fixture to use `firstWindow()` and skip session restore
2. **`src/main/index.ts`** - Added `SKIP_SESSION_RESTORE` environment variable check

### Reference Files
- `e2e/helpers/test-helpers.ts:197-206` - `waitForAppReady()` function (no changes needed)
- `src/main/session/SessionManager.ts` - Context for WebContentsView usage
- `index.html` - Confirmed `#root` element exists
- `src/renderer/main.tsx` - Confirmed React mounts to `#root`

---

## Additional Research

### Key Resources

**Official Documentation:**
- [Playwright Electron API](https://playwright.dev/docs/api/class-electronapplication)
- [Electron BrowserView (deprecated)](https://www.electronjs.org/docs/latest/api/browser-view)
- [WebContentsView Migration Guide](https://www.electronjs.org/blog/migrate-to-webcontentsview)

**GitHub Issues:**
- [#6760 - Page is not a BrowserWindow (RESOLVED)](https://github.com/microsoft/playwright/issues/6760)
- [#8759 - PR fixing BrowserView support](https://github.com/microsoft/playwright/pull/8759)
- [Electron #29399 - Add fromDevToolsTargetId()](https://github.com/electron/electron/pull/29399)

**Testing Examples:**
- [electron-playwright-example](https://github.com/spaceagetv/electron-playwright-example)
- [electron-playwright-helpers](https://www.npmjs.com/package/electron-playwright-helpers)

**Articles:**
- [How to Test Electron Apps](https://betterprogramming.pub/how-to-test-electron-apps-1e8eb0078d7b)
- [Testing Electron with Playwright](https://medium.com/kubeshop-i/testing-electron-apps-with-playwright-kubeshop-839ff27cf376)
- [Simon Willison's TIL](https://til.simonwillison.net/electron/testing-electron-playwright)

---

## Conclusion

The #root element issue was caused by Playwright's `windows()[0]` unreliably returning WebContentsView Pages when the app had active sessions. The fix was straightforward:

1. Use `firstWindow()` instead of `windows()[0]`
2. Skip session restoration in test mode

This investigation revealed important architectural considerations for testing Electron apps with embedded content views and provides a foundation for improving the remaining E2E test suite.

**Next Steps:**
1. Fix strict mode violations in test selectors
2. Debug search functionality issues
3. ✅ ~~Migrate from BrowserView to WebContentsView~~ **COMPLETE** (See `WEBCONTENTSVIEW_MIGRATION.md`)
4. Add test helpers for accessing specific WebContentsView sessions when needed

---

**Date:** 2025-10-21
**Author:** Claude Code (Coding Agent)
**Task ID:** 3082ccff-d62e-4d6a-aa8e-1985926b1ef4
**Project:** DeepResearch Unit Testing Implementation
