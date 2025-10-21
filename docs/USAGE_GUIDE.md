# DeepResearch Usage Guide

Complete guide to using all features of DeepResearch.

---

## Table of Contents

- [Session Management](#session-management)
- [Data Capture](#data-capture)
- [Browsing & Viewing Data](#browsing--viewing-data)
- [Search & Filtering](#search--filtering)
- [Organizing Data](#organizing-data)
- [Exporting Data](#exporting-data)
- [Settings & Customization](#settings--customization)
- [Keyboard Shortcuts](#keyboard-shortcuts)
- [Best Practices](#best-practices)

---

## Session Management

Sessions are isolated browser environments for each AI provider. Each session maintains separate cookies, storage, and browsing history.

### Creating Sessions

#### Method 1: Button Click
1. Click the **"+"** button in the tab bar
2. Select provider from the dialog
3. For custom providers, enter the URL
4. Click **"Create Session"**

#### Method 2: Keyboard Shortcut
- Press `Cmd/Ctrl + T`
- Select provider
- Press Enter

### Session Types

#### Supported Providers

**Claude (Blue)**
- URL: https://claude.ai
- Provider ID: `claude`
- Models: Claude 3.5 Sonnet, Claude 3 Opus, Claude 3 Haiku

**ChatGPT (Green)**
- URL: https://chat.openai.com
- Provider ID: `chatgpt`
- Models: GPT-4, GPT-4 Turbo, GPT-3.5

**Gemini (Purple)**
- URL: https://gemini.google.com
- Provider ID: `gemini`
- Models: Gemini Pro, Gemini Ultra

**Perplexity (Cyan)**
- URL: https://www.perplexity.ai
- Provider ID: `perplexity`
- Models: Various (depends on subscription)

**Custom (Gray)**
- URL: User-provided
- Provider ID: `custom`
- Use for: Any AI chat interface

### Managing Sessions

#### Switching Between Sessions

**Click Method:**
- Click on any tab to activate that session

**Keyboard Method:**
- `Cmd/Ctrl + 1`: Switch to 1st session
- `Cmd/Ctrl + 2`: Switch to 2nd session
- ... up to `Cmd/Ctrl + 9` for 9th session

#### Renaming Sessions

1. Double-click the session name in the tab
2. Type new name
3. Press `Enter` to save or `Esc` to cancel

**Use Cases for Renaming:**
- "Research Project A"
- "Code Help"
- "Creative Writing"
- "Work vs Personal"

#### Closing Sessions

**Button Method:**
1. Hover over the tab
2. Click the "X" close button
3. Confirm in dialog

**Keyboard Method:**
1. Make session active
2. Press `Cmd/Ctrl + W`
3. Confirm in dialog

> **Note:** Closing a session does NOT delete captured data. All previous captures remain in the database.

### Session Isolation

Each session has:
- **Separate cookies** - Login state is isolated
- **Separate local storage** - Settings don't interfere
- **Separate session storage** - Temporary data is isolated
- **Separate browser history** - Navigation is independent

**Benefit:** You can have multiple accounts for the same provider (e.g., work and personal ChatGPT sessions).

---

## Data Capture

DeepResearch automatically captures AI responses using Chrome DevTools Protocol (CDP).

### How Capture Works

1. **You send a prompt** to the AI provider
2. **AI responds** (streaming or complete)
3. **DeepResearch intercepts** the response before it reaches the browser
4. **Response is saved** to SQLite database with metadata

### What Gets Captured

For each interaction:
- **Prompt** - Your input/question
- **Response** - AI's complete response
- **Provider** - Which AI service (Claude, ChatGPT, etc.)
- **Model** - Specific model used (GPT-4, Claude 3.5, etc.)
- **Timestamp** - When the interaction occurred
- **Session ID** - Which session it came from
- **Format** - Text, markdown, code, JSON

### Capture Methods

#### Automatic Capture (Default)

Enabled by default. Captures happen automatically without user action.

**Pros:**
- Effortless - just use AI normally
- Never miss a response
- Complete history

**Cons:**
- May capture unwanted interactions
- Requires storage space

#### Manual Capture (Future Feature)

Click a "Capture This" button to save specific interactions.

**Pros:**
- Control what gets saved
- Saves storage space
- Privacy control

**Cons:**
- Easy to forget
- Manual effort required

### Viewing Capture Progress

When a response is being captured:
1. Look for visual indicator (future feature)
2. Check Data Panel for new rows
3. Toast notification (if enabled in settings)

---

## Browsing & Viewing Data

### Data Panel Overview

The Data Panel shows all captured interactions in a sortable, filterable table.

#### Table Columns

| Column | Description | Actions |
|--------|-------------|---------|
| **Provider** | AI service badge | Click to filter by provider |
| **Prompt** | Your input (truncated) | Click row to view full text |
| **Response** | AI output (truncated) | Click row to view full text |
| **Model** | Specific AI model | Hover for full model name |
| **Timestamp** | When captured | Click header to sort |
| **Tags** | Custom tags | Click to filter by tag |

### Table Interactions

#### Sorting

Click any column header to sort:
- First click: Sort ascending
- Second click: Sort descending
- Third click: Remove sort

**Common Sorts:**
- Sort by timestamp (newest first)
- Sort by provider (group by AI service)
- Sort by model (compare models)

#### Row Selection

**Single Selection:**
- Click anywhere on a row to select

**Multiple Selection:**
- `Cmd/Ctrl + Click` to add to selection
- `Shift + Click` to select range

**Bulk Actions on Selected Rows:**
- Add tags to all
- Export selected
- Archive selected
- Delete selected

### Viewing Capture Details

Click any row to open the detail dialog:

**Full Prompt Section:**
- Complete prompt text
- Copy button
- Timestamp

**Full Response Section:**
- Complete response text
- Formatted rendering (markdown, code)
- Copy button
- Word/character count

**Metadata Section:**
- Provider and model
- Capture time
- Session name
- Format type

**Organization Section:**
- Tags (add/remove)
- Notes (add/edit)
- Archive toggle

### Virtual Scrolling

For large datasets (1000+ captures), the table uses virtual scrolling:
- Only visible rows are rendered
- Smooth scrolling performance
- Memory efficient
- No pagination needed

---

## Search & Filtering

DeepResearch provides powerful search capabilities using SQLite FTS5 (Full-Text Search).

### Basic Search

#### Using the Search Bar

1. Click the search input (or press `Cmd/Ctrl + F`)
2. Type your query
3. Results filter in real-time

**Search Coverage:**
- Prompts
- Responses
- Tags
- Notes

#### Search Examples

```
Simple keyword:
"python"

Multiple keywords (AND):
"python flask"

Phrase search:
"machine learning"

Tag search:
tag:research

Exclude terms:
python -django
```

### Advanced Filtering

Click the **Filter** button to open advanced filters:

#### Provider Filter

Select one or more providers:
- Claude
- ChatGPT
- Gemini
- Perplexity
- Custom

**Use Case:** Compare responses from different AIs on the same topic.

#### Date Range Filter

Set start and end dates:
- Last 24 hours
- Last 7 days
- Last 30 days
- Custom range

**Use Case:** Review recent work or find old captures.

#### Tag Filter

Select one or more tags:
- AND mode: Captures must have ALL selected tags
- OR mode: Captures must have ANY selected tag

**Use Case:** Find captures related to specific projects or topics.

#### Model Filter

Filter by specific AI model:
- GPT-4
- GPT-4 Turbo
- Claude 3.5 Sonnet
- Claude 3 Opus
- Gemini Pro

**Use Case:** Compare model performance or preferences.

### Combining Filters

All filters work together:
1. Set provider filter: "Claude"
2. Set date range: "Last 7 days"
3. Add search query: "code review"
4. Result: All Claude captures from the past week about code review

### Saving Filter Presets (Future Feature)

Save commonly used filter combinations:
- "Work Research"
- "Personal Projects"
- "Code Help"
- "Creative Writing"

One click to apply all saved filters.

---

## Organizing Data

Keep your captures organized with tags, notes, and archiving.

### Tags

Tags are labels you add to captures for easy categorization.

#### Adding Tags

**Single Capture:**
1. Open capture detail dialog
2. Click "Add Tag" button
3. Enter tag names (comma-separated)
4. Press Enter

**Multiple Captures:**
1. Select multiple rows
2. Click "Bulk Add Tags"
3. Enter tag names
4. All selected captures get the tags

#### Tag Suggestions

As you type, DeepResearch suggests existing tags:
- Autocomplete from your tag library
- Prevents duplicate tags with different spelling
- Faster tagging workflow

#### Tag Management

**Common Tag Patterns:**
- **Projects:** "project-a", "client-x"
- **Topics:** "python", "marketing", "design"
- **Status:** "todo", "done", "archive"
- **Type:** "code", "writing", "research"
- **Priority:** "important", "urgent", "low-priority"

**Best Practices:**
- Use lowercase for consistency
- Use hyphens for multi-word tags
- Create tag naming conventions
- Don't over-tag (3-5 tags per capture is ideal)

### Notes

Notes are personal annotations you add to captures.

#### Adding Notes

1. Open capture detail dialog
2. Find the "Notes" section
3. Type your notes in the text area
4. Notes save automatically

**Use Cases:**
- Context: "This was for the Q3 marketing campaign"
- Follow-up: "Need to test this approach"
- Cross-reference: "Related to capture #123"
- Reflection: "Better than GPT-4's response"

### Archiving

Archive old or irrelevant captures without deleting them.

#### Why Archive?

- **Declutter** - Hide captures you don't need frequently
- **Preserve** - Keep data without deleting permanently
- **Focus** - Work with active captures only

#### How to Archive

**Single Capture:**
1. Open capture detail dialog
2. Click "Archive" button

**Multiple Captures:**
1. Select rows
2. Click "Archive Selected"

#### Viewing Archived Captures

1. Open filters
2. Toggle "Show Archived"
3. Archived captures appear (grayed out or labeled)

#### Unarchiving

1. View archived captures
2. Select captures to restore
3. Click "Unarchive"

---

## Exporting Data

Export your captures in various formats for external use.

### Export Dialog

Access via:
- Export button in toolbar
- Keyboard shortcut: `Cmd/Ctrl + E`
- Menu: File → Export

### Export Formats

#### JSON

**Best for:**
- Programmatic access
- Data migration
- Backup
- Further processing

**Features:**
- Full metadata preservation
- Nested structure
- Easy to parse
- Human-readable

**Sample:**
```json
[
  {
    "id": "abc123",
    "provider": "claude",
    "prompt": "Explain recursion",
    "response": "Recursion is when a function calls itself...",
    "model": "claude-3-5-sonnet-20241022",
    "timestamp": 1698765432000,
    "tags": ["programming", "cs101"],
    "notes": "Great explanation"
  }
]
```

#### CSV

**Best for:**
- Excel/Google Sheets
- Data analysis
- Simple reporting
- Sharing with non-technical users

**Features:**
- Flat structure
- Universal compatibility
- Easy to open
- Good for tabular data

**Sample:**
```csv
id,provider,prompt,response,model,timestamp,tags,notes
abc123,claude,"Explain recursion","Recursion is when...","claude-3-5-sonnet",1698765432000,"programming,cs101","Great explanation"
```

#### Markdown

**Best for:**
- Documentation
- Note-taking apps (Obsidian, Notion)
- Blog posts
- Human reading

**Features:**
- Formatted text
- Readable structure
- Easy to edit
- Good for reports

**Sample:**
```markdown
# Capture: Explain recursion

**Provider:** Claude (claude-3-5-sonnet)
**Timestamp:** 2025-10-20 14:30:32
**Tags:** programming, cs101

## Prompt
Explain recursion

## Response
Recursion is when a function calls itself...

## Notes
Great explanation
```

#### Parquet

**Best for:**
- Data science workflows
- Large datasets
- Columnar analysis
- Python/R/Spark

**Features:**
- Columnar storage
- Compression
- Fast queries
- Type preservation

### Export Options

#### Scope

**All Captures:**
- Exports entire database
- Good for backups

**Filtered Captures:**
- Exports only visible/filtered captures
- Good for specific projects

**Selected Captures:**
- Exports only selected rows
- Good for sharing specific examples

#### Metadata

**Include Metadata:**
- Full capture with all fields
- Tags, notes, timestamps
- Larger file size

**Exclude Metadata:**
- Only prompt and response
- Smaller file size
- Cleaner output

#### File Naming

Options:
- **Auto:** `deepresearch-export-{timestamp}.{format}`
- **Custom:** User specifies name
- **Template:** `{provider}-{date}-export.{format}`

### Automating Exports (Future Feature)

Schedule automatic exports:
- Daily backups to Dropbox
- Weekly reports to Google Drive
- Monthly archives to local disk

---

## Settings & Customization

Access settings: `Cmd/Ctrl + ,` or click Settings icon.

### General Settings

**Auto-save**
- Enable/disable automatic capture
- Default: Enabled

**Notifications**
- Toast notifications for new captures
- Default: Enabled

**Startup Behavior**
- Open last session on launch
- Start with new session
- Start with home screen
- Default: Last session

**Updates (Future)**
- Check for updates on startup
- Auto-download updates
- Notify before installing

### UI Settings

**Theme**
- Light
- Dark
- System (follows OS)
- Default: System

**Font Size**
- Small (12px)
- Medium (14px)
- Large (16px)
- Extra Large (18px)
- Default: Medium

**Compact Mode**
- Denser table rows
- More data on screen
- Less whitespace
- Default: Off

**Sidebar Position**
- Left
- Right
- Default: Left

**Panel Layout**
- Save panel sizes
- Restore on launch
- Reset to defaults

### Capture Settings

**Auto-capture**
- Enable for all providers
- Enable per-provider
- Disable (manual only)
- Default: Enabled for all

**Capture Screenshots (Future)**
- Include visual context
- Before/after response
- Storage impact

**Throttling**
- Rate limit captures
- Avoid duplicate rapid captures
- Default: 1 second cooldown

### Export Settings

**Default Format**
- JSON
- CSV
- Markdown
- Parquet
- Default: JSON

**Export Path**
- Default export directory
- Ask every time
- Last used location
- Default: Ask every time

**Include Metadata**
- Always include
- Always exclude
- Ask every time
- Default: Always include

**File Naming**
- Auto timestamp
- Custom template
- Ask every time
- Default: Auto timestamp

### Database Settings

**Backup Frequency**
- Never
- Daily
- Weekly
- Monthly
- Default: Weekly

**Backup Location**
- Same as database
- Custom directory
- Cloud storage (future)
- Default: Same as database

**Compression**
- Enable database compression
- Trade: CPU for storage
- Default: Disabled

**Retention Policy (Future)**
- Auto-archive after X days
- Auto-delete archived after X days
- Keep forever
- Default: Keep forever

### Advanced Settings

**Logging**
- Enable debug logs
- Log file location
- Log level (error, warn, info, debug)
- Default: Error only

**Analytics**
- Anonymous usage stats
- Crash reporting
- Feature usage
- Default: Disabled

**Developer Mode**
- Show DevTools on startup
- Enable experimental features
- Verbose logging
- Default: Disabled

---

## Keyboard Shortcuts

See [KEYBOARD_SHORTCUTS.md](./KEYBOARD_SHORTCUTS.md) for complete reference.

### Essential Shortcuts

| Shortcut | Action |
|----------|--------|
| `Cmd/Ctrl + T` | New session |
| `Cmd/Ctrl + W` | Close session |
| `Cmd/Ctrl + F` | Search |
| `Cmd/Ctrl + E` | Export |
| `Cmd/Ctrl + ,` | Settings |

---

## Best Practices

### Organization Tips

1. **Tag Early and Often**
   - Add tags immediately after capture
   - Use consistent naming conventions
   - Create a tag hierarchy

2. **Use Notes for Context**
   - Why you asked the question
   - What project it's for
   - Follow-up actions needed

3. **Regular Archiving**
   - Archive completed projects
   - Keep active data focused
   - Review monthly

### Workflow Recommendations

**Research Project Workflow:**
1. Create dedicated session: "Project X Research"
2. Tag all captures: "project-x"
3. Add notes with context
4. Export at project milestones
5. Archive when complete

**Comparative Analysis Workflow:**
1. Create sessions for each provider
2. Ask same question to each
3. Tag captures: "comparison-{topic}"
4. Export to CSV
5. Analyze side-by-side

**Knowledge Base Workflow:**
1. Use descriptive tags
2. Add detailed notes
3. Regular exports to markdown
4. Import into Obsidian/Notion
5. Link related captures

### Performance Tips

1. **Regular Exports**
   - Reduce database size
   - Create backups
   - Archive old data

2. **Targeted Searches**
   - Use specific keywords
   - Combine filters
   - Limit date ranges

3. **Moderate Tag Usage**
   - 3-5 tags per capture
   - Avoid over-tagging
   - Use tag hierarchy

---

## Next Steps

- **[Settings Reference](./SETTINGS_QUICK_REFERENCE.md)** - Detailed settings documentation
- **[Keyboard Shortcuts](./KEYBOARD_SHORTCUTS.md)** - All shortcuts
- **[Architecture](./ARCHITECTURE_SIMPLIFIED.md)** - How it works
- **[Troubleshooting](../README.md#troubleshooting)** - Common issues

---

**Need help?** [Open an issue](https://github.com/yourusername/DeepResearch/issues) or [start a discussion](https://github.com/yourusername/DeepResearch/discussions)
