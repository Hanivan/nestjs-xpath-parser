import type { ScraperHtmlModuleOptions } from './types';
import {
  EvaluateOptions,
  ExtractionResult,
  HtmlNode,
  PatternField,
  UrlHealthCheckResult,
  instantiatePipes,
} from './types';
import { Inject, Injectable, Logger, LogLevel, Optional } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { AxiosError } from 'axios';
import { catchError, firstValueFrom, retry, throwError, timer } from 'rxjs';
import decodeHtml from 'decode-html';
import UserAgent from 'user-agents';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { HtmlBuilder } from './utils';

@Injectable()
export class ScraperHtmlService {
  private readonly logger = new Logger(ScraperHtmlService.name);
  private readonly userAgentGenerator: UserAgent;
  private readonly maxRetries: number;
  private readonly logLevels: LogLevel[];
  private readonly suppressXpathErrors: boolean;
  private readonly engine: 'libxmljs' | 'jsdom';

  constructor(
    private readonly httpService: HttpService,
    @Inject('SCRAPER_HTML_OPTIONS')
    @Optional()
    options?: ScraperHtmlModuleOptions,
  ) {
    this.userAgentGenerator = new UserAgent();
    this.maxRetries = options?.maxRetries ?? 3;
    this.suppressXpathErrors = options?.suppressXpathErrors ?? false;
    this.engine = options?.engine ?? 'libxmljs';

    // Normalize log levels to array
    this.logLevels = options?.logLevel
      ? Array.isArray(options.logLevel)
        ? options.logLevel
        : [options.logLevel]
      : ['log', 'error', 'warn'];
  }

  private shouldLog(level: LogLevel): boolean {
    if (level === 'error') {
      return true;
    }
    return this.logLevels.length > 0 && this.logLevels.includes(level);
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
      this.engine === 'jsdom',
      options.contentType || 'text/html',
      this.suppressXpathErrors,
    );

    const results = this.extractData<T>(options.patterns, dom, options.url);

    // Clean up error handler suppression
    dom.destroy();

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
    const dom = HtmlBuilder.loadHtml(
      html,
      this.engine === 'jsdom',
      'text/html',
      this.suppressXpathErrors,
    );
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

