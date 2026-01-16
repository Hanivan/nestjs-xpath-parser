import { PipeTransform } from '../types';

/**
 * Predefined pipe that normalizes numbers with K/M/B suffixes.
 *
 * @example
 * ```typescript
 * import { NumberNormalizePipe } from '@hanivanrizky/nestjs-xpath-parser';
 *
 * pipes: {
 *   custom: [{ type: 'num-normalize' }],
 * }
 * // "1.5K" -> 1500
 * // "2.3M" -> 2300000
 * ```
 */
export class NumberNormalizePipe extends PipeTransform<string, number> {
  readonly type = 'num-normalize' as const;

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
