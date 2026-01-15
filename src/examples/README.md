# Examples

This directory contains practical examples demonstrating various features of the `@hanivanrizky/nestjs-xpath-scraper` package.

## Available Examples

### 1. Basic Product Scraping (`01-basic-product-scraping.ts`)

Demonstrates fundamental scraping concepts:
- Container-based extraction for product listings
- Pattern field definitions with XPath
- Data cleaning with pipes
- Type-safe extraction

**Run:**
```bash
ts-node src/examples/01-basic-product-scraping.ts
```

### 2. XPath Validation (`02-xpath-validation.ts`)

Shows how to validate XPath patterns:
- Testing pattern correctness before scraping
- Debugging XPath selectors
- Viewing sample extracted values
- Pattern refinement techniques

**Run:**
```bash
ts-node src/examples/02-xpath-validation.ts
```

### 3. Data Cleaning with Pipes (`03-data-cleaning-pipes.ts`)

Covers all data cleaning transformations:
- `trim` - Remove whitespace
- `toLowerCase` / `toUpperCase` - Case conversion
- `replace` - Find and replace with regex
- `decode` - HTML entity decoding
- Combining multiple pipes

**Run:**
```bash
ts-node src/examples/03-data-cleaning-pipes.ts
```

### 4. Alternative Patterns and Fallbacks (`04-alternative-patterns.ts`)

Demonstrates robust extraction strategies:
- Using `alterPattern` for fallback XPath patterns
- Handling different HTML structures
- Supporting multiple metadata formats (Open Graph, standard meta tags)
- Graceful degradation

**Run:**
```bash
ts-node src/examples/04-alternative-patterns.ts
```

### 5. XML Parsing (`05-xml-parsing.ts`)

Shows XML content parsing:
- Parsing sitemaps (sitemap.xml)
- Extracting RSS feed data
- Using `contentType: 'text/xml'`
- Working with XML structures

**Run:**
```bash
ts-node src/examples/05-xml-parsing.ts
```

### 6. Real-World E-commerce Scraping (`06-real-world-ecommerce.ts`)

Complete production-ready example:
- Scraping from ScrapingCourse.com
- Comprehensive product data extraction
- Analytics and data aggregation
- Production tips and best practices

**Run:**
```bash
ts-node src/examples/06-real-world-ecommerce.ts
```

## Running Examples

### Prerequisites

Make sure dependencies are installed:

```bash
yarn install
```

### Run All Examples

Run all examples sequentially:

```bash
# Using yarn
yarn test:examples

# Or directly
./scripts/run-examples.sh
```

### Run Individual Examples

Run a specific example by number:

```bash
# Run example 1 (basic product scraping)
./scripts/run-examples.sh 1

# Run example 2 (xpath validation)
./scripts/run-examples.sh 2

# Run example 3 (data cleaning)
./scripts/run-examples.sh 3

# ... and so on
```

Or run directly with ts-node:

```bash
npx ts-node -r tsconfig-paths/register src/examples/01-basic-product-scraping.ts
```

Or after building, using node:

```bash
yarn build
node dist/examples/01-basic-product-scraping.js
```

### Import in Your Code

You can also import and use the demonstration functions in your own code:

```typescript
import {
  demonstrateBasicProductScraping,
  demonstrateXPathValidation,
  demonstrateDataCleaningPipes,
  demonstrateAlternativePatterns,
  demonstrateXmlParsing,
  demonstrateRealWorldEcommerce,
} from '@hanivanrizky/nestjs-xpath-scraper/examples';

// Run a specific demo
await demonstrateBasicProductScraping();
```

## Example Structure

Each example follows this pattern:

```typescript
import { ScraperHtmlService } from '../scraper-html.service';
import { HttpService } from '@nestjs/axios';
import { PatternField } from '../types';

async function demonstrateFeature() {
  const httpService = new HttpService();
  const scraper = new ScraperHtmlService(httpService);

  // Example code here
}

// Run if executed directly
if (require.main === module) {
  demonstrateFeature()
    .then(() => console.log('Demo completed!'))
    .catch(console.error);
}

export { demonstrateFeature };
```

## Tips

1. **Start with Example 1** if you're new to the package
2. **Check Example 2** if your XPath patterns aren't working
3. **Use Example 3** to learn about data transformation
4. **Study Example 6** for production-ready patterns
5. **Modify examples** to fit your specific scraping needs

## Common Patterns

### Container-Based Extraction
```typescript
const patterns: PatternField[] = [
  {
    key: 'container',
    patternType: 'xpath',
    returnType: 'text',
    patterns: ['//div[@class="item"]'],
    meta: { isContainer: true },
  },
  {
    key: 'title',
    patternType: 'xpath',
    returnType: 'text',
    patterns: ['.//h2/text()'],
    pipes: { trim: true },
  },
];
```

### Alternative Patterns for Robust Extraction
```typescript
{
  key: 'title',
  patternType: 'xpath',
  returnType: 'text',
  patterns: ['//meta[@property="og:title"]/@content'],
  meta: {
    alterPattern: [
      '//h1/text()',
      '//title/text()',
    ],
  },
}
```

### Data Cleaning
```typescript
{
  key: 'price',
  patternType: 'xpath',
  returnType: 'text',
  patterns: ['//span[@class="price"]/text()'],
  pipes: {
    trim: true,
    replace: [
      { from: '\\$', to: '' },
      { from: ',', to: '' },
    ],
  },
}
```

## Need Help?

- Check the main README at the project root
- Review the TypeScript type definitions
- Look at the source code in `src/scraper-html.service.ts`
- Open an issue on GitHub

## Contributing

Have a useful example? Submit a PR! Follow the existing example structure and naming conventions.
