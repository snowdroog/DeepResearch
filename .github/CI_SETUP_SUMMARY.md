# CI/CD Setup Summary for DeepResearch

## Overview

Comprehensive GitHub Actions CI/CD pipelines have been configured for the DeepResearch Electron application. The setup includes automated testing, building, security scanning, and dependency management.

## Files Created

### 1. Workflows (`.github/workflows/`)

#### `test.yml` - Comprehensive Testing Workflow
**Purpose**: Run all tests on every push and pull request

**Jobs**:
- **Lint & Type Check**: ESLint + TypeScript validation on Ubuntu
- **Unit Tests**: Vitest tests on Linux/macOS/Windows with coverage
- **E2E Tests**: Playwright tests on all platforms with artifact upload
- **Coverage Report**: Aggregates coverage and prepares for upload
- **Test Summary**: Provides overall test status

**Key Features**:
- Multi-platform testing (Linux, macOS, Windows)
- Proper handling of native modules (better-sqlite3)
- Coverage report generation and upload
- E2E test videos on failure
- Headless display support for Linux (xvfb)
- 15-minute timeout for E2E tests
- Artifact retention: 7 days

#### `build.yml` - Build Validation Workflow
**Purpose**: Verify builds and optionally create packages

**Jobs**:
- **Build App**: Compile TypeScript and build Vite app on all platforms
- **Package App**: Create distributable installers (main branch only)
- **Build Summary**: Overall build status

**Key Features**:
- Multi-platform builds
- Build verification checks
- Size reporting
- Package creation (AppImage, dmg, NSIS)
- Artifact retention: 7-14 days
- Conditional packaging to save CI minutes

#### `codeql.yml` - Security Scanning Workflow
**Purpose**: Automated security analysis

**Features**:
- JavaScript/TypeScript security scanning
- Weekly scheduled scans (Mondays 6 AM UTC)
- Runs on push/PR to main/develop
- Integrates with GitHub Security tab

### 2. Configuration Files

#### `dependabot.yml` - Automated Dependency Updates
**Features**:
- Weekly npm dependency updates (Mondays 9 AM)
- GitHub Actions updates
- Grouped updates for related packages:
  - Electron packages
  - Testing libraries
  - TypeScript tools
  - UI libraries
  - Build tools
- Automatic PR creation with labels

#### `PULL_REQUEST_TEMPLATE.md` - PR Template
**Features**:
- Structured PR descriptions
- Testing checklist
- CI/CD verification checklist
- Type of change categorization

### 3. Documentation

#### `workflows/README.md` - Comprehensive CI Documentation
**Includes**:
- Workflow descriptions
- Caching strategy
- Native module handling
- Environment variables
- Troubleshooting guide
- Recommendations for improvements

## Quick Start

### Viewing CI Results

After pushing code:
1. Go to your repository on GitHub
2. Click the "Actions" tab
3. Select the workflow run to view results

### Adding Status Badges

Add to your `README.md`:

```markdown
![Test](https://github.com/snowdroog/DeepResearch/workflows/Test/badge.svg)
![Build](https://github.com/snowdroog/DeepResearch/workflows/Build/badge.svg)
![CodeQL](https://github.com/snowdroog/DeepResearch/workflows/CodeQL%20Security%20Scan/badge.svg)
```

### Enabling Codecov (Optional)

