# User-Agent Rotation

Automatic user-agent rotation for stealth scraping.

## Overview

The service automatically rotates user agents for each HTTP request to avoid detection and blocking. This helps:

- Avoid anti-scraping measures
- Distribute requests across different browser identities
- Reduce the chance of IP blocking
- Mimic real browser traffic

## How It Works

User-agent rotation is **automatic** and **built-in**. No configuration needed.

```typescript
// Each request gets a different user-agent
const result1 = await scraperService.evaluateWebsite({
  url: 'https://example.com/page1',
  patterns: [...],
});

const result2 = await scraperService.evaluateWebsite({
  url: 'https://example.com/page2',
  patterns: [...],
});

// result1 and result2 were made with different user-agents
```

## Implementation Details

The service uses the `user-agents` library to generate random, realistic user agents:

- Desktop browsers (Chrome, Firefox, Safari, Edge)
- Various operating systems (Windows, macOS, Linux)
- Realistic browser version combinations
- Consistent device/platform/browser combinations

## Example

```typescript
import { Injectable } from '@nestjs/common';
import { ScraperHtmlService } from '@hanivanrizky/nestjs-xpath-parser';

@Injectable()
export class ScrapingService {
  constructor(private readonly scraper: ScraperHtmlService) {}

  async scrapeMultiplePages(urls: string[]) {
    const results = [];

    for (const url of urls) {
      const result = await this.scraper.evaluateWebsite({
        url,
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

      // Each request uses a different user-agent automatically
      results.push(...result.results);
    }

    return results;
  }
}
```

## User-Agent Distribution

The generator creates user agents from these categories:

- **Chrome** (Windows, macOS, Linux) - ~60%
- **Firefox** (Windows, macOS, Linux) - ~20%
- **Safari** (macOS, iOS) - ~15%
- **Edge** (Windows) - ~5%

Example user agents:

```
Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36
Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36
Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0
Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15
```

## Benefits

### 1. Avoid Detection

Different user agents for each request makes scraping less suspicious:

```typescript
// These requests appear to come from different browsers
await scraperService.evaluateWebsite({
  url: 'https://example.com/1',
  patterns,
});
await scraperService.evaluateWebsite({
  url: 'https://example.com/2',
  patterns,
});
await scraperService.evaluateWebsite({
  url: 'https://example.com/3',
  patterns,
});
```

### 2. Reduce Blocking

Distributing requests across different browser identities reduces IP blocking risk:

```typescript
// Batch scraping with automatic rotation
const urls = /* ...large array of URLs... */;
const results = await Promise.all(
  urls.map(url =>
    scraperService.evaluateWebsite({ url, patterns })
  )
);
```

### 3. Mimic Real Traffic

Realistic user agents make scraping appear more like genuine browser traffic:

```typescript
// Appears as organic traffic from various browsers
const result = await scraperService.evaluateWebsite({
  url: 'https://example.com',
  patterns,
});
```

## Debugging User-Agent

To see which user-agent is being used, check the debug logs:

```typescript
import { Logger } from '@nestjs/common';

@Injectable()
export class ScrapingService {
  private readonly logger = new Logger(ScrapingService.name);

  // Enable debug logging in NestJS
  // The service logs: "Fetching {url} with User-Agent: {userAgent}"
}
```

## When to Use Custom User-Agents

In most cases, automatic rotation is sufficient. However, you might need custom user-agents for:

1. **API requirements** - Some APIs require specific user-agents
2. **Testing** - Reproduce issues with specific browsers
3. **Compliance** - Follow website terms of service

**Note**: Currently, custom user-agent configuration is not directly exposed. The service uses automatic rotation for all requests.

## Best Practices

1. **Trust the rotation**: Automatic rotation handles most cases
2. **Combine with proxy**: Use proxy + rotation for better results
3. **Respect robots.txt**: Follow website crawling guidelines
4. **Rate limiting**: Don't overwhelm servers
5. **Monitor blocks**: Watch for 403/429 responses

## Complete Example

```typescript
import { Injectable } from '@nestjs/common';
import { ScraperHtmlService } from '@hanivanrizky/nestjs-xpath-parser';

@Injectable()
export class EcommerceScraper {
  constructor(private readonly scraper: ScraperHtmlService) {}

  async scrapeProductCatalog(baseUrl: string, pages: number) {
    const allProducts = [];

    // Scrape multiple pages
    for (let page = 1; page <= pages; page++) {
      const url = `${baseUrl}?page=${page}`;

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

      // Each page request uses a different user-agent automatically
      allProducts.push(...result.results);

      // Be respectful - add delay between requests
      await this.delay(1000);
    }

    return allProducts;
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
```

## Related Features

- [HTTP Retry & Proxy](./retry-proxy.md) - Combine with proxy for better results
- [URL Health Check](./url-health-check.md) - Check URL availability
