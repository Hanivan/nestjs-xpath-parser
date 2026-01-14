import { PatternField } from './pattern-field.type';

export interface EvaluateOptions {
  url?: string;
  html?: string;
  patterns: PatternField[];
  useProxy?: boolean;
  contentType?: 'text/html' | 'text/xml';
}
