/**
 * Example 9: Custom Pipes and Predefined Pipes
 *
 * This example demonstrates how to:
 * 1. Use predefined pipes from the library with plain config objects
 * 2. Create custom pipes for specialized transformations
 * 3. Combine custom pipes with built-in pipes
 * 4. Use custom pipes with merge option
 * 5. Register custom pipes for use in patterns
 *
 * Custom pipes allow you to:
 * - Reuse transformation logic across multiple patterns
 * - Encapsulate complex data processing
 * - Extend the library with domain-specific operations
 * - Use plain config objects (no module registration needed!)
 */

import { ScraperHtmlService } from '../scraper-html.service';
import { HttpService } from '@nestjs/axios';
import { PatternField, PipeTransform, PIPE_REGISTRY } from '../types';

export async function predefinedPipesExample() {
  const httpService = new HttpService();
  const service = new ScraperHtmlService(httpService, {});

  const html = `
    <html>
      <body>
        <div class="article">
          <span class="date">2024-01-15</span>
          <span class="views">1.5K views</span>
          <a href="/anime/episode-1">Watch Episode 1</a>
          <p>Contact: support@otakudesu.best</p>
        </div>
      </body>
    </html>
  `;

  const patterns: PatternField[] = [
    {
      key: 'timestamp',
      patternType: 'xpath',
      returnType: 'text',
      patterns: ['.//span[@class="date"]/text()'],
      pipes: {
        // Use plain config object
        custom: [{ type: 'date-format', format: 'YYYY-MM-DD' }],
      },
    },
    {
      key: 'viewCount',
      patternType: 'xpath',
      returnType: 'text',
      patterns: ['.//span[@class="views"]/text()'],
      pipes: {
        custom: [{ type: 'num-normalize' }], // "1.5K" -> 1500
      },
    },
    {
      key: 'email',
      patternType: 'xpath',
      returnType: 'text',
      patterns: ['.//p[contains(text(), "Contact:")]/text()'],
      pipes: {
        custom: [{ type: 'extract-email' }], // Extract email from text
      },
    },
  ];

  const { results } = await service.evaluateWebsite({
    html,
    patterns,
  });

  console.log('Predefined Pipes Example Results:');
  console.log(JSON.stringify(results, null, 2));

  /* Expected output:
  {
    "timestamp": 1705334400,
    "viewCount": 1500,
    "email": "support@otakudesu.best"
  }
  */
}

/**
 * Example: Using RegexPipe for pattern-based replacements
 */
export async function regexPipeExample() {
  const httpService = new HttpService();
  const service = new ScraperHtmlService(httpService, {});

  const html = `
    <html>
      <body>
        <div class="anime-info">
          <h1>Judul : Maou no Musume wa Yasashisugiru!!</h1>
          <span class="price">$25.5K</span>
        </div>
      </body>
    </html>
  `;

  const patterns: PatternField[] = [
    {
      key: 'title',
      patternType: 'xpath',
      returnType: 'text',
      patterns: ['.//h1/text()'],
      pipes: {
        custom: [
          {
            type: 'regex',
            rules: [{ pattern: '^Judul : ', replacement: '', flags: '' }],
          },
        ],
      },
    },
    {
      key: 'price',
      patternType: 'xpath',
      returnType: 'text',
      patterns: ['.//span[@class="price"]/text()'],
      pipes: {
        custom: [
          {
            type: 'regex',
            rules: [
              { pattern: '[$,]', replacement: '', flags: 'g' },
              { pattern: 'K$', replacement: '000', flags: '' },
            ],
          },
        ],
      },
    },
  ];

  const { results } = await service.evaluateWebsite({
    html,
    patterns,
  });

  console.log('\nRegexPipe Example:');
  console.log(JSON.stringify(results, null, 2));

  /* Expected output:
  {
    "title": "Maou no Musume wa Yasashisugiru!!",
    "price": "25500"
  }
  */
}

/**
 * Example: RegexPipe with merge option
 * This is the solution to the original problem!
 */
export async function regexPipeWithMergeExample() {
  const httpService = new HttpService();
  const service = new ScraperHtmlService(httpService, {});

  const html = `
    <html>
      <body>
        <div class="infozingle">
          <p>Judul : Maou no Musume wa Yasashisugiru!!</p>
        </div>
      </body>
    </html>
  `;

  const patterns: PatternField[] = [
    {
      key: 'title',
      patternType: 'xpath',
      returnType: 'text',
      // Get all text nodes
      patterns: ['.//div[@class="infozingle"]/p[1]//text()'],
      meta: { multiple: true },
      pipes: {
        // First merge the text nodes
        merge: true,
        // Then apply regex to remove prefix from merged result
        custom: [
          {
            type: 'regex',
            rules: [{ pattern: '^Judul : ', replacement: '', flags: '' }],
          },
        ],
      },
    },
  ];

  const { results } = await service.evaluateWebsite({
    html,
    patterns,
  });

  console.log('\nRegexPipe with Merge (solves original problem):');
  console.log(JSON.stringify(results, null, 2));

  /* Expected output:
  {
    "title": "Maou no Musume wa Yasashisugiru!!"
  }

  Without merge+custom, the result would be:
  "Judul : Maou no Musume wa Yasashisugiru!!"

  Because the regex pipe runs AFTER the text nodes are merged!
  */
}

/**
 * Example: ParseAsURLPipe with automatic baseUrl from fetched URL
 */
