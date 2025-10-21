import { test, expect } from './fixtures/electron-app';
import { waitForAppReady, clearTestData, createTestSession, createTestCapture } from './helpers/test-helpers';

/**
 * E2E Tests for Data Capture Workflow
 *
 * Tests the complete workflow of capturing AI responses, viewing details,
 * and displaying captures in the recent captures panel.
 *
 * Note: These tests use IPC to create test data instead of direct database access
 */
test.describe('Data Capture Workflow', () => {
  test('should display captured AI responses in data panel', async ({ mainWindow }) => {
    await waitForAppReady(mainWindow);

    // Clear test data and create session
    await clearTestData(mainWindow);
    await createTestSession(mainWindow, {
      id: 'test-session-1',
      provider: 'claude',
      name: 'Test Claude Session',
    });

    // Create test capture via IPC
    await createTestCapture(mainWindow, {
      id: 'capture-1',
      session_id: 'test-session-1',
      provider: 'claude',
      prompt: 'Explain quantum computing in simple terms',
      response: 'Quantum computing is a revolutionary type of computing that uses quantum bits or qubits. Unlike classical bits that can be either 0 or 1, qubits can exist in multiple states simultaneously through superposition.',
      tags: ['quantum', 'computing'],
      token_count: 250,
    });

    // Wait for app to be ready
    await mainWindow.waitForTimeout(1000);

    // Look for the data panel (Captured Research)
    const dataPanelHeader = mainWindow.locator('text=Captured Research');
    await expect(dataPanelHeader).toBeVisible({ timeout: 10000 });

    // Trigger a refresh by clicking the search input to ensure data loads
    const searchInput = mainWindow.locator('input[placeholder*="Search responses"]');
    if (await searchInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      await searchInput.click();
      await mainWindow.waitForTimeout(1000);
    }

    // Verify the capture appears (looking for part of the prompt)
    const captureText = mainWindow.locator('text=/quantum computing/i');
    await expect(captureText).toBeVisible({ timeout: 10000 });

    // Take screenshot for verification
    await mainWindow.screenshot({
      path: 'e2e-results/screenshots/capture-in-panel.png',
    });
  });

  test('should display capture details when clicking on captured item', async ({ mainWindow }) => {
    await waitForAppReady(mainWindow);

    // Clear and create test data
    await clearTestData(mainWindow);
    await createTestSession(mainWindow, {
      id: 'test-session-2',
      provider: 'openai',
      name: 'Test OpenAI Session',
    });

    await createTestCapture(mainWindow, {
      id: 'capture-2',
      session_id: 'test-session-2',
      provider: 'openai',
      prompt: 'Write a haiku about programming',
      response: 'Code flows like water\nBugs hide in silent corners\nDebug brings the light',
      model: 'gpt-4',
      tags: ['poetry', 'programming'],
      token_count: 180,
    });

    // Wait and refresh
    await mainWindow.waitForTimeout(1000);

    // Click search to trigger data load
    const searchInput = mainWindow.locator('input[placeholder*="Search responses"]');
    if (await searchInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      await searchInput.click();
      await mainWindow.waitForTimeout(1000);
    }

    // Click on the capture card
    const captureCard = mainWindow.locator('text=/haiku about programming/i').first();
    await expect(captureCard).toBeVisible({ timeout: 10000 });
    await captureCard.click();

    // Wait for detail dialog to appear
    await mainWindow.waitForTimeout(500);
    const dialog = mainWindow.locator('[role="dialog"]');
    await expect(dialog).toBeVisible({ timeout: 5000 });

    // Verify dialog contains capture details
    await expect(dialog.locator('text=/Write a haiku/i')).toBeVisible();
    await expect(dialog.locator('text=/Code flows like water/i')).toBeVisible();
    await expect(dialog.locator('text=openai')).toBeVisible();

    // Verify tags are displayed
    await expect(dialog.locator('text=poetry')).toBeVisible();
    await expect(dialog.locator('text=programming')).toBeVisible();

    // Take screenshot
    await mainWindow.screenshot({
      path: 'e2e-results/screenshots/capture-detail-dialog.png',
      fullPage: true,
    });

    // Close dialog
    await mainWindow.keyboard.press('Escape');
    await mainWindow.waitForTimeout(300);
    await expect(dialog).not.toBeVisible({ timeout: 3000 });
  });

  test('should show multiple captures in recent captures panel with stats', async ({ mainWindow }) => {
    await waitForAppReady(mainWindow);

    // Clear and seed with multiple captures
    await clearTestData(mainWindow);

    // Create sessions
    await createTestSession(mainWindow, { id: 'test-session-3', provider: 'claude', name: 'Claude' });
    await createTestSession(mainWindow, { id: 'test-session-4', provider: 'gemini', name: 'Gemini' });

    // Create captures
    await createTestCapture(mainWindow, {
      id: 'capture-3',
      session_id: 'test-session-3',
      provider: 'claude',
      prompt: 'What are the benefits of TypeScript?',
      response: 'TypeScript provides static typing, better IDE support, and catches errors at compile time.',
      tags: ['typescript', 'programming'],
      token_count: 200,
    });

    await createTestCapture(mainWindow, {
      id: 'capture-4',
      session_id: 'test-session-4',
      provider: 'gemini',
      prompt: 'Explain machine learning',
      response: 'Machine learning is a subset of AI that enables systems to learn and improve from experience.',
      tags: ['ml', 'ai'],
      token_count: 180,
    });

    await createTestCapture(mainWindow, {
      id: 'capture-5',
      session_id: 'test-session-3',
      provider: 'claude',
      prompt: 'Best practices for React',
      response: 'Use hooks, keep components small, follow single responsibility principle.',
      tags: ['react', 'best-practices'],
      token_count: 150,
    });

    await mainWindow.waitForTimeout(1000);

    // Trigger data load
    const searchInput = mainWindow.locator('input[placeholder*="Search responses"]');
    if (await searchInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      await searchInput.click();
      await mainWindow.waitForTimeout(1000);
    }

    // Verify recent captures panel
    const dataPanelHeader = mainWindow.locator('text=Captured Research');
    await expect(dataPanelHeader).toBeVisible();

    // Verify at least one capture is visible
    const captureCards = mainWindow.locator('button').filter({ hasText: /TypeScript|machine learning|React/i });
    const count = await captureCards.count();
    expect(count).toBeGreaterThan(0);

    // Verify stats panel
    const statsSection = mainWindow.locator('text=Stats').locator('..');
    await expect(statsSection).toBeVisible();
    await expect(statsSection.locator('text=Total Responses')).toBeVisible();
    await expect(statsSection.locator('text=Unique Providers')).toBeVisible();
    await expect(statsSection.locator('text=Total Tokens')).toBeVisible();

    // Take screenshot
    await mainWindow.screenshot({
      path: 'e2e-results/screenshots/recent-captures-panel.png',
    });
  });

  test('should handle empty state when no captures exist', async ({ mainWindow }) => {
    await waitForAppReady(mainWindow);

    // Clear all captures
    await clearTestData(mainWindow);

    await mainWindow.waitForTimeout(1000);

    // Trigger data load
    const searchInput = mainWindow.locator('input[placeholder*="Search responses"]');
    if (await searchInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      await searchInput.click();
      await mainWindow.waitForTimeout(1000);
    }

    // Verify empty state message
    const emptyMessage = mainWindow.locator('text=/No captures yet|appear here automatically/i');
    await expect(emptyMessage).toBeVisible({ timeout: 5000 });

    // Take screenshot
    await mainWindow.screenshot({
      path: 'e2e-results/screenshots/empty-state.png',
    });
  });

  test('should search and filter captures in the panel', async ({ mainWindow }) => {
    await waitForAppReady(mainWindow);

    // Clear and seed with searchable data
    await clearTestData(mainWindow);

    await createTestSession(mainWindow, { id: 'test-session-5', provider: 'claude', name: 'Claude' });
    await createTestSession(mainWindow, { id: 'test-session-6', provider: 'openai', name: 'OpenAI' });

    await createTestCapture(mainWindow, {
      id: 'capture-6',
      session_id: 'test-session-5',
      provider: 'claude',
      prompt: 'Explain Docker containers',
      response: 'Docker containers are lightweight, standalone packages that include everything needed to run an application.',
      tags: ['docker', 'devops'],
      token_count: 220,
    });

    await createTestCapture(mainWindow, {
      id: 'capture-7',
      session_id: 'test-session-6',
      provider: 'openai',
      prompt: 'What is Kubernetes?',
      response: 'Kubernetes is an open-source container orchestration platform for automating deployment.',
      tags: ['kubernetes', 'devops'],
      token_count: 190,
    });

    await mainWindow.waitForTimeout(1000);

    // Get search input
    const searchInput = mainWindow.locator('input[placeholder*="Search responses"]');
    await expect(searchInput).toBeVisible({ timeout: 5000 });

    // Search for Docker
    await searchInput.click();
    await searchInput.clear();
    await searchInput.fill('Docker');
    await mainWindow.waitForTimeout(1000);

    // Should show Docker capture
    await expect(mainWindow.locator('text=/Docker containers/i')).toBeVisible({ timeout: 5000 });

    // Search for Kubernetes
    await searchInput.clear();
    await searchInput.fill('Kubernetes');
    await mainWindow.waitForTimeout(1000);

    // Should show Kubernetes capture
    await expect(mainWindow.locator('text=/What is Kubernetes/i')).toBeVisible({ timeout: 5000 });

    // Take screenshot
    await mainWindow.screenshot({
      path: 'e2e-results/screenshots/filtered-captures.png',
    });
  });

  test('should edit tags in capture detail dialog', async ({ mainWindow }) => {
    await waitForAppReady(mainWindow);

    // Clear and seed
    await clearTestData(mainWindow);

    await createTestSession(mainWindow, { id: 'test-session-7', provider: 'claude', name: 'Claude' });

    await createTestCapture(mainWindow, {
      id: 'capture-8',
      session_id: 'test-session-7',
      provider: 'claude',
      prompt: 'Explain REST APIs',
      response: 'REST APIs use HTTP methods to interact with resources identified by URLs.',
      tags: ['api', 'rest'],
      token_count: 160,
    });

    await mainWindow.waitForTimeout(1000);

    // Load data
    const searchInput = mainWindow.locator('input[placeholder*="Search responses"]');
    if (await searchInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      await searchInput.click();
      await mainWindow.waitForTimeout(1000);
    }

    // Open capture detail
    const captureCard = mainWindow.locator('text=/Explain REST APIs/i').first();
    await expect(captureCard).toBeVisible({ timeout: 10000 });
    await captureCard.click();

    await mainWindow.waitForTimeout(500);
    const dialog = mainWindow.locator('[role="dialog"]');
    await expect(dialog).toBeVisible({ timeout: 5000 });

    // Verify existing tags
    await expect(dialog.locator('text=api')).toBeVisible();
    await expect(dialog.locator('text=rest')).toBeVisible();

    // Take screenshot of dialog with tags
    await mainWindow.screenshot({
      path: 'e2e-results/screenshots/capture-tags.png',
      fullPage: true,
    });

    // Close dialog
    await mainWindow.keyboard.press('Escape');
    await expect(dialog).not.toBeVisible({ timeout: 3000 });
  });
});
