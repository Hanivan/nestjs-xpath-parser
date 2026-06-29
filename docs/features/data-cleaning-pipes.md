# Data Cleaning Pipes

Apply transformations to extracted data using pipes.

## Overview

Pipes allow you to clean and transform extracted data without post-processing. Each pipe is applied sequentially to the extracted value.

## Available Pipes

### trim

Remove leading and trailing whitespace.

```typescript
{
  key: 'title',
  patterns: ['//h1/text()'],
  pipes: {
    trim: true,
  },
}

// Input: "  Product Title  "
// Output: "Product Title"
```

### toLowerCase

Convert text to lowercase.

```typescript
{
  key: 'status',
  patterns: ['//span[@class="status"]/text()'],
  pipes: {
    trim: true,
    toLowerCase: true,
  },
}

// Input: "  IN STOCK  "
// Output: "in stock"
```

**Note**: `toLowerCase` and `toUpperCase` are mutually exclusive. Only use one.

### toUpperCase

Convert text to uppercase.

```typescript
{
  key: 'sku',
  patterns: ['//span[@class="sku"]/text()'],
  pipes: {
    trim: true,
    toUpperCase: true,
  },
}

// Input: "abc-123"
// Output: "ABC-123"
```

### decode

Decode HTML entities to their character equivalents.

```typescript
{
  key: 'description',
  patterns: ['//meta[@name="description"]/@content'],
  pipes: {
    trim: true,
    decode: true,
  },
}

// Input: "Hello &amp; welcome &copy; 2024"
// Output: "Hello & welcome © 2024"
```

Common HTML entities decoded:

- `&amp;` → `&`
- `&lt;` → `<`
- `&gt;` → `>`
- `&quot;` → `"`
- `&apos;` → `'`
- `&copy;` → `©`
- `&reg;` → `®`
- `&nbsp;` → space

### replace

Find and replace using regex patterns.

```typescript
{
  key: 'price',
  patterns: ['.//span[@class="price"]/text()'],
  pipes: {
    trim: true,
    replace: [
      { from: '\\$', to: '' },      // Remove $ sign
      { from: ',', to: '' },        // Remove commas
      { from: '\\s+', to: ' ' },    // Normalize whitespace (regex)
    ],
  },
}

// Input: "  $1,299.99  "
// After trim: "$1,299.99"
// After replace[0]: "1,299.99"
// After replace[1]: "1299.99"
// After replace[2]: "1299.99"
// Final: "1299.99"
```

**Note**: The `from` pattern supports regex. Use double backslashes `\\` to escape.

## Combining Pipes

Pipes are applied in order: trim → decode → case conversion → replace → normalize whitespace

```typescript
{
  key: 'price',
  patterns: ['.//span[@class="price"]/text()'],
  pipes: {
    trim: true,              // 1. Remove whitespace
    decode: true,            // 2. Decode HTML entities
    toLowerCase: false,      // 3. Skip case conversion
    replace: [               // 4. Apply replacements
      { from: '[^0-9.]', to: '' }, // Remove non-numeric chars (regex)
    ],
  },
}

// Input: "  $1,299.99  "
// Output: "1299.99"
```

## Common Pipe Patterns

### Clean Price Values

```typescript
{
  key: 'price',
  patterns: ['.//span[@class="price"]/text()'],
  pipes: {
    trim: true,
    replace: [
      { from: '[^0-9.]', to: '' },
    ],
  },
}

// Input: "$1,299.99"
// Output: "1299.99"
```

### Extract Numeric Values

```typescript
{
  key: 'reviewCount',
  patterns: ['.//span[@class="reviews"]/text()'],
  pipes: {
    trim: true,
    replace: [
      { from: '[^0-9]', to: '' },
    ],
  },
}

// Input: "123 reviews"
// Output: "123"
```

### Normalize Text

```typescript
{
  key: 'description',
  patterns: ['.//div[@class="description"]/text()'],
  pipes: {
    trim: true,
    decode: true,
    replace: [
      { from: '\\s+', to: ' ' },
    ],
  },
}

// Input: "  This&amp;nbsp;is  a\ndescription  "
// Output: "This is a description"
```

### Remove Currency Symbols

```typescript
{
  key: 'amount',
  patterns: ['.//span[@class="amount"]/text()'],
  pipes: {
    trim: true,
    replace: [
      { from: '[$€£¥]', to: '' },
      { from: ',', to: '' },
    ],
  },
}

// Input: "€1,234.56"
// Output: "1234.56"
```

### Extract Domain from URL

