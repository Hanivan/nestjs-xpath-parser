/**
 * Example 5: XML Parsing (Sitemap, RSS, etc.)
 *
 * This example demonstrates:
 * - Parsing XML content instead of HTML
 * - Extracting data from sitemaps
 * - Working with RSS feeds
 * - Using XPath with XML namespaces
 */

import { ScraperHtmlService } from '../scraper-html.service';
import { HttpService } from '@nestjs/axios';
import { PatternField } from '../types';

interface SitemapUrl extends Record<string, unknown> {
  loc: string;
  lastmod: string;
  changefreq: string;
  priority: string;
}

interface RssItem extends Record<string, unknown> {
  title: string;
  link: string;
  description: string;
  pubDate: string;
}

async function demonstrateXmlParsing() {
  const httpService = new HttpService();
  const scraper = new ScraperHtmlService(httpService);

  console.log('(._.) XML Parsing Demo');
  console.log('='.repeat(50));

  try {
    // Sample sitemap XML
    const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://example.com/</loc>
    <lastmod>2024-01-15</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://example.com/about</loc>
    <lastmod>2024-01-10</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://example.com/products</loc>
    <lastmod>2024-01-20</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>https://example.com/blog</loc>
    <lastmod>2024-01-22</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.7</priority>
  </url>
</urlset>`;

    // Sample RSS feed XML
    const rssXml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Example Blog</title>
    <link>https://example.com/blog</link>
    <description>Latest blog posts</description>
    <item>
      <title>Getting Started with Web Scraping</title>
      <link>https://example.com/blog/web-scraping-101</link>
      <description>Learn the basics of web scraping with practical examples</description>
      <pubDate>Mon, 15 Jan 2024 10:00:00 GMT</pubDate>
    </item>
    <item>
      <title>Advanced XPath Techniques</title>
      <link>https://example.com/blog/xpath-advanced</link>
      <description>Master XPath for complex data extraction scenarios</description>
      <pubDate>Wed, 17 Jan 2024 14:30:00 GMT</pubDate>
    </item>
    <item>
      <title>Building Robust Scrapers</title>
      <link>https://example.com/blog/robust-scrapers</link>
      <description>Best practices for creating maintainable web scrapers</description>
      <pubDate>Fri, 19 Jan 2024 09:15:00 GMT</pubDate>
    </item>
  </channel>
</rss>`;

    console.log('\n(o_o) Parsing Sitemap XML:\n');
    console.log('─'.repeat(70));

    // Define sitemap extraction patterns
    const sitemapPatterns: PatternField[] = [
      {
        key: 'container',
        patternType: 'xpath',
        returnType: 'text',
        patterns: ['//url'],
        meta: { isContainer: true },
      },
      {
        key: 'loc',
        patternType: 'xpath',
        returnType: 'text',
        patterns: ['.//loc/text()'],
        pipes: { trim: true },
      },
      {
        key: 'lastmod',
        patternType: 'xpath',
        returnType: 'text',
        patterns: ['.//lastmod/text()'],
        pipes: { trim: true },
      },
      {
        key: 'changefreq',
        patternType: 'xpath',
        returnType: 'text',
        patterns: ['.//changefreq/text()'],
        pipes: { trim: true },
      },
      {
        key: 'priority',
        patternType: 'xpath',
        returnType: 'text',
        patterns: ['.//priority/text()'],
        pipes: { trim: true },
      },
    ];

    // Extract sitemap URLs
    const sitemapResult = await scraper.evaluateWebsite<SitemapUrl>({
      html: sitemapXml,
      patterns: sitemapPatterns,
      contentType: 'text/xml', // Important: specify XML content type
    });

    console.log(`Found ${sitemapResult.results.length} URLs in sitemap:\n`);
    sitemapResult.results.forEach((url, index) => {
      console.log(`${index + 1}. ${url.loc}`);
      console.log(`   Last Modified: ${url.lastmod}`);
      console.log(`   Change Freq:   ${url.changefreq}`);
      console.log(`   Priority:      ${url.priority}`);
      console.log('');
    });

    console.log('\n(o_o) Parsing RSS Feed XML:\n');
    console.log('─'.repeat(70));

    // Define RSS extraction patterns
    const rssPatterns: PatternField[] = [
      {
        key: 'container',
        patternType: 'xpath',
        returnType: 'text',
        patterns: ['//item'],
        meta: { isContainer: true },
      },
      {
        key: 'title',
        patternType: 'xpath',
        returnType: 'text',
        patterns: ['.//title/text()'],
        pipes: { trim: true },
      },
      {
        key: 'link',
        patternType: 'xpath',
        returnType: 'text',
        patterns: ['.//link/text()'],
        pipes: { trim: true },
      },
      {
        key: 'description',
        patternType: 'xpath',
        returnType: 'text',
        patterns: ['.//description/text()'],
        pipes: { trim: true, decode: true },
      },
      {
        key: 'pubDate',
        patternType: 'xpath',
        returnType: 'text',
        patterns: ['.//pubDate/text()'],
        pipes: { trim: true },
      },
    ];

    // Extract RSS items
    const rssResult = await scraper.evaluateWebsite<RssItem>({
      html: rssXml,
      patterns: rssPatterns,
      contentType: 'text/xml',
    });

    console.log(`Found ${rssResult.results.length} blog posts in RSS feed:\n`);
    rssResult.results.forEach((item, index) => {
      console.log(`${index + 1}. ${item.title}`);
      console.log(`   Link:        ${item.link}`);
      console.log(`   Description: ${item.description}`);
      console.log(`   Published:   ${item.pubDate}`);
      console.log('');
    });

    console.log('\n(o_o) Extracting Channel Metadata from RSS:\n');
    console.log('─'.repeat(70));

    // Extract channel-level data (non-container pattern)
    const channelPatterns: PatternField[] = [
      {
        key: 'title',
        patternType: 'xpath',
        returnType: 'text',
        patterns: ['//channel/title/text()'],
        pipes: { trim: true },
      },
      {
        key: 'link',
        patternType: 'xpath',
        returnType: 'text',
        patterns: ['//channel/link/text()'],
        pipes: { trim: true },
      },
      {
        key: 'description',
        patternType: 'xpath',
        returnType: 'text',
        patterns: ['//channel/description/text()'],
        pipes: { trim: true },
      },
    ];

    const channelResult = await scraper.evaluateWebsite({
      html: rssXml,
      patterns: channelPatterns,
      contentType: 'text/xml',
    });

    const channel = channelResult.results[0];
    console.log('Channel Information:');
    console.log(`  Title:       ${String(channel.title)}`);
    console.log(`  Link:        ${String(channel.link)}`);
    console.log(`  Description: ${String(channel.description)}`);

    console.log('\n\n(._.) XML Parsing Summary:');
    console.log('─'.repeat(70));
    console.log('(^_^) contentType: "text/xml" enables XML parsing mode');
    console.log('(^_^) Container patterns work the same as HTML');
    console.log('(^_^) XPath is perfect for navigating XML structure');
    console.log('(^_^) Great for sitemaps, RSS feeds, SOAP responses, etc.');
    console.log('(^_^) All pipe transformations work with XML data');

    console.log('\n\n(._.) Common XML Use Cases:');
    console.log('─'.repeat(70));
    console.log('(._.) Sitemap parsing (sitemap.xml)');
    console.log('(._.) RSS/Atom feed parsing');
    console.log('(>_<) SOAP API response parsing');
    console.log('(・_・) Configuration file parsing');
    console.log('(._.) Data export file parsing');
    console.log('(._.) XML database exports');
  } catch (error) {
    console.error(
      '(x_x) Error during XML parsing demo:',
      error instanceof Error ? error.message : String(error),
    );
  }
}

// Run the demonstration if this file is executed directly
if (require.main === module) {
  demonstrateXmlParsing()
    .then(() => console.log('\n\\(^o^)/ XML parsing demo completed!'))
    .catch(console.error);
}

export { demonstrateXmlParsing };
