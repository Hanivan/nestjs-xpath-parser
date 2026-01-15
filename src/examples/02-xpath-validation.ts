/**
 * Example 2: XPath Validation
 *
 * This example demonstrates:
 * - Validating XPath patterns before scraping
 * - Testing pattern correctness
 * - Debugging XPath selectors
 * - Viewing sample extracted values
 */

import { ScraperHtmlService } from '../scraper-html.service';
import { HttpService } from '@nestjs/axios';

async function demonstrateXPathValidation() {
  const httpService = new HttpService();
  const scraper = new ScraperHtmlService(httpService);

  console.log('(o_o) XPath Validation Demo');
  console.log('='.repeat(50));

  try {
    console.log('\n(>_<) Fetching HTML from scrapingcourse.com...\n');

    // Fetch HTML first
    const html = await scraper['fetchHtml'](
      'https://www.scrapingcourse.com/ecommerce/',
    );

    console.log('(^_^) HTML fetched successfully\n');

    // Define XPath patterns to test
    const xpathPatterns = [
      // Valid patterns
      '//title/text()',
      '//li[contains(@class, "product")]',
      '//h2/text()',
      '//span[@class="price"]//bdi/text()',
      '//img/@src',

      // Patterns that might not match
      '//div[@class="non-existent"]',
      '//meta[@name="author"]/@content',

      // Invalid XPath syntax
      '//invalid[@xpath[syntax',
      '//unclosed[@bracket',
    ];

    console.log('(o_o) Testing XPath Patterns:\n');
    console.log('─'.repeat(80));

    // Validate all patterns
    const validation = scraper.validateXpath(html, xpathPatterns);

    // Display results
    validation.results.forEach((result, index) => {
      const status = result.valid ? '(^_^)' : '(x_x)';
      const matchInfo = result.valid
        ? ` (${result.matchCount} match${result.matchCount !== 1 ? 'es' : ''})`
        : '';

      console.log(`${index + 1}. ${status} ${result.xpath}${matchInfo}`);

      if (result.valid && result.sample) {
        // Show sample value (truncate if too long)
        const sample =
          result.sample.length > 60
            ? result.sample.substring(0, 60) + '...'
            : result.sample;
        console.log(`   (._.) Sample: "${sample}"`);
      }

      if (!result.valid && result.error) {
        console.log(`   (o_o) Error: ${result.error}`);
      }

      console.log('');
    });

    console.log('─'.repeat(80));
    console.log('\n(._.) Validation Summary:');
    const validCount = validation.results.filter((r) => r.valid).length;
    const invalidCount = validation.results.length - validCount;
    const totalMatches = validation.results.reduce(
      (sum, r) => sum + (r.matchCount || 0),
      0,
    );

    console.log(`   Total Patterns Tested: ${validation.results.length}`);
    console.log(`   (^_^) Valid: ${validCount}`);
    console.log(`   (x_x) Invalid: ${invalidCount}`);
    console.log(`   (._.) Total Matches Found: ${totalMatches}`);
    console.log(
      `   (☆^O^☆) Overall Status: ${validation.valid ? 'PASSED' : 'FAILED'}`,
    );

    // Demonstrate pattern refinement
    console.log('\n\n(・_・) Pattern Refinement Demo');
    console.log('='.repeat(50));

    console.log('\nTesting different approaches for product titles:\n');

    const titlePatterns = [
      '//h2/text()', // Direct approach
      '//li[contains(@class, "product")]//h2/text()', // More specific
      './/h2[@class="woocommerce-loop-product__title"]/text()', // Full class
      '//a/h2/text()', // Through link
    ];

    titlePatterns.forEach((pattern, index) => {
      const result = scraper.validateXpath(html, [pattern]);
      const matchCount = result.results[0].matchCount || 0;
      const sample = result.results[0].sample || 'N/A';

      console.log(`${index + 1}. Pattern: ${pattern}`);
      console.log(`   Matches: ${matchCount}`);
      console.log(
        `   Sample: ${sample.length > 50 ? sample.substring(0, 50) + '...' : sample}`,
      );
      console.log('');
    });
  } catch (error) {
    console.error(
      '(x_x) Error during validation:',
      error instanceof Error ? error.message : String(error),
    );
  }
}

// Run the demonstration if this file is executed directly
if (require.main === module) {
  demonstrateXPathValidation()
    .then(() => console.log('\n\\(^o^)/ XPath validation demo completed!'))
    .catch(console.error);
}

export { demonstrateXPathValidation };
