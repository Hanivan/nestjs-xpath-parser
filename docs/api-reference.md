# API Reference

Complete API reference for `ScraperHtmlService`.

## Service Methods

### evaluateWebsite

Main method for scraping websites with pattern-based extraction.

```typescript
evaluateWebsite<T = ExtractionResult>(
  options: EvaluateOptions
): Promise<{ results: T[]; document: unknown }>
```

#### Parameters

| Parameter             | Type                        | Required | Description                           |
| --------------------- | --------------------------- | -------- | ------------------------------------- |
| `options.url`         | `string`                    | No\*     | URL to fetch and parse                |
| `options.html`        | `string`                    | No\*     | Pre-fetched HTML string               |
| `options.patterns`    | `PatternField[]`            | Yes      | Extraction patterns                   |
| `options.useProxy`    | `boolean \| string`         | No       | Enable proxy                          |
| `options.contentType` | `'text/html' \| 'text/xml'` | No       | Content type (default: `'text/html'`) |

\*Either `url` or `html` must be provided.

#### Returns

```typescript
{
  results: T[];      // Array of extracted data objects
  document: unknown; // Parsed DOM document
}
```

#### Examples

**Basic usage:**

```typescript
const result = await scraperService.evaluateWebsite({
  url: 'https://example.com',
  patterns: [
    {
      key: 'title',
      patternType: 'xpath',
      returnType: 'text',
      patterns: ['//title/text()'],
      pipes: { trim: true },
    },
  ],
});

console.log(result.results[0].title);
```

**With generics:**

```typescript
interface Product {
  name: string;
  price: string;
}

const result = await scraperService.evaluateWebsite<Product>({
  url: 'https://example.com/products',
  patterns: [...],
});

// result.results is typed as Product[]
result.results.forEach(p => {
  console.log(p.name); // Type-safe
});
```

**With HTML string:**

```typescript
const html = '<html><body><h1>Title</h1></body></html>';

const result = await scraperService.evaluateWebsite({
  html,
  patterns: [
    {
      key: 'title',
      patternType: 'xpath',
      returnType: 'text',
      patterns: ['//h1/text()'],
    },
  ],
});
```

**With proxy:**

```typescript
const result = await scraperService.evaluateWebsite({
  url: 'https://example.com',
  useProxy: true, // Uses HTTP_PROXY or HTTPS_PROXY env var
  patterns: [...],
});

// Or with specific proxy
const result = await scraperService.evaluateWebsite({
  url: 'https://example.com',
  useProxy: 'http://proxy.example.com:8080',
  patterns: [...],
});
```

**XML parsing:**

```typescript
const result = await scraperService.evaluateWebsite({
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
  ],
});
```

---

### validateXpath

Validate XPath patterns against HTML content.

```typescript
validateXpath(
  html: string,
  xpathPatterns?: string[]
): {
  valid: boolean;
  results: Array<{
    xpath: string;
    valid: boolean;
    matchCount?: number;
    sample?: string;
    error?: string;
  }>;
}
```

#### Parameters

| Parameter       | Type       | Required | Description                         |
| --------------- | ---------- | -------- | ----------------------------------- |
| `html`          | `string`   | Yes      | HTML string to validate against     |
| `xpathPatterns` | `string[]` | No       | Array of XPath patterns to validate |

#### Returns

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

#### Examples

**Basic validation:**

```typescript
const html = '<html><body><h1>Title</h1></body></html>';

const validation = scraperService.validateXpath(html, [
  '//h1/text()',
  '//h2/text()',
]);

console.log(validation);
// {
//   valid: true,
//   results: [
//     { xpath: '//h1/text()', valid: true, matchCount: 1, sample: 'Title' },
//     { xpath: '//h2/text()', valid: true, matchCount: 0 }
//   ]
// }
```

**Invalid pattern:**

```typescript
const validation = scraperService.validateXpath(html, ['//h1[[[invalid']);

console.log(validation);
// {
//   valid: false,
//   results: [
//     { xpath: '//h1[[[invalid', valid: false, error: 'Invalid expression' }
//   ]
// }
```

