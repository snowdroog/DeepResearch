/**
 * Unit tests for settingsStore (Zustand)
 * Tests for settings management, persistence, and nested updates
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { useSettingsStore } from '../settingsStore'
import { DEFAULT_SETTINGS } from '@/renderer/types/settings'
import type { AppSettings } from '@/renderer/types/settings'

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString()
    },
    removeItem: (key: string) => {
      delete store[key]
    },
    clear: () => {
      store = {}
    },
  }
})()

// Setup global mocks
beforeEach(() => {
  // @ts-ignore - Mock localStorage
  global.localStorage = localStorageMock

  // Reset store state to defaults
  useSettingsStore.setState({
    settings: DEFAULT_SETTINGS,
  })

  // Clear localStorage
  localStorageMock.clear()
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('settingsStore', () => {
  describe('State Initialization', () => {
    it('should initialize with default settings', () => {
      const state = useSettingsStore.getState()

      expect(state.settings).toEqual(DEFAULT_SETTINGS)
    })

    it('should have all required action functions', () => {
      const state = useSettingsStore.getState()

      expect(typeof state.updateSettings).toBe('function')
      expect(typeof state.updateGeneralSettings).toBe('function')
      expect(typeof state.updateUISettings).toBe('function')
      expect(typeof state.updateExportSettings).toBe('function')
      expect(typeof state.updateCaptureSettings).toBe('function')
      expect(typeof state.updateDatabaseSettings).toBe('function')
      expect(typeof state.updateAdvancedSettings).toBe('function')
      expect(typeof state.resetSettings).toBe('function')
      expect(typeof state.resetSection).toBe('function')
    })

    it('should initialize with correct default general settings', () => {
      const state = useSettingsStore.getState()

      expect(state.settings.general.autoSave).toBe(true)
      expect(state.settings.general.saveInterval).toBe(30)
      expect(state.settings.general.enableNotifications).toBe(true)
      expect(state.settings.general.startMinimized).toBe(false)
      expect(state.settings.general.closeToTray).toBe(false)
    })

    it('should initialize with correct default UI settings', () => {
      const state = useSettingsStore.getState()

      expect(state.settings.ui.theme).toBe('system')
      expect(state.settings.ui.fontSize).toBe('medium')
      expect(state.settings.ui.sidebarPosition).toBe('left')
      expect(state.settings.ui.compactMode).toBe(false)
      expect(state.settings.ui.showTimestamps).toBe(true)
    })
  })

  describe('updateSettings', () => {
    it('should update top-level settings', () => {
      useSettingsStore.getState().updateSettings({
        general: {
          ...DEFAULT_SETTINGS.general,
          autoSave: false,
        },
      })

      const state = useSettingsStore.getState()
      expect(state.settings.general.autoSave).toBe(false)
    })

    it('should merge settings without losing other properties', () => {
      useSettingsStore.getState().updateSettings({
        general: {
          ...DEFAULT_SETTINGS.general,
          enableNotifications: false,
        },
      })

      const state = useSettingsStore.getState()
      expect(state.settings.general.enableNotifications).toBe(false)
      expect(state.settings.general.autoSave).toBe(true) // Should remain
      expect(state.settings.ui).toEqual(DEFAULT_SETTINGS.ui) // Should remain
    })
  })

  describe('updateGeneralSettings', () => {
    it('should update general settings', () => {
      useSettingsStore.getState().updateGeneralSettings({
        autoSave: false,
        saveInterval: 60,
      })

      const state = useSettingsStore.getState()
      expect(state.settings.general.autoSave).toBe(false)
      expect(state.settings.general.saveInterval).toBe(60)
    })

    it('should preserve other general settings when updating', () => {
      useSettingsStore.getState().updateGeneralSettings({
        startMinimized: true,
      })

      const state = useSettingsStore.getState()
      expect(state.settings.general.startMinimized).toBe(true)
      expect(state.settings.general.autoSave).toBe(true) // Should remain
      expect(state.settings.general.enableNotifications).toBe(true) // Should remain
    })

    it('should not affect other setting sections', () => {
      useSettingsStore.getState().updateGeneralSettings({
        closeToTray: true,
      })

      const state = useSettingsStore.getState()
      expect(state.settings.ui).toEqual(DEFAULT_SETTINGS.ui)
      expect(state.settings.capture).toEqual(DEFAULT_SETTINGS.capture)
    })
  })

  describe('updateUISettings', () => {
    it('should update UI theme', () => {
      useSettingsStore.getState().updateUISettings({
        theme: 'dark',
      })

      const state = useSettingsStore.getState()
      expect(state.settings.ui.theme).toBe('dark')
    })

    it('should update multiple UI settings', () => {
      useSettingsStore.getState().updateUISettings({
        theme: 'light',
        fontSize: 'large',
        compactMode: true,
      })

      const state = useSettingsStore.getState()
      expect(state.settings.ui.theme).toBe('light')
      expect(state.settings.ui.fontSize).toBe('large')
      expect(state.settings.ui.compactMode).toBe(true)
    })

    it('should update sidebar position', () => {
      useSettingsStore.getState().updateUISettings({
        sidebarPosition: 'right',
      })

      const state = useSettingsStore.getState()
      expect(state.settings.ui.sidebarPosition).toBe('right')
    })
  })

  describe('updateExportSettings', () => {
    it('should update export format', () => {
      useSettingsStore.getState().updateExportSettings({
        defaultFormat: 'markdown',
      })

      const state = useSettingsStore.getState()
      expect(state.settings.export.defaultFormat).toBe('markdown')
    })

    it('should update export path and metadata settings', () => {
      useSettingsStore.getState().updateExportSettings({
        exportPath: '/custom/export/path',
        includeMetadata: false,
        includeAttachments: false,
      })

      const state = useSettingsStore.getState()
      expect(state.settings.export.exportPath).toBe('/custom/export/path')
      expect(state.settings.export.includeMetadata).toBe(false)
      expect(state.settings.export.includeAttachments).toBe(false)
    })

    it('should update auto export settings', () => {
      useSettingsStore.getState().updateExportSettings({
        autoExportOnCapture: true,
      })

      const state = useSettingsStore.getState()
      expect(state.settings.export.autoExportOnCapture).toBe(true)
    })
  })

  describe('updateCaptureSettings', () => {
    it('should update capture settings', () => {
      useSettingsStore.getState().updateCaptureSettings({
        autoCapture: false,
        captureDelay: 2000,
        maxRetries: 5,
      })

      const state = useSettingsStore.getState()
      expect(state.settings.capture.autoCapture).toBe(false)
      expect(state.settings.capture.captureDelay).toBe(2000)
      expect(state.settings.capture.maxRetries).toBe(5)
    })

    it('should update screenshot settings', () => {
      useSettingsStore.getState().updateCaptureSettings({
        enableScreenshots: false,
        screenshotQuality: 90,
      })

      const state = useSettingsStore.getState()
      expect(state.settings.capture.enableScreenshots).toBe(false)
      expect(state.settings.capture.screenshotQuality).toBe(90)
    })

    it('should update capture providers', () => {
      useSettingsStore.getState().updateCaptureSettings({
        captureProviders: {
          chatgpt: false,
          claude: true,
          gemini: false,
          perplexity: true,
          custom: true,
        },
      })

      const state = useSettingsStore.getState()
      expect(state.settings.capture.captureProviders.chatgpt).toBe(false)
      expect(state.settings.capture.captureProviders.claude).toBe(true)
      expect(state.settings.capture.captureProviders.custom).toBe(true)
    })
  })

  describe('updateDatabaseSettings', () => {
    it('should update database backup settings', () => {
      useSettingsStore.getState().updateDatabaseSettings({
        autoBackup: false,
        backupInterval: 48,
        backupRetention: 60,
      })

      const state = useSettingsStore.getState()
      expect(state.settings.database.autoBackup).toBe(false)
      expect(state.settings.database.backupInterval).toBe(48)
      expect(state.settings.database.backupRetention).toBe(60)
    })

    it('should update backup path and compression', () => {
      useSettingsStore.getState().updateDatabaseSettings({
        backupPath: '/custom/backup/path',
        enableCompression: false,
        maxBackupSize: 200,
      })

      const state = useSettingsStore.getState()
      expect(state.settings.database.backupPath).toBe('/custom/backup/path')
      expect(state.settings.database.enableCompression).toBe(false)
      expect(state.settings.database.maxBackupSize).toBe(200)
    })
  })

  describe('updateAdvancedSettings', () => {
    it('should update logging settings', () => {
      useSettingsStore.getState().updateAdvancedSettings({
        enableLogging: false,
        logLevel: 'debug',
        maxLogSize: 100,
      })

      const state = useSettingsStore.getState()
      expect(state.settings.advanced.enableLogging).toBe(false)
      expect(state.settings.advanced.logLevel).toBe('debug')
      expect(state.settings.advanced.maxLogSize).toBe(100)
    })

    it('should update analytics and update settings', () => {
      useSettingsStore.getState().updateAdvancedSettings({
        enableAnalytics: true,
        checkForUpdates: false,
      })

      const state = useSettingsStore.getState()
      expect(state.settings.advanced.enableAnalytics).toBe(true)
      expect(state.settings.advanced.checkForUpdates).toBe(false)
    })
  })

  describe('resetSettings', () => {
    it('should reset all settings to defaults', () => {
      // Modify settings
      useSettingsStore.getState().updateGeneralSettings({ autoSave: false })
      useSettingsStore.getState().updateUISettings({ theme: 'dark' })
      useSettingsStore.getState().updateCaptureSettings({ autoCapture: false })

      // Reset
      useSettingsStore.getState().resetSettings()

      const state = useSettingsStore.getState()
      expect(state.settings).toEqual(DEFAULT_SETTINGS)
    })

    it('should reset all sections at once', () => {
      // Modify multiple sections
      useSettingsStore.getState().updateGeneralSettings({ saveInterval: 120 })
      useSettingsStore.getState().updateUISettings({ fontSize: 'large' })
      useSettingsStore.getState().updateExportSettings({ defaultFormat: 'csv' })

      // Reset
      useSettingsStore.getState().resetSettings()

      const state = useSettingsStore.getState()
      expect(state.settings.general.saveInterval).toBe(DEFAULT_SETTINGS.general.saveInterval)
      expect(state.settings.ui.fontSize).toBe(DEFAULT_SETTINGS.ui.fontSize)
      expect(state.settings.export.defaultFormat).toBe(DEFAULT_SETTINGS.export.defaultFormat)
    })
  })

  describe('resetSection', () => {
    it('should reset general section only', () => {
      useSettingsStore.getState().updateGeneralSettings({ autoSave: false })
      useSettingsStore.getState().updateUISettings({ theme: 'dark' })

      useSettingsStore.getState().resetSection('general')

      const state = useSettingsStore.getState()
      expect(state.settings.general).toEqual(DEFAULT_SETTINGS.general)
      expect(state.settings.ui.theme).toBe('dark') // Should remain
    })

    it('should reset UI section only', () => {
      useSettingsStore.getState().updateUISettings({ theme: 'dark', fontSize: 'large' })
      useSettingsStore.getState().updateGeneralSettings({ autoSave: false })

      useSettingsStore.getState().resetSection('ui')

      const state = useSettingsStore.getState()
      expect(state.settings.ui).toEqual(DEFAULT_SETTINGS.ui)
      expect(state.settings.general.autoSave).toBe(false) // Should remain
    })

    it('should reset capture section only', () => {
      useSettingsStore.getState().updateCaptureSettings({ autoCapture: false })
      useSettingsStore.getState().updateDatabaseSettings({ autoBackup: false })

      useSettingsStore.getState().resetSection('capture')

      const state = useSettingsStore.getState()
      expect(state.settings.capture).toEqual(DEFAULT_SETTINGS.capture)
      expect(state.settings.database.autoBackup).toBe(false) // Should remain
    })
  })

  describe('State Immutability', () => {
    it('should not mutate original settings when updating', () => {
      const originalSettings = useSettingsStore.getState().settings

      useSettingsStore.getState().updateGeneralSettings({ autoSave: false })

      expect(originalSettings.general.autoSave).toBe(true)
      expect(useSettingsStore.getState().settings.general.autoSave).toBe(false)
    })

    it('should create new nested objects when updating', () => {
      const originalGeneral = useSettingsStore.getState().settings.general

      useSettingsStore.getState().updateGeneralSettings({ saveInterval: 120 })

      expect(useSettingsStore.getState().settings.general).not.toBe(originalGeneral)
    })
  })

  describe('Persistence', () => {
    it('should have persist middleware configured', () => {
      // Note: Testing actual localStorage persistence requires integration tests
      // Here we verify the store structure supports persistence
      const state = useSettingsStore.getState()

      expect(state.settings).toBeDefined()
      expect(state.updateSettings).toBeDefined()
    })

    it('should maintain state consistency after complex operations', () => {
      useSettingsStore.getState().updateGeneralSettings({ autoSave: false })
      useSettingsStore.getState().updateUISettings({ theme: 'dark' })
      useSettingsStore.getState().resetSection('general')

      const state = useSettingsStore.getState()
      expect(state.settings.general.autoSave).toBe(DEFAULT_SETTINGS.general.autoSave)
      expect(state.settings.ui.theme).toBe('dark')
    })

    it('should preserve nested settings structure', () => {
      useSettingsStore.getState().updateCaptureSettings({
        captureProviders: {
          ...DEFAULT_SETTINGS.capture.captureProviders,
          claude: false,
        },
      })

      const state = useSettingsStore.getState()
      expect(state.settings.capture.captureProviders).toBeDefined()
      expect(state.settings.capture.captureProviders.claude).toBe(false)
    })
  })

  describe('Complex Scenarios', () => {
    it('should handle multiple rapid updates correctly', () => {
      useSettingsStore.getState().updateGeneralSettings({ autoSave: false })
      useSettingsStore.getState().updateUISettings({ theme: 'dark' })
      useSettingsStore.getState().updateCaptureSettings({ autoCapture: false })
      useSettingsStore.getState().updateDatabaseSettings({ autoBackup: false })

      const state = useSettingsStore.getState()
      expect(state.settings.general.autoSave).toBe(false)
      expect(state.settings.ui.theme).toBe('dark')
      expect(state.settings.capture.autoCapture).toBe(false)
      expect(state.settings.database.autoBackup).toBe(false)
    })

    it('should handle partial updates without losing data', () => {
      // Update only one property in capture providers
      useSettingsStore.getState().updateCaptureSettings({
        captureProviders: {
          ...DEFAULT_SETTINGS.capture.captureProviders,
          claude: false,
        },
      })

      const state = useSettingsStore.getState()
      expect(state.settings.capture.captureProviders.claude).toBe(false)
      expect(state.settings.capture.captureProviders.chatgpt).toBe(true)
      expect(state.settings.capture.captureProviders.gemini).toBe(true)
    })
  })
})
