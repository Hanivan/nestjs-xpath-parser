/**
 * Example 1: Basic Web Scraping
 *
 * This example demonstrates:
 * - Setting up the ScraperHtmlService
 * - Basic XPath pattern extraction
 * - Extracting single values from HTML
 */

import {
  PatternField,
  ScraperHtmlModule,
  ScraperHtmlService,
} from '@hanivanrizky/nestjs-xpath-parser';
import { Injectable, Module } from '@nestjs/common';

// Define the data structure we want to extract
interface PageInfo {
  title: string;
  description: string;
  author: string;
}

@Injectable()
export class BasicScraperService {
  constructor(private readonly scraper: ScraperHtmlService) {}

  async scrapePageInfo(url: string): Promise<PageInfo> {
    // Define extraction patterns
    const patterns: PatternField[] = [
      {
        key: 'title',
        patternType: 'xpath',
        returnType: 'text',
        patterns: ['//title/text()'],
        pipes: {
          trim: true,
        },
      },
      {
        key: 'description',
        patternType: 'xpath',
        returnType: 'text',
        patterns: ['//meta[@name="description"]/@content'],
        pipes: {
          trim: true,
          decode: true, // Decode HTML entities
        },
      },
      {
        key: 'author',
        patternType: 'xpath',
        returnType: 'text',
        patterns: ['//meta[@name="author"]/@content'],
        pipes: {
          trim: true,
        },
      },
    ];

    // Execute the scraping
    const result = await this.scraper.evaluateWebsite<PageInfo>({
      url,
      patterns,
    });

    // Return the first result (for page-level data, there's typically only one result)
    return result.results[0];
  }

  async scrapeWithHtml(htmlContent: string): Promise<PageInfo> {
    const patterns: PatternField[] = [
      {
        key: 'title',
        patternType: 'xpath',
        returnType: 'text',
        patterns: ['//title/text()'],
        pipes: { trim: true },
      },
      {
        key: 'description',
        patternType: 'xpath',
        returnType: 'text',
        patterns: ['//meta[@name="description"]/@content'],
        pipes: { trim: true },
      },
      {
        key: 'author',
        patternType: 'xpath',
        returnType: 'text',
        patterns: ['//meta[@name="author"]/@content'],
        pipes: { trim: true },
      },
    ];

    // You can also provide HTML directly instead of fetching from URL
    const result = await this.scraper.evaluateWebsite<PageInfo>({
      html: htmlContent,
      patterns,
    });

    return result.results[0];
  }
}

@Module({
  imports: [ScraperHtmlModule],
  providers: [BasicScraperService],
})
export class BasicScraperModule {}

// Usage example
async function main() {
  // In a real application, you would inject this service
  // For this example, we'll show how to use it

  const service = new BasicScraperService(/* inject ScraperHtmlService */);

  // Scrape a URL
  const pageInfo = await service.scrapePageInfo('https://example.com');

  console.log('Page Title:', pageInfo.title);
  console.log('Description:', pageInfo.description);
  console.log('Author:', pageInfo.author);
}

// Uncomment to run
// main().catch(console.error);
