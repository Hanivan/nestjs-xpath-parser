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
   * Pass as plain objects with type and properties:
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
