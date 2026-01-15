# URL Health Check

Check if URLs are alive using HTTP HEAD requests.

## Overview

The `checkUrlAlive()` method allows you to:

- Verify URLs are valid before storing them
- Monitor website availability and uptime
- Check link health in sitemaps
- Validate API endpoints before making requests
- Clean up dead links from databases
- Batch check URLs from crawled data
- Use proxy for corporate/restricted networks

## Basic Usage

### Single URL Check

```typescript
const result = await scraperService.checkUrlAlive('https://example.com');

console.log(result);
// [{
//   url: 'https://example.com',
//   alive: true,
//   statusCode: 200,
// }]
```

### Multiple URLs Check

```typescript
const urls = [
  'https://example.com',
  'https://example.org/product/123',
  'https://broken-link.com/page',
];

const results = await scraperService.checkUrlAlive(urls);

results.forEach((result) => {
  if (result.alive) {
    console.log(`✓ ${result.url} (${result.statusCode})`);
  } else {
    console.log(`✗ ${result.url}`);
    console.log(`  Status: ${result.statusCode || 'Connection failed'}`);
    console.log(`  Error: ${result.error}`);
  }
});
```

## Method Signature

```typescript
checkUrlAlive(
  urls: string | string[],
  options?: { useProxy?: boolean | string }
): Promise<UrlHealthCheckResult[]>
```

### Parameters

- `urls` - Single URL string or array of URLs to check
- `options.useProxy` - Enable proxy: `true` uses HTTP_PROXY/HTTPS_PROXY env vars, or specify proxy URL as string

### Returns

Array of health check results:

```typescript
interface UrlHealthCheckResult {
  url: string; // The checked URL
  alive: boolean; // True if URL is alive (200-399 status code)
  statusCode?: number; // HTTP status code (if request succeeded)
  error?: string; // Error message (if request failed)
}
```

## URL Status Determination

A URL is considered "alive" if:

- HTTP status code is between 200 and 399 (inclusive)
- No connection errors occurred

A URL is considered "dead" if:

- HTTP status code is 400 or higher
- Connection error occurred (DNS failure, timeout, etc.)

## Use Cases

### 1. Verify Scraped URLs

```typescript
// Scrape product URLs
const scrapedData = await scraperService.evaluateWebsite({
  url: 'https://example.com/products',
  patterns: [
    {
      key: 'name',
      patternType: 'xpath',
      returnType: 'text',
      patterns: ['.//h2/text()'],
    },
    {
      key: 'link',
      patternType: 'xpath',
      returnType: 'text',
      patterns: ['.//a/@href'],
    },
  ],
});

// Extract URLs
const productUrls = scrapedData.results
  .map((r) => r.link as string)
  .filter((url) => url && url.startsWith('http'));

// Check URL health
const healthResults = await scraperService.checkUrlAlive(productUrls);

// Combine data with health status
const enrichedData = scrapedData.results.map((item, index) => ({
  ...item,
  linkHealth: healthResults[index],
}));

// Filter valid products
const validProducts = enrichedData.filter((item) => item.linkHealth.alive);
const deadProducts = enrichedData.filter((item) => !item.linkHealth.alive);

console.log(`Valid products: ${validProducts.length}`);
console.log(`Dead links: ${deadProducts.length}`);
```

### 2. Monitor Website Availability

```typescript
async monitorWebsites(urls: string[]) {
  const results = await scraperService.checkUrlAlive(urls);

  const alive = results.filter(r => r.alive);
  const dead = results.filter(r => !r.alive);

  console.log(`Alive: ${alive.length}/${results.length}`);
  console.log(`Dead: ${dead.length}/${results.length}`);

  if (dead.length > 0) {
    // Send alert
    console.error('Dead URLs detected:');
    dead.forEach(d => {
      console.error(`  ${d.url}: ${d.error || d.statusCode}`);
    });
  }

  return {
    total: results.length,
    alive: alive.length,
    dead: dead.length,
    details: results,
  };
}
```

### 3. Validate Sitemap Links

```typescript
// Parse sitemap
const sitemap = await scraperService.evaluateWebsite({
  url: 'https://example.com/sitemap.xml',
  contentType: 'text/xml',
  patterns: [
    {
      key: 'container',
      patterns: ['//url'],
      meta: { isContainer: true },
    },
    {
      key: 'loc',
      patterns: ['.//loc/text()'],
    },
  ],
});

// Check all URLs
const urls = sitemap.results.map((r) => r.loc as string);
const healthResults = await scraperService.checkUrlAlive(urls);

// Report
const valid = healthResults.filter((r) => r.alive);
const broken = healthResults.filter((r) => !r.alive);

console.log(`Sitemap has ${urls.length} URLs`);
console.log(`Valid: ${valid.length}`);
console.log(`Broken: ${broken.length}`);

if (broken.length > 0) {
  console.log('Broken links:');
  broken.forEach((b) => {
    console.log(`  ${b.url} - Status: ${b.statusCode}`);
  });
}
```

