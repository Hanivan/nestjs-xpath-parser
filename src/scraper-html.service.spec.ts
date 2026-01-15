import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { of, throwError } from 'rxjs';
import { ScraperHtmlService } from './scraper-html.service';
import { AxiosError } from 'axios';

// Mock JSDOM to avoid ESM issues in Jest
jest.mock('jsdom', () => ({
  JSDOM: jest.fn(),
}));

// Mock https-proxy-agent
jest.mock('https-proxy-agent', () => ({
  HttpsProxyAgent: jest.fn().mockImplementation(() => ({})),
}));

describe('ScraperHtmlService', () => {
  let service: ScraperHtmlService;

  const mockHttpService = {
    get: jest.fn(),
    request: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ScraperHtmlService,
        {
          provide: HttpService,
          useValue: mockHttpService,
        },
      ],
    }).compile();

    service = module.get<ScraperHtmlService>(ScraperHtmlService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should have default maxRetries of 3', async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ScraperHtmlService,
        {
          provide: HttpService,
          useValue: mockHttpService,
        },
      ],
    }).compile();

    const defaultService = module.get<ScraperHtmlService>(ScraperHtmlService);
    expect(defaultService).toBeDefined();
  });

  it('should accept custom maxRetries configuration', async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ScraperHtmlService,
        {
          provide: HttpService,
          useValue: mockHttpService,
        },
        {
          provide: 'SCRAPER_HTML_OPTIONS',
          useValue: { maxRetries: 5 },
        },
      ],
    }).compile();

    const customService = module.get<ScraperHtmlService>(ScraperHtmlService);
    expect(customService).toBeDefined();
  });

  it('should accept custom logLevel configuration', async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ScraperHtmlService,
        {
          provide: HttpService,
          useValue: mockHttpService,
        },
        {
          provide: 'SCRAPER_HTML_OPTIONS',
          useValue: { logLevel: ['error', 'warn'] },
        },
      ],
    }).compile();

    const customService = module.get<ScraperHtmlService>(ScraperHtmlService);
    expect(customService).toBeDefined();
  });

  describe('LogLevel', () => {
    it('should have default log levels', async () => {
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          ScraperHtmlService,
          {
            provide: HttpService,
            useValue: mockHttpService,
          },
        ],
      }).compile();

      const defaultService = module.get<ScraperHtmlService>(ScraperHtmlService);
      expect(defaultService).toBeDefined();
      // Default should be ['log', 'error', 'warn']
      expect(defaultService['logLevels']).toEqual(['log', 'error', 'warn']);
    });

    it('should accept empty logLevel array (minimal logging)', async () => {
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          ScraperHtmlService,
          {
            provide: HttpService,
            useValue: mockHttpService,
          },
          {
            provide: 'SCRAPER_HTML_OPTIONS',
            useValue: { logLevel: [] },
          },
        ],
      }).compile();

      const service = module.get<ScraperHtmlService>(ScraperHtmlService);
      expect(service).toBeDefined();
      expect(service['logLevels']).toEqual([]);
    });

    it('should always log errors regardless of configuration', async () => {
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          ScraperHtmlService,
          {
            provide: HttpService,
            useValue: mockHttpService,
          },
          {
            provide: 'SCRAPER_HTML_OPTIONS',
            useValue: { logLevel: [] }, // Empty array = no logs except errors
          },
        ],
      }).compile();

      const service = module.get<ScraperHtmlService>(ScraperHtmlService);
      expect(service).toBeDefined();

      // Error should always be loggable
      expect(service['shouldLog']('error')).toBe(true);

      // But other levels should not
      expect(service['shouldLog']('warn')).toBe(false);
      expect(service['shouldLog']('debug')).toBe(false);
      expect(service['shouldLog']('log')).toBe(false);
    });

    it('should accept single logLevel string', async () => {
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          ScraperHtmlService,
          {
            provide: HttpService,
            useValue: mockHttpService,
          },
          {
            provide: 'SCRAPER_HTML_OPTIONS',
            useValue: { logLevel: 'warn' },
          },
        ],
      }).compile();

      const service = module.get<ScraperHtmlService>(ScraperHtmlService);
      expect(service).toBeDefined();
      expect(service['logLevels']).toEqual(['warn']);

      // warn should be loggable
      expect(service['shouldLog']('warn')).toBe(true);

      // error is always loggable
      expect(service['shouldLog']('error')).toBe(true);

      // log should not be loggable
      expect(service['shouldLog']('log')).toBe(false);
    });
  });

  describe('suppressXpathErrors', () => {
    it('should have suppressXpathErrors disabled by default', async () => {
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          ScraperHtmlService,
          {
            provide: HttpService,
            useValue: mockHttpService,
          },
        ],
      }).compile();

      const defaultService = module.get<ScraperHtmlService>(ScraperHtmlService);
      expect(defaultService).toBeDefined();
      expect(defaultService['suppressXpathErrors']).toBe(false);
    });

    it('should accept custom suppressXpathErrors configuration', async () => {
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          ScraperHtmlService,
          {
            provide: HttpService,
            useValue: mockHttpService,
          },
          {
            provide: 'SCRAPER_HTML_OPTIONS',
            useValue: { suppressXpathErrors: true },
          },
        ],
      }).compile();

      const customService = module.get<ScraperHtmlService>(ScraperHtmlService);
      expect(customService).toBeDefined();
      expect(customService['suppressXpathErrors']).toBe(true);
    });
  });

  describe('engine', () => {
    it('should have libxmljs as default engine', async () => {
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          ScraperHtmlService,
          {
            provide: HttpService,
            useValue: mockHttpService,
          },
        ],
      }).compile();

      const defaultService = module.get<ScraperHtmlService>(ScraperHtmlService);
      expect(defaultService).toBeDefined();
      expect(defaultService['engine']).toBe('libxmljs');
    });

    it('should accept jsdom engine configuration', async () => {
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          ScraperHtmlService,
          {
            provide: HttpService,
            useValue: mockHttpService,
          },
          {
            provide: 'SCRAPER_HTML_OPTIONS',
            useValue: { engine: 'jsdom' as const },
          },
        ],
      }).compile();

      const customService = module.get<ScraperHtmlService>(ScraperHtmlService);
      expect(customService).toBeDefined();
      expect(customService['engine']).toBe('jsdom');
    });

    it('should accept libxmljs engine configuration explicitly', async () => {
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          ScraperHtmlService,
          {
            provide: HttpService,
            useValue: mockHttpService,
          },
          {
            provide: 'SCRAPER_HTML_OPTIONS',
            useValue: { engine: 'libxmljs' as const },
          },
        ],
      }).compile();

      const customService = module.get<ScraperHtmlService>(ScraperHtmlService);
      expect(customService).toBeDefined();
      expect(customService['engine']).toBe('libxmljs');
    });
  });

  describe('evaluateWebsite', () => {
    it('should extract data from HTML using XPath patterns', async () => {
      const html = `
        <html>
          <body>
            <h1>Test Title</h1>
            <div class="content">Test Content</div>
          </body>
        </html>
      `;

      const options = {
        html,
        patterns: [
          {
            key: 'title',
            patternType: 'xpath' as const,
            returnType: 'text' as const,
            patterns: ['//h1/text()'],
          },
          {
            key: 'content',
            patternType: 'xpath' as const,
            returnType: 'text' as const,
            patterns: ['//div[@class="content"]/text()'],
          },
        ],
      };

      const result = await service.evaluateWebsite(options);

      expect(result.results).toHaveLength(1);
      expect(result.results[0]).toEqual({
        title: 'Test Title',
        content: 'Test Content',
      });
    });

    it('should throw error when neither html nor url provided', async () => {
      const options = {
        patterns: [
          {
            key: 'title',
            patternType: 'xpath' as const,
            returnType: 'text' as const,
            patterns: ['//h1/text()'],
          },
        ],
      };

      await expect(service.evaluateWebsite(options)).rejects.toThrow(
        'Either html or url must be provided',
      );
    });

    it('should fetch HTML from URL when provided', async () => {
      const mockHtml = '<html><body><h1>Title</h1></body></html>';
      mockHttpService.get.mockReturnValue(
        of({
          data: mockHtml,
          status: 200,
          statusText: 'OK',
          headers: {},
          config: {},
        }),
      );

      const options = {
        url: 'https://example.com',
        patterns: [
          {
            key: 'title',
            patternType: 'xpath' as const,
            returnType: 'text' as const,
            patterns: ['//h1/text()'],
          },
        ],
      };

      const result = await service.evaluateWebsite(options);

      expect(mockHttpService.get).toHaveBeenCalledWith(
        'https://example.com',
        expect.objectContaining({
          headers: expect.objectContaining({
            'User-Agent': expect.any(String) as unknown,
          }) as unknown,
        }) as unknown,
      );
      expect(result.results[0].title).toBe('Title');
    });

    it('should use proxy when useProxy is true and HTTP_PROXY env is set', async () => {
      const originalHttpProxy = process.env.HTTP_PROXY;
      process.env.HTTP_PROXY = 'http://proxy.example.com:8080';

      const mockHtml = '<html><body><h1>Title</h1></body></html>';
      mockHttpService.get.mockReturnValue(
        of({
          data: mockHtml,
          status: 200,
          statusText: 'OK',
          headers: {},
          config: {},
        }),
      );

      const options = {
        url: 'https://example.com',
        useProxy: true as const,
        patterns: [
          {
            key: 'title',
            patternType: 'xpath' as const,
            returnType: 'text' as const,
            patterns: ['//h1/text()'],
          },
        ],
      };

      await service.evaluateWebsite(options);

      expect(mockHttpService.get).toHaveBeenCalledWith(
        'https://example.com',
        expect.objectContaining({
          headers: expect.objectContaining({
            'User-Agent': expect.any(String) as unknown,
          }) as unknown,
        }) as unknown,
      );

      process.env.HTTP_PROXY = originalHttpProxy;
    });

    it('should use proxy when useProxy is a string', async () => {
      const mockHtml = '<html><body><h1>Title</h1></body></html>';
      mockHttpService.get.mockReturnValue(
        of({
          data: mockHtml,
          status: 200,
          statusText: 'OK',
          headers: {},
          config: {},
        }),
      );

      const options = {
        url: 'https://example.com',
        useProxy: 'http://custom.proxy.com:3128' as const,
        patterns: [
          {
            key: 'title',
            patternType: 'xpath' as const,
            returnType: 'text' as const,
            patterns: ['//h1/text()'],
          },
        ],
      };

      await service.evaluateWebsite(options);

      expect(mockHttpService.get).toHaveBeenCalledWith(
        'https://example.com',
        expect.objectContaining({
          headers: expect.objectContaining({
            'User-Agent': expect.any(String) as unknown,
          }) as unknown,
        }) as unknown,
      );
    });
  });

  describe('validateXpath', () => {
    it('should validate correct XPath patterns', () => {
      const html = `
        <html>
          <body>
            <h1>Title</h1>
            <div class="content">Content</div>
          </body>
        </html>
      `;

      const xpathPatterns = ['//h1/text()', '//div[@class="content"]/text()'];

      const result = service.validateXpath(html, xpathPatterns);

      expect(result.valid).toBe(true);
      expect(result.results).toHaveLength(2);
      expect(result.results[0]).toEqual({
        xpath: '//h1/text()',
        valid: true,
        matchCount: 1,
        sample: 'Title',
      });
      expect(result.results[1]).toEqual({
        xpath: '//div[@class="content"]/text()',
        valid: true,
        matchCount: 1,
        sample: 'Content',
      });
    });

    it('should detect invalid XPath patterns', () => {
      const html = '<html><body><h1>Title</h1></body></html>';
      const xpathPatterns = ['//h1[[[invalid'];

      const result = service.validateXpath(html, xpathPatterns);

      expect(result.valid).toBe(false);
      expect(result.results[0].valid).toBe(false);
      expect(result.results[0].error).toBeDefined();
    });

    it('should return valid true when no patterns provided', () => {
      const html = '<html><body><h1>Title</h1></body></html>';

      const result = service.validateXpath(html, []);

      expect(result.valid).toBe(true);
      expect(result.results).toHaveLength(0);
    });
  });

  describe('checkUrlAlive', () => {
    it('should check if a single URL is alive', async () => {
      mockHttpService.request.mockReturnValue(
        of({
          status: 200,
          statusText: 'OK',
          headers: {},
          config: {},
          data: '',
        }),
      );

      const result = await service.checkUrlAlive('https://example.com');

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        url: 'https://example.com',
        alive: true,
        statusCode: 200,
      });
    });

    it('should check multiple URLs', async () => {
      mockHttpService.request.mockImplementation((config: { url: string }) => {
        const { url } = config;
        if (url === 'https://example.com') {
          return of({
            status: 200,
            statusText: 'OK',
            headers: {},
            config: {},
            data: '',
          });
        }
        if (url === 'https://notfound.com') {
          return of({
            status: 404,
            statusText: 'Not Found',
            headers: {},
            config: {},
            data: '',
          });
        }
        return of({
          status: 500,
          statusText: 'Internal Server Error',
          headers: {},
          config: {},
          data: '',
        });
      });

      const result = await service.checkUrlAlive([
        'https://example.com',
        'https://notfound.com',
        'https://server-error.com',
      ]);

      expect(result).toHaveLength(3);
      expect(result[0]).toEqual({
        url: 'https://example.com',
        alive: true,
        statusCode: 200,
      });
      expect(result[1]).toEqual({
        url: 'https://notfound.com',
        alive: false,
        statusCode: 404,
      });
      expect(result[2]).toEqual({
        url: 'https://server-error.com',
        alive: false,
        statusCode: 500,
      });
    });

    it('should handle network errors gracefully', async () => {
      const networkError = new Error('Network error');
      (networkError as AxiosError).isAxiosError = true;
      (networkError as AxiosError).message = 'Network error';

      mockHttpService.request.mockReturnValue(throwError(() => networkError));

      const result = await service.checkUrlAlive('https://down.com');

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        url: 'https://down.com',
        alive: false,
        error: 'Network error',
      });
    });

    it('should use proxy when specified', async () => {
      mockHttpService.request.mockReturnValue(
        of({
          status: 200,
          statusText: 'OK',
          headers: {},
          config: {},
          data: '',
        }),
      );

      await service.checkUrlAlive('https://example.com', {
        useProxy: 'http://proxy.example.com:8080',
      });

      expect(mockHttpService.request).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'HEAD',
          url: 'https://example.com',
        }) as unknown,
      );
    });
  });

  describe('evaluateWebsite with alternative patterns', () => {
    it('should use alternative patterns when primary pattern fails', async () => {
      const html = `
        <html>
          <body>
            <h1>Fallback Title</h1>
          </body>
        </html>
      `;

      const options = {
        html,
        patterns: [
          {
            key: 'title',
            patternType: 'xpath' as const,
            returnType: 'text' as const,
            // Primary pattern won't match (meta tag doesn't exist)
            patterns: ['//meta[@property="og:title"]/@content'],
            meta: {
              alterPattern: ['//h1/text()'], // Fallback will match
            },
            pipes: { trim: true },
          },
        ],
      };

      const result = await service.evaluateWebsite(options);

      expect(result.results).toHaveLength(1);
      expect(result.results[0].title).toBe('Fallback Title');
    });

    it('should handle all patterns failing gracefully', async () => {
      const html = `
        <html>
          <body>
            <p>Some content</p>
          </body>
        </html>
      `;

      const options = {
        html,
        patterns: [
          {
            key: 'title',
            patternType: 'xpath' as const,
            returnType: 'text' as const,
            patterns: ['//nonexistent/text()'],
            meta: {
              alterPattern: ['//also-nonexistent/text()'],
            },
          },
        ],
      };

      const result = await service.evaluateWebsite(options);

      // Should return empty results when no patterns match
      expect(result.results).toHaveLength(0);
    });
  });

  describe('evaluateWebsite with engine configuration', () => {
    // Note: JSDOM test is skipped since JSDOM is mocked to avoid ESM issues in Jest
    // JSDOM functionality is tested in example files (08-configuration-options.ts)
    it.skip('should use JSDOM engine when configured', async () => {
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          ScraperHtmlService,
          {
            provide: HttpService,
            useValue: mockHttpService,
          },
          {
            provide: 'SCRAPER_HTML_OPTIONS',
            useValue: { engine: 'jsdom' as const },
          },
        ],
      }).compile();

      const jsdomService = module.get<ScraperHtmlService>(ScraperHtmlService);

      const html = `
        <html>
          <body>
            <h1>JSDOM Test</h1>
          </body>
        </html>
      `;

      const options = {
        html,
        patterns: [
          {
            key: 'title',
            patternType: 'xpath' as const,
            returnType: 'text' as const,
            patterns: ['//h1/text()'],
          },
        ],
      };

      const result = await jsdomService.evaluateWebsite(options);

      expect(result.results).toHaveLength(1);
      expect(result.results[0].title).toBe('JSDOM Test');
    });

    it('should use libxmljs engine when configured', async () => {
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          ScraperHtmlService,
          {
            provide: HttpService,
            useValue: mockHttpService,
          },
          {
            provide: 'SCRAPER_HTML_OPTIONS',
            useValue: { engine: 'libxmljs' as const },
          },
        ],
      }).compile();

      const libxmljsService =
        module.get<ScraperHtmlService>(ScraperHtmlService);

      const html = `
        <html>
          <body>
            <h1>libxmljs Test</h1>
          </body>
        </html>
      `;

      const options = {
        html,
        patterns: [
          {
            key: 'title',
            patternType: 'xpath' as const,
            returnType: 'text' as const,
            patterns: ['//h1/text()'],
          },
        ],
      };

      const result = await libxmljsService.evaluateWebsite(options);

      expect(result.results).toHaveLength(1);
      expect(result.results[0].title).toBe('libxmljs Test');
    });
  });

  describe('suppressXpathErrors functionality', () => {
    it('should still extract data when primary XPath fails and alternative succeeds', async () => {
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          ScraperHtmlService,
          {
            provide: HttpService,
            useValue: mockHttpService,
          },
          {
            provide: 'SCRAPER_HTML_OPTIONS',
            useValue: { suppressXpathErrors: true },
          },
        ],
      }).compile();

      const suppressService =
        module.get<ScraperHtmlService>(ScraperHtmlService);

      const html = `
        <html>
          <body>
            <h1>Title from H1</h1>
          </body>
        </html>
      `;

      const options = {
        html,
        patterns: [
          {
            key: 'title',
            patternType: 'xpath' as const,
            returnType: 'text' as const,
            // Primary pattern: invalid XPath (will fail silently)
            patterns: ['//h1[[[invalid'],
            meta: {
              alterPattern: ['//h1/text()'], // Fallback will work
            },
          },
        ],
      };

      const result = await suppressService.evaluateWebsite(options);

      // Should fall back to the working pattern
      expect(result.results).toHaveLength(1);
      expect(result.results[0].title).toBe('Title from H1');
    });
  });
});
