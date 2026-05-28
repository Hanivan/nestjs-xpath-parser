import { Logger, LogLevel } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { AxiosError } from 'axios';
import { catchError, firstValueFrom, retry, throwError, timer } from 'rxjs';
import UserAgent from 'user-agents';
import { UrlHealthCheckResult, TlsFingerprint } from '../types';
import { HttpEngine } from '../enums';
import { CycleTLSFetcher } from './cycletls-fetcher';
import { proxyAgents } from './proxy';
import { backoffMs } from './backoff';

export class HttpTransport {
  private readonly logger = new Logger(HttpTransport.name);
  private cycleFetcher?: CycleTLSFetcher;

  constructor(
    private readonly httpService: HttpService,
    private readonly maxRetries: number,
    private readonly logLevels: LogLevel[],
    private readonly userAgentGenerator: UserAgent,
    private readonly httpEngine?: HttpEngine,
    private readonly defaultFingerprint?: string | TlsFingerprint,
    private readonly requestTimeout?: number,
  ) {}

  private shouldLog(level: LogLevel): boolean {
    if (level === 'error') {
      return true;
    }
    return this.logLevels.length > 0 && this.logLevels.includes(level);
  }

  async fetchHtml(url: string, useProxy?: boolean | string): Promise<string> {
    const userAgent = this.userAgentGenerator.random().toString();

    if (this.shouldLog('debug')) {
      this.logger.debug(`Fetching ${url} with User-Agent: ${userAgent}`);
    }

    const config: Record<string, unknown> = {
      headers: {
        'User-Agent': userAgent,
      },
    };

    const agents = proxyAgents(useProxy);
    if (agents) {
      if (this.shouldLog('debug')) {
        this.logger.debug(`Using proxy: ${agents.proxyUrl}`);
      }
      config.httpAgent = agents.httpAgent;
      config.httpsAgent = agents.httpsAgent;
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

            const delayMs = backoffMs(retryIndex - 1);
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

  async fetchHtmlCycleTLS(
    url: string,
    useProxy: boolean | string | undefined,
    fingerprint: string | TlsFingerprint | undefined,
    timeout: number | undefined,
  ): Promise<string> {
    return this.getCycleFetcher().fetch(url, {
      useProxy,
      fingerprint,
      timeout,
      maxRetries: this.maxRetries,
      fallbackUserAgent: this.userAgentGenerator.random().toString(),
    });
  }

  async checkUrlAlive(
    urls: string | string[],
    useProxy?: boolean | string,
  ): Promise<UrlHealthCheckResult[]> {
    const urlArray = Array.isArray(urls) ? urls : [urls];
    const engine = this.resolveEngine(undefined, this.defaultFingerprint);

    return Promise.all(
      urlArray.map((url) =>
        engine === HttpEngine.CYCLETLS
          ? this.checkUrlAliveCycleTLS(url, useProxy)
          : this.checkUrlAliveAxios(url, useProxy),
      ),
    );
  }

  private async checkUrlAliveAxios(
    url: string,
    useProxy?: boolean | string,
  ): Promise<UrlHealthCheckResult> {
    try {
      const config: Record<string, unknown> = {
        method: 'HEAD',
        validateStatus: () => true,
      };

      const agents = proxyAgents(useProxy);
      if (agents) {
        config.httpAgent = agents.httpAgent;
        config.httpsAgent = agents.httpsAgent;
      }

      const response = await firstValueFrom(
        this.httpService.request({ ...config, url }),
      );

      const statusCode = response.status;
      return {
        url,
        alive: statusCode >= 200 && statusCode < 400,
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
  }

  private async checkUrlAliveCycleTLS(
    url: string,
    useProxy?: boolean | string,
  ): Promise<UrlHealthCheckResult> {
    try {
      const statusCode = await this.getCycleFetcher().checkStatus(url, {
        useProxy,
        fingerprint: this.defaultFingerprint,
        timeout: this.requestTimeout,
        fallbackUserAgent: this.userAgentGenerator.random().toString(),
      });
      return {
        url,
        alive: statusCode >= 200 && statusCode < 400,
        statusCode,
      };
    } catch (error) {
      return {
        url,
        alive: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  resolveEngine(
    perCall: HttpEngine | undefined,
    fingerprint: string | TlsFingerprint | undefined,
  ): HttpEngine {
    return (
      perCall ??
      this.httpEngine ??
      (fingerprint ? HttpEngine.CYCLETLS : HttpEngine.AXIOS)
    );
  }

  private getCycleFetcher(): CycleTLSFetcher {
    if (!this.cycleFetcher) {
      this.cycleFetcher = new CycleTLSFetcher(this.logger, (level) =>
        this.shouldLog(level),
      );
    }
    return this.cycleFetcher;
  }

  async exit(): Promise<void> {
    if (this.cycleFetcher) {
      await this.cycleFetcher.exit();
    }
  }
}
