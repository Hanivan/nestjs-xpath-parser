import { mkdtemp, rm, writeFile } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import { loadFingerprint, toCycleTLSOptions } from './fingerprint';
import { TlsFingerprint } from '../types/tls-fingerprint.type';

const sample: TlsFingerprint = {
  capturedAt: '2026-05-22T00:00:00.000Z',
  ip: '203.0.113.5:54321',
  httpVersion: 'h2',
  method: 'GET',
  userAgent: 'Mozilla/5.0 (X11; Linux x86_64) Chrome/120',
  ja3: '771,4865-4866,0-23,29-23,0',
  ja3Hash: 'cd08e31494f9531f560d64c695473da9',
  ja4: 't13d1516h2_8daaf6152771_e5627efa2ab1',
  ja4_r: 't13d1516h2_8daaf6152771_b186095e22b6',
  peetprint: 'GREASE-772-771|2-1.1|GREASE-4865-4866',
  peetprintHash: '7c7c7c7c7c7c7c7c',
  ciphers: ['TLS_AES_128_GCM_SHA256', 'TLS_AES_256_GCM_SHA384'],
  tlsExtensions: ['server_name', 'supported_groups'],
  akamaiFingerprint: '1:65536;2:0;4:6291456|15663105|0|m,a,s,p',
  akamaiFingerprintHash: '52d84b11737d980aef856699f885ca86',
  headers: [':method: GET', ':authority: tls.peet.ws'],
  raw: { source: 'tls.peet.ws' },
};

describe('loadFingerprint', () => {
  it('returns the object as-is when given an object', async () => {
    await expect(loadFingerprint(sample)).resolves.toBe(sample);
  });

  it('reads and parses a fingerprint JSON file path', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'fp-'));
    const path = join(dir, 'fp.json');
    await writeFile(path, JSON.stringify(sample), 'utf-8');
    try {
      await expect(loadFingerprint(path)).resolves.toEqual(sample);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it('throws a descriptive error for a missing file', async () => {
    await expect(loadFingerprint('/no/such/fingerprint.json')).rejects.toThrow(
      /Failed to read TLS fingerprint file/,
    );
  });

  it('throws a descriptive error for invalid JSON', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'fp-'));
    const path = join(dir, 'bad.json');
    await writeFile(path, 'not json', 'utf-8');
    try {
      await expect(loadFingerprint(path)).rejects.toThrow(
        /Failed to parse TLS fingerprint file/,
      );
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });
});

describe('toCycleTLSOptions', () => {
  it('maps fingerprint fields to CycleTLS request options', () => {
    expect(toCycleTLSOptions(sample)).toEqual({
      ja3: sample.ja3,
      ja4r: sample.ja4_r,
      http2Fingerprint: sample.akamaiFingerprint,
      userAgent: sample.userAgent,
    });
  });

  it('omits empty or missing values', () => {
    const empty: TlsFingerprint = {
      ...sample,
      userAgent: '',
      ja3: '',
      ja4_r: undefined,
      akamaiFingerprint: '',
    };
    expect(toCycleTLSOptions(empty)).toEqual({});
  });
});
