import { LogLevel } from '@nestjs/common';
import { HttpEngine } from '../enums/http-engine.enum';
import { ParserEngine } from '../enums/parser-engine.enum';
import { TlsFingerprint } from './tls-fingerprint.type';

export interface ScraperHtmlModuleOptions {
  maxRetries?: number;
  logLevel?: LogLevel | LogLevel[];
  suppressXpathErrors?: boolean;
  /** HTML/XML parser engine. Defaults to `'libxmljs'`. */
  parserEngine?: ParserEngine;
  /**
   * @deprecated Use {@link parserEngine}. Retained for backward compatibility;
   * `parserEngine` takes precedence when both are set.
   */
  engine?: ParserEngine;
  /**
   * HTTP fetch engine. `'axios'` (default) uses @nestjs/axios. `'cycletls'`
   * routes requests through CycleTLS to spoof a TLS/HTTP fingerprint.
   * When omitted, supplying `fingerprint` implies `'cycletls'`.
   */
  httpEngine?: HttpEngine;
  /**
   * Default TLS fingerprint for the CycleTLS engine. Either a path to a JSON
   * file saved by nestjs-browser-action's `captureTlsFingerprint`, or an
   * already-loaded {@link TlsFingerprint} object. Overridable per call.
   */
  fingerprint?: string | TlsFingerprint;
  /**
   * Default request timeout in seconds for the CycleTLS engine. Overridable per
   * call via {@link EvaluateOptions.timeout}. Ignored by the axios engine.
   */
  timeout?: number;
  /**
   * When true, collapses double-tabs, tab-newlines, and double-newlines
   * before handing HTML to the parser. Useful for malformed HTML from forums.
   * Defaults to false.
   */
  normalizeHtml?: boolean;
}
