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
  echo "  custom   - Specify custom version"
  echo "  retag    - Recreate and re-push existing tag"
  echo "  cancel   - Exit without changes"
  echo ""

  read -p "Select option [patch/minor/major/custom/retag/cancel]: " CHOICE

  case $CHOICE in
    patch|minor|major|custom|retag)
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
# Handle Retag Option
# ============================================
if [ "$BUMP_TYPE" = "retag" ]; then
  echo ""
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${BLUE}Recreate and Re-push Tag${NC}"
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo ""

  # Get current version
  CURRENT_VERSION=$(node -p "require('./package.json').version")

  echo -e "${BLUE}Current version:${NC} $CURRENT_VERSION"
  echo ""
  echo -e "${YELLOW}Which tag do you want to recreate?${NC}"
  echo "  1) v$CURRENT_VERSION (current)"
  echo "  2) Custom version"
  echo ""
  read -p "Select option [1-2]: " RETAG_CHOICE

  if [ "$RETAG_CHOICE" = "1" ]; then
    TAG_VERSION="v$CURRENT_VERSION"
  else
    echo ""
    read -p "Enter tag version (e.g. v0.2.1 or 0.2.1): " CUSTOM_TAG

    # Add 'v' prefix if not present
    if [[ ! "$CUSTOM_TAG" =~ ^v ]]; then
      TAG_VERSION="v$CUSTOM_TAG"
    else
      TAG_VERSION="$CUSTOM_TAG"
    fi
  fi

  echo ""
  echo -e "${BLUE}Tag to recreate:${NC} $TAG_VERSION"
  echo ""

  # Check if tag exists
  TAG_EXISTS_LOCALLY=$(git tag -l "$TAG_VERSION")
  TAG_EXISTS_REMOTELY=$(git ls-remote --tags origin "refs/tags/$TAG_VERSION" 2>/dev/null)

  if [ -z "$TAG_EXISTS_LOCALLY" ] && [ -z "$TAG_EXISTS_REMOTELY" ]; then
    echo -e "${RED}(x_x) Tag $TAG_VERSION does not exist locally or remotely${NC}"
    echo ""
    echo -e "${YELLOW}Available tags:${NC}"
    git tag | sort -V | tail -10
    exit 1
  fi

  echo -e "${YELLOW}Tag status:${NC}"
  if [ -n "$TAG_EXISTS_LOCALLY" ]; then
    echo -e "${YELLOW}  ✓ Found locally${NC}"
  fi
  if [ -n "$TAG_EXISTS_REMOTELY" ]; then
    echo -e "${YELLOW}  ✓ Found on remote${NC}"
  fi
  echo ""

  read -p "$(echo -e ${YELLOW}Recreate and re-push tag $TAG_VERSION? [y/N]:${NC} )" -n 1 -r
  echo
  echo ""

  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${BLUE}Cancelled${NC}"
    exit 0
  fi

  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${BLUE}Recreating Tag${NC}"
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo ""

  # Delete local tag
  if [ -n "$TAG_EXISTS_LOCALLY" ]; then
    echo -e "${YELLOW}(>_<) Deleting local tag...${NC}"
    git tag -d "$TAG_VERSION"
    echo -e "${GREEN}  ✓ Deleted local tag${NC}"
  fi

  # Delete remote tag
  if [ -n "$TAG_EXISTS_REMOTELY" ]; then
    echo -e "${YELLOW}(>_<) Deleting remote tag...${NC}"
    git push origin ":refs/tags/$TAG_VERSION" 2>/dev/null || true
    echo -e "${GREEN}  ✓ Deleted remote tag${NC}"
  fi

  echo ""
  # Create new tag
  echo -e "${YELLOW}(>_<) Creating new tag...${NC}"
  git tag -a "$TAG_VERSION" -m "Release version ${TAG_VERSION#v}"
  echo -e "${GREEN}  ✓ Tag created${NC}"

  echo ""
  echo -e "${YELLOW}(>_<) Pushing to remote...${NC}"
  git push origin "$TAG_VERSION" --force
  echo -e "${GREEN}(^_^) Tag pushed to remote${NC}"

  echo ""
  echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${GREEN}\\\\(^o^)/ Tag $TAG_VERSION recreated and pushed!${NC}"
  echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo ""

  # Ask if user wants to retag again
  if [ -z "$1" ]; then
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}Retag Again?${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo -e "${YELLOW}Do you want to recreate another tag?${NC}"
    echo "  1) Yes - retag again"
    echo "  2) No - I'm done"
    echo ""
    read -p "Select [1-2]: " AGAIN

    if [ "$AGAIN" != "1" ]; then
      echo ""
      exit 0
    fi

    # Clear for next iteration
    echo ""
    echo -e "${BLUE}Starting next retag...${NC}"
    echo ""
    # Clear argument to ensure interactive mode
    set --
  else
    exit 0
  fi

  # Continue the loop
  continue
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

# Use Node.js to update version (reliable across platforms)
node -e "const pkg = require('./package.json'); pkg.version = '$NEW_VERSION'; require('fs').writeFileSync('./package.json', JSON.stringify(pkg, null, 2));"

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

    # Check if tag already exists
    TAG_EXISTS_LOCALLY=$(git tag -l "v${NEW_VERSION}")
    TAG_EXISTS_REMOTELY=$(git ls-remote --tags origin "refs/tags/v${NEW_VERSION}" 2>/dev/null)

    if [ -n "$TAG_EXISTS_LOCALLY" ] || [ -n "$TAG_EXISTS_REMOTELY" ]; then
      echo ""
      echo -e "${YELLOW}(o_o) Tag v${NEW_VERSION} already exists!${NC}"
      echo ""

      if [ -n "$TAG_EXISTS_LOCALLY" ]; then
        echo -e "${YELLOW}  ✓ Found locally${NC}"
      fi
      if [ -n "$TAG_EXISTS_REMOTELY" ]; then
        echo -e "${YELLOW}  ✓ Found on remote${NC}"
      fi
      echo ""

      echo -e "${YELLOW}Choose action:${NC}"
      echo "  1) Delete and recreate tag (local + remote)"
      echo "  2) Skip tag creation"
      echo "  3) Cancel"
      echo ""
      read -p "Select option [1-3]: " TAG_CHOICE

      case $TAG_CHOICE in
        1)
          echo ""
          echo -e "${YELLOW}(>_<) Deleting existing tag...${NC}"

          # Delete local tag
          if [ -n "$TAG_EXISTS_LOCALLY" ]; then
            git tag -d "v${NEW_VERSION}"
            echo -e "${GREEN}  ✓ Deleted local tag${NC}"
          fi

          # Delete remote tag
          if [ -n "$TAG_EXISTS_REMOTELY" ]; then
            git push origin ":refs/tags/v${NEW_VERSION}" 2>/dev/null || true
            echo -e "${GREEN}  ✓ Deleted remote tag${NC}"
          fi

          echo ""
          # Create new tag
          echo -e "${YELLOW}(>_<) Creating new git tag...${NC}"
          git tag -a "v${NEW_VERSION}" -m "Release version ${NEW_VERSION}"
          echo -e "${GREEN}(^_^) New tag created${NC}"
          ;;
        2)
          echo ""
          echo -e "${BLUE}(・_・) Skipping tag creation${NC}"
          SKIP_PUSH=true
          ;;
        3)
          echo ""
          echo -e "${BLUE}Cancelled${NC}"
          exit 0
          ;;
        *)
          echo ""
          echo -e "${RED}Invalid option${NC}"
          exit 1
          ;;
      esac
    else
      # Create new tag (doesn't exist yet)
      echo ""
      echo -e "${YELLOW}(>_<) Creating git tag...${NC}"
      git tag -a "v${NEW_VERSION}" -m "Release version ${NEW_VERSION}"
    fi

    echo ""
    echo -e "${GREEN}(^_^) Git commit and tag created${NC}"
    echo ""

    # Ask if user wants to push to remote
    if [ "$SKIP_PUSH" != "true" ]; then
      echo -e "${YELLOW}Push to remote repository?${NC}"
      echo "  1) Yes - Push commit and tag"
      echo "  2) No - Skip push"
      echo ""
      read -p "Select option [1-2]: " PUSH_CHOICE

      if [ "$PUSH_CHOICE" = "1" ]; then
        echo ""
        echo -e "${YELLOW}(>_<) Pushing to remote...${NC}"

        # Get current branch
        CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)

        # Push commit
        echo -e "${BLUE}Pushing commit...${NC}"
        git push origin "$CURRENT_BRANCH"

        # Push tag (use force if we recreated it)
        if [ -n "$TAG_EXISTS_LOCALLY" ] || [ -n "$TAG_EXISTS_REMOTELY" ]; then
          echo -e "${BLUE}Force pushing tag (recreated)...${NC}"
          git push origin "v${NEW_VERSION}" --force
        else
          echo -e "${BLUE}Pushing tag...${NC}"
          git push origin "v${NEW_VERSION}"
        fi

        echo ""
        echo -e "${GREEN}(^_^) Pushed to remote successfully${NC}"
        echo ""
      else
        echo ""
        echo -e "${BLUE}(・_・) Push skipped${NC}"
        echo ""
        echo -e "${BLUE}To push manually later:${NC}"
        echo "  git push origin $CURRENT_BRANCH"
        echo "  git push origin v${NEW_VERSION}"
        echo ""
      fi
    else
      echo ""
      echo -e "${BLUE}(・_・) Push skipped (no tag created)${NC}"
      echo ""
    fi
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