import { test, expect } from './fixtures/electron-app';
import { waitForAppReady, createTestSession, createTestCapture, clearTestData } from './helpers/test-helpers';

/**
 * E2E Tests for Search and Filter Workflow
 *
 * Tests the SearchFilterPanel component and its integration with the data table
 * to ensure search and filtering work correctly end-to-end.
 *
 * Note: This test assumes the SearchFilterPanel is accessible in the main app.
 * If it's only in SearchFilterDemo page, you may need to navigate to that route.
 */
test.describe('Search and Filter Workflow', () => {
  test.beforeEach(async ({ mainWindow }) => {
    // Seed test data via IPC
    const sessionId = 'test-session-1';

    // Create test session
    await createTestSession(mainWindow, {
      id: sessionId,
      provider: 'test',
      name: 'Test Session',
    });

    // Create test captures
    const captures = [
      {
        id: 'capture-1',
        session_id: sessionId,
        provider: 'claude',
        prompt: 'What is React hooks?',
        response: 'React hooks are functions that let you use state and other React features in functional components.',
        model: 'claude-3-opus',
        tags: ['react', 'hooks', 'frontend'],
        notes: 'Good explanation',
        token_count: 150,
      },
      {
        id: 'capture-2',
        session_id: sessionId,
        provider: 'openai',
        prompt: 'Explain TypeScript',
        response: 'TypeScript is a typed superset of JavaScript that compiles to plain JavaScript.',
        model: 'gpt-4',
        tags: ['typescript', 'javascript'],
        notes: 'Comprehensive overview',
        token_count: 120,
      },
      {
        id: 'capture-3',
        session_id: sessionId,
        provider: 'gemini',
        prompt: 'What is database indexing?',
        response: 'Database indexing improves query performance by creating data structures for faster retrieval.',
        model: 'gemini-pro',
        tags: ['database', 'performance'],
        notes: 'Technical details',
        token_count: 130,
      },
      {
        id: 'capture-4',
        session_id: sessionId,
        provider: 'claude',
        prompt: 'Best practices for React',
        response: 'React best practices include using hooks, component composition, and proper state management.',
        model: 'claude-3-sonnet',
        tags: ['react', 'best-practices', 'frontend'],
        notes: null,
        token_count: 140,
      },
      {
        id: 'capture-5',
        session_id: sessionId,
        provider: 'openai',
        prompt: 'What is API design?',
        response: 'API design involves creating interfaces for software components to communicate effectively.',
        model: 'gpt-4-turbo',
        tags: ['api', 'design'],
        notes: null,
        token_count: 110,
      },
    ];

    for (const capture of captures) {
      await createTestCapture(mainWindow, capture);
    }

    // Wait for app to be ready
    await waitForAppReady(mainWindow);

    // Give the app a moment to load the data from the database
    await mainWindow.waitForTimeout(1000);
  });

  test.afterEach(async ({ mainWindow }) => {
    // Clean up test data after each test
    await clearTestData(mainWindow);
  });

  test('should search captures by text in prompt', async ({ mainWindow }) => {
    // Find the search input
    const searchInput = mainWindow.locator('input[placeholder*="Search"]').first();
    await expect(searchInput).toBeVisible({ timeout: 10000 });

    // Initial state - should show all captures (5 in this case)
    // Note: The table might have header row, so we need to account for that
    await mainWindow.waitForTimeout(500); // Wait for data to load

    // Type search query
    await searchInput.fill('React');

    // Wait for debounce and results to update (SearchFilterPanel has 300ms debounce)
    await mainWindow.waitForTimeout(500);

    // Verify that only React-related captures are shown
    // Should show capture-1 and capture-4 (both contain "React")
    const resultCount = mainWindow.locator('text=/\\d+ results? found/');
    await expect(resultCount).toContainText('2 result');
  });

  test('should search captures by text in response', async ({ mainWindow }) => {
    const searchInput = mainWindow.locator('input[placeholder*="Search"]').first();
    await expect(searchInput).toBeVisible({ timeout: 10000 });

    // Search for text that appears in response
    await searchInput.fill('TypeScript');
    await mainWindow.waitForTimeout(500);

    // Should find capture-2 which has TypeScript in both prompt and response
    const resultCount = mainWindow.locator('text=/\\d+ results? found/');
    await expect(resultCount).toContainText('1 result');
  });

  test('should filter by provider - Claude', async ({ mainWindow }) => {
    await mainWindow.waitForTimeout(500);

    // Click the Providers button to open the dropdown
    const providersButton = mainWindow.locator('button:has-text("Providers")');
    await expect(providersButton).toBeVisible({ timeout: 10000 });
    await providersButton.click();

    // Wait for popover to appear
    await mainWindow.waitForTimeout(300);

    // Select Claude provider
    const claudeCheckbox = mainWindow.locator('label:has-text("claude")');
    await expect(claudeCheckbox).toBeVisible();
    await claudeCheckbox.click();

    // Close popover by clicking outside or pressing Escape
    await mainWindow.keyboard.press('Escape');
    await mainWindow.waitForTimeout(300);

    // Should show only Claude captures (capture-1 and capture-4)
    const resultCount = mainWindow.locator('text=/\\d+ results? found/');
    await expect(resultCount).toContainText('2 result');

    // Verify Claude badge is shown in active filters
    const activeBadge = mainWindow.locator('text="claude"').first();
    await expect(activeBadge).toBeVisible();
  });

  test('should filter by provider - OpenAI', async ({ mainWindow }) => {
    await mainWindow.waitForTimeout(500);

    // Open providers dropdown
    const providersButton = mainWindow.locator('button:has-text("Providers")');
    await providersButton.click();
    await mainWindow.waitForTimeout(300);

    // Select OpenAI provider
    const openaiCheckbox = mainWindow.locator('label:has-text("openai")');
    await expect(openaiCheckbox).toBeVisible();
    await openaiCheckbox.click();

    await mainWindow.keyboard.press('Escape');
    await mainWindow.waitForTimeout(300);

    // Should show OpenAI captures (capture-2 and capture-5)
    const resultCount = mainWindow.locator('text=/\\d+ results? found/');
    await expect(resultCount).toContainText('2 result');
  });

  test('should filter by provider - Gemini', async ({ mainWindow }) => {
    await mainWindow.waitForTimeout(500);

    // Open providers dropdown
    const providersButton = mainWindow.locator('button:has-text("Providers")');
    await providersButton.click();
    await mainWindow.waitForTimeout(300);

    // Select Gemini provider
    const geminiCheckbox = mainWindow.locator('label:has-text("gemini")');
    await expect(geminiCheckbox).toBeVisible();
    await geminiCheckbox.click();

    await mainWindow.keyboard.press('Escape');
    await mainWindow.waitForTimeout(300);

    // Should show only Gemini capture (capture-3)
    const resultCount = mainWindow.locator('text=/\\d+ results? found/');
    await expect(resultCount).toContainText('1 result');
  });

  test('should filter by multiple providers', async ({ mainWindow }) => {
    await mainWindow.waitForTimeout(500);

    // Open providers dropdown
    const providersButton = mainWindow.locator('button:has-text("Providers")');
    await providersButton.click();
    await mainWindow.waitForTimeout(300);

    // Select Claude
    await mainWindow.locator('label:has-text("claude")').click();

    // Select OpenAI
    await mainWindow.locator('label:has-text("openai")').click();

    await mainWindow.keyboard.press('Escape');
    await mainWindow.waitForTimeout(300);

    // Should show Claude + OpenAI captures (4 total: capture-1, capture-2, capture-4, capture-5)
    const resultCount = mainWindow.locator('text=/\\d+ results? found/');
    await expect(resultCount).toContainText('4 result');

    // Verify both provider badges are shown
    const claudeBadge = mainWindow.locator('.gap-1:has-text("claude")').first();
    const openaiBadge = mainWindow.locator('.gap-1:has-text("openai")').first();
    await expect(claudeBadge).toBeVisible();
    await expect(openaiBadge).toBeVisible();
  });

  test('should combine search and provider filter', async ({ mainWindow }) => {
    await mainWindow.waitForTimeout(500);

    // First, apply search filter
    const searchInput = mainWindow.locator('input[placeholder*="Search"]').first();
    await searchInput.fill('React');
    await mainWindow.waitForTimeout(500);

    // Then apply provider filter
    const providersButton = mainWindow.locator('button:has-text("Providers")');
    await providersButton.click();
    await mainWindow.waitForTimeout(300);

    await mainWindow.locator('label:has-text("claude")').click();
    await mainWindow.keyboard.press('Escape');
    await mainWindow.waitForTimeout(300);

    // Should show only Claude captures that contain "React" (capture-1 and capture-4)
    const resultCount = mainWindow.locator('text=/\\d+ results? found/');
    await expect(resultCount).toContainText('2 result');

    // Verify active filters are shown
    await expect(mainWindow.locator('text=/Search: "React"/i')).toBeVisible();
    await expect(mainWindow.locator('.gap-1:has-text("claude")')).toBeVisible();
  });

  test('should combine search and filter with no results', async ({ mainWindow }) => {
    await mainWindow.waitForTimeout(500);

    // Search for something that doesn't exist in Claude captures
    const searchInput = mainWindow.locator('input[placeholder*="Search"]').first();
    await searchInput.fill('database');
    await mainWindow.waitForTimeout(500);

    // Apply Claude filter (database content is in Gemini capture)
    const providersButton = mainWindow.locator('button:has-text("Providers")');
    await providersButton.click();
    await mainWindow.waitForTimeout(300);

    await mainWindow.locator('label:has-text("claude")').click();
    await mainWindow.keyboard.press('Escape');
    await mainWindow.waitForTimeout(300);

    // Should show 0 results
    const resultCount = mainWindow.locator('text=/\\d+ results? found/');
    await expect(resultCount).toContainText('0 result');
  });

  test('should clear all filters', async ({ mainWindow }) => {
    await mainWindow.waitForTimeout(500);

    // Apply search filter
    const searchInput = mainWindow.locator('input[placeholder*="Search"]').first();
    await searchInput.fill('React');
    await mainWindow.waitForTimeout(500);

    // Apply provider filter
    const providersButton = mainWindow.locator('button:has-text("Providers")');
    await providersButton.click();
    await mainWindow.waitForTimeout(300);
    await mainWindow.locator('label:has-text("claude")').click();
    await mainWindow.keyboard.press('Escape');
    await mainWindow.waitForTimeout(300);

    // Verify filters are active
    const resultCountFiltered = mainWindow.locator('text=/\\d+ results? found/');
    await expect(resultCountFiltered).toContainText('2 result');

    // Click "Clear All" button
    const clearButton = mainWindow.locator('button:has-text("Clear All")');
    await expect(clearButton).toBeVisible();
    await clearButton.click();
    await mainWindow.waitForTimeout(300);

    // Should show all 5 captures again
    const resultCountAll = mainWindow.locator('text=/\\d+ results? found/');
    await expect(resultCountAll).toContainText('5 result');

    // Verify search input is cleared
    await expect(searchInput).toHaveValue('');

    // Verify "Clear All" button is no longer visible (no active filters)
    await expect(clearButton).not.toBeVisible();
  });

  test('should remove individual filter by clicking badge X', async ({ mainWindow }) => {
    await mainWindow.waitForTimeout(500);

    // Apply provider filter
    const providersButton = mainWindow.locator('button:has-text("Providers")');
    await providersButton.click();
    await mainWindow.waitForTimeout(300);
    await mainWindow.locator('label:has-text("claude")').click();
    await mainWindow.keyboard.press('Escape');
    await mainWindow.waitForTimeout(300);

    // Verify filter is active
    const claudeBadge = mainWindow.locator('.gap-1:has-text("claude")').first();
    await expect(claudeBadge).toBeVisible();

    // Click the X button on the badge to remove filter
    const removeButton = claudeBadge.locator('button');
    await removeButton.click();
    await mainWindow.waitForTimeout(300);

    // Should show all 5 captures again
    const resultCount = mainWindow.locator('text=/\\d+ results? found/');
    await expect(resultCount).toContainText('5 result');

    // Badge should be gone
    await expect(claudeBadge).not.toBeVisible();
  });

  test('should show result count updates dynamically', async ({ mainWindow }) => {
    await mainWindow.waitForTimeout(500);

    const resultCount = mainWindow.locator('text=/\\d+ results? found/');

    // Initial state - all 5 results
    await expect(resultCount).toContainText('5 result');

    // Apply search - should reduce count
    const searchInput = mainWindow.locator('input[placeholder*="Search"]').first();
    await searchInput.fill('React');
    await mainWindow.waitForTimeout(500);
    await expect(resultCount).toContainText('2 result');

    // Clear search - should restore count
    await searchInput.fill('');
    await mainWindow.waitForTimeout(500);
    await expect(resultCount).toContainText('5 result');

    // Apply provider filter
    const providersButton = mainWindow.locator('button:has-text("Providers")');
    await providersButton.click();
    await mainWindow.waitForTimeout(300);
    await mainWindow.locator('label:has-text("gemini")').click();
    await mainWindow.keyboard.press('Escape');
    await mainWindow.waitForTimeout(300);
    await expect(resultCount).toContainText('1 result');
  });

  test('should display active filter count badge', async ({ mainWindow }) => {
    await mainWindow.waitForTimeout(500);

    // Apply search filter
    const searchInput = mainWindow.locator('input[placeholder*="Search"]').first();
    await searchInput.fill('React');
    await mainWindow.waitForTimeout(500);

    // Should show "1 active" badge
    let activeBadge = mainWindow.locator('text="1 active"');
    await expect(activeBadge).toBeVisible();

    // Apply provider filter
    const providersButton = mainWindow.locator('button:has-text("Providers")');
    await providersButton.click();
    await mainWindow.waitForTimeout(300);
    await mainWindow.locator('label:has-text("claude")').click();
    await mainWindow.keyboard.press('Escape');
    await mainWindow.waitForTimeout(300);

    // Should now show "2 active" badge
    activeBadge = mainWindow.locator('text="2 active"');
    await expect(activeBadge).toBeVisible();

    // Clear all filters
    const clearButton = mainWindow.locator('button:has-text("Clear All")');
    await clearButton.click();
    await mainWindow.waitForTimeout(300);

    // Active badge should be gone
    activeBadge = mainWindow.locator('text=/\\d+ active/');
    await expect(activeBadge).not.toBeVisible();
  });

  test('should persist filter state during interaction', async ({ mainWindow }) => {
    await mainWindow.waitForTimeout(500);

    // Apply filters
    const searchInput = mainWindow.locator('input[placeholder*="Search"]').first();
    await searchInput.fill('TypeScript');
    await mainWindow.waitForTimeout(500);

    const providersButton = mainWindow.locator('button:has-text("Providers")');
    await providersButton.click();
    await mainWindow.waitForTimeout(300);
    await mainWindow.locator('label:has-text("openai")').click();
    await mainWindow.keyboard.press('Escape');
    await mainWindow.waitForTimeout(300);

    // Verify results
    const resultCount = mainWindow.locator('text=/\\d+ results? found/');
    await expect(resultCount).toContainText('1 result');

    // Open and close provider dropdown again - filters should remain
    await providersButton.click();
    await mainWindow.waitForTimeout(300);
    await mainWindow.keyboard.press('Escape');
    await mainWindow.waitForTimeout(300);

    // Results should still be filtered
    await expect(resultCount).toContainText('1 result');
    await expect(searchInput).toHaveValue('TypeScript');
  });
});
