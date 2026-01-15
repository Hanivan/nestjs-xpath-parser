# XPath Validation

Validate XPath patterns before scraping to avoid runtime errors.

## Overview

The `validateXpath()` method allows you to:

- Test XPath patterns against HTML content
- Debug pattern issues before production scraping
- View sample extracted values
- Get detailed error messages for invalid patterns

## Basic Usage

```typescript
const html = `
  <html>
    <body>
      <h1>Page Title</h1>
      <div class="content">Content here</div>
    </body>
  </html>
`;

const validation = scraperService.validateXpath(html, [
  '//h1/text()',
  '//div[@class="content"]/text()',
  '//invalid[@xpath[syntax',
]);

console.log(validation);
// {
//   valid: false,
//   results: [
//     { xpath: '//h1/text()', valid: true, matchCount: 1, sample: 'Page Title' },
//     { xpath: '//div[@class="content"]/text()', valid: true, matchCount: 1, sample: 'Content here' },
//     { xpath: '//invalid[@xpath[syntax', valid: false, error: 'XPath syntax error' }
//   ]
// }
```

## Method Signature

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

### Parameters

- `html` - HTML string to validate against
- `xpathPatterns` - Array of XPath patterns to validate (optional)

### Returns

- `valid` - Overall validation status (true if all patterns valid)
- `results` - Array of validation results, one per pattern

## Validation Result Structure

### Successful Pattern

```typescript
{
  xpath: '//h1/text()',
  valid: true,
  matchCount: 1,
  sample: 'Page Title'
}
```

### Invalid Pattern

```typescript
{
  xpath: '//invalid[@xpath[syntax',
  valid: false,
  error: 'Invalid expression'
}
```

### Pattern with No Matches

```typescript
{
  xpath: '//h2/text()',
  valid: true,
  matchCount: 0,
  sample: undefined
}
```

## Use Cases

### 1. Validate Before Scraping

```typescript
async scrapeSafely(url: string) {
  // Fetch HTML first
  const response = await fetch(url);
  const html = await response.text();

  // Define patterns
  const patterns = [
    '//h1/text()',
    '//div[@class="content"]/text()',
  ];

  // Validate patterns
  const validation = this.scraperService.validateXpath(html, patterns);

  if (!validation.valid) {
    const invalidPatterns = validation.results
      .filter(r => !r.valid)
      .map(r => `${r.xpath}: ${r.error}`);

    throw new Error(`Invalid XPath patterns: ${invalidPatterns.join(', ')}`);
  }

  // Patterns are valid, proceed with scraping
  const result = await this.scraperService.evaluateWebsite({
    html,
    patterns: patterns.map(p => ({
      key: 'field',
      patternType: 'xpath' as const,
      returnType: 'text' as const,
      patterns: [p],
    })),
  });

  return result.results;
}
```

### 2. Debug Pattern Issues

```typescript
const html = '<html><body><h1>Title</h1></body></html>';

const validation = scraperService.validateXpath(html, [
  '//h1/text()',
  '//h2/text()',
  '//title/text()',
]);

validation.results.forEach((result) => {
  if (result.valid) {
    console.log(`✓ ${result.xpath}`);
    console.log(`  Matches: ${result.matchCount}`);
    console.log(`  Sample: ${result.sample || 'None'}`);
  } else {
    console.log(`✗ ${result.xpath}`);
    console.log(`  Error: ${result.error}`);
  }
});
```

### 3. Test Multiple Patterns

```typescript
// Test alternative patterns
const html = '<html><body><h1>Page Title</h1></body></html>';

const titlePatterns = [
  '//meta[@property="og:title"]/@content',
  '//h1/text()',
  '//title/text()',
];

const validation = scraperService.validateXpath(html, titlePatterns);

// Find first working pattern
const workingPattern = validation.results.find(
  (r) => r.valid && r.matchCount > 0,
);

if (workingPattern) {
  console.log(`Using pattern: ${workingPattern.xpath}`);
  console.log(`Sample: ${workingPattern.sample}`);
}
```

### 4. Check Match Counts

```typescript
const html =
  '<html><body><li class="item">1</li><li class="item">2</li></body></html>';

const validation = scraperService.validateXpath(html, ['//li[@class="item"]']);

console.log(`Found ${validation.results[0].matchCount} items`);
```

## Real-World Example

