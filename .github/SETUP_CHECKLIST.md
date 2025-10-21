# CI/CD Setup Checklist

Use this checklist to ensure your CI/CD pipeline is properly configured and working.

## Pre-Push Checklist

Before pushing to GitHub, verify locally:

- [ ] **Install all dependencies**
  ```bash
  npm ci
  ```

- [ ] **Run linting**
  ```bash
  npm run lint
  ```
  ✅ Expected: No errors

- [ ] **Check TypeScript compilation**
  ```bash
  npx tsc --noEmit
  ```
  ✅ Expected: No type errors

- [ ] **Run unit tests**
  ```bash
  npm run test:run
  ```
  ✅ Expected: All tests pass

- [ ] **Check test coverage**
  ```bash
  npm run test:coverage
  ```
  ✅ Expected: Coverage above 70% (or adjust thresholds in vitest.config.ts)

- [ ] **Run E2E tests**
  ```bash
  npm run test:e2e
  ```
  ✅ Expected: All E2E tests pass

- [ ] **Verify build**
  ```bash
  npm run build
  ```
  ✅ Expected: Build completes without errors

## Post-Push Checklist

After pushing to GitHub:

### 1. Verify Workflow Triggers

- [ ] Go to: https://github.com/snowdroog/DeepResearch/actions
- [ ] Verify "Test" workflow started
- [ ] Verify "Build" workflow started
- [ ] Verify "CodeQL" workflow started (if push to main/develop)

### 2. Monitor Test Workflow

- [ ] Click on "Test" workflow run
- [ ] Check "Lint & Type Check" job: ✅ Pass
- [ ] Check "Unit Tests" jobs (Linux, macOS, Windows): ✅ All pass
- [ ] Check "E2E Tests" jobs (Linux, macOS, Windows): ✅ All pass
- [ ] Check "Coverage Report" job: ✅ Pass
- [ ] Check "Test Summary" job: ✅ Pass

**If any fail:**
1. Click on the failed job
2. Expand the failed step
3. Review error logs
4. Fix issues locally
5. Push again

### 3. Monitor Build Workflow

- [ ] Click on "Build" workflow run
- [ ] Check "Build App" jobs (Linux, macOS, Windows): ✅ All pass
- [ ] Check "Build Summary" job: ✅ Pass
- [ ] Download build artifacts (optional)

**On main branch only:**
- [ ] Check "Package App" jobs: ✅ All pass
- [ ] Download packaged apps (optional)

### 4. Review Artifacts

- [ ] Go to workflow run summary
- [ ] Check for uploaded artifacts:
  - `coverage-renderer` (7 days)
  - `coverage-main` (7 days)
  - `e2e-results-*` (7 days)
  - `build-*` (7 days)
  - `package-*` (14 days, main branch only)

### 5. Check Coverage Reports

- [ ] Download `coverage-renderer` artifact
- [ ] Extract and open `index.html`
- [ ] Review renderer process coverage
- [ ] Download `coverage-main` artifact
- [ ] Extract and open `index.html`
- [ ] Review main process coverage

## First-Time Setup Checklist

### GitHub Repository Settings

- [ ] **Enable Actions**
  - Settings → Actions → General
  - Allow all actions and reusable workflows

- [ ] **Configure Branch Protection** (Recommended)
  - Settings → Branches → Add rule
  - Branch name pattern: `main`
  - ✅ Require status checks to pass before merging
  - ✅ Require branches to be up to date before merging
  - Select status checks:
    - `Lint & Type Check`
    - `Unit Tests (ubuntu-latest)`
    - `E2E Tests (ubuntu-latest)`
    - `Build App (ubuntu-latest)`

- [ ] **Configure Dependabot Alerts** (Recommended)
  - Settings → Security → Dependabot
  - ✅ Enable Dependabot alerts
  - ✅ Enable Dependabot security updates

- [ ] **Configure CodeQL** (Automatic)
  - Security → Code scanning
  - CodeQL will automatically populate after first run

### Optional: Codecov Integration

- [ ] Sign up at https://codecov.io
- [ ] Add repository to Codecov
- [ ] Copy `CODECOV_TOKEN`
- [ ] Add to GitHub Secrets:
  - Settings → Secrets → Actions → New repository secret
  - Name: `CODECOV_TOKEN`
  - Value: [paste token]
- [ ] Uncomment Codecov section in `.github/workflows/test.yml`
- [ ] Push to trigger updated workflow

### Optional: Auto-Release Configuration

- [ ] Decide on release strategy (semantic versioning?)
- [ ] Create release workflow (future enhancement)
- [ ] Configure electron-builder publishing
- [ ] Update repository URL in `package.json`

