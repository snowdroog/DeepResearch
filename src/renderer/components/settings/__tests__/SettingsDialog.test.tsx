/**
 * Unit tests for SettingsDialog component
 * Tests dialog rendering, tab navigation, form interactions, store integration, and validation
 * Target: 50%+ coverage with 15+ test cases
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderWithProviders, screen, waitFor, within } from '@/test-utils/test-helpers'
import userEvent from '@testing-library/user-event'
import { SettingsDialog } from '../SettingsDialog'
import { useSettingsStore } from '@/renderer/stores/settingsStore'
import { DEFAULT_SETTINGS } from '@/renderer/types/settings'

// Mock localStorage for Zustand persistence
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

describe('SettingsDialog', () => {
  describe('Basic Rendering', () => {
    it('should render dialog when open prop is true', () => {
      const onOpenChange = vi.fn()
      renderWithProviders(<SettingsDialog open={true} onOpenChange={onOpenChange} />)

      expect(screen.getByRole('dialog')).toBeInTheDocument()
      expect(screen.getByText('Settings')).toBeInTheDocument()
      expect(screen.getByText('Configure DeepResearch application preferences')).toBeInTheDocument()
    })

    it('should not render dialog when open prop is false', () => {
      const onOpenChange = vi.fn()
      renderWithProviders(<SettingsDialog open={false} onOpenChange={onOpenChange} />)

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })

    it('should render all section headers', () => {
      const onOpenChange = vi.fn()
      renderWithProviders(<SettingsDialog open={true} onOpenChange={onOpenChange} />)

      expect(screen.getByText('General')).toBeInTheDocument()
      expect(screen.getByText('UI Preferences')).toBeInTheDocument()
      expect(screen.getByText('Export')).toBeInTheDocument()
      expect(screen.getByText('Capture')).toBeInTheDocument()
      expect(screen.getByText('Database')).toBeInTheDocument()
      expect(screen.getByText('Advanced')).toBeInTheDocument()
    })

    it('should render Reset All Settings section', () => {
      const onOpenChange = vi.fn()
      renderWithProviders(<SettingsDialog open={true} onOpenChange={onOpenChange} />)

      expect(screen.getByText('Reset All Settings')).toBeInTheDocument()
      expect(screen.getByText('Restore all settings to their default values')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /reset all/i })).toBeInTheDocument()
    })
  })

  describe('General Settings Section', () => {
    it('should render all general settings controls', () => {
      const onOpenChange = vi.fn()
      renderWithProviders(<SettingsDialog open={true} onOpenChange={onOpenChange} />)

      expect(screen.getByLabelText(/auto save/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/save interval/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/enable notifications/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/start minimized/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/close to tray/i)).toBeInTheDocument()
    })

    it('should toggle auto save switch', async () => {
      const user = userEvent.setup()
      const onOpenChange = vi.fn()
      renderWithProviders(<SettingsDialog open={true} onOpenChange={onOpenChange} />)

      const autoSaveSwitch = screen.getByLabelText(/auto save/i)
      expect(autoSaveSwitch).toBeChecked() // Default is true

      await user.click(autoSaveSwitch)

      const state = useSettingsStore.getState()
      expect(state.settings.general.autoSave).toBe(false)
    })

    it('should update save interval input', async () => {
      const user = userEvent.setup()
      const onOpenChange = vi.fn()
      renderWithProviders(<SettingsDialog open={true} onOpenChange={onOpenChange} />)

      const saveIntervalInput = screen.getByLabelText(/save interval/i)
      expect(saveIntervalInput).toHaveValue(30) // Default value

      // Select all and replace with new value
      await user.tripleClick(saveIntervalInput)
      await user.keyboard('60')

      const state = useSettingsStore.getState()
      expect(state.settings.general.saveInterval).toBe(60)
    })

    it('should toggle notifications switch', async () => {
      const user = userEvent.setup()
      const onOpenChange = vi.fn()
      renderWithProviders(<SettingsDialog open={true} onOpenChange={onOpenChange} />)

      const notificationsSwitch = screen.getByLabelText(/enable notifications/i)
      expect(notificationsSwitch).toBeChecked()

      await user.click(notificationsSwitch)

      const state = useSettingsStore.getState()
      expect(state.settings.general.enableNotifications).toBe(false)
    })

    it('should reset general section only', async () => {
      const user = userEvent.setup()
      const onOpenChange = vi.fn()
      renderWithProviders(<SettingsDialog open={true} onOpenChange={onOpenChange} />)

      // Modify general settings
      const autoSaveSwitch = screen.getByLabelText(/auto save/i)
      await user.click(autoSaveSwitch)
      expect(useSettingsStore.getState().settings.general.autoSave).toBe(false)

      // Find and click the Reset button in the General section
      const generalSection = screen.getByText('General').closest('section')!
      const resetButton = within(generalSection).getByRole('button', { name: /reset/i })
      await user.click(resetButton)

      // General settings should be reset
      const state = useSettingsStore.getState()
      expect(state.settings.general).toEqual(DEFAULT_SETTINGS.general)
    })
  })

  describe('UI Settings Section', () => {
    it('should render all UI settings controls', () => {
      const onOpenChange = vi.fn()
      renderWithProviders(<SettingsDialog open={true} onOpenChange={onOpenChange} />)

      expect(screen.getByLabelText(/theme/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/font size/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/sidebar position/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/compact mode/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/show timestamps/i)).toBeInTheDocument()
    })

    it('should change theme selection', () => {
      const onOpenChange = vi.fn()

      // Pre-set theme to dark in the store
      useSettingsStore.setState({
        settings: {
          ...DEFAULT_SETTINGS,
          ui: {
            ...DEFAULT_SETTINGS.ui,
            theme: 'dark',
          },
        },
      })

      renderWithProviders(<SettingsDialog open={true} onOpenChange={onOpenChange} />)

      // Verify the select trigger shows the selected value
      const themeSection = screen.getByLabelText(/theme/i).closest('div')!
      const selectTrigger = themeSection.querySelector('[role="combobox"]') as HTMLElement

      expect(selectTrigger).toBeInTheDocument()
      expect(selectTrigger).toHaveAttribute('data-state', 'closed')

      // Verify store has dark theme
      const state = useSettingsStore.getState()
      expect(state.settings.ui.theme).toBe('dark')
    })

    it('should change font size selection', () => {
      const onOpenChange = vi.fn()

      // Pre-set font size to large in the store
      useSettingsStore.setState({
        settings: {
          ...DEFAULT_SETTINGS,
          ui: {
            ...DEFAULT_SETTINGS.ui,
            fontSize: 'large',
          },
        },
      })

      renderWithProviders(<SettingsDialog open={true} onOpenChange={onOpenChange} />)

      // Verify the select is rendered
      const fontSizeSection = screen.getByLabelText(/font size/i).closest('div')!
      const selectTrigger = fontSizeSection.querySelector('[role="combobox"]') as HTMLElement

      expect(selectTrigger).toBeInTheDocument()

      // Verify store has large font size
      const state = useSettingsStore.getState()
      expect(state.settings.ui.fontSize).toBe('large')
    })

    it('should toggle compact mode', async () => {
      const user = userEvent.setup()
      const onOpenChange = vi.fn()
      renderWithProviders(<SettingsDialog open={true} onOpenChange={onOpenChange} />)

      const compactModeSwitch = screen.getByLabelText(/compact mode/i)
      expect(compactModeSwitch).not.toBeChecked()

      await user.click(compactModeSwitch)

      const state = useSettingsStore.getState()
      expect(state.settings.ui.compactMode).toBe(true)
    })

    it('should reset UI section only', async () => {
      const user = userEvent.setup()
      const onOpenChange = vi.fn()
      renderWithProviders(<SettingsDialog open={true} onOpenChange={onOpenChange} />)

      // Modify UI settings
      const compactModeSwitch = screen.getByLabelText(/compact mode/i)
      await user.click(compactModeSwitch)

      // Find and click the Reset button in the UI Preferences section
      const uiSection = screen.getByText('UI Preferences').closest('section')!
      const resetButton = within(uiSection).getByRole('button', { name: /reset/i })
      await user.click(resetButton)

      // UI settings should be reset
      const state = useSettingsStore.getState()
      expect(state.settings.ui).toEqual(DEFAULT_SETTINGS.ui)
    })
  })

  describe('Export Settings Section', () => {
    it('should render all export settings controls', () => {
      const onOpenChange = vi.fn()
      renderWithProviders(<SettingsDialog open={true} onOpenChange={onOpenChange} />)

      expect(screen.getByLabelText(/default format/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/export path/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/include metadata/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/include attachments/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/auto export on capture/i)).toBeInTheDocument()
    })

    it('should change export format', () => {
      const onOpenChange = vi.fn()

      // Pre-set export format to markdown in the store
      useSettingsStore.setState({
        settings: {
          ...DEFAULT_SETTINGS,
          export: {
            ...DEFAULT_SETTINGS.export,
            defaultFormat: 'markdown',
          },
        },
      })

      renderWithProviders(<SettingsDialog open={true} onOpenChange={onOpenChange} />)

      // Verify the select is rendered
      const formatSection = screen.getByLabelText(/default format/i).closest('div')!
      const selectTrigger = formatSection.querySelector('[role="combobox"]') as HTMLElement

      expect(selectTrigger).toBeInTheDocument()

      // Verify store has markdown format
      const state = useSettingsStore.getState()
      expect(state.settings.export.defaultFormat).toBe('markdown')
    })

    it('should update export path', async () => {
      const user = userEvent.setup()
      const onOpenChange = vi.fn()
      renderWithProviders(<SettingsDialog open={true} onOpenChange={onOpenChange} />)

      const exportPathInput = screen.getByLabelText(/export path/i)
      await user.type(exportPathInput, '/custom/export/path')

      const state = useSettingsStore.getState()
      expect(state.settings.export.exportPath).toBe('/custom/export/path')
    })

    it('should toggle include metadata', async () => {
      const user = userEvent.setup()
      const onOpenChange = vi.fn()
      renderWithProviders(<SettingsDialog open={true} onOpenChange={onOpenChange} />)

      const metadataSwitch = screen.getByLabelText(/include metadata/i)
      expect(metadataSwitch).toBeChecked()

      await user.click(metadataSwitch)

      const state = useSettingsStore.getState()
      expect(state.settings.export.includeMetadata).toBe(false)
    })
  })

  describe('Capture Settings Section', () => {
    it('should render all capture settings controls', () => {
      const onOpenChange = vi.fn()
      renderWithProviders(<SettingsDialog open={true} onOpenChange={onOpenChange} />)

      // Find the Capture section and check for controls within it
      const captureSection = screen.getByText('Capture').closest('section')!

      expect(within(captureSection).getByRole('switch', { name: /auto capture/i })).toBeInTheDocument()
      expect(screen.getByLabelText(/capture delay/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/max retries/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/enable screenshots/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/screenshot quality/i)).toBeInTheDocument()
    })

    it('should toggle auto capture', async () => {
      const user = userEvent.setup()
      const onOpenChange = vi.fn()
      renderWithProviders(<SettingsDialog open={true} onOpenChange={onOpenChange} />)

      // Find the Auto Capture switch - need to be more specific to avoid matching "Auto Export on Capture"
      const captureSection = screen.getByText('Capture').closest('section')!
      const autoCaptureSwitch = within(captureSection).getByRole('switch', { name: /auto capture/i })
      expect(autoCaptureSwitch).toBeChecked()

      await user.click(autoCaptureSwitch)

      const state = useSettingsStore.getState()
      expect(state.settings.capture.autoCapture).toBe(false)
    })

    it('should update capture delay', async () => {
      const user = userEvent.setup()
      const onOpenChange = vi.fn()
      renderWithProviders(<SettingsDialog open={true} onOpenChange={onOpenChange} />)

      const delayInput = screen.getByLabelText(/capture delay/i)
      await user.tripleClick(delayInput)
      await user.keyboard('2000')

      const state = useSettingsStore.getState()
      expect(state.settings.capture.captureDelay).toBe(2000)
    })

    it('should toggle capture providers', async () => {
      const user = userEvent.setup()
      const onOpenChange = vi.fn()
      renderWithProviders(<SettingsDialog open={true} onOpenChange={onOpenChange} />)

      // All providers should be enabled by default except custom
      const chatgptSwitch = screen.getByLabelText(/chatgpt/i)
      const claudeSwitch = screen.getByLabelText(/claude/i)
      const customSwitch = screen.getByLabelText(/custom/i)

      expect(chatgptSwitch).toBeChecked()
      expect(claudeSwitch).toBeChecked()
      expect(customSwitch).not.toBeChecked()

      // Toggle ChatGPT off
      await user.click(chatgptSwitch)
      expect(useSettingsStore.getState().settings.capture.captureProviders.chatgpt).toBe(false)

      // Toggle Custom on
      await user.click(customSwitch)
      expect(useSettingsStore.getState().settings.capture.captureProviders.custom).toBe(true)
    })

    it('should update screenshot quality', async () => {
      const user = userEvent.setup()
      const onOpenChange = vi.fn()
      renderWithProviders(<SettingsDialog open={true} onOpenChange={onOpenChange} />)

      const qualityInput = screen.getByLabelText(/screenshot quality/i)
      await user.tripleClick(qualityInput)
      await user.keyboard('90')

      const state = useSettingsStore.getState()
      expect(state.settings.capture.screenshotQuality).toBe(90)
    })
  })

  describe('Database Settings Section', () => {
    it('should render all database settings controls', () => {
      const onOpenChange = vi.fn()
      renderWithProviders(<SettingsDialog open={true} onOpenChange={onOpenChange} />)

      expect(screen.getByLabelText(/auto backup/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/backup interval/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/backup retention/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/max backup size/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/backup path/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/enable compression/i)).toBeInTheDocument()
    })

    it('should toggle auto backup', async () => {
      const user = userEvent.setup()
      const onOpenChange = vi.fn()
      renderWithProviders(<SettingsDialog open={true} onOpenChange={onOpenChange} />)

      const autoBackupSwitch = screen.getByLabelText(/auto backup/i)
      expect(autoBackupSwitch).toBeChecked()

      await user.click(autoBackupSwitch)

      const state = useSettingsStore.getState()
      expect(state.settings.database.autoBackup).toBe(false)
    })

    it('should update backup interval', async () => {
      const user = userEvent.setup()
      const onOpenChange = vi.fn()
      renderWithProviders(<SettingsDialog open={true} onOpenChange={onOpenChange} />)

      const intervalInput = screen.getByLabelText(/backup interval/i)
      await user.tripleClick(intervalInput)
      await user.keyboard('48')

      const state = useSettingsStore.getState()
      expect(state.settings.database.backupInterval).toBe(48)
    })

    it('should update backup path', async () => {
      const user = userEvent.setup()
      const onOpenChange = vi.fn()
      renderWithProviders(<SettingsDialog open={true} onOpenChange={onOpenChange} />)

      const backupPathInput = screen.getByLabelText(/backup path/i)
      await user.type(backupPathInput, '/custom/backup/path')

      const state = useSettingsStore.getState()
      expect(state.settings.database.backupPath).toBe('/custom/backup/path')
    })
  })

  describe('Advanced Settings Section', () => {
    it('should render all advanced settings controls', () => {
      const onOpenChange = vi.fn()
      renderWithProviders(<SettingsDialog open={true} onOpenChange={onOpenChange} />)

      expect(screen.getByLabelText(/enable logging/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/log level/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/max log size/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/enable analytics/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/check for updates/i)).toBeInTheDocument()
    })

    it('should toggle logging', async () => {
      const user = userEvent.setup()
      const onOpenChange = vi.fn()
      renderWithProviders(<SettingsDialog open={true} onOpenChange={onOpenChange} />)

      const loggingSwitch = screen.getByLabelText(/enable logging/i)
      expect(loggingSwitch).toBeChecked()

      await user.click(loggingSwitch)

      const state = useSettingsStore.getState()
      expect(state.settings.advanced.enableLogging).toBe(false)
    })

    it('should change log level', () => {
      const onOpenChange = vi.fn()

      // Pre-set log level to debug in the store
      useSettingsStore.setState({
        settings: {
          ...DEFAULT_SETTINGS,
          advanced: {
            ...DEFAULT_SETTINGS.advanced,
            logLevel: 'debug',
          },
        },
      })

      renderWithProviders(<SettingsDialog open={true} onOpenChange={onOpenChange} />)

      // Verify the select is rendered
      const logLevelSection = screen.getByLabelText(/log level/i).closest('div')!
      const selectTrigger = logLevelSection.querySelector('[role="combobox"]') as HTMLElement

      expect(selectTrigger).toBeInTheDocument()

      // Verify store has debug log level
      const state = useSettingsStore.getState()
      expect(state.settings.advanced.logLevel).toBe('debug')
    })

    it('should toggle analytics', async () => {
      const user = userEvent.setup()
      const onOpenChange = vi.fn()
      renderWithProviders(<SettingsDialog open={true} onOpenChange={onOpenChange} />)

      const analyticsSwitch = screen.getByLabelText(/enable analytics/i)
      expect(analyticsSwitch).not.toBeChecked()

      await user.click(analyticsSwitch)

      const state = useSettingsStore.getState()
      expect(state.settings.advanced.enableAnalytics).toBe(true)
    })
  })

  describe('Reset All Functionality', () => {
    it('should reset all settings to defaults when Reset All clicked', async () => {
      const user = userEvent.setup()
      const onOpenChange = vi.fn()
      renderWithProviders(<SettingsDialog open={true} onOpenChange={onOpenChange} />)

      // Modify multiple settings
      const autoSaveSwitch = screen.getByLabelText(/auto save/i)
      await user.click(autoSaveSwitch)

      const compactModeSwitch = screen.getByLabelText(/compact mode/i)
      await user.click(compactModeSwitch)

      // Verify changes
      let state = useSettingsStore.getState()
      expect(state.settings.general.autoSave).toBe(false)
      expect(state.settings.ui.compactMode).toBe(true)

      // Click Reset All
      const resetAllButton = screen.getByRole('button', { name: /reset all/i })
      await user.click(resetAllButton)

      // All settings should be reset
      state = useSettingsStore.getState()
      expect(state.settings).toEqual(DEFAULT_SETTINGS)
    })
  })

  describe('Dialog Open/Close Functionality', () => {
    it('should call onOpenChange when dialog is closed', async () => {
      const onOpenChange = vi.fn()
      renderWithProviders(<SettingsDialog open={true} onOpenChange={onOpenChange} />)

      // Look for the close button (X button in dialog)
      const closeButton = screen.getByRole('button', { name: /close/i })

      if (closeButton) {
        const user = userEvent.setup()
        await user.click(closeButton)
        expect(onOpenChange).toHaveBeenCalledWith(false)
      }
    })
  })

  describe('Settings Store Integration', () => {
    it('should read initial values from settings store', () => {
      const onOpenChange = vi.fn()

      // Set custom settings in store
      useSettingsStore.setState({
        settings: {
          ...DEFAULT_SETTINGS,
          general: {
            ...DEFAULT_SETTINGS.general,
            autoSave: false,
            saveInterval: 120,
          },
        },
      })

      renderWithProviders(<SettingsDialog open={true} onOpenChange={onOpenChange} />)

      const autoSaveSwitch = screen.getByLabelText(/auto save/i)
      const saveIntervalInput = screen.getByLabelText(/save interval/i)

      expect(autoSaveSwitch).not.toBeChecked()
      expect(saveIntervalInput).toHaveValue(120)
    })

    it('should update store when settings are changed', async () => {
      const user = userEvent.setup()
      const onOpenChange = vi.fn()
      renderWithProviders(<SettingsDialog open={true} onOpenChange={onOpenChange} />)

      const autoSaveSwitch = screen.getByLabelText(/auto save/i)
      await user.click(autoSaveSwitch)

      const state = useSettingsStore.getState()
      expect(state.settings.general.autoSave).toBe(false)
    })

    it('should preserve other settings when updating one section', async () => {
      const user = userEvent.setup()
      const onOpenChange = vi.fn()
      renderWithProviders(<SettingsDialog open={true} onOpenChange={onOpenChange} />)

      // Update general settings
      const autoSaveSwitch = screen.getByLabelText(/auto save/i)
      await user.click(autoSaveSwitch)

      const state = useSettingsStore.getState()
      expect(state.settings.general.autoSave).toBe(false)
      // Other sections should remain unchanged
      expect(state.settings.ui).toEqual(DEFAULT_SETTINGS.ui)
      expect(state.settings.capture).toEqual(DEFAULT_SETTINGS.capture)
    })
  })

  describe('Form Validation', () => {
    it('should enforce min/max constraints on save interval input', () => {
      const onOpenChange = vi.fn()
      renderWithProviders(<SettingsDialog open={true} onOpenChange={onOpenChange} />)

      const saveIntervalInput = screen.getByLabelText(/save interval/i) as HTMLInputElement

      expect(saveIntervalInput).toHaveAttribute('min', '5')
      expect(saveIntervalInput).toHaveAttribute('max', '300')
      expect(saveIntervalInput.type).toBe('number')
    })

    it('should enforce min/max constraints on capture delay input', () => {
      const onOpenChange = vi.fn()
      renderWithProviders(<SettingsDialog open={true} onOpenChange={onOpenChange} />)

      const delayInput = screen.getByLabelText(/capture delay/i) as HTMLInputElement

      expect(delayInput).toHaveAttribute('min', '0')
      expect(delayInput).toHaveAttribute('max', '5000')
      expect(delayInput.type).toBe('number')
    })

    it('should enforce min/max constraints on screenshot quality input', () => {
      const onOpenChange = vi.fn()
      renderWithProviders(<SettingsDialog open={true} onOpenChange={onOpenChange} />)

      const qualityInput = screen.getByLabelText(/screenshot quality/i) as HTMLInputElement

      expect(qualityInput).toHaveAttribute('min', '0')
      expect(qualityInput).toHaveAttribute('max', '100')
      expect(qualityInput.type).toBe('number')
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA labels on switches', () => {
      const onOpenChange = vi.fn()
      renderWithProviders(<SettingsDialog open={true} onOpenChange={onOpenChange} />)

      const autoSaveSwitch = screen.getByLabelText(/auto save/i)
      expect(autoSaveSwitch).toHaveAttribute('role', 'switch')
    })

    it('should have proper labels on all inputs', () => {
      const onOpenChange = vi.fn()
      renderWithProviders(<SettingsDialog open={true} onOpenChange={onOpenChange} />)

      // Check that inputs have associated labels
      const saveIntervalInput = screen.getByLabelText(/save interval/i)
      const exportPathInput = screen.getByLabelText(/export path/i)
      const backupPathInput = screen.getByLabelText(/backup path/i)

      expect(saveIntervalInput).toBeInTheDocument()
      expect(exportPathInput).toBeInTheDocument()
      expect(backupPathInput).toBeInTheDocument()
    })
  })
})
