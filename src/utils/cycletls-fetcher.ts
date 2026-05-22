import { Logger, LogLevel } from '@nestjs/common';
import initCycleTLS, { CycleTLSClient } from 'cycletls';
import { TlsFingerprint } from '../types/tls-fingerprint.type';
import { backoffMs } from './backoff';
import { loadFingerprint, toCycleTLSOptions } from './fingerprint';
import { resolveProxyUrl } from './proxy';

export interface CycleTLSRequestParams {
  useProxy?: boolean | string;
  fingerprint?: string | TlsFingerprint;
  /** Per-request timeout in seconds. */
  timeout?: number;
  /** User-Agent to use when the fingerprint supplies none. */
  fallbackUserAgent: string;
}

export interface CycleTLSFetchParams extends CycleTLSRequestParams {
  maxRetries: number;
}

/**
 * Owns the CycleTLS Go-process client lifecycle and performs fingerprint-aware
 * fetches with retry/backoff. The transport lives here so the scraper service
 * stays an orchestrator.
 */
export class CycleTLSFetcher {
  private client?: Promise<CycleTLSClient>;

  constructor(
    private readonly logger: Logger,
    private readonly shouldLog: (level: LogLevel) => boolean,
  ) {}

  /** Lazily create and memoize the shared client; never cache a rejected init. */
  private getClient(): Promise<CycleTLSClient> {
    if (!this.client) {
      this.client = initCycleTLS().catch((error: unknown) => {
        this.client = undefined;
        throw error;
      });
    }
    return this.client;
  }

  /** Resolve a fingerprint + proxy + timeout into CycleTLS request options. */
  private async buildRequestOptions(
    url: string,
    params: CycleTLSRequestParams,
    verb: string,
  ): Promise<Record<string, unknown>> {
    const fpOptions = params.fingerprint
      ? toCycleTLSOptions(await loadFingerprint(params.fingerprint))
      : {};
    const userAgent = fpOptions.userAgent ?? params.fallbackUserAgent;
    const proxy = resolveProxyUrl(params.useProxy);

    if (this.shouldLog('debug')) {
      this.logger.debug(
        `${verb} ${url} via CycleTLS (User-Agent: ${userAgent}` +
          `${fpOptions.ja3 ? `, ja3 set` : ''}` +
          `${proxy ? `, proxy: ${proxy}` : ''})`,
      );
    }

    return {
      ...fpOptions,
      userAgent,
      ...(proxy ? { proxy } : {}),
      ...(params.timeout ? { timeout: params.timeout } : {}),
    };
  }

  /** HEAD a URL and return its status code (single attempt, no retry). */
  async checkStatus(
    url: string,
    params: CycleTLSRequestParams,
  ): Promise<number> {
    const requestOptions = await this.buildRequestOptions(url, params, 'HEAD');
    const client = await this.getClient();
    const response = await client.head(url, requestOptions);
    return response.status;
  }

  async fetch(url: string, params: CycleTLSFetchParams): Promise<string> {
    const requestOptions = await this.buildRequestOptions(url, params, 'GET');
    const client = await this.getClient();

    let lastError: Error | undefined;
    for (let attempt = 0; attempt <= params.maxRetries; attempt++) {
      // Retryable until proven otherwise (network errors stay retryable).
      let retryable = true;
      try {
        const response = await client.get(url, requestOptions);
        if (response.status >= 400) {
          // 4xx is a client error — not retryable. 5xx may be transient.
          retryable = response.status >= 500;
          throw new Error(
            `CycleTLS request to ${url} failed with status ${response.status}`,
          );
        }
        return typeof response.data === 'string'
          ? response.data
          : await response.text();
      } catch (error) {
        lastError = error as Error;
        if (!retryable) {
          if (this.shouldLog('error')) {
            this.logger.error(
              `Non-retryable error fetching ${url} via CycleTLS: ${lastError.message}`,
            );
          }
          break;
        }
        if (attempt === params.maxRetries) {
          break;
        }
        const delayMs = backoffMs(attempt);
        if (this.shouldLog('warn')) {
          this.logger.warn(
            `Retry ${attempt + 1}/${params.maxRetries} for ${url} after ${delayMs}ms (error: ${lastError.message})`,
          );
        }
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }

    const finalError =
      lastError ?? new Error(`Failed to fetch URL via CycleTLS: ${url}`);
    if (this.shouldLog('error')) {
      this.logger.error(
        `Failed to fetch URL via CycleTLS after ${params.maxRetries} retries: ${url}`,
        finalError,
      );
    }
    throw finalError;
  }

  /** Release the underlying Go process. Safe to call when init never succeeded. */
  async exit(): Promise<void> {
    if (!this.client) {
      return;
    }
    try {
      const client = await this.client;
      await client.exit();
    } catch (error) {
      if (this.shouldLog('warn')) {
        this.logger.warn(
          `CycleTLS client shutdown skipped (init never succeeded): ${(error as Error).message}`,
        );
      }
    }
  }
}
