import { Module, DynamicModule, ModuleMetadata } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ScraperHtmlService } from './scraper-html.service';

export interface ScraperHtmlModuleOptions {
  maxRetries?: number;
}

export interface ScraperHtmlModuleAsyncOptions extends ScraperHtmlModuleOptions {
  imports?: ModuleMetadata['imports'];
  useFactory?: (
    ...args: any[]
  ) => Promise<ScraperHtmlModuleOptions> | ScraperHtmlModuleOptions;
  inject?: any[];
}

@Module({})
export class ScraperHtmlModule {
  static forRoot(options?: ScraperHtmlModuleOptions): DynamicModule {
    return {
      module: ScraperHtmlModule,
      imports: [HttpModule],
      providers: [
        {
          provide: 'SCRAPER_HTML_OPTIONS',
          useValue: options || {},
        },
        ScraperHtmlService,
      ],
      exports: [ScraperHtmlService],
    };
  }

  static forRootAsync(options: ScraperHtmlModuleAsyncOptions): DynamicModule {
    return {
      module: ScraperHtmlModule,
      imports: options.imports || [],
      providers: [
        {
          provide: 'SCRAPER_HTML_OPTIONS',
          useFactory: options.useFactory || (() => ({})),
          inject: options.inject || [],
        },
        ScraperHtmlService,
      ],
      exports: [ScraperHtmlService],
    };
  }
}