export async function parseAsURLPipeExample() {
  const httpService = new HttpService();
  const service = new ScraperHtmlService(httpService, {});

  const html = `
    <html>
      <body>
        <div class="links">
          <a href="/anime/episode-1">Episode 1</a>
          <a href="episode-2">Episode 2</a>
          <a href="https://other.com/page">External</a>
        </div>
      </body>
    </html>
  `;

  const patterns: PatternField[] = [
    {
      key: 'link',
      patternType: 'xpath',
      returnType: 'text',
      patterns: ['.//a/@href'],
      pipes: {
        custom: [{ type: 'parse-as-url' }], // Automatically gets baseUrl from URL
      },
    },
  ];

  const { results } = await service.evaluateWebsite({
    url: 'https://example.com/blabla/blabla', // baseUrl comes from here!
    html,
    patterns,
  });

  console.log('\nParseAsURLPipe Example (automatic baseUrl):');
  console.log(JSON.stringify(results, null, 2));

  /* Expected output:
  {
    "link": "https://example.com/anime/episode-1"
  }

  The baseUrl is automatically set from the fetched URL!
  */
}

/**
 * Example: Chaining multiple pipes
 */
export async function chainPipesExample() {
  const httpService = new HttpService();
  const service = new ScraperHtmlService(httpService, {});

  const html = `
    <html>
      <body>
        <div class="product">
          <span class="price">    $25.5K    </span>
        </div>
      </body>
    </html>
  `;

  const patterns: PatternField[] = [
    {
      key: 'price',
      patternType: 'xpath',
      returnType: 'text',
      patterns: ['.//span[@class="price"]/text()'],
      pipes: {
        trim: true, // Built-in pipe
        custom: [
          // Chain multiple custom pipes
          {
            type: 'regex',
            rules: [{ pattern: '^\\$', replacement: '', flags: '' }],
          },
          { type: 'num-normalize' }, // "25.5K" -> 25500
        ],
      },
    },
  ];

  const { results } = await service.evaluateWebsite({
    html,
    patterns,
  });

  console.log('\nChain Pipes Example:');
  console.log(JSON.stringify(results, null, 2));

  /* Expected output:
  {
    "price": "25500"
  }
  */
}

/**
 * Example: Creating and registering your own custom pipe
 */
class ReverseTextPipe extends PipeTransform<string, string> {
  readonly type = 'reverse-text' as const;

  exec(value: string): string {
    if (!value || typeof value !== 'string') {
      return '';
    }
    return value.split('').reverse().join('');
  }

  reverse(value: string): string {
    return this.exec(value);
  }
}

// Register the custom pipe
PIPE_REGISTRY['reverse-text'] = ReverseTextPipe;

export async function customPipeExample() {
  const httpService = new HttpService();
  const service = new ScraperHtmlService(httpService, {});

  const html = `
    <html>
      <body>
        <h1>Hello World</h1>
      </body>
    </html>
  `;

  const patterns: PatternField[] = [
    {
      key: 'reversed',
      patternType: 'xpath',
      returnType: 'text',
      patterns: ['.//h1/text()'],
      pipes: {
        custom: [{ type: 'reverse-text' }], // Use custom pipe by type
      },
    },
  ];

  const { results } = await service.evaluateWebsite({
    html,
    patterns,
  });

  console.log('\nCustom Pipe Example:');
  console.log(JSON.stringify(results, null, 2));

  /* Expected output:
  {
    "reversed": "dlroW olleH"
  }
  */
}

/**
 * Example: Custom pipe with dynamic baseUrl property
 */
class MyCustomUrlPipe extends PipeTransform<string, string> {
  readonly type = 'my-custom-url' as const;

  // This property will be automatically set when scraping!
  baseUrl?: string;

  exec(value: string): string {
    if (!value || typeof value !== 'string') {
      return '';
    }

    // If absolute URL, return as is
    if (value.startsWith('http://') || value.startsWith('https://')) {
      return value;
    }

    // Use baseUrl if available
    if (this.baseUrl) {
      return new URL(value, this.baseUrl).toString();
    }

    return value;
  }

  reverse(value: string): string {
    return value;
  }
}

// Register the custom pipe with baseUrl support
PIPE_REGISTRY['my-custom-url'] = MyCustomUrlPipe;

export async function customPipeWithBaseUrlExample() {
  const httpService = new HttpService();
  const service = new ScraperHtmlService(httpService, {});

  const html = `
    <html>
      <body>
        <a href="/page/detail">Link</a>
      </body>
    </html>
  `;

  const patterns: PatternField[] = [
    {
      key: 'fullUrl',
      patternType: 'xpath',
      returnType: 'text',
      patterns: ['.//a/@href'],
      pipes: {
        custom: [{ type: 'my-custom-url' }], // baseUrl will be set automatically!
      },
    },
  ];

  const { results } = await service.evaluateWebsite({
    url: 'https://example.com/path/to/page', // This becomes baseUrl!
    html,
    patterns,
  });

  console.log('\nCustom Pipe with baseUrl Example:');
  console.log(JSON.stringify(results, null, 2));

  /* Expected output:
  {
    "fullUrl": "https://example.com/page/detail"
  }
  */
}

// Run all examples
async function main() {
  try {
    await predefinedPipesExample();
    await regexPipeExample();
    await regexPipeWithMergeExample();
    await parseAsURLPipeExample();
    await chainPipesExample();
    await customPipeExample();
    await customPipeWithBaseUrlExample();
  } catch (error) {
    console.error('Error:', error);
  }
}

// Run if executed directly
if (require.main === module) {
  void main();
}
