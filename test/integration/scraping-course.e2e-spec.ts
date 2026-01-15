import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ScraperHtmlModule, ScraperHtmlService } from 'src';

describe('ScrapingCourse.com Integration Tests (e2e)', () => {
  let app: INestApplication;
  let scraperService: ScraperHtmlService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [ScraperHtmlModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    scraperService = moduleFixture.get<ScraperHtmlService>(ScraperHtmlService);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Homepage Scraping', () => {
    it('should scrape product listings from homepage', async () => {
      const result = await scraperService.evaluateWebsite({
        url: 'https://www.scrapingcourse.com/ecommerce/',
        patterns: [
          {
            key: 'container',
            patternType: 'xpath',
            returnType: 'text',
            patterns: ['//div[contains(@class, "product")]'],
            meta: {
              isContainer: true,
            },
          },
          {
            key: 'name',
            patternType: 'xpath',
            returnType: 'text',
            patterns: [
              './/h2[contains(@class, "product-name")]//text()',
              './/h2//text()',
              './/a[contains(@class, "product-link")]//text()',
            ],
            pipes: {
              trim: true,
            },
          },
          {
            key: 'price',
            patternType: 'xpath',
            returnType: 'text',
            patterns: [
              './/span[contains(@class, "price")]//text()',
              './/span[contains(@class, "amount")]//text()',
            ],
            pipes: {
              trim: true,
            },
          },
          {
            key: 'url',
            patternType: 'xpath',
            returnType: 'text',
            patterns: [
              './/a[contains(@class, "product-link")]/@href',
              './/a/@href',
            ],
            pipes: {
              trim: true,
            },
          },
        ],
      });

      expect(result.results).toBeDefined();
      expect(result.results.length).toBeGreaterThan(0);

      // Verify structure of first product
      const firstProduct = result.results[0];
      expect(firstProduct).toHaveProperty('name');
      expect(firstProduct).toHaveProperty('price');

      // Product name should not be empty
      if (firstProduct.name) {
        expect(typeof firstProduct.name).toBe('string');
        expect((firstProduct.name as string).length).toBeGreaterThan(0);
      }

      console.log('First product scraped:', firstProduct);
      console.log(`Total products found: ${result.results.length}`);
    }, 30000); // 30 second timeout for network request

    it('should scrape page title', async () => {
      const result = await scraperService.evaluateWebsite({
        url: 'https://www.scrapingcourse.com/ecommerce/',
        patterns: [
          {
            key: 'title',
            patternType: 'xpath',
            returnType: 'text',
            patterns: ['//title/text()', '//h1/text()'],
            pipes: {
              trim: true,
            },
          },
        ],
      });

      expect(result.results).toHaveLength(1);
      expect(result.results[0].title).toBeDefined();
      expect(typeof result.results[0].title).toBe('string');

      console.log('Page title:', result.results[0].title);
    }, 30000);
  });

  describe('Product Detail Page Scraping', () => {
    it('should scrape product details from a product page', async () => {
      // First, get a product URL from the listing page
      const listingResult = await scraperService.evaluateWebsite({
        url: 'https://www.scrapingcourse.com/ecommerce/',
        patterns: [
          {
            key: 'url',
            patternType: 'xpath',
            returnType: 'text',
            patterns: [
              '(//a[contains(@class, "product")]/@href)[1]',
              '(//div[contains(@class, "product")]//a/@href)[1]',
            ],
          },
        ],
      });

      const productUrl = listingResult.results[0]?.url;

      if (productUrl && typeof productUrl === 'string') {
        // Now scrape the product detail page
        const detailResult = await scraperService.evaluateWebsite({
          url: productUrl,
          patterns: [
            {
              key: 'productName',
              patternType: 'xpath',
              returnType: 'text',
              patterns: [
                '//h1[contains(@class, "product")]/text()',
                '//h1/text()',
              ],
              pipes: {
                trim: true,
              },
            },
            {
              key: 'price',
              patternType: 'xpath',
              returnType: 'text',
              patterns: [
                '//p[contains(@class, "price")]//text()',
                '//span[contains(@class, "price")]//text()',
              ],
              pipes: {
                trim: true,
              },
            },
            {
              key: 'description',
              patternType: 'xpath',
              returnType: 'text',
              patterns: [
                '//div[contains(@class, "description")]//text()',
                '//div[contains(@class, "product")]//p//text()',
              ],
              pipes: {
                trim: true,
              },
            },
          ],
        });

        expect(detailResult.results).toHaveLength(1);
        const product = detailResult.results[0];

        console.log('Product details scraped:', product);

        // At least one field should be populated
        expect(
          product.productName || product.price || product.description,
        ).toBeTruthy();
      }
    }, 60000); // 60 second timeout for two network requests
  });

  describe('XPath Validation', () => {
    it('should validate XPath patterns against scrapingcourse.com HTML', () => {
      // For this test, we'll validate some common patterns against sample HTML
      const testHtml = `
        <html>
          <head><title>Test</title></head>
          <body>
            <div class="product">
              <h2>Product Name</h2>
              <span class="price">$19.99</span>
            </div>
          </body>
        </html>
      `;

      const validationResult = scraperService.validateXpath(testHtml, [
        '//div[@class="product"]',
        '//h2/text()',
        '//span[@class="price"]/text()',
        '//invalid[[[xpath',
      ]);

      expect(validationResult.results).toHaveLength(4);
      expect(validationResult.results[0].valid).toBe(true);
      expect(validationResult.results[1].valid).toBe(true);
      expect(validationResult.results[2].valid).toBe(true);
      expect(validationResult.results[3].valid).toBe(false);
      expect(validationResult.valid).toBe(false); // Overall invalid due to one bad pattern
    });
  });

  describe('Data Cleaning Pipes', () => {
    it('should apply pipes to scraped data', async () => {
      const result = await scraperService.evaluateWebsite({
        url: 'https://www.scrapingcourse.com/ecommerce/',
        patterns: [
          {
            key: 'titleLower',
            patternType: 'xpath',
            returnType: 'text',
            patterns: ['//title/text()'],
            pipes: {
              trim: true,
              toLowerCase: true,
            },
          },
          {
            key: 'titleUpper',
            patternType: 'xpath',
            returnType: 'text',
            patterns: ['//title/text()'],
            pipes: {
              trim: true,
              toUpperCase: true,
            },
          },
        ],
      });

      expect(result.results).toHaveLength(1);

      const data = result.results[0];
      if (data.titleLower) {
        expect(data.titleLower).toBe((data.titleLower as string).toLowerCase());
      }
      if (data.titleUpper) {
        expect(data.titleUpper).toBe((data.titleUpper as string).toUpperCase());
      }

      console.log('Pipe transformations:', data);
    }, 30000);
  });

  describe('Multiple Values Extraction', () => {
    it('should extract multiple product names as an array', async () => {
      const result = await scraperService.evaluateWebsite({
        url: 'https://www.scrapingcourse.com/ecommerce/',
        patterns: [
          {
            key: 'productNames',
            patternType: 'xpath',
            returnType: 'text',
            patterns: [
              '//h2[contains(@class, "product")]//text()',
              '//div[contains(@class, "product")]//h2//text()',
            ],
            meta: {
              multiple: true,
            },
            pipes: {
              trim: true,
            },
          },
        ],
      });

      expect(result.results).toHaveLength(1);
      const productNames = result.results[0].productNames;

      expect(Array.isArray(productNames)).toBe(true);
      if (Array.isArray(productNames)) {
        expect(productNames.length).toBeGreaterThan(0);
        console.log(`Found ${productNames.length} products:`, productNames);
      }
    }, 30000);
  });
});
