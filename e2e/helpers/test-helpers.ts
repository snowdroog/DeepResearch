import { Page, expect } from '@playwright/test';

/**
 * Helper utilities for E2E tests
 */

/**
 * Wait for element to be visible and return it
 */
export async function waitForElement(page: Page, selector: string, timeout = 5000) {
  const element = page.locator(selector);
  await expect(element).toBeVisible({ timeout });
  return element;
}

/**
 * Wait for text to appear on the page
 */
export async function waitForText(page: Page, text: string, timeout = 5000) {
  await expect(page.getByText(text)).toBeVisible({ timeout });
}

/**
 * Click element and wait for navigation if needed
 */
export async function clickAndWait(page: Page, selector: string, options?: { waitForNavigation?: boolean }) {
  const element = await waitForElement(page, selector);

  if (options?.waitForNavigation) {
    await Promise.all([
      page.waitForNavigation(),
      element.click(),
    ]);
  } else {
    await element.click();
  }
}

/**
 * Fill input field
 */
export async function fillInput(page: Page, selector: string, value: string) {
  const input = await waitForElement(page, selector);
  await input.fill(value);
}

/**
 * Wait for dialog to appear
 */
export async function waitForDialog(page: Page, title: string, timeout = 5000) {
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible({ timeout });
  await expect(dialog.getByText(title)).toBeVisible();
  return dialog;
}

/**
 * Close dialog by clicking the close button or escape
 */
export async function closeDialog(page: Page) {
  // Try clicking close button first
  const closeButton = page.getByRole('button', { name: /close/i });
  if (await closeButton.isVisible()) {
    await closeButton.click();
  } else {
    // Fallback to escape key
    await page.keyboard.press('Escape');
  }

  // Wait for dialog to disappear
  await expect(page.getByRole('dialog')).not.toBeVisible();
}

/**
 * Take screenshot with name
 */
export async function takeScreenshot(page: Page, name: string) {
  await page.screenshot({
    path: `e2e-results/screenshots/${name}.png`,
    fullPage: true,
  });
}

/**
 * Wait for table to load data
 */
export async function waitForTable(page: Page, minRows = 0, timeout = 5000) {
  const table = page.getByRole('table');
  await expect(table).toBeVisible({ timeout });

  if (minRows > 0) {
    const rows = table.getByRole('row');
    await expect(rows).toHaveCount(minRows, { timeout });
  }

  return table;
}

/**
 * Get table row count
 */
export async function getTableRowCount(page: Page): Promise<number> {
  const rows = page.getByRole('row');
  return await rows.count();
}

/**
 * Select option from dropdown
 */
export async function selectDropdownOption(page: Page, buttonSelector: string, optionText: string) {
  await page.locator(buttonSelector).click();
  await page.getByRole('option', { name: optionText }).click();
}

/**
 * Wait for toast notification
 */
export async function waitForToast(page: Page, message: string, timeout = 5000) {
  const toast = page.getByRole('status');
  await expect(toast).toBeVisible({ timeout });
  await expect(toast.getByText(message)).toBeVisible();
}

/**
 * Create a test session via IPC
 */
export async function createTestSession(page: Page, data: {
  id: string;
  provider: string;
  name: string;
  partition?: string;
}) {
  return await page.evaluate(async (sessionData: any) => {
    return await (window as any).electron.ipcRenderer.invoke('test:createSession', {
      ...sessionData,
      partition: sessionData.partition || `persist:${sessionData.provider}`,
    });
  }, data);
}

/**
 * Create a test capture via IPC
 */
export async function createTestCapture(page: Page, data: {
  id: string;
  session_id: string;
  provider: string;
  prompt: string;
  response: string;
  model?: string;
  tags?: string[];
  notes?: string;
  token_count?: number;
  response_format?: string;
}) {
  return await page.evaluate(async (captureData: any) => {
    const capture = {
      ...captureData,
      tags: captureData.tags ? JSON.stringify(captureData.tags) : undefined,
      response_format: captureData.response_format || 'text',
    };
    return await (window as any).electron.ipcRenderer.invoke('test:createCapture', capture);
  }, data);
}

/**
 * Seed multiple test captures
 */
export async function seedTestCaptures(page: Page, captures: Array<{
  id: string;
  session_id: string;
  provider: string;
  prompt: string;
  response: string;
  model?: string;
  tags?: string[];
  notes?: string;
}>) {
  for (const capture of captures) {
    await createTestCapture(page, capture);
  }
}

/**
 * Clear all test data from database
 */
export async function clearTestData(page: Page) {
  await page.evaluate(async () => {
    // Clear all captures using the test handler
    return await (window as any).electron.ipcRenderer.invoke('test:clearCaptures');
  });
}

/**
 * Wait for Electron app to be fully loaded
 */
export async function waitForAppReady(page: Page, timeout = 10000) {
  // Wait for React root to be attached (more reliable than visibility check)
  await expect(page.locator('#root')).toBeAttached({ timeout });

  // Wait for any loading spinners to disappear
  const loadingSpinners = page.locator('[role="status"][aria-label*="loading"]');
  if (await loadingSpinners.count() > 0) {
    await expect(loadingSpinners).not.toBeVisible({ timeout });
  }
}
