import { readFile } from 'fs/promises';
import { TlsFingerprint } from '../types/tls-fingerprint.type';

/** TLS/fingerprint options understood by a CycleTLS request. */
export interface CycleTLSFingerprintOptions {
  ja3?: string;
  ja4r?: string;
  http2Fingerprint?: string;
  userAgent?: string;
}

/**
 * Resolve a fingerprint source into a {@link TlsFingerprint}. A string is
 * treated as a path to a JSON file saved by nestjs-browser-action's
 * `captureTlsFingerprint`; an object is returned as-is.
 */
export async function loadFingerprint(
  src: string | TlsFingerprint,
): Promise<TlsFingerprint> {
  if (typeof src !== 'string') {
    return src;
  }

  let contents: string;
  try {
    contents = await readFile(src, 'utf-8');
  } catch (error) {
    throw new Error(
      `Failed to read TLS fingerprint file "${src}": ${(error as Error).message}`,
    );
  }

  try {
    return JSON.parse(contents) as TlsFingerprint;
  } catch (error) {
    throw new Error(
      `Failed to parse TLS fingerprint file "${src}": ${(error as Error).message}`,
    );
  }
}

/**
 * Map a {@link TlsFingerprint} to CycleTLS request options. Note `ja4r`
 * expects the raw JA4 (JA4R), so it is sourced from `ja4_r` (not the `ja4`
 * hash). Empty/missing values are omitted.
 */
export function toCycleTLSOptions(
  fp: TlsFingerprint,
): CycleTLSFingerprintOptions {
  const options: CycleTLSFingerprintOptions = {};
  if (fp.ja3) options.ja3 = fp.ja3;
  if (fp.ja4_r) options.ja4r = fp.ja4_r;
  if (fp.akamaiFingerprint) options.http2Fingerprint = fp.akamaiFingerprint;
  if (fp.userAgent) options.userAgent = fp.userAgent;
  return options;
}
