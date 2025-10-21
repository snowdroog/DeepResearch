# GitHub Actions Workflows

This directory contains GitHub Actions CI/CD workflows for the DeepResearch Electron application.

## Workflows

### 1. Test Workflow (`test.yml`)

**Triggers:**
- Push to `main` or `develop` branches
- Pull requests to `main` or `develop` branches

**Jobs:**

#### Lint & Type Check
- Runs ESLint to check code quality
- Runs TypeScript compiler in `--noEmit` mode to verify types
- Runs on: `ubuntu-latest`

#### Unit Tests
- Runs Vitest unit tests for both renderer and main process
- Generates coverage reports
- Tests on: Linux, macOS, Windows
- Handles native module compilation (better-sqlite3)
- Uploads coverage artifacts for later analysis

#### E2E Tests
- Runs Playwright end-to-end tests
- Tests the full Electron application
- Tests on: Linux, macOS, Windows
- Includes special handling for headless display (xvfb on Linux)
- Uploads test results, reports, and videos on failure

#### Coverage Report
- Collects coverage from unit tests
- Uploads to GitHub artifacts
- Optional: Can be configured to upload to Codecov

#### Test Summary
- Aggregates results from all test jobs
- Creates a summary in the GitHub Actions UI
- Fails if any test job failed

### 2. Build Workflow (`build.yml`)

**Triggers:**
- Push to `main` or `develop` branches
- Pull requests to `main` or `develop` branches
- Manual workflow dispatch

**Jobs:**

#### Build App
- Compiles TypeScript code
- Builds Vite application
- Verifies build output structure
- Tests on: Linux, macOS, Windows
- Uploads build artifacts

#### Package App
- Creates distributable Electron packages
- Only runs on `main` branch or manual trigger (to save CI minutes)
- Generates platform-specific installers:
  - Linux: AppImage, deb
  - macOS: dmg, zip
  - Windows: NSIS installer, portable
- Uploads packaged applications as artifacts

#### Build Summary
- Reports overall build status
- Creates summary in GitHub Actions UI

## Caching Strategy

Both workflows use the following caching mechanisms:

1. **npm cache**: `actions/setup-node@v4` automatically caches `node_modules` based on `package-lock.json`
2. **Playwright browsers**: Installed once per workflow run (not cached between runs due to size)

## Native Modules Handling

The workflows include special handling for `better-sqlite3` and other native modules:

- **Linux**: Installs build-essential and Python 3
- **macOS**: Verifies Xcode command line tools
- **Windows**: Attempts to install windows-build-tools (may fail but continues)
- All platforms use `npm ci` with `npm_config_build_from_source=true`

## Environment Variables

Key environment variables used:

- `CI=true`: Enables CI mode for tests (no watch mode, stricter error handling)
- `NODE_ENV=production`: Used during build process
- `GH_TOKEN`: GitHub token for electron-builder (auto-releases)
- `npm_config_build_from_source=true`: Forces rebuild of native modules

## Artifact Retention

- **Test artifacts**: 7 days
- **Build artifacts**: 7 days
- **Package artifacts**: 14 days

## Codecov Integration (Optional)

To enable Codecov integration:

1. Sign up at [codecov.io](https://codecov.io)
2. Add your repository
3. Get your `CODECOV_TOKEN`
4. Add it to repository secrets: Settings → Secrets → Actions → New repository secret
5. Uncomment the Codecov upload step in `test.yml`

## Badge Usage

Add these badges to your README.md:

```markdown
![Test](https://github.com/snowdroog/DeepResearch/workflows/Test/badge.svg)
![Build](https://github.com/snowdroog/DeepResearch/workflows/Build/badge.svg)
```

## Troubleshooting

### Native Module Compilation Failures

If you see errors related to `better-sqlite3` or other native modules:

1. Ensure system dependencies are installed (see workflow files)
2. Check Node.js version compatibility
3. Verify native module versions in `package.json`

### E2E Test Timeouts

If E2E tests timeout:

1. Check the `timeout-minutes` setting in workflow (currently 15 minutes)
2. Review individual test timeouts in `playwright.config.ts`
3. Consider increasing timeout for slower CI runners

### Build Size Issues

If builds are too large:

1. Check the build size report in workflow summary
2. Analyze bundle with `npx vite-bundle-visualizer`
3. Consider code splitting or lazy loading

### Package Job Not Running

The package job only runs:
- On pushes to `main` branch
- On manual workflow dispatch

This is intentional to save CI minutes. For testing packaging:
1. Push to `main`, or
2. Manually trigger the workflow from Actions tab

## Recommendations

### Immediate Improvements

1. **Enable Codecov** for better coverage visualization
2. **Add dependabot** for automatic dependency updates
3. **Set up branch protection** requiring tests to pass before merge

### Future Enhancements

1. **Code signing**: Add proper code signing for macOS and Windows packages
2. **Auto-release**: Set up automated releases on version tags
3. **Performance budgets**: Add bundle size checks
4. **Lighthouse CI**: Add performance testing for renderer process
5. **Security scanning**: Add npm audit or Snyk integration
6. **Docker**: Consider adding Docker-based builds for consistency

### Cost Optimization

1. **Selective E2E**: Run E2E tests only on main/develop, not on every PR
2. **Matrix reduction**: Consider running full matrix only on main
3. **Artifact cleanup**: Automatically delete old artifacts after 7 days

## Local Testing

Before pushing, test locally:

```bash
# Lint and type check
npm run lint
npx tsc --noEmit

# Run unit tests
npm run test:run

# Run with coverage
npm run test:coverage

# Run E2E tests
npm run test:e2e

# Build app
npm run build

# Package app
npm run electron:build
```
