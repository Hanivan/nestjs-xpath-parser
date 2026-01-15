#!/bin/bash

# Version control script for @hanivanrizky/nestjs-xpath-parser
# Manages version bumping: patch, minor, major
# Usage: ./scripts/version.sh [patch|minor|major]

set -e

# Main loop - allow multiple version bumps
while true; do

# Colors (defined once)
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Get package info (refresh each loop)
PACKAGE_NAME=$(node -p "require('./package.json').name")
PACKAGE_VERSION=$(node -p "require('./package.json').version")

echo "\\(^o^)/ Version Control Script"
echo "============================="
echo ""

echo -e "${BLUE}Package:${NC} $PACKAGE_NAME"
echo -e "${BLUE}Current Version:${NC} $PACKAGE_VERSION"
echo ""

# Function to calculate next version
calculate_next_version() {
  local type=$1
  local current=$2

  # Split version into parts
  local major=$(echo "$current" | cut -d. -f1)
  local minor=$(echo "$current" | cut -d. -f2)
  local patch=$(echo "$current" | cut -d. -f3)

  case $type in
    patch)
      patch=$((patch + 1))
      ;;
    minor)
      minor=$((minor + 1))
      patch=0
      ;;
    major)
      major=$((major + 1))
      minor=0
      patch=0
      ;;
  esac

  echo "${major}.${minor}.${patch}"
}

# ============================================
# Main Menu
# ============================================
if [ -z "$1" ]; then
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${BLUE}Select Version Bump Type:${NC}"
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo ""
  echo -e "${CYAN}Semantic Versioning:${NC}"
  echo "  patch   - Bug fixes (backward compatible)"
  echo "           ${PACKAGE_VERSION} → $(calculate_next_version patch $PACKAGE_VERSION)"
  echo ""
  echo "  minor   - New features (backward compatible)"
  echo "           ${PACKAGE_VERSION} → $(calculate_next_version minor $PACKAGE_VERSION)"
  echo ""
  echo "  major   - Breaking changes"
  echo "           ${PACKAGE_VERSION} → $(calculate_next_version major $PACKAGE_VERSION)"
  echo ""
  echo -e "${YELLOW}Other Options:${NC}"
  echo "  custom  - Specify custom version"
  echo "  cancel  - Exit without changes"
  echo ""

  read -p "Select option [patch/minor/major/custom/cancel]: " CHOICE

  case $CHOICE in
    patch|minor|major|custom)
      BUMP_TYPE=$CHOICE
      ;;
    cancel)
      echo -e "${BLUE}Cancelled${NC}"
      exit 0
      ;;
    *)
      echo -e "${RED}Invalid option${NC}"
      exit 1
      ;;
  esac
else
  BUMP_TYPE=$1
fi

