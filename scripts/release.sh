#!/bin/bash

# Release script for @hanivanrizky/nestjs-xpath-parser
# Creates git tag and GitHub release for current version
# Usage: ./scripts/release.sh [--no-gh]

set -e

echo "\\(^o^)/ Git Release Script"
echo "==========================="
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Check for --no-gh flag
USE_GH=true
if [[ "$1" == "--no-gh" ]]; then
  USE_GH=false
fi

# Get package info
PACKAGE_NAME=$(node -p "require('./package.json').name")
PACKAGE_VERSION=$(node -p "require('./package.json').version")

echo -e "${BLUE}Package:${NC} $PACKAGE_NAME"
echo -e "${BLUE}Version:${NC} $PACKAGE_VERSION"
echo ""

# ============================================
# Check Git Status
# ============================================
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}Checking Git Status${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

if [ ! -d ".git" ]; then
  echo -e "${RED}(x_x) Not a git repository${NC}"
  exit 1
fi

# Check if there are uncommitted changes
if [ -n "$(git status --porcelain)" ]; then
  echo -e "${YELLOW}(o_o) Warning: You have uncommitted changes${NC}"
  echo ""
  git status --short
  echo ""
  read -p "$(echo -e ${YELLOW}Commit changes before creating release? [y/N]:${NC} )" -n 1 -r
  echo
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}(>_<) Please commit your changes first, then run this script again${NC}"
    exit 0
  fi
fi

# Check if tag already exists
if git rev-parse "v$PACKAGE_VERSION" >/dev/null 2>&1; then
  echo -e "${RED}(x_x) Tag v$PACKAGE_VERSION already exists${NC}"
  echo ""
  echo -e "${YELLOW}Options:${NC}"
  echo "  1) Delete existing tag and recreate"
  echo "  2) Exit"
  echo ""
  read -p "Select option [1-2]: " TAG_CHOICE

  if [ "$TAG_CHOICE" = "1" ]; then
    echo ""
    echo -e "${YELLOW}(>_<) Deleting existing tag...${NC}"
    git tag -d "v$PACKAGE_VERSION"
    git push origin ":refs/tags/v$PACKAGE_VERSION" 2>/dev/null || true
    echo -e "${GREEN}(^_^) Tag deleted${NC}"
    echo ""
  else
    echo -e "${BLUE}Exiting...${NC}"
    exit 0
  fi
fi

# ============================================
# Create Git Tag
# ============================================
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}Creating Git Tag${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

TAG_NAME="v$PACKAGE_VERSION"
TAG_MESSAGE="Release $PACKAGE_VERSION"

echo -e "${YELLOW}(>_<) Creating tag: ${TAG_NAME}${NC}"
git tag -a "$TAG_NAME" -m "$TAG_MESSAGE"

echo -e "${GREEN}(^_^) Tag created${NC}"
echo ""

# ============================================
# Push to Remote
# ============================================
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}Pushing to Remote${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Get current branch
CURRENT_BRANCH=$(git branch --show-current)

echo -e "${BLUE}Current branch:${NC} $CURRENT_BRANCH"
echo ""
echo -e "${YELLOW}(>_<) Pushing tag to origin...${NC}"

git push origin "$TAG_NAME"

if [ $? -eq 0 ]; then
  echo -e "${GREEN}(^_^) Tag pushed successfully${NC}"
else
  echo -e "${RED}(x_x) Failed to push tag${NC}"
  echo -e "${YELLOW}Push manually:${NC} git push origin $TAG_NAME"
  exit 1
fi

echo ""

# ============================================
# Create GitHub Release (Optional)
# ============================================
if [ "$USE_GH" = true ]; then
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${BLUE}Creating GitHub Release${NC}"
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo ""

  # Check if gh CLI is installed
  if ! command -v gh &>/dev/null; then
    echo -e "${YELLOW}(o_o) GitHub CLI not found${NC}"
    echo -e "${BLUE}Install from:${NC} https://cli.github.com/"
    echo ""
    echo -e "${GREEN}(^_^) Skipping GitHub release${NC}"
  else
    # Check if authenticated
    if ! gh auth status &>/dev/null; then
      echo -e "${YELLOW}(o_o) Not authenticated with GitHub CLI${NC}"
      echo -e "${BLUE}Run:${NC} gh auth login"
      echo ""
      echo -e "${GREEN}(^_^) Skipping GitHub release${NC}"
    else
      echo -e "${YELLOW}(>_<) Creating GitHub release...${NC}"

      # Read release notes from CHANGELOG if exists
      RELEASE_NOTES=""
      if [ -f "CHANGELOG.md" ]; then
        # Extract release notes for this version
        RELEASE_NOTES=$(sed -n "/^## \[$PACKAGE_VERSION\]/,/^## \[/p" CHANGELOG.md | head -n -1)
      fi

      # If no release notes found, use default
      if [ -z "$RELEASE_NOTES" ]; then
        RELEASE_NOTES="Release $PACKAGE_VERSION"
      fi

      # Create release
      gh release create "$TAG_NAME" \
        --title "$TAG_NAME" \
        --notes "$RELEASE_NOTES"

      if [ $? -eq 0 ]; then
        echo -e "${GREEN}(^_^) GitHub release created${NC}"
        echo ""
        echo -e "${BLUE}View release:${NC}"
        echo "  $(git remote get-url origin | sed 's/\.git$//' | sed 's/git@github.com:/https:\/\/github.com\//')/releases/tag/$TAG_NAME"
      else
        echo -e "${YELLOW}(o_o) Failed to create GitHub release${NC}"
        echo -e "${YELLOW}Create manually:${NC} gh release create $TAG_NAME"
      fi
    fi
  fi
else
  echo -e "${BLUE}(・_・) GitHub release skipped (--no-gh flag)${NC}"
fi

echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}\\(^o^)/ Release Created Successfully!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${BLUE}Tag:${NC} $TAG_NAME"
echo -e "${BLUE}Version:${NC} $PACKAGE_VERSION"
echo ""

# ============================================
# Next Steps
# ============================================
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}Next Steps${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${YELLOW}1. View tag:${NC}"
  echo "   git tag -l v$PACKAGE_VERSION"
echo ""
echo -e "${YELLOW}2. View release notes:${NC}"
  echo "   git show v$PACKAGE_VERSION"
echo ""
echo -e "${YELLOW}3. Install this version:${NC}"
  echo "   npm install $PACKAGE_NAME@$PACKAGE_VERSION"
echo ""
