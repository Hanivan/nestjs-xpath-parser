/**
 * Example 3: Data Cleaning with Pipes
 *
 * This example demonstrates:
 * - Using trim, toLowerCase, toUpperCase pipes
 * - Replace patterns with regex support
 * - HTML entity decoding
 * - Multiple pipe combinations
 */

import { ScraperHtmlService } from '../scraper-html.service';
import { HttpService } from '@nestjs/axios';
import { PatternField } from '../types';

interface CleanedProduct extends Record<string, unknown> {
  name: string;
  nameUppercase: string;
  nameLowercase: string;
  price: string;
  priceNumeric: string;
  description: string;
}

async function demonstrateDataCleaningPipes() {
  const httpService = new HttpService();
  const scraper = new ScraperHtmlService(httpService);

  console.log('(・_・) Data Cleaning Pipes Demo');
  console.log('='.repeat(50));

  try {
    // Sample HTML with messy data
    const sampleHtml = `
      <html>
        <body>
          <div class="product">
            <h2>   Wireless  Mouse    with   Extra   Buttons   </h2>
            <p class="description">Premium &amp; Professional  &quot;Gaming&quot;  Mouse</p>
            <span class="price">$  29.99  USD</span>
            <span class="sku">  SKU-12345  </span>
          </div>
        </body>
      </html>
    `;

    console.log('\n(._.) Sample HTML (with messy data):');
    console.log(sampleHtml);

    console.log('\n(o_o) Testing Different Pipe Configurations:\n');

    // Example 1: Basic trim
    const patterns1: PatternField[] = [
      {
        key: 'name',
        patternType: 'xpath',
        returnType: 'text',
        patterns: ['//h2/text()'],
        pipes: { trim: true },
      },
    ];

    const result1 = await scraper.evaluateWebsite({
      html: sampleHtml,
      patterns: patterns1,
    });

    console.log('(o_o) Trim Only:');
    console.log(`   Original: "${sampleHtml.match(/<h2>(.*?)<\/h2>/)?.[1]}"`);
    console.log(`   Cleaned:  "${String(result1.results[0].name)}"`);
    console.log('');

    // Example 2: Trim + Replace multiple spaces
    const patterns2: PatternField[] = [
      {
        key: 'name',
        patternType: 'xpath',
        returnType: 'text',
        patterns: ['//h2/text()'],
        pipes: {
          trim: true,
          replace: [{ from: '\\s+', to: ' ' }],
        },
      },
    ];

    const result2 = await scraper.evaluateWebsite({
      html: sampleHtml,
      patterns: patterns2,
    });

    console.log('(o_o) Trim + Replace Multiple Spaces:');
    console.log(`   Cleaned: "${String(result2.results[0].name)}"`);
    console.log('');

    // Example 3: Case transformations
    const patterns3: PatternField[] = [
      {
        key: 'nameUppercase',
        patternType: 'xpath',
        returnType: 'text',
        patterns: ['//h2/text()'],
        pipes: {
          trim: true,
          replace: [{ from: '\\s+', to: ' ' }],
          toUpperCase: true,
        },
      },
      {
        key: 'nameLowercase',
        patternType: 'xpath',
        returnType: 'text',
        patterns: ['//h2/text()'],
        pipes: {
          trim: true,
          replace: [{ from: '\\s+', to: ' ' }],
          toLowerCase: true,
        },
      },
    ];

    const result3 = await scraper.evaluateWebsite({
      html: sampleHtml,
      patterns: patterns3,
    });

    console.log('(o_o) Case Transformations:');
    console.log(`   Uppercase: "${String(result3.results[0].nameUppercase)}"`);
    console.log(`   Lowercase: "${String(result3.results[0].nameLowercase)}"`);
    console.log('');

    // Example 4: HTML entity decoding
    const patterns4: PatternField[] = [
      {
        key: 'description',
        patternType: 'xpath',
        returnType: 'text',
        patterns: ['//p[@class="description"]/text()'],
        pipes: {
          trim: true,
          decode: true, // Decode HTML entities
          replace: [{ from: '\\s+', to: ' ' }],
        },
      },
    ];

    const result4 = await scraper.evaluateWebsite({
      html: sampleHtml,
      patterns: patterns4,
    });

    console.log('(o_o) HTML Entity Decoding:');
    console.log(
      `   Raw:     "${sampleHtml.match(/<p class="description">(.*?)<\/p>/)?.[1]}"`,
    );
    console.log(`   Decoded: "${String(result4.results[0].description)}"`);
    console.log('');

    // Example 5: Price cleaning
    const patterns5: PatternField[] = [
      {
        key: 'price',
        patternType: 'xpath',
        returnType: 'text',
        patterns: ['//span[@class="price"]/text()'],
        pipes: {
          trim: true,
        },
      },
      {
        key: 'priceNumeric',
        patternType: 'xpath',
        returnType: 'text',
        patterns: ['//span[@class="price"]/text()'],
        pipes: {
          trim: true,
          replace: [
            { from: '\\$', to: '' },
            { from: 'USD', to: '' },
            { from: '\\s+', to: '' },
          ],
        },
      },
    ];

    const result5 = await scraper.evaluateWebsite({
      html: sampleHtml,
      patterns: patterns5,
    });

    console.log('(o_o) Price Cleaning (Multiple Replacements):');
    console.log(`   Original: "${String(result5.results[0].price)}"`);
    console.log(`   Numeric:  "${String(result5.results[0].priceNumeric)}"`);
    console.log('');

    // Example 6: Complete product with all pipes
    console.log('\n(>_<) Complete Product Extraction with All Pipes:\n');

    const completePatterns: PatternField[] = [
      {
        key: 'name',
        patternType: 'xpath',
        returnType: 'text',
        patterns: ['//h2/text()'],
        pipes: {
          trim: true,
          replace: [{ from: '\\s+', to: ' ' }],
        },
      },
      {
        key: 'nameUppercase',
        patternType: 'xpath',
        returnType: 'text',
        patterns: ['//h2/text()'],
        pipes: {
          trim: true,
          replace: [{ from: '\\s+', to: ' ' }],
          toUpperCase: true,
        },
      },
      {
        key: 'nameLowercase',
        patternType: 'xpath',
        returnType: 'text',
        patterns: ['//h2/text()'],
        pipes: {
          trim: true,
          replace: [{ from: '\\s+', to: ' ' }],
          toLowerCase: true,
        },
      },
      {
        key: 'price',
        patternType: 'xpath',
        returnType: 'text',
        patterns: ['//span[@class="price"]/text()'],
        pipes: {
          trim: true,
        },
      },
      {
        key: 'priceNumeric',
        patternType: 'xpath',
        returnType: 'text',
        patterns: ['//span[@class="price"]/text()'],
        pipes: {
          trim: true,
          replace: [
            { from: '\\$', to: '' },
            { from: 'USD', to: '' },
            { from: '\\s+', to: '' },
          ],
        },
      },
      {
        key: 'description',
        patternType: 'xpath',
        returnType: 'text',
        patterns: ['//p[@class="description"]/text()'],
        pipes: {
          trim: true,
          decode: true,
          replace: [{ from: '\\s+', to: ' ' }],
        },
      },
    ];

    const completeResult = await scraper.evaluateWebsite<CleanedProduct>({
      html: sampleHtml,
      patterns: completePatterns,
    });

    const product = completeResult.results[0];
    console.log('Product Data:');
    console.log(`  Name:            "${product.name}"`);
    console.log(`  Name (Upper):    "${product.nameUppercase}"`);
    console.log(`  Name (Lower):    "${product.nameLowercase}"`);
    console.log(`  Price:           "${product.price}"`);
    console.log(`  Price (Numeric): "${product.priceNumeric}"`);
    console.log(`  Description:     "${product.description}"`);

    console.log('\n(._.) Pipe Usage Summary:');
    console.log('   (^_^) trim: Remove leading/trailing whitespace');
    console.log('   (^_^) toLowerCase: Convert to lowercase');
    console.log('   (^_^) toUpperCase: Convert to uppercase');
    console.log(
      '   (^_^) decode: Decode HTML entities (&amp; → &, &quot; → ", etc.)',
    );
    console.log('   (^_^) replace: Find and replace with regex support');
    console.log('   (^_^) Multiple replace rules can be chained');
  } catch (error) {
    console.error(
      '(x_x) Error during demo:',
      error instanceof Error ? error.message : String(error),
    );
  }
}

// Run the demonstration if this file is executed directly
if (require.main === module) {
  demonstrateDataCleaningPipes()
    .then(() => console.log('\n\\(^o^)/ Data cleaning pipes demo completed!'))
    .catch(console.error);
}

export { demonstrateDataCleaningPipes };
