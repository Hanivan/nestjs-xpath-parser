import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';

describe('HtmlParser API (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/html/parse (POST)', () => {
    it('should parse HTML with XPath patterns', async () => {
      const payload = {
        html: `
          <html>
            <body>
              <h1>Test Title</h1>
              <div class="content">Test Content</div>
            </body>
          </html>
        `,
        patterns: [
          {
            key: 'title',
            patternType: 'xpath',
            returnType: 'text',
            patterns: ['//h1/text()'],
          },
          {
            key: 'content',
            patternType: 'xpath',
            returnType: 'text',
            patterns: ['//div[@class="content"]/text()'],
          },
        ],
      };

      const response = await request(app.getHttpServer())
        .post('/html/parse')
        .send(payload)
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0]).toEqual({
        title: 'Test Title',
        content: 'Test Content',
      });
    });

    it('should scrape from scrapingcourse.com URL', async () => {
      const payload = {
        url: 'https://www.scrapingcourse.com/ecommerce/',
        patterns: [
          {
            key: 'title',
            patternType: 'xpath',
            returnType: 'text',
            patterns: ['//title/text()'],
            pipes: {
              trim: true,
            },
          },
        ],
      };

      const response = await request(app.getHttpServer())
        .post('/html/parse')
        .send(payload)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].title).toBeDefined();
      expect(typeof response.body.data[0].title).toBe('string');

      console.log('Scraped title:', response.body.data[0].title);
    }, 30000);

    it('should extract multiple products from scrapingcourse.com', async () => {
      const payload = {
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
            patterns: ['.//h2//text()', './/a//text()'],
            pipes: {
              trim: true,
            },
          },
        ],
      };

      const response = await request(app.getHttpServer())
        .post('/html/parse')
        .send(payload)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.count).toBeGreaterThan(0);

      console.log(`Found ${response.body.count} products`);
      console.log('First product:', response.body.data[0]);
    }, 30000);

    it('should return 400 for invalid pattern type', async () => {
      const payload = {
        html: '<html><body><h1>Test</h1></body></html>',
        patterns: [
          {
            key: 'title',
            patternType: 'invalid',
            returnType: 'text',
            patterns: ['//h1/text()'],
          },
        ],
      };

      await request(app.getHttpServer())
        .post('/html/parse')
        .send(payload)
        .expect(400);
    });

    it('should handle pipes correctly', async () => {
      const payload = {
        html: '<html><body><h1>  TEST TITLE  </h1></body></html>',
        patterns: [
          {
            key: 'title',
            patternType: 'xpath',
            returnType: 'text',
            patterns: ['//h1/text()'],
            pipes: {
              trim: true,
              toLowerCase: true,
            },
          },
        ],
      };

      const response = await request(app.getHttpServer())
        .post('/html/parse')
        .send(payload)
        .expect(201);

      expect(response.body.data[0].title).toBe('test title');
    });
  });

  describe('/html/validate (POST)', () => {
    it('should validate correct XPath patterns', async () => {
      const payload = {
        html: `
          <html>
            <body>
              <h1>Title</h1>
              <div class="content">Content</div>
            </body>
          </html>
        `,
        xpathPatterns: ['//h1/text()', '//div[@class="content"]/text()'],
      };

      const response = await request(app.getHttpServer())
        .post('/html/validate')
        .send(payload)
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('valid', true);
      expect(response.body.results).toHaveLength(2);

      response.body.results.forEach((result: any) => {
        expect(result.valid).toBe(true);
        expect(result).toHaveProperty('matchCount');
      });
    });

    it('should detect invalid XPath patterns', async () => {
      const payload = {
        html: '<html><body><h1>Title</h1></body></html>',
        xpathPatterns: ['//h1/text()', '//invalid[[['],
      };

      const response = await request(app.getHttpServer())
        .post('/html/validate')
        .send(payload)
        .expect(201);

      expect(response.body.valid).toBe(false);
      expect(response.body.results[0].valid).toBe(true);
      expect(response.body.results[1].valid).toBe(false);
      expect(response.body.results[1]).toHaveProperty('error');
    });

    it('should return 400 when html is missing', async () => {
      const payload = {
        xpathPatterns: ['//h1/text()'],
      };

      await request(app.getHttpServer())
        .post('/html/validate')
        .send(payload)
        .expect(400);
    });
  });
});
