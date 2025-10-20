# Response Interceptor Implementation

## Overview
Implemented comprehensive CDP (Chrome DevTools Protocol) response interception system to capture AI provider responses in real-time without requiring API keys.

## Architecture

### Core Components

**1. ResponseInterceptor Class** (`src/main/capture/ResponseInterceptor.ts`)
- Uses CDP Fetch domain for network interception
- Attaches to BrowserView's webContents via debugger protocol
- Pattern matches URLs for specific AI providers
- Parses both JSON and SSE (Server-Sent Events) streaming responses
- Automatically stores captures in SQLite database

**2. SessionManager Integration** (`src/main/session/SessionManager.ts`)
- Creates ResponseInterceptor instance for each session
- Enables interception after page load
- Manages interceptor lifecycle (enable/disable/cleanup)
- Tracks interceptors in Map alongside BrowserViews

**3. IPC Handlers** (`src/main/index.ts`)
- Added 8 new data operation handlers
- Query captures with filters
- Search captures using FTS5
- Update capture metadata (tags, notes)
- Archive/delete captures
- Get database statistics

## How It Works

### 1. CDP Fetch Domain Interception

```typescript
// Attach debugger to webContents
webContents.debugger.attach('1.3');

// Enable Fetch domain with URL patterns
await webContents.debugger.sendCommand('Fetch.enable', {
  patterns: [
    { urlPattern: '*://claude.ai/api/.../completion', requestStage: 'Response' },
    { urlPattern: '*://chat.openai.com/backend-api/conversation', requestStage: 'Response' },
    // ... more patterns
  ]
});

// Listen for paused requests
webContents.debugger.on('message', (event, method, params) => {
  if (method === 'Fetch.requestPaused') {
    // Get response body and process
  }
});
```

### 2. Response Processing Flow

```
Network Request → CDP Intercepts → Get Response Body → Parse Format
                                         ↓
                        JSON or SSE Stream Detection
                                         ↓
                        Extract Prompt & Response Text
                                         ↓
                        Store in Database (captures table)
                                         ↓
                        Emit 'response:captured' Event
                                         ↓
                        Continue Request (no blocking)
```

### 3. Provider-Specific URL Patterns

**Claude:**
- `*://claude.ai/api/organizations/*/chat_conversations/*/completion`
- `*://claude.ai/api/append_message`
- `*://api.anthropic.com/v1/messages`

**OpenAI:**
- `*://chat.openai.com/backend-api/conversation`
- `*://api.openai.com/v1/chat/completions`

**Gemini:**
- `*://gemini.google.com/*/conversation`
- `*://generativelanguage.googleapis.com/*/models/*:generateContent`

### 4. SSE (Server-Sent Events) Parsing

Many AI providers stream responses using SSE format:

```
data: {"delta": {"text": "Hello"}}

data: {"delta": {"text": " world"}}

data: [DONE]
```

The interceptor:
1. Splits response by newlines
2. Parses each `data: ` line as JSON
3. Extracts text chunks from various formats
4. Concatenates into full response text
5. Stores both full text and individual events

## Database Integration

### Capture Schema

```typescript
interface Capture {
  id: string;              // UUID
  session_id: string;      // Links to session
  provider: string;        // claude, openai, gemini
  prompt: string;          // User input
  response: string;        // AI response
  response_format: string; // 'json' or 'sse'
  model: string;           // Model name (if available)
  timestamp: number;       // Unix timestamp
  token_count: number;     // Estimated tokens
  tags: string;            // JSON array
  notes: string;           // User notes
  is_archived: number;     // 0 or 1
}
```

### Full-Text Search

FTS5 enabled for searching across prompts and responses:

```sql
SELECT c.* FROM captures c
JOIN captures_fts fts ON c.rowid = fts.rowid
WHERE captures_fts MATCH 'search query'
ORDER BY rank
```

## IPC API

### Data Operations

```typescript
// Get all captures with optional filters
window.electronAPI.data.getCaptures({
  provider: 'claude',
  startDate: Date.now() - 86400000, // Last 24 hours
  isArchived: false
});

// Full-text search
window.electronAPI.data.searchCaptures('neural networks', {
  provider: 'openai'
});

// Get single capture
window.electronAPI.data.getCapture(captureId);

// Update metadata
window.electronAPI.data.updateTags(captureId, ['AI', 'research']);
window.electronAPI.data.updateNotes(captureId, 'Important insight');

// Archive/delete
window.electronAPI.data.setArchived(captureId, true);
window.electronAPI.data.deleteCapture(captureId);

// Get statistics
window.electronAPI.data.getStats();
// Returns: { totalCaptures, archivedCaptures, totalSessions, etc. }
```

