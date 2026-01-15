# Pattern-Based Extraction

Define extraction patterns with rich metadata for flexible data extraction.

## Overview

Pattern-based extraction allows you to define structured extraction rules using XPath patterns. Each pattern specifies:

- A key name for the extracted field
- The pattern type (XPath)
- Return type (text or raw HTML)
- One or more XPath patterns
- Optional metadata for controlling extraction behavior
- Optional data cleaning pipes

## Basic Pattern Definition

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
    key: 'description',
    patternType: 'xpath',
    returnType: 'text',
    patterns: ['//meta[@name="description"]/@content'],
    pipes: {
      trim: true,
      decode: true,
    },
  },
];
```

## Pattern Field Options

### key

The field name in the result object.

```typescript
{
  key: 'productName', // Will appear as { productName: '...' }
  // ...
}
```

### patternType

The type of pattern to use. Currently only `'xpath'` is supported.

```typescript
{
  patternType: 'xpath',
  // ...
}
```

### returnType

The type of data to extract:

- `'text'` - Extract text content (default for most cases)
- `'rawHTML'` - Get raw HTML including tags

```typescript
// Text extraction
{
  key: 'title',
  returnType: 'text',
  patterns: ['//h1/text()'], // Returns: "Page Title"
}

// HTML extraction
{
  key: 'content',
  returnType: 'rawHTML',
  patterns: ['//article'], // Returns: "<article><p>Content...</p></article>"
}
```

### patterns

Array of XPath patterns. The first matching pattern wins.

```typescript
{
  key: 'price',
  patterns: [
    '//span[@class="price"]/text()',  // Tried first
    '//div[@class="price"]/text()',   // Tried if first fails
    '//p[@class="price"]/text()',     // Tried if previous fail
  ],
}
```

### meta

Pattern metadata for controlling extraction behavior.

#### multiple

Extract array of values instead of single value.

```typescript
{
  key: 'tags',
  patterns: ['//a[@rel="tag"]/text()'],
  meta: {
    multiple: true, // Returns: ['tag1', 'tag2', 'tag3']
  },
}

// With comma joining
{
  key: 'keywords',
  patterns: ['//meta[@name="keywords"]/@content'],
  meta: {
    multiple: 'with comma', // Returns: "tag1, tag2, tag3"
  },
}
```

#### multiline

Join multiple values with space instead of returning array.

```typescript
{
  key: 'description',
  patterns: ['.//p/text()'],
  meta: {
    multiple: true,
    multiline: true, // Returns: "Paragraph 1 Paragraph 2 Paragraph 3"
  },
}
```

#### alterPattern

Alternative/fallback patterns to try if primary patterns fail.

```typescript
{
  key: 'title',
  patterns: ['//meta[@property="og:title"]/@content'], // Primary pattern
  meta: {
    alterPattern: [
      '//h1/text()',              // Fallback 1
      '//title/text()',           // Fallback 2
      '//h2[@class="title"]/text()', // Fallback 3
    ],
  },
}
```

**Use cases:**

- Handle different HTML structures across websites
- Support multiple metadata formats (Open Graph, Schema.org, standard meta tags)
- Graceful degradation when page structure changes

#### isContainer

Mark this pattern as a container for list extraction. See [Container-Based Extraction](./container-extraction.md) for details.

```typescript
{
  key: 'container',
  patterns: ['//div[@class="product-card"]'],
  meta: { isContainer: true },
}
```

### pipes

Data cleaning transformations applied after extraction.

```typescript
{
  key: 'price',
  patterns: ['//span[@class="price"]/text()'],
  pipes: {
    trim: true,              // Remove whitespace
    toLowerCase: false,      // Convert to lowercase
    toUpperCase: false,      // Convert to uppercase
    decode: true,            // Decode HTML entities
    replace: [
      { from: '\\$', to: '' },     // Remove $ sign
      { from: ',', to: '' },       // Remove commas
      { from: '\\s+', to: ' ' },   // Normalize spaces (regex)
    ],
  },
}
```

For complete pipe documentation, see [Data Cleaning Pipes](./data-cleaning-pipes.md).

## Complete Example

```typescript
interface Article {
  title: string;
  description: string;
  author: string;
  tags: string[];
  content: string;
}

const patterns: PatternField[] = [
  {
    key: 'title',
    patternType: 'xpath',
    returnType: 'text',
    patterns: ['//meta[@property="og:title"]/@content'],
    meta: {
      alterPattern: ['//h1[@class="title"]/text()', '//title/text()'],
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
    key: 'author',
    patternType: 'xpath',
    returnType: 'text',
    patterns: ['//meta[@name="author"]/@content'],
    meta: {
      alterPattern: ['//a[@rel="author"]/text()'],
    },
    pipes: { trim: true },
  },
  {
    key: 'tags',
    patternType: 'xpath',
    returnType: 'text',
    patterns: ['//a[@rel="tag"]/text()'],
    meta: { multiple: true },
  },
  {
    key: 'content',
    patternType: 'xpath',
    returnType: 'rawHTML',
    patterns: ['//article'],
  },
];

const result = await scraper.evaluateWebsite<Article>({
  url: 'https://example.com/article',
  patterns,
});

console.log(result.results[0]);
// {
//   title: "Article Title",
//   description: "Article description...",
//   author: "John Doe",
//   tags: ["tag1", "tag2", "tag3"],
//   content: "<article><p>Full content...</p></article>"
// }
```

## Best Practices

1. **Use alterPattern for robustness**: Always provide fallback patterns for critical data
2. **Be specific with XPath**: Use attributes and class names for more reliable selection
3. **Clean your data**: Use pipes to normalize extracted data
4. **Test your patterns**: Use `validateXpath()` to verify patterns work before scraping
5. **Order patterns by specificity**: Put most specific patterns first

## Related Features

- [Container-Based Extraction](./container-extraction.md) - Extract lists of items
- [Data Cleaning Pipes](./data-cleaning-pipes.md) - Transform extracted data
- [XPath Validation](./xpath-validation.md) - Test patterns before scraping
