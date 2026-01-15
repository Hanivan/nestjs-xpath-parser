/**
 * Example 1: Basic Product Scraping from Scrapingcourse.com
 *
 * This example demonstrates:
 * - Container-based extraction
 * - Pattern field definitions
 * - Data cleaning with pipes
 * - Type-safe extraction
 */

import { ScraperHtmlService } from '../scraper-html.service';
import { HttpService } from '@nestjs/axios';
import { PatternField } from '../types';

interface Product {
  name: string;
  price: string;
  image: string;
}

async function demonstrateBasicProductScraping() {
  const httpService = new HttpService();
  const scraper = new ScraperHtmlService(httpService);

  console.log('(>_<) Basic Product Scraping Demo');
  console.log('='.repeat(50));

  try {
    console.log('\n(>_<) Fetching product data from scrapingcourse.com...\n');

    // Define extraction patterns
    const patterns: PatternField[] = [
      // Container pattern - defines each product
      {
        key: 'container',
        patternType: 'xpath',
        returnType: 'text',
        patterns: ['//li[contains(@class, "product")]'],
        meta: { isContainer: true },
      },
      // Field patterns - extracted from each container
      {
        key: 'name',
        patternType: 'xpath',
        returnType: 'text',
        patterns: ['.//h2/text()'],
        pipes: {
          trim: true,
          replace: [{ from: '\\s+', to: ' ' }], // Replace multiple spaces with single space
        },
      },
      {
        key: 'price',
        patternType: 'xpath',
        returnType: 'text',
        patterns: ['.//span[@class="price"]//bdi/text()'],
        pipes: {
          trim: true,
        },
      },
      {
        key: 'image',
        patternType: 'xpath',
        returnType: 'text',
        patterns: ['.//img/@src'],
      },
    ];

    // Execute scraping
    const result = await scraper.evaluateWebsite<Product>({
      url: 'https://www.scrapingcourse.com/ecommerce/',
      patterns,
    });

    console.log(
      `(^_^) Successfully extracted ${result.results.length} products\n`,
    );

    // Display first 5 products
    console.log('(>_<) First 5 Products:\n');
    result.results.slice(0, 5).forEach((product, index) => {
      console.log(`${index + 1}. ${product.name}`);
      console.log(`   (._.) Price: ${product.price}`);
      console.log(`   (._.) Image: ${product.image}`);
      console.log('');
    });

    // Analytics
    console.log('(._.) Analytics:');
    console.log(`   Total Products: ${result.results.length}`);
    console.log(
      `   Products with Images: ${result.results.filter((p) => p.image).length}`,
    );
    console.log(
      `   Average Name Length: ${Math.round(result.results.reduce((sum, p) => sum + p.name.length, 0) / result.results.length)} characters`,
    );
  } catch (error) {
    console.error(
      '(x_x) Error during scraping:',
      error instanceof Error ? error.message : String(error),
    );
  }
}

// Run the demonstration if this file is executed directly
if (require.main === module) {
  demonstrateBasicProductScraping()
    .then(() =>
      console.log('\n\\(^o^)/ Basic product scraping demo completed!'),
    )
    .catch(console.error);
}

export { demonstrateBasicProductScraping };
