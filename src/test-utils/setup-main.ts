/**
 * Global test setup for Main Process (Electron main & preload)
 * This file runs before all tests in the Node environment
 */

import { vi } from 'vitest';

// Mock Electron modules for main process tests
vi.mock('electron', () => {
  const { vi } = require('vitest');

  return {
  app: {
    getPath: vi.fn((name: string) => `/mock/path/${name}`),
    getName: vi.fn(() => 'DeepResearch-Test'),
    getVersion: vi.fn(() => '0.1.0-test'),
    quit: vi.fn(),
    on: vi.fn(),
    whenReady: vi.fn(() => Promise.resolve()),
    isPackaged: false,
  },
  BrowserWindow: vi.fn().mockImplementation(() => ({
    loadURL: vi.fn(),
    loadFile: vi.fn(),
    on: vi.fn(),
    webContents: {
      send: vi.fn(),
      on: vi.fn(),
      openDevTools: vi.fn(),
    },
    show: vi.fn(),
    hide: vi.fn(),
    close: vi.fn(),
    minimize: vi.fn(),
    maximize: vi.fn(),
    isMaximized: vi.fn(() => false),
    contentView: {
      addChildView: vi.fn(),
      removeChildView: vi.fn(),
    },
    getBounds: vi.fn(() => ({ x: 0, y: 0, width: 1200, height: 800 })),
  })),
  WebContentsView: vi.fn().mockImplementation(() => ({
    webContents: {
      loadURL: vi.fn(),
      getURL: vi.fn(() => 'https://example.com'),
      send: vi.fn(),
      once: vi.fn(),
      on: vi.fn(),
      destroy: vi.fn(),
      close: vi.fn(),
      debugger: {
        attach: vi.fn(),
        detach: vi.fn(),
        sendCommand: vi.fn(),
        on: vi.fn(),
      },
    },
    setBounds: vi.fn(),
    getBounds: vi.fn(() => ({ x: 0, y: 0, width: 800, height: 600 })),
  })),
  BrowserView: vi.fn().mockImplementation(() => ({
    webContents: {
      loadURL: vi.fn(),
      getURL: vi.fn(() => 'https://example.com'),
      send: vi.fn(),
      once: vi.fn(),
      on: vi.fn(),
      destroy: vi.fn(),
      debugger: {
        attach: vi.fn(),
        detach: vi.fn(),
        sendCommand: vi.fn(),
        on: vi.fn(),
      },
    },
    setBounds: vi.fn(),
    setAutoResize: vi.fn(),
  })),
  ipcMain: {
    handle: vi.fn(),
    on: vi.fn(),
    once: vi.fn(),
    removeListener: vi.fn(),
    removeAllListeners: vi.fn(),
  },
  ipcRenderer: {
    invoke: vi.fn(),
    send: vi.fn(),
    on: vi.fn(),
    once: vi.fn(),
    removeListener: vi.fn(),
    removeAllListeners: vi.fn(),
  },
  dialog: {
    showOpenDialog: vi.fn(() =>
      Promise.resolve({
        canceled: false,
        filePaths: ['/mock/selected/path'],
      })
    ),
    showSaveDialog: vi.fn(() =>
      Promise.resolve({
        canceled: false,
        filePath: '/mock/save/path',
      })
    ),
    showMessageBox: vi.fn(() =>
      Promise.resolve({
        response: 0,
        checkboxChecked: false,
      })
    ),
  },
  shell: {
    openExternal: vi.fn(() => Promise.resolve()),
    openPath: vi.fn(() => Promise.resolve('')),
  },
  Menu: {
    setApplicationMenu: vi.fn(),
    buildFromTemplate: vi.fn(),
  },
  nativeTheme: {
    themeSource: 'system',
    shouldUseDarkColors: false,
  },
  session: {
    fromPartition: vi.fn().mockReturnValue({
      setUserAgent: vi.fn(),
      clearCache: vi.fn(),
      clearStorageData: vi.fn(),
    }),
  },
  };
});

// Mock electron-log
vi.mock('electron-log', () => ({
  default: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
    transports: {
      file: {
        level: 'info',
      },
      console: {
        level: 'info',
      },
    },
  },
}));

// Mock better-sqlite3
vi.mock('better-sqlite3', () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      prepare: vi.fn(() => ({
        run: vi.fn(),
        get: vi.fn(),
        all: vi.fn(() => []),
      })),
      exec: vi.fn(),
      close: vi.fn(),
      pragma: vi.fn(),
    })),
  };
});
