# DeepResearch Keyboard Shortcuts

Complete reference for all keyboard shortcuts in DeepResearch.

---

## Platform Conventions

- **Mac:** `Cmd` key (⌘)
- **Windows/Linux:** `Ctrl` key

Throughout this document, `Cmd/Ctrl` means:
- Press `Cmd` on macOS
- Press `Ctrl` on Windows/Linux

---

## Global Shortcuts

These shortcuts work anywhere in the application.

### Session Management

| Shortcut | Action | Description |
|----------|--------|-------------|
| `Cmd/Ctrl + T` | New Session | Open provider selection dialog to create a new session |
| `Cmd/Ctrl + W` | Close Session | Close the currently active session (with confirmation) |
| `Cmd/Ctrl + 1-9` | Switch Session | Switch to session by index (1st, 2nd, ... 9th session) |
| `Cmd/Ctrl + Tab` | Next Session | Switch to the next session tab |
| `Cmd/Ctrl + Shift + Tab` | Previous Session | Switch to the previous session tab |

**Examples:**
- `Cmd/Ctrl + 1`: Switch to first session
- `Cmd/Ctrl + 2`: Switch to second session
- `Cmd/Ctrl + 9`: Switch to ninth session

### Application

| Shortcut | Action | Description |
|----------|--------|-------------|
| `Cmd/Ctrl + ,` | Settings | Open application settings dialog |
| `Cmd/Ctrl + Q` | Quit | Quit the application (macOS) |
| `Alt + F4` | Quit | Quit the application (Windows/Linux) |
| `Cmd/Ctrl + R` | Refresh | Refresh the current view/data |
| `Cmd/Ctrl + Shift + R` | Hard Refresh | Force refresh and clear cache |

### Window

| Shortcut | Action | Description |
|----------|--------|-------------|
| `Cmd/Ctrl + M` | Minimize | Minimize the application window |
| `Cmd/Ctrl + Shift + F` | Fullscreen | Toggle fullscreen mode |
| `F11` | Fullscreen | Toggle fullscreen mode (alternative) |

---

## Data Panel Shortcuts

These shortcuts work when the Data Panel is active.

### Search & Filter

| Shortcut | Action | Description |
|----------|--------|-------------|
| `Cmd/Ctrl + F` | Focus Search | Focus the search input field |
| `Cmd/Ctrl + Shift + F` | Advanced Filter | Open advanced filter dialog |
| `Esc` | Clear Search | Clear search query and filters |

### Navigation

| Shortcut | Action | Description |
|----------|--------|-------------|
| `↑` / `↓` | Navigate Rows | Move selection up/down in the table |
| `Page Up` / `Page Down` | Scroll Page | Scroll one page up/down |
| `Home` | First Row | Jump to the first row |
| `End` | Last Row | Jump to the last row |
| `Enter` | Open Details | Open the selected capture's detail dialog |

### Selection

| Shortcut | Action | Description |
|----------|--------|-------------|
| `Cmd/Ctrl + Click` | Add to Selection | Add/remove row from selection |
| `Shift + Click` | Range Selection | Select all rows between clicks |
| `Cmd/Ctrl + A` | Select All | Select all visible rows |
| `Cmd/Ctrl + D` | Deselect All | Clear all selections |

### Actions

| Shortcut | Action | Description |
|----------|--------|-------------|
| `Cmd/Ctrl + E` | Export | Open export dialog for selected/all captures |
| `Cmd/Ctrl + K` | Add Tags | Add tags to selected captures |
| `Delete` / `Backspace` | Delete | Delete selected captures (with confirmation) |
| `Cmd/Ctrl + Shift + A` | Archive | Archive selected captures |
| `Cmd/Ctrl + C` | Copy | Copy selected capture text to clipboard |

---

## Capture Detail Dialog Shortcuts

These shortcuts work when viewing a capture's details.

### Navigation

| Shortcut | Action | Description |
|----------|--------|-------------|
| `Esc` | Close Dialog | Close the capture detail dialog |
| `Cmd/Ctrl + ←` | Previous Capture | Navigate to previous capture |
| `Cmd/Ctrl + →` | Next Capture | Navigate to next capture |

### Actions

| Shortcut | Action | Description |
|----------|--------|-------------|
| `Cmd/Ctrl + C` | Copy Response | Copy the full response text |
| `Cmd/Ctrl + Shift + C` | Copy Prompt | Copy the prompt text |
| `Cmd/Ctrl + K` | Edit Tags | Focus the tags input field |
| `Cmd/Ctrl + N` | Edit Notes | Focus the notes text area |
| `Cmd/Ctrl + E` | Export This | Export this single capture |

