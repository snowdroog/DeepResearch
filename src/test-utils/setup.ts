/**
 * Global test setup for Renderer Process (React components)
 * This file runs before all tests in the happy-dom environment
 */

import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach, beforeAll, vi } from 'vitest';

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Setup global mocks
beforeAll(() => {
  // Mock window.electronAPI for renderer process tests
  global.window.electronAPI = {
    // Database operations
    getCapturedResponses: vi.fn(),
    saveResponse: vi.fn(),
    updateResponse: vi.fn(),
    deleteResponse: vi.fn(),

    // Project operations
    getProjects: vi.fn(),
    createProject: vi.fn(),
    updateProject: vi.fn(),
    deleteProject: vi.fn(),

    // Settings operations
    getSettings: vi.fn(),
    updateSettings: vi.fn(),

    // Export operations
    exportData: vi.fn(),

    // File system operations
    selectDirectory: vi.fn(),
    openExternal: vi.fn(),

    // Window operations
    minimizeWindow: vi.fn(),
    maximizeWindow: vi.fn(),
    closeWindow: vi.fn(),

    // App info
    getAppVersion: vi.fn(() => Promise.resolve('0.1.0-test')),

    // Event listeners
    on: vi.fn(),
    off: vi.fn(),
    once: vi.fn(),
  };

  // Mock matchMedia
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });

  // Mock IntersectionObserver
  global.IntersectionObserver = class IntersectionObserver {
    constructor() {}
    disconnect() {}
    observe() {}
    takeRecords() {
      return [];
    }
    unobserve() {}
  } as any;

  // Mock ResizeObserver
  global.ResizeObserver = class ResizeObserver {
    constructor() {}
    disconnect() {}
    observe() {}
    unobserve() {}
  } as any;

  // Mock PointerEvent for Radix UI (Radix uses PointerEvent internally)
  if (!global.PointerEvent) {
    global.PointerEvent = global.MouseEvent as any;
  }

  // Mock hasPointerCapture and releasePointerCapture for Radix UI
  if (!HTMLElement.prototype.hasPointerCapture) {
    HTMLElement.prototype.hasPointerCapture = vi.fn(() => false);
  }
  if (!HTMLElement.prototype.releasePointerCapture) {
    HTMLElement.prototype.releasePointerCapture = vi.fn();
  }
  if (!HTMLElement.prototype.setPointerCapture) {
    HTMLElement.prototype.setPointerCapture = vi.fn();
  }

  // Suppress console errors in tests (optional)
  // You can comment this out if you want to see all console output
  const originalConsoleError = console.error;
  console.error = (...args: any[]) => {
    // Filter out known React warnings that are not relevant in tests
    const message = args[0];
    if (
      typeof message === 'string' &&
      (message.includes('Warning: ReactDOM.render') ||
        message.includes('Not implemented: HTMLFormElement.prototype.submit'))
    ) {
      return;
    }
    originalConsoleError(...args);
  };
});

// Extend global window type for TypeScript
declare global {
  interface Window {
    electronAPI: any;
  }
}
