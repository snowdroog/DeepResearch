# Settings System Usage Guide

## Overview

The DeepResearch settings system provides a comprehensive configuration interface with persistent storage using Zustand and localStorage.

## Architecture

### Files Created

1. **`/src/renderer/types/settings.ts`**
   - `AppSettings` interface defining all application settings
   - `DEFAULT_SETTINGS` constant with sensible defaults
   - Organized into 6 sections: General, UI, Export, Capture, Database, Advanced

2. **`/src/renderer/stores/settingsStore.ts`**
   - Zustand store with persist middleware
   - Automatic localStorage synchronization
   - Section-specific update methods
   - Reset functionality for individual sections or all settings

3. **`/src/renderer/components/settings/SettingsDialog.tsx`**
   - Complete settings dialog component
   - Organized sections with individual reset buttons
   - ScrollArea for scrollable content
   - Real-time updates

4. **`/src/renderer/components/ui/`** (New Components Created)
   - `dialog.tsx` - Dialog component for modal interface
   - `label.tsx` - Label component for form fields
   - `switch.tsx` - Toggle switch component
   - `scroll-area.tsx` - Scrollable area component

## Usage Examples

### Basic Integration

```tsx
import { SettingsDialog } from '@/renderer/components/settings'

export function AppHeader() {
  return (
    <header className="flex items-center justify-between p-4">
      <h1>DeepResearch</h1>
      <SettingsDialog />
    </header>
  )
}
```

### Accessing Settings in Components

```tsx
import { useSettingsStore } from '@/renderer/stores/settingsStore'

export function MyComponent() {
  const { settings } = useSettingsStore()

  return (
    <div>
      <p>Current theme: {settings.ui.theme}</p>
      <p>Auto save: {settings.general.autoSave ? 'Enabled' : 'Disabled'}</p>
    </div>
  )
}
```

### Updating Settings Programmatically

```tsx
import { useSettingsStore } from '@/renderer/stores/settingsStore'

export function ThemeToggle() {
  const { settings, updateUISettings } = useSettingsStore()

  const toggleTheme = () => {
    const newTheme = settings.ui.theme === 'dark' ? 'light' : 'dark'
    updateUISettings({ theme: newTheme })
  }

  return (
    <button onClick={toggleTheme}>
      Toggle Theme (Current: {settings.ui.theme})
    </button>
  )
}
```

### Subscribing to Settings Changes

```tsx
import { useEffect } from 'react'
import { useSettingsStore } from '@/renderer/stores/settingsStore'

export function SettingsWatcher() {
  const { settings } = useSettingsStore()

  useEffect(() => {
    console.log('Settings changed:', settings)
    // Apply settings changes
    applyTheme(settings.ui.theme)
    applyFontSize(settings.ui.fontSize)
  }, [settings])

  return null
}
```

### Resetting Settings

```tsx
import { useSettingsStore } from '@/renderer/stores/settingsStore'

export function SettingsReset() {
  const { resetSettings, resetSection } = useSettingsStore()

  return (
    <div>
      <button onClick={() => resetSection('ui')}>
        Reset UI Settings
      </button>
      <button onClick={resetSettings}>
        Reset All Settings
      </button>
    </div>
  )
}
```

## Settings Structure

### General Settings
- `autoSave`: Automatically save changes
- `saveInterval`: Auto-save interval in seconds
- `enableNotifications`: Show system notifications
- `startMinimized`: Start app minimized to tray
- `closeToTray`: Minimize to tray instead of closing

### UI Preferences
- `theme`: 'light' | 'dark' | 'system'
- `fontSize`: 'small' | 'medium' | 'large'
- `sidebarPosition`: 'left' | 'right'
- `compactMode`: Use compact UI layout
- `showTimestamps`: Display timestamps in UI

### Export Settings
- `defaultFormat`: 'json' | 'markdown' | 'csv' | 'html'
- `includeMetadata`: Include metadata in exports
- `includeAttachments`: Include attachments in exports
- `exportPath`: Default export directory
- `autoExportOnCapture`: Auto export after capture

### Capture Settings
- `autoCapture`: Automatically capture responses
- `captureDelay`: Delay before capture (ms)
- `maxRetries`: Maximum retry attempts
- `enableScreenshots`: Capture screenshots
- `screenshotQuality`: Screenshot quality (0-100)
- `captureProviders`: Enable/disable specific providers

### Database Settings
- `autoBackup`: Automatically backup database
- `backupInterval`: Backup interval in hours
- `backupRetention`: Keep backups for N days
- `maxBackupSize`: Maximum backup size in MB
- `backupPath`: Backup directory path
- `enableCompression`: Compress backups

### Advanced Settings
- `enableLogging`: Enable application logging
- `logLevel`: 'error' | 'warn' | 'info' | 'debug'
- `maxLogSize`: Maximum log file size in MB
- `enableAnalytics`: Send anonymous usage data
- `checkForUpdates`: Auto-check for updates

## Persistence

Settings are automatically persisted to localStorage with the key `deep-research-settings`. The store uses Zustand's persist middleware with:

- **Storage Key**: `deep-research-settings`
- **Version**: 1 (for future migrations)
- **Auto-sync**: Changes are immediately saved

## Theme Integration Example

```tsx
import { useEffect } from 'react'
import { useSettingsStore } from '@/renderer/stores/settingsStore'

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { settings } = useSettingsStore()

  useEffect(() => {
    const root = document.documentElement

    if (settings.ui.theme === 'dark') {
      root.classList.add('dark')
    } else if (settings.ui.theme === 'light') {
      root.classList.remove('dark')
    } else {
      // System theme
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      root.classList.toggle('dark', prefersDark)
    }
  }, [settings.ui.theme])

  return <>{children}</>
}
```

## Export Integration Example

```tsx
import { useSettingsStore } from '@/renderer/stores/settingsStore'

export function useExport() {
  const { settings } = useSettingsStore()

  const exportData = async (data: any) => {
    const format = settings.export.defaultFormat
    const includeMetadata = settings.export.includeMetadata
    const path = settings.export.exportPath

    // Use settings to configure export
    await window.electronAPI.export({
      data,
      format,
      includeMetadata,
      path,
    })
  }

  return { exportData }
}
```

## Best Practices

1. **Use Section-Specific Updates**: Prefer `updateUISettings()` over `updateSettings()` for clearer intent
2. **Subscribe Wisely**: Only subscribe to settings in components that need to react to changes
3. **Reset with Care**: Provide confirmation before resetting all settings
4. **Validate Input**: Add validation for numeric inputs (intervals, sizes, etc.)
5. **Path Selection**: Consider adding file picker dialogs for path inputs

## Future Enhancements

- Settings import/export functionality
- Settings validation schema
- Settings migration system
- Cloud sync support
- Settings profiles/presets
- Keyboard shortcuts configuration