### Optional: Code Signing

For production releases:

**macOS:**
- [ ] Obtain Apple Developer certificate
- [ ] Add certificate to GitHub Secrets
- [ ] Update build workflow with signing config

**Windows:**
- [ ] Obtain code signing certificate
- [ ] Add certificate to GitHub Secrets
- [ ] Update build workflow with signing config

## Documentation Checklist

- [ ] **Add badges to README.md**
  - See `.github/BADGES.md` for examples
  - Add Test, Build, CodeQL badges

- [ ] **Document CI/CD process**
  - Link to `.github/workflows/README.md`
  - Explain workflow triggers
  - Document artifact access

- [ ] **Update CONTRIBUTING.md** (if exists)
  - Explain CI requirements
  - Link to PR template
  - Explain test requirements

## Maintenance Checklist

### Weekly

- [ ] **Review Dependabot PRs**
  - Check for new dependency updates
  - Review changes
  - Test locally if major updates
  - Merge if tests pass

- [ ] **Review CodeQL Alerts**
  - Security → Code scanning
  - Address any new security issues

### Monthly

- [ ] **Review test coverage trends**
  - Download coverage reports
  - Identify uncovered code
  - Add tests for critical paths

- [ ] **Clean up old artifacts**
  - Actions → Management (automatic after 7-14 days)

- [ ] **Review workflow efficiency**
  - Check average run times
  - Optimize slow jobs if needed

### Quarterly

- [ ] **Update workflow actions**
  - Check for new versions of actions
  - Review deprecation notices
  - Update action versions

- [ ] **Review CI costs** (if applicable)
  - Check GitHub Actions usage
  - Optimize workflows if approaching limits

## Troubleshooting Checklist

### Tests Failing in CI but Pass Locally

- [ ] Check Node.js version matches CI (20.x)
- [ ] Clear local cache: `rm -rf node_modules && npm ci`
- [ ] Check for platform-specific issues
- [ ] Review CI logs for environment differences

### E2E Tests Timing Out

- [ ] Increase timeout in `playwright.config.ts`
- [ ] Increase timeout in workflow (15 min default)
- [ ] Check for slow operations in tests
- [ ] Review test parallelization settings

### Native Module Build Failures

- [ ] Verify platform dependencies installed
- [ ] Check better-sqlite3 version compatibility
- [ ] Review build tool installation logs
- [ ] Try rebuilding locally: `npm rebuild better-sqlite3`

### Artifacts Not Uploading

- [ ] Check artifact paths in workflow
- [ ] Verify files exist after build/test
- [ ] Check GitHub Actions storage limits
- [ ] Review upload step logs

### Package Job Not Running

This is expected:
- Package job only runs on `main` branch
- Or when manually triggered via Actions tab
- To test: Push to main or manually trigger

## Security Checklist

- [ ] **Review security alerts**
  - Security → Dependabot alerts
  - Address critical/high severity issues

- [ ] **Enable secret scanning**
  - Settings → Security → Secret scanning
  - ✅ Enable secret scanning

- [ ] **Review CodeQL results**
  - Security → Code scanning
  - Address security findings

- [ ] **Protect sensitive data**
  - Never commit secrets to repository
  - Use GitHub Secrets for sensitive values
  - Review `.gitignore` for sensitive files

## Success Criteria

Your CI/CD is successfully configured when:

- ✅ All workflows run on push/PR
- ✅ All jobs complete successfully
- ✅ Badges show "passing" status
- ✅ Coverage reports are generated
- ✅ Artifacts are uploaded
- ✅ E2E tests pass on all platforms
- ✅ Builds succeed on all platforms
- ✅ No security alerts

## Getting Help

If you encounter issues:

1. **Check Documentation**
   - `.github/workflows/README.md`
   - `.github/CI_SETUP_SUMMARY.md`

2. **Review Logs**
   - Actions tab → Failed workflow → Failed job → Logs

3. **Search Issues**
   - GitHub Actions docs
   - Electron Builder docs
   - Playwright docs
   - Vitest docs

4. **Community Support**
   - GitHub Discussions
   - Stack Overflow
   - Electron Discord

## Next Steps

After completing this checklist:

1. **Create first PR** to test the full workflow
2. **Monitor CI results** over several runs
3. **Adjust thresholds** as needed (coverage, timeouts, etc.)
4. **Document learnings** for team members
5. **Set up notifications** for CI failures (optional)

---

**Last Updated**: 2025-10-21

**Status**: Ready for production use ✅