```typescript
{
  key: 'domain',
  patterns: ['.//a/@href'],
  pipes: {
    trim: true,
    replace: [
      { from: '^https?://', to: '' },
      { from: '/.*$', to: '' },
    ],
  },
}

// Input: "https://example.com/page"
// Output: "example.com"
```

### Clean SKU/Product Codes

```typescript
{
  key: 'sku',
  patterns: ['.//span[@class="sku"]/text()'],
  pipes: {
    trim: true,
    toUpperCase: true,
    replace: [
      { from: '[^A-Z0-9]', to: '' },
    ],
  },
}

// Input: "  abc-123-xyz  "
// Output: "ABC123XYZ"
```

### Extract Email from Text

```typescript
{
  key: 'email',
  patterns: ['.//p[@class="contact"]/text()'],
  pipes: {
    trim: true,
    replace: [
      { from: '^.*?([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}).*$', to: '$1' },
    ],
  },
}

// Input: "Contact us at support@example.com for help"
// Output: "support@example.com"
```

## Complete Example

```typescript
interface Product {
  name: string;
  price: string;
  sku: string;
  description: string;
}

const patterns: PatternField[] = [
  {
    key: 'container',
    patterns: ['//div[@class="product"]'],
    meta: { isContainer: true },
  },
  {
    key: 'name',
    patterns: ['.//h2/text()'],
    pipes: {
      trim: true,
      replace: [{ from: '\\s+', to: ' ' }],
    },
  },
  {
    key: 'price',
    patterns: ['.//span[@class="price"]/text()'],
    pipes: {
      trim: true,
      replace: [{ from: '[^0-9.]', to: '' }],
    },
  },
  {
    key: 'sku',
    patterns: ['.//span[@class="sku"]/text()'],
    pipes: {
      trim: true,
      toUpperCase: true,
    },
  },
  {
    key: 'description',
    patterns: ['.//p[@class="description"]/text()'],
    pipes: {
      trim: true,
      decode: true,
      replace: [{ from: '\\s+', to: ' ' }],
    },
  },
];

const result = await scraper.evaluateWebsite<Product>({
  url: 'https://example.com/products',
  patterns,
});

console.log(result.results[0]);
// {
//   name: "Product Name",
//   price: "1299.99",
//   sku: "ABC-123-XYZ",
//   description: "This is a product description"
// }
```

## Pipe Execution Order

Pipes are applied in this specific order:

1. **trim** - Remove whitespace
2. **decode** - Decode HTML entities
3. **toLowerCase/toUpperCase** - Case conversion
4. **replace** - Apply all replacement rules
5. **Normalize whitespace** - Final whitespace cleanup (automatic)

## Best Practices

1. **Always trim first**: Remove whitespace before other transformations
2. **Use regex sparingly**: Simple string replacements are faster
3. **Test your patterns**: Verify output with real data
4. **Chain carefully**: Consider the order of replacements
5. **Escape properly**: Use `\\` for regex escape sequences

## Custom Pipes

For advanced transformations beyond built-in pipes, you can create and use custom pipes.

### Using Predefined Custom Pipes

The library includes several predefined custom pipes:

#### RegexPipe

Apply multiple regex replacements with better control than built-in replace.

```typescript
{
  key: 'title',
  patterns: ['.//h1/text()'],
  pipes: {
    trim: true,
    custom: [
      {
        type: 'regex',
        rules: [
          { pattern: '^Prefix: ', replacement: '', flags: '' },
          { pattern: '\\s+', replacement: ' ', flags: 'g' },
        ],
      },
    ],
  },
}
```

#### NumberNormalizePipe

Convert human-readable numbers (1.5K, 2.3M) to actual numbers.

```typescript
{
  key: 'views',
  patterns: ['.//span[@class="views"]/text()'],
  pipes: {
    custom: [{ type: 'num-normalize' }],
  },
}
// Input: "1.5K" → Output: "1500"
// Input: "2.3M" → Output: "2300000"
```

#### ParseAsURLPipe

Resolve relative URLs to absolute URLs using the fetched page's URL as base.

```typescript
{
  key: 'link',
  patterns: ['.//a/@href'],
  pipes: {
    custom: [{ type: 'parse-as-url' }],
  },
}

// When scraping from https://example.com/path/to/page
// Input: "/other/page" → Output: "https://example.com/other/page"
// Input: "page" → Output: "https://example.com/path/page"
```

**Note**: The `baseUrl` is automatically set from the fetched URL.

#### ExtractEmailPipe

Extract email addresses from text.

```typescript
{
  key: 'email',
  patterns: ['.//p[@class="contact"]/text()'],
  pipes: {
    custom: [{ type: 'extract-email' }],
  },
}
// Input: "Contact us at support@example.com for help"
// Output: "support@example.com"
```