```typescript
async scrapeProducts(url: string) {
  // Fetch page
  const response = await fetch(url);
  const html = await response.text();

  // Patterns to validate
  const patterns = [
    '//div[@class="product"]',              // Container
    './/h2[@class="product-title"]/text()',  // Name
    './/span[@class="price"]/text()',       // Price
    './/img/@src',                          // Image
  ];

  // Validate
  const validation = this.scraperService.validateXpath(html, patterns);

  // Check for errors
  const invalid = validation.results.filter(r => !r.valid);
  if (invalid.length > 0) {
    console.error('Invalid patterns:');
    invalid.forEach(p => {
      console.error(`  ${p.xpath}: ${p.error}`);
    });
    throw new Error('Pattern validation failed');
  }

  // Check for empty results
  const empty = validation.results.filter(r => r.valid && r.matchCount === 0);
  if (empty.length > 0) {
    console.warn('Patterns with no matches:');
    empty.forEach(p => {
      console.warn(`  ${p.xpath}`);
    });
  }

  // Show sample data
  console.log('Validation successful. Sample data:');
  validation.results.forEach(r => {
    if (r.matchCount > 0) {
      console.log(`  ${r.xpath}:`);
      console.log(`    Matches: ${r.matchCount}`);
      console.log(`    Sample: ${r.sample}`);
    }
  });

  // Proceed with scraping
  const result = await this.scraperService.evaluateWebsite({
    html,
    patterns: [
      {
        key: 'container',
        patternType: 'xpath' as const,
        returnType: 'text' as const,
        patterns: ['//div[@class="product"]'],
        meta: { isContainer: true },
      },
      {
        key: 'name',
        patternType: 'xpath' as const,
        returnType: 'text' as const,
        patterns: ['.//h2[@class="product-title"]/text()'],
        pipes: { trim: true },
      },
      {
        key: 'price',
        patternType: 'xpath' as const,
        returnType: 'text' as const,
        patterns: ['.//span[@class="price"]/text()'],
        pipes: { trim: true },
      },
      {
        key: 'image',
        patternType: 'xpath' as const,
        returnType: 'text' as const,
        patterns: ['.//img/@src'],
      },
    ],
  });

  return result.results;
}
```

## Validation Without Patterns

If you don't provide patterns, validation returns as valid with no results:

```typescript
const validation = scraperService.validateXpath(html);

console.log(validation);
// { valid: true, results: [] }
```

## Common XPath Errors

### Syntax Errors

```typescript
// Invalid
'//h1[[[invalid'

// Result
{
  xpath: '//h1[[[invalid',
  valid: false,
  error: 'Invalid expression'
}
```

### Missing Closing Brackets

```typescript
// Invalid
'//div[@class="product"'

// Result
{
  xpath: '//div[@class="product"',
  valid: false,
  error: 'Invalid expression'
}
```

### Invalid Attribute Syntax

```typescript
// Invalid
'//meta[@content]';

// Valid (if you want element with content attribute)
'//meta[@content]';

// Valid (if you want element's content attribute value)
'//meta/@content';
```

## Best Practices

1. **Always validate patterns**: Test before production use
2. **Check match counts**: Ensure patterns find expected number of matches
3. **Use sample data**: Verify extracted values are correct
4. **Test edge cases**: Validate with various HTML structures
5. **Handle failures gracefully**: Provide fallback patterns

## Suppressing XPath Error Messages

By default, libxmljs logs XPath syntax errors to stderr. When validating patterns that are expected to fail, or when using alternative patterns, you can suppress these error messages.

### When to Use

- **Alternative patterns**: When using `alterPattern` with fallback XPaths, you don't need error messages for failed patterns
- **Validation**: When validating XPaths and expecting some to fail
- **Cleaner logs**: When you want cleaner console output during development

### Configuring Error Suppression

```typescript
import { Module } from '@nestjs/common';
import { ScraperHtmlModule } from '@hanivanrizky/nestjs-xpath-parser';

@Module({
  imports: [
    ScraperHtmlModule.forRoot({
      suppressXpathErrors: true, // Suppress libxmljs XPath error messages
    }),
  ],
})
export class AppModule {}
```

### Example with Alternative Patterns

When using `suppressXpathErrors: true` at module level, failed fallback patterns won't produce error messages:

```typescript
// Module configuration
ScraperHtmlModule.forRoot({
  suppressXpathErrors: true,
});

// Usage - no XPath errors in console
const result = await scraperService.evaluateWebsite({
  html: '<html><body><h1>Title</h1></body></html>',
  patterns: [
    {
      key: 'title',
      patternType: 'xpath',
      returnType: 'text',
      patterns: ['//meta[@property="og:title"]/@content'], // Will fail silently
      meta: {
        alterPattern: ['//h1/text()', '//title/text()'], // Fallback patterns
      },
    },
  ],
});
```

### Validation with Error Suppression

```typescript
// Module with error suppression enabled
ScraperHtmlModule.forRoot({
  suppressXpathErrors: true,
});

// Validate patterns - invalid patterns won't print to stderr
const validation = scraperService.validateXpath(html, [
  '//h1/text()', // Valid
  '//p/text()', // Valid
  '//invalid[[[xpath', // Invalid, but no error printed to console
]);

// Check validation results programmatically
validation.results.forEach((result) => {
  if (!result.valid) {
    console.log(`Invalid pattern: ${result.xpath}`);
    console.log(`Error: ${result.error}`);
  }
});
```

### Async Configuration

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
        suppressXpathErrors: configService.get<boolean>(
          'SCRAPER_SUPPRESS_XPATH_ERRORS',
          false,
        ),
      }),
      inject: [ConfigService],
    }),
  ],
})
export class AppModule {}
```

### Environment Variable

```env
# .env
SCRAPER_SUPPRESS_XPATH_ERRORS=true
```

## Related Features

- [Pattern-Based Extraction](./pattern-based-extraction.md) - Using validated patterns
- [Container-Based Extraction](./container-extraction.md) - Validating container patterns
- [Alternative Patterns](./pattern-based-extraction.md#fallback-patterns) - Providing fallbacks
- [Logging Configuration](./logging.md) - Control overall log verbosity
