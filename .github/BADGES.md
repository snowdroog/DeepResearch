# GitHub Badges for README

## Status Badges

Add these badges to the top of your `README.md` file to show build and test status:

### Basic Badges

```markdown
[![Test](https://github.com/snowdroog/DeepResearch/workflows/Test/badge.svg)](https://github.com/snowdroog/DeepResearch/actions/workflows/test.yml)
[![Build](https://github.com/snowdroog/DeepResearch/workflows/Build/badge.svg)](https://github.com/snowdroog/DeepResearch/actions/workflows/build.yml)
[![CodeQL](https://github.com/snowdroog/DeepResearch/workflows/CodeQL%20Security%20Scan/badge.svg)](https://github.com/snowdroog/DeepResearch/actions/workflows/codeql.yml)
```

### With Branch Specification

To show status for a specific branch (e.g., main):

```markdown
[![Test](https://github.com/snowdroog/DeepResearch/workflows/Test/badge.svg?branch=main)](https://github.com/snowdroog/DeepResearch/actions/workflows/test.yml)
[![Build](https://github.com/snowdroog/DeepResearch/workflows/Build/badge.svg?branch=main)](https://github.com/snowdroog/DeepResearch/actions/workflows/build.yml)
```

## Optional Badges

### Codecov Coverage Badge

After setting up Codecov:

```markdown
[![codecov](https://codecov.io/gh/snowdroog/DeepResearch/branch/main/graph/badge.svg)](https://codecov.io/gh/snowdroog/DeepResearch)
```

### License Badge

```markdown
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
```

### Node.js Version

```markdown
[![Node.js](https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen)](https://nodejs.org/)
```

### Electron Version

```markdown
[![Electron](https://img.shields.io/badge/electron-33.4.11-blue)](https://www.electronjs.org/)
```

### Platform Support

```markdown
[![Platform](https://img.shields.io/badge/platform-Linux%20%7C%20macOS%20%7C%20Windows-lightgrey)](https://github.com/snowdroog/DeepResearch)
```

## Example README Header

```markdown
# DeepResearch

[![Test](https://github.com/snowdroog/DeepResearch/workflows/Test/badge.svg)](https://github.com/snowdroog/DeepResearch/actions/workflows/test.yml)
[![Build](https://github.com/snowdroog/DeepResearch/workflows/Build/badge.svg)](https://github.com/snowdroog/DeepResearch/actions/workflows/build.yml)
[![CodeQL](https://github.com/snowdroog/DeepResearch/workflows/CodeQL%20Security%20Scan/badge.svg)](https://github.com/snowdroog/DeepResearch/actions/workflows/codeql.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Electron](https://img.shields.io/badge/electron-33.4.11-blue)](https://www.electronjs.org/)
[![Platform](https://img.shields.io/badge/platform-Linux%20%7C%20macOS%20%7C%20Windows-lightgrey)](https://github.com/snowdroog/DeepResearch)

> Multi-Provider AI Response Capture & Enrichment Tool

[Description of your project...]
```

## Custom Shields.io Badges

You can create custom badges at [shields.io](https://shields.io/):

### Dependencies Status

```markdown
[![Dependencies](https://img.shields.io/librariesio/github/snowdroog/DeepResearch)](https://libraries.io/github/snowdroog/DeepResearch)
```

### GitHub Release

```markdown
[![GitHub release](https://img.shields.io/github/release/snowdroog/DeepResearch.svg)](https://github.com/snowdroog/DeepResearch/releases)
```

### GitHub Issues

```markdown
[![GitHub issues](https://img.shields.io/github/issues/snowdroog/DeepResearch.svg)](https://github.com/snowdroog/DeepResearch/issues)
```

### GitHub Pull Requests

```markdown
[![GitHub pull requests](https://img.shields.io/github/issues-pr/snowdroog/DeepResearch.svg)](https://github.com/snowdroog/DeepResearch/pulls)
```

### Last Commit

```markdown
[![GitHub last commit](https://img.shields.io/github/last-commit/snowdroog/DeepResearch.svg)](https://github.com/snowdroog/DeepResearch/commits/main)
```

## Badge Colors

Badges automatically update their color based on status:
- 🟢 Green: Passing/Success
- 🔴 Red: Failing
- 🟡 Yellow: Pending/In Progress
- ⚫ Gray: No runs yet

## Refreshing Badges

Badges update automatically but may be cached:
- GitHub caches badges for a few minutes
- Hard refresh your browser (Ctrl+F5 / Cmd+Shift+R) to see latest
- Badges reflect the latest workflow run for the specified branch

## Preview

Before committing, you can preview badges by:
1. Creating a test PR
2. Waiting for workflows to run
3. Checking badge appearance in PR description
