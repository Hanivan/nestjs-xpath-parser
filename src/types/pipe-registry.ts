import { plainToClass } from 'class-transformer';
import { DateFormatPipe } from '../pipes/DateFormatPipe';
import { ExtractEmailPipe } from '../pipes/ExtractEmailPipe';
import { ExtractUrlParamsPipe } from '../pipes/ExtractUrlParamsPipe';
import { JsonPathPipe } from '../pipes/JsonPathPipe';
import { MediaFilterPipe } from '../pipes/MediaFilterPipe';
import { NumberNormalizePipe } from '../pipes/NumberNormalizePipe';
import { ParseAsURLPipe } from '../pipes/ParseAsURLPipe';
import { QueryAppendPipe } from '../pipes/QueryAppendPipe';
import {
  RegexExtractionPipe,
  PageRegexExtractionPipe,
  URLRegexExtractionPipe,
} from '../pipes/RegexExtractionPipe';
import {
  RegexReplacePipe,
  PageRegexReplacePipe,
  URLRegexReplacePipe,
} from '../pipes/RegexReplacePipe';
import { RegexPipe } from '../pipes/RegexPipe';
import { UrlResolvePipe } from '../pipes/UrlResolvePipe';
import { CleanHtmlPipe } from '../pipes/CleanHtmlPipe';
import {
  QueryRemoverPipe,
  PageQueryRemoverPipe,
  URLQueryRemoverPipe,
} from '../pipes/QueryRemoverPipe';
import { DateFormatSpecialPipe } from '../pipes/DateFormatSpecialPipe';
import { PipeTransform } from './pipe-transform.type';

/**
 * Registry of predefined pipe types.
 * Maps pipe type strings to pipe classes.
 *
 * Developers can extend this with their own pipes:
 * @example
 * ```typescript
 * import { PIPE_REGISTRY } from '@hanivanrizky/nestjs-xpath-parser';
 * import { MyCustomPipe } from './my-custom.pipe';
 *
 * PIPE_REGISTRY['my-custom'] = MyCustomPipe;
 * ```
 */
export const PIPE_REGISTRY: Record<
  string,
  new (...args: unknown[]) => PipeTransform
> = {
  // original v2 pipes
  regex: RegexPipe,
  'parse-as-url': ParseAsURLPipe,
  'date-format': DateFormatPipe,
  'num-normalize': NumberNormalizePipe,
  'url-resolve': UrlResolvePipe,
  'extract-email': ExtractEmailPipe,
  'clean-html': CleanHtmlPipe,
  // v1-compatible pipes
  'regex-extraction': RegexExtractionPipe,
  'regex-extraction--page': PageRegexExtractionPipe,
  'regex-extraction--url': URLRegexExtractionPipe,
  'regex-replace': RegexReplacePipe,
  'regex-replace--page': PageRegexReplacePipe,
  'regex-replace--url': URLRegexReplacePipe,
  'extract-url-params': ExtractUrlParamsPipe,
  'media-filter': MediaFilterPipe,
  'query-append': QueryAppendPipe,
  'json-path': JsonPathPipe,
  'query-remover': QueryRemoverPipe,
  'query-remover--page': PageQueryRemoverPipe,
  'query-remover--url': URLQueryRemoverPipe,
  'date-format-special': DateFormatSpecialPipe,
};

/**
 * Convert plain pipe config objects to pipe instances using plainToClass.
 * Automatically sets baseUrl for any pipe that has this property.
 *
 * @param pipeConfigs - Array of plain pipe config objects
 * @param url - Optional URL to set as baseUrl for pipes that support it
 * @returns Array of pipe instances
 */
export function instantiatePipes(
  pipeConfigs: Array<Record<string, unknown>>,
  url?: string,
): PipeTransform[] {
  const pipes: PipeTransform[] = [];

  for (const config of pipeConfigs) {
    const pipeType = config.type as string;

    if (!pipeType) {
      // Skip silently - let the developer handle validation
      continue;
    }

    const PipeClass = PIPE_REGISTRY[pipeType];

    if (!PipeClass) {
      // Skip unknown pipe types silently - allows custom pipes to be registered later
      continue;
    }

    try {
      // Use plainToClass to convert plain object to class instance
      const pipe = plainToClass(PipeClass, config);

      // Dynamically set baseUrl if pipe has this property
      // This works for ParseAsURLPipe AND any custom pipe with a baseUrl property
      if (url && 'baseUrl' in pipe) {
        (pipe as { baseUrl?: string }).baseUrl = url;
      }

      pipes.push(pipe);
    } catch {
      // Skip failed instantiation silently
      continue;
    }
  }

  return pipes;
}
