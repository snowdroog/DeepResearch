# DeepResearch Deployment Guide

Complete guide for building, signing, and distributing DeepResearch across macOS, Windows, and Linux platforms.

---

## Table of Contents

- [Prerequisites](#prerequisites)
- [Building for Production](#building-for-production)
- [Platform-Specific Builds](#platform-specific-builds)
- [Code Signing](#code-signing)
- [Publishing Releases](#publishing-releases)
- [Auto-Updates](#auto-updates)
- [CI/CD Integration](#cicd-integration)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Tools

**All Platforms:**
- Node.js 18+ ([Download](https://nodejs.org/))
- Git ([Download](https://git-scm.com/))
- GitHub account (for releases)

**Platform-Specific:**

**macOS:**
- Xcode Command Line Tools: `xcode-select --install`
- Apple Developer account (for code signing, optional)

**Windows:**
- Windows SDK (for building NSIS installers)
- Code signing certificate (optional)

**Linux:**
- Standard build tools: `sudo apt-get install build-essential`
- For AppImage: `sudo apt-get install fuse libfuse2`

### Install Dependencies

```bash
npm install
```

---

## Building for Production

### Full Build Process

```bash
# 1. Clean previous builds
rm -rf dist release

# 2. Build for all platforms
npm run build
```

This command:
1. Compiles TypeScript to JavaScript
2. Builds Vite/React production bundle
3. Creates Electron distributables for current platform

### Build Output

Build artifacts are placed in the `release/` directory:

```
release/
├── DeepResearch-0.1.0.dmg          # macOS installer
├── DeepResearch-0.1.0-mac.zip      # macOS app archive
├── DeepResearch Setup 0.1.0.exe    # Windows installer
├── DeepResearch 0.1.0.exe          # Windows portable
├── DeepResearch-0.1.0.AppImage     # Linux AppImage
├── deepresearch_0.1.0_amd64.deb    # Debian package
├── latest.yml                      # Update metadata (macOS/Windows)
├── latest-linux.yml                # Update metadata (Linux)
└── builder-*.yaml                  # Build configuration snapshots
```

---

## Platform-Specific Builds

### Build for macOS

```bash
# On macOS
npm run build -- --mac

# Build specific formats
npm run build -- --mac dmg         # DMG only
npm run build -- --mac zip         # ZIP only
npm run build -- --mac dmg zip     # Both
```

**Outputs:**
- `DeepResearch-{version}.dmg` - Disk image installer
- `DeepResearch-{version}-mac.zip` - Standalone app archive

### Build for Windows

```bash
# On Windows (or using Wine on macOS/Linux)
npm run build -- --win

# Build specific formats
npm run build -- --win nsis        # Installer only
npm run build -- --win portable    # Portable exe only
npm run build -- --win nsis portable  # Both
```

**Outputs:**
- `DeepResearch Setup {version}.exe` - NSIS installer
- `DeepResearch {version}.exe` - Portable executable

**Cross-Platform Note:** You can build Windows apps on macOS/Linux using Wine:
```bash
# Install Wine (macOS)
brew install wine-stable

# Build Windows app from macOS/Linux
npm run build -- --win
```

### Build for Linux

```bash
# On Linux (or Docker on macOS/Windows)
npm run build -- --linux

# Build specific formats
npm run build -- --linux AppImage  # AppImage only
npm run build -- --linux deb       # Debian package only
npm run build -- --linux AppImage deb  # Both
```

**Outputs:**
- `DeepResearch-{version}.AppImage` - Universal Linux binary
- `deepresearch_{version}_amd64.deb` - Debian/Ubuntu package

**Cross-Platform Note:** Build Linux apps from any platform using Docker:
```bash
docker run --rm -ti \
  --env ELECTRON_CACHE="/root/.cache/electron" \
  --env ELECTRON_BUILDER_CACHE="/root/.cache/electron-builder" \
  -v ${PWD}:/project \
  -v ~/.cache/electron:/root/.cache/electron \
  -v ~/.cache/electron-builder:/root/.cache/electron-builder \
  electronuserland/builder:wine \
  npm run build -- --linux
```

---

## Code Signing

Code signing ensures users that the application comes from a trusted source and hasn't been tampered with.

### macOS Code Signing

**Requirements:**
- Apple Developer account ($99/year)
- Developer ID Application certificate
- Developer ID Installer certificate (for pkg)

**Setup:**

1. **Get Certificates:**
   - Log in to [Apple Developer Portal](https://developer.apple.com/account/)
   - Navigate to Certificates, Identifiers & Profiles
   - Create "Developer ID Application" certificate
   - Download and install in Keychain Access

2. **Configure Signing:**

   Set environment variables:
   ```bash
   export CSC_LINK="/path/to/certificate.p12"  # Certificate file
   export CSC_KEY_PASSWORD="your-password"      # Certificate password
   export APPLE_ID="your@email.com"             # Apple ID for notarization
   export APPLE_ID_PASSWORD="app-specific-password"  # App-specific password
   ```

   Or create `.env` file:
   ```
   CSC_LINK=/path/to/certificate.p12
   CSC_KEY_PASSWORD=your-password
   APPLE_ID=your@email.com
   APPLE_ID_PASSWORD=app-specific-password
   ```

3. **Build with Signing:**
   ```bash
   npm run build -- --mac
   ```

4. **Notarization (automatic):**
   - electron-builder automatically notarizes the app
   - Apple checks the app for malware
   - Takes 5-30 minutes
   - Users won't see "unidentified developer" warning

**Verify Signing:**
```bash
codesign --verify --deep --strict --verbose=2 release/mac/DeepResearch.app
spctl -a -vvv -t install release/DeepResearch-0.1.0.dmg
```

### Windows Code Signing

**Requirements:**
- Code signing certificate (from DigiCert, Sectigo, etc.)
- Certificate in PFX/P12 format

**Setup:**

1. **Get Certificate:**
   - Purchase from certificate authority (~ $100-500/year)
   - Download in PFX format
   - Install on build machine

2. **Configure Signing:**

   Set environment variables:
   ```bash
   export WIN_CSC_LINK="/path/to/certificate.pfx"
   export WIN_CSC_KEY_PASSWORD="your-password"
   ```

3. **Build with Signing:**
   ```bash
   npm run build -- --win
   ```

**Verify Signing:**
```bash
# On Windows
signtool verify /pa "release\DeepResearch Setup 0.1.0.exe"
```

### Linux Signing

Linux doesn't require code signing, but you can sign packages:

**GPG Signing (Debian packages):**
```bash
# Generate GPG key
gpg --gen-key

# Sign package
dpkg-sig --sign builder deepresearch_0.1.0_amd64.deb
```

---

## Publishing Releases

### GitHub Releases

DeepResearch uses GitHub Releases for distribution and auto-updates.

#### Setup

1. **Update package.json:**
   Already configured with:
   ```json
   "repository": {
     "type": "git",
     "url": "https://github.com/yourusername/DeepResearch.git"
   },
   "build": {
     "publish": {
       "provider": "github",
       "owner": "yourusername",
       "repo": "DeepResearch"
     }
   }
   ```

2. **Create GitHub Token:**
   - Go to GitHub Settings → Developer Settings → Personal Access Tokens
   - Generate new token (classic)
   - Select scopes: `repo` (all), `write:packages`
   - Copy token

3. **Set Token:**
   ```bash
   export GH_TOKEN="your-github-token"
   ```

#### Publishing a Release

**Option 1: Manual Publish**

1. **Build the app:**
   ```bash
   npm run build
   ```

2. **Publish to GitHub:**
   ```bash
   npm run electron:build -- --publish always
   ```

   This:
   - Creates a GitHub release
   - Uploads all build artifacts
   - Generates update metadata files

**Option 2: Version Bump & Publish**

```bash
# Update version
npm version patch  # 0.1.0 → 0.1.1
# or
npm version minor  # 0.1.0 → 0.2.0
# or
npm version major  # 0.1.0 → 1.0.0

# Build and publish
npm run build
npm run electron:build -- --publish always
```

**Option 3: Draft Release**

Publish as draft (review before making public):
```bash
npm run electron:build -- --publish always --config.publish.releaseType=draft
```

Then go to GitHub Releases and edit the draft to publish.

#### Release Checklist

Before publishing:
- [ ] Update version in `package.json`
- [ ] Update `CHANGELOG.md` with changes
- [ ] Test the build locally
- [ ] Ensure code is pushed to GitHub
- [ ] Verify GitHub token is set
- [ ] Check code signing (if applicable)
- [ ] Review release notes
- [ ] Tag the release in Git

---

## Auto-Updates

DeepResearch includes automatic update checking using `electron-updater`.

### How It Works

1. **On app launch** (and every 4 hours):
   - App checks GitHub Releases for newer version
   - Compares with current version

2. **If update available:**
   - Downloads update in background
   - Shows notification to user

3. **When download complete:**
   - Prompts user to restart and install
   - Or installs on next app quit

### Configuration

Auto-updater is configured in `src/main/updater/AutoUpdater.ts`:

```typescript
const updater = createUpdater({
  autoDownload: true,           // Auto-download updates
  autoInstallOnAppQuit: true,   // Install on quit
  checkOnStartup: true,          // Check on launch
  checkInterval: 4 * 60 * 60 * 1000,  // Check every 4 hours
  allowPrerelease: false,        // Exclude beta versions
})
```

### Update Channels

**Stable (default):**
- Only stable releases (e.g., 1.0.0, 1.1.0)
- Recommended for production users

**Beta/Prerelease:**
Set `allowPrerelease: true` to receive:
- Beta versions (e.g., 1.0.0-beta.1)
- Alpha versions (e.g., 1.0.0-alpha.1)

### Testing Updates

1. **Publish test version:**
   ```bash
   npm version prerelease --preid=beta
   npm run electron:build -- --publish always
   ```

2. **Enable prerelease in app:**
   ```typescript
   allowPrerelease: true
   ```

3. **Test update flow:**
   - Launch app
   - Wait for update check
   - Verify download and install prompt

### Disabling Updates

For development or internal builds:

```typescript
// In src/main/index.ts
if (process.env.NODE_ENV !== 'development') {
  // Auto-updater only runs in production
  const updater = createUpdater(...)
  updater.start()
}
```

---

## CI/CD Integration

### GitHub Actions

Create `.github/workflows/build.yml`:

```yaml
name: Build and Release

on:
  push:
    tags:
      - 'v*'

jobs:
  release:
    runs-on: ${{ matrix.os }}

    strategy:
      matrix:
        os: [macos-latest, windows-latest, ubuntu-latest]

    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Build and publish
        env:
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          # macOS signing (optional)
          CSC_LINK: ${{ secrets.CSC_LINK }}
          CSC_KEY_PASSWORD: ${{ secrets.CSC_KEY_PASSWORD }}
          APPLE_ID: ${{ secrets.APPLE_ID }}
          APPLE_ID_PASSWORD: ${{ secrets.APPLE_ID_PASSWORD }}
          # Windows signing (optional)
          WIN_CSC_LINK: ${{ secrets.WIN_CSC_LINK }}
          WIN_CSC_KEY_PASSWORD: ${{ secrets.WIN_CSC_KEY_PASSWORD }}
        run: |
          npm run build
          npm run electron:build -- --publish always
```

**Usage:**

1. Push a version tag:
   ```bash
   git tag v0.1.0
   git push origin v0.1.0
   ```

2. GitHub Actions:
   - Builds for all platforms
   - Signs apps (if secrets configured)
   - Creates GitHub release
   - Uploads artifacts

3. Users receive auto-update notification

### Secrets Configuration

In GitHub repository settings (Settings → Secrets):

- `GITHUB_TOKEN` (automatically provided)
- `CSC_LINK` (base64-encoded macOS certificate)
- `CSC_KEY_PASSWORD`
- `APPLE_ID`
- `APPLE_ID_PASSWORD`
- `WIN_CSC_LINK` (base64-encoded Windows certificate)
- `WIN_CSC_KEY_PASSWORD`

**Encode certificate for secrets:**
```bash
# macOS
base64 -i certificate.p12 | pbcopy

# Linux
base64 certificate.p12 | xclip -selection clipboard
```

---

## Troubleshooting

### Common Build Issues

#### "Command failed: electron-builder"

**Cause:** Missing dependencies or incorrect configuration

**Solution:**
```bash
rm -rf node_modules package-lock.json
npm install
npm run build
```

#### "Code signing failed"

**Cause:** Invalid certificate or password

**Solution:**
- Verify certificate is installed in Keychain (macOS)
- Check `CSC_LINK` and `CSC_KEY_PASSWORD` are correct
- Ensure certificate hasn't expired

#### "Notarization failed"

**Cause:** Apple rejected the app

**Solution:**
- Check notarization log: `xcrun altool --notarization-history 0 -u "your@email.com"`
- Fix reported issues (usually entitlements or unsigned binaries)
- Rebuild and retry

### Platform-Specific Issues

#### macOS: "App is damaged and can't be opened"

**Cause:** Gatekeeper blocking unsigned app

**Solution:**
- Sign the app with Developer ID
- Or tell users to right-click → Open (first time only)

#### Windows: "Windows protected your PC"

**Cause:** Unsigned application

**Solution:**
- Sign with valid code signing certificate
- Or tell users to click "More info" → "Run anyway"

#### Linux: "Permission denied"

**Cause:** AppImage not executable

**Solution:**
```bash
chmod +x DeepResearch-0.1.0.AppImage
./DeepResearch-0.1.0.AppImage
```

### Build Performance

**Slow builds?**

1. **Disable code signing in development:**
   ```json
   "build": {
     "mac": {
       "identity": null
     }
   }
   ```

2. **Build for current platform only:**
   ```bash
   npm run build -- --mac  # Instead of --mac --win --linux
   ```

3. **Use build cache:**
   electron-builder caches downloads in `~/.cache/electron-builder`

### Auto-Update Issues

#### "Updates not detected"

**Check:**
- Is app running in production mode? (not development)
- Is `GH_TOKEN` set during build?
- Are `latest.yml` files in the release?
- Is the version number higher than current?

#### "Download fails"

**Check:**
- GitHub release is public (not draft)
- Files are attached to release
- Network connectivity
- Firewall/antivirus not blocking

---

## Distribution Best Practices

### Version Numbering

Follow semantic versioning (semver):
- **Major (1.x.x):** Breaking changes
- **Minor (x.1.x):** New features (backwards compatible)
- **Patch (x.x.1):** Bug fixes

### Release Notes

Include in every release:
- **What's New:** New features
- **Improvements:** Enhancements
- **Bug Fixes:** Fixed issues
- **Known Issues:** Outstanding problems

### Testing Before Release

1. **Build locally** and test on all platforms
2. **Test auto-update** from previous version
3. **Verify code signing** (no warnings)
4. **Check file sizes** (reasonable for download)
5. **Test installation** (fresh install + upgrade)

### Release Frequency

Recommended:
- **Patch releases:** As needed for critical bugs
- **Minor releases:** Monthly or bi-monthly
- **Major releases:** Annually or when significant changes

---

## Further Reading

- [electron-builder Documentation](https://www.electron.build/)
- [electron-updater Guide](https://www.electron.build/auto-update)
- [Apple Code Signing Guide](https://developer.apple.com/support/code-signing/)
- [Windows Code Signing](https://docs.microsoft.com/en-us/windows-hardware/drivers/dashboard/code-signing-cert-manage)

---

**Questions?** [Open an issue](https://github.com/yourusername/DeepResearch/issues) or [start a discussion](https://github.com/yourusername/DeepResearch/discussions)
