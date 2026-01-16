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
