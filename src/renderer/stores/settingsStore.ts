import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { AppSettings, DEFAULT_SETTINGS } from '@/renderer/types/settings'

interface SettingsStore {
  settings: AppSettings
  updateSettings: (settings: Partial<AppSettings>) => void
  updateGeneralSettings: (settings: Partial<AppSettings['general']>) => void
  updateUISettings: (settings: Partial<AppSettings['ui']>) => void
  updateExportSettings: (settings: Partial<AppSettings['export']>) => void
  updateCaptureSettings: (settings: Partial<AppSettings['capture']>) => void
  updateDatabaseSettings: (settings: Partial<AppSettings['database']>) => void
  updateAdvancedSettings: (settings: Partial<AppSettings['advanced']>) => void
  resetSettings: () => void
  resetSection: (section: keyof AppSettings) => void
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      settings: DEFAULT_SETTINGS,

      updateSettings: (newSettings) =>
        set((state) => ({
          settings: {
            ...state.settings,
            ...newSettings,
          },
        })),

      updateGeneralSettings: (newSettings) =>
        set((state) => ({
          settings: {
            ...state.settings,
            general: {
              ...state.settings.general,
              ...newSettings,
            },
          },
        })),

      updateUISettings: (newSettings) =>
        set((state) => ({
          settings: {
            ...state.settings,
            ui: {
              ...state.settings.ui,
              ...newSettings,
            },
          },
        })),

      updateExportSettings: (newSettings) =>
        set((state) => ({
          settings: {
            ...state.settings,
            export: {
              ...state.settings.export,
              ...newSettings,
            },
          },
        })),

      updateCaptureSettings: (newSettings) =>
        set((state) => ({
          settings: {
            ...state.settings,
            capture: {
              ...state.settings.capture,
              ...newSettings,
            },
          },
        })),

      updateDatabaseSettings: (newSettings) =>
        set((state) => ({
          settings: {
            ...state.settings,
            database: {
              ...state.settings.database,
              ...newSettings,
            },
          },
        })),

      updateAdvancedSettings: (newSettings) =>
        set((state) => ({
          settings: {
            ...state.settings,
            advanced: {
              ...state.settings.advanced,
              ...newSettings,
            },
          },
        })),

      resetSettings: () =>
        set({
          settings: DEFAULT_SETTINGS,
        }),

      resetSection: (section) =>
        set((state) => ({
          settings: {
            ...state.settings,
            [section]: DEFAULT_SETTINGS[section],
          },
        })),
    }),
    {
      name: 'deep-research-settings',
      version: 1,
    }
  )
)
