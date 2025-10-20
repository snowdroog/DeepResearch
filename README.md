# DeepResearch

Multi-Provider AI Response Capture & Enrichment Tool

## Overview

DeepResearch is an Electron desktop application that captures and enriches AI responses from multiple providers (Claude, OpenAI, Gemini, etc.) without requiring API keys. It uses browser integration to intercept responses from authenticated web sessions.

## Features

- 🔐 **Google OAuth Authentication** with better-auth
- 🤖 **Multi-Provider Support** - Claude, ChatGPT, Gemini, and more
- 📊 **Data Enrichment** - NER, sentiment analysis, topic detection
- 🔍 **Semantic Search** - Vector embeddings with hybrid search
- 📤 **Multiple Export Formats** - Parquet, JSON-LD, CSV
- 🎨 **Modern UI** - React 18 + shadcn/ui + Tailwind CSS

## Tech Stack

- **Framework**: Electron + React 18 + TypeScript
- **Auth**: better-auth with Google OAuth
- **UI**: shadcn/ui + Tailwind CSS
- **State**: Zustand
- **Database**: DuckDB + SQLite (with sqlite-vec)
- **Build**: Vite

## Getting Started

### Prerequisites

- Node.js 18+
- npm or pnpm

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run electron:dev
```

### Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URIs
6. Create `.env.local` file:

```env
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
```

## Project Structure

```
src/
├── main/           # Electron main process
├── preload/        # Preload scripts
├── renderer/       # React UI
│   ├── components/ # UI components
│   ├── features/   # Feature modules
│   ├── layouts/    # Layout components
│   ├── stores/     # Zustand stores
│   └── styles/     # Global styles
└── shared/         # Shared types
```

## Development

```bash
# Development
npm run electron:dev

# Build
npm run build

# Test
npm test

# Lint
npm run lint

# Format
npm run format
```

## Documentation

- [Architecture Documentation](./ARCHITECTURE.md) - Comprehensive technical architecture
- [Project Plan](./plan.md) - User's planning notes

## License

MIT

## Contributing

This is a research project. Contributions welcome!
