# DeepResearch Setup Guide

## Installation Status

✅ **Project Successfully Initialized** (2025-10-20)

### What's Been Completed

1. ✅ **Project Structure Created**
   - Full Electron + React + TypeScript setup
   - Feature-based directory structure
   - Configuration files (TypeScript, Vite, Tailwind, ESLint)

2. ✅ **Dependencies Installed**
   - 837 packages installed successfully
   - All core dependencies: React 18, Electron 28, better-auth 1.3.28
   - UI libraries: shadcn/ui (Radix primitives), Tailwind CSS
   - State management: Zustand
   - Database: DuckDB, better-sqlite3

3. ✅ **Build System Verified**
   - TypeScript compilation: ✅ No errors
   - Vite build: ✅ Successful (renderer, main, preload)
   - ESLint: ✅ Configured and passing (0 errors, 3 warnings fixed)

4. ✅ **Initial UI Components**
   - Login page with Google OAuth button (UI ready, backend pending)
   - Main layout structure
   - Protected route system

## Next Steps

### 1. Set Up Google OAuth (Required for Authentication)

Before running the app, you need Google OAuth credentials:

1. **Create Google Cloud Project**
   - Go to [Google Cloud Console](https://console.cloud.google.com)
   - Create a new project or select existing
   - Enable "Google+ API" or "Google Identity"

2. **Create OAuth 2.0 Credentials**
   - Navigate to "Credentials" in the API menu
   - Click "Create Credentials" → "OAuth 2.0 Client ID"
   - Application type: "Web application"
   - Add authorized JavaScript origins:
     ```
     http://localhost:5173
     ```
   - Add authorized redirect URIs:
     ```
     http://localhost:5173/api/auth/callback/google
     ```

3. **Configure Environment**
   ```bash
   # Copy the example env file
   cp .env.example .env.local

   # Edit .env.local with your credentials
   # GOOGLE_CLIENT_ID=your_client_id_here
   # GOOGLE_CLIENT_SECRET=your_client_secret_here
   ```

### 2. Development Commands

```bash
# Start development server (Vite + Electron)
npm run electron:dev

# Build for production
npm run build

# Run linter
npm run lint

# Format code
npm run format

# Run tests (once implemented)
npm test
```

### 3. Known Issues & Warnings

**NPM Warnings (Non-Critical):**
- 5 moderate severity vulnerabilities (mostly in dev dependencies)
- Some deprecated packages (inflight, npmlog, glob@7/8)
- These don't affect functionality but should be addressed in future updates

**To address:**
```bash
npm audit fix
```

**Architecture Note:**
- `@better-auth/react` package doesn't exist (removed from dependencies)
- better-auth React integration is included in the main `better-auth` package
- Authentication implementation is next on the roadmap

## Project Architecture

### Directory Structure
```
DeepResearch/
├── src/
│   ├── main/              # Electron main process
│   │   └── index.ts       # App entry point
│   ├── preload/           # IPC bridge (security layer)
│   │   └── index.ts       # Context bridge API
│   ├── renderer/          # React UI (renderer process)
│   │   ├── main.tsx       # React entry
│   │   ├── App.tsx        # App router
│   │   ├── features/      # Feature modules
│   │   │   └── auth/
│   │   ├── layouts/       # Layout components
│   │   └── styles/        # Global styles
│   └── shared/            # Shared types
│       └── types/
├── dist/                  # Build output
│   ├── main/              # Main process build
│   ├── preload/           # Preload script build
│   └── renderer/          # Renderer build
└── docs/
    ├── ARCHITECTURE.md    # Full technical architecture
    └── SETUP.md           # This file
```

### Tech Stack Summary
- **Frontend**: React 18 + TypeScript 5 + Tailwind CSS
- **Desktop**: Electron 28
- **Auth**: better-auth 1.3.28 (Google OAuth planned)
- **State**: Zustand 4.5
- **Database**: DuckDB (analytics) + SQLite (vector search)
- **Build**: Vite 5
- **UI Components**: shadcn/ui (Radix UI primitives)

## Development Workflow

### Phase 1: Authentication (Current)
- [ ] Implement better-auth server configuration
- [ ] Connect Google OAuth provider
- [ ] Add user state management
- [ ] Implement auth guards
- [ ] Create user profile UI

### Phase 2: Session Management
- [ ] Implement Electron session partitions
- [ ] Build session manager
- [ ] Add provider configuration (Claude, OpenAI, Gemini)

### Phase 3: Response Capture
- [ ] Chrome DevTools Protocol integration
- [ ] Content injection scripts
- [ ] Response interceptor

### Phase 4: Data Pipeline
- [ ] DuckDB schema implementation
- [ ] Provider adapters
- [ ] Enrichment processors

## Troubleshooting

### Build Issues
```bash
# Clean build
rm -rf dist node_modules
npm install
npm run build
```

### TypeScript Errors
```bash
# Check for type errors
npx tsc --noEmit
```

### Electron Won't Start
```bash
# Check if ports are available
lsof -i :5173

# Kill conflicting process
kill -9 <PID>
```

## Resources

- [ARCHITECTURE.md](./ARCHITECTURE.md) - Complete technical architecture
- [better-auth Docs](https://www.better-auth.com/docs) - Authentication library docs
- [Electron Docs](https://www.electronjs.org/docs) - Electron framework docs
- [shadcn/ui](https://ui.shadcn.com) - UI component documentation

## Contributing

This is a research project. See [ARCHITECTURE.md](./ARCHITECTURE.md) for detailed technical documentation.

## Status

**Current Phase**: Authentication Setup (Phase 0)
**Build Status**: ✅ Passing
**Tests**: Pending implementation
**Ready for Development**: ✅ Yes

---

Last Updated: 2025-10-20
