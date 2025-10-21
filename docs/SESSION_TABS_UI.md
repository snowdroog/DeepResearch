# Session Tabs UI Component

This document describes the enhanced SessionTabs UI component for managing multiple AI provider sessions in DeepResearch.

## Overview

The SessionTabs component provides a browser-like tab interface for managing multiple AI provider sessions simultaneously. Users can open multiple sessions from different providers (Claude, ChatGPT, Gemini, Perplexity) and switch between them seamlessly.

## Components

### 1. SessionTabs (`SessionTabs.tsx`)
Main container component that manages the tab interface.

**Features:**
- ✅ Multiple session management with color-coded provider indicators
- ✅ Active session highlighting
- ✅ Keyboard shortcuts for power users
- ✅ Inline session renaming (double-click tab)
- ✅ Provider selection dialog
- ✅ Close confirmation dialog
- ✅ Persistent state via Zustand store
- ✅ Responsive layout with scrollable tabs

### 2. ProviderSelectionDialog (`ProviderSelectionDialog.tsx`)
Modal dialog for selecting an AI provider when creating a new session.

**Providers:**
- Claude (blue indicator)
- ChatGPT (green indicator)
- Gemini (purple indicator)
- Perplexity (cyan indicator)
- Custom URL (gray indicator)

**Features:**
- Visual provider cards with color-coded indicators
- Custom URL input for unsupported providers
- Validation for custom URLs
- Accessible keyboard navigation

### 3. CloseSessionDialog (`CloseSessionDialog.tsx`)
Alert dialog for confirming session closure.

**Features:**
- Prevents accidental session closure
- Clarifies that captured data will be preserved
- Standard alert dialog pattern

### 4. SessionTab (Internal Component)
Individual tab component for each session.

**Features:**
- Provider indicator (colored dot)
- Session name display
- Inline editing (double-click to rename)
- Close button (appears on hover)
- Active state styling

## User Interactions

### Creating a New Session

**Method 1: Click Button**
1. Click the "+" button in the tab bar
2. Select provider from dialog
3. For custom provider, enter URL
4. Click "Create Session"

**Method 2: Keyboard Shortcut**
1. Press `Cmd/Ctrl + T`
2. Select provider from dialog
3. Session is created and activated

### Switching Sessions

**Method 1: Click Tab**
- Click on any tab to switch to that session

**Method 2: Keyboard Shortcuts**
- `Cmd/Ctrl + 1-9` - Switch to session by index (1st session, 2nd session, etc.)

### Renaming Sessions

1. Double-click on the session name in the tab
2. Edit the name inline
3. Press `Enter` to save or `Esc` to cancel

### Closing Sessions

**Method 1: Click Close Button**
1. Hover over tab to reveal close button (X)
2. Click close button
3. Confirm in dialog

**Method 2: Keyboard Shortcut**
1. Make session active
2. Press `Cmd/Ctrl + W`
3. Confirm in dialog

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Cmd/Ctrl + T` | Create new session |
| `Cmd/Ctrl + W` | Close active session |
| `Cmd/Ctrl + 1-9` | Switch to session by index |
| `Double-click` tab | Rename session |
| `Enter` (while renaming) | Save new name |
| `Esc` (while renaming) | Cancel rename |

## State Management

The SessionTabs component integrates with the `sessionStore` Zustand store:

```typescript
const {
  sessions,           // Array of all sessions
  activeSessionId,    // Currently active session ID
  addSession,         // Create new session
  removeSession,      // Delete session
  setActiveSession,   // Switch active session
  renameSession,      // Update session name
} = useSessionStore()
```

All session state is persisted to localStorage automatically via the persist middleware.

## Provider Configuration

### Provider Colors
```typescript
const PROVIDER_COLORS = {
  claude: 'bg-blue-500',      // Blue
  chatgpt: 'bg-green-500',    // Green
  gemini: 'bg-purple-500',    // Purple
  perplexity: 'bg-cyan-500',  // Cyan
  custom: 'bg-gray-500',      // Gray
}
```

### Default URLs
```typescript
const DEFAULT_URLS = {
  claude: 'https://claude.ai',
  chatgpt: 'https://chat.openai.com',
  gemini: 'https://gemini.google.com',
  perplexity: 'https://www.perplexity.ai',
  custom: '', // User-provided
}
```

## Component Structure

```
SessionTabs/
├── SessionTabs.tsx              # Main container
├── ProviderSelectionDialog.tsx  # Provider picker
└── CloseSessionDialog.tsx       # Close confirmation
```

## Usage Example

```typescript
import { SessionTabs } from '@/renderer/components/session/SessionTabs'

export function ProviderTabsPanel() {
  return (
    <main className="flex h-full flex-col overflow-hidden">
      <SessionTabs />
    </main>
  )
}
```

## Accessibility

### ARIA Labels
- Tab triggers have descriptive labels
- Dialogs have proper titles and descriptions
- Focus management in modals

### Keyboard Navigation
- All interactive elements are keyboard accessible
- Logical tab order
- Escape key closes dialogs
- Enter key confirms actions

### Visual Indicators
- Color-coded provider dots (with text labels for accessibility)
- Active tab highlighting
- Hover states for interactive elements
- Focus rings for keyboard navigation

## Future Enhancements

Potential improvements for the session tabs:

- [ ] Drag-and-drop tab reordering
- [ ] Tab groups/workspaces
- [ ] Session templates
- [ ] Quick session duplication
- [ ] Session history/recently closed
- [ ] Pin important sessions
- [ ] Session search/filter
- [ ] Tab overflow menu for many sessions
- [ ] Custom tab colors/icons
- [ ] Session notes/descriptions

## Integration with BrowserView

The SessionTabs component prepares the UI for BrowserView integration:

```typescript
<Tabs.Content value={session.id} className="flex-1 overflow-auto">
  {/* BrowserView will be embedded here */}
  <div id={`browser-view-${session.id}`}>
    {/* Placeholder content shown while BrowserView loads */}
  </div>
</Tabs.Content>
```

When BrowserView integration is implemented, each tab content area will host an Electron BrowserView for the respective provider.

## Performance Considerations

1. **Lazy Tab Content**: Only active tab content is rendered in the DOM
2. **Efficient Re-renders**: Zustand ensures minimal re-renders
3. **Event Delegation**: Keyboard shortcuts use single global listener
4. **Optimized State Updates**: Direct state mutations via Zustand actions

## Testing Checklist

- [ ] Create session for each provider type
- [ ] Create custom session with valid URL
- [ ] Switch between sessions using tabs
- [ ] Switch between sessions using Cmd/Ctrl+1-9
- [ ] Rename session via double-click
- [ ] Close session with confirmation
- [ ] Keyboard shortcut Cmd/Ctrl+T creates session
- [ ] Keyboard shortcut Cmd/Ctrl+W closes active session
- [ ] Session state persists after app restart
- [ ] Dialogs close on Escape key
- [ ] Focus returns correctly after dialog close
- [ ] All interactive elements accessible via keyboard
- [ ] Provider colors display correctly
- [ ] Hover states work properly
- [ ] Can't create session without selecting provider
- [ ] Can't create custom session without URL
