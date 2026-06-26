import { existsSync } from 'fs';
import { HttpService } from '@nestjs/axios';
import { ScraperHtmlService } from '../scraper-html.service';
import { HttpEngine } from '../enums/http-engine.enum';
import { TlsFingerprint } from '../types/tls-fingerprint.type';
import { PatternField } from '../types/pattern-field.type';

/**
 * Example 10: CycleTLS Fingerprint Fetching
 *
 * This example demonstrates how to:
 * - Fetch HTML through CycleTLS to spoof a real browser TLS/HTTP fingerprint
 * - Load a fingerprint saved by nestjs-browser-action's captureTlsFingerprint
 * - Supply the fingerprint as a file path or as an object
 * - Override the engine/fingerprint per call
 *
 * The fingerprint JSON is produced elsewhere, e.g.:
 *   await browserAction.captureTlsFingerprint('./fingerprint.json');
 */

async function demonstrateCycleTLSFingerprint() {
  console.log('─'.repeat(80));
  console.log('(>_<) Example 10: CycleTLS Fingerprint Fetching');
  console.log('─'.repeat(80));
  console.log('');

  const httpService = new HttpService();

  // Option A: configure a default fingerprint by file path at module level.
  // Supplying a fingerprint implies httpEngine: 'cycletls'.
  const scraperFromFile = new ScraperHtmlService(httpService, {
    fingerprint: './fingerprint.json',
  });

  // Option B: pass an already-loaded fingerprint object (the full shape saved
  // by captureTlsFingerprint). Only ja3/ja4_r/akamaiFingerprint/userAgent are
  // consumed by CycleTLS; the rest are kept for inspection.
  const fingerprint: TlsFingerprint = {
    capturedAt: new Date().toISOString(),
    ip: '203.0.113.5:54321',
    httpVersion: 'h2',
    method: 'GET',
    userAgent:
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36',
    ja3: '771,4865-4866-4867-49195-49199,0-23-65281-10-11-35,29-23-24,0',
    ja3Hash: 'cd08e31494f9531f560d64c695473da9',
    ja4: 't13d1516h2_8daaf6152771_e5627efa2ab1',
    ja4_r: 't13d1516h2_8daaf6152771_b186095e22b6',
    peetprint: 'GREASE-772-771|2-1.1|GREASE-4865-4866',
    peetprintHash: '7c7c7c7c7c7c7c7c',
    ciphers: ['TLS_AES_128_GCM_SHA256', 'TLS_AES_256_GCM_SHA384'],
    tlsExtensions: ['server_name', 'supported_groups'],
    akamaiFingerprint: '1:65536;2:0;4:6291456;6:262144|15663105|0|m,a,s,p',
    akamaiFingerprintHash: '52d84b11737d980aef856699f885ca86',
    headers: [':method: GET', ':authority: tls.peet.ws'],
    raw: {},
  };

  const scraper = new ScraperHtmlService(httpService, {
    httpEngine: HttpEngine.CYCLETLS,
    fingerprint,
  });

  const patterns: PatternField[] = [
    {
      key: 'ja3',
      patternType: 'xpath',
      returnType: 'text',
      patterns: ['//body'],
    },
  ];

  try {
    const { results } = await scraper.evaluateWebsite({
      url: 'https://tls.peet.ws/api/clean',
      patterns,
    });
    console.log('Result (object fingerprint):', results);

    // Per-call override: only run if the fingerprint file exists.
    if (existsSync('./fingerprint.json')) {
      const { results: overridden } = await scraperFromFile.evaluateWebsite({
        url: 'https://tls.peet.ws/api/clean',
        patterns,
        httpEngine: HttpEngine.CYCLETLS,
        fingerprint: './fingerprint.json',
      });
      console.log('Result (file fingerprint):', overridden);
    } else {
      console.log(
        '(i) Skipping file fingerprint demo — fingerprint.json not found.',
      );
    }
  } finally {
    // Releases the underlying CycleTLS Go process.
    await scraper.onModuleDestroy();
    await scraperFromFile.onModuleDestroy();
  }
}

if (require.main === module) {
  demonstrateCycleTLSFingerprint()
    .then(() => console.log('\n\\(^o^)/ CycleTLS fingerprint demo completed!'))
    .catch((error) => {
      console.error(
        '\n(x_x) Error during demo:',
        error instanceof Error ? error.message : String(error),
      );
      process.exit(1);
    });
}

export { demonstrateCycleTLSFingerprint };
