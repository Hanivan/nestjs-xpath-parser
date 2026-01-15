# Publishing Script

Automated script for packaging and publishing the npm package to npmjs.com.

## \\(^o^)/ Usage

### Publish to NPM

```bash
# Using yarn (recommended)
yarn publish

# Or directly
./scripts/publish-auto.sh
```

### Dry Run (Test First)

```bash
# Using yarn
yarn publish:dry

# Or directly
./scripts/publish-auto.sh --dry-run
```

## What It Does

The automated publish script handles the entire publishing workflow:

### (^_^) Step 1: Authentication Check
- Checks if you're logged in to npm
- **If not logged in**: Prompts you to login with `npm login`
- **If already logged in**: Shows your username and continues

### (^_^) Step 2: Version Check
- Verifies the version doesn't already exist on npm
- **If version exists**: Offers to bump version (patch/minor/major)
- **If available**: Continues to next step

### (^_^) Step 3: Build
- Cleans previous builds (`rm -rf dist/`)
- Builds the TypeScript project
- Exits if build fails

### (^_^) Step 4: Tests
- Runs tests if test files exist
- **If tests fail**: Asks if you want to continue anyway
- **If no tests**: Skips this step

### (^_^) Step 5: Preview
- Shows all files that will be published
- Displays package contents preview

### (^_^) Step 6: Publish
- **Dry run**: Shows what would be published (no actual upload)
- **Real publish**: Asks for final confirmation, then publishes

## Publishing Workflow

### First Time

1. **Just run the publish script:**
   ```bash
   yarn publish:dry  # Test first
   yarn publish      # Actual publish
   ```

2. **The script will guide you through:**
   - Login (if needed)
   - Version bump (if needed)
   - Build, test, and publish

### Updating Version

The script will automatically detect if the version exists and offer options:

```
(x_x) Version 1.0.0 already exists on npm

Would you like to bump the version?
  1) patch  (bug fixes:       1.0.0 → 1.0.1)
  2) minor  (new features:    1.0.0 → 1.1.0)
  3) major  (breaking changes: 1.0.0 → 2.0.0)
  4) Exit

Select option [1-4]:
```

You can also manually bump version before running:

```bash
npm version patch  # Bug fixes
npm version minor  # New features
npm version major  # Breaking changes
```

## Features

### Smart Login Handling
- Detects if you're not logged in
- Prompts npm login automatically
- Verifies login success before continuing

### Version Management
- Checks for version conflicts
- Offers interactive version bump
- Prevents publishing duplicate versions

### Safety Checks
- (^_^) Authentication verification
- (^_^) Private package detection
- (^_^) Build verification
- (^_^) Test execution
- (^_^) File preview
- (^_^) Final confirmation

### Dry Run Mode
- Test everything without publishing
- See exactly what would be published
- No changes made to npm registry

## Example Session

```bash
$ yarn publish:dry

\\(^o^)/ Automated NPM Publisher
==========================

Package: @hanivanrizky/nestjs-xpath-scraper
Version: 1.0.0

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 1: Checking NPM Authentication
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

(o_o) Not logged in to npm

Let's login to npm...

Username: your-username
Password:
Email: your-email@example.com
Enter one-time password: 123456

(^_^) Login successful!
Username: your-username

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 2: Checking Version Availability
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

(^_^) Version 1.0.0 is available

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 3: Building Package
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

(・_・) Cleaning previous builds...
(>_<) Building project...
(^_^) Build successful

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 4: Running Tests
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

(・_・) No test files found, skipping

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 5: Package Contents Preview
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

(._.) Files to be published:
  dist/index.js
  dist/index.d.ts
  dist/scraper-html.module.js
  dist/scraper-html.service.js
  ...

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 6: Publishing to NPM
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

(o_o) DRY RUN: Simulating publish...

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
(・_・) This was a dry run. No actual publishing occurred.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Everything looks good! Run without --dry-run to publish:
  ./scripts/publish-auto.sh
  yarn publish
```

## Troubleshooting

### Login Issues

**Problem:** Login fails or requires 2FA

**Solution:** Make sure you have:
- Valid npm account
- 2FA authenticator app (if 2FA is enabled)
- Correct username and password

### Version Exists

**Problem:** Version already published

**Solution:** The script will automatically offer to bump the version. Choose:
- `1` for patch (bug fixes)
- `2` for minor (new features)
- `3` for major (breaking changes)

### Build Fails

**Problem:** TypeScript compilation errors

**Solution:**
- Check error messages
- Fix TypeScript errors in your code
- Run `yarn build` manually to debug

### Tests Fail

**Problem:** Test suite fails

**Solution:**
- Review test failures
- Fix failing tests
- Or choose to continue anyway (not recommended)

### Permission Denied

**Problem:** `Permission denied` error

**Solution:**
```bash
chmod +x scripts/publish-auto.sh
```

## Tips

1. **Always test with dry run first:**
   ```bash
   yarn publish:dry
   ```

2. **Use semantic versioning:**
   - `patch` - Bug fixes (1.0.0 → 1.0.1)
   - `minor` - New features (1.0.0 → 1.1.0)
   - `major` - Breaking changes (1.0.0 → 2.0.0)

3. **Check your package.json:**
   - Ensure `"private": false`
   - Verify version number
   - Check `publishConfig.access: "public"` for scoped packages

4. **After publishing:**
   - Visit: `https://www.npmjs.com/package/@hanivanrizky/nestjs-xpath-scraper`
   - Test install: `npm install @hanivanrizky/nestjs-xpath-scraper`

## Security

- (^_^) Requires authentication before publishing
- (^_^) Checks version conflicts
- (^_^) Final confirmation required
- (^_^) Dry run mode available
- (^_^) No hardcoded credentials
- (^_^) Uses npm's official authentication

## Additional Resources

- [npm Publishing Guide](https://docs.npmjs.com/packages-and-modules/contributing-packages-to-the-registry)
- [Semantic Versioning](https://semver.org/)
- [npm Two-Factor Authentication](https://docs.npmjs.com/configuring-two-factor-authentication)
