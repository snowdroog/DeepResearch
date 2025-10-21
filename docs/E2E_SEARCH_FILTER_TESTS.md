# E2E Search and Filter Tests

## Overview

Comprehensive end-to-end tests have been created for the search and filter workflow in the DeepResearch Electron app. These tests verify that users can search captures and filter by various criteria.

## Files Created

### 1. `/home/jeff/VScode_Projects/DeepResearch/e2e/search-filter.spec.ts`

Main test file containing 13 comprehensive test cases:

1. **should search captures by text in prompt** - Verifies searching works for prompt text
2. **should search captures by text in response** - Verifies searching works for response text
3. **should filter by provider - Claude** - Tests single provider filter (Claude)
4. **should filter by provider - OpenAI** - Tests single provider filter (OpenAI)
5. **should filter by provider - Gemini** - Tests single provider filter (Gemini)
6. **should filter by multiple providers** - Tests selecting multiple providers at once
7. **should combine search and provider filter** - Tests combining search text with provider filters
8. **should combine search and filter with no results** - Tests filter combinations that yield no results
9. **should clear all filters** - Tests the "Clear All" button functionality
10. **should remove individual filter by clicking badge X** - Tests removing individual filters via badge buttons
11. **should show result count updates dynamically** - Tests that result count updates as filters change
12. **should display active filter count badge** - Tests the active filter count indicator
13. **should persist filter state during interaction** - Tests that filters remain active during UI interactions

### 2. `/home/jeff/VScode_Projects/DeepResearch/e2e/helpers/seed-data.ts`

Data seeding utilities for E2E tests:

**Functions:**
- `seedTestSessions(dbPath, sessions)` - Seed test sessions directly into the database
- `seedTestCaptures(dbPath, captures)` - Seed test captures directly into the database
- `clearTestData(dbPath)` - Clear all test data from the database
- `getSearchFilterTestData()` - Get standardized test data set

**Test Data Set:**
- 1 test session
- 5 test captures across 3 providers (Claude, OpenAI, Gemini)
- Various tags and content for testing different filter combinations

### 3. Updates to `/home/jeff/VScode_Projects/DeepResearch/e2e/helpers/test-helpers.ts`

Added new helper functions:
- `createTestSession(page, data)` - Create test session via IPC
- `createTestCapture(page, data)` - Create test capture via IPC
- `seedTestCaptures(page, captures)` - Seed multiple captures via IPC
- `clearTestData(page)` - Clear test data via IPC

### 4. Updates to `/home/jeff/VScode_Projects/DeepResearch/playwright.config.ts`

Fixed configuration to avoid HTML reporter conflicts:
- Changed HTML output folder from `e2e-results/html` to `playwright-report`
- Changed test output directory from `e2e-results` to `e2e-results/artifacts`

## Test Implementation Approach

### Data Seeding Strategy

Since the DeepResearch app doesn't have a public IPC handler for creating captures (captures are normally created automatically by the browser extension), the tests use direct database seeding:

1. **Before Each Test:**
   - Seed test sessions and captures directly into the test database using `better-sqlite3`
   - Wait for app to load and read the data

2. **After Each Test:**
   - Clean up all test data from the database

This approach ensures:
- Isolated test environment
- No dependency on UI interactions for data creation
- Consistent test data across test runs
- Fast test execution

### Test Structure

Each test follows this pattern:

```typescript
test('test name', async ({ mainWindow }) => {
  // 1. Locate UI elements
  const searchInput = mainWindow.locator('input[placeholder*="Search"]').first();

  // 2. Perform user actions
  await searchInput.fill('React');
  await mainWindow.waitForTimeout(500); // Wait for debounce

  // 3. Verify results
  const resultCount = mainWindow.locator('text=/\\d+ results? found/');
  await expect(resultCount).toContainText('2 result');
});
```

## Important Notes

### SearchFilterPanel Visibility

The tests assume the `SearchFilterPanel` component is accessible in the main application. Based on the codebase analysis:

- The full **SearchFilterPanel** with advanced filtering is currently only available in `/renderer/pages/SearchFilterDemo.tsx`
- The main application (`MainLayout`) uses **DataPanel** which has a simpler search functionality

### Options for Running Tests

#### Option 1: Update Main App to Include SearchFilterPanel

