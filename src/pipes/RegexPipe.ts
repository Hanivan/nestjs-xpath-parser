import { IsArray, IsNotEmpty } from 'class-validator';
import { PipeTransform } from '../types';

/**
 * Configuration for a single regex replacement rule.
 */
export interface RegexReplacementRule {
  /** Regex pattern to match (can be string or RegExp) */
  pattern: string | RegExp;
  /** Replacement string (supports $1, $2, etc. for capture groups) */
  replacement: string;
  /** Regex flags (default: 'g') */
  flags?: string;
}

/**
 * Predefined pipe that performs regex-based replacements.
 * Can apply multiple replacement rules in sequence.
 *
 * @example
 * ```typescript
 * import { RegexPipe } from '@hanivanrizky/nestjs-xpath-parser';
 *
 * const patterns: PatternField[] = [
 *   {
 *     key: 'title',
 *     patternType: 'xpath',
 *     returnType: 'text',
 *     patterns: ['.//h1/text()'],
 *     pipes: {
 *       custom: [{
 *         type: 'regex',
 *         rules: [
 *           { pattern: '^Prefix: ', replacement: '', flags: 'g' },
 *         ],
 *       }],
 *     },
 *   },
 * ];
 * ```
 */
export class RegexPipe extends PipeTransform<string, string> {
  readonly type = 'regex' as const;

  @IsArray()
  @IsNotEmpty()
  rules!: RegexReplacementRule[];

  exec(value: string): string {
    if (!value || typeof value !== 'string') {
      return value || '';
    }

    let result = value;

    for (const rule of this.rules) {
      const flags = rule.flags || 'g';
      const regex =
        rule.pattern instanceof RegExp
          ? new RegExp(rule.pattern.source, flags)
          : new RegExp(rule.pattern, flags);

      result = result.replace(regex, rule.replacement);
    }

    return result;
  }

  reverse(value: string): string {
    return value;
  }
}
