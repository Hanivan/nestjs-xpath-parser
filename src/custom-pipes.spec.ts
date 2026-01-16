import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { ScraperHtmlService } from './scraper-html.service';
import { PatternField, PipeTransform, PIPE_REGISTRY } from './types';

// Mock JSDOM to avoid ESM issues in Jest
jest.mock('jsdom', () => ({
  JSDOM: jest.fn(),
}));

/** Test pipe that reverses a string */
class ReversePipe extends PipeTransform<string, string> {
  readonly type = 'reverse' as const;

  exec(value: string): string {
    return value.split('').reverse().join('');
  }
}

PIPE_REGISTRY['reverse'] = ReversePipe;

describe('Custom Pipes (unit)', () => {
  let scraperService: ScraperHtmlService;

  const mockHttpService = {
    get: jest.fn(),
    request: jest.fn(),
  } as const;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      providers: [
        ScraperHtmlService,
        {
          provide: HttpService,
          useValue: mockHttpService,
        },
      ],
    }).compile();

    scraperService = moduleFixture.get<ScraperHtmlService>(ScraperHtmlService);
  });

  describe('Predefined Pipes', () => {
    it('should apply RegexPipe with plain config', async () => {
      const html = `
        <html>
          <body>
            <h1>Judul : Test Title</h1>
          </body>
        </html>
      `;

      const patterns: PatternField[] = [
        {
          key: 'title',
          patternType: 'xpath',
          returnType: 'text',
          patterns: ['.//h1/text()'],
          pipes: {
            custom: [
              {
                type: 'regex',
                rules: [{ pattern: '^Judul : ', replacement: '' }],
              },
            ],
          },
        },
      ];

      const result = await scraperService.evaluateWebsite({ html, patterns });

      expect(result.results[0].title).toBe('Test Title');
    });

    it('should apply NumberNormalizePipe', async () => {
      const html = `
        <html>
          <body>
            <span class="views">1.5K</span>
          </body>
        </html>
      `;

      const patterns: PatternField[] = [
        {
          key: 'views',
          patternType: 'xpath',
          returnType: 'text',
          patterns: ['.//span[@class="views"]/text()'],
          pipes: {
            custom: [{ type: 'num-normalize' }],
          },
        },
      ];

      const result = await scraperService.evaluateWebsite({ html, patterns });

      expect(result.results[0].views).toBe('1500');
    });

    it('should apply ExtractEmailPipe', async () => {
      const html = `
        <html>
          <body>
            <p>Contact us at support@example.com for help</p>
          </body>
        </html>
      `;

      const patterns: PatternField[] = [
        {
          key: 'email',
          patternType: 'xpath',
          returnType: 'text',
          patterns: ['.//p/text()'],
          pipes: {
            custom: [{ type: 'extract-email' }],
          },
        },
      ];

      const result = await scraperService.evaluateWebsite({ html, patterns });

      expect(result.results[0].email).toBe('support@example.com');
    });
  });

  describe('ParseAsURLPipe with automatic baseUrl', () => {
    it('should resolve relative URLs using baseUrl from fetched URL', async () => {
      const html = `
        <html>
          <body>
            <a href="/page/detail">Link</a>
          </body>
        </html>
      `;

      const patterns: PatternField[] = [
        {
          key: 'link',
          patternType: 'xpath',
          returnType: 'text',
          patterns: ['.//a/@href'],
          pipes: {
            custom: [{ type: 'parse-as-url' }],
          },
        },
      ];

      const result = await scraperService.evaluateWebsite({
        url: 'https://example.com/path/to/page',
        html,
        patterns,
      });

      expect(result.results[0].link).toBe('https://example.com/page/detail');
    });

    it('should keep absolute URLs unchanged', async () => {
      const html = `
        <html>
          <body>
            <a href="https://other.com/page">External Link</a>
          </body>
        </html>
      `;

      const patterns: PatternField[] = [
        {
          key: 'link',
          patternType: 'xpath',
          returnType: 'text',
          patterns: ['.//a/@href'],
          pipes: {
            custom: [{ type: 'parse-as-url' }],
          },
        },
      ];

      const result = await scraperService.evaluateWebsite({
        url: 'https://example.com/path',
        html,
        patterns,
      });

      expect(result.results[0].link).toBe('https://other.com/page');
    });
  });

  describe('Custom Pipe Registration', () => {
    it('should apply registered custom pipe', async () => {
      const html = `
        <html>
          <body>
            <h1>Hello</h1>
          </body>
        </html>
      `;

      const patterns: PatternField[] = [
        {
          key: 'reversed',
          patternType: 'xpath',
          returnType: 'text',
          patterns: ['.//h1/text()'],
          pipes: {
            custom: [{ type: 'reverse' }],
          },
        },
      ];

      const result = await scraperService.evaluateWebsite({ html, patterns });

      expect(result.results[0].reversed).toBe('olleH');
    });
  });

  describe('Pipe Chaining', () => {
    it('should chain multiple pipes in sequence', async () => {
      const html = `
        <html>
          <body>
            <span class="price">  $25.5K  </span>
          </body>
        </html>
      `;

      const patterns: PatternField[] = [
        {
          key: 'price',
          patternType: 'xpath',
          returnType: 'text',
          patterns: ['.//span[@class="price"]/text()'],
          pipes: {
            trim: true,
            custom: [
              { type: 'regex', rules: [{ pattern: '^\\$', replacement: '' }] },
              { type: 'num-normalize' },
            ],
          },
        },
      ];

      const result = await scraperService.evaluateWebsite({ html, patterns });

      expect(result.results[0].price).toBe('25500');
    });
  });

  describe('Merge with Custom Pipes', () => {
    it('should merge multiple values before applying custom pipe', async () => {
      const html = `
        <html>
          <body>
            <p>Judul : Test Title Here</p>
          </body>
        </html>
      `;

      const patterns: PatternField[] = [
        {
          key: 'title',
          patternType: 'xpath',
          returnType: 'text',
          patterns: ['.//p//text()'],
          meta: { multiple: true },
          pipes: {
            merge: true,
            custom: [
              {
                type: 'regex',
                rules: [{ pattern: '^Judul : ', replacement: '' }],
              },
            ],
          },
        },
      ];

      const result = await scraperService.evaluateWebsite({ html, patterns });

      expect(result.results[0].title).toBe('Test Title Here');
    });
  });

  describe('Custom Pipe with baseUrl Property', () => {
    it('should automatically set baseUrl for custom pipe with baseUrl property', async () => {
      // Custom pipe with baseUrl support
      class CustomUrlPipe extends PipeTransform<string, string> {
        readonly type = 'custom-url' as const;
        baseUrl?: string;

        exec(value: string): string {
          if (!value || value.startsWith('http')) {
            return value;
          }
          if (this.baseUrl) {
            return new URL(value, this.baseUrl).toString();
          }
          return value;
        }
      }

      PIPE_REGISTRY['custom-url'] = CustomUrlPipe;

      const html = `
        <html>
          <body>
            <a href="/page">Link</a>
          </body>
        </html>
      `;

      const patterns: PatternField[] = [
        {
          key: 'link',
          patternType: 'xpath',
          returnType: 'text',
          patterns: ['.//a/@href'],
          pipes: {
            custom: [{ type: 'custom-url' }],
          },
        },
      ];

      const result = await scraperService.evaluateWebsite({
        url: 'https://example.com/test/page',
        html,
        patterns,
      });

      expect(result.results[0].link).toBe('https://example.com/page');
    });
  });
});
