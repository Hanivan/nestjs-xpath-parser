import { PipeTransform } from '../src/types';

/**
 * Example custom pipe that converts date strings to Unix timestamps.
 * This demonstrates how to create custom pipes by extending PipeTransform.
 *
 * @example
 * ```typescript
 * const dateFormatPipe = new DateFormatPipe('YYYY-MM-DD');
 *
 * ScraperHtmlModule.forRoot({
 *   customPipes: {
 *     dateFormat: dateFormatPipe,
 *   },
 * }),
 *
 * // Then use in pattern:
 * {
 *   key: 'timestamp',
 *   patternType: 'xpath',
 *   returnType: 'text',
 *   patterns: ['.//div[@class="date"]/text()'],
 *   pipes: {
 *     custom: 'dateFormat',
 *   },
 * }
 * ```
 */
export class DateFormatPipe extends PipeTransform<string, number> {
  constructor(private format: string = 'YYYY-MM-DD') {
    super();
  }

  exec(value: string): number {
    // This is a simplified example
    // In a real implementation, you would use moment.js or date-fns
    const date = new Date(value);

    if (isNaN(date.getTime())) {
      // Try to parse with the specified format
      // This is just a placeholder - use a proper date library
      return Date.now() / 1000;
    }

    return Math.floor(date.getTime() / 1000);
  }

  reverse(timestamp: number): string {
    const date = new Date(timestamp * 1000);
    return date.toISOString().split('T')[0]; // Returns YYYY-MM-DD format
  }
}

/**
 * Example custom pipe that normalizes numbers with K/M suffixes.
 *
 * @example
 * ```typescript
 * {
 *   key: 'views',
 *   patternType: 'xpath',
 *   returnType: 'text',
 *   patterns: ['.//span[@class="views"]/text()'],
 *   pipes: {
 *     custom: 'numberNormalize',
 *   },
 * }
 * // Input: "1.5K" -> Output: 1500
 * // Input: "2.3M" -> Output: 2300000
 * ```
 */
export class NumberNormalizePipe extends PipeTransform<string, number> {
  exec(value: string): number {
    if (typeof value !== 'string') {
      return Number(value) || 0;
    }

    const normalized = value.toLowerCase().replace(/,/g, '.');
    let result = parseFloat(normalized);

    if (normalized.endsWith('k')) {
      result *= 1000;
    } else if (normalized.endsWith('m')) {
      result *= 1000000;
    } else if (normalized.endsWith('b')) {
      result *= 1000000000;
    }

    return Math.round(result) || 0;
  }

  reverse(value: number): string {
    if (value >= 1000000000) {
      return `${(value / 1000000000).toFixed(1)}B`;
    } else if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}K`;
    }
    return String(value);
  }
}
