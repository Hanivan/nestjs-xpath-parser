# @hanivanrizky/nestjs-xpath-parser

<p align="center">
  <a href="http://nestjs.com/" target="_blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
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
- [Documentation](#documentation)
- [Quick Examples](#quick-examples)
- [Development](#development)
- [Contributing](#contributing)
- [License](#license)

## Features

- **(☆^O^☆) XPath-Based Parsing**: Full XPath 1.0 support using libxmljs2 and JSDOM engines
- **(.\_.) Pattern-Based Extraction**: Define extraction patterns with metadata for structured scraping
- **(>\_<) Container Extraction**: Extract lists of items with nested field patterns
- **(・\_・) Data Cleaning Pipes**: Built-in transformations (trim, case conversion, replace, decode HTML)
- **(☆^O^☆) Custom Pipes**: Extensible pipe system with predefined pipes (Regex, NumberNormalize, ParseAsURL, ExtractEmail, DateFormat)
- **(>\_<) Pipe Merge**: Merge multiple values before applying transformations
- **(.\_.) User-Agent Rotation**: Automatic user-agent rotation for stealth scraping
- **(o_o) XPath Validation**: Validate XPath patterns before scraping
- **(.\_.) URL Health Check**: Check if URLs are alive using HTTP HEAD requests
- **(.\_.) HTTP Fetching**: Built-in HTML/XML fetching with proxy support
- **(☆^O^☆) HTTP Retry**: Automatic retry with exponential backoff (default: 3 retries, configurable)
- **(o_o) Log Level Control**: Control which log messages are displayed (errors always logged)
- **(.\_.) XPath Error Suppression**: Optional suppression of libxmljs XPath error messages
- **(☆^O^☆) Engine Selection**: Choose between libxmljs (default) or JSDOM for parsing
- **(.\_.) Multi-Format Support**: Parse both HTML and XML content
- **(.\_.) Return Types**: Extract text content or raw HTML
- **(>\_<) Alternative Patterns**: Fallback patterns for robust extraction
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

**Basic usage (with defaults):**

```typescript
import { Module } from '@nestjs/common';
import { ScraperHtmlModule } from '@hanivanrizky/nestjs-xpath-parser';

@Module({
  imports: [ScraperHtmlModule.forRoot()],
})
export class AppModule {}
```

**With custom retry configuration:**

```typescript
import { Module } from '@nestjs/common';
import { ScraperHtmlModule } from '@hanivanrizky/nestjs-xpath-parser';

@Module({
  imports: [
    ScraperHtmlModule.forRoot({
      maxRetries: 5, // Custom retry count (default: 3)
      logLevel: ['error', 'warn'], // Only log errors and warnings
      suppressXpathErrors: true, // Suppress libxmljs XPath error messages
      engine: 'libxmljs', // Use libxmljs (default) or 'jsdom' for JSDOM
    }),
  ],
})
export class AppModule {}
```

**Async configuration:**

```typescript
import { Module } from '@nestjs/common';
import { ScraperHtmlModule } from '@hanivanrizky/nestjs-xpath-parser';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot(),
    ScraperHtmlModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        maxRetries: configService.get<number>('SCRAPER_MAX_RETRIES', 3),
        logLevel: configService.get<string[]>('SCRAPER_LOG_LEVEL', [
          'log',
          'error',
          'warn',
        ]),
        suppressXpathErrors: configService.get<boolean>(
          'SCRAPER_SUPPRESS_XPATH_ERRORS',
          false,
        ),
        engine: configService.get<'libxmljs' | 'jsdom'>(
          'SCRAPER_ENGINE',
          'libxmljs',
        ),
      }),
      inject: [ConfigService],
    }),
  ],
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

## Documentation

### Features

- [Pattern-Based Extraction](docs/features/pattern-based-extraction.md) - Define extraction patterns with rich metadata
- [Container-Based Extraction](docs/features/container-extraction.md) - Extract lists of structured items
- [Data Cleaning Pipes](docs/features/data-cleaning-pipes.md) - Transform extracted data with pipes
- [XPath Validation](docs/features/xpath-validation.md) - Validate patterns before scraping
- [URL Health Check](docs/features/url-health-check.md) - Check if URLs are alive
- [User-Agent Rotation](docs/features/user-agent-rotation.md) - Automatic user-agent rotation
- [HTTP Retry & Proxy](docs/features/retry-proxy.md) - Configure retry and proxy settings
- [Logging Configuration](docs/features/logging.md) - Control log verbosity
- [Engine Selection](docs/features/engine-selection.md) - Choose between libxmljs and JSDOM

### Reference

- [API Reference](docs/api-reference.md) - Complete service API documentation
- [Type Definitions](docs/types.md) - TypeScript types and interfaces
- [Versioning Guide](docs/versioning.md) - Version management and publishing
- [Examples](src/examples/README.md) - Practical code examples

## Quick Examples

### Simple Product Scraping

```typescript
interface Product {
  name: string;
  price: string;
}

const result = await scraperService.evaluateWebsite<Product>({
  url: 'https://example.com/products',
  patterns: [
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
  ],
});
```

### Article Extraction with Fallbacks

```typescript
const result = await scraperService.evaluateWebsite({
  url: 'https://example.com/article',
  patterns: [
    {
      key: 'title',
      patternType: 'xpath',
      returnType: 'text',
      patterns: ['//meta[@property="og:title"]/@content'],
      meta: {
        alterPattern: ['//h1/text()', '//title/text()'],
      },
      pipes: { trim: true },
    },
    {
      key: 'description',
      patternType: 'xpath',
      returnType: 'text',
      patterns: ['//meta[@name="description"]/@content'],
      pipes: { trim: true, decode: true },
    },
  ],
});
```

### XML Parsing

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

### URL Health Check

```typescript
// Check single URL
const result = await scraperService.checkUrlAlive('https://example.com');
if (result[0].alive) {
  console.log(`${result[0].url} is alive (${result[0].statusCode})`);
} else {
  console.log(`${result[0].url} is dead: ${result[0].error}`);
}

// Check multiple URLs
const urls = ['https://example.com', 'https://broken-link.com'];
const healthResults = await scraperService.checkUrlAlive(urls);

// Filter dead URLs
const deadUrls = healthResults.filter((r) => !r.alive);
if (deadUrls.length > 0) {
  console.warn(`Found ${deadUrls.length} dead URLs:`, deadUrls);
}
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

# Run examples
yarn test:examples
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/yourusername/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/yourusername/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