1. Sign up at [codecov.io](https://codecov.io)
2. Add your repository
3. Get `CODECOV_TOKEN`
4. Add to GitHub Secrets: Settings → Secrets → Actions
5. Uncomment Codecov section in `test.yml`

## CI Workflow Triggers

### test.yml
- ✅ Push to main/develop
- ✅ Pull requests to main/develop

### build.yml
- ✅ Push to main/develop
- ✅ Pull requests to main/develop
- ✅ Manual trigger via Actions tab

**Note**: Packaging only runs on main branch or manual trigger

### codeql.yml
- ✅ Push to main/develop
- ✅ Pull requests to main/develop
- ✅ Weekly schedule (Mondays 6 AM UTC)

## Platform-Specific Notes

### Linux (Ubuntu)
- Installs build tools, Python 3, and X11 dependencies
- Uses `xvfb` for headless E2E testing
- Packages as AppImage and deb

### macOS
- Verifies Xcode command line tools
- Supports x64 and arm64 builds
- Packages as dmg and zip
- Code signing disabled (no certificates)

### Windows
- Attempts to install windows-build-tools
- Packages as NSIS installer and portable exe
- May show warnings for build tools (non-critical)

## Native Module Handling

The workflows handle `better-sqlite3` compilation:

1. Install platform-specific build tools
2. Run `npm ci` with `npm_config_build_from_source=true`
3. Native modules rebuild for current platform

## Artifact Management

### Test Artifacts (7 days retention)
- Coverage reports (renderer + main)
- E2E test results
- Playwright HTML reports
- Test videos (failures only)

### Build Artifacts (7 days retention)
- Compiled dist/ directories
- Platform-specific builds

### Package Artifacts (14 days retention)
- Electron installers
- Platform-specific packages

## Cost Optimization

Current setup is optimized for free GitHub Actions:

1. **Selective packaging**: Only on main branch
2. **Smart caching**: npm packages cached
3. **Parallel jobs**: Tests run concurrently
4. **Artifact cleanup**: Automatic 7-14 day retention

## Recommended Next Steps

### Immediate Actions

1. **Push to GitHub** to trigger first CI run
2. **Review first run results** in Actions tab
3. **Set up branch protection**:
   - Settings → Branches → Add rule
   - Require status checks to pass
   - Require PR reviews

### Optional Enhancements

1. **Enable Codecov** for coverage visualization
2. **Configure code signing** for macOS/Windows
3. **Set up auto-releases** on version tags
4. **Add performance budgets** for bundle size
5. **Integrate Snyk** for security scanning

### Monitoring

Watch for:
- ❌ Failed test runs
- ⚠️ Dependabot PRs (weekly)
- 🔒 CodeQL alerts (Security tab)
- 📊 Coverage trends

## Troubleshooting

### Common Issues

#### Native Module Compilation Fails
**Solution**: Check platform-specific dependencies in workflow

#### E2E Tests Timeout
**Solution**: Increase timeout in `playwright.config.ts` or workflow

#### Build Size Too Large
**Solution**: Check build reports, consider code splitting

#### Package Job Doesn't Run
**Reason**: Intentional - only runs on main branch

## Environment Variables Reference

| Variable | Purpose | Used In |
|----------|---------|---------|
| `CI` | Enable CI mode | All workflows |
| `NODE_ENV` | Set production mode | Build workflow |
| `GH_TOKEN` | GitHub token for releases | Package job |
| `npm_config_build_from_source` | Rebuild native modules | All workflows |
| `CODECOV_TOKEN` | Codecov API token | Coverage job (optional) |

## Support and Maintenance

### Updating Workflows

To modify workflows:
1. Edit YAML files in `.github/workflows/`
2. Validate with: `npx js-yaml <file>.yml`
3. Test with: Push to a test branch first

### Debugging Failed Runs

1. Click on failed job in Actions tab
2. Expand failed step
3. Review logs and error messages
4. Check artifact uploads for more details

### Getting Help

- GitHub Actions docs: https://docs.github.com/actions
- Electron docs: https://www.electronjs.org/docs/latest/
- Playwright docs: https://playwright.dev/
- Vitest docs: https://vitest.dev/

## Version Information

- **Created**: 2025-10-21
- **Node.js**: 20.x
- **Electron**: 33.4.11
- **Vitest**: 1.2.0
- **Playwright**: 1.56.1
- **GitHub Actions**: v4 (latest)

---

**Setup Status**: ✅ Complete and ready for use

For detailed information about each workflow, see `.github/workflows/README.md`
