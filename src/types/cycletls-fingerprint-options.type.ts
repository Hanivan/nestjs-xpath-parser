/** TLS/fingerprint options understood by a CycleTLS request. */
export interface CycleTLSFingerprintOptions {
  ja3?: string;
  ja4r?: string;
  http2Fingerprint?: string;
  userAgent?: string;
}
