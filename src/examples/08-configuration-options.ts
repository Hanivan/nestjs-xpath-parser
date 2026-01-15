/**
 * Example 8: Module Configuration Options
 *
 * This example demonstrates advanced module configuration options:
 * - suppressXpathErrors: Suppress libxmljs XPath error messages
 * - engine: Choose between libxmljs (default) or JSDOM
 * - logLevel: Control which log messages are displayed
 * - maxRetries: Configure HTTP retry behavior
 */

import { ScraperHtmlService } from '../scraper-html.service';
import { ScraperHtmlModule } from '../scraper-html.module';
import { Test, TestingModule } from '@nestjs/testing';

async function example1_SuppressXPathErrors() {
  console.log('\n=== Example 1: Suppress XPath Errors ===\n');

  // Create module with XPath error suppression
  const module: TestingModule = await Test.createTestingModule({
    imports: [
      ScraperHtmlModule.forRoot({
        suppressXpathErrors: true, // No XPath errors in console
      }),
    ],
  }).compile();

  const scraperService = module.get<ScraperHtmlService>(ScraperHtmlService);

  // This will NOT print XPath errors to console
  const html = `
    <html>
      <body>
        <h1>Article Title</h1>
        <p class="content">Article content goes here.</p>
      </body>
    </html>
  `;

  const result = await scraperService.evaluateWebsite({
    html,
    patterns: [
      {
        key: 'title',
        patternType: 'xpath',
        returnType: 'text',
        // First pattern will fail (meta tag doesn't exist)
        // But no error will be printed to console
        patterns: ['//meta[@property="og:title"]/@content'],
        meta: {
          // Fallback patterns will be tried silently
          alterPattern: ['//h1/text()', '//title/text()'],
        },
        pipes: { trim: true },
      },
      {
        key: 'content',
        patternType: 'xpath',
        returnType: 'text',
        patterns: ['.//p[@class="content"]/text()'],
        pipes: { trim: true },
      },
    ],
  });

  console.log('Title:', result.results[0].title);
  console.log('Content:', result.results[0].content);
  console.log('\n✓ No XPath errors printed to console (suppressed)\n');

  await module.close();
}

