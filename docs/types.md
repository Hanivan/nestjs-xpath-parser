# TypeScript Definitions & Types

Complete reference of all TypeScript types and interfaces used in the package.

## Core Types

### EvaluateOptions

Options for website evaluation.

```typescript
interface EvaluateOptions {
  url?: string; // URL to fetch HTML from
  html?: string; // Pre-fetched HTML string
  patterns: PatternField[]; // Extraction patterns
  useProxy?: boolean | string; // Enable proxy
  contentType?: 'text/html' | 'text/xml'; // Content type (default: 'text/html')
}
```

**Note:** Either `url` or `html` must be provided.

### ExtractionResult

Default extraction result type when not using generics.

```typescript
interface ExtractionResult extends BaseExtractionResult {
  [key: string]: unknown;
}

interface BaseExtractionResult {
  // Helper type for type safety (optional)
}
```

### UrlHealthCheckResult

Result from URL health check.

```typescript
interface UrlHealthCheckResult {
  url: string; // The checked URL
  alive: boolean; // True if URL is alive (200-399 status)
  statusCode?: number; // HTTP status code (if request succeeded)
  error?: string; // Error message (if request failed)
}
```

## Pattern Types

### PatternField

Main pattern definition for data extraction.

```typescript
interface PatternField {
  key: string; // Field name in result object
  patternType: 'xpath'; // Pattern type (currently only XPath)
  returnType: 'text' | 'rawHTML'; // Return text content or raw HTML
  patterns: string[]; // XPath patterns (first match wins)
  meta?: PatternMeta; // Pattern metadata
  pipes?: CleanerStepRules; // Data cleaning transformations
}
```

### PatternMeta

Metadata controlling pattern behavior.

```typescript
interface PatternMeta {
  multiple?: boolean | string; // Extract array of values
  multiline?: boolean; // Join multiple values with space
  alterPattern?: string[]; // Alternative/fallback patterns
  isContainer?: boolean; // Mark as container for list extraction
  isPage?: boolean; // Mark as page-level pattern
}
```

#### multiple

Extract multiple values:

- `true` - Returns array of values
- `'with comma'` - Returns comma-separated string

#### multiline

When `multiple: true`, join values with space instead of returning array.

#### alterPattern

Fallback patterns tried when primary patterns fail.

#### isContainer

Marks this pattern as a container for list-based extraction. Only one pattern can be marked as container.

#### isPage

Marks pattern as page-level (extracted once per page, not per container).

### CleanerStepRules

Data cleaning transformations.

```typescript
interface CleanerStepRules {
  trim?: boolean; // Remove leading/trailing whitespace
  toLowerCase?: boolean; // Convert to lowercase
  toUpperCase?: boolean; // Convert to uppercase
  replace?: CleanerRule[]; // Find and replace rules
  decode?: boolean; // Decode HTML entities
}
```

**Note:** `toLowerCase` and `toUpperCase` are mutually exclusive.

### CleanerRule

Single find-and-replace rule.

```typescript
interface CleanerRule {
  from: string; // Pattern to find (supports regex)
  to: string; // Replacement string
}
```

**Example:**

```typescript
{
  from: '\\s+',  // Regex: one or more spaces
  to: ' ',       // Replace with single space
}
```

## Module Configuration Types

### ScraperHtmlModuleOptions

Module configuration options.

```typescript
interface ScraperHtmlModuleOptions {
  maxRetries?: number; // Maximum HTTP retries (default: 3)
}
```

## Service Method Types

### ValidationResult

Return type for `validateXpath()`.

```typescript
interface ValidationResult {
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

### EvaluateWebsiteResult

Return type for `evaluateWebsite()`.

```typescript
interface EvaluateWebsiteResult<T = ExtractionResult> {
  results: T[]; // Array of extracted data
  document: unknown; // Parsed DOM document
}
```

## Type Guards and Helpers

### HtmlNode

HTML node type (internal use).

```typescript
type HtmlNode = libxmljs.Node | Element | null;
```

### HtmlNodeArray

Array of HTML nodes (internal use).

```typescript
type HtmlNodeArray = HtmlNode[];
```

## Generic Type Usage

### Using Generics for Type Safety

```typescript
interface Product {
  name: string;
  price: string;
  image: string;
}

// Result is typed as Product[]
const result = await scraper.evaluateWebsite<Product>({
  url: 'https://example.com/products',
  patterns,
});

// TypeScript knows result.results is Product[]
result.results.forEach((product) => {
  console.log(product.name); // Type-safe access
  console.log(product.price); // Autocomplete works
});
```

### Extending BaseExtractionResult (Optional)

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

## Complete Type Example

```typescript
import {
  PatternField,
  EvaluateOptions,
  ExtractionResult,
  UrlHealthCheckResult,
} from '@hanivanrizky/nestjs-xpath-parser';

interface Product {
  name: string;
  price: number;
  description: string;
  inStock: boolean;
}

class ProductScraper {
  async scrape(url: string): Promise<Product[]> {
    const options: EvaluateOptions = {
      url,
      patterns: this.getPatterns(),
    };

    const result = await this.scraper.evaluateWebsite<Product>(options);
    return result.results;
  }

  private getPatterns(): PatternField[] {
    return [
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
          replace: [{ from: '[^0-9.]', to: '' }],
        },
      },
      {
        key: 'description',
        patternType: 'xpath',
        returnType: 'text',
        patterns: ['.//p[@class="description"]/text()'],
        pipes: { trim: true },
      },
      {
        key: 'inStock',
        patternType: 'xpath',
        returnType: 'text',
        patterns: ['.//span[@class="stock"]/text()'],
        pipes: {
          trim: true,
          toLowerCase: true,
        },
      },
    ];
  }

  async checkLinks(urls: string[]): Promise<UrlHealthCheckResult[]> {
    return await this.scraper.checkUrlAlive(urls);
  }
}
```

## Type Imports

All types are exported from the main package:

```typescript
import {
  // Core types
  EvaluateOptions,
  ExtractionResult,
  BaseExtractionResult,
  UrlHealthCheckResult,

  // Pattern types
  PatternField,
  PatternMeta,
  CleanerStepRules,
  CleanerRule,

  // Module types
  ScraperHtmlModuleOptions,

  // Service
  ScraperHtmlService,
  ScraperHtmlModule,
} from '@hanivanrizky/nestjs-xpath-parser';
```

## Related Documentation

- [API Reference](./api-reference.md) - Service methods
- [Pattern-Based Extraction](./features/pattern-based-extraction.md) - Using patterns
- [Container-Based Extraction](./features/container-extraction.md) - Container patterns