**Pre-scraping validation:**

```typescript
async scrapeSafely(url: string) {
  const response = await fetch(url);
  const html = await response.text();

  const validation = this.scraperService.validateXpath(html, [
    '//h1/text()',
    '//div[@class="content"]/text()',
  ]);

  if (!validation.valid) {
    throw new Error('Invalid XPath patterns');
  }

  // Proceed with scraping
  const result = await this.scraperService.evaluateWebsite({
    html,
    patterns: [...],
  });

  return result.results;
}
```

---

### checkUrlAlive

Check if URLs are alive using HTTP HEAD requests.

```typescript
checkUrlAlive(
  urls: string | string[],
  options?: { useProxy?: boolean | string }
): Promise<UrlHealthCheckResult[]>
```

#### Parameters

| Parameter          | Type                 | Required | Description                 |
| ------------------ | -------------------- | -------- | --------------------------- |
| `urls`             | `string \| string[]` | Yes      | Single URL or array of URLs |
| `options.useProxy` | `boolean \| string`  | No       | Enable proxy                |

#### Returns

```typescript
Array<{
  url: string; // The checked URL
  alive: boolean; // True if alive (200-399 status)
  statusCode?: number; // HTTP status code
  error?: string; // Error message
}>;
```

#### Examples

**Single URL:**

```typescript
const result = await scraperService.checkUrlAlive('https://example.com');

console.log(result[0]);
// {
//   url: 'https://example.com',
//   alive: true,
//   statusCode: 200
// }
```

**Multiple URLs:**

```typescript
const results = await scraperService.checkUrlAlive([
  'https://example.com',
  'https://broken-link.com',
]);

results.forEach((r) => {
  if (r.alive) {
    console.log(`✓ ${r.url} (${r.statusCode})`);
  } else {
    console.log(`✗ ${r.url} - ${r.error || r.statusCode}`);
  }
});
```

**With proxy:**

```typescript
const results = await scraperService.checkUrlAlive(
  ['https://example.com', 'https://example.org'],
  { useProxy: 'http://proxy.example.com:8080' },
);
```

**Combine with scraping:**

```typescript
// Scrape URLs
const scrapedData = await scraperService.evaluateWebsite({
  url: 'https://example.com',
  patterns: [
    {
      key: 'link',
      patternType: 'xpath',
      returnType: 'text',
      patterns: ['//a/@href'],
    },
  ],
});

// Extract URLs
const urls = scrapedData.results.map((r) => r.link as string);

// Check health
const healthResults = await scraperService.checkUrlAlive(urls);

// Filter valid URLs
const validData = scrapedData.results.filter((_, i) => healthResults[i].alive);
```

---

## Module Methods

### ScraperHtmlModule.forRoot

Configure module with options.

```typescript
static forRoot(options?: ScraperHtmlModuleOptions): DynamicModule
```

#### Parameters

| Parameter            | Type     | Required | Description                       |
| -------------------- | -------- | -------- | --------------------------------- |
| `options.maxRetries` | `number` | No       | Maximum HTTP retries (default: 3) |

#### Example

```typescript
import { Module } from '@nestjs/common';
import { ScraperHtmlModule } from '@hanivanrizky/nestjs-xpath-parser';

@Module({
  imports: [
    ScraperHtmlModule.forRoot({
      maxRetries: 5,
    }),
  ],
})
export class AppModule {}
```

---

### ScraperHtmlModule.forRootAsync

Configure module asynchronously.

```typescript
static forRootAsync(options: ModuleAsyncOptions): DynamicModule
```

#### Parameters

| Parameter    | Type       | Required | Description            |
| ------------ | ---------- | -------- | ---------------------- |
| `imports`    | `Module[]` | No\*     | Required imports       |
| `useFactory` | `Function` | Yes\*    | Factory function       |
| `inject`     | `any[]`    | No\*     | Dependencies to inject |

\*Required when using `useFactory`.

#### Example

