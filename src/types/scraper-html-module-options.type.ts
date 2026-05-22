import { LogLevel } from '@nestjs/common';
import { HttpEngine } from '../enums/http-engine.enum';
import { TlsFingerprint } from './tls-fingerprint.type';

export interface ScraperHtmlModuleOptions {
  maxRetries?: number;
  logLevel?: LogLevel | LogLevel[];
  suppressXpathErrors?: boolean;
  engine?: 'libxmljs' | 'jsdom';
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
}