---

## Session Tab Shortcuts

These shortcuts work when interacting with session tabs.

### Tab Management

| Shortcut | Action | Description |
|----------|--------|-------------|
| `Double-click` | Rename Session | Enter rename mode for the session tab |
| `Enter` | Save Rename | Save the new session name (while renaming) |
| `Esc` | Cancel Rename | Cancel renaming and revert (while renaming) |
| `Cmd/Ctrl + W` | Close Tab | Close the current session tab |

---

## Dialog & Modal Shortcuts

These shortcuts work in dialogs and modal windows.

### General

| Shortcut | Action | Description |
|----------|--------|-------------|
| `Esc` | Close Dialog | Close the current dialog/modal |
| `Enter` | Confirm | Confirm/submit the dialog action |
| `Tab` | Next Field | Move focus to next input field |
| `Shift + Tab` | Previous Field | Move focus to previous input field |

### Provider Selection Dialog

| Shortcut | Action | Description |
|----------|--------|-------------|
| `1` | Select Claude | Quick select Claude provider |
| `2` | Select ChatGPT | Quick select ChatGPT provider |
| `3` | Select Gemini | Quick select Gemini provider |
| `4` | Select Perplexity | Quick select Perplexity provider |
| `5` | Select Custom | Quick select Custom provider |
| `Enter` | Create Session | Create session with selected provider |

### Export Dialog

| Shortcut | Action | Description |
|----------|--------|-------------|
| `Cmd/Ctrl + J` | Toggle JSON | Select JSON format |
| `Cmd/Ctrl + C` | Toggle CSV | Select CSV format |
| `Cmd/Ctrl + M` | Toggle Markdown | Select Markdown format |
| `Cmd/Ctrl + P` | Toggle Parquet | Select Parquet format |
| `Enter` | Export | Start export with current settings |

---

## Settings Dialog Shortcuts

These shortcuts work in the Settings dialog.

### Navigation

| Shortcut | Action | Description |
|----------|--------|-------------|
| `Cmd/Ctrl + 1` | General Settings | Navigate to General tab |
| `Cmd/Ctrl + 2` | UI Settings | Navigate to UI tab |
| `Cmd/Ctrl + 3` | Capture Settings | Navigate to Capture tab |
| `Cmd/Ctrl + 4` | Export Settings | Navigate to Export tab |
| `Cmd/Ctrl + 5` | Database Settings | Navigate to Database tab |
| `Cmd/Ctrl + 6` | Advanced Settings | Navigate to Advanced tab |

### Actions

| Shortcut | Action | Description |
|----------|--------|-------------|
| `Cmd/Ctrl + S` | Save Settings | Save all settings changes |
| `Cmd/Ctrl + R` | Reset Section | Reset current section to defaults |
| `Cmd/Ctrl + Shift + R` | Reset All | Reset all settings to defaults |
| `Esc` | Cancel | Close settings without saving changes |

---

## Text Editing Shortcuts

Standard text editing shortcuts work in all input fields.

### Editing

| Shortcut | Action | Description |
|----------|--------|-------------|
| `Cmd/Ctrl + C` | Copy | Copy selected text |
| `Cmd/Ctrl + X` | Cut | Cut selected text |
| `Cmd/Ctrl + V` | Paste | Paste from clipboard |
| `Cmd/Ctrl + A` | Select All | Select all text in field |
| `Cmd/Ctrl + Z` | Undo | Undo last change |
| `Cmd/Ctrl + Shift + Z` | Redo | Redo last undone change |

### Navigation

| Shortcut | Action | Description |
|----------|--------|-------------|
| `←` / `→` | Move Cursor | Move cursor left/right |
| `↑` / `↓` | Move Line | Move cursor up/down (multi-line) |
| `Cmd/Ctrl + ←` | Word Left | Jump to previous word |
| `Cmd/Ctrl + →` | Word Right | Jump to next word |
| `Home` | Line Start | Jump to start of line |
| `End` | Line End | Jump to end of line |

---

## Developer Shortcuts

These shortcuts are useful for development and debugging.

### DevTools

| Shortcut | Action | Description |
|----------|--------|-------------|
| `Cmd/Ctrl + Shift + I` | Toggle DevTools | Open/close Chrome DevTools |
| `Cmd/Ctrl + Shift + J` | Console | Open DevTools Console tab |
| `Cmd/Ctrl + Shift + C` | Inspect Element | Activate element inspector |
| `F12` | Toggle DevTools | Alternative DevTools toggle |