```typescript
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ScraperHtmlModule } from '@hanivanrizky/nestjs-xpath-parser';

@Module({
  imports: [
    ConfigModule.forRoot(),
    ScraperHtmlModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        maxRetries: configService.get<number>('SCRAPER_MAX_RETRIES', 3),
      }),
      inject: [ConfigService],
    }),
  ],
})
export class AppModule {}
```

---

## Type Definitions

### EvaluateOptions

```typescript
interface EvaluateOptions {
  url?: string;
  html?: string;
  patterns: PatternField[];
  useProxy?: boolean | string;
  contentType?: 'text/html' | 'text/xml';
}
```

### PatternField

```typescript
interface PatternField {
  key: string;
  patternType: 'xpath';
  returnType: 'text' | 'rawHTML';
  patterns: string[];
  meta?: PatternMeta;
  pipes?: CleanerStepRules;
}
```

### PatternMeta

```typescript
interface PatternMeta {
  multiple?: boolean | string;
  multiline?: boolean;
  alterPattern?: string[];
  isContainer?: boolean;
  isPage?: boolean;
}
```

### CleanerStepRules

```typescript
interface CleanerStepRules {
  trim?: boolean;
  toLowerCase?: boolean;
  toUpperCase?: boolean;
  replace?: CleanerRule[];
  decode?: boolean;
}
```

### CleanerRule

```typescript
interface CleanerRule {
  from: string;
  to: string;
}
```

### UrlHealthCheckResult

```typescript
interface UrlHealthCheckResult {
  url: string;
  alive: boolean;
  statusCode?: number;
  error?: string;
}
```

### ScraperHtmlModuleOptions

```typescript
interface ScraperHtmlModuleOptions {
  maxRetries?: number;
}
```

---

## CLI Scripts

Available npm scripts for development and publishing:

### Version Management

| Script               | Description                                   |
| -------------------- | --------------------------------------------- |
| `yarn version`       | Interactive version menu                      |
| `yarn version:patch` | Bump patch version (bug fixes): 1.0.0 → 1.0.1 |
| `yarn version:minor` | Bump minor version (features): 1.0.0 → 1.1.0  |
| `yarn version:major` | Bump major version (breaking): 1.0.0 → 2.0.0  |

### Publishing

| Script             | Description                               |
| ------------------ | ----------------------------------------- |
| `yarn pack`        | Create tarball without publishing         |
| `yarn publish`     | Full publish with version check           |
| `yarn publish:dry` | Preview publish without actual publishing |

### Development

| Script               | Description             |
| -------------------- | ----------------------- |
| `yarn build`         | Build the project       |
| `yarn test`          | Run unit tests          |
| `yarn test:cov`      | Run tests with coverage |
| `yarn test:watch`    | Run tests in watch mode |
| `yarn lint`          | Run ESLint              |
| `yarn test:examples` | Run all examples        |

For complete versioning documentation, see [Versioning Guide](./versioning.md).

---

## Error Handling

All methods can throw errors. Common error types:

### Network Errors

```typescript
try {
  const result = await scraperService.evaluateWebsite({
    url: 'https://example.com',
    patterns: [...],
  });
} catch (error) {
  if (error.code === 'ECONNREFUSED') {
    console.error('Connection refused');
  } else if (error.code === 'ENOTFOUND') {
    console.error('DNS lookup failed');
  }
}
```

### Invalid XPath

```typescript
const validation = scraperService.validateXpath(html, ['//invalid[@xpath']);

if (!validation.valid) {
  validation.results
    .filter((r) => !r.valid)
    .forEach((r) => {
      console.error(`XPath error: ${r.error}`);
    });
}
```

### Retry Exhausted

After all retries are exhausted, an error is thrown:

```typescript
try {
  const result = await scraperService.evaluateWebsite({
    url: 'https://unreliable.com',
    patterns: [...],
  });
} catch (error) {
  console.error('Failed after all retries:', error.message);
}
```

---

## Related Documentation

- [Type Definitions](./types.md) - Complete type reference
- [Features](./features/) - Detailed feature documentation
- [Examples](../src/examples/README.md) - Code examples
