#!/bin/bash

# Script to test the HTML Parser API by scraping scrapingcourse.com
# Usage: ./examples/scrape-scrapingcourse.sh

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# API endpoint (adjust if your server runs on a different port)
API_URL="${API_URL:-http://localhost:3000}"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}HTML Parser API - ScrapingCourse.com${NC}"
echo -e "${BLUE}========================================${NC}\n"

# Example 1: Parse homepage with product listings
echo -e "${YELLOW}Example 1: Scraping Product Listings${NC}\n"

curl -X POST "$API_URL/html/parse" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://www.scrapingcourse.com/ecommerce/",
    "patterns": [
      {
        "key": "container",
        "patternType": "xpath",
        "returnType": "text",
        "patterns": ["//li[contains(@class, \"product\")]"],
        "meta": {
          "isContainer": true
        }
      },
      {
        "key": "name",
        "patternType": "xpath",
        "returnType": "text",
        "patterns": [
          ".//h2[contains(@class, \"woocommerce-loop-product__title\")]/text()"
        ],
        "pipes": {
          "trim": true
        }
      },
      {
        "key": "price",
        "patternType": "xpath",
        "returnType": "text",
        "patterns": [
          ".//span[@class=\"price\"]//bdi/text()"
        ],
        "pipes": {
          "trim": true
        }
      },
      {
        "key": "url",
        "patternType": "xpath",
        "returnType": "text",
        "patterns": [
          ".//a[contains(@class, \"woocommerce-LoopProduct-link\")]/@href"
        ]
      },
      {
        "key": "image",
        "patternType": "xpath",
        "returnType": "text",
        "patterns": [
          ".//img/@src"
        ]
      }
    ]
  }' | jq '.'

echo -e "\n${GREEN}✓ Product listings parsed${NC}\n"

# Example 2: Parse page title and metadata
echo -e "${YELLOW}Example 2: Scraping Page Metadata${NC}\n"

curl -X POST "$API_URL/html/parse" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://www.scrapingcourse.com/ecommerce/",
    "patterns": [
      {
        "key": "title",
        "patternType": "xpath",
        "returnType": "text",
        "patterns": ["//title/text()"],
        "pipes": {
          "trim": true
        }
      },
      {
        "key": "description",
        "patternType": "xpath",
        "returnType": "text",
        "patterns": ["//meta[@name=\"description\"]/@content"],
        "pipes": {
          "trim": true
        }
      }
    ]
  }' | jq '.'

echo -e "\n${GREEN}✓ Page metadata parsed${NC}\n"

# Example 3: Validate XPath patterns
echo -e "${YELLOW}Example 3: Validating XPath Patterns${NC}\n"

curl -X POST "$API_URL/html/validate" \
  -H "Content-Type: application/json" \
  -d '{
    "html": "<html><body><div class=\"product\"><h2>Product Name</h2><span class=\"price\">$19.99</span></div></body></html>",
    "xpathPatterns": [
      "//div[@class=\"product\"]",
      "//h2/text()",
      "//span[@class=\"price\"]/text()",
      "//invalid[[[xpath"
    ]
  }' | jq '.'

echo -e "\n${GREEN}✓ XPath patterns validated${NC}\n"

# Example 4: Parse with data cleaning pipes
echo -e "${YELLOW}Example 4: Data Cleaning with Pipes${NC}\n"

curl -X POST "$API_URL/html/parse" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://www.scrapingcourse.com/ecommerce/",
    "patterns": [
      {
        "key": "titleLowercase",
        "patternType": "xpath",
        "returnType": "text",
        "patterns": ["//title/text()"],
        "pipes": {
          "trim": true,
          "toLowerCase": true
        }
      },
      {
        "key": "titleUppercase",
        "patternType": "xpath",
        "returnType": "text",
        "patterns": ["//title/text()"],
        "pipes": {
          "trim": true,
          "toUpperCase": true
        }
      }
    ]
  }' | jq '.'

echo -e "\n${GREEN}✓ Data cleaning demonstrated${NC}\n"

# Example 5: Extract multiple product names as array
echo -e "${YELLOW}Example 5: Multiple Values Extraction${NC}\n"

curl -X POST "$API_URL/html/parse" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://www.scrapingcourse.com/ecommerce/",
    "patterns": [
      {
        "key": "allProductNames",
        "patternType": "xpath",
        "returnType": "text",
        "patterns": [
          "//h2[contains(@class, \"woocommerce-loop-product__title\")]/text()"
        ],
        "meta": {
          "multiple": true
        },
        "pipes": {
          "trim": true
        }
      }
    ]
  }' | jq '.'

echo -e "\n${GREEN}✓ Multiple values extracted${NC}\n"

echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}All examples completed successfully!${NC}"
echo -e "${BLUE}========================================${NC}"
