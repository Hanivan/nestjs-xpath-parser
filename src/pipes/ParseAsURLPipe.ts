import { IsOptional, IsString } from 'class-validator';
import { PipeTransform } from '../types';

/**
 * Predefined pipe that resolves relative URLs to absolute URLs using the fetched page's URL as base.
 * This pipe automatically gets the baseUrl from the context when scraping.
 *
 * @example
 * ```typescript
 * import { ParseAsURLPipe } from '@hanivanrizky/nestjs-xpath-parser';
 *
 * const patterns: PatternField[] = [
 *   {
 *     key: 'link',
 *     patternType: 'xpath',
 *     returnType: 'text',
 *     patterns: ['.//a/@href'],
 *     pipes: {
 *       custom: [{ type: 'parse-as-url' }],
 *     },
 *   },
 * ];
 *
 * const result = await service.evaluateWebsite({
 *   url: 'https://example.com/blabla/blabla',
 *   patterns,
 * });
 * // If href="/some/endpoint", result will be "https://example.com/some/endpoint"
 * ```
 */
export class ParseAsURLPipe extends PipeTransform<string, string> {
  readonly type = 'parse-as-url' as const;

  /**
   * Base URL to use for resolving relative URLs.
   * This is automatically set from the fetched URL context.
   */
  @IsOptional()
  @IsString()
  baseUrl?: string;

  exec(value: string): string {
    if (!value || typeof value !== 'string') {
      return '';
    }

    if (value.startsWith('http://') || value.startsWith('https://')) {
      return value;
    }

    if (!this.baseUrl) {
      return value;
    }

    try {
      return new URL(value, this.baseUrl).toString();
    } catch {
      return value;
    }
  }

  reverse(value: string): string {
    return value;
  }
}