### 4. Batch Check URLs

```typescript
async checkUrlBatch(urls: string[], batchSize = 50) {
  const results = [];

  for (let i = 0; i < urls.length; i += batchSize) {
    const batch = urls.slice(i, i + batchSize);
    const batchResults = await scraperService.checkUrlAlive(batch);
    results.push(...batchResults);

    // Small delay between batches
    if (i + batchSize < urls.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  return results;
}
```

## Proxy Support

### Using Environment Variables

```typescript
// Set environment variables
process.env.HTTP_PROXY = 'http://proxy.example.com:8080';
process.env.HTTPS_PROXY = 'http://proxy.example.com:8080';

// Use proxy from env
const results = await scraperService.checkUrlAlive(urls, {
  useProxy: true,
});
```

### Specifying Proxy URL Directly

```typescript
const results = await scraperService.checkUrlAlive(urls, {
  useProxy: 'http://proxy.example.com:8080',
});
```

## Error Handling

```typescript
const results = await scraperService.checkUrlAlive([
  'https://example.com',
  'https://nonexistent-domain-12345.com',
  'https://httpbin.org/status/404',
  'https://httpbin.org/status/500',
]);

results.forEach((result) => {
  if (result.alive) {
    console.log(`✓ ${result.url} - Status: ${result.statusCode}`);
  } else {
    if (result.statusCode) {
      // HTTP error (4xx, 5xx)
      console.log(`✗ ${result.url} - HTTP ${result.statusCode}`);
    } else {
      // Connection error
      console.log(`✗ ${result.url} - Connection failed: ${result.error}`);
    }
  }
});
```

## Performance Considerations

1. **Parallel execution**: All URLs are checked in parallel using `Promise.all()`
2. **HEAD requests**: Uses HTTP HEAD method (faster than GET)
3. **No body download**: Only headers are retrieved
4. **Batch large sets**: For thousands of URLs, process in batches

```typescript
// Example: Check 1000 URLs in batches of 50
async checkLargeUrlSet(urls: string[]) {
  const batchSize = 50;
  const allResults = [];

  for (let i = 0; i < urls.length; i += batchSize) {
    const batch = urls.slice(i, i + batchSize);
    const results = await scraperService.checkUrlAlive(batch);
    allResults.push(...results);

    // Optional: Rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  return allResults;
}
```

## Complete Example

```typescript
import { Injectable } from '@nestjs/common';
import { ScraperHtmlService } from '@hanivanrizky/nestjs-xpath-parser';

@Injectable()
export class LinkValidatorService {
  constructor(private readonly scraper: ScraperHtmlService) {}

  async validateScrapedLinks(scrapeUrl: string) {
    // Scrape URLs from page
    const scrapedData = await this.scraper.evaluateWebsite({
      url: scrapeUrl,
      patterns: [
        {
          key: 'container',
          patternType: 'xpath',
          returnType: 'text',
          patterns: ['//a[@href]'],
          meta: { isContainer: true },
        },
        {
          key: 'text',
          patternType: 'xpath',
          returnType: 'text',
          patterns: ['./text()'],
          pipes: { trim: true },
        },
        {
          key: 'href',
          patternType: 'xpath',
          returnType: 'text',
          patterns: ['./@href'],
        },
      ],
    });

    // Extract absolute URLs
    const links = scrapedData.results
      .map((r) => ({
        text: r.text as string,
        href: this.resolveUrl(scrapeUrl, r.href as string),
      }))
      .filter((link) => link.href.startsWith('http'));

    // Check health
    const healthResults = await this.scraper.checkUrlAlive(
      links.map((l) => l.href),
    );

    // Combine results
    const validatedLinks = links.map((link, index) => ({
      ...link,
      alive: healthResults[index].alive,
      statusCode: healthResults[index].statusCode,
      error: healthResults[index].error,
    }));

    // Summary
    const alive = validatedLinks.filter((l) => l.alive);
    const dead = validatedLinks.filter((l) => !l.alive);

    console.log(`Found ${validatedLinks.length} links`);
    console.log(`Alive: ${alive.length}`);
    console.log(`Dead: ${dead.length}`);

    return {
      total: validatedLinks.length,
      alive: alive.length,
      dead: dead.length,
      links: validatedLinks,
    };
  }

  private resolveUrl(base: string, relative: string): string {
    try {
      return new URL(relative, base).href;
    } catch {
      return relative;
    }
  }
}
```

## Best Practices

1. **Check in batches**: For large URL sets, process in batches
2. **Cache results**: Store health check results to avoid repeated checks
3. **Handle errors gracefully**: Always check for both `statusCode` and `error`
4. **Use proxy for restricted networks**: Configure proxy when needed
5. **Monitor rate limits**: Add delays between batches if needed
6. **Validate URLs first**: Remove malformed URLs before checking

## Related Features

- [HTTP Retry & Proxy](./retry-proxy.md) - Configure retry and proxy settings
- [Pattern-Based Extraction](./pattern-based-extraction.md) - Extract URLs from pages
