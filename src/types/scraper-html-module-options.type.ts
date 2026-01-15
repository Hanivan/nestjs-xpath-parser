import { LogLevel } from '@nestjs/common';

export interface ScraperHtmlModuleOptions {
  maxRetries?: number;
  logLevel?: LogLevel | LogLevel[];
  suppressXpathErrors?: boolean;
  engine?: 'libxmljs' | 'jsdom';
}
