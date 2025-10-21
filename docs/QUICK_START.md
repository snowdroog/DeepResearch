# DeepResearch Quick Start Guide

Get up and running with DeepResearch in 5 minutes.

---

## What You'll Learn

- How to install and launch DeepResearch
- How to create your first AI provider session
- How to capture and view AI responses
- How to search and export your data

---

## Step 1: Installation (2 minutes)

### Prerequisites

Ensure you have Node.js 18+ installed:

```bash
node --version  # Should show v18.0.0 or higher
```

### Install from Source

```bash
# Clone the repository
git clone https://github.com/yourusername/DeepResearch.git
cd DeepResearch

# Install dependencies
npm install

# Launch the app
npm run electron:dev
```

The application will open automatically once the build completes.

---

## Step 2: Create Your First Session (1 minute)

### Option A: Using the UI

1. Click the **"+"** button in the top tab bar
2. Select your preferred AI provider:
   - **Claude** (blue) - claude.ai
   - **ChatGPT** (green) - chat.openai.com
   - **Gemini** (purple) - gemini.google.com
   - **Perplexity** (cyan) - perplexity.ai
   - **Custom** (gray) - Enter your own URL
3. Click **"Create Session"**

### Option B: Using Keyboard Shortcut

1. Press `Cmd/Ctrl + T`
2. Select your provider
3. Press `Enter` to confirm

### What Happens Next?

- A new tab appears with your provider's color
- The embedded browser loads the provider's website
- You'll see the provider's login page (if not already logged in)

---

## Step 3: Log In to Your AI Provider (1 minute)

DeepResearch uses your existing web sessions - no API keys needed!

1. Log in to your chosen provider using your normal credentials
2. Once logged in, you'll see the familiar chat interface
3. The session is now ready to capture responses

> **Note:** Your login credentials are stored securely in isolated browser sessions. DeepResearch never sees or stores your passwords.

---

## Step 4: Start Chatting & Capturing (30 seconds)

Simply use the AI provider as you normally would:

1. Type a prompt or question
2. Press Enter to send
3. Watch the AI respond

**Automatic Capture:** Responses are automatically intercepted and saved to your local database.

---

## Step 5: View Your Captured Data (30 seconds)

### Switch to the Data Panel

1. Click the **Data** tab in the left sidebar (or main navigation)
2. You'll see a table with all captured interactions

### What You'll See

| Column | Description |
|--------|-------------|
| **Provider** | Colored badge (Claude, ChatGPT, etc.) |
| **Prompt** | Your input question/prompt |
| **Response** | AI's response (truncated) |
| **Model** | AI model used (e.g., GPT-4, Claude 3.5) |
| **Timestamp** | When the capture occurred |
| **Tags** | Custom tags you've added |

### View Full Details

- Click any row to open the full capture details
- See complete prompt and response
- Add tags and notes
- Copy text or export individual captures

---

## Step 6: Search Your Data (30 seconds)

### Basic Search

1. Use the search bar at the top of the Data Panel
2. Type keywords (e.g., "python", "recipe", "marketing")
3. Results filter in real-time

### Advanced Filtering

Click the **Filter** button to:
- Filter by provider (Claude, ChatGPT, etc.)
- Filter by date range
- Filter by tags
- Combine multiple filters

---

## Step 7: Export Your Data (30 seconds)

### Quick Export

1. Click the **Export** button (or press `Cmd/Ctrl + E`)
2. Select your format:
   - **JSON** - Full data with metadata
   - **CSV** - Spreadsheet-friendly
   - **Markdown** - Human-readable
   - **Parquet** - For data analysis
3. Choose export options:
   - Export all captures or filtered subset
   - Include/exclude metadata
4. Click **Export**
5. Choose save location

---

## What's Next?

Now that you're up and running, explore these features:

### Multiple Sessions
- Create sessions for different providers
- Switch between them with `Cmd/Ctrl + 1-9`
- Rename sessions by double-clicking the tab name

### Organization
- Add tags to captures for easy categorization
- Add personal notes for context
- Archive old captures to keep things tidy

### Customization
- Open Settings (`Cmd/Ctrl + ,`)
- Choose dark or light theme
- Customize capture behavior
- Set default export format

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Cmd/Ctrl + T` | New session |
| `Cmd/Ctrl + W` | Close session |
| `Cmd/Ctrl + F` | Search |
| `Cmd/Ctrl + E` | Export |
| `Cmd/Ctrl + ,` | Settings |
| `Cmd/Ctrl + 1-9` | Switch session |

---

## Troubleshooting

### Captures Not Appearing?

**Check these:**
- Is the session tab active (colored indicator)?
- Did the AI finish responding?
- Check the browser console for errors: `Cmd/Ctrl + Shift + I`

**Try this:**
- Refresh the provider page
- Send another prompt
- Restart the session

### App Won't Start?

```bash
# Reinstall dependencies
rm -rf node_modules && npm install

# Clear build cache
rm -rf .vite dist

# Try again
npm run electron:dev
```

### Other Issues?

- Check the [full troubleshooting guide](../README.md#troubleshooting)
- [Report an issue](https://github.com/yourusername/DeepResearch/issues)
- [Ask for help](https://github.com/yourusername/DeepResearch/discussions)

---

## Learn More

Ready to dive deeper? Check out:

- **[Usage Guide](./USAGE_GUIDE.md)** - Detailed feature documentation
- **[Settings Reference](./SETTINGS_QUICK_REFERENCE.md)** - All settings explained
- **[Keyboard Shortcuts](./KEYBOARD_SHORTCUTS.md)** - Complete shortcuts reference
- **[Architecture](./ARCHITECTURE_SIMPLIFIED.md)** - How DeepResearch works

---

## Feedback

We'd love to hear from you!

- What features would you like to see?
- What's working well?
- What could be improved?

Share your thoughts:
- [GitHub Discussions](https://github.com/yourusername/DeepResearch/discussions)
- [GitHub Issues](https://github.com/yourusername/DeepResearch/issues)

---

**Happy researching! **
