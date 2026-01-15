#!/bin/bash

# All-in-one script to publish @hanivanrizky/nestjs-xpath-parser to npmjs
# Handles login, building, testing, and publishing automatically
# Usage: ./scripts/publish-auto.sh [--dry-run]

set -e

echo "\\(^o^)/ Automated NPM Publisher"
echo "=========================="
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check for dry-run flag
DRY_RUN=false
if [[ "$1" == "--dry-run" ]]; then
  DRY_RUN=true
  echo -e "${YELLOW}(o_o) DRY RUN MODE - No actual publishing${NC}"
  echo ""
fi

# Get package info
PACKAGE_NAME=$(node -p "require('./package.json').name")
PACKAGE_VERSION=$(node -p "require('./package.json').version")
PACKAGE_PRIVATE=$(node -p "require('./package.json').private")

echo -e "${BLUE}Package:${NC} $PACKAGE_NAME"
echo -e "${BLUE}Version:${NC} $PACKAGE_VERSION"
echo ""

# Check if package is marked as private
if [ "$PACKAGE_PRIVATE" = "true" ]; then
  echo -e "${RED}(x_x) Error: Package is marked as private in package.json${NC}"
  echo -e "${YELLOW}Set \"private\": false to publish${NC}"
  exit 1
fi

# ============================================
# STEP 1: Check NPM Authentication
# ============================================
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}STEP 1: Checking NPM Authentication${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

if ! NPM_USER=$(npm whoami 2>/dev/null) || [ -z "$NPM_USER" ]; then
  echo -e "${YELLOW}(o_o) Not logged in to npm${NC}"
  echo ""
  echo -e "${BLUE}Let's login to npm...${NC}"
  echo ""

  # Attempt to login
  npm login

  # Check if login was successful
  if ! NPM_USER=$(npm whoami 2>/dev/null) || [ -z "$NPM_USER" ]; then
    echo ""
    echo -e "${RED}(x_x) Login failed${NC}"
    exit 1
  fi

  echo ""
  echo -e "${GREEN}(^_^) Login successful!${NC}"
else
  echo -e "${GREEN}(^_^) Already logged in${NC}"
fi

echo -e "${BLUE}Username:${NC} $NPM_USER"

NPM_EMAIL=$(npm config get email 2>/dev/null || true)
if [ -n "$NPM_EMAIL" ]; then
  echo -e "${BLUE}Email:${NC} $NPM_EMAIL"
fi

echo ""

# ============================================
# STEP 2: Version Check
# ============================================
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}STEP 2: Checking Version Availability${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

NPM_VERSIONS=$(npm view "$PACKAGE_NAME" versions --json 2>/dev/null || echo "[]")

if echo "$NPM_VERSIONS" | grep -q "\"$PACKAGE_VERSION\""; then
  echo -e "${RED}(x_x) Version $PACKAGE_VERSION already exists on npm${NC}"
  echo ""
  echo -e "${YELLOW}Would you like to bump the version?${NC}"
  echo ""
  # Calculate next versions
  NEXT_PATCH=$(npm version patch --no-git-tag-version 2>/dev/null && node -p "require('./package.json').version" && git checkout package.json 2>/dev/null || echo "")
  NEXT_MINOR=$(npm version minor --no-git-tag-version 2>/dev/null && node -p "require('./package.json').version" && git checkout package.json 2>/dev/null || echo "")
  NEXT_MAJOR=$(npm version major --no-git-tag-version 2>/dev/null && node -p "require('./package.json').version" && git checkout package.json 2>/dev/null || echo "")

  echo -e "  ${GREEN}1)${NC} patch   - Bug fixes (backward compatible)"
  echo -e "     → $PACKAGE_VERSION ${GREEN}→${NC} $NEXT_PATCH"
  echo ""
  echo -e "  ${GREEN}2)${NC} minor   - New features (backward compatible)"
  echo -e "     → $PACKAGE_VERSION ${GREEN}→${NC} $NEXT_MINOR"
  echo ""
  echo -e "  ${GREEN}3)${NC} major   - Breaking changes"
  echo -e "     → $PACKAGE_VERSION ${GREEN}→${NC} $NEXT_MAJOR"
  echo ""
  echo -e "  ${GREEN}4)${NC} cancel  - Exit without publishing"
  echo ""
  echo -e "${CYAN}→ Type 1, 2, 3, or 4 and press Enter${NC}"
  read -p "Your choice: " VERSION_CHOICE

  case $VERSION_CHOICE in
    1)
      npm version patch --no-git-tag-version
      PACKAGE_VERSION=$(node -p "require('./package.json').version")
      echo -e "${GREEN}(^_^) Version bumped to $PACKAGE_VERSION${NC}"
      ;;
    2)
      npm version minor --no-git-tag-version
      PACKAGE_VERSION=$(node -p "require('./package.json').version")
      echo -e "${GREEN}(^_^) Version bumped to $PACKAGE_VERSION${NC}"
      ;;
    3)
      npm version major --no-git-tag-version
      PACKAGE_VERSION=$(node -p "require('./package.json').version")
      echo -e "${GREEN}(^_^) Version bumped to $PACKAGE_VERSION${NC}"
      ;;
    4)
      echo -e "${BLUE}Exiting...${NC}"
      exit 0
      ;;
    *)
      echo -e "${RED}Invalid option${NC}"
      exit 1
      ;;
  esac
  echo ""