Add routing or integrate SearchFilterPanel into the main app so tests can access it.

#### Option 2: Navigate to Demo Page

Update tests to navigate to the SearchFilterDemo page:

```typescript
test.beforeEach(async ({ mainWindow, testDbPath }) => {
  // Seed data...

  // Navigate to demo page
  await mainWindow.goto('http://localhost:5173/#/search-filter-demo');
  await waitForAppReady(mainWindow);
});
```

#### Option 3: Test DataPanel Instead

Modify tests to work with the simpler search in DataPanel (currently in the main app).

## Dependencies Fixed

### better-sqlite3 Rebuild

The `better-sqlite3` module needed to be rebuilt for the current Node.js version:

```bash
npm rebuild better-sqlite3
```

This was necessary because the native Node.js addon was compiled for a different version (NODE_MODULE_VERSION 119 vs 127).

## Running the Tests

```bash
# Run all E2E tests
npm run test:e2e

# Run only search-filter tests
npm run test:e2e -- search-filter.spec.ts

# Run tests in debug mode
npm run test:e2e -- --debug search-filter.spec.ts

# Run tests in headed mode (see the browser)
npm run test:e2e -- --headed search-filter.spec.ts
```

## Test Coverage

The test suite covers:

- **Search functionality**: Text search in prompts and responses
- **Provider filtering**: Single and multiple provider selection
- **Combined filters**: Search + provider filters working together
- **Filter management**: Clear all, remove individual filters
- **UI feedback**: Result counts, active filter badges, filter persistence
- **Edge cases**: No results scenarios

## Next Steps

To make these tests fully functional:

1. **Choose Integration Approach**: Decide how to make SearchFilterPanel accessible (see options above)

2. **Update Selectors**: The tests use generic selectors that may need adjustment based on actual DOM structure

3. **Add Navigation**: If using SearchFilterDemo page, add proper routing/navigation in tests

4. **Verify Debounce Timing**: The tests use 500ms waits for debounce - may need adjustment if SearchFilterPanel's debounce timing is different

5. **Add Screenshots**: Consider adding more screenshot captures for visual regression testing

6. **CI Integration**: Configure CI/CD to run E2E tests automatically

## Test Data

The standard test data set includes:

### Captures:
1. **capture-1**: Claude - "What is React hooks?" (tags: react, hooks, frontend)
2. **capture-2**: OpenAI - "Explain TypeScript" (tags: typescript, javascript)
3. **capture-3**: Gemini - "What is database indexing?" (tags: database, performance)
4. **capture-4**: Claude - "Best practices for React" (tags: react, best-practices, frontend)
5. **capture-5**: OpenAI - "What is API design?" (tags: api, design)

This data set provides:
- 2 Claude captures (to test provider filtering)
- 2 OpenAI captures
- 1 Gemini capture
- Multiple overlapping tags
- Varied content for search testing

## Troubleshooting

### Issue: "SearchFilterPanel not found"

**Cause**: SearchFilterPanel component not visible in main app

**Solution**: Navigate to SearchFilterDemo page or update main app to include the component

### Issue: "better-sqlite3 NODE_MODULE_VERSION mismatch"

**Cause**: Native module compiled for different Node.js version

**Solution**: Run `npm rebuild better-sqlite3`

### Issue: "HTML reporter output folder clashes"

**Cause**: Playwright config had overlapping output directories

**Solution**: Already fixed in playwright.config.ts

## Architecture Insights

### Why Direct Database Seeding?

The app's IPC handlers don't include `data:createCapture` because:
1. Captures are created automatically by the browser extension when it intercepts AI responses
2. There's no UI for manually creating captures
3. This is by design - the app captures AI interactions, not user-created data

For testing, we bypass the UI/IPC layer and seed data directly into the database, which is a valid approach for E2E testing when the normal data creation path is not available or practical.

### Component Architecture

```
MainLayout
├── SessionListPanel (left sidebar)
├── ProviderTabsPanel (center - browser views)
└── DataPanel (right sidebar - simple search)

SearchFilterDemo (separate page)
├── SearchFilterPanel (advanced filtering)
└── ResearchDataTable (data display)
```

The full search/filter functionality exists in SearchFilterDemo but is not integrated into the main app layout yet.
