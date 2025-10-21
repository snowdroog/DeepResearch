# Settings System Quick Reference

## Import and Use

```tsx
// Import the dialog component
import { SettingsDialog } from '@/renderer/components/settings'

// Import the store
import { useSettingsStore } from '@/renderer/stores/settingsStore'

// Import types (if needed)
import type { AppSettings } from '@/renderer/types/settings'
```

## Basic Usage

### 1. Add Settings Button to Your UI

```tsx
import { SettingsDialog } from '@/renderer/components/settings'

export function Toolbar() {
  return (
    <div className="toolbar">
      <SettingsDialog />
    </div>
  )
}
```

### 2. Access Settings

```tsx
import { useSettingsStore } from '@/renderer/stores/settingsStore'

export function MyComponent() {
  const { settings } = useSettingsStore()

  // Access any setting
  const theme = settings.ui.theme
  const autoSave = settings.general.autoSave

  return <div>Theme: {theme}</div>
}
```

### 3. Update Settings

```tsx
import { useSettingsStore } from '@/renderer/stores/settingsStore'

export function ThemeToggle() {
  const { settings, updateUISettings } = useSettingsStore()

  const toggleTheme = () => {
    updateUISettings({
      theme: settings.ui.theme === 'dark' ? 'light' : 'dark'
    })
  }

  return <button onClick={toggleTheme}>Toggle Theme</button>
}
```

## Available Update Methods

```tsx
const {
  updateSettings,          // Update any setting(s)
  updateGeneralSettings,   // Update general section
  updateUISettings,        // Update UI section
  updateExportSettings,    // Update export section
  updateCaptureSettings,   // Update capture section
  updateDatabaseSettings,  // Update database section
  updateAdvancedSettings,  // Update advanced section
  resetSettings,           // Reset all settings
  resetSection,            // Reset one section
} = useSettingsStore()
```

## Common Patterns

### React to Settings Changes

```tsx
import { useEffect } from 'react'
import { useSettingsStore } from '@/renderer/stores/settingsStore'

export function ThemeApplier() {
  const { settings } = useSettingsStore()

  useEffect(() => {
    // Apply theme
    document.documentElement.classList.toggle(
      'dark',
      settings.ui.theme === 'dark'
    )
  }, [settings.ui.theme])

  return null
}
```

### Multiple Settings Update

```tsx
const handleBulkUpdate = () => {
  updateSettings({
    general: { autoSave: true, saveInterval: 60 },
    ui: { theme: 'dark', fontSize: 'large' }
  })
}
```

### Conditional Rendering

```tsx
const { settings } = useSettingsStore()

return (
  <>
    {settings.ui.showTimestamps && <Timestamp />}
    {settings.general.enableNotifications && <NotificationBadge />}
  </>
)
```

## Settings Reference

### General
- `settings.general.autoSave` - boolean
- `settings.general.saveInterval` - number (seconds)
- `settings.general.enableNotifications` - boolean
- `settings.general.startMinimized` - boolean
- `settings.general.closeToTray` - boolean

### UI
- `settings.ui.theme` - 'light' | 'dark' | 'system'
- `settings.ui.fontSize` - 'small' | 'medium' | 'large'
- `settings.ui.sidebarPosition` - 'left' | 'right'
- `settings.ui.compactMode` - boolean
- `settings.ui.showTimestamps` - boolean

### Export
- `settings.export.defaultFormat` - 'json' | 'markdown' | 'csv' | 'html'
- `settings.export.includeMetadata` - boolean
- `settings.export.includeAttachments` - boolean
- `settings.export.exportPath` - string
- `settings.export.autoExportOnCapture` - boolean

### Capture
- `settings.capture.autoCapture` - boolean
- `settings.capture.captureDelay` - number (ms)
- `settings.capture.maxRetries` - number
- `settings.capture.enableScreenshots` - boolean
- `settings.capture.screenshotQuality` - number (0-100)
- `settings.capture.captureProviders.chatgpt` - boolean
- `settings.capture.captureProviders.claude` - boolean
- `settings.capture.captureProviders.gemini` - boolean
- `settings.capture.captureProviders.perplexity` - boolean
- `settings.capture.captureProviders.custom` - boolean

### Database
- `settings.database.autoBackup` - boolean
- `settings.database.backupInterval` - number (hours)
- `settings.database.backupRetention` - number (days)
- `settings.database.maxBackupSize` - number (MB)
- `settings.database.backupPath` - string
- `settings.database.enableCompression` - boolean

### Advanced
- `settings.advanced.enableLogging` - boolean
- `settings.advanced.logLevel` - 'error' | 'warn' | 'info' | 'debug'
- `settings.advanced.maxLogSize` - number (MB)
- `settings.advanced.enableAnalytics` - boolean
- `settings.advanced.checkForUpdates` - boolean

## File Locations

```
src/renderer/
├── types/settings.ts              # TypeScript types
├── stores/settingsStore.ts        # Zustand store
└── components/settings/
    ├── SettingsDialog.tsx         # Main UI component
    └── index.ts                   # Exports
```

## localStorage Key

Settings are stored in: `deep-research-settings`

## Reset Functions

```tsx
// Reset entire settings
resetSettings()

// Reset specific section
resetSection('general')
resetSection('ui')
resetSection('export')
resetSection('capture')
resetSection('database')
resetSection('advanced')
```
