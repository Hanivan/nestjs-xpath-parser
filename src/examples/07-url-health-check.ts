import { ScraperHtmlService } from '../scraper-html.service';
import { HttpService } from '@nestjs/axios';

/**
 * Example 07: URL Health Check
 *
 * This example demonstrates how to:
 * - Check if a single URL is alive using HTTP HEAD
 * - Check multiple URLs at once
 * - Filter out dead URLs from scraped data
 * - Combine URL health check with web scraping
 */

async function demonstrateUrlHealthCheck() {
  const httpService = new HttpService();
  const scraper = new ScraperHtmlService(httpService);

  console.log('─'.repeat(80));
  console.log('(o_o) Example 07: URL Health Check');
  console.log('─'.repeat(80));
  console.log('');

  // Example 1: Check single URL
  console.log('(o_o) Example 1: Check Single URL');
  console.log('━'.repeat(80));

  const singleResult = await scraper.checkUrlAlive('https://example.com');

  console.log('Single URL check result:');
  console.log(`   URL: ${singleResult[0].url}`);
  console.log(`   Alive: ${singleResult[0].alive}`);
  console.log(`   Status Code: ${singleResult[0].statusCode}`);
  console.log('');

  // Example 2: Check multiple URLs
  console.log('(o_o) Example 2: Check Multiple URLs');
  console.log('━'.repeat(80));

  const testUrls = [
    'https://example.com',
    'https://www.scrapingcourse.com/ecommerce/',
    'https://httpbin.org/status/200',
    'https://httpbin.org/status/404',
    'https://httpbin.org/status/500',
    'https://this-domain-does-not-exist-12345.com',
  ];

  const results = await scraper.checkUrlAlive(testUrls);

  console.log('Multiple URLs check results:');
  results.forEach((result) => {
    if (result.alive) {
      console.log(`   (OK) ${result.url}`);
      console.log(`        Status: ${result.statusCode}`);
    } else {
      console.log(`   (X) ${result.url}`);
      console.log(`        Status: ${result.statusCode || 'N/A'}`);
      console.log(`        Error: ${result.error || 'Unknown error'}`);
    }
  });
  console.log('');

  // Example 3: Filter dead URLs
  console.log('(o_o) Example 3: Filter Dead URLs');
  console.log('━'.repeat(80));

  const deadUrls = results.filter((r) => !r.alive);
  const aliveUrls = results.filter((r) => r.alive);

  console.log(`Total URLs checked: ${results.length}`);
  console.log(`   Alive: ${aliveUrls.length}`);
  console.log(`   Dead: ${deadUrls.length}`);

  if (deadUrls.length > 0) {
    console.log('');
    console.log('Dead URLs found:');
    deadUrls.forEach((url) => {
      console.log(`   - ${url.url} (${url.statusCode || 'Connection failed'})`);
    });
  }
  console.log('');

  // Example 4: Combine with scraping to find broken links
  console.log('(o_o) Example 4: Scrape URLs and Check Their Health');
  console.log('━'.repeat(80));

  const scrapedData = await scraper.evaluateWebsite({
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
        patterns: ['.//h2[contains(@class, "product-title")]//text()'],
        pipes: { trim: true },
      },
      {
        key: 'link',
        patternType: 'xpath',
        returnType: 'text',
        patterns: ['.//a[contains(@class, "product-link")]/@href'],
      },
    ],
  });

  // Extract first 3 product URLs
  const productUrls = scrapedData.results
    .slice(0, 3)
    .map((r) => r.link as string)
    .filter((url) => url && url.startsWith('http'));

  console.log(`Found ${scrapedData.results.length} products, checking first ${productUrls.length} URLs...`);

  if (productUrls.length > 0) {
    const healthResults = await scraper.checkUrlAlive(productUrls);

    console.log('');
    healthResults.forEach((result, index) => {
      const productName = scrapedData.results[index].name as string;
      console.log(`   Product: "${productName}"`);
      console.log(`   URL: ${result.url}`);
      console.log(`   Status: ${result.alive ? '✓ Alive' : '✗ Dead'} (${result.statusCode})`);
      console.log('');
    });
  }

  // Example 5: Use proxy for URL checking
  console.log('(o_o) Example 5: URL Health Check with Proxy');
  console.log('━'.repeat(80));
  console.log('Note: Set HTTP_PROXY or HTTPS_PROXY environment variable to use proxy');
  console.log('Or pass proxy URL directly:');
  console.log('   await scraper.checkUrlAlive(urls, { useProxy: "http://proxy:8080" });');
  console.log('');

  // Summary
  console.log('─'.repeat(80));
  console.log('(☆^O^☆) Use Cases:');
  console.log('   (._.) Verify scraped URLs are valid before storing them');
  console.log('   (._.) Monitor website availability and uptime');
  console.log('   (._.) Check link health in sitemaps');
  console.log('   (._.) Validate API endpoints before making requests');
  console.log('   (._.) Clean up dead links from databases');
  console.log('   (._.) Batch check URLs from crawled data');
  console.log('   (._.) Use proxy for corporate/restricted networks');
  console.log('─'.repeat(80));
  console.log('');
}

// Run the demonstration if this file is executed directly
if (require.main === module) {
  demonstrateUrlHealthCheck()
    .then(() => console.log('\n\\(^o^)/ URL health check demo completed!'))
    .catch((error) => {
      console.error('\n(x_x) Error during demo:', error instanceof Error ? error.message : String(error));
      process.exit(1);
    });
}
