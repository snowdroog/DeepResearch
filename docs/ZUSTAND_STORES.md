# Zustand Stores Documentation

This document describes the Zustand stores implemented for DeepResearch's state management.

## Overview

DeepResearch uses Zustand for type-safe, reactive state management with localStorage persistence where appropriate. All stores are fully typed with TypeScript.

## Store Architecture

### 1. Session Store (`sessionStore.ts`)
**Purpose:** Manages AI provider sessions (Claude, ChatGPT, Gemini, Perplexity, Custom)

**Persistence:** ✅ Yes (localStorage)

**State:**
```typescript
interface SessionState {
  sessions: Session[]
  activeSessionId: string | null
}
```

**Actions:**
- `addSession(provider, url?)` - Create a new provider session
- `removeSession(id)` - Remove a session
- `setActiveSession(id)` - Switch to a different session
- `renameSession(id, name)` - Rename a session
- `updateSessionUrl(id, url)` - Update session URL

**Usage:**
```typescript
import { useSessionStore } from '@/renderer/stores'

function Component() {
  const { sessions, activeSessionId, addSession, setActiveSession } = useSessionStore()

  const handleAddClaude = () => addSession('claude')
  const handleSwitchSession = (id: string) => setActiveSession(id)
}
```

---

### 2. Captures Store (`capturesStore.ts`)
**Purpose:** Manages captured AI responses and research data

**Persistence:** ❌ No (syncs with SQLite database)

**State:**
```typescript
interface CapturesStore {
  captures: Capture[]
  loading: boolean
  error: string | null
  selectedIds: string[]
}
```

**Actions:**
- `fetchCaptures(filters?)` - Load captures from database
- `searchCaptures(query, filters?)` - Full-text search
- `updateTags(captureId, tags)` - Update capture tags
- `updateNotes(captureId, notes)` - Update capture notes
- `setArchived(captureId, isArchived)` - Archive/unarchive capture
- `deleteCapture(captureId)` - Delete a capture
- `setSelectedIds(ids)` - Set selected captures
- `clearSelection()` - Clear selection

**Usage:**
```typescript
import { useCapturesStore } from '@/renderer/stores'

function Component() {
  const { captures, loading, fetchCaptures, searchCaptures } = useCapturesStore()

  useEffect(() => {
    fetchCaptures({ provider: 'claude', isArchived: false })
  }, [])
}
```

---

### 3. Settings Store (`settingsStore.ts`)
**Purpose:** Manages application-wide user preferences and settings

**Persistence:** ✅ Yes (localStorage)

**State:**
```typescript
interface SettingsStore {
  settings: AppSettings // Contains: general, ui, export, capture, database, advanced
}
```

**Settings Sections:**
- **General:** Auto-save, notifications, startup behavior
- **UI:** Theme, font size, sidebar position, compact mode
- **Export:** Default format, metadata inclusion, export path
- **Capture:** Auto-capture settings, provider selection, screenshots
- **Database:** Backup settings, compression, retention
- **Advanced:** Logging, analytics, updates

**Actions:**
- `updateSettings(settings)` - Update entire settings object
- `updateGeneralSettings(settings)` - Update general section
- `updateUISettings(settings)` - Update UI section
- `updateExportSettings(settings)` - Update export section
- `updateCaptureSettings(settings)` - Update capture section
- `updateDatabaseSettings(settings)` - Update database section
- `updateAdvancedSettings(settings)` - Update advanced section
- `resetSettings()` - Reset all settings to defaults
- `resetSection(section)` - Reset specific section

**Usage:**
```typescript
import { useSettingsStore } from '@/renderer/stores'

function SettingsPanel() {
  const { settings, updateUISettings } = useSettingsStore()

  const handleThemeChange = (theme: 'light' | 'dark' | 'system') => {
    updateUISettings({ theme })
  }
}
```

---

### 4. UI Store (`uiStore.ts`)
**Purpose:** Manages runtime UI state (dialogs, panels, layout)

**Persistence:** ✅ Yes (localStorage)

**State:**
```typescript
interface UIStore {
  dialogs: DialogState
  panels: PanelState
  theme: 'light' | 'dark' | 'system'
  layout: {
    compactMode: boolean
    showToolbar: boolean
    sidebarPosition: 'left' | 'right'
  }
}
```

**Actions:**
- `setDialogOpen(dialog, open)` - Show/hide dialogs (settings, export, captureDetail)
- `closeAllDialogs()` - Close all open dialogs
- `setPanelCollapsed(panel, collapsed)` - Collapse/expand panels
- `setPanelSize(panel, size)` - Set panel size
- `resetPanelLayout()` - Reset to default layout
- `setTheme(theme)` - Set UI theme
- `updateLayout(layout)` - Update layout preferences

**Usage:**
```typescript
import { useUIStore } from '@/renderer/stores'

function Layout() {
  const { dialogs, setDialogOpen, panels, setPanelCollapsed } = useUIStore()

  return (
    <>
      <Button onClick={() => setDialogOpen('settings', true)}>Settings</Button>
      <SettingsDialog
        open={dialogs.settings}
        onOpenChange={(open) => setDialogOpen('settings', open)}
      />
    </>
  )
}
```

---

## Centralized Exports

All stores can be imported from a single location:

```typescript
import {
  useSessionStore,
  useCapturesStore,
  useSettingsStore,
  useUIStore
} from '@/renderer/stores'
```

## Best Practices

### 1. Selective Subscriptions
Only subscribe to the state you need to avoid unnecessary re-renders:

```typescript
// ❌ Bad - subscribes to entire store
const store = useSessionStore()

// ✅ Good - only subscribes to sessions
const sessions = useSessionStore(state => state.sessions)
```

### 2. Persist Configuration
Stores with persistence use the following naming convention:
- `deep-research-sessions` - Session store
- `deep-research-settings` - Settings store
- `deep-research-ui` - UI store

### 3. Type Safety
All stores are fully typed. TypeScript will catch errors at compile time:

```typescript
// TypeScript will error if provider is invalid
addSession('invalid-provider') // ❌ Error

// TypeScript autocomplete works
addSession('claude') // ✅ Valid
```

### 4. Error Handling
Captures store includes error state for async operations:

```typescript
const { error, loading } = useCapturesStore()

if (error) return <ErrorMessage>{error}</ErrorMessage>
if (loading) return <Spinner />
```

## Performance Considerations

1. **Persist Middleware:** Automatically saves to localStorage on state changes
2. **No Persist on Captures:** Captures sync with SQLite, no localStorage duplication
3. **Selective Updates:** Use granular update methods (e.g., `updateUISettings` instead of `updateSettings`)
4. **Virtual Scrolling:** Large capture lists use TanStack Virtual for performance

## Migration Notes

When migrating from local component state to Zustand:

1. Replace `useState` hooks with store selectors
2. Replace setter functions with store actions
3. Remove useEffect for persistence (handled by middleware)
4. Update TypeScript types to use store interfaces

## Testing

Stores can be tested by importing and calling actions directly:

```typescript
import { useSessionStore } from '@/renderer/stores/sessionStore'

test('adds session', () => {
  const { addSession, sessions } = useSessionStore.getState()
  addSession('claude')
  expect(sessions).toHaveLength(1)
})
```

## Future Enhancements

Potential improvements for the store architecture:

- [ ] Add middleware for action logging in development
- [ ] Implement undo/redo for certain actions
- [ ] Add optimistic updates for async operations
- [ ] Create computed selectors for derived state
- [ ] Add store devtools integration
