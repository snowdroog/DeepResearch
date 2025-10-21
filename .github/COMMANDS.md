# Quick Command Reference for CI/CD

This document provides quick command references for working with the CI/CD pipeline.

## Local Testing Commands

### Linting and Type Checking

```bash
# Run ESLint
npm run lint

# Run TypeScript type checking
npx tsc --noEmit

# Both at once
npm run lint && npx tsc --noEmit
```

### Unit Tests

```bash
# Run all tests once
npm run test:run

# Run tests in watch mode
npm run test:watch

# Run renderer tests only
npm run test:renderer

# Run main process tests only
npm run test:main

# Run with coverage
npm run test:coverage

# Run with UI
npm run test:ui
```

### E2E Tests

```bash
# Run all E2E tests
npm run test:e2e

# Run E2E tests in headed mode (see browser)
npx playwright test --headed

# Run specific E2E test file
npx playwright test e2e/example.spec.ts

# Run E2E tests in debug mode
npx playwright test --debug

# Generate E2E test code
npx playwright codegen http://localhost:5173
```

### Building

```bash
# Development build
npm run dev

# Production build
npm run build

# Build and package Electron app
npm run electron:build

# Build for specific platform
npm run electron:build -- --linux
npm run electron:build -- --mac
npm run electron:build -- --win
```

## CI/CD Commands

### Triggering Workflows

```bash
# Push to trigger CI
git push origin <branch-name>

# Create PR to trigger CI
gh pr create --fill

# Manually trigger build workflow (requires gh CLI)
gh workflow run build.yml

# View workflow runs
gh run list

# Watch latest workflow run
gh run watch
```

### Viewing CI Results

```bash
# List recent workflow runs
gh run list --workflow=test.yml

# View specific run
gh run view <run-id>

# View run in browser
gh run view <run-id> --web

# Download artifacts from run
gh run download <run-id>

# View logs from failed run
gh run view <run-id> --log-failed
```

### Managing Artifacts

```bash
# List artifacts for a run
gh run view <run-id> --json artifacts

# Download specific artifact
gh run download <run-id> -n coverage-renderer

# Download all artifacts
gh run download <run-id>

# List all artifacts in repo
gh api repos/:owner/:repo/actions/artifacts
```

## Dependabot Commands

```bash
# List Dependabot PRs
gh pr list --author app/dependabot

# View specific Dependabot PR
gh pr view <pr-number>

# Auto-merge Dependabot PR (if tests pass)
gh pr merge <pr-number> --auto --merge

# Close Dependabot PR
gh pr close <pr-number>
```

## CodeQL Commands

```bash
# View CodeQL alerts
gh api repos/:owner/:repo/code-scanning/alerts

# View specific alert
gh api repos/:owner/:repo/code-scanning/alerts/<alert-number>

# List all security alerts
gh api repos/:owner/:repo/vulnerability-alerts
```

## Debugging Commands

### Check Workflow Syntax

```bash
# Validate workflow YAML syntax
npx js-yaml .github/workflows/test.yml
npx js-yaml .github/workflows/build.yml
npx js-yaml .github/workflows/codeql.yml
```

### Local Workflow Testing

```bash
# Install act (https://github.com/nektos/act)
# macOS
brew install act

# Linux
curl https://raw.githubusercontent.com/nektos/act/master/install.sh | sudo bash

# Run workflows locally with act
act -l                                    # List workflows
act -j lint-and-typecheck                 # Run specific job
act -j unit-tests                         # Run unit tests job
act pull_request                          # Simulate PR event
```

### Coverage Reports

```bash
# Generate coverage report
npm run test:coverage

# View coverage in browser
open coverage/index.html                  # macOS
xdg-open coverage/index.html             # Linux
start coverage/index.html                # Windows

# Generate coverage for CI upload
npm run test:coverage -- --reporter=lcov
```

### Clean Up

```bash
# Clean build artifacts
rm -rf dist/

# Clean coverage reports
rm -rf coverage/

# Clean E2E results
rm -rf e2e-results/ playwright-report/

# Clean node_modules and reinstall
rm -rf node_modules/ && npm ci

# Clean everything and start fresh
rm -rf node_modules/ dist/ coverage/ e2e-results/ playwright-report/
npm ci
```

## Git Commands for CI

### Creating Feature Branch

```bash
# Create feature branch
git checkout -b feature/my-feature

# Push and set upstream
git push -u origin feature/my-feature

# Create PR
gh pr create --fill
```

