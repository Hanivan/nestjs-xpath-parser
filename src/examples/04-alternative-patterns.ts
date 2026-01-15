/**
 * Example 4: Alternative Patterns and Fallbacks
 *
 * This example demonstrates:
 * - Using alterPattern for fallback XPath patterns
 * - Robust extraction when page structure varies
 * - Multiple extraction strategies
 * - Graceful degradation
 */

import { ScraperHtmlService } from '../scraper-html.service';
import { HttpService } from '@nestjs/axios';
import { PatternField } from '../types';

interface Article extends Record<string, unknown> {
  title: string;
  description: string;
  author: string;
  publishDate: string;
  image: string;
}

async function demonstrateAlternativePatterns() {
  const httpService = new HttpService();
  const scraper = new ScraperHtmlService(httpService);

  console.log('(>_<) Alternative Patterns Demo');
  console.log('='.repeat(50));

  try {
    // Sample HTML with different meta tag formats
    const sampleHtml1 = `
      <html>
        <head>
          <title>Advanced TypeScript Patterns</title>
          <meta name="description" content="Learn advanced patterns in TypeScript">
          <meta name="author" content="John Doe">
          <meta name="publish-date" content="2024-01-15">
        </head>
        <body>
          <article>
            <h1>Advanced TypeScript Patterns</h1>
            <img src="/main-image.jpg" alt="Article Image">
          </article>
        </body>
      </html>
    `;

    // Sample HTML with Open Graph format
    const sampleHtml2 = `
      <html>
        <head>
          <title>React Best Practices</title>
          <meta property="og:title" content="React Best Practices Guide">
          <meta property="og:description" content="Master React with these best practices">
          <meta property="article:author" content="Jane Smith">
          <meta property="article:published_time" content="2024-01-20">
          <meta property="og:image" content="/og-image.jpg">
        </head>
        <body>
          <article>
            <h1>React Best Practices</h1>
          </article>
        </body>
      </html>
    `;

    // Sample HTML with minimal metadata
    const sampleHtml3 = `
      <html>
        <head>
          <title>Simple Blog Post</title>
        </head>
        <body>
          <article>
            <h1>Simple Blog Post</h1>
            <div class="author-info">
              <span>Written by: Alice Johnson</span>
            </div>
            <time datetime="2024-01-25">January 25, 2024</time>
            <figure>
              <img src="/article-image.jpg" alt="Post Image">
            </figure>
          </article>
        </body>
      </html>
    `;

    console.log('\n(._.) Extraction with Alternative Patterns:\n');

    // Define patterns with fallbacks
    const patterns: PatternField[] = [
      {
        key: 'title',
        patternType: 'xpath',
        returnType: 'text',
        patterns: ['//meta[@property="og:title"]/@content'],
        meta: {
          alterPattern: [
            '//h1/text()', // Fallback to h1
            '//title/text()', // Fallback to title tag
          ],
        },
        pipes: { trim: true },
      },
      {
        key: 'description',
        patternType: 'xpath',
        returnType: 'text',
        patterns: ['//meta[@property="og:description"]/@content'],
        meta: {
          alterPattern: [
            '//meta[@name="description"]/@content', // Standard meta description
            '//article/p[1]/text()', // First paragraph as fallback
          ],
        },
        pipes: { trim: true, decode: true },
      },
      {
        key: 'author',
        patternType: 'xpath',
        returnType: 'text',
        patterns: ['//meta[@property="article:author"]/@content'],
        meta: {
          alterPattern: [
            '//meta[@name="author"]/@content', // Standard meta author
            '//div[@class="author-info"]/span/text()', // Extract from author div
            '//a[@rel="author"]/text()', // Author link
          ],
        },
        pipes: {
          trim: true,
          replace: [{ from: 'Written by:\\s*', to: '' }],
        },
      },
      {
        key: 'publishDate',
        patternType: 'xpath',
        returnType: 'text',
        patterns: ['//meta[@property="article:published_time"]/@content'],
        meta: {
          alterPattern: [
            '//meta[@name="publish-date"]/@content',
            '//time/@datetime',
            '//time/text()',
          ],
        },
        pipes: { trim: true },
      },
      {
        key: 'image',
        patternType: 'xpath',
        returnType: 'text',
        patterns: ['//meta[@property="og:image"]/@content'],
        meta: {
          alterPattern: [
            '//article//img/@src', // First image in article
            '//figure//img/@src', // Image in figure
            '//img/@src', // Any image
          ],
        },
      },
    ];

    // Test with first HTML (standard meta tags)
    console.log('(o_o) Extracting from HTML with Standard Meta Tags:');
    console.log('─'.repeat(60));
    const result1 = await scraper.evaluateWebsite<Article>({
      html: sampleHtml1,
      patterns,
    });

    const article1 = result1.results[0];
    console.log(`   Title:        "${article1.title}"`);
    console.log(`   Description:  "${article1.description}"`);
    console.log(`   Author:       "${article1.author}"`);
    console.log(`   Publish Date: "${article1.publishDate}"`);
    console.log(`   Image:        "${article1.image}"`);
    console.log('');

    // Test with second HTML (Open Graph tags)
    console.log('(o_o) Extracting from HTML with Open Graph Tags:');
    console.log('─'.repeat(60));
    const result2 = await scraper.evaluateWebsite<Article>({
      html: sampleHtml2,
      patterns,
    });

    const article2 = result2.results[0];
    console.log(`   Title:        "${article2.title}"`);
    console.log(`   Description:  "${article2.description}"`);
    console.log(`   Author:       "${article2.author}"`);
    console.log(`   Publish Date: "${article2.publishDate}"`);
    console.log(`   Image:        "${article2.image}"`);
    console.log('');

    // Test with third HTML (minimal metadata)
    console.log(
      '(o_o) Extracting from HTML with Minimal Metadata (Using Fallbacks):',
    );
    console.log('─'.repeat(60));
    const result3 = await scraper.evaluateWebsite<Article>({
      html: sampleHtml3,
      patterns,
    });

    const article3 = result3.results[0];
    console.log(`   Title:        "${article3.title}"`);
    console.log(`   Description:  "${article3.description || 'N/A'}"`);
    console.log(`   Author:       "${article3.author}"`);
    console.log(`   Publish Date: "${article3.publishDate}"`);
    console.log(`   Image:        "${article3.image}"`);
    console.log('');

    console.log('\n(._.) Pattern Fallback Strategy:');
    console.log('─'.repeat(60));
    console.log('For each field, the scraper tries patterns in this order:');
    console.log('');
    console.log('Title:');
    console.log('  1. og:title meta tag (Open Graph)');
    console.log('  2. <h1> element (page heading)');
    console.log('  3. <title> tag (browser title)');
    console.log('');
    console.log('Description:');
    console.log('  1. og:description meta tag (Open Graph)');
    console.log('  2. description meta tag (standard)');
    console.log('  3. First paragraph in article');
    console.log('');
    console.log('Author:');
    console.log('  1. article:author meta tag (Open Graph)');
    console.log('  2. author meta tag (standard)');
    console.log('  3. Author info div content');
    console.log('  4. Author link with rel="author"');
    console.log('');
    console.log('Publish Date:');
    console.log('  1. article:published_time meta tag');
    console.log('  2. publish-date meta tag');
    console.log('  3. <time> datetime attribute');
    console.log('  4. <time> text content');
    console.log('');
    console.log('Image:');
    console.log('  1. og:image meta tag');
    console.log('  2. First image in <article>');
    console.log('  3. Image in <figure> element');
    console.log('  4. Any <img> tag');

    console.log('\n\n(☆^O^☆) Benefits of Alternative Patterns:');
    console.log('─'.repeat(60));
    console.log('(^_^) Robust extraction across different page structures');
    console.log('(^_^) Graceful degradation when primary selectors fail');
    console.log(
      '(^_^) Support for multiple metadata standards (OG, Schema.org, etc.)',
    );
    console.log('(^_^) Reduced scraping failures due to page changes');
    console.log('(^_^) Better data quality with multiple fallback options');
  } catch (error) {
    console.error(
      '(x_x) Error during demo:',
      error instanceof Error ? error.message : String(error),
    );
  }
}

// Run the demonstration if this file is executed directly
if (require.main === module) {
  demonstrateAlternativePatterns()
    .then(() => console.log('\n\\(^o^)/ Alternative patterns demo completed!'))
    .catch(console.error);
}

export { demonstrateAlternativePatterns };
