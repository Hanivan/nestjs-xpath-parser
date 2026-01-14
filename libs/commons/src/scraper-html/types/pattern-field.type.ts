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
}

export interface PatternField {
  key: string;
  patternType: 'xpath';
  returnType: 'text' | 'rawHTML';
  patterns: string[];
  meta?: PatternMeta;
  pipes?: CleanerStepRules;
}
