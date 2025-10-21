import { test as base, _electron as electron, ElectronApplication, Page } from '@playwright/test';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Extended test fixtures for Electron app testing
 */
type ElectronFixtures = {
  electronApp: ElectronApplication;
  mainWindow: Page;
  testDbPath: string;
};

/**
 * Test database path (isolated from production)
 */
const TEST_DB_DIR = path.join(__dirname, '../../test-data/e2e');
const TEST_DB_PATH = path.join(TEST_DB_DIR, 'test-deep-research.db');

/**
 * Setup test database
 */
function setupTestDatabase(): string {
  // Ensure test data directory exists
  if (!fs.existsSync(TEST_DB_DIR)) {
    fs.mkdirSync(TEST_DB_DIR, { recursive: true });
  }

  // Remove existing test database if it exists
  if (fs.existsSync(TEST_DB_PATH)) {
    fs.unlinkSync(TEST_DB_PATH);
  }

  return TEST_DB_PATH;
}

/**
 * Cleanup test database
 */
function cleanupTestDatabase() {
  if (fs.existsSync(TEST_DB_PATH)) {
    try {
      fs.unlinkSync(TEST_DB_PATH);
    } catch (error) {
      console.warn('Failed to cleanup test database:', error);
    }
  }
}

/**
 * Extended test with Electron app fixtures
 */
export const test = base.extend<ElectronFixtures>({
  testDbPath: async ({}, use) => {
    const dbPath = setupTestDatabase();
    await use(dbPath);
    cleanupTestDatabase();
  },

  electronApp: async ({ testDbPath }, use) => {
    // Launch Electron app with test database
    const app = await electron.launch({
      args: [path.join(__dirname, '../../dist/main/index.js')],
      env: {
        ...process.env,
        NODE_ENV: 'test',
        TEST_DB_PATH: testDbPath,
        ELECTRON_IS_DEV: '0',
        // Prevent loading persisted sessions on startup to avoid BrowserView interference
        SKIP_SESSION_RESTORE: '1',
      },
      executablePath: process.env.ELECTRON_PATH,
    });

    // Wait for the first window (main BrowserWindow) to be ready
    // Using firstWindow() instead of waitForEvent ensures we get the correct window
    await app.firstWindow();

    await use(app);

    // Cleanup
    await app.close();
  },

  mainWindow: async ({ electronApp }, use) => {
    // Use firstWindow() to reliably get the main BrowserWindow
    // This is crucial when BrowserViews are present, as windows()[0]
    // may return a BrowserView's Page instead of the main window
    const mainWindow = await electronApp.firstWindow();

    // Wait for window to be ready
    await mainWindow.waitForLoadState('domcontentloaded');

    await use(mainWindow);
  },
});

export { expect } from '@playwright/test';
