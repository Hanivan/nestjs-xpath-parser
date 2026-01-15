import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { of } from 'rxjs';
import { ScraperHtmlService } from './scraper-html.service';

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
});
