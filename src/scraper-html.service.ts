import { Injectable, Logger, Inject, Optional } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom, retry, timer, catchError, throwError } from 'rxjs';
import { AxiosError } from 'axios';
import decodeHtml from 'decode-html';
import UserAgent from 'user-agents';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { HtmlBuilder } from './utils';
import {
  HtmlNode,
  PatternField,
  EvaluateOptions,
  ExtractionResult,
  UrlHealthCheckResult,
} from './types';

@Injectable()
export class ScraperHtmlService {
  private readonly logger = new Logger(ScraperHtmlService.name);
  private readonly userAgentGenerator: UserAgent;
  private readonly maxRetries: number;

  constructor(
    private readonly httpService: HttpService,
    @Inject('SCRAPER_HTML_OPTIONS')
    @Optional()
    options?: { maxRetries?: number },
  ) {
    // Initialize user agent generator for rotation
    this.userAgentGenerator = new UserAgent();
    // Set max retries from options or default to 3
    this.maxRetries = options?.maxRetries ?? 3;
  }

  async evaluateWebsite<T = ExtractionResult>(
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
            error: error instanceof Error ? error.message : String(error),
          });
        }
      });
    }

    return results;
  }

  async checkUrlAlive(
    urls: string | string[],
    options?: { useProxy?: boolean | string },
  ): Promise<UrlHealthCheckResult[]> {
    const urlArray = Array.isArray(urls) ? urls : [urls];
    const results = await Promise.all(
      urlArray.map(async (url) => {
        try {
          const config: Record<string, unknown> = {
            method: 'HEAD',
            validateStatus: () => true, // Don't throw on any status
          };

          // Configure proxy if specified
          if (options?.useProxy) {
            const proxyUrl =
              typeof options.useProxy === 'string'
                ? options.useProxy
                : process.env.HTTP_PROXY || process.env.HTTPS_PROXY;
            if (proxyUrl) {
              config.httpAgent = new HttpsProxyAgent(proxyUrl);
              config.httpsAgent = new HttpsProxyAgent(proxyUrl);
            }
          }

          const response = await firstValueFrom(
            this.httpService.request({ ...config, url }),
          );

          const statusCode = response.status;
          const alive = statusCode >= 200 && statusCode < 400;

          return {
            url,
            alive,
            statusCode,
          };
        } catch (error) {
          const axiosError = error as AxiosError;
          return {
            url,
            alive: false,
            error: axiosError.message || 'Unknown error',
          };
        }
      }),
    );

    return results;
  }

  private extractData<T = ExtractionResult>(
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

    // Collect all patterns: primary patterns first, then alternative patterns
    const allPatterns = [...pattern.patterns];
    if (pattern.meta?.alterPattern) {
      allPatterns.push(...pattern.meta.alterPattern);
    }

    for (const xpath of allPatterns) {
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

  private async fetchHtml(
    url: string,
    useProxy?: boolean | string,
  ): Promise<string> {
    // Generate a random user agent for each request
    const userAgent = this.userAgentGenerator.random().toString();

    this.logger.debug(`Fetching ${url} with User-Agent: ${userAgent}`);

    const config: Record<string, unknown> = {
      headers: {
        'User-Agent': userAgent,
      },
    };

    // Configure proxy if specified
    if (useProxy) {
      const proxyUrl =
        typeof useProxy === 'string'
          ? useProxy
          : process.env.HTTP_PROXY || process.env.HTTPS_PROXY;
      if (proxyUrl) {
        this.logger.debug(`Using proxy: ${proxyUrl}`);
        config.httpAgent = new HttpsProxyAgent(proxyUrl);
        config.httpsAgent = new HttpsProxyAgent(proxyUrl);
      }
    }

    const response = await firstValueFrom(
      this.httpService.get(url, config).pipe(
        retry({
          count: this.maxRetries,
          delay: (error, retryIndex) => {
            const axiosError = error as AxiosError;
            const isRetryable =
              !axiosError.response ||
              axiosError.response.status >= 500 ||
              axiosError.code === 'ECONNRESET';

            if (!isRetryable) {
              this.logger.error(
                `Non-retryable error fetching ${url}: ${axiosError.message}`,
              );
              throw error;
            }

            const delayMs = Math.min(1000 * Math.pow(2, retryIndex - 1), 10000); // Exponential backoff, max 10s
            this.logger.warn(
              `Retry ${retryIndex}/${this.maxRetries} for ${url} after ${delayMs}ms (error: ${axiosError.message})`,
            );

            return timer(delayMs);
          },
        }),
        catchError((error: Error) => {
          this.logger.error(
            `Failed to fetch URL after ${this.maxRetries} retries: ${url}`,
            error,
          );
          return throwError(() => error);
        }),
      ),
    );

    return response.data as string;
  }
}