#### DateFormatPipe

Convert date strings to Unix timestamps.

```typescript
{
  key: 'timestamp',
  patterns: ['.//time/@datetime'],
  pipes: {
    custom: [{ type: 'date-format', format: 'YYYY-MM-DD' }],
  },
}
// Input: "2024-01-15" → Output: "1705334400"
```

#### UrlResolvePipe

Resolve relative URLs to absolute URLs with a specified base URL.

```typescript
{
  key: 'fullUrl',
  patterns: ['.//a/@href'],
  pipes: {
    custom: [{ type: 'url-resolve', baseUrl: 'https://example.com' }],
  },
}
// Input: "/page" → Output: "https://example.com/page"
```

#### CleanHtmlPipe

Strip script/style tags and return visible text content, one line per text node.

```typescript
{
  key: 'body',
  patterns: ['.//div[@class="content"]'],
  returnType: 'rawHTML',
  pipes: {
    custom: [{ type: 'clean-html' }],
  },
}
// Input: "<div>Hello<script>alert(1)</script><style>body{}</style>World</div>"
// Output: "Hello\nWorld"
```

Useful when extracting `rawHTML` from a container and you want readable text without markup noise.

#### RegexExtractionPipe

Extract the first regex match from a string. Use `regex-extraction` for generic values, `regex-extraction--page` when the input is full page text, or `regex-extraction--url` when the input is a URL string. All three variants share the same fields and behaviour.

| Field | Type | Default | Description |
|---|---|---|---|
| `regex` | `string` | — (required) | Regular expression pattern to match |
| `flag` | `string` | `'g'` | Regex flags (e.g. `'gi'`, `'m'`) |

```typescript
{
  key: 'version',
  patterns: ['//meta[@name="generator"]/@content'],
  pipes: {
    custom: [{ type: 'regex-extraction', regex: '\\d+\\.\\d+\\.\\d+', flag: '' }],
  },
}
// Input: "WordPress 6.4.2"
// Output: "6.4.2"
```

```typescript
// Page-scoped variant — semantically signals the value is full page HTML
{ type: 'regex-extraction--page', regex: 'articleId=(\\d+)', flag: 'i' }

// URL-scoped variant — semantically signals the value is a URL string
{ type: 'regex-extraction--url', regex: 'https://[^"]+\\.jpg', flag: '' }
```

#### RegexReplacePipe

Replace all occurrences of a regex pattern with a replacement string. Use `regex-replace` for generic values, `regex-replace--page` for page text, or `regex-replace--url` for URL strings. All three variants share the same fields and behaviour.

| Field | Type | Default | Description |
|---|---|---|---|
| `regex` | `string` | — (required) | Regular expression pattern to match |
| `flag` | `string` | `'g'` | Regex flags |
| `textReplacement` | `string` | `''` | Replacement string (supports `$1`, `$2`, … capture groups) |

```typescript
{
  key: 'price',
  patterns: ['.//span[@class="price"]/text()'],
  pipes: {
    custom: [
      { type: 'regex-replace', regex: '[^0-9.]', flag: 'g', textReplacement: '' },
    ],
  },
}
// Input: "$1,299.99"
// Output: "1299.99"
```

```typescript
// Page-scoped variant
{ type: 'regex-replace--page', regex: '<[^>]+>', flag: 'g', textReplacement: '' }

// URL-scoped variant — strip query string
{ type: 'regex-replace--url', regex: '\\?.*$', flag: '', textReplacement: '' }
```

#### ExtractUrlParamsPipe

Parse the input as a URL, check whether it matches a regex, and if so return the value of a named query-string parameter.

| Field | Type | Default | Description |
|---|---|---|---|
| `regex` | `string` | — (required) | Regex that must match the URL for extraction to occur |
| `flag` | `string` | `'g'` | Regex flags |
| `paramKey` | `string` | — (required) | Query-string parameter name whose value to return |

```typescript
{
  key: 'threadId',
  patterns: ['.//a/@href'],
  pipes: {
    custom: [
      { type: 'extract-url-params', regex: '/thread/', flag: 'i', paramKey: 'id' },
    ],
  },
}
// Input: "https://forum.example.com/thread/?id=42&page=1"
// Output: "42"
// If the URL does not match the regex, the original value is returned unchanged.
```

#### MediaFilterPipe

Remove `data:image/gif` data-URI tokens from a space-separated `srcset`-style string. Useful for stripping tracking pixels and low-quality GIF placeholders from image source sets.

No configuration fields — just use `{ type: 'media-filter' }`.

