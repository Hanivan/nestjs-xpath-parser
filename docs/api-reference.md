# API Reference

Complete API reference for `ScraperHtmlService`.

## Internal Architecture

`ScraperHtmlService` is a thin orchestrator that delegates to three focused
engines. The public API below is unchanged; this section is for contributors
and advanced users who want to understand or extend the codebase.

| Engine | File | Responsibility |
|--------|------|----------------|
| `HtmlParser` | `src/utils/html-parser.ts` | HTML/XML parsing, XPath evaluation, container extraction, `validateXpath()` |
| `HttpTransport` | `src/utils/http-transport.ts` | Axios / CycleTLS fetching, retry + backoff, proxy, URL health check |
| `PipeEngine` | `src/pipes/pipe-engine.ts` | Built-in pipes (trim, decode, replace, …) and custom pipe instantiation |

All three engines are instantiated inside `ScraperHtmlService`'s constructor
and are **not** exposed as NestJS providers. If you need direct access to an
engine, import it from the package barrel:

```typescript
import { HtmlParser, HttpTransport, PipeEngine } from '@hanivanrizky/nestjs-xpath-parser';
```

---

## Service Methods

### evaluateWebsite

Main method for scraping websites with pattern-based extraction.

```typescript
evaluateWebsite<T = ExtractionResult>(
  options: EvaluateOptions
): Promise<{ results: T[]; document: unknown; rawHtml?: string }>
```

#### Parameters

| Parameter             | Type                        | Required | Description                           |
| --------------------- | --------------------------- | -------- | ------------------------------------- |
| `options.url`         | `string`                    | No\*     | URL to fetch and parse                                                    |
| `options.html`        | `string`                    | No\*     | Pre-fetched HTML string                                                   |
| `options.patterns`    | `PatternField[]`            | Yes      | Extraction patterns                                                       |
| `options.useProxy`    | `boolean \| string`         | No       | Enable proxy                                                              |
| `options.contentType` | `'text/html' \| 'text/xml'` | No       | Content type (default: `'text/html'`)                                     |
| `options.mode`        | `'raw' \| 'normal'`         | No       | `'raw'` — include fetched HTML as `rawHtml` in return value (default: `'normal'`) |

\*Either `url` or `html` must be provided.

#### Returns

```typescript
{
  results: T[];       // Array of extracted data objects
  document: unknown;  // Parsed DOM document
  rawHtml?: string;   // Present only when mode: 'raw'
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

**Raw mode — access fetched HTML alongside results:**

```typescript
const result = await scraperService.evaluateWebsite({
  url: 'https://example.com',
  patterns,
  mode: 'raw',
});

console.log('rawHtml present:', 'rawHtml' in result); // true
console.log('rawHtml length:', result.rawHtml?.length);
// Store rawHtml for archiving, diff detection, or re-parsing
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

> **Engine parity:** When the module resolves to the CycleTLS engine (either
> `httpEngine: 'cycletls'` or a `fingerprint` is configured), the HEAD request is
> sent through CycleTLS with the same TLS fingerprint as `evaluateWebsite`, so a
> liveness result reflects what the real fetch will see. Otherwise axios is used.

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
    console.log(`[OK] ${r.url} (${r.statusCode})`);
  } else {
    console.log(`[DEAD] ${r.url} - ${r.error || r.statusCode}`);
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

| Parameter              | Type                       | Required | Description                                                          |
| ---------------------- | -------------------------- | -------- | -------------------------------------------------------------------- |
| `options.maxRetries`   | `number`                   | No       | Maximum HTTP retries (default: 3)                                    |
| `options.parserEngine` | `'libxmljs' \| 'jsdom'`    | No       | HTML/XML parsing engine (default: `'libxmljs'`)                      |
| `options.engine`       | `'libxmljs' \| 'jsdom'`    | No       | **Deprecated** alias for `parserEngine`                              |
| `options.httpEngine`   | `'axios' \| 'cycletls'`    | No       | HTTP fetch engine (default: `'axios'`; `'cycletls'` when fingerprint set) |
| `options.fingerprint`  | `string \| TlsFingerprint` | No       | CycleTLS fingerprint: path to saved JSON or object, generated by [nestjs-browser-action](https://github.com/Hanivan/nestjs-browser-action). Implies cycletls |
| `options.timeout`      | `number`                   | No       | CycleTLS request timeout in seconds (axios engine ignores it)        |

> **Fingerprint source:** TLS fingerprints are captured/generated by
> [nestjs-browser-action](https://github.com/Hanivan/nestjs-browser-action)
> (`captureTlsFingerprint()`), then passed here as a path or `TlsFingerprint` object.

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
  httpEngine?: HttpEngine; // per-call override: 'axios' | 'cycletls'
  fingerprint?: string | TlsFingerprint; // per-call fingerprint override
  timeout?: number; // per-call CycleTLS timeout (seconds)
  mode?: 'raw' | 'normal'; // 'raw' = include rawHtml in return value
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
  /** Key name for URL in pagination result objects. Defaults to 'url'. */
  pageUrlKey?: string;
  /** Key name for page text/number in pagination result objects. Defaults to 'text'. */
  pageTextKey?: string;
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
  merge?: boolean | 'with space' | 'with comma';
  custom?: Array<Record<string, unknown>>;
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
  logLevel?: LogLevel | LogLevel[];
  suppressXpathErrors?: boolean;
  parserEngine?: ParserEngine; // 'libxmljs' (default) | 'jsdom'
  engine?: ParserEngine; // @deprecated alias for parserEngine
  httpEngine?: HttpEngine; // 'axios' (default) | 'cycletls'
  fingerprint?: string | TlsFingerprint; // implies httpEngine: 'cycletls'
  timeout?: number; // CycleTLS request timeout in seconds
  normalizeHtml?: boolean; // collapse repeated whitespace/tabs before parsing
}
```

---

## CLI Scripts

Available pnpm scripts for development and releasing:

### Release

Versioning, changelog, git tag, npm publish, and GitHub release are handled by
[release-it](https://github.com/release-it/release-it).

| Script             | Description                                       |
| ------------------ | ------------------------------------------------- |
| `pnpm release`     | Interactive release (bump, changelog, tag, publish) |
| `pnpm release:dry` | Preview a release without making any changes      |

### Development

| Script               | Description             |
| -------------------- | ----------------------- |
| `pnpm build`         | Build the project       |
| `pnpm test`          | Run unit tests          |
| `pnpm test:cov`      | Run tests with coverage |
| `pnpm test:watch`    | Run tests in watch mode |
| `pnpm lint`          | Run ESLint              |
| `pnpm test:examples` | Run all examples        |

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
