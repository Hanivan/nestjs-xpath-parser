export interface PatternMeta {
  multiple?: boolean | string;
  multiline?: boolean;
  alterPattern?: string[];
  isContainer?: boolean;
  isPage?: boolean;
}

export interface CleanerRule {
  from: string;
  to: string;
}

export interface CleanerStepRules {
  trim?: boolean;
  toLowerCase?: boolean;
  toUpperCase?: boolean;
  replace?: CleanerRule[];
  decode?: boolean;
  /** Merge multiple values into single string before applying other pipes */
  merge?: boolean | 'with space' | 'with comma';
  /**
   * Custom pipe configuration(s).
   * Pass as plain objects with type and properties.
   *
   * Available pre-defined pipes:
   * - `regex` - Apply regex replacements (@example { type: 'regex', rules: [{ pattern: '^Prefix', replacement: '', flags: 'g' }] })
   * - `num-normalize` - Convert "1.5K", "2.3M" to numbers (@example { type: 'num-normalize' })
   * - `parse-as-url` - Resolve relative URLs using baseUrl from context (@example { type: 'parse-as-url' })
   * - `extract-email` - Extract email from text (@example { type: 'extract-email' })
   * - `date-format` - Convert date to timestamp (@example { type: 'date-format', format: 'YYYY-MM-DD' })
   * - `url-resolve` - Resolve URLs with custom baseUrl (@example { type: 'url-resolve', baseUrl: 'https://example.com' })
   *
   * @example
   * pipes: {
   *   custom: [
   *     { type: 'regex', rules: [{ pattern: '^Prefix', replacement: '' }] },
   *     { type: 'parse-as-url' },
   *     { type: 'num-normalize' },
   *   ]
   * }
   */
  custom?: Array<Record<string, unknown>>;
}

export interface PatternField {
  key: string;
  patternType: 'xpath';
  returnType: 'text' | 'rawHTML';
  patterns: string[];
  meta?: PatternMeta;
  pipes?: CleanerStepRules;
}
