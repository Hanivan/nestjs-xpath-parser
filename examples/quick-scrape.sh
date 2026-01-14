#!/bin/bash

# Quick test script for HTML Parser API
# Usage: ./examples/quick-scrape.sh [API_URL]

API_URL="${1:-http://localhost:3000}"

echo "Scraping https://www.scrapingcourse.com/ecommerce/"
echo "API: $API_URL"
echo ""

curl -s -X POST "$API_URL/html/parse" \
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
        "patterns": [".//h2[contains(@class, \"woocommerce-loop-product__title\")]/text()"],
        "pipes": {
          "trim": true
        }
      },
      {
        "key": "price",
        "patternType": "xpath",
        "returnType": "text",
        "patterns": [".//span[@class=\"price\"]//bdi/text()"],
        "pipes": {
          "trim": true
        }
      }
    ]
  }' | jq '.data[] | {name, price}'
