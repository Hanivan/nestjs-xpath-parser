import { Test, TestingModule } from '@nestjs/testing';
import { HtmlParserService } from './html-parser.service';
import { ScraperHtmlService } from '@commons/commons/scraper-html';
import { PatternType, ReturnType } from './dto/parse-html.dto';

// Mock JSDOM to avoid ESM issues in Jest
jest.mock('jsdom', () => ({
  JSDOM: jest.fn(),
}));

describe('HtmlParserService', () => {
  let service: HtmlParserService;

  const mockScraperHtmlService = {
    evaluateWebsite: jest.fn(),
    validateXpath: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HtmlParserService,
        {
          provide: ScraperHtmlService,
          useValue: mockScraperHtmlService,
        },
      ],
    }).compile();

    service = module.get<HtmlParserService>(HtmlParserService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('parse', () => {
    it('should parse HTML and return formatted results', async () => {
      const parseHtmlDto = {
        html: '<html><body><h1>Test</h1></body></html>',
        patterns: [
          {
            key: 'title',
            patternType: PatternType.XPATH,
            returnType: ReturnType.TEXT,
            patterns: ['//h1/text()'],
          },
        ],
      };

      mockScraperHtmlService.evaluateWebsite.mockResolvedValue({
        results: [{ title: 'Test' }],
        document: {},
      });

      const result = await service.parse(parseHtmlDto);

      expect(result).toEqual({
        success: true,
        data: [{ title: 'Test' }],
        count: 1,
      });
      expect(mockScraperHtmlService.evaluateWebsite).toHaveBeenCalledWith(
        expect.objectContaining({
          html: parseHtmlDto.html,
          patterns: expect.arrayContaining([
            expect.objectContaining({
              key: 'title',
              patternType: 'xpath',
            }),
          ]),
        }),
      );
    });

    it('should handle URL parameter', async () => {
      const parseHtmlDto = {
        url: 'https://example.com',
        patterns: [
          {
            key: 'title',
            patternType: PatternType.XPATH,
            returnType: ReturnType.TEXT,
            patterns: ['//h1/text()'],
          },
        ],
      };

      mockScraperHtmlService.evaluateWebsite.mockResolvedValue({
        results: [{ title: 'Test' }],
        document: {},
      });

      await service.parse(parseHtmlDto);

      expect(mockScraperHtmlService.evaluateWebsite).toHaveBeenCalledWith(
        expect.objectContaining({
          url: 'https://example.com',
        }),
      );
    });

    it('should pass through useProxy option', async () => {
      const parseHtmlDto = {
        html: '<html></html>',
        patterns: [],
        useProxy: true,
      };

      mockScraperHtmlService.evaluateWebsite.mockResolvedValue({
        results: [],
        document: {},
      });

      await service.parse(parseHtmlDto);

      expect(mockScraperHtmlService.evaluateWebsite).toHaveBeenCalledWith(
        expect.objectContaining({
          useProxy: true,
        }),
      );
    });
  });

  describe('validate', () => {
    it('should validate XPath patterns and return formatted results', async () => {
      const validateHtmlDto = {
        html: '<html><body><h1>Test</h1></body></html>',
        xpathPatterns: ['//h1/text()'],
      };

      mockScraperHtmlService.validateXpath.mockReturnValue({
        valid: true,
        results: [
          {
            xpath: '//h1/text()',
            valid: true,
            matchCount: 1,
            sample: 'Test',
          },
        ],
      });

      const result = await service.validate(validateHtmlDto);

      expect(result).toEqual({
        success: true,
        valid: true,
        results: [
          {
            xpath: '//h1/text()',
            valid: true,
            matchCount: 1,
            sample: 'Test',
          },
        ],
      });
      expect(mockScraperHtmlService.validateXpath).toHaveBeenCalledWith(
        validateHtmlDto.html,
        validateHtmlDto.xpathPatterns,
      );
    });

    it('should handle validation without patterns', async () => {
      const validateHtmlDto = {
        html: '<html><body><h1>Test</h1></body></html>',
      };

      mockScraperHtmlService.validateXpath.mockReturnValue({
        valid: true,
        results: [],
      });

      const result = await service.validate(validateHtmlDto);

      expect(result.success).toBe(true);
      expect(result.valid).toBe(true);
    });
  });
});
