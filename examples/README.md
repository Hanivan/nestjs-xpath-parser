# HTML Parser API Examples

This directory contains example scripts for testing the HTML Parser API.

## Prerequisites

1. Start the API server:
```bash
yarn start:dev
```

2. Install `jq` for JSON formatting (optional but recommended):
```bash
# Ubuntu/Debian
sudo apt-get install jq

# macOS
brew install jq
```

## Quick Start

### Simple Product Scraping

The quickest way to test scraping scrapingcourse.com:

```bash
./examples/quick-scrape.sh
```

This will scrape product names and prices from the homepage and display them in a clean format.

### Full Examples

Run all examples with detailed output:

```bash
./examples/scrape-scrapingcourse.sh
```

This demonstrates:
1. Scraping product listings with container patterns
2. Extracting page metadata (title, description)
3. Validating XPath patterns
4. Data cleaning with pipes (toLowerCase, toUpperCase, trim)
5. Multiple values extraction (array of products)

## Custom API URL

If your server runs on a different port:

```bash
# Full examples
API_URL=http://localhost:4000 ./examples/scrape-scrapingcourse.sh

# Quick scrape
./examples/quick-scrape.sh http://localhost:4000
```

## Manual cURL Examples

### Parse HTML from URL

```bash
curl -X POST http://localhost:3000/html/parse \
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
      }
    ]
  }'
```

### Parse HTML String

```bash
curl -X POST http://localhost:3000/html/parse \
  -H "Content-Type: application/json" \
  -d '{
    "html": "<html><body><h1>Test</h1></body></html>",
    "patterns": [
      {
        "key": "heading",
        "patternType": "xpath",
        "returnType": "text",
        "patterns": ["//h1/text()"]
      }
    ]
  }'
```

### Validate XPath Patterns

```bash
curl -X POST http://localhost:3000/html/validate \
  -H "Content-Type: application/json" \
  -d '{
    "html": "<html><body><div class=\"test\">Content</div></body></html>",
    "xpathPatterns": [
      "//div[@class=\"test\"]/text()",
      "//invalid[[[xpath"
    ]
  }'
```

## Pattern Field Options

### Pattern Types
- `xpath` - XPath selector (only supported type currently)

### Return Types
- `text` - Extract text content
- `rawHTML` - Extract raw HTML

### Meta Options
- `isContainer: true` - Use this pattern to find containers for nested extraction
- `multiple: true` - Return array of all matches instead of first match
- `multiline: true` - Join multiple values with space

### Pipe Options (Data Cleaning)
- `trim: true` - Remove leading/trailing whitespace
- `toLowerCase: true` - Convert to lowercase
- `toUpperCase: true` - Convert to uppercase
- `decode: true` - Decode HTML entities
- `replace: [{from: "old", to: "new"}]` - Replace text using regex

## Example Response

```json
{
  "success": true,
  "data": [
    {
      "name": "Abominable Hoodie",
      "price": "$69.00"
    },
    {
      "name": "Adrienne Trek Jacket",
      "price": "$57.00"
    }
  ],
  "count": 2
}
```

## Features Demonstrated

### User-Agent Rotation
Every request automatically uses a random, realistic user-agent from the `user-agents` library to avoid detection.

### XPath with Fallbacks
Patterns support multiple XPath expressions as fallbacks:
```json
{
  "patterns": [
    "//h2[@class=\"product-title\"]//text()",
    "//h2//text()",
    "//a[@class=\"product-link\"]//text()"
  ]
}
```
The first matching pattern will be used.

### Container-based Extraction
Extract multiple items by first finding containers:
```json
{
  "key": "container",
  "patterns": ["//div[@class=\"product\"]"],
  "meta": {
    "isContainer": true
  }
}
```

Then use relative XPath (starting with `.//`) for nested fields.

## Troubleshooting

### Server not responding
Make sure the server is running:
```bash
yarn start:dev
```

### jq command not found
The examples use `jq` for formatting. Install it or remove `| jq '.'` from the commands.

### Connection refused
Check that the API_URL matches your server's address and port.