# ============================================
# Calculate New Version
# ============================================
if [ "$BUMP_TYPE" = "custom" ]; then
  echo ""
  read -p "Enter custom version (e.g. 1.2.3): " CUSTOM_VERSION

  # Validate version format
  if ! [[ "$CUSTOM_VERSION" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
    echo -e "${RED}(x_x) Invalid version format. Use format: X.Y.Z${NC}"
    exit 1
  fi

  NEW_VERSION=$CUSTOM_VERSION
else
  NEW_VERSION=$(calculate_next_version "$BUMP_TYPE" "$PACKAGE_VERSION")
fi

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}Version Summary${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${YELLOW}Current Version:${NC} $PACKAGE_VERSION"
echo -e "${YELLOW}New Version:${NC}     $NEW_VERSION"
echo ""

# ============================================
# Confirm Version Bump
# ============================================
read -p "$(echo -e ${YELLOW}Bump version to ${NEW_VERSION}? [y/N]:${NC} )" -n 1 -r
echo
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo -e "${BLUE}Cancelled${NC}"
  exit 0
fi

# ============================================
# Update Version
# ============================================
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}Updating Version${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Update package.json
echo -e "${YELLOW}(・_・) Updating package.json...${NC}"
npm version "$NEW_VERSION" --no-git-tag-version > /dev/null

# Revert git changes if any (npm version creates commits by default)
git checkout package.json package-lock.json 2>/dev/null || true

# Manually update version in package.json
if [[ "$OSTYPE" == "darwin"* ]]; then
  # macOS
  sed -i '' "s/\"version\": \"$PACKAGE_VERSION\"/\"version\": \"$NEW_VERSION\"/" package.json
else
  # Linux
  sed -i "s/\"version\": \"$PACKAGE_VERSION\"/\"version\": \"$NEW_VERSION\"/" package.json
fi

echo -e "${GREEN}(^_^) Version updated in package.json${NC}"

# Check if there's a VERSION or CHANGELOG file
if [ -f "CHANGELOG.md" ]; then
  echo ""
  echo -e "${YELLOW}(o_o) Don't forget to update CHANGELOG.md${NC}"
fi

echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}\\\\(^o^)/ Version bumped successfully!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${BLUE}New Version:${NC} $NEW_VERSION"
echo ""

# ============================================
# Git Integration
# ============================================
if [ -d ".git" ]; then
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${BLUE}Git Integration${NC}"
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo ""
  echo -e "${YELLOW}Create git commit and tag?${NC}"
  echo "  1) Yes - Commit and tag"
  echo "  2) No - Skip git operations"
  echo ""
  read -p "Select option [1-2]: " GIT_CHOICE

  if [ "$GIT_CHOICE" = "1" ]; then
    echo ""
    echo -e "${YELLOW}(>_<) Creating git commit...${NC}"

    # Add package.json
    git add package.json

    # Commit
    git commit -m "chore(release): bump version to ${NEW_VERSION}"

    # Create tag
    echo -e "${YELLOW}(>_<) Creating git tag...${NC}"
    git tag -a "v${NEW_VERSION}" -m "Release version ${NEW_VERSION}"

    echo ""
    echo -e "${GREEN}(^_^) Git commit and tag created${NC}"
    echo ""
    echo -e "${BLUE}To push to remote:${NC}"
    echo "  git push origin main"
    echo "  git push origin v${NEW_VERSION}"
    echo ""
  else
    echo ""
    echo -e "${BLUE}(・_・) Git operations skipped${NC}"
    echo ""
  fi
fi

# ============================================
# Next Steps
# ============================================
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}Next Steps${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${YELLOW}1. Review changes:${NC}"
  echo "   git diff"
echo ""
echo -e "${YELLOW}2. Update CHANGELOG.md (if applicable)${NC}"
echo ""
echo -e "${YELLOW}3. Build and test:${NC}"
  echo "   yarn build"
  echo "   yarn test"
echo ""
echo -e "${YELLOW}4. Pack (optional):${NC}"
  echo "   yarn pack"
echo ""
echo -e "${YELLOW}5. Publish to npm:${NC}"
  echo "   yarn publish"
  echo "   # or"
  echo "   ./scripts/publish-auto.sh"
echo ""

  # ============================================
  # Ask if user wants to bump again
  # ============================================
  if [ -z "$1" ]; then
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}Bump Again?${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo -e "${YELLOW}Do you want to bump version again?${NC}"
    echo "  1) Yes - bump again"
    echo "  2) No - I'm done"
    echo ""
    read -p "Select [1-2]: " AGAIN

    if [ "$AGAIN" != "1" ]; then
      echo ""
      echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
      echo -e "${GREEN}Done! Final version: $NEW_VERSION${NC}"
      echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
      echo ""
      exit 0
    fi

    # Clear for next iteration
    echo ""
    echo -e "${BLUE}Starting next bump...${NC}"
    echo ""
    # Clear argument to ensure interactive mode
    set --
  else
    # Exit if argument was provided (single run mode)
    exit 0
  fi

done