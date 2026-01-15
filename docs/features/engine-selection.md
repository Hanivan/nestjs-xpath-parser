# Engine Selection

Choose between libxmljs (default, fastest) or JSDOM (browser-like) for HTML/XML parsing.

## Overview

The package supports two HTML/XML parsing engines, each with different strengths:

- **libxmljs** (default) - Native C++ bindings, fastest performance
- **JSDOM** - Pure JavaScript, browser-like environment

## libxmljs (Default)

### Characteristics

- **Native C++ bindings** - Fastest performance
- **Full XPath 1.0 support** - Complete XPath implementation
- **Lower memory usage** - Efficient for large documents
- **Best for production** - Battle-tested and reliable

### Configuration

```typescript
import { Module } from '@nestjs/common';
import { ScraperHtmlModule } from '@hanivanrizky/nestjs-xpath-parser';

@Module({
  imports: [
    ScraperHtmlModule.forRoot({
      engine: 'libxmljs', // Default, can be omitted
    }),
  ],
})
export class AppModule {}
```

### When to Use libxmljs

- Production environments
- High-performance scraping
- Large HTML/XML documents
- When you need maximum speed
- When memory efficiency is important

## JSDOM

### Characteristics

- **Pure JavaScript** - No native dependencies
- **Browser-like environment** - Simulates DOM in Node.js
- **Good for testing** - Consistent with browser behavior
- **Slightly slower** - JavaScript implementation

### Configuration

```typescript
import { Module } from '@nestjs/common';
import { ScraperHtmlModule } from '@hanivanrizky/nestjs-xpath-parser';

@Module({
  imports: [
    ScraperHtmlModule.forRoot({
      engine: 'jsdom',
    }),
  ],
})
export class AppModule {}
```

### When to Use JSDOM

- Development/testing environments
- Browser compatibility testing
- Environments without native compilation support
- When you need browser-like DOM behavior
- When you cannot install native dependencies

## Async Configuration

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

### Environment Variable

```env
# .env
SCRAPER_ENGINE=libxmljs
# or
SCRAPER_ENGINE=jsdom
```

## Performance Comparison

| Engine   | Speed   | Memory | XPath Support | Native Deps | Use Case         |
| -------- | ------- | ------ | ------------- | ----------- | ---------------- |
| libxmljs | ⚡️ Fast | Low    | Full 1.0      | Yes         | Production       |
| JSDOM    | 🐢 Slow | High   | Full 1.0      | No          | Development/Test |

## Complete Example

```typescript
import { Module } from '@nestjs/common';
import { ScraperHtmlModule } from '@hanivanrizky/nestjs-xpath-parser';

@Module({
  imports: [
    ScraperHtmlModule.forRoot({
      // Use libxmljs for production performance
      engine: 'libxmljs',

      // Configure retry behavior
      maxRetries: 5,

      // Minimal logging
      logLevel: ['error', 'warn'],

      // Suppress XPath errors for cleaner logs
      suppressXpathErrors: true,
    }),
  ],
})
export class AppModule {}
```

## Configuration Summary

| Option   | Type                  | Default    | Description                    |
| -------- | --------------------- | ---------- | ------------------------------ |
| `engine` | 'libxmljs' \| 'jsdom' | 'libxmljs' | HTML/XML parsing engine to use |

## Related Features

- [HTTP Retry & Proxy](./retry-proxy.md) - Retry configuration and proxy setup
- [Logging Configuration](./logging.md) - Control log verbosity
