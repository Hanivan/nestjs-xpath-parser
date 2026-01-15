#!/bin/bash

# Script to run all examples or a specific example
# Usage:
#   ./scripts/run-examples.sh           # Run all examples
#   ./scripts/run-examples.sh 1         # Run example 1
#   ./scripts/run-examples.sh 2         # Run example 2
#   ... etc

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

EXAMPLES_DIR="src/examples"

# List of example files
EXAMPLES=(
  "01-basic-product-scraping.ts"
  "02-xpath-validation.ts"
  "03-data-cleaning-pipes.ts"
  "04-alternative-patterns.ts"
  "05-xml-parsing.ts"
  "06-real-world-ecommerce.ts"
  "07-url-health-check.ts"
)

# Function to run a single example
run_example() {
  local example_file=$1
  local example_num=$2

  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${BLUE}Running Example $example_num: $example_file${NC}"
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo ""

  if [ ! -f "$EXAMPLES_DIR/$example_file" ]; then
    echo -e "${RED}(x_x) Example file not found: $EXAMPLES_DIR/$example_file${NC}"
    return 1
  fi

  # Run the example with ts-node
  if ts-node -r tsconfig-paths/register "$EXAMPLES_DIR/$example_file"; then
    echo ""
    echo -e "${GREEN}(^_^) Example $example_num completed successfully${NC}"
    return 0
  else
    echo ""
    echo -e "${RED}(x_x) Example $example_num failed${NC}"
    return 1
  fi
}

# Main script
if [ $# -eq 0 ]; then
  # No arguments - run all examples
  echo -e "${YELLOW}\\(^o^)/ Running All Examples${NC}"
  echo ""

  FAILED=0
  PASSED=0

  for i in "${!EXAMPLES[@]}"; do
    example_num=$((i + 1))
    example_file="${EXAMPLES[$i]}"

    if run_example "$example_file" "$example_num"; then
      PASSED=$((PASSED + 1))
    else
      FAILED=$((FAILED + 1))
    fi

    echo ""
  done

  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${BLUE}Summary${NC}"
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${GREEN}(^_^) Passed: $PASSED${NC}"
  if [ $FAILED -gt 0 ]; then
    echo -e "${RED}(x_x) Failed: $FAILED${NC}"
    exit 1
  fi
  echo ""
  echo -e "${GREEN}\\(^o^)/ All examples completed successfully!${NC}"

else
  # Run specific example
  EXAMPLE_NUM=$1

  if ! [[ "$EXAMPLE_NUM" =~ ^[0-9]+$ ]]; then
    echo -e "${RED}(x_x) Invalid example number: $EXAMPLE_NUM${NC}"
    echo ""
    echo "Usage: $0 [example_number]"
    echo ""
    echo "Available examples:"
    for i in "${!EXAMPLES[@]}"; do
      echo "  $((i + 1)). ${EXAMPLES[$i]}"
    done
    exit 1
  fi

  ARRAY_INDEX=$((EXAMPLE_NUM - 1))

  if [ $ARRAY_INDEX -lt 0 ] || [ $ARRAY_INDEX -ge ${#EXAMPLES[@]} ]; then
    echo -e "${RED}(x_x) Example number out of range: $EXAMPLE_NUM${NC}"
    echo ""
    echo "Available examples: 1-${#EXAMPLES[@]}"
    exit 1
  fi

  example_file="${EXAMPLES[$ARRAY_INDEX]}"
  run_example "$example_file" "$EXAMPLE_NUM"
fi
