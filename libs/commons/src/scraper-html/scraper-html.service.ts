import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import decodeHtml = require('decode-html');
import * as libxmljs from 'libxmljs2';
import UserAgent from 'user-agents';
import { HtmlBuilder } from './utils';
import { PatternField, EvaluateOptions } from './types';

type HtmlNode = libxmljs.Element | Element | null;

@Injectable()
export class ScraperHtmlService {
  private readonly logger = new Logger(ScraperHtmlService.name);
  private readonly userAgentGenerator: UserAgent;

  constructor(private readonly httpService: HttpService) {
    // Initialize user agent generator for rotation
    this.userAgentGenerator = new UserAgent();
  }

  async evaluateWebsite<T extends Record<string, unknown>>(
    options: EvaluateOptions,
  ): Promise<{ results: T[]; document: unknown }> {
    let html = options.html;

    // Fetch HTML from URL if not provided
    if (!html && options.url) {
      html = await this.fetchHtml(options.url, options.useProxy);
    }

    if (!html) {
      throw new Error('Either html or url must be provided');
    }

    const dom = HtmlBuilder.loadHtml(
      html,
      false,
      options.contentType || 'text/html',
    );

    const results = this.extractData<T>(options.patterns, dom);

    return {
      results,
      document: dom.getDocument(),
    };
  }

  validateXpath(
    html: string,
    xpathPatterns?: string[],
  ): {
    valid: boolean;
    results: Array<{
      xpath: string;
      valid: boolean;
      matchCount?: number;
      sample?: string;
      error?: string;
    }>;
  } {
    const dom = HtmlBuilder.loadHtml(html);
    const results: {
      valid: boolean;
      results: Array<{
        xpath: string;
        valid: boolean;
        matchCount?: number;
        sample?: string;
        error?: string;
      }>;
    } = {
      valid: true,
      results: [],
    };

    if (xpathPatterns && xpathPatterns.length > 0) {
      xpathPatterns.forEach((xpath) => {
        try {
          const nodes = dom.findXpath(xpath);
          results.results.push({
            xpath,
            valid: true,
            matchCount: nodes.length,
            sample: nodes.length > 0 ? dom.value(nodes[0]) : undefined,
          });
        } catch (error) {
          results.valid = false;
          results.results.push({
            xpath,
            valid: false,
            error: error.message,
          });
        }
      });
    }

    return results;
  }

  private extractData<T extends Record<string, unknown>>(
    patterns: PatternField[],
    dom: HtmlBuilder,
  ): T[] {
    const extractedData: T[] = [];
    const containerPattern = patterns.find((p) => p.meta?.isContainer);

    if (containerPattern) {
      // Container-based extraction
      const containers = this.findByPattern(containerPattern, dom);

      containers.forEach((container) => {
        const item: Record<string, unknown> = {};
        patterns
          .filter((p) => !p.meta?.isContainer)
          .forEach((pattern) => {
            const value = this.extractFieldValue(pattern, dom, container);
            if (value !== null) {
              item[pattern.key] = value;
            }
          });

        if (Object.keys(item).length > 0) {
          extractedData.push(item as T);
        }
      });
    } else {
      // Non-container extraction
      const item: Record<string, unknown> = {};
      patterns.forEach((pattern) => {
        const value = this.extractFieldValue(pattern, dom);
        if (value !== null) {
          item[pattern.key] = value;
        }
      });

      if (Object.keys(item).length > 0) {
        extractedData.push(item as T);
      }
    }

    return extractedData;
  }

  private findByPattern(
    pattern: PatternField,
    dom: HtmlBuilder,
    context?: HtmlNode,
  ): HtmlNode[] {
    if (pattern.patternType !== 'xpath') {
      throw new Error(
        'Only xpath pattern type is supported in scraper-html mode',
      );
    }

    for (const xpath of pattern.patterns) {
      try {
        const nodes = context
          ? this.findXpathInContext(xpath, context, dom)
          : dom.findXpath(xpath);

        if (nodes && nodes.length > 0) {
          return nodes;
        }
      } catch (error) {
        this.logger.debug(`XPath failed: ${xpath}`, error);
      }
    }

    return [];
  }

  private findXpathInContext(
    xpath: string,
    context: HtmlNode,
    dom: HtmlBuilder,
  ): HtmlNode[] {
    if (!context) {
      return [];
    }

    try {
      // Use the context node to search within its subtree
      return dom.findXpathInContext(xpath, context) as HtmlNode[];
    } catch (error) {
      this.logger.debug(`Context XPath failed: ${xpath}`, error);
      return [];
    }
  }

  private extractFieldValue(
    pattern: PatternField,
    dom: HtmlBuilder,
    context?: HtmlNode,
  ): unknown {
    if (pattern.patternType !== 'xpath') {
      throw new Error(
        'Only xpath pattern type is supported in scraper-html mode',
      );
    }

    const nodes = this.findByPattern(pattern, dom, context);

    if (nodes.length === 0) {
      return null;
    }

    // Handle multiple values
    if (pattern.meta?.multiple) {
      const values = nodes.map((node) =>
        this.getNodeValue(node, pattern.returnType, dom),
      );
      const cleanedValues = values.map((v) =>
        this.applyPipes(v, pattern.pipes),
      );

      if (pattern.meta.multiple === 'with comma') {
        return cleanedValues.join(', ');
      } else if (pattern.meta.multiline) {
        return cleanedValues.join(' ');
      }
      return cleanedValues;
    }

    // Single value
    const value = this.getNodeValue(nodes[0], pattern.returnType, dom);
    return this.applyPipes(value, pattern.pipes);
  }

  private getNodeValue(
    node: HtmlNode,
    returnType: 'text' | 'rawHTML',
    dom: HtmlBuilder,
  ): string {
    if (returnType === 'rawHTML') {
      return dom.htmlString(node);
    }
    return dom.value(node);
  }

  private applyPipes(value: string, pipes?: PatternField['pipes']): string {
    if (!pipes || !value) return value;

    let result = value;

    if (pipes.decode) {
      result = decodeHtml(result);
    }

    if (pipes.trim) {
      result = result.trim();
    }

    if (pipes.toLowerCase) {
      result = result.toLowerCase();
    }

    if (pipes.toUpperCase) {
      result = result.toUpperCase();
    }

    if (pipes.replace) {
      pipes.replace.forEach((r) => {
        result = result.replace(new RegExp(r.from, 'g'), r.to);
      });
    }

    // Normalize whitespace
    result = result.replace(/\s+/g, ' ').trim();

    return result;
  }

  private async fetchHtml(url: string, _useProxy?: boolean): Promise<string> {
    try {
      // Generate a random user agent for each request
      const userAgent = this.userAgentGenerator.random().toString();

      this.logger.debug(`Fetching ${url} with User-Agent: ${userAgent}`);

      const response = await firstValueFrom(
        this.httpService.get(url, {
          headers: {
            'User-Agent': userAgent,
          },
        }),
      );

      return response.data;
    } catch (error) {
      this.logger.error(`Failed to fetch URL: ${url}`, error);
      throw new Error(`Failed to fetch HTML from ${url}`);
    }
  }
}