### Checking CI Status

```bash
# Check status of current branch
gh pr checks

# Check status of specific PR
gh pr checks <pr-number>

# View detailed status
gh pr view --json statusCheckRollup
```

### Branch Protection

```bash
# Require status checks (do this once via GitHub web UI)
# Settings → Branches → Add rule

# Or via API
gh api repos/:owner/:repo/branches/main/protection \
  -X PUT \
  -F required_status_checks[strict]=true \
  -F required_status_checks[contexts][]=lint-and-typecheck \
  -F required_status_checks[contexts][]=unit-tests
```

## Package Management

### Updating Dependencies

```bash
# Check for outdated packages
npm outdated

# Update all dependencies (respects semver)
npm update

# Update to latest (including majors)
npx npm-check-updates -u
npm install

# Update specific package
npm install <package-name>@latest

# Rebuild native modules
npm rebuild better-sqlite3
```

### Playwright

```bash
# Install Playwright browsers
npx playwright install

# Install with system dependencies
npx playwright install --with-deps

# Install specific browser
npx playwright install chromium

# Show installed browsers
npx playwright show-trace
```

## Performance Analysis

### Bundle Size

```bash
# Analyze bundle size
npm run build
du -sh dist/

# Detailed size analysis
npx vite-bundle-visualizer

# Check individual chunks
ls -lh dist/renderer/assets/
```

### Test Performance

```bash
# Run tests with reporter
npm run test:run -- --reporter=verbose

# Time tests
time npm run test:run

# Profile E2E tests
npx playwright test --trace on
```

## Environment Variables

### Setting for Local Testing

```bash
# Linux/macOS
export CI=true
npm run test:run

# Windows (PowerShell)
$env:CI = "true"
npm run test:run

# Windows (CMD)
set CI=true
npm run test:run

# One-time use
CI=true npm run test:run
```

### Common Environment Variables

```bash
CI=true                              # Enable CI mode
NODE_ENV=production                  # Production build
DEBUG=playwright:*                   # Playwright debug logs
ELECTRON_ENABLE_LOGGING=1           # Electron debug logs
npm_config_build_from_source=true   # Rebuild native modules
```

## Troubleshooting Commands

### Check Node/npm Versions

```bash
node --version                       # Should be 20.x
npm --version
npx --version
```

### Check Electron

```bash
npx electron --version               # Should be 33.4.11
npm list electron
```

### Check Playwright

```bash
npx playwright --version             # Should be 1.56.1
npm list playwright @playwright/test
```

### Reset Everything

```bash
# Nuclear option - reset everything
git clean -fdx                       # Remove all untracked files
rm -rf node_modules/
npm ci
npm run build
npm run test:run
```

### Check GitHub CLI

```bash
gh --version
gh auth status
gh repo view
```

## Useful Aliases

Add these to your shell profile (.bashrc, .zshrc, etc.):

```bash
# Test aliases
alias test='npm run test:run'
alias testw='npm run test:watch'
alias testc='npm run test:coverage'
alias teste='npm run test:e2e'

# Build aliases
alias build='npm run build'
alias dev='npm run dev'

# Lint aliases
alias lint='npm run lint'
alias typecheck='npx tsc --noEmit'

# CI aliases
alias ci-status='gh pr checks'
alias ci-logs='gh run view --log-failed'
alias ci-watch='gh run watch'

# Git aliases
alias gp='git push'
alias gpl='git pull'
alias gst='git status'
```

## GitHub CLI Setup

```bash
# Install GitHub CLI
# macOS
brew install gh

# Linux (Debian/Ubuntu)
curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | sudo dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | sudo tee /etc/apt/sources.list.d/github-cli.list > /dev/null
sudo apt update
sudo apt install gh

# Windows (Chocolatey)
choco install gh

# Login
gh auth login

# Set default repo
gh repo set-default snowdroog/DeepResearch
```

## Quick Reference Card

```bash
# Pre-push checklist
npm run lint && npx tsc --noEmit && npm run test:run && npm run test:e2e && npm run build

# Push and create PR
git push -u origin $(git branch --show-current)
gh pr create --fill

# Watch CI
gh run watch

# Check results
gh pr checks
```

---

**Tip**: Save these commands in your terminal history or create scripts for frequently used combinations.

**Documentation**: For more details, see `.github/workflows/README.md`
