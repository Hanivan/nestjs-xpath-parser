/**
 * Example 12: Raw Mode — Access the Fetched HTML Alongside Extracted Fields
 *
 * This example demonstrates:
 * - Using `mode: 'raw'` to receive the raw HTML string in the result
 * - Comparing extracted field values with the underlying HTML
 * - Storing or forwarding the raw HTML for downstream processing
 *   (e.g. archiving, diff-based change detection, feeding another parser)
 */

import { ScraperHtmlService } from '../scraper-html.service';
import { HttpService } from '@nestjs/axios';
import { PatternField } from '../types';

async function demonstrateRawMode() {
  const httpService = new HttpService();
  const scraper = new ScraperHtmlService(httpService);

  console.log('(>_<) Raw Mode Demo');
  console.log('='.repeat(50));

  // ── Example 1: Normal mode (default) ─────────────────────────────────────
  console.log('\n(._.) Example 1 — Normal mode (rawHtml is absent)\n');

  const patterns: PatternField[] = [
    {
      key: 'title',
      patternType: 'xpath',
      returnType: 'text',
      patterns: ['//h1/text()', '//title/text()'],
    },
    {
      key: 'description',
      patternType: 'xpath',
      returnType: 'text',
      patterns: ['//meta[@name="description"]/@content'],
    },
  ];

  const normalResult = await scraper.evaluateWebsite({
    url: 'https://example.com',
    patterns,
    // mode not set — defaults to 'normal'
  });

  console.log('rawHtml present:', 'rawHtml' in normalResult); // false
  console.log('Extracted title:', normalResult.results[0]?.['title'] ?? '(none)');

  // ── Example 2: Raw mode ───────────────────────────────────────────────────
  console.log('\n(>_<) Example 2 — Raw mode (rawHtml is returned)\n');

  const rawResult = await scraper.evaluateWebsite({
    url: 'https://example.com',
    patterns,
    mode: 'raw',
  });

  console.log('rawHtml present:', 'rawHtml' in rawResult); // true
  console.log('rawHtml length (bytes):', rawResult.rawHtml?.length ?? 0);
  console.log(
    'rawHtml preview (first 120 chars):',
    rawResult.rawHtml?.slice(0, 120).replace(/\s+/g, ' '),
  );
  console.log('Extracted title:', rawResult.results[0]?.['title'] ?? '(none)');

  // ── Example 3: Raw mode with inline html ─────────────────────────────────
  console.log('\n(^_^) Example 3 — Raw mode with inline html option\n');

  const inlineHtml = `
    <html>
      <head><title>Test Page</title></head>
      <body>
        <h1>Hello World</h1>
        <p class="intro">This is a test paragraph.</p>
      </body>
    </html>
  `;

  const inlineResult = await scraper.evaluateWebsite({
    html: inlineHtml,
    patterns: [
      {
        key: 'heading',
        patternType: 'xpath',
        returnType: 'text',
        patterns: ['//h1/text()'],
      },
      {
        key: 'intro',
        patternType: 'xpath',
        returnType: 'rawHTML', // per-field raw HTML extraction
        patterns: ['//p[@class="intro"]'],
      },
    ],
    mode: 'raw',
  });

  console.log('Heading (text):', inlineResult.results[0]?.['heading']);
  console.log('Intro (rawHTML field):', inlineResult.results[1]?.['intro']);
  console.log(
    'Full HTML echo (mode raw):',
    inlineResult.rawHtml?.trim().slice(0, 60),
  );

  // ── Typical use case: archive raw HTML alongside extracted data ───────────
  console.log(
    '\n(._.) Typical use case: archive raw HTML alongside extracted data\n',
  );

  async function scrapeAndArchive(url: string) {
    const { results, rawHtml } = await scraper.evaluateWebsite({
      url,
      patterns,
      mode: 'raw',
    });

    return {
      extractedAt: new Date().toISOString(),
      url,
      fields: results,
      // Store rawHtml in DB / object storage for diff detection or re-parsing
      htmlSnapshot: rawHtml,
    };
  }

  const archived = await scrapeAndArchive('https://example.com');
  console.log('Archived url:', archived.url);
  console.log('Archived at:', archived.extractedAt);
  console.log('Snapshot size:', archived.htmlSnapshot?.length ?? 0, 'bytes');
  console.log(
    'Fields extracted:',
    archived.fields.length,
    'result(s)',
  );
}

if (require.main === module) {
  demonstrateRawMode()
    .then(() => console.log('\n\\(^o^)/ Raw mode demo completed!'))
    .catch(console.error);
}

export { demonstrateRawMode };
