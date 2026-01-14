import { Injectable } from '@nestjs/common';
import { ParseHtmlDto } from './dto/parse-html.dto';
import { ValidateHtmlDto } from './dto/validate-html.dto';
import { ScraperHtmlService } from '@commons/commons/scraper-html';
import { EvaluateOptions } from '@commons/commons/scraper-html/types';

@Injectable()
export class HtmlParserService {
  constructor(private readonly scraperHtmlService: ScraperHtmlService) {}

  async parse(parseHtmlDto: ParseHtmlDto) {
    const options: EvaluateOptions = {
      url: parseHtmlDto.url,
      html: parseHtmlDto.html,
      patterns: parseHtmlDto.patterns.map((pattern) => ({
        key: pattern.key,
        patternType: 'xpath',
        returnType: pattern.returnType,
        patterns: pattern.patterns,
        meta: pattern.meta,
        pipes: pattern.pipes,
      })),
      useProxy: parseHtmlDto.useProxy,
    };

    const result = await this.scraperHtmlService.evaluateWebsite(options);

    return {
      success: true,
      data: result.results,
      count: result.results.length,
    };
  }

  async validate(validateHtmlDto: ValidateHtmlDto) {
    const result = this.scraperHtmlService.validateXpath(
      validateHtmlDto.html,
      validateHtmlDto.xpathPatterns,
    );

    return {
      success: true,
      valid: result.valid,
      results: result.results,
    };
  }
}