## Supported Response Formats

### 1. OpenAI Streaming Format

```json
data: {"choices":[{"delta":{"content":"Hello"}}]}
data: {"choices":[{"delta":{"content":" world"}}]}
data: [DONE]
```

### 2. Anthropic Streaming Format

```json
data: {"completion":"Hello"}
data: {"completion":" world"}
data: {"stop_reason":"end_turn"}
```

### 3. Standard JSON Response

```json
{
  "choices": [
    {"message": {"content": "Complete response here"}}
  ],
  "model": "gpt-4"
}
```

## Error Handling

1. **Debugger Detachment**: Automatically detected and logged
2. **Failed Interception**: Request continues even if processing fails
3. **Parse Errors**: Fallback to raw body if JSON parsing fails
4. **Missing Data**: Graceful handling with empty strings/undefined

## Performance Considerations

1. **Non-Blocking**: Requests continue while processing happens
2. **Async Processing**: All operations use async/await
3. **Minimal Overhead**: Only intercepts specific URL patterns
4. **Token Estimation**: Simple algorithm (~4 chars per token)

## Security Features

1. **Sandboxed**: Runs in Electron's sandbox environment
2. **CDP Protocol**: Official debugging protocol, no hacks
3. **No API Keys**: Captures from web interface, no credentials needed
4. **Local Storage**: All data stored in local SQLite database

## Lifecycle Management

### Session Creation
```
Create Session → Create BrowserView → Create Interceptor
                                          ↓
                Load URL → Wait for page load → Enable Interception
```

### Session Deletion
```
Delete Session → Disable Interceptor → Detach Debugger
                                          ↓
                Remove BrowserView → Delete from DB
```

### App Shutdown
```
Before Quit → Disable All Interceptors → Save States
                                          ↓
                Destroy BrowserViews → Close Database
```

## Events Emitted

### response:captured

Sent to renderer when a new response is captured:

```typescript
{
  captureId: string;
  sessionId: string;
  provider: string;
  preview: string; // First 200 chars
}
```

Renderer can listen with:
```typescript
window.electronAPI.on('response:captured', (data) => {
  // Update UI with new capture
});
```

## Testing Recommendations

1. **Manual Testing**:
   - Create sessions for each provider
   - Send test messages
   - Verify captures appear in database
   - Check SSE vs JSON detection

2. **Unit Tests**:
   - SSE parser with various formats
   - Prompt/response extraction
   - Token estimation
   - URL pattern matching

3. **Integration Tests**:
   - Full capture flow with mock webContents
   - Database storage verification
   - IPC handler responses

## Known Limitations

1. **CDP Availability**: Requires CDP support (Chromium-based only)
2. **Pattern Matching**: Must update patterns if providers change URLs
3. **Format Changes**: AI providers may change response formats
4. **Private APIs**: Some providers use undocumented APIs that may change

## Future Enhancements

1. **Better Token Counting**: Use tiktoken for accurate counts
2. **Response Enrichment**: Extract metadata (model, temperature, etc.)
3. **Conversation Threading**: Link related prompts/responses
4. **Export Formats**: Markdown, PDF, JSONL for training data
5. **Smart Filtering**: Auto-tag based on content analysis
6. **Duplicate Detection**: Identify similar captures

## Files Modified

**Created:**
- `src/main/capture/ResponseInterceptor.ts`
- `docs/RESPONSE_INTERCEPTOR_IMPLEMENTATION.md`

**Modified:**
- `src/main/session/SessionManager.ts`
- `src/main/index.ts`
- `src/preload/index.ts`

## Build Status

✅ TypeScript compilation passes with no errors
✅ All types properly defined
✅ CDP integration complete
✅ Database integration complete
✅ IPC API fully implemented
✅ Error handling comprehensive

## Usage Example

```typescript
// In main process (automatic via SessionManager)
const session = await sessionManager.createSession({
  provider: 'claude',
  name: 'Research Session'
});

// Interceptor automatically enabled after page load
// User interacts with Claude web interface
// Responses captured automatically

// In renderer process
const { captures } = await window.electronAPI.data.getCaptures({
  provider: 'claude',
  isArchived: false
});

console.log(`Captured ${captures.length} responses`);
```

## Next Steps

To complete the data capture feature:

1. **UI Components**:
   - Capture list/table view
   - Capture detail modal
   - Real-time notifications for new captures
   - Search and filter interface

2. **Response Enrichment**:
   - Better metadata extraction
   - Conversation threading
   - Auto-tagging based on content

3. **Export Features**:
   - Export to various formats
   - Batch export with filters
   - Custom export templates

4. **Analytics**:
   - Usage statistics per provider
   - Token usage tracking
   - Response time analysis
