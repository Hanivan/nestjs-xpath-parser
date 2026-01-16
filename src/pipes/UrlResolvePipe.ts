import { IsNotEmpty, IsString } from 'class-validator';
import { PipeTransform } from '../types';

/**
 * Predefined pipe that resolves relative URLs to absolute URLs.
 *
 * @example
 * ```typescript
 * import { UrlResolvePipe } from '@hanivanrizky/nestjs-xpath-parser';
 *
 * pipes: {
 *   custom: [{
 *     type: 'url-resolve',
 *     baseUrl: 'https://example.com',
 *   }],
 * }
 * ```
 */
export class UrlResolvePipe extends PipeTransform<string, string> {
  readonly type = 'url-resolve' as const;

  @IsString()
  @IsNotEmpty()
  baseUrl!: string;

  exec(value: string): string {
    if (!value || typeof value !== 'string') {
      return '';
    }

    const trimmed = value.trim();

    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      return trimmed;
    }

    if (trimmed.startsWith('//')) {
      return 'https:' + trimmed;
    }

    if (trimmed.startsWith('/')) {
      const url = new URL(this.baseUrl);
      return `${url.protocol}//${url.host}${trimmed}`;
    }

    return this.baseUrl.replace(/\/$/, '') + '/' + trimmed;
  }

  reverse(value: string): string {
    try {
      const base = new URL(this.baseUrl);
      const url = new URL(value);

      if (url.host === base.host) {
        return url.pathname;
      }
      return value;
    } catch {
      return value;
    }
  }
}