async function example2_EngineSelection_Libxmljs() {
  console.log('\n=== Example 2: Engine Selection - libxmljs (Default) ===\n');

  // Create module with libxmljs engine (default, fastest)
  const module: TestingModule = await Test.createTestingModule({
    imports: [
      ScraperHtmlModule.forRoot({
        engine: 'libxmljs', // Native C++ bindings, fastest
      }),
    ],
  }).compile();

  const scraperService = module.get<ScraperHtmlService>(ScraperHtmlService);

  const html = `
    <html>
      <body>
        <div class="product">
          <h2>Product Name</h2>
          <span class="price">$29.99</span>
        </div>
      </body>
    </html>
  `;

  const result = await scraperService.evaluateWebsite({
    html,
    patterns: [
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

  console.log('Product:', result.results[0]);
  console.log('\n✓ Using libxmljs engine (fastest, production-ready)\n');

  await module.close();
}

async function example3_EngineSelection_JSDOM() {
  console.log('\n=== Example 3: Engine Selection - JSDOM ===\n');

  // Create module with JSDOM engine
  const module: TestingModule = await Test.createTestingModule({
    imports: [
      ScraperHtmlModule.forRoot({
        engine: 'jsdom', // Pure JavaScript, browser-like
      }),
    ],
  }).compile();

  const scraperService = module.get<ScraperHtmlService>(ScraperHtmlService);

  const html = `
    <html>
      <body>
        <article>
          <h2>JSDOM Article</h2>
          <p>This uses JSDOM for parsing.</p>
        </article>
      </body>
    </html>
  `;

  const result = await scraperService.evaluateWebsite({
    html,
    patterns: [
      {
        key: 'title',
        patternType: 'xpath',
        returnType: 'text',
        patterns: ['.//h2/text()'],
        pipes: { trim: true },
      },
      {
        key: 'description',
        patternType: 'xpath',
        returnType: 'text',
        patterns: ['.//p/text()'],
        pipes: { trim: true },
      },
    ],
  });

  console.log('Article:', result.results[0]);
  console.log('\n✓ Using JSDOM engine (browser-like, good for testing)\n');

  await module.close();
}

async function example4_CompleteConfiguration() {
  console.log('\n=== Example 4: Complete Module Configuration ===\n');

  // Create module with all options configured
  const module: TestingModule = await Test.createTestingModule({
    imports: [
      ScraperHtmlModule.forRoot({
        maxRetries: 5, // Retry up to 5 times on failures
        logLevel: ['error', 'warn'], // Only log errors and warnings
        suppressXpathErrors: true, // Suppress XPath error messages
        engine: 'libxmljs', // Use libxmljs for performance
      }),
    ],
  }).compile();

  const scraperService = module.get<ScraperHtmlService>(ScraperHtmlService);

  const html = `
    <html>
      <body>
        <div class="item">
          <span class="name">Item 1</span>
          <span class="value">100</span>
        </div>
        <div class="item">
          <span class="name">Item 2</span>
          <span class="value">200</span>
        </div>
      </body>
    </html>
  `;

  const result = await scraperService.evaluateWebsite({
    html,
    patterns: [
      {
        key: 'container',
        patternType: 'xpath',
        returnType: 'text',
        patterns: ['//div[@class="item"]'],
        meta: { isContainer: true },
      },
      {
        key: 'name',
        patternType: 'xpath',
        returnType: 'text',
        patterns: ['.//span[@class="name"]/text()'],
        pipes: { trim: true },
      },
      {
        key: 'value',
        patternType: 'xpath',
        returnType: 'text',
        patterns: ['.//span[@class="value"]/text()'],
        pipes: { trim: true },
      },
    ],
  });

  console.log('Items:', result.results);
  console.log('\n✓ Complete configuration applied\n');

  await module.close();
}

async function example5_XPathValidationWithErrorSuppression() {
  console.log('\n=== Example 5: XPath Validation with Error Suppression ===\n');

  // Create module with error suppression
  const module: TestingModule = await Test.createTestingModule({
    imports: [
      ScraperHtmlModule.forRoot({
        suppressXpathErrors: true,
      }),
    ],
  }).compile();

  const scraperService = module.get<ScraperHtmlService>(ScraperHtmlService);

  const html = `
    <html>
      <body>
        <h1>Test Page</h1>
        <p>Some content</p>
      </body>
    </html>
  `;

  // Validate XPath patterns (invalid patterns won't print errors)
  const validation = scraperService.validateXpath(html, [
    '//h1/text()', // Valid
    '//p/text()', // Valid
    '//invalid[[[xpath', // Invalid, but no error printed
  ]);

  console.log('Validation results:');
  validation.results.forEach((result) => {
    console.log(`  ${result.xpath}: ${result.valid ? '✓' : '✗'}`);
    if (result.error) {
      console.log(`    Error: ${result.error}`);
    }
  });

  console.log(`\nOverall valid: ${validation.valid ? 'Yes' : 'No'}`);
  console.log('\n✓ Validation completed (XPath errors suppressed)\n');

  await module.close();
}

async function main() {
  try {
    await example1_SuppressXPathErrors();
    await example2_EngineSelection_Libxmljs();
    await example3_EngineSelection_JSDOM();
    await example4_CompleteConfiguration();
    await example5_XPathValidationWithErrorSuppression();

    console.log('\n=== All configuration examples completed ===\n');
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Error running examples:', errorMessage);
  }
}

// Run if executed directly
if (require.main === module) {
  void main();
}

export {
  example1_SuppressXPathErrors,
  example2_EngineSelection_Libxmljs,
  example3_EngineSelection_JSDOM,
  example4_CompleteConfiguration,
  example5_XPathValidationWithErrorSuppression,
};