```typescript
{
  key: 'image',
  patterns: ['.//img/@srcset'],
  pipes: {
    custom: [{ type: 'media-filter' }],
  },
}
// Input: "https://example.com/photo.jpg data:image/gif;base64,R0l..."
// Output: "https://example.com/photo.jpg"
```

#### QueryAppendPipe

Append a fixed query-string parameter to a URL. If the input is not a valid URL the original value is returned unchanged.

| Field | Type | Default | Description |
|---|---|---|---|
| `paramKey` | `string` | — (required) | Parameter name to append |
| `paramValue` | `string` | — (required) | Parameter value to append |

```typescript
{
  key: 'link',
  patterns: ['.//a/@href'],
  pipes: {
    custom: [
      { type: 'parse-as-url' },
      { type: 'query-append', paramKey: 'ref', paramValue: 'scraper' },
    ],
  },
}
// Input: "https://example.com/article"
// Output: "https://example.com/article?ref=scraper"
```

#### JsonPathPipe

Parse the input as JSON and extract a value using a [JSONPath](https://goessner.net/articles/JsonPath/) expression. Returns the extracted value as a string; if parsing fails the original value is returned.

| Field | Type | Default | Description |
|---|---|---|---|
| `path` | `string` | — (required) | JSONPath expression (e.g. `$.store.book[0].title`) |

```typescript
{
  key: 'author',
  patterns: ['.//script[@type="application/ld+json"]/text()'],
  pipes: {
    custom: [{ type: 'json-path', path: '$.author.name' }],
  },
}
// Input: '{"author":{"name":"Jane Doe"},"datePublished":"2024-01-01"}'
// Output: "Jane Doe"
```

#### QueryRemoverPipe

Remove specified query-string parameters from a URL. If the URL cannot be parsed the original value is returned unchanged. Use `query-remover` for generic values, `query-remover--page` for page-context inputs, or `query-remover--url` for URL strings. All three variants share the same fields and behaviour.

| Field | Type | Default | Description |
|---|---|---|---|
| `removed` | `string \| string[]` | — (required) | Parameter key(s) to remove. Pass a string for one key or an array for multiple. |

```typescript
{
  key: 'cleanUrl',
  patterns: ['.//a/@href'],
  pipes: {
    custom: [
      { type: 'query-remover', removed: ['utm_source', 'utm_medium'] },
    ],
  },
}
// Input: "https://example.com/article?id=42&utm_source=email&utm_medium=cpc"
// Output: "https://example.com/article?id=42"
```

```typescript
// Single key as string
{ type: 'query-remover', removed: 'sid' }

// Page-scoped variant
{ type: 'query-remover--page', removed: ['sid', 'token'] }

// URL-scoped variant
{ type: 'query-remover--url', removed: 'sessionId' }
```

#### DateRelativePipe

Convert relative or natural-language date strings to Unix timestamps (seconds). Falls back to `now` when nothing matches.

**Pipeline (applied in order):**
1. `format` (if supplied) — try `moment(v, format)` for absolute date strings
2. `ms` — short/medium English codes: `"27m"`, `"2h"`, `"3d"`, `"2 hours"`, `"3 days"`
3. `localeMap` — consumer-supplied translation map, then retried through ms
4. `chrono-node` — natural language + absolute dates: `"yesterday"`, `"Jun 29 2026"`, `"2024-01-15"`
5. fallback — returns `now` (not `0`) when nothing matches

| Field | Type | Default | Description |
|---|---|---|---|
| `localeMap` | `Record<string, string>` | — | Consumer-supplied map of locale words → English equivalents |
| `daysPerMonth` | `number` | `30` | Days used when approximating `"N months"` |
| `timezone` | `string` | — | IANA timezone name (e.g. `Asia/Jakarta`). Shifts `now` reference and affects `reverse()` |
| `format` | `string` | — | Moment.js format string for absolute date parsing (e.g. `DD MMM YYYY`). Also used by `reverse()` |

```typescript
// English only (no params needed):
{ type: 'date-relative' }

// With explicit format + timezone:
{ type: 'date-relative', format: 'DD MMM YYYY', timezone: 'Asia/Jakarta' }
```

```typescript
// Indonesian forum:
{
  type: 'date-relative',
  timezone: 'Asia/Jakarta',
  localeMap: {
    'yang lalu': 'ago',
    lalu: 'ago',
    jam: 'hours',
    menit: 'minutes',
    hari: 'days',
    minggu: 'weeks',
    bulan: 'months',
    tahun: 'years',
    'baru saja': 'just now',
  },
}
// "27 menit lalu" → <unix timestamp ~27 minutes ago>
// "2 jam lalu"    → <unix timestamp ~2 hours ago>
// "baru saja"     → <current unix timestamp>
```

```typescript
// Japanese forum:
{
  type: 'date-relative',
  timezone: 'Asia/Tokyo',
  localeMap: {
    '分前': 'minutes ago',
    '時間前': 'hours ago',
    '日前': 'days ago',
    'ヶ月前': 'months ago',
    '年前': 'years ago',
    'たった今': 'just now',
  },
}
// "27分前" → <unix timestamp ~27 minutes ago>
```

The `reverse()` method converts a Unix timestamp back to a formatted string (using `format` if supplied, otherwise ISO 8601). The lib has **no built-in locale maps** — the consuming service must supply its own `localeMap` for non-English forums.

#### DateFormatSpecialPipe

Return a relative date string based on a special keyword. Useful for injecting relative date boundaries into a scraping pipeline.

No configuration fields — just use `{ type: 'date-format-special' }` with one of the two supported keyword values.

| Input value | Output |
|---|---|
| `'month_in'` | Current date/time minus 1 month, as `YYYY-MM-DD HH:mm:ss` |
| `'month_over'` | Current date/time minus 2 months, as `YYYY-MM-DD HH:mm:ss` |
| anything else | Returned unchanged |

```typescript
{
  key: 'since',
  patterns: ['.//meta[@name="date-range"]/@content'],
  pipes: {
    custom: [{ type: 'date-format-special' }],
  },
}
// Input: "month_in"
// Output: "2024-05-15 10:30:00" (one month before the current date)
```

### Creating Custom Pipes

You can create your own pipes by extending `PipeTransform`:

```typescript
import { PipeTransform, PIPE_REGISTRY } from '@hanivanrizky/nestjs-xpath-parser';

// Define your pipe
class ReversePipe extends PipeTransform<string, string> {
  type: 'reverse' = 'reverse';

  exec(value: string): string {
    return value.split('').reverse().join('');
  }
}

// Register it
PIPE_REGISTRY['reverse'] = ReversePipe;

// Use it in patterns
{
  key: 'reversed',
  patterns: ['.//h1/text()'],
  pipes: {
    custom: [{ type: 'reverse' }],
  },
}
```

### Custom Pipe with Dynamic baseUrl

If your custom pipe needs the fetched URL (like `ParseAsURLPipe`), add a `baseUrl` property:

```typescript
class MyUrlPipe extends PipeTransform<string, string> {
  type: 'my-url' = 'my-url';

  // This will be automatically set when scraping!
  baseUrl?: string;

  exec(value: string): string {
    if (this.baseUrl && !value.startsWith('http')) {
      return new URL(value, this.baseUrl).toString();
    }
    return value;
  }
}

PIPE_REGISTRY['my-url'] = MyUrlPipe;

// Use it - baseUrl is automatically set from fetched URL
{
  key: 'link',
  patterns: ['.//a/@href'],
  pipes: {
    custom: [{ type: 'my-url' }],
  },
}
```

### Pipe Properties

All custom pipe configs use this structure:

```typescript
{
  type: 'pipe-type',           // Required: Unique identifier for the pipe
  property1: 'value1',          // Pipe-specific properties
  property2: 'value2',          // Passed to the pipe constructor via class-transformer
}
```

### Chaining Custom Pipes

You can chain multiple custom pipes with built-in pipes:

```typescript
{
  key: 'price',
  patterns: ['.//span[@class="price"]/text()'],
  pipes: {
    trim: true,                              // Built-in
    custom: [
      { type: 'regex', rules: [{ pattern: '^\\$', replacement: '' }] },
      { type: 'num-normalize' },              // "25.5K" → "25500"
    ],
  },
}
```

### Merge with Custom Pipes

Use `merge: true` to combine multiple values before applying custom pipes:

```typescript
{
  key: 'title',
  patterns: ['.//div[@class="info"]//text()'],
  meta: { multiple: true },
  pipes: {
    merge: true,  // Merge text nodes first
    custom: [
      {
        type: 'regex',
        rules: [{ pattern: '^Judul : ', replacement: '' }],
      },
    ],
  },
}
// Input text nodes: ["Judul", " ", ": Test"]
// After merge: "Judul : Test"
// After regex: "Test"
```

## Related Features

- [Pattern-Based Extraction](./pattern-based-extraction.md) - Using pipes in patterns
- [Container-Based Extraction](./container-extraction.md) - Pipes with containers
- [Examples](../../src/examples/09-custom-pipes.ts) - Complete custom pipe examples
