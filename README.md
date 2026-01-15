# @hanivanrizky/nestjs-xpath-parser

<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

<p align="center">A NestJS module for HTML parsing and web scraping using XPath with support for user-agent rotation, proxy configuration, and flexible data extraction.</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@hanivanrizky/nestjs-xpath-parser" target="_blank"><img src="https://img.shields.io/npm/v/@hanivanrizky/nestjs-xpath-parser.svg" alt="NPM Version" /></a>
  <a href="https://www.npmjs.com/package/@hanivanrizky/nestjs-xpath-parser" target="_blank"><img src="https://img.shields.io/npm/l/@hanivanrizky/nestjs-xpath-parser.svg" alt="Package License" /></a>
  <a href="https://www.npmjs.com/package/@hanivanrizky/nestjs-xpath-parser" target="_blank"><img src="https://img.shields.io/npm/dm/@hanivanrizky/nestjs-xpath-parser.svg" alt="NPM Downloads" /></a>
</p>

## Table of Contents

- [Features](#features)
- [Installation](#installation)
- [Quick Start](#quick-start)
  - [Import the Module](#import-the-module)
  - [Inject the Service](#inject-the-service)
- [Core Features](#core-features)
  - [Pattern-Based Extraction](#pattern-based-extraction)
  - [Container-Based Extraction](#container-based-extraction)
  - [Data Cleaning with Pipes](#data-cleaning-with-pipes)
  - [XPath Validation](#xpath-validation)
  - [User-Agent Rotation](#user-agent-rotation)
- [TypeScript Definitions & Types](#typescript-definitions--types)
- [API Reference](#api-reference)
- [Examples](#examples)
- [Development](#development)
- [Contributing](#contributing)
- [License](#license)

## Features

- **(☆^O^☆) XPath-Based Parsing**: Full XPath 1.0 support using libxmljs2 and JSDOM engines
- **(._.) Pattern-Based Extraction**: Define extraction patterns with metadata for structured scraping
- **(>_<) Container Extraction**: Extract lists of items with nested field patterns
- **(・_・) Data Cleaning Pipes**: Built-in transformations (trim, case conversion, replace, decode HTML)
- **(>_<) User-Agent Rotation**: Automatic user-agent rotation for stealth scraping
- **(o_o) XPath Validation**: Validate XPath patterns before scraping
- **(._.) HTTP Fetching**: Built-in HTML/XML fetching with proxy support
- **(._.) Multi-Format Support**: Parse both HTML and XML content
- **(._.) Return Types**: Extract text content or raw HTML
- **(>_<) Alternative Patterns**: Fallback patterns for robust extraction
- **(☆^O^☆) TypeScript Generics**: Full generic type support for type-safe results
- **(o_o) Fully Tested**: Comprehensive test suite with real-world examples

## Installation

```bash
yarn add @hanivanrizky/nestjs-xpath-parser
# or
npm install @hanivanrizky/nestjs-xpath-parser
```

## Quick Start

### Import the Module

```typescript
import { Module } from '@nestjs/common';
import { ScraperHtmlModule } from '@hanivanrizky/nestjs-xpath-parser';

@Module({
  imports: [ScraperHtmlModule],
})
export class AppModule {}
```

### Inject the Service

```typescript
import { Injectable } from '@nestjs/common';
import { ScraperHtmlService } from '@hanivanrizky/nestjs-xpath-parser';

@Injectable()
export class YourService {
  constructor(private readonly scraperService: ScraperHtmlService) {}

  async scrapeProducts() {
    const result = await this.scraperService.evaluateWebsite({
      url: 'https://www.scrapingcourse.com/ecommerce/',
      patterns: [
        {
          key: 'container',
          patternType: 'xpath',
          returnType: 'text',
          patterns: ['//li[contains(@class, "product")]'],
          meta: { isContainer: true },
        },
        {
          key: 'name',
          patternType: 'xpath',
          returnType: 'text',
          patterns: ['.//h2/text()'],
          pipes: { trim: true },
        },
        {
          key: 'price',
          patternType: 'xpath',
          returnType: 'text',
          patterns: ['.//span[@class="price"]//bdi/text()'],
          pipes: { trim: true },
        },
      ],
    });

    return result.results;
  }
}
```

## Core Features

### Pattern-Based Extraction

Define extraction patterns with rich metadata:

```typescript
import { PatternField } from '@hanivanrizky/nestjs-xpath-parser';

const patterns: PatternField[] = [
  {
    key: 'title',
    patternType: 'xpath',
    returnType: 'text',
    patterns: ['//title/text()'],
    pipes: {
      trim: true,
      toLowerCase: false,
    },
  },
  {
    key: 'links',
    patternType: 'xpath',
    returnType: 'text',
    patterns: ['//a/@href'],
    meta: {
      multiple: true, // Extract array of values
    },
  },
  {
    key: 'description',
    patternType: 'xpath',
    returnType: 'rawHTML', // Get raw HTML instead of text
    patterns: ['//meta[@name="description"]/@content'],
    meta: {
      alterPattern: ['//meta[@property="og:description"]/@content'], // Fallback patterns
    },
  },
];
```

### Container-Based Extraction

Extract lists of structured items by defining a container pattern:

```typescript
interface Product {
  name: string;
  price: string;
  image: string;
}

const result = await scraperService.evaluateWebsite<Product>({
  url: 'https://example.com/products',
  patterns: [
    // Container pattern - defines the list items
    {
      key: 'container',
      patternType: 'xpath',
      returnType: 'text',
      patterns: ['//div[@class="product-card"]'],
      meta: { isContainer: true },
    },
    // Field patterns - extracted from each container
    {
      key: 'name',
      patternType: 'xpath',
      returnType: 'text',
      patterns: ['.//h3[@class="product-name"]/text()'],
      pipes: { trim: true },
    },
    {
      key: 'price',
      patternType: 'xpath',
      returnType: 'text',
      patterns: ['.//span[@class="price"]/text()'],
      pipes: {
        trim: true,
        replace: [
          { from: '$', to: '' },
          { from: ',', to: '' },
        ],
      },
    },
    {
      key: 'image',
      patternType: 'xpath',
      returnType: 'text',
      patterns: ['.//img/@src'],
    },
  ],
});

// Result: { results: Product[], document: ... }
```

### Data Cleaning with Pipes

Apply transformations to extracted data:

```typescript
const pattern: PatternField = {
  key: 'cleanedText',
  patternType: 'xpath',
  returnType: 'text',
  patterns: ['//div[@class="content"]/text()'],
  pipes: {
    trim: true, // Remove leading/trailing whitespace
    toLowerCase: true, // Convert to lowercase
    toUpperCase: false, // Convert to uppercase (mutually exclusive with toLowerCase)
    decode: true, // Decode HTML entities (e.g., &amp; -> &)
    replace: [
      // Find and replace patterns
      { from: '\\s+', to: ' ' }, // Replace multiple spaces with single space (supports regex)
      { from: 'old', to: 'new' },
    ],
  },
};
```

### XPath Validation

Validate XPath patterns before scraping:

```typescript
const validationResult = scraperService.validateXpath(
  html,
  [
    '//title/text()',
    '//div[@class="product"]',
    '//invalid[@xpath[syntax',
  ]
);

console.log(validationResult);
// {
//   valid: false,
//   results: [
//     { xpath: '//title/text()', valid: true, matchCount: 1, sample: 'Page Title' },
//     { xpath: '//div[@class="product"]', valid: true, matchCount: 10 },
//     { xpath: '//invalid[@xpath[syntax', valid: false, error: 'XPath syntax error' }
//   ]
// }
```

### User-Agent Rotation

Automatic user-agent rotation for each request to avoid detection:

```typescript
// User-agent is automatically rotated for each request
const result = await scraperService.evaluateWebsite({
  url: 'https://example.com',
  patterns: [...],
  // Different user-agent will be used automatically
});
```

## TypeScript Definitions & Types

### Helper Types

For cleaner type definitions, you can optionally use the `BaseExtractionResult` helper type:

```typescript
import { BaseExtractionResult } from '@hanivanrizky/nestjs-xpath-parser';

// Option 1: Simple interface (works without extends)
interface Product {
  name: string;
  price: string;
}

// Option 2: Using helper type (optional, but more explicit)
interface Article extends BaseExtractionResult {
  title: string;
  author: string;
  content: string;
}

// Both work the same with evaluateWebsite<T>
const products = await scraper.evaluateWebsite<Product>({ ... });
const articles = await scraper.evaluateWebsite<Article>({ ... });
```

### Core Service Interface

```typescript
interface ScraperHtmlService {
  // Main scraping method
  evaluateWebsite<T = ExtractionResult>(
    options: EvaluateOptions,
  ): Promise<{ results: T[]; document: unknown }>;

  // Validate XPath patterns
  validateXpath(
    html: string,
    xpathPatterns?: string[],
  ): {
    valid: boolean;
    results: Array<{
      xpath: string;
      valid: boolean;
      matchCount?: number;
      sample?: string;
      error?: string;
    }>;
  };
}
```

### Configuration Types

```typescript
interface EvaluateOptions {
  url?: string; // URL to fetch HTML from
  html?: string; // Pre-fetched HTML string
  patterns: PatternField[]; // Extraction patterns
  useProxy?: boolean; // Enable proxy for request
  contentType?: 'text/html' | 'text/xml'; // Content type (default: 'text/html')
}

interface PatternField {
  key: string; // Field name in result object
  patternType: 'xpath'; // Pattern type (currently only XPath)
  returnType: 'text' | 'rawHTML'; // Return text content or raw HTML
  patterns: string[]; // XPath patterns (first match wins)
  meta?: PatternMeta; // Pattern metadata
  pipes?: CleanerStepRules; // Data cleaning transformations
}

interface PatternMeta {
  multiple?: boolean | string; // Extract array of values
  multiline?: boolean; // Support multiline matching
  alterPattern?: string[]; // Alternative/fallback patterns
  isContainer?: boolean; // Mark as container for list extraction
  isPage?: boolean; // Mark as page-level pattern
}

interface CleanerStepRules {
  trim?: boolean; // Remove leading/trailing whitespace
  toLowerCase?: boolean; // Convert to lowercase
  toUpperCase?: boolean; // Convert to uppercase
  replace?: CleanerRule[]; // Find and replace rules
  decode?: boolean; // Decode HTML entities
}

interface CleanerRule {
  from: string; // Pattern to find (supports regex)
  to: string; // Replacement string
}
```

## API Reference

### `evaluateWebsite<T>(options: EvaluateOptions): Promise<{ results: T[]; document: unknown }>`

Main method for scraping websites with pattern-based extraction.

**Parameters:**
- `options.url` - URL to fetch and parse (optional if `html` is provided)
- `options.html` - Pre-fetched HTML string (optional if `url` is provided)
- `options.patterns` - Array of extraction patterns
- `options.useProxy` - Enable proxy for HTTP requests (default: false)
- `options.contentType` - Content type: 'text/html' or 'text/xml' (default: 'text/html')

**Returns:**
- `results` - Array of extracted data objects typed as `T[]`
- `document` - Parsed DOM document

**Example:**

```typescript
interface Article {
  title: string;
  author: string;
  content: string;
}

const result = await scraperService.evaluateWebsite<Article>({
  url: 'https://example.com/article',
  patterns: [
    {
      key: 'title',
      patternType: 'xpath',
      returnType: 'text',
      patterns: ['//h1/text()'],
      pipes: { trim: true },
    },
    {
      key: 'author',
      patternType: 'xpath',
      returnType: 'text',
      patterns: ['//meta[@name="author"]/@content'],
    },
    {
      key: 'content',
      patternType: 'xpath',
      returnType: 'rawHTML',
      patterns: ['//article'],
    },
  ],
});

// result.results is typed as Article[]
console.log(result.results[0].title); // Type-safe access
```

### `validateXpath(html: string, xpathPatterns?: string[]): ValidationResult`

Validate XPath patterns against HTML content.

**Parameters:**
- `html` - HTML string to validate against
- `xpathPatterns` - Array of XPath patterns to validate

**Returns:**
```typescript
{
  valid: boolean; // Overall validation status
  results: Array<{
    xpath: string; // XPath pattern
    valid: boolean; // Pattern validity
    matchCount?: number; // Number of matches found
    sample?: string; // Sample extracted value
    error?: string; // Error message if invalid
  }>;
}
```

**Example:**

```typescript
const html = '<html><body><h1>Title</h1></body></html>';

const validation = scraperService.validateXpath(html, [
  '//h1/text()',
  '//h2/text()',
  '//invalid[@xpath[',
]);

console.log(validation);
// {
//   valid: false,
//   results: [
//     { xpath: '//h1/text()', valid: true, matchCount: 1, sample: 'Title' },
//     { xpath: '//h2/text()', valid: true, matchCount: 0 },
//     { xpath: '//invalid[@xpath[', valid: false, error: 'XPath syntax error' }
//   ]
// }
```

## Examples

### Example 1: Simple Product Scraping

```typescript
import { Injectable } from '@nestjs/common';
import { ScraperHtmlService, PatternField } from '@hanivanrizky/nestjs-xpath-parser';

interface Product {
  name: string;
  price: string;
}

@Injectable()
export class ProductScraperService {
  constructor(private readonly scraper: ScraperHtmlService) {}

  async scrapeProducts(url: string): Promise<Product[]> {
    const patterns: PatternField[] = [
      {
        key: 'container',
        patternType: 'xpath',
        returnType: 'text',
        patterns: ['//div[@class="product"]'],
        meta: { isContainer: true },
      },
      {
        key: 'name',
        patternType: 'xpath',
        returnType: 'text',
        patterns: ['.//h2/text()'],
        pipes: { trim: true },
      },
      {
        key: 'price',
        patternType: 'xpath',
        returnType: 'text',
        patterns: ['.//span[@class="price"]/text()'],
        pipes: {
          trim: true,
          replace: [{ from: '$', to: '' }],
        },
      },
    ];

    const result = await this.scraper.evaluateWebsite<Product>({
      url,
      patterns,
    });

    return result.results;
  }
}
```

### Example 2: Article Extraction with Fallbacks

```typescript
interface Article {
  title: string;
  description: string;
  publishedDate: string;
  tags: string[];
}

const patterns: PatternField[] = [
  {
    key: 'title',
    patternType: 'xpath',
    returnType: 'text',
    patterns: ['//h1[@class="article-title"]/text()'],
    meta: {
      alterPattern: [
        '//meta[@property="og:title"]/@content',
        '//title/text()',
      ],
    },
    pipes: { trim: true },
  },
  {
    key: 'description',
    patternType: 'xpath',
    returnType: 'text',
    patterns: ['//meta[@name="description"]/@content'],
    pipes: {
      trim: true,
      decode: true,
    },
  },
  {
    key: 'publishedDate',
    patternType: 'xpath',
    returnType: 'text',
    patterns: ['//time/@datetime'],
  },
  {
    key: 'tags',
    patternType: 'xpath',
    returnType: 'text',
    patterns: ['//a[@rel="tag"]/text()'],
    meta: { multiple: true },
  },
];

const result = await scraper.evaluateWebsite<Article>({
  url: 'https://example.com/article',
  patterns,
});
```

### Example 3: XML Parsing

```typescript
const result = await scraper.evaluateWebsite({
  url: 'https://example.com/sitemap.xml',
  contentType: 'text/xml',
  patterns: [
    {
      key: 'container',
      patternType: 'xpath',
      returnType: 'text',
      patterns: ['//url'],
      meta: { isContainer: true },
    },
    {
      key: 'loc',
      patternType: 'xpath',
      returnType: 'text',
      patterns: ['.//loc/text()'],
    },
    {
      key: 'lastmod',
      patternType: 'xpath',
      returnType: 'text',
      patterns: ['.//lastmod/text()'],
    },
  ],
});
```

### Example 4: XPath Validation Before Scraping

```typescript
async scrapeSafely(url: string, xpathPatterns: string[]) {
  // Fetch HTML first
  const response = await fetch(url);
  const html = await response.text();

  // Validate XPath patterns
  const validation = this.scraper.validateXpath(html, xpathPatterns);

  if (!validation.valid) {
    const invalidPatterns = validation.results
      .filter(r => !r.valid)
      .map(r => `${r.xpath}: ${r.error}`);

    throw new Error(`Invalid XPath patterns: ${invalidPatterns.join(', ')}`);
  }

  // Patterns are valid, proceed with scraping
  const result = await this.scraper.evaluateWebsite({
    html,
    patterns: [
      // ... your patterns
    ],
  });

  return result.results;
}
```

### Example 5: Complex E-commerce Scraping

```typescript
interface ProductListing {
  name: string;
  price: string;
  rating: string;
  reviewCount: string;
  image: string;
  availability: string;
}

const patterns: PatternField[] = [
  {
    key: 'container',
    patternType: 'xpath',
    returnType: 'text',
    patterns: ['//li[contains(@class, "product")]'],
    meta: { isContainer: true },
  },
  {
    key: 'name',
    patternType: 'xpath',
    returnType: 'text',
    patterns: ['.//h2[contains(@class, "product-title")]/text()'],
    meta: {
      alterPattern: ['.//a[@class="product-link"]/@title'],
    },
    pipes: {
      trim: true,
      replace: [{ from: '\\s+', to: ' ' }],
    },
  },
  {
    key: 'price',
    patternType: 'xpath',
    returnType: 'text',
    patterns: ['.//span[@class="price"]//bdi/text()'],
    pipes: {
      trim: true,
      replace: [
        { from: '\\$', to: '' },
        { from: ',', to: '' },
      ],
    },
  },
  {
    key: 'rating',
    patternType: 'xpath',
    returnType: 'text',
    patterns: ['.//div[@class="star-rating"]/@style'],
  },
  {
    key: 'reviewCount',
    patternType: 'xpath',
    returnType: 'text',
    patterns: ['.//span[@class="review-count"]/text()'],
    pipes: {
      trim: true,
      replace: [{ from: '[^0-9]', to: '' }],
    },
  },
  {
    key: 'image',
    patternType: 'xpath',
    returnType: 'text',
    patterns: ['.//img/@src'],
  },
  {
    key: 'availability',
    patternType: 'xpath',
    returnType: 'text',
    patterns: ['.//span[contains(@class, "stock")]/text()'],
    pipes: {
      trim: true,
      toLowerCase: true,
    },
  },
];

const result = await scraper.evaluateWebsite<ProductListing>({
  url: 'https://www.scrapingcourse.com/ecommerce/',
  patterns,
});

console.log(`Found ${result.results.length} products`);
```

## Development

```bash
# Install dependencies
yarn install

# Build
yarn build

# Test
yarn test
yarn test:cov
yarn test:watch

# Lint
yarn lint
yarn format
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/yourusername/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/yourusername/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