    // Clean up error handler suppression
    dom.destroy();

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
    url?: string,
  ): T[] {
    const containerPattern = patterns.find((p) => p.meta?.isContainer);
    const fieldPatterns = patterns.filter((p) => !p.meta?.isContainer);

    if (containerPattern) {
      return this.extractFromContainers(
        containerPattern,
        fieldPatterns,
        dom,
        url,
      );
    }

    return this.extractWithoutContainer(fieldPatterns, dom, url);
  }

  private extractFromContainers<T = ExtractionResult>(
    containerPattern: PatternField,
    fieldPatterns: PatternField[],
    dom: HtmlBuilder,
    url?: string,
  ): T[] {
    const containers = this.findByPattern(containerPattern, dom);
    const results: T[] = [];

    for (const container of containers) {
      const item: Record<string, unknown> = {};

      for (const pattern of fieldPatterns) {
        const value = this.extractFieldValue(pattern, dom, container, url);
        if (value !== null) {
          item[pattern.key] = value;
        }
      }

      if (Object.keys(item).length > 0) {
        results.push(item as T);
      }
    }

    return results;
  }

  private extractWithoutContainer<T = ExtractionResult>(
    patterns: PatternField[],
    dom: HtmlBuilder,
    url?: string,
  ): T[] {
    const item: Record<string, unknown> = {};

    for (const pattern of patterns) {
      const value = this.extractFieldValue(pattern, dom, undefined, url);
      if (value !== null) {
        item[pattern.key] = value;
      }
    }

    return Object.keys(item).length > 0 ? [item as T] : [];
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
        if (this.shouldLog('debug')) {
          this.logger.debug(`XPath failed: ${xpath}`, error);
        }
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
      if (this.shouldLog('debug')) {
        this.logger.debug(`Context XPath failed: ${xpath}`, error);
      }
      return [];
    }
  }

  private extractFieldValue(
    pattern: PatternField,
    dom: HtmlBuilder,
    context?: HtmlNode,
    url?: string,
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

    if (pattern.meta?.multiple) {
      return this.extractMultipleValues(nodes, pattern, dom, url);
    }

    const value = this.getNodeValue(nodes[0], pattern.returnType, dom);
    return this.applyPipes(value, pattern.pipes, url);
  }

  private extractMultipleValues(
    nodes: HtmlNode[],
    pattern: PatternField,
    dom: HtmlBuilder,
    url?: string,
  ): unknown {
    // If merge is enabled, merge first then apply pipes to the result
    if (pattern.pipes?.merge) {
      const rawValues = nodes.map((node) =>
        this.getNodeValue(node, pattern.returnType, dom),
      );

      let merged: string;
      const mergeType = pattern.pipes.merge;

      if (mergeType === 'with comma') {
        merged = rawValues.join(', ');
      } else {
        // true or 'with space' -> merge with space
        merged = rawValues.join(' ');
      }

      // Apply all pipes to the merged result
      return this.applyPipes(merged, pattern.pipes, url);
    }

    // Original behavior: apply pipes to individual values
    const cleanedValues = nodes.map((node) => {
      const value = this.getNodeValue(node, pattern.returnType, dom);
      return this.applyPipes(value, pattern.pipes, url);
    });

    if (pattern.meta?.multiple === 'with comma') {
      return cleanedValues.join(', ');
    }

    if (pattern.meta?.multiline) {
      return cleanedValues.join(' ');
    }

    return cleanedValues;
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

  private applyPipes(
    value: string,
    pipes?: PatternField['pipes'],
    url?: string,
  ): string {
    if (!pipes || !value) {
      return value;
    }

    let result = value;

    if (pipes.decode) {
      result = decodeHtml(result);
    }

    if (pipes.toLowerCase) {
      result = result.toLowerCase();
    }

    if (pipes.toUpperCase) {
      result = result.toUpperCase();
    }

    if (pipes.trim) {
      result = result.trim();
    }

    if (pipes.replace) {
      for (const replacement of pipes.replace) {
        result = result.replace(
          new RegExp(replacement.from, 'g'),
          replacement.to,
        );
      }
    }

    // Apply custom pipe(s) if specified
    if (pipes.custom && pipes.custom.length > 0) {
      const customPipes = instantiatePipes(pipes.custom, url);

      for (const customPipe of customPipes) {
        if (typeof customPipe.exec === 'function') {
          try {
            const transformed = customPipe.exec(result);
            // Convert back to string if possible
            result =
              typeof transformed === 'string'
                ? transformed
                : String(transformed);
          } catch (error) {
            if (this.shouldLog('error')) {
              this.logger.error(`Custom pipe execution failed:`, error);
            }
          }
        }
      }
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

    if (this.shouldLog('debug')) {
      this.logger.debug(`Fetching ${url} with User-Agent: ${userAgent}`);
    }

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
        if (this.shouldLog('debug')) {
          this.logger.debug(`Using proxy: ${proxyUrl}`);
        }
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
              if (this.shouldLog('error')) {
                this.logger.error(
                  `Non-retryable error fetching ${url}: ${axiosError.message}`,
                );
              }
              throw error;
            }

            const delayMs = Math.min(1000 * Math.pow(2, retryIndex - 1), 10000); // Exponential backoff, max 10s
            if (this.shouldLog('warn')) {
              this.logger.warn(
                `Retry ${retryIndex}/${this.maxRetries} for ${url} after ${delayMs}ms (error: ${axiosError.message})`,
              );
            }

            return timer(delayMs);
          },
        }),
        catchError((error: Error) => {
          if (this.shouldLog('error')) {
            this.logger.error(
              `Failed to fetch URL after ${this.maxRetries} retries: ${url}`,
              error,
            );
          }
          return throwError(() => error);
        }),
      ),
    );

    return response.data as string;
  }
}
