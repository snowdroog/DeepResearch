import { test, expect } from './fixtures/electron-app';
import { waitForAppReady, waitForDialog, takeScreenshot } from './helpers/test-helpers';

/**
 * E2E Tests for Session Management Workflow
 *
 * Tests cover:
 * - Creating new sessions with different providers
 * - Switching between multiple sessions
 * - Closing sessions
 */
test.describe('Session Management', () => {
  test.beforeEach(async ({ mainWindow }) => {
    // Wait for app to be ready before each test
    await waitForAppReady(mainWindow);

    // Wait for any dialogs from previous tests to close
    await mainWindow.waitForTimeout(500);

    // Clear all existing sessions to start fresh
    const allTabs = mainWindow.locator('button[role="tab"]');
    const tabCount = await allTabs.count();

    // Close all existing sessions
    for (let i = tabCount - 1; i >= 0; i--) {
      const currentTabs = mainWindow.locator('button[role="tab"]');
      const currentCount = await currentTabs.count();

      if (currentCount === 0) break;

      const tab = currentTabs.first();
      const isVisible = await tab.isVisible().catch(() => false);

      if (isVisible) {
        // Force close without hover to avoid overlay issues
        await tab.hover({ force: true });
        const closeButton = tab.locator('button[title="Close session"]');

        if (await closeButton.isVisible({ timeout: 2000 }).catch(() => false)) {
          await closeButton.click({ force: true });

          // Handle close confirmation dialog
          const closeDialog = mainWindow.getByRole('alertdialog');
          const dialogVisible = await closeDialog.isVisible({ timeout: 2000 }).catch(() => false);

          if (dialogVisible) {
            const confirmButton = closeDialog.getByRole('button', { name: /close session/i });
            await confirmButton.click();
            await closeDialog.waitFor({ state: 'hidden', timeout: 5000 });
          }
        }
      }
    }

    // Take screenshot of initial state (after cleanup)
    await takeScreenshot(mainWindow, 'session-initial-state');
  });

  test('should create a new session with Claude provider', async ({ mainWindow }) => {
    // Find and click the "Add Session" button in the tabs area (Plus button with keyboard hint)
    // Use the button that opens the provider selection dialog
    const addButton = mainWindow.getByRole('button', { name: /add new session.*cmd.*ctrl/i });
    await expect(addButton).toBeVisible();
    await takeScreenshot(mainWindow, 'session-before-add');

    await addButton.click();

    // Wait for Provider Selection Dialog to appear
    const dialog = await waitForDialog(mainWindow, 'Select AI Provider');
    await takeScreenshot(mainWindow, 'session-provider-dialog');

    // Select Claude provider
    const claudeOption = dialog.getByRole('button', { name: /claude/i });
    await expect(claudeOption).toBeVisible();
    await claudeOption.click();

    // Verify Claude is selected (should have border-primary class or checkmark)
    await expect(claudeOption).toHaveClass(/border-primary/);
    await takeScreenshot(mainWindow, 'session-claude-selected');

    // Click "Create Session" button
    const createButton = dialog.getByRole('button', { name: /create session/i });
    await expect(createButton).toBeEnabled();
    await createButton.click();

    // Wait for dialog to close
    await expect(dialog).not.toBeVisible();

    // Verify new session tab appears (use .first() in case multiple Claude tabs exist)
    const sessionTab = mainWindow.getByRole('tab', { name: /claude/i }).first();
    await expect(sessionTab).toBeVisible();
    await takeScreenshot(mainWindow, 'session-claude-created');

    // Verify session is active (should have bg-background class)
    await expect(sessionTab).toHaveClass(/bg-background/);

    // Verify session content is displayed
    await expect(mainWindow.getByText('https://claude.ai')).toBeVisible();
  });

  test('should create sessions with different providers (ChatGPT and Gemini)', async ({ mainWindow }) => {
    // Create ChatGPT session
    await mainWindow.getByRole('button', { name: /add new session.*cmd.*ctrl/i }).click();
    let dialog = await waitForDialog(mainWindow, 'Select AI Provider');

    await dialog.getByRole('button', { name: /chatgpt/i }).click();
    await dialog.getByRole('button', { name: /create session/i }).click();
    await expect(dialog).not.toBeVisible();

    // Verify ChatGPT tab exists
    await expect(mainWindow.getByRole('tab', { name: /chatgpt/i }).first()).toBeVisible();
    await takeScreenshot(mainWindow, 'session-chatgpt-created');

    // Create Gemini session
    await mainWindow.getByRole('button', { name: /add new session.*cmd.*ctrl/i }).click();
    dialog = await waitForDialog(mainWindow, 'Select AI Provider');

    await dialog.getByRole('button', { name: /gemini/i }).click();
    await dialog.getByRole('button', { name: /create session/i }).click();
    await expect(dialog).not.toBeVisible();

    // Verify Gemini tab exists
    await expect(mainWindow.getByRole('tab', { name: /gemini/i }).first()).toBeVisible();
    await takeScreenshot(mainWindow, 'session-gemini-created');

    // Verify Gemini content is displayed (should be active session)
    await expect(mainWindow.getByText('https://gemini.google.com')).toBeVisible();
  });

  test('should switch between multiple sessions', async ({ mainWindow }) => {
    // Create first session (Claude)
    await mainWindow.getByRole('button', { name: /add new session.*cmd.*ctrl/i }).click();
    let dialog = await waitForDialog(mainWindow, 'Select AI Provider');
    await dialog.getByRole('button', { name: /claude/i }).click();
    await dialog.getByRole('button', { name: /create session/i }).click();
    await expect(dialog).not.toBeVisible();

    const claudeTab = mainWindow.getByRole('tab', { name: /claude/i }).first();
    await expect(claudeTab).toBeVisible();

    // Create second session (ChatGPT)
    await mainWindow.getByRole('button', { name: /add new session.*cmd.*ctrl/i }).click();
    dialog = await waitForDialog(mainWindow, 'Select AI Provider');
    await dialog.getByRole('button', { name: /chatgpt/i }).click();
    await dialog.getByRole('button', { name: /create session/i }).click();
    await expect(dialog).not.toBeVisible();

    const chatgptTab = mainWindow.getByRole('tab', { name: /chatgpt/i }).first();
    await expect(chatgptTab).toBeVisible();

    // ChatGPT should be active (most recently created)
    await expect(chatgptTab).toHaveClass(/bg-background/);
    await expect(mainWindow.getByText('https://chat.openai.com')).toBeVisible();
    await takeScreenshot(mainWindow, 'session-chatgpt-active');

    // Switch to Claude session
    await claudeTab.click();

    // Verify Claude is now active
    await expect(claudeTab).toHaveClass(/bg-background/);
    await expect(mainWindow.getByText('https://claude.ai')).toBeVisible();
    await takeScreenshot(mainWindow, 'session-claude-active');

    // Switch back to ChatGPT
    await chatgptTab.click();

    // Verify ChatGPT is active again
    await expect(chatgptTab).toHaveClass(/bg-background/);
    await expect(mainWindow.getByText('https://chat.openai.com')).toBeVisible();
  });

  test('should close a session with confirmation', async ({ mainWindow }) => {
    // Create a session first
    await mainWindow.getByRole('button', { name: /add new session.*cmd.*ctrl/i }).click();
    let dialog = await waitForDialog(mainWindow, 'Select AI Provider');
    await dialog.getByRole('button', { name: /claude/i }).click();
    await dialog.getByRole('button', { name: /create session/i }).click();
    await expect(dialog).not.toBeVisible();

    const sessionTab = mainWindow.getByRole('tab', { name: /claude/i }).first();
    await expect(sessionTab).toBeVisible();

    // Hover over the tab to show the close button
    await sessionTab.hover();
    await takeScreenshot(mainWindow, 'session-hover-close');

    // Click the close button (X icon)
    const closeButton = sessionTab.locator('button[title="Close session"]');
    await expect(closeButton).toBeVisible();
    await closeButton.click();

    // Wait for confirmation dialog
    const closeDialog = mainWindow.getByRole('alertdialog');
    await expect(closeDialog).toBeVisible();
    await expect(closeDialog.getByRole('heading', { name: /close session/i })).toBeVisible();
    await expect(closeDialog.getByText(/claude/i)).toBeVisible();
    await takeScreenshot(mainWindow, 'session-close-dialog');

    // Confirm closure
    const confirmButton = closeDialog.getByRole('button', { name: /close session/i });
    await confirmButton.click();

    // Verify dialog closed
    await expect(closeDialog).not.toBeVisible();

    // Verify session tab is removed
    await expect(sessionTab).not.toBeVisible();
    await takeScreenshot(mainWindow, 'session-after-close');
  });

  test('should cancel session closure', async ({ mainWindow }) => {
    // Create a session
    await mainWindow.getByRole('button', { name: /add new session.*cmd.*ctrl/i }).click();
    let dialog = await waitForDialog(mainWindow, 'Select AI Provider');
    await dialog.getByRole('button', { name: /gemini/i }).click();
    await dialog.getByRole('button', { name: /create session/i }).click();
    await expect(dialog).not.toBeVisible();

    const sessionTab = mainWindow.getByRole('tab', { name: /gemini/i }).first();
    await expect(sessionTab).toBeVisible();

    // Hover and click close button
    await sessionTab.hover();
    const closeButton = sessionTab.locator('button[title="Close session"]');
    await closeButton.click();

    // Wait for confirmation dialog
    const closeDialog = mainWindow.getByRole('alertdialog');
    await expect(closeDialog).toBeVisible();

    // Click Cancel
    const cancelButton = closeDialog.getByRole('button', { name: /cancel/i });
    await cancelButton.click();

    // Verify dialog closed
    await expect(closeDialog).not.toBeVisible();

    // Verify session tab is still there
    await expect(sessionTab).toBeVisible();
    await takeScreenshot(mainWindow, 'session-cancel-close');
  });

  test('should maintain active session after closing another session', async ({ mainWindow }) => {
    // Create two sessions
    await mainWindow.getByRole('button', { name: /add new session.*cmd.*ctrl/i }).click();
    let dialog = await waitForDialog(mainWindow, 'Select AI Provider');
    await dialog.getByRole('button', { name: /claude/i }).click();
    await dialog.getByRole('button', { name: /create session/i }).click();
    await expect(dialog).not.toBeVisible();

    await mainWindow.getByRole('button', { name: /add new session.*cmd.*ctrl/i }).click();
    dialog = await waitForDialog(mainWindow, 'Select AI Provider');
    await dialog.getByRole('button', { name: /chatgpt/i }).click();
    await dialog.getByRole('button', { name: /create session/i }).click();
    await expect(dialog).not.toBeVisible();

    const claudeTab = mainWindow.getByRole('tab', { name: /claude/i }).first();
    const chatgptTab = mainWindow.getByRole('tab', { name: /chatgpt/i }).first();

    // Switch to Claude session
    await claudeTab.click();
    await expect(mainWindow.getByText('https://claude.ai')).toBeVisible();

    // Close ChatGPT session (not active)
    await chatgptTab.hover();
    const closeButton = chatgptTab.locator('button[title="Close session"]');
    await closeButton.click();

    const closeDialog = mainWindow.getByRole('alertdialog');
    await closeDialog.getByRole('button', { name: /close session/i }).click();

    // Verify ChatGPT is removed
    await expect(chatgptTab).not.toBeVisible();

    // Verify Claude is still active
    await expect(claudeTab).toBeVisible();
    await expect(claudeTab).toHaveClass(/bg-background/);
    await expect(mainWindow.getByText('https://claude.ai')).toBeVisible();
    await takeScreenshot(mainWindow, 'session-active-maintained');
  });

  test('should handle keyboard shortcuts for session management', async ({ mainWindow }) => {
    // Test Cmd/Ctrl+T to open provider dialog
    await mainWindow.keyboard.press('Control+t');

    const dialog = mainWindow.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText('Select AI Provider')).toBeVisible();

    // Close dialog with Escape
    await mainWindow.keyboard.press('Escape');
    await expect(dialog).not.toBeVisible();

    // Create a session for testing close shortcut
    await mainWindow.getByRole('button', { name: /add new session.*cmd.*ctrl/i }).click();
    const providerDialog = await waitForDialog(mainWindow, 'Select AI Provider');
    await providerDialog.getByRole('button', { name: /claude/i }).click();
    await providerDialog.getByRole('button', { name: /create session/i }).click();
    await expect(providerDialog).not.toBeVisible();

    // Wait for session to be created
    const sessionTab = mainWindow.getByRole('tab', { name: /claude/i }).first();
    await expect(sessionTab).toBeVisible();

    // Test Cmd/Ctrl+W to close active session
    await mainWindow.keyboard.press('Control+w');

    const closeDialog = mainWindow.getByRole('alertdialog');
    await expect(closeDialog).toBeVisible();
    await expect(closeDialog.getByRole('heading', { name: /close session/i })).toBeVisible();

    await takeScreenshot(mainWindow, 'session-keyboard-shortcuts');

    // Cancel the close
    await mainWindow.keyboard.press('Escape');
    await expect(closeDialog).not.toBeVisible();
  });

  test('should display correct provider information in session content', async ({ mainWindow }) => {
    const providers = [
      { name: 'Claude', url: 'https://claude.ai', color: 'bg-blue-500' },
      { name: 'ChatGPT', url: 'https://chat.openai.com', color: 'bg-green-500' },
      { name: 'Gemini', url: 'https://gemini.google.com', color: 'bg-purple-500' },
    ];

    for (const provider of providers) {
      // Create session
      await mainWindow.getByRole('button', { name: /add new session.*cmd.*ctrl/i }).click();
      const dialog = await waitForDialog(mainWindow, 'Select AI Provider');
      await dialog.getByRole('button', { name: new RegExp(provider.name, 'i') }).click();
      await dialog.getByRole('button', { name: /create session/i }).click();
      await expect(dialog).not.toBeVisible();

      // Verify session content displays correct information
      const sessionTab = mainWindow.getByRole('tab', { name: new RegExp(provider.name, 'i') }).first();
      await expect(sessionTab).toBeVisible();

      // Session should be active (most recently created)
      await expect(mainWindow.getByText(provider.url)).toBeVisible();
      await expect(mainWindow.getByText(provider.name).first()).toBeVisible();

      await takeScreenshot(mainWindow, `session-${provider.name.toLowerCase()}-content`);
    }
  });
});
