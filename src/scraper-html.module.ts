import { DynamicModule, Module, ModuleMetadata } from '@nestjs/common';
import { InjectionToken, Provider } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ScraperHtmlService } from './scraper-html.service';
import type { ScraperHtmlModuleOptions } from './types';

type FactoryFunction = (
  ...args: unknown[]
) => Promise<ScraperHtmlModuleOptions> | ScraperHtmlModuleOptions;

export interface ScraperHtmlModuleAsyncOptions extends ScraperHtmlModuleOptions {
  imports?: ModuleMetadata['imports'];
  useFactory?: FactoryFunction;
  inject?: InjectionToken[];
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
          useValue: options ?? {},
        },
        ScraperHtmlService,
      ],
      exports: [ScraperHtmlService],
    };
  }

  static forRootAsync(options: ScraperHtmlModuleAsyncOptions): DynamicModule {
    const asyncProviders: Provider[] = [
      {
        provide: 'SCRAPER_HTML_OPTIONS',
        useFactory: options.useFactory ?? (() => ({})),
        inject: options.inject ?? [],
      },
      ScraperHtmlService,
    ];

    return {
      module: ScraperHtmlModule,
      imports: options.imports ?? [],
      providers: asyncProviders,
      exports: [ScraperHtmlService],
    };
  }
}
