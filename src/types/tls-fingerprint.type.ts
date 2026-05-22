/**
 * TLS/HTTP fingerprint produced by
 * `@hanivanrizky/nestjs-browser-action`'s `captureTlsFingerprint(path)`.
 *
 * Mirrors the full saved JSON shape. The CycleTLS fetch engine only consumes a
 * subset (`ja3`, `ja4_r`, `akamaiFingerprint`, `userAgent`); the remaining
 * fields are preserved for inspection and forward compatibility.
 */
export interface TlsFingerprint {
  /** ISO timestamp of when the capture ran. */
  capturedAt: string;
  /** Source IP:port as seen by the endpoint. */
  ip: string;
  /** Negotiated HTTP version, e.g. 'h2'. */
  httpVersion: string;
  /** HTTP method of the capture request. */
  method: string;
  /** User-Agent the capturing browser sent. */
  userAgent: string;
  /** JA3 fingerprint string. */
  ja3: string;
  /** JA3 MD5 hash. */
  ja3Hash: string;
  /** JA4 fingerprint string. */
  ja4: string;
  /** JA4_r (raw) fingerprint string, mapped to CycleTLS `ja4r`. */
  ja4_r?: string;
  /** peetprint fingerprint string. */
  peetprint: string;
  /** peetprint hash. */
  peetprintHash: string;
  /** Offered TLS cipher suites. */
  ciphers: string[];
  /** TLS extension names, in offered order. */
  tlsExtensions: string[];
  /** HTTP/2 Akamai fingerprint string, mapped to CycleTLS `http2Fingerprint`. */
  akamaiFingerprint: string;
  /** HTTP/2 Akamai fingerprint hash. */
  akamaiFingerprintHash: string;
  /** Request pseudo/normal headers from the HTTP/2 HEADERS frame. */
  headers: string[];
  /** Full unmodified upstream response. */
  raw: Record<string, unknown>;
}
