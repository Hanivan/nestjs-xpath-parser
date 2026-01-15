#!/bin/bash

# Script to pack @hanivanrizky/nestjs-xpath-parser without publishing
# Creates a distributable .tgz tarball for testing or distribution
# Usage: ./scripts/pack.sh

set -e

echo "\\(^o^)/ Package Packer"
echo "===================="
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Get package info
PACKAGE_NAME=$(node -p "require('./package.json').name")
PACKAGE_VERSION=$(node -p "require('./package.json').version")
PACKAGE_PRIVATE=$(node -p "require('./package.json').private")

echo -e "${BLUE}Package:${NC} $PACKAGE_NAME"
echo -e "${BLUE}Version:${NC} $PACKAGE_VERSION"
echo ""

# Check if package is marked as private
if [ "$PACKAGE_PRIVATE" = "true" ]; then
  echo -e "${YELLOW}(o_o) Warning: Package is marked as private${NC}"
  echo -e "${YELLOW}Set \"private\": false to make it publishable${NC}"
  echo ""
fi

# ============================================
# STEP 1: Clean & Build
# ============================================
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}STEP 1: Building Package${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

echo -e "${YELLOW}(・_・) Cleaning previous builds...${NC}"
rm -rf dist/

echo -e "${YELLOW}(>_<) Building project...${NC}"
yarn build

if [ $? -ne 0 ]; then
  echo -e "${RED}(x_x) Build failed!${NC}"
  exit 1
fi

echo -e "${GREEN}(^_^) Build successful${NC}"
echo ""

# ============================================
# STEP 2: Run Tests
# ============================================
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}STEP 2: Running Tests${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Check if there are test files
if ls src/**/*.spec.ts >/dev/null 2>&1 || ls test/**/*.spec.ts >/dev/null 2>&1; then
  echo -e "${YELLOW}(o_o) Running tests...${NC}"

  yarn test

  if [ $? -ne 0 ]; then
    echo -e "${RED}(x_x) Tests failed!${NC}"
    read -p "$(echo -e ${YELLOW}Continue packing anyway? [y/N]:${NC} )" -n 1 -r
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
# STEP 3: Preview Package Contents
# ============================================
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}STEP 3: Package Contents Preview${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

echo -e "${BLUE}(._.) Files that will be included in the tarball:${NC}"
npm pack --dry-run 2>&1 | grep -E "^\s+[0-9]" | head -30

TOTAL_FILES=$(npm pack --dry-run 2>&1 | grep -E "^\s+[0-9]" | wc -l)
if [ $TOTAL_FILES -gt 30 ]; then
  echo -e "${YELLOW}... and $((TOTAL_FILES - 30)) more files${NC}"
fi
echo ""

# ============================================
# STEP 4: Create Tarball
# ============================================
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}STEP 4: Creating Tarball${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

TARBALL_NAME="${PACKAGE_NAME}-${PACKAGE_VERSION}.tgz"

echo -e "${YELLOW}(>_<) Creating tarball: ${TARBALL_NAME}${NC}"
echo ""

npm pack

if [ $? -eq 0 ]; then
  echo ""
  echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${GREEN}\\(^o^)/ SUCCESS! Package tarball created${NC}"
  echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo ""
  echo -e "${BLUE}Tarball:${NC} ./${TARBALL_NAME}"
  echo -e "${BLUE}Size:${NC}    $(du -h "$TARBALL_NAME" | cut -f1)"
  echo ""
  echo -e "${BLUE}(>_<) You can now:${NC}"
  echo ""
  echo -e "${BLUE}1. Test locally:${NC}"
  echo "   cd /path/to/test-project"
  echo "   npm install ../$(pwd)/${TARBALL_NAME}"
  echo ""
  echo -e "${BLUE}2. Publish to npm:${NC}"
  echo "   npm publish ${TARBALL_NAME} --access public"
  echo ""
  echo -e "${BLUE}3. Distribute:${NC}"
  echo "   Share the ${TARBALL_NAME} file"
  echo ""
  echo -e "${YELLOW}(・_・) To clean up tarballs later:${NC}"
  echo "   rm -f *.tgz"
  echo ""
else
  echo -e "${RED}(x_x) Packing failed${NC}"
  exit 1
fi
