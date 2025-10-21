/**
 * Zustand Stores for DeepResearch
 *
 * This file exports all the application stores for convenient importing.
 * Each store is type-safe and uses persist middleware where appropriate.
 */

// Session management
export { useSessionStore } from './sessionStore'
export type { Session, SessionState, ProviderType } from '../types/session'

// Captures data management
export { useCapturesStore } from './capturesStore'
export type { Capture, CapturesFilters } from './capturesStore'

// Application settings
export { useSettingsStore } from './settingsStore'
export type { AppSettings } from '../types/settings'

// UI state management
export { useUIStore } from './uiStore'
export type { DialogState, PanelState } from './uiStore'
