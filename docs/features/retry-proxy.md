# HTTP Retry & Proxy Configuration

Automatic retry with exponential backoff and proxy support for network requests.

## Overview

The service provides:

- **Automatic HTTP retry** with exponential backoff on failures
- **Configurable retry count** via module configuration
- **Proxy support** for corporate/restricted networks
- **Smart retry logic** - only retries on retryable errors

## HTTP Retry

### Automatic Retry Behavior

The service automatically retries failed HTTP requests with exponential backoff:

```typescript
// Retries automatically on 500+ errors or connection resets
const result = await scraperService.evaluateWebsite({
  url: 'https://example.com',
  patterns: [...],
  // No configuration needed - automatic retry
});
```

### Retryable Errors

The service retries on:

- HTTP 5xx errors (server errors)
- Network connection errors (ECONNRESET, ETIMEDOUT)
- DNS resolution failures

The service does **not** retry on:

- HTTP 4xx errors (client errors like 404, 403, 429)
- Invalid URLs
- Certificate errors

### Exponential Backoff

Retry delay increases exponentially:

- Retry 1: ~1000ms (1 second)
- Retry 2: ~2000ms (2 seconds)
- Retry 3: ~4000ms (4 seconds)
- Maximum: 10000ms (10 seconds)

## Configuring Retry Count

Configure the maximum retry count via module options:

### Using forRoot()

```typescript
import { Module } from '@nestjs/common';
import { ScraperHtmlModule } from '@hanivanrizky/nestjs-xpath-parser';

@Module({
  imports: [
    ScraperHtmlModule.forRoot({
      maxRetries: 5, // Default: 3
    }),
  ],
})
export class AppModule {}
```

### Using forRootAsync()

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

### Environment Variable

```env
# .env
SCRAPER_MAX_RETRIES=5
```

## Proxy Configuration

### Option 1: Environment Variables

Set `HTTP_PROXY` or `HTTPS_PROXY` environment variables:

```bash
export HTTP_PROXY=http://proxy.example.com:8080
export HTTPS_PROXY=http://proxy.example.com:8080
```

Then enable proxy in your requests:

```typescript
const result = await scraperService.evaluateWebsite({
  url: 'https://example.com',
  useProxy: true, // Uses HTTP_PROXY or HTTPS_PROXY env var
  patterns: [...],
});
```

### Option 2: Direct Proxy URL

Specify proxy URL directly in the request:

```typescript
const result = await scraperService.evaluateWebsite({
  url: 'https://example.com',
  useProxy: 'http://proxy.example.com:8080',
  patterns: [...],
});
```

### Proxy with Authentication

```typescript
const result = await scraperService.evaluateWebsite({
  url: 'https://example.com',
  useProxy: 'http://username:password@proxy.example.com:8080',
  patterns: [...],
});
```

## Proxy with URL Health Check

Proxy configuration also works with `checkUrlAlive()`:

```typescript
const results = await scraperService.checkUrlAlive(
  ['https://example.com', 'https://example.org'],
  {
    useProxy: 'http://proxy.example.com:8080',
  },
);
```

## Complete Examples

### E-commerce Scraping with Retry

```typescript
import { Injectable } from '@nestjs/common';
import { ScraperHtmlService } from '@hanivanrizky/nestjs-xpath-parser';

@Injectable()
export class ProductScraper {
  constructor(private readonly scraper: ScraperHtmlService) {}

  async scrapeProducts(url: string) {
    // Automatically retries on server errors
    const result = await this.scraper.evaluateWebsite({
      url,
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
          pipes: { trim: true },
        },
      ],
    });

    return result.results;
  }
}
```

### Corporate Network Scraping

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
        maxRetries: configService.get<number>('SCRAPER_MAX_RETRIES', 5),
      }),
      inject: [ConfigService],
    }),
  ],
})
export class AppModule {}

@Injectable()
export class CorporateScraper {
  constructor(private readonly scraper: ScraperHtmlService) {}

  async scrapeWithProxy(url: string) {
    // Use proxy from environment
    const result = await this.scraper.evaluateWebsite({
      url,
      useProxy: true, // Uses HTTP_PROXY or HTTPS_PROXY env var
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

    return result.results;
  }

  async scrapeWithCustomProxy(url: string, proxyUrl: string) {
    // Use specific proxy
    const result = await this.scraper.evaluateWebsite({
      url,
      useProxy: proxyUrl,
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

    return result.results;
  }
}
```

## Retry Logging

The service logs retry attempts:

```typescript
// Service logs:
// "Retry 1/3 for https://example.com after 1000ms (error: Connection reset)"
// "Retry 2/3 for https://example.com after 2000ms (error: Connection reset)"
// "Failed to fetch URL after 3 retries: https://example.com"
```

## Error Handling

```typescript
try {
  const result = await scraperService.evaluateWebsite({
    url: 'https://example.com',
    patterns: [...],
  });
} catch (error) {
  // After all retries exhausted, error is thrown
  console.error('Scraping failed after retries:', error.message);
}
```

## Best Practices

### 1. Configure Appropriate Retry Count

```typescript
// For stable APIs
ScraperHtmlModule.forRoot({ maxRetries: 2 });

// For unreliable websites
ScraperHtmlModule.forRoot({ maxRetries: 5 });

// For critical data
ScraperHtmlModule.forRoot({ maxRetries: 10 });
```

### 2. Use Proxy for Corporate Networks

```typescript
// Always enable proxy in corporate environments
const result = await scraperService.evaluateWebsite({
  url: 'https://example.com',
  useProxy: process.env.HTTP_PROXY ? true : false,
  patterns: [...],
});
```

### 3. Combine with Rate Limiting

```typescript
async scrapeMultiplePages(urls: string[]) {
  const results = [];

  for (const url of urls) {
    const result = await this.scraper.evaluateWebsite({
      url,
      patterns: [...],
    });

    results.push(...result.results);

    // Rate limiting - respect server
    await this.delay(1000);
  }

  return results;
}

private delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
```

### 4. Monitor Retry Failures

```typescript
import { Logger } from '@nestjs/common';

@Injectable()
export class ScrapingService {
  private readonly logger = new Logger(ScrapingService.name);

  async scrapeWithMonitoring(url: string) {
    try {
      const result = await this.scraper.evaluateWebsite({
        url,
        patterns: [...],
      });

      return result.results;
    } catch (error) {
      this.logger.error(`Scraping failed for ${url}:`, error);

      // Send alert, log to monitoring system, etc.
      throw error;
    }
  }
}
```

## Configuration Summary

| Option       | Type            | Default | Description                                    |
| ------------ | --------------- | ------- | ---------------------------------------------- |
| `maxRetries` | number          | 3       | Maximum retry attempts                         |
| `useProxy`   | boolean\|string | false   | Enable proxy (true=env vars, string=proxy URL) |

## Related Features

- [Logging Configuration](./logging.md) - Control log verbosity
- [Engine Selection](./engine-selection.md) - Choose between libxmljs and JSDOM
- [User-Agent Rotation](./user-agent-rotation.md) - Automatic user-agent rotation
- [URL Health Check](./url-health-check.md) - Check URL availability with proxy
