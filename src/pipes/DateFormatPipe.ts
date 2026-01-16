import { IsString } from 'class-validator';
import { PipeTransform } from '../types';

/**
 * Predefined pipe that converts date strings to Unix timestamps.
 *
 * @example
 * ```typescript
 * import { DateFormatPipe } from '@hanivanrizky/nestjs-xpath-parser';
 *
 * pipes: {
 *   custom: [{
 *     type: 'date-format',
 *     format: 'YYYY-MM-DD',
 *   }],
 * }
 * ```
 */
export class DateFormatPipe extends PipeTransform<string, number> {
  readonly type = 'date-format' as const;

  @IsString()
  format: string = 'YYYY-MM-DD';

  exec(value: string): number {
    if (!value || typeof value !== 'string') {
      return 0;
    }

    const trimmed = value.trim();
    const date = new Date(trimmed);

    if (isNaN(date.getTime())) {
      return Math.floor(Date.now() / 1000);
    }

    return Math.floor(date.getTime() / 1000);
  }

  reverse(timestamp: number): string {
    const date = new Date(timestamp * 1000);
    return date.toISOString().split('T')[0];
  }
}