fi

echo -e "${GREEN}(^_^) Version $PACKAGE_VERSION is available${NC}"
echo ""

# ============================================
# STEP 3: Clean & Build
# ============================================
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}STEP 3: Building Package${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

echo -e "${YELLOW}(・_・) Cleaning previous builds...${NC}"
rm -rf dist/

echo -e "${YELLOW}(>_<) Building project...${NC}"
if ! yarn build; then
  echo -e "${RED}(x_x) Build failed!${NC}"
  exit 1
fi

echo -e "${GREEN}(^_^) Build successful${NC}"
echo ""

# ============================================
# STEP 4: Run Tests (Optional)
# ============================================
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}STEP 4: Running Tests${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Check if there are test files
if ls src/**/*.spec.ts >/dev/null 2>&1 || ls test/**/*.spec.ts >/dev/null 2>&1; then
  echo -e "${YELLOW}(o_o) Running tests...${NC}"

  if ! yarn test; then
    echo -e "${RED}(x_x) Tests failed!${NC}"
    read -p "$(echo -e ${YELLOW}Continue anyway? [y/N]:${NC} )" -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
      exit 1
    fi
  else
    echo -e "${GREEN}(^_^) Tests passed${NC}"
  fi
else
  echo -e "${BLUE}(・_・) No test files found, skipping${NC}"
fi

echo ""

# ============================================
# STEP 5: Preview Package Contents
# ============================================
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}STEP 5: Package Contents Preview${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

echo -e "${BLUE}(._.) Files to be published:${NC}"
npm pack --dry-run 2>&1 | grep -E "^\s+[0-9]" | head -20
echo ""

# ============================================
# STEP 6: Publish
# ============================================
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}STEP 6: Publishing to NPM${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

if [ "$DRY_RUN" = false ]; then
  echo -e "${YELLOW}(>_<) Publishing Summary:${NC}"
  echo -e "   Package: ${GREEN}$PACKAGE_NAME${NC}"
  echo -e "   Version: ${GREEN}$PACKAGE_VERSION${NC}"
  echo -e "   As user: ${GREEN}$NPM_USER${NC}"
  echo -e "   Registry: $(npm config get registry)"
  echo ""
  read -p "$(echo -e ${YELLOW}Proceed with publishing? [y/N]:${NC} )" -n 1 -r
  echo
  echo ""

  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${BLUE}Publication cancelled${NC}"
    exit 0
  fi

  echo -e "${YELLOW}(>_<) Publishing to npm...${NC}"
  echo ""

  if npm publish --access public; then
    echo ""
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}\\(^o^)/ SUCCESS! Published $PACKAGE_NAME@$PACKAGE_VERSION${NC}"
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo -e "${BLUE}(>_<) Your package is now live!${NC}"
    echo ""
    echo -e "${BLUE}View on NPM:${NC}"
    echo "  https://www.npmjs.com/package/$PACKAGE_NAME"
    echo ""
    echo -e "${BLUE}Install with:${NC}"
    echo "  npm install $PACKAGE_NAME"
    echo "  yarn add $PACKAGE_NAME"
    echo ""
    echo -e "${BLUE}Version page:${NC}"
    echo "  https://www.npmjs.com/package/$PACKAGE_NAME/v/$PACKAGE_VERSION"
    echo ""
  else
    echo -e "${RED}(x_x) Publishing failed${NC}"
    exit 1
  fi
else
  # Dry run mode
  echo -e "${YELLOW}(o_o) DRY RUN: Simulating publish...${NC}"
  echo ""
  npm publish --dry-run --access public
  echo ""
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${BLUE}(・_・) This was a dry run. No actual publishing occurred.${NC}"
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo ""
  echo -e "${BLUE}Everything looks good! Run without --dry-run to publish:${NC}"
  echo "  ./scripts/publish-auto.sh"
  echo "  yarn publish:auto"
  echo ""
fi
