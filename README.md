# DeepResearch

> **Multi-Provider AI Response Capture & Enrichment Tool**

DeepResearch is a local-first Electron desktop application that captures, organizes, and analyzes AI responses from multiple providers (Claude, ChatGPT, Gemini, Perplexity) without requiring API keys. It uses browser integration to intercept responses from authenticated web sessions, storing everything locally for research and analysis.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Platform](https://img.shields.io/badge/platform-macOS%20|%20Windows%20|%20Linux-lightgrey)
![Version](https://img.shields.io/badge/version-0.1.0-green)

---

## Table of Contents

- [Key Features](#key-features)
- [Why DeepResearch?](#why-deepresearch)
- [Tech Stack](#tech-stack)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Usage Guide](#usage-guide)
- [Configuration](#configuration)
- [Development](#development)
- [Building & Deployment](#building--deployment)
- [Documentation](#documentation)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License](#license)

---

## Key Features

### Multi-Provider Support
- **No API Keys Required** - Works with existing authenticated web sessions
- **Supported Providers:** Claude, ChatGPT, Gemini, Perplexity, and custom URLs
- **Session Management** - Manage multiple provider sessions simultaneously with a browser-like tab interface
- **Session Isolation** - Each provider session runs in isolated partitions for security

### Data Capture & Storage
- **Automatic Response Interception** - Captures AI responses in real-time using Chrome DevTools Protocol
- **Local SQLite Database** - All data stored locally with FTS5 full-text search
- **Rich Metadata** - Captures prompts, responses, model info, timestamps, and custom tags
- **Data Enrichment** - Support for sentiment analysis, topic detection, and NER (future enhancement)

### Search & Organization
- **Full-Text Search** - Fast search across all captures with SQLite FTS5
- **Advanced Filtering** - Filter by provider, date range, tags, and custom criteria
- **Tagging System** - Organize captures with custom tags and notes
- **Data Table** - Sortable, filterable table view with TanStack Table

### Export & Integration
- **Multiple Formats** - Export to JSON, CSV, Markdown, and Parquet
- **Selective Export** - Export filtered subsets or entire datasets
- **Metadata Preservation** - All exports include full metadata

### Modern UI/UX
- **React 18 + TypeScript** - Type-safe, modern frontend architecture
- **shadcn/ui Components** - Beautiful, accessible components built on Radix UI
- **Dark/Light Themes** - System-aware theming with manual override
- **Responsive Layout** - Resizable panels and adaptive design
- **Keyboard Shortcuts** - Power-user shortcuts for common actions

### Privacy & Security
- **Local-First** - All data stored locally, no cloud dependencies
- **No Authentication Required** - Single-user desktop app
- **Session Isolation** - Provider sessions run in isolated browser contexts
- **Electron Security Best Practices** - Context isolation, sandboxing, no Node.js in renderer

---

## Why DeepResearch?

### Problem
- AI chat interfaces don't provide good tools for research and knowledge management
- Exporting conversations from AI providers is cumbersome or limited
- No unified way to search across multiple AI providers
- API-based solutions require expensive API keys and miss context from web UIs

### Solution
DeepResearch bridges this gap by:
1. **Embedding AI provider web UIs** directly in the app
2. **Intercepting responses** without requiring API access
3. **Storing everything locally** in a searchable database
4. **Providing powerful search and export tools** for research workflows

### Use Cases
- **Research Projects** - Organize AI responses by topic or project
- **Knowledge Base** - Build a searchable archive of AI interactions
- **Comparative Analysis** - Compare responses across different AI providers
- **Data Collection** - Gather training data or examples for analysis
- **Documentation** - Export AI-assisted documentation workflows

---

## Tech Stack

### Desktop Framework
- **Electron 28.x** - Cross-platform desktop application
- **Node.js** - Main process runtime
- **Chromium** - Embedded browser engine

### Frontend
- **React 18** - UI framework with hooks and concurrent features
- **TypeScript 5** - Type-safe development
- **Vite** - Fast build tool and dev server
- **Tailwind CSS 3** - Utility-first styling
- **shadcn/ui** - High-quality component library (Radix UI primitives)
- **Zustand** - Lightweight state management with persistence

### Data Layer
- **SQLite 3** - Local relational database
  - **better-sqlite3** - Fast synchronous SQLite bindings
  - **FTS5** - Full-text search extension
  - Optional: **sqlite-vec** - Vector embeddings for semantic search

### UI Libraries
- **TanStack Table** - Powerful data grid with sorting/filtering
- **React Resizable Panels** - Flexible layout management
- **Lucide React** - Modern icon library
- **Sonner** - Toast notifications
- **date-fns** - Date manipulation utilities

### Development Tools
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **Vitest** - Unit testing framework
- **Playwright** - E2E testing
- **concurrently** - Run multiple commands

---

## Installation

### Prerequisites

- **Node.js 18+** - [Download](https://nodejs.org/)
- **npm** or **pnpm** - Package manager
- **Git** - Version control

### Install from Source

```bash
# Clone the repository
git clone https://github.com/yourusername/DeepResearch.git
cd DeepResearch

# Install dependencies
npm install

# Start development mode
npm run electron:dev
```

### Install Pre-built Binary (Coming Soon)

Download the latest release for your platform:
- **macOS:** `DeepResearch-0.1.0.dmg`
- **Windows:** `DeepResearch-Setup-0.1.0.exe`
- **Linux:** `DeepResearch-0.1.0.AppImage` or `DeepResearch_0.1.0_amd64.deb`

---

## Quick Start

### 1. Launch the Application

```bash
npm run electron:dev
```

### 2. Create Your First Session

1. Click the **"+"** button in the tab bar
2. Select a provider (e.g., Claude, ChatGPT)
3. Log in to the provider in the embedded browser
4. Start chatting - responses are captured automatically

### 3. View Captured Data

1. Navigate to the **Data Panel** to see all captures
2. Use the **search bar** to filter by keywords
3. Click on any row to view full details

### 4. Export Your Data

1. Open the **Export Dialog**
2. Select format (JSON, CSV, Markdown)
3. Choose filters (optional)
4. Export to file

---

## Usage Guide

### Session Management

#### Creating a Session
- **Method 1:** Click the "+" button in the tab bar
- **Method 2:** Press `Cmd/Ctrl + T`

#### Switching Sessions
- **Method 1:** Click on any tab
- **Method 2:** Press `Cmd/Ctrl + 1-9` for quick switching

#### Renaming Sessions
1. Double-click on the session name in the tab
2. Edit the name inline
3. Press `Enter` to save or `Esc` to cancel

#### Closing Sessions
- **Method 1:** Hover over tab and click the "X" button
- **Method 2:** Press `Cmd/Ctrl + W`

### Data Management

#### Searching
- Use the search bar to filter by keywords
- Search across prompts, responses, tags, and notes
- Results update in real-time

#### Filtering
- Filter by provider, date range, or tags
- Combine multiple filters for precise results
- Save filter presets (coming soon)

#### Tagging
1. Select one or more captures
2. Click "Add Tag"
3. Enter tag names (comma-separated)
4. Tags are searchable and filterable

#### Adding Notes
1. Click on a capture to view details
2. Add notes in the notes field
3. Notes are included in full-text search

### Exporting Data

#### Export Formats
- **JSON** - Full data export with metadata
- **CSV** - Spreadsheet-friendly format
- **Markdown** - Human-readable documentation
- **Parquet** - Columnar format for data analysis

#### Export Options
- Export all captures or filtered subset
- Include/exclude metadata
- Custom file naming
- Automatic timestamp in filenames

---

## Configuration

### Application Settings

Access settings via the settings icon or `Cmd/Ctrl + ,`

#### General Settings
- **Auto-save:** Enable automatic capture saving
- **Notifications:** Toast notifications for captures
- **Startup behavior:** Open last session on startup

#### UI Settings
- **Theme:** Light, Dark, or System
- **Font size:** Adjust for readability
- **Compact mode:** Denser layout option
- **Sidebar position:** Left or Right

#### Capture Settings
- **Auto-capture:** Enable/disable automatic interception
- **Provider selection:** Choose which providers to capture
- **Include screenshots:** Capture visual context (future)

#### Export Settings
- **Default format:** Set preferred export format
- **Export path:** Default export directory
- **Include metadata:** Toggle metadata in exports

#### Database Settings
- **Backup frequency:** Automatic backup schedule
- **Compression:** Enable database compression
- **Retention policy:** Auto-archive old captures

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Cmd/Ctrl + T` | Create new session |
| `Cmd/Ctrl + W` | Close active session |
| `Cmd/Ctrl + 1-9` | Switch to session by index |
| `Cmd/Ctrl + F` | Focus search bar |
| `Cmd/Ctrl + E` | Open export dialog |
| `Cmd/Ctrl + ,` | Open settings |
| `Cmd/Ctrl + R` | Refresh data table |

---

## Development

### Project Structure

```
DeepResearch/
├── src/
│   ├── main/              # Electron main process
│   │   ├── index.ts       # App entry point
│   │   ├── database/      # SQLite operations
│   │   ├── session/       # Session management
│   │   ├── capture/       # Response interception
│   │   └── ipc/           # IPC handlers
│   ├── preload/           # Preload scripts
│   │   └── index.ts       # IPC bridge
│   ├── renderer/          # React frontend
│   │   ├── App.tsx        # Main app component
│   │   ├── components/    # UI components
│   │   ├── stores/        # Zustand stores
│   │   ├── lib/           # Utilities
│   │   └── styles/        # Global styles
│   └── shared/            # Shared types
├── docs/                  # Documentation
├── data/                  # Local database (gitignored)
└── release/               # Built applications
```

### Available Scripts

```bash
# Development
npm run electron:dev       # Start dev server + Electron
npm run dev                # Vite dev server only

# Building
npm run build              # Build for production
npm run electron:build     # Build Electron app

# Testing
npm test                   # Run Vitest tests
npm run test:ui            # Vitest UI mode
npm run test:e2e           # Playwright E2E tests

# Code Quality
npm run lint               # ESLint
npm run format             # Prettier
npm run type-check         # TypeScript checks
```

### Development Workflow

1. **Make changes** to source files
2. **Hot reload** automatically updates the app
3. **Test locally** with `npm run electron:dev`
4. **Lint and format** with `npm run lint && npm run format`
5. **Build** with `npm run build`

### Adding New Features

1. Create feature branch: `git checkout -b feature/your-feature`
2. Implement changes following existing patterns
3. Add tests for new functionality
4. Update documentation
5. Create pull request

---

## Building & Deployment

### Building for Production

```bash
# Build for all platforms
npm run build

# Build for specific platform
npm run build -- --mac
npm run build -- --win
npm run build -- --linux
```

### Build Artifacts

Builds are output to the `release/` directory:

- **macOS:** `DeepResearch-{version}.dmg`, `DeepResearch-{version}-mac.zip`
- **Windows:** `DeepResearch Setup {version}.exe`, `DeepResearch {version}.exe` (portable)
- **Linux:** `DeepResearch-{version}.AppImage`, `deepresearch_{version}_amd64.deb`

### Distribution

#### Manual Distribution
1. Build the application
2. Upload artifacts to GitHub Releases
3. Users download and install

#### Auto-Update (Future)
- electron-updater integration
- Automatic update checks
- Background downloads
- User-controlled update installation

---

## Documentation

### User Documentation
- **[Quick Start Guide](./docs/QUICK_START.md)** - Get up and running in 5 minutes
- **[Usage Guide](./docs/USAGE_GUIDE.md)** - Detailed usage instructions
- **[Settings Reference](./docs/SETTINGS_QUICK_REFERENCE.md)** - Complete settings documentation
- **[Keyboard Shortcuts](./docs/KEYBOARD_SHORTCUTS.md)** - All shortcuts reference

### Technical Documentation
- **[Architecture](./docs/ARCHITECTURE_SIMPLIFIED.md)** - System architecture and design
- **[Zustand Stores](./docs/ZUSTAND_STORES.md)** - State management documentation
- **[Session Management](./docs/SESSION_MANAGER_IMPLEMENTATION.md)** - Session system details
- **[Response Interceptor](./docs/RESPONSE_INTERCEPTOR_IMPLEMENTATION.md)** - Capture mechanism
- **[Data Table](./docs/RESEARCH_DATA_TABLE.md)** - Table component guide
- **[Search & Filter](./docs/SEARCH_FILTER_SYSTEM.md)** - Search implementation

### Developer Documentation
- **[API Reference](./docs/API_REFERENCE.md)** - IPC API documentation (coming soon)
- **[Database Schema](./docs/DATABASE_SCHEMA.md)** - SQLite schema reference (coming soon)
- **[Contributing Guide](./CONTRIBUTING.md)** - How to contribute (coming soon)

---

## Troubleshooting

### Common Issues

#### App Won't Start
- **Check Node.js version:** Must be 18+ (`node --version`)
- **Reinstall dependencies:** `rm -rf node_modules && npm install`
- **Clear cache:** `rm -rf .vite && npm run dev`

#### Captures Not Appearing
- **Check session is active:** Look for colored indicator on tab
- **Verify provider is supported:** Currently supports Claude, ChatGPT, Gemini, Perplexity
- **Check browser console:** Look for errors in DevTools (`Cmd/Ctrl + Shift + I`)

#### Database Errors
- **Check file permissions:** Ensure write access to data directory
- **Backup and reset:** Export data, delete `data/deepresearch.db`, restart app
- **Check disk space:** SQLite requires available disk space

#### Build Failures
- **Clear build cache:** `rm -rf dist release`
- **Update dependencies:** `npm update`
- **Check logs:** Review error messages for missing dependencies

### Getting Help

- **GitHub Issues:** [Report bugs or request features](https://github.com/yourusername/DeepResearch/issues)
- **Discussions:** [Ask questions or share ideas](https://github.com/yourusername/DeepResearch/discussions)
- **Email:** support@deepresearch.example.com

---

## Contributing

We welcome contributions! Here's how you can help:

### Ways to Contribute
- **Report bugs** - Open an issue with reproduction steps
- **Suggest features** - Propose enhancements via discussions
- **Submit PRs** - Fix bugs or implement features
- **Improve docs** - Help us improve documentation
- **Share feedback** - Tell us how you use DeepResearch

### Development Setup

1. Fork the repository
2. Clone your fork: `git clone https://github.com/yourusername/DeepResearch.git`
3. Create a branch: `git checkout -b feature/amazing-feature`
4. Make your changes
5. Test thoroughly: `npm test && npm run lint`
6. Commit: `git commit -m 'Add amazing feature'`
7. Push: `git push origin feature/amazing-feature`
8. Open a Pull Request

### Code Standards
- Follow existing code style
- Write TypeScript with strict types
- Add tests for new features
- Update documentation
- Use conventional commits

---

## Roadmap

### Version 0.2.0 (Next Release)
- [ ] BrowserView integration for provider sessions
- [ ] Response interception with CDP
- [ ] Improved export formats
- [ ] Session templates
- [ ] Auto-updater support

### Version 0.3.0
- [ ] Semantic search with vector embeddings
- [ ] Conversation threading
- [ ] Cloud backup (optional)
- [ ] Browser extension

### Version 1.0.0
- [ ] Local LLM integration for auto-tagging
- [ ] Export to Obsidian/Notion
- [ ] Multi-device sync
- [ ] Plugin system

---

## License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

## Acknowledgments

- **[Electron](https://www.electronjs.org/)** - Cross-platform desktop framework
- **[React](https://react.dev/)** - UI library
- **[shadcn/ui](https://ui.shadcn.com/)** - Component library
- **[Radix UI](https://www.radix-ui.com/)** - Primitive components
- **[TanStack Table](https://tanstack.com/table)** - Table library
- **[Zustand](https://github.com/pmndrs/zustand)** - State management
- **[SQLite](https://www.sqlite.org/)** - Database engine

---

## Support

If you find DeepResearch useful, please consider:
- Starring the repository
- Sharing with others
- Contributing to development
- Reporting bugs and suggesting features

---

**Made with by the Research Team**

[Website](https://deepresearch.example.com) • [Documentation](./docs) • [Issues](https://github.com/yourusername/DeepResearch/issues) • [Discussions](https://github.com/yourusername/DeepResearch/discussions)