### Debugging

| Shortcut | Action | Description |
|----------|--------|-------------|
| `Cmd/Ctrl + Shift + D` | Debug Mode | Enable debug logging |
| `Cmd/Ctrl + Shift + L` | Open Logs | Open log file location |
| `Cmd/Ctrl + Shift + R` | Reload App | Hard reload the application |

---

## Accessibility Shortcuts

These shortcuts enhance accessibility.

### Screen Reader

| Shortcut | Action | Description |
|----------|--------|-------------|
| `Tab` | Next Element | Move to next focusable element |
| `Shift + Tab` | Previous Element | Move to previous focusable element |
| `Space` | Activate | Activate button/checkbox/toggle |
| `Enter` | Submit | Submit form or open item |

### Zoom

| Shortcut | Action | Description |
|----------|--------|-------------|
| `Cmd/Ctrl + +` | Zoom In | Increase UI zoom level |
| `Cmd/Ctrl + -` | Zoom Out | Decrease UI zoom level |
| `Cmd/Ctrl + 0` | Reset Zoom | Reset zoom to 100% |

---

## Custom Shortcuts (Future Feature)

In future versions, you'll be able to customize shortcuts:

1. Open Settings
2. Navigate to "Keyboard Shortcuts"
3. Click on any shortcut to rebind
4. Press desired key combination
5. Save changes

---

## Shortcut Conflicts

### System Conflicts

Some shortcuts may conflict with system shortcuts:

**macOS:**
- `Cmd + H`: Hide application (system)
- `Cmd + M`: Minimize window (system)
- `Cmd + Q`: Quit application (system)

**Windows:**
- `Ctrl + Alt + Delete`: Task manager (system)
- `Windows + D`: Show desktop (system)
- `Alt + F4`: Close window (system)

**Linux:**
- Varies by desktop environment
- Check your DE's shortcut settings

### Browser Conflicts

In embedded browser sessions, some shortcuts may be handled by the web page:

- Use `Cmd/Ctrl + Shift` variants for global actions
- Browser-specific shortcuts work in provider sessions

---

## Tips for Power Users

### Workflow Optimization

1. **Muscle Memory**
   - Learn 5-10 most-used shortcuts
   - Practice daily until automatic
   - Focus on session and search shortcuts

2. **Shortcut Chaining**
   - `Cmd/Ctrl + T` → `2` → `Enter`: New ChatGPT session
   - `Cmd/Ctrl + F` → Search → `Enter`: Quick search
   - `Cmd/Ctrl + E` → `Enter`: Quick export

3. **Context Awareness**
   - Different shortcuts in different panels
   - Dialog shortcuts vs. main window
   - Learn modal-specific shortcuts

### Cheat Sheet

Print this minimal cheat sheet for your desk:

```
Essential DeepResearch Shortcuts
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Sessions:
  Cmd/Ctrl + T     New session
  Cmd/Ctrl + W     Close session
  Cmd/Ctrl + 1-9   Switch session

Search:
  Cmd/Ctrl + F     Search
  Esc              Clear search

Actions:
  Cmd/Ctrl + E     Export
  Cmd/Ctrl + ,     Settings
  Cmd/Ctrl + R     Refresh

Navigation:
  ↑↓               Move selection
  Enter            Open details
  Esc              Close dialog
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## Shortcut Reference Card

Quick lookup by category:

| Category | Key Shortcuts |
|----------|---------------|
| **Session** | `Cmd/Ctrl + T`, `Cmd/Ctrl + W`, `Cmd/Ctrl + 1-9` |
| **Search** | `Cmd/Ctrl + F`, `Esc` |
| **Export** | `Cmd/Ctrl + E` |
| **Settings** | `Cmd/Ctrl + ,` |
| **Navigation** | `↑↓`, `Page Up/Down`, `Home/End` |
| **Selection** | `Cmd/Ctrl + A`, `Shift + Click` |
| **Dialog** | `Enter`, `Esc`, `Tab` |
| **Dev** | `Cmd/Ctrl + Shift + I` |

---

## Feedback

Missing a shortcut you'd like to see? [Request it here](https://github.com/yourusername/DeepResearch/issues)

---

**Related Documentation:**
- [Usage Guide](./USAGE_GUIDE.md)
- [Quick Start](./QUICK_START.md)
- [Settings Reference](./SETTINGS_QUICK_REFERENCE.md)
