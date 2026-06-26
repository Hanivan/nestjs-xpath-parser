/**
 * Example 11: CleanHtmlPipe, normalizeHtml, Pagination (isPage)
 *
 * This example demonstrates:
 * 1. CleanHtmlPipe — strip script/style tags, return visible text
 * 2. normalizeHtml option — collapse redundant whitespace before parsing
 * 3. isPage / pageUrlKey / pageTextKey — extract pagination links as structured objects
 */

import { ScraperHtmlService } from '../scraper-html.service';
import { HttpService } from '@nestjs/axios';
import { PatternField } from '../types';

export async function cleanHtmlPipeExample() {
  console.log('─'.repeat(80));
  console.log('(>_<) Example 1: CleanHtmlPipe');
  console.log('─'.repeat(80));
  console.log('');

  const httpService = new HttpService();
  const service = new ScraperHtmlService(httpService, {});

  const html = `
    <html>
      <body>
        <div class="article-body">
          <p>First paragraph content.</p>
          <script>trackPageView();</script>
          <p>Second paragraph content.</p>
          <style>.ads { display: none }</style>
          <p>Third paragraph content.</p>
        </div>
      </body>
    </html>
  `;

  const patterns: PatternField[] = [
    {
      key: 'rawBody',
      patternType: 'xpath',
      returnType: 'rawHTML',
      patterns: ['.//div[@class="article-body"]'],
    },
    {
      key: 'cleanBody',
      patternType: 'xpath',
      returnType: 'rawHTML',
      patterns: ['.//div[@class="article-body"]'],
      pipes: {
        custom: [{ type: 'clean-html' }],
      },
    },
  ];

  const { results } = await service.evaluateWebsite({ html, patterns });

  console.log('(._.) Raw HTML body:');
  console.log(results[0].rawBody);
  console.log('\n(._.) Clean text body (scripts/styles stripped):');
  console.log(results[0].cleanBody);
  console.log('\n(^_^) CleanHtmlPipe example completed\n');
}

export async function normalizeHtmlExample() {
  console.log('─'.repeat(80));
  console.log('(>_<) Example 2: normalizeHtml Option');
  console.log('─'.repeat(80));
  console.log('');

  const httpService = new HttpService();
  const serviceDefault = new ScraperHtmlService(httpService, {});
  const serviceNormalized = new ScraperHtmlService(httpService, {
    normalizeHtml: true,
  });

  const html = `
    <html>
      <body>
        <div class="post">

\t\t\t\t<h2>Post Title</h2>

\t\t\t\t<p>Post content with\t\textra\t\ttabs.</p>

        </div>
      </body>
    </html>
  `;

  const patterns: PatternField[] = [
    {
      key: 'title',
      patternType: 'xpath',
      returnType: 'text',
      patterns: ['.//h2/text()'],
      pipes: { trim: true },
    },
    {
      key: 'content',
      patternType: 'xpath',
      returnType: 'text',
      patterns: ['.//p/text()'],
      pipes: { trim: true },
    },
  ];

  const { results: defaultResults } = await serviceDefault.evaluateWebsite({
    html,
    patterns,
  });
  const { results: normalizedResults } =
    await serviceNormalized.evaluateWebsite({ html, patterns });

  console.log(
    '(._.) Without normalizeHtml:',
    JSON.stringify(defaultResults[0], null, 2),
  );
  console.log(
    '(._.) With normalizeHtml:',
    JSON.stringify(normalizedResults[0], null, 2),
  );
  console.log('\n(^_^) normalizeHtml example completed\n');
}

export async function paginationExample() {
  console.log('─'.repeat(80));
  console.log('(>_<) Example 3: Pagination (isPage)');
  console.log('─'.repeat(80));
  console.log('');

  const httpService = new HttpService();
  const service = new ScraperHtmlService(httpService, {});

  const html = `
    <html>
      <body>
        <div class="posts">
          <article class="post">
            <h2>Post One</h2>
            <p>Summary of post one.</p>
          </article>
          <article class="post">
            <h2>Post Two</h2>
            <p>Summary of post two.</p>
          </article>
        </div>
        <ul class="pagination">
          <li><a href="/page/1">1</a></li>
          <li><a href="/page/2">2</a></li>
          <li><a href="/page/3">3</a></li>
          <li><a href="/page/4">Next</a></li>
        </ul>
      </body>
    </html>
  `;

  const patterns: PatternField[] = [
    {
      key: 'container',
      patternType: 'xpath',
      returnType: 'text',
      patterns: ['.//article[@class="post"]'],
      meta: { isContainer: true },
    },
    {
      key: 'title',
      patternType: 'xpath',
      returnType: 'text',
      patterns: ['.//h2/text()'],
      pipes: { trim: true },
    },
    {
      key: 'summary',
      patternType: 'xpath',
      returnType: 'text',
      patterns: ['.//p/text()'],
      pipes: { trim: true },
    },
    {
      key: 'pages',
      patternType: 'xpath',
      returnType: 'text',
      patterns: ['.//ul[@class="pagination"]//a'],
      meta: { isPage: true },
    },
  ];

  const { results } = await service.evaluateWebsite({
    url: 'https://example.com/blog',
    html,
    patterns,
  });

  const posts = results.filter((r: any) => r.title);
  const pages = results.filter((r: any) => r.url);

  console.log('(._.) Posts:', JSON.stringify(posts, null, 2));
  console.log('(._.) Pagination:', JSON.stringify(pages, null, 2));
  console.log('\n(^_^) Pagination example completed\n');
}

export async function paginationCustomKeysExample() {
  console.log('─'.repeat(80));
  console.log('(>_<) Example 4: Pagination with Custom Key Names');
  console.log('─'.repeat(80));
  console.log('');

  const httpService = new HttpService();
  const service = new ScraperHtmlService(httpService, {});

  const html = `
    <html>
      <body>
        <nav class="pager">
          <a href="/thread/1">Page 1</a>
          <a href="/thread/2">Page 2</a>
          <a href="/thread/3">Page 3</a>
        </nav>
      </body>
    </html>
  `;

  const patterns: PatternField[] = [
    {
      key: 'pages',
      patternType: 'xpath',
      returnType: 'text',
      patterns: ['.//nav[@class="pager"]//a'],
      meta: {
        isPage: true,
        pageUrlKey: 'href',
        pageTextKey: 'label',
      },
    },
  ];

  const { results } = await service.evaluateWebsite({ html, patterns });

  console.log(
    '(._.) Pagination with custom keys:',
    JSON.stringify(results, null, 2),
  );
  console.log('\n(^_^) Custom pagination keys example completed\n');
}

async function main() {
  try {
    await cleanHtmlPipeExample();
    await normalizeHtmlExample();
    await paginationExample();
    await paginationCustomKeysExample();

    console.log(
      '\n\\(^o^)/ All pagination and HTML cleanup examples completed!',
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('\n(x_x) Error during demo:', errorMessage);
    process.exit(1);
  }
}

if (require.main === module) {
  void main();
}
