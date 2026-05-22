/**
 * HTML/XML parser engine backing {@link HtmlBuilder}. `'libxmljs'` (default)
 * uses libxmljs2; `'jsdom'` uses jsdom.
 */
export const ParserEngine = {
  JSDOM: 'jsdom',
  LIBXMLJS: 'libxmljs',
} as const;

export type ParserEngine = (typeof ParserEngine)[keyof typeof ParserEngine];
