/**
 * Example 6: Real-World E-commerce Scraping
 *
 * This example demonstrates:
 * - Complete product extraction from scrapingcourse.com
 * - Handling multiple data types (price, rating, stock)
 * - Extracting product variations
 * - Data aggregation and analytics
 */

import { ScraperHtmlService } from '../scraper-html.service';
import { HttpService } from '@nestjs/axios';
import { PatternField } from '../types';

interface ProductListing extends Record<string, unknown> {
  name: string;
  price: string;
  rating: string;
  image: string;
  link: string;
}

async function demonstrateRealWorldEcommerce() {
  const httpService = new HttpService();
  const scraper = new ScraperHtmlService(httpService);

  console.log('(>_<) Real-World E-commerce Scraping Demo');
  console.log('='.repeat(60));

  try {
    console.log('\n(>_<) Fetching products from ScrapingCourse.com...\n');

    // Define comprehensive product extraction patterns
    const patterns: PatternField[] = [
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
        patterns: [
          './/h2[contains(@class, "woocommerce-loop-product__title")]/text()',
        ],
        meta: {
          alterPattern: ['.//h2/text()', './/a/@title'],
        },
        pipes: {
          trim: true,
          replace: [{ from: '\\s+', to: ' ' }],
        },
      },
      {
        key: 'price',
        patternType: 'xpath',
        returnType: 'text',
        patterns: ['.//span[@class="price"]//bdi/text()'],
        meta: {
          alterPattern: [
            './/span[@class="price"]/text()',
            './/span[contains(@class, "amount")]/text()',
          ],
        },
        pipes: {
          trim: true,
        },
      },
      {
        key: 'rating',
        patternType: 'xpath',
        returnType: 'text',
        patterns: ['.//div[contains(@class, "star-rating")]/@style'],
        meta: {
          alterPattern: [
            './/div[@class="star-rating"]/@aria-label',
            './/span[@class="rating"]/text()',
          ],
        },
      },
      {
        key: 'image',
        patternType: 'xpath',
        returnType: 'text',
        patterns: ['.//img/@src'],
        meta: {
          alterPattern: ['.//img/@data-src', './/img/@data-lazy-src'],
        },
      },
      {
        key: 'link',
        patternType: 'xpath',
        returnType: 'text',
        patterns: [
          './/a[contains(@class, "woocommerce-LoopProduct-link")]/@href',
        ],
        meta: {
          alterPattern: ['.//a/@href'],
        },
      },
    ];

    // Execute scraping
    const result = await scraper.evaluateWebsite<ProductListing>({
      url: 'https://www.scrapingcourse.com/ecommerce/',
      patterns,
    });

    const products = result.results;

    console.log(`(^_^) Successfully extracted ${products.length} products\n`);
    console.log('─'.repeat(80));

    // Display products in a formatted way
    console.log('\n(>_<) Product Catalog:\n');
    products.slice(0, 10).forEach((product, index) => {
      console.log(`${index + 1}. ${product.name}`);
      console.log(`   (._.) Price:  ${product.price}`);
      console.log(`   (☆^O^☆) Rating: ${product.rating || 'Not rated'}`);
      console.log(`   (._.) Link:   ${product.link}`);
      console.log(`   (._.) Image:  ${product.image}`);
      console.log('');
    });

    if (products.length > 10) {
      console.log(`   ... and ${products.length - 10} more products\n`);
    }

    // Analytics
    console.log('\n(._.) Product Analytics:\n');
    console.log('─'.repeat(80));

    // Parse prices for analytics
    const parsedPrices = products
      .map((p) => {
        const priceStr = p.price?.toString() || '';
        const match = priceStr.match(/[\d,]+\.?\d*/);
        return match ? parseFloat(match[0].replace(',', '')) : 0;
      })
      .filter((price) => price > 0);

    if (parsedPrices.length > 0) {
      const avgPrice =
        parsedPrices.reduce((sum, p) => sum + p, 0) / parsedPrices.length;
      const minPrice = Math.min(...parsedPrices);
      const maxPrice = Math.max(...parsedPrices);

      console.log(`(._.) Price Statistics:`);
      console.log(`   Total Products:  ${products.length}`);
      console.log(`   Products w/Price: ${parsedPrices.length}`);
      console.log(`   Average Price:   $${avgPrice.toFixed(2)}`);
      console.log(`   Min Price:       $${minPrice.toFixed(2)}`);
      console.log(`   Max Price:       $${maxPrice.toFixed(2)}`);
      console.log('');
    }

    // Rating statistics
    const productsWithRating = products.filter((p) => p.rating);
    console.log(`(☆^O^☆) Rating Statistics:`);
    console.log(`   Products with Rating: ${productsWithRating.length}`);
    console.log(
      `   Products without Rating: ${products.length - productsWithRating.length}`,
    );
    console.log('');

    // Image statistics
    const productsWithImage = products.filter((p) => p.image);
    console.log(`(._.) Image Statistics:`);
    console.log(`   Products with Images: ${productsWithImage.length}`);
    console.log(
      `   Products without Images: ${products.length - productsWithImage.length}`,
    );
    console.log('');

    // Name length statistics
    const nameLengths = products.map((p) => (p.name?.toString() || '').length);
    const avgNameLength =
      nameLengths.reduce((sum, len) => sum + len, 0) / nameLengths.length;
    const maxNameLength = Math.max(...nameLengths);
    const minNameLength = Math.min(...nameLengths.filter((len) => len > 0));

    console.log(`(._.) Product Name Statistics:`);
    console.log(`   Average Length: ${avgNameLength.toFixed(0)} characters`);
    console.log(`   Shortest Name:  ${minNameLength} characters`);
    console.log(`   Longest Name:   ${maxNameLength} characters`);
    console.log('');

    // Price range categories
    const priceRanges = {
      'Under $50': parsedPrices.filter((p) => p < 50).length,
      '$50 - $100': parsedPrices.filter((p) => p >= 50 && p < 100).length,
      '$100 - $200': parsedPrices.filter((p) => p >= 100 && p < 200).length,
      'Over $200': parsedPrices.filter((p) => p >= 200).length,
    };

    console.log(`(._.) Price Range Distribution:`);
    Object.entries(priceRanges).forEach(([range, count]) => {
      const percentage = ((count / parsedPrices.length) * 100).toFixed(1);
      const bar = '█'.repeat(Math.round(count / 2));
      console.log(
        `   ${range.padEnd(15)} ${count.toString().padStart(3)} (${percentage}%) ${bar}`,
      );
    });

    console.log('\n\n(☆^O^☆) Key Scraping Insights:');
    console.log('─'.repeat(80));
    console.log(
      '(^_^) Container-based extraction works perfectly for product listings',
    );
    console.log(
      '(^_^) Alternative patterns ensure data extraction even with varied HTML',
    );
    console.log('(^_^) Pipes clean and normalize data automatically');
    console.log('(^_^) Type-safe results enable powerful analytics');
    console.log('(^_^) User-agent rotation helps avoid detection (automatic)');

    console.log('\n\n(._.) Production Tips:');
    console.log('─'.repeat(80));
    console.log('(>_<) Add pagination support to scrape all pages');
    console.log('(._.) Store results in database for historical analysis');
    console.log('(._.) Schedule regular scraping for price monitoring');
    console.log('(._.) Set up alerts for price drops or new products');
    console.log('(._.) Track price trends over time');
    console.log('(☆^O^☆) Filter products by category, price range, or rating');
  } catch (error) {
    console.error(
      '(x_x) Error during e-commerce scraping:',
      error instanceof Error ? error.message : String(error),
    );
    if (error instanceof Error && error.stack) {
      console.error('Stack trace:', error.stack);
    }
  }
}

// Run the demonstration if this file is executed directly
if (require.main === module) {
  demonstrateRealWorldEcommerce()
    .then(() =>
      console.log('\n\\(^o^)/ Real-world e-commerce scraping demo completed!'),
    )
    .catch(console.error);
}

export { demonstrateRealWorldEcommerce };
