import type { ScraperHtmlModuleOptions } from './types';
import {
  EvaluateOptions,
  ExtractionResult,
  UrlHealthCheckResult,
} from './types';
import {
  Inject,
  Injectable,
  LogLevel,
  OnModuleDestroy,
  Optional,
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import UserAgent from 'user-agents';
import { HtmlParser, HttpTransport } from './utils';
import { PipeEngine } from './pipes';
import { ParserEngine, HttpEngine } from './enums';

@Injectable()
export class ScraperHtmlService implements OnModuleDestroy {
  private readonly userAgentGenerator = new UserAgent();
  private readonly maxRetries: number;
  private readonly logLevels: LogLevel[];
  private readonly suppressXpathErrors: boolean;
  private readonly parserEngine: ParserEngine;
  private readonly httpEngine?: HttpEngine;
  private readonly normalizeHtml: boolean;
  private readonly defaultFingerprint?:
    | string
    | import('./types').TlsFingerprint;
  private readonly requestTimeout?: number;

  private readonly pipeEngine: PipeEngine;
  private readonly htmlParser: HtmlParser;
  private readonly httpTransport: HttpTransport;

  constructor(
    private readonly httpService: HttpService,
    @Inject('SCRAPER_HTML_OPTIONS')
    @Optional()
    options?: ScraperHtmlModuleOptions,
  ) {
    this.maxRetries = options?.maxRetries ?? 3;
    this.suppressXpathErrors = options?.suppressXpathErrors ?? false;
    this.parserEngine =
      options?.parserEngine ?? options?.engine ?? ParserEngine.LIBXMLJS;
    this.httpEngine = options?.httpEngine;
    this.normalizeHtml = options?.normalizeHtml ?? false;
    this.defaultFingerprint = options?.fingerprint;
    this.requestTimeout = options?.timeout;

    this.logLevels = options?.logLevel
      ? Array.isArray(options.logLevel)
        ? options.logLevel
        : [options.logLevel]
      : ['log', 'error', 'warn'];

    this.pipeEngine = new PipeEngine();
    this.htmlParser = new HtmlParser(
      this.parserEngine,
      this.suppressXpathErrors,
      this.pipeEngine,
    );
    this.httpTransport = new HttpTransport(
      httpService,
      this.maxRetries,
      this.logLevels,
      this.userAgentGenerator,
      this.httpEngine,
      this.defaultFingerprint,
      this.requestTimeout,
    );
  }

  async evaluateWebsite<T = ExtractionResult>(
    options: EvaluateOptions,
  ): Promise<{ results: T[]; document: unknown }> {
    let html = options.html;

    if (!html && options.url) {
      const fingerprint = options.fingerprint ?? this.defaultFingerprint;
      const engine = this.httpTransport.resolveEngine(
        options.httpEngine,
        fingerprint,
      );
      html =
        engine === HttpEngine.CYCLETLS
          ? await this.httpTransport.fetchHtmlCycleTLS(
              options.url,
              options.useProxy,
              fingerprint,
              options.timeout ?? this.requestTimeout,
            )
          : await this.httpTransport.fetchHtml(options.url, options.useProxy);
    }

    if (!html) {
      throw new Error('Either html or url must be provided');
    }

    const dom = this.htmlParser.parse(
      html,
      options.contentType || 'text/html',
      this.normalizeHtml,
    );
    const results = this.htmlParser.extractData<T>(
      options.patterns,
      dom,
      options.url,
    );
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
    return this.htmlParser.validateXpath(html, xpathPatterns);
  }

  async checkUrlAlive(
    urls: string | string[],
    options?: { useProxy?: boolean | string },
  ): Promise<UrlHealthCheckResult[]> {
    return this.httpTransport.checkUrlAlive(urls, options?.useProxy);
  }

  async onModuleDestroy(): Promise<void> {
    await this.httpTransport.exit();
  }
}
