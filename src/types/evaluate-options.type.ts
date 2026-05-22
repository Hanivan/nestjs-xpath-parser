import { HttpEngine } from '../enums/http-engine.enum';
import { PatternField } from './pattern-field.type';
import { TlsFingerprint } from './tls-fingerprint.type';

export interface EvaluateOptions {
  url?: string;
  html?: string;
  patterns: PatternField[];
  useProxy?: boolean | string;
  contentType?: 'text/html' | 'text/xml';
  /** Override the module-level HTTP fetch engine for this call. */
  httpEngine?: HttpEngine;
  /**
   * Override the module-level TLS fingerprint for this call. Path to a saved
   * fingerprint JSON, or an already-loaded {@link TlsFingerprint} object.
   */
  fingerprint?: string | TlsFingerprint;
  /**
   * Per-request timeout in seconds for the CycleTLS engine. Overrides the
   * module-level `timeout`. Ignored by the axios engine.
   */
  timeout?: number;
}
