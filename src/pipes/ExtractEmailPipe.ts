import { PipeTransform } from '../types';

/**
 * Predefined pipe that extracts email addresses from text.
 *
 * @example
 * ```typescript
 * import { ExtractEmailPipe } from '@hanivanrizky/nestjs-xpath-parser';
 *
 * pipes: {
 *   custom: [{ type: 'extract-email' }],
 * }
 * ```
 */
export class ExtractEmailPipe extends PipeTransform<string, string> {
  readonly type = 'extract-email' as const;

  exec(value: string): string {
    if (!value || typeof value !== 'string') {
      return '';
    }

    const match = value.match(
      /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/gi,
    );
    return match ? match[0] : '';
  }

  reverse(value: string): string {
    return value;
  }
}
