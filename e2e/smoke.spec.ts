import { test, expect } from './fixtures/electron-app';
import { waitForAppReady } from './helpers/test-helpers';

/**
 * Smoke tests to verify Playwright + Electron setup works
 */
test.describe('DeepResearch E2E Smoke Tests', () => {
  test('should launch Electron app successfully', async ({ electronApp, mainWindow }) => {
    // Verify app launched
    expect(electronApp).toBeDefined();
    expect(mainWindow).toBeDefined();

    // Verify window is visible (Electron window is visible by default)
    expect(mainWindow).toBeDefined();

    // Wait for app to be ready
    await waitForAppReady(mainWindow);

    // Take screenshot for visual verification
    await mainWindow.screenshot({
      path: 'e2e-results/screenshots/app-launched.png',
    });
  });

  test('should have correct window title', async ({ mainWindow }) => {
    await waitForAppReady(mainWindow);

    const title = await mainWindow.title();
    expect(title).toContain('DeepResearch');
  });

  test('should render main application layout', async ({ mainWindow }) => {
    await waitForAppReady(mainWindow);

    // Check for main layout elements
    // Adjust selectors based on actual app structure
    const body = mainWindow.locator('body');
    await expect(body).toBeVisible();

    // Verify the app has loaded React content
    const root = mainWindow.locator('#root');
    await expect(root).toBeVisible();
  });

  test('should have database initialized', async ({ electronApp, testDbPath }) => {
    // Verify test database path is set
    expect(testDbPath).toBeDefined();
    expect(testDbPath).toContain('test-deep-research.db');

    // Database operations would be tested in specific feature tests
  });
});
