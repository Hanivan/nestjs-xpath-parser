# Versioning Guide

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
6. Shows next steps

### Example Output

```bash
$ yarn version:patch

(^o^)/ Version Control Script
=============================

Package: @hanivanrizky/nestjs-xpath-parser
Current Version: 1.0.0

Version Summary
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Current Version: 1.0.0
New Version:     1.0.1

Bump version to 1.0.1? [y/N]: y

Updating Version
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

(・_・) Updating package.json...
(^_^) Version updated in package.json

Git Integration
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Create git commit and tag?
  1) Yes - Commit and tag
  2) No - Skip git operations

Select option [1-2]: 1

(>_<) Creating git commit...
(>_<) Creating git tag...
(^_^) Git commit and tag created

To push to remote:
  git push origin main
  git push origin v1.0.1
```

## Release Workflow

### Complete Release Process

```bash
# 1. Bump version
yarn version:patch   # or version:minor, version:major

# 2. Review changes
git diff

# 3. Update CHANGELOG.md (if applicable)
# Edit changelog to document changes

# 4. Commit and push
git add .
git commit -m "chore(release): v1.0.1"
git push origin main
git push origin v1.0.1

# 5. Build and test
yarn build
yarn test

# 6. Pack (optional - to review tarball)
yarn pack
# Check the tarball contents
tar -tzf @hanivanrizky/nestjs-xpath-parser-1.0.1.tgz

# 7. Publish
yarn publish
```

### Quick Release (All-in-One)

```bash
# The publish script handles:
# - NPM login check
# - Version check
# - Build and test
# - Publishing

yarn publish
```

## Version Bump Examples

### Bug Fix Release

```bash
# Scenario: Fixed XPath attribute extraction bug

# 1. Make the fix
# Edit source code...

# 2. Test the fix
yarn test

# 3. Bump patch version
yarn version:patch

# Output: 1.0.0 → 1.0.1

# 4. Publish
yarn publish
```

### Feature Release

```bash
# Scenario: Added new pipe transformation

# 1. Implement feature
# Edit source code...

# 2. Test
yarn test

# 3. Bump minor version
yarn version:minor

# Output: 1.0.0 → 1.1.0

# 4. Update CHANGELOG.md
echo "## [1.1.0] - 2024-01-15
### Added
- New \`truncate\` pipe for text truncation
- Support for custom delimiter in \`multiple\` meta" >> CHANGELOG.md

# 5. Commit and publish
git add CHANGELOG.md
git commit -m "docs: update CHANGELOG for v1.1.0"
yarn publish
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

# 4. Bump major version
yarn version:major

# Output: 1.5.0 → 2.0.0

# 5. Update CHANGELOG.md
echo "## [2.0.0] - 2024-01-15
### Breaking Changes
- Renamed \`evaluateWebsite()\` to \`extract()\`
- Removed deprecated \`meta.isPage\` option

### Migration Guide
Old: scraper.evaluateWebsite(...)
New: scraper.extract(...)" >> CHANGELOG.md

# 6. Commit and publish
git add .
git commit -m "chore(release): v2.0.0 breaking changes"
yarn publish
```

## Publishing

### Pack Without Publishing

Create a tarball without publishing to npm:

```bash
yarn pack

# Creates: @hanivanrizky/nestjs-xpath-parser-VERSION.tgz

# Test locally
cd /path/to/test-project
npm install ../path/to/@hanivanrizky/nestjs-xpath-parser-VERSION.tgz
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
# Full publish with all checks
yarn publish

# or
./scripts/publish-auto.sh
```

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

### Version Already Exists

```bash
Error: Version 1.0.1 already exists on npm
```

**Solution:** Bump to a new version

```bash
yarn version:patch
# or choose a different version
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
yarn publish
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
Warning: Package size is 15MB (max recommended: 5MB)
```

**Solution:** Check `.npmignore` and ensure only necessary files are included

```bash
# Preview package contents
npm pack --dry-run

# Check for large files
du -sh dist/
```

### Wrong Files Published

If you see unexpected files in the package:

```bash
# Check what will be published
npm pack --dry-run

# Review .npmignore
cat .npmignore

# Check package.json "files" field
cat package.json | grep -A5 '"files"'
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

### 3. Use Git Tags

Always tag releases:

```bash
git tag -a v1.0.1 -m "Release version 1.0.1"
git push origin v1.0.1
```

### 4. Verify Tarball Contents

Check the tarball before publishing:

```bash
yarn pack
tar -tzf @hanivanrizky/nestjs-xpath-parser-1.0.1.tgz | head -50
```

### 5. Test Published Package

After publishing, test installation:

```bash
# In a separate test project
npm install @hanivanrizky/nestjs-xpath-parser@1.0.1
```

## Version Scripts Reference

| Command              | Description                               |
| -------------------- | ----------------------------------------- |
| `yarn version`       | Interactive version menu                  |
| `yarn version:patch` | Bump patch version (bug fixes)            |
| `yarn version:minor` | Bump minor version (new features)         |
| `yarn version:major` | Bump major version (breaking changes)     |
| `yarn pack`          | Create tarball without publishing         |
| `yarn publish`       | Full publish with version check           |
| `yarn publish:dry`   | Preview publish without actual publishing |

## Related Documentation

- [API Reference](./api-reference.md) - Service API documentation
- [Development](../README.md#development) - Development setup
