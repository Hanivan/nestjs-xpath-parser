import { HtmlParser } from './html-parser';
import { ParserEngine } from '../enums';
import type { PatternField } from '../types/pattern-field.type';

jest.mock('jsdom', () => ({ JSDOM: jest.fn() }));

const makeParser = () =>
  new HtmlParser(ParserEngine.LIBXML as ParserEngine, false);

const PAGE_HTML = `
<html><body>
  <ul id="threads">
    <li class="thread"><a href="/threads/foo.1/">Foo</a></li>
    <li class="thread"><a href="/threads/bar.2/">Bar</a></li>
    <li class="thread"><a href="https://other.com/threads/baz.3/">Baz</a></li>
  </ul>
  <nav class="pagination">
    <a href="/forum/page-2">2</a>
    <a href="/forum/page-3">3</a>
    <a href="https://forums.example.com/forum/page-4">4</a>
  </nav>
</body></html>
`;

const BASE_URL = 'https://forums.example.com/forum/';

const CONTAINER_PATTERN: PatternField = {
  key: 'container',
  patternType: 'xpath',
  returnType: 'text',
  patterns: ['//ul[@id="threads"]/li'],
  meta: { isContainer: true },
};

const LINK_PATTERN: PatternField = {
  key: 'link',
  patternType: 'xpath',
  returnType: 'text',
  patterns: ['.//a/@href'],
};

const TITLE_PATTERN: PatternField = {
  key: 'title',
  patternType: 'xpath',
  returnType: 'text',
  patterns: ['.//a/text()'],
};

const PAGE_PATTERN: PatternField = {
  key: 'paginate',
  patternType: 'xpath',
  returnType: 'text',
  patterns: ['//nav[@class="pagination"]/a'],
  meta: { isPage: true },
};

describe('HtmlParser.extractData', () => {
  let parser: HtmlParser;

  beforeEach(() => {
    parser = makeParser();
  });

  describe('pagination URL resolution', () => {
    it('resolves relative pagination URLs against the base URL', () => {
      const dom = parser.parse(PAGE_HTML);
      const results = parser.extractData([PAGE_PATTERN], dom, BASE_URL);
      dom.destroy();

      const urls = results.map((r) => (r as Record<string, string>)['url']);
      expect(urls[0]).toBe('https://forums.example.com/forum/page-2');
      expect(urls[1]).toBe('https://forums.example.com/forum/page-3');
    });

    it('leaves already-absolute pagination URLs unchanged', () => {
      const dom = parser.parse(PAGE_HTML);
      const results = parser.extractData([PAGE_PATTERN], dom, BASE_URL);
      dom.destroy();

      const urls = results.map((r) => (r as Record<string, string>)['url']);
      expect(urls[2]).toBe('https://forums.example.com/forum/page-4');
    });

    it('returns raw URL when no base URL provided', () => {
      const dom = parser.parse(PAGE_HTML);
      const results = parser.extractData([PAGE_PATTERN], dom);
      dom.destroy();

      const urls = results.map((r) => (r as Record<string, string>)['url']);
      expect(urls[0]).toBe('/forum/page-2');
    });
  });

  describe('container extraction', () => {
    it('extracts all thread items from container', () => {
      const dom = parser.parse(PAGE_HTML);
      const results = parser.extractData(
        [CONTAINER_PATTERN, LINK_PATTERN, TITLE_PATTERN],
        dom,
        BASE_URL,
      );
      dom.destroy();

      expect(results).toHaveLength(3);
      expect((results[0] as Record<string, string>)['title']).toBe('Foo');
      expect((results[1] as Record<string, string>)['title']).toBe('Bar');
    });

    it('extracts both container items and pagination in one call', () => {
      const dom = parser.parse(PAGE_HTML);
      const results = parser.extractData(
        [CONTAINER_PATTERN, LINK_PATTERN, TITLE_PATTERN, PAGE_PATTERN],
        dom,
        BASE_URL,
      );
      dom.destroy();

      const threads = results.filter((r) => 'title' in r);
      const pages = results.filter((r) => 'url' in r);
      expect(threads).toHaveLength(3);
      expect(pages).toHaveLength(3);
    });
  });
});
