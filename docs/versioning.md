# Versioning & Publishing Guide

Complete guide for managing versions and publishing the `@hanivanrizky/nestjs-xpath-parser` package.

## Table of Contents

- [Semantic Versioning](#semantic-versioning)
- [Version Management Tools](#version-management-tools)
- [Release Workflow](#release-workflow)
- [Version Bump Examples](#version-bump-examples)
- [Publishing](#publishing)
- [Troubleshooting](#troubleshooting)

## Semantic Versioning

This project follows [Semantic Versioning 2.0.0](https://semver.org/):

```
MAJOR.MINOR.PATCH

1.0.0
│ │ └─ PATCH: Bug fixes (backward compatible)
│ └─── MINOR: New features (backward compatible)
└───── MAJOR: Breaking changes
```

### Version Change Guidelines

#### PATCH (1.0.**0** → 1.0.**1**)

Use for **bug fixes** that are backward compatible:

- Fixed XPath extraction issues
- Fixed data cleaning pipe bugs
- Fixed memory leaks
- Fixed documentation errors
- Performance improvements (no API changes)

**Example:**

```bash
yarn version:patch
# 1.0.0 → 1.0.1
```

#### MINOR (1.**0**.0 → 1.**1**.0)

Use for **new features** that are backward compatible:

- New pipe transformations
- New XPath validation features
- Additional metadata options
- New service methods
- Enhanced functionality

**Example:**

```bash
yarn version:minor
# 1.0.0 → 1.1.0
```

#### MAJOR (**1**.0.0 → **2**.0.0)

Use for **breaking changes**:

- Removed or renamed methods
- Changed method signatures
- Modified default behavior
- Updated peer dependencies
- Changed pattern structure

**Example:**

```bash
yarn version:major
# 1.0.0 → 2.0.0
```

## Version Management Tools

### Version Control Script

Interactive script for version management:

```bash
# Interactive menu
yarn version
# or
./scripts/version.sh

# Direct commands
yarn version:patch   # Bump patch version
yarn version:minor   # Bump minor version
yarn version:major   # Bump major version
```

### What the Version Script Does

1. Shows current version
2. Calculates next version based on selection
3. Confirms before making changes
4. Updates `package.json`
5. Optionally creates git commit and tag
6. Asks if you want to bump again (useful for multiple releases)

## Release Workflow

### Recommended Complete Workflow

Follow this workflow for a clean release process:

```bash
# Step 1: Make your code changes
# Edit source code, fix bugs, add features...

# Step 2: Commit and push code changes
git add .
git commit -m "feat: add new feature"
git push origin main

# Step 3: Bump version (creates separate commit + tag)
yarn version:patch   # or version:minor, version:major

# Step 4: Push the version tag
git push --tags

# Step 5: Create GitHub release
yarn release

# Step 6: Publish to npm
yarn publish:auto
```

### Why This Order?

| Step | Command                   | What Happens                                     |
| ---- | ------------------------- | ------------------------------------------------ |
| 1-2  | `git commit` & `git push` | Your code changes are in git history             |
| 3    | `yarn version:patch`      | Bumps version, creates separate commit + git tag |
| 4    | `git push --tags`         | Pushes the version tag to remote                 |
| 5    | `yarn release`            | Creates GitHub release from the tag              |
| 6    | `yarn publish:auto`       | Builds, tests, and publishes to npm              |

**Important:** Code changes and version bumps should always be in separate commits. This keeps your git history clean and makes it easy to see what changed between versions.

### Workflow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    Development Cycle                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. Make Code Changes                                       │
│     ├─ Edit source code                                     │
│     ├─ Write tests                                         │
│     └─ Update docs                                         │
│                                                             │
│  2. Commit & Push Code                                      │
│     ├─ git add .                                           │
│     ├─ git commit -m "feat: description"                   │
│     └─ git push                                            │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                     Release Cycle                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  3. Bump Version                                            │
│     ├─ yarn version:patch/minor/major                      │
│     ├─ Creates commit: "chore(release): bump version..."   │
│     └─ Creates git tag: v1.0.1                             │
│                                                             │
│  4. Push Tags                                               │
│     └─ git push --tags                                     │
│                                                             │
│  5. Create Release                                          │
│     ├─ yarn release                                        │
│     ├─ Creates GitHub release                              │
│     └─ Extracts notes from CHANGELOG.md                    │
│                                                             │
│  6. Publish                                                 │
│     ├─ yarn publish:auto                                   │
│     ├─ Builds project                                      │
│     ├─ Runs tests                                          │
│     └─ Publishes to npm                                    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Available Scripts

| Script               | Description                                 |
| -------------------- | ------------------------------------------- |
| `yarn version`       | Interactive version menu                    |
| `yarn version:patch` | Bump patch version                          |
| `yarn version:minor` | Bump minor version                          |
| `yarn version:major` | Bump major version                          |
| `yarn release`       | Create git tag + GitHub release             |
| `yarn publish:auto`  | Automated publish to npm                    |
| `yarn publish:dry`   | Preview publish without actually publishing |
| `yarn pack`          | Create tarball for testing                  |

## Version Bump Examples

### Bug Fix Release

```bash
# Scenario: Fixed XPath attribute extraction bug

# 1. Make the fix
# Edit source code...

# 2. Test the fix
yarn test

# 3. Commit code changes
git add .
git commit -m "fix: xpath attribute extraction bug"
git push

# 4. Bump patch version
yarn version:patch
# Output: 1.0.0 → 1.0.1

# 5. Push tag
git push --tags

# 6. Create release
yarn release

# 7. Publish to npm
yarn publish:auto
```

### Feature Release

```bash
# Scenario: Added new pipe transformation

# 1. Implement feature
# Edit source code...

# 2. Test
yarn test

# 3. Commit code changes
git add .
git commit -m "feat: add truncate pipe"
git push

# 4. Bump minor version
yarn version:minor
# Output: 1.0.0 → 1.1.0

# 5. Update CHANGELOG.md
nano CHANGELOG.md
# Add:
# ## [1.1.0] - 2024-01-15
# ### Added
# - New `truncate` pipe for text truncation

# 6. Commit CHANGELOG
git add CHANGELOG.md
git commit -m "docs: update CHANGELOG for v1.1.0"
git push

# 7. Push version tag
git push --tags

# 8. Create release
yarn release

# 9. Publish
yarn publish:auto
```

### Breaking Change Release

```bash
# Scenario: Renamed service method

# 1. Make breaking changes
# Edit source code...

# 2. Update all examples and docs
# Update documentation...

# 3. Test
yarn test

# 4. Commit code changes
git add .
git commit -m "refactor: rename evaluateWebsite to extract"
git push

# 5. Bump major version
yarn version:major
# Output: 1.5.0 → 2.0.0

# 6. Update CHANGELOG.md
nano CHANGELOG.md
# Add:
# ## [2.0.0] - 2024-01-15
# ### Breaking Changes
# - Renamed `evaluateWebsite()` to `extract()`
# - Removed deprecated `meta.isPage` option
#
# ### Migration Guide
# Old: scraper.evaluateWebsite(...)
# New: scraper.extract(...)

# 7. Commit CHANGELOG
git add CHANGELOG.md
git commit -m "docs: update CHANGELOG for v2.0.0"
git push

# 8. Push tag & create release
git push --tags
yarn release

# 9. Publish
yarn publish:auto
```

## Publishing

### What Gets Published

The package includes:

```
dist/                # Compiled JavaScript
├── *.js            # Main files
├── *.d.ts          # TypeScript definitions
├── *.js.map        # Source maps
└── examples/       # Example files (source + compiled)

package.json         # Package metadata
README.md           # Documentation
docs/               # Additional docs
```

Excluded files (see `.npmignore`):

- Source TypeScript files (except examples)
- Test files
- Build configurations
- Development scripts
- `.git`, `.github`, etc.

### Pack Without Publishing

Create a tarball without publishing to npm:

```bash
yarn pack

# Creates: @hanivanrizky-nestjs-xpath-parser-VERSION.tgz

# Test locally
cd /path/to/test-project
npm install ../path/to/@hanivanrizky-nestjs-xpath-parser-VERSION.tgz
```

### Dry Run Publishing

Preview what will be published:

```bash
yarn publish:dry

# or
./scripts/publish-auto.sh --dry-run
```

### Publish to NPM

```bash
# Full automated publish with all checks
yarn publish:auto

# or native npm publish
yarn publish
```

### What `yarn publish:auto` Does

1. ✅ Checks npm authentication
2. ✅ Verifies version doesn't exist on npm
3. ✅ Offers to bump version if needed
4. ✅ Cleans and builds project
5. ✅ Runs tests
6. ✅ Shows package contents preview
7. ✅ Publishes to npm with public access

### Access Level

The package is configured for public access:

```json
// package.json
{
  "publishConfig": {
    "access": "public"
  }
}
```

## Troubleshooting

### Version Already Exists on npm

```bash
Error: Version 0.1.1 already exists on npm
```

**Solution:** The `publish:auto` script will offer to bump the version automatically. Select option 1, 2, or 3 to bump.

Or manually bump:

```bash
yarn version:patch
```

### Build Failed Before Publishing

```bash
Error: Build failed!
```

**Solution:** Fix build errors before publishing

```bash
# Check build errors
yarn build

# Fix issues, then retry
yarn publish:auto
```

### Tests Failed

```bash
Error: Tests failed!
Continue anyway? [y/N]:
```

**Solution:**

- If tests are failing for valid reasons: Fix tests first
- If tests are temporarily broken: Press `y` to continue (not recommended)

### Package Too Large

```bash
Warning: Package size is larger than recommended
```

**Solution:** Check `.npmignore` and ensure only necessary files are included

```bash
# Preview package contents
npm pack --dry-run

# Check for large files
du -sh dist/
```

### Git Tag Already Exists

```bash
Error: Tag v0.1.1 already exists
```

**Solution:** The release script will offer to delete and recreate the tag.

Or manually:

```bash
git tag -d v0.1.1
git push origin :refs/tags/v0.1.1
```

## Best Practices

### 1. Always Test Before Publishing

```bash
yarn test
yarn build
```

### 2. Update CHANGELOG

Document changes for users:

```markdown
## [1.1.0] - 2024-01-15

### Added

- New features here

### Fixed

- Bug fixes here

### Changed

- Modifications here
```

### 3. Separate Code and Version Commits

Always keep code changes and version bumps in separate commits:

```bash
# Good:
git commit -m "feat: add feature"     # Code changes
yarn version:patch                    # Version bump (separate commit)

# Bad:
git add .
git commit -m "feat: add feature and bump version"  # Mixed
```

### 4. Use Git Tags

Always tag releases:

```bash
git push --tags
```

### 5. Verify Tarball Contents

Check the tarball before publishing:

```bash
yarn pack
tar -tzf @hanivanrizky-nestjs-xpath-parser-1.0.1.tgz | head -50
```

### 6. Test Published Package

After publishing, test installation:

```bash
# In a separate test project
npm install @hanivanrizky/nestjs-xpath-parser@1.0.1
```

### 7. Create GitHub Releases

Use `yarn release` to create GitHub releases with proper notes extracted from CHANGELOG.md.

## Quick Reference

```bash
# Development
git add .
git commit -m "feat: description"
git push

# Release
yarn version:patch
git push --tags
yarn release
yarn publish:auto
```

## Related Documentation

- [API Reference](./api-reference.md) - Service API documentation
- [README](../README.md) - Main project documentation
