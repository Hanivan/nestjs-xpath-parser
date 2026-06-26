import { Logger } from '@nestjs/common';
import { PatternField, ExtractionResult, HtmlNode } from '../types';
import { ParserEngine } from '../enums';
import { HtmlBuilder } from './html-builder';
import { PipeEngine } from '../pipes';

export interface ValidationResult {
  valid: boolean;
  results: Array<{
    xpath: string;
    valid: boolean;
    matchCount?: number;
    sample?: string;
    error?: string;
  }>;
}

export class HtmlParser {
  private readonly logger = new Logger(HtmlParser.name);

  constructor(
    private readonly parserEngine: ParserEngine,
    private readonly suppressXpathErrors: boolean,
    private readonly pipeEngine?: PipeEngine,
  ) {}

  parse(
    html: string,
    contentType: 'text/html' | 'text/xml' = 'text/html',
    normalizeHtml: boolean = false,
  ): HtmlBuilder {
    const input = normalizeHtml ? this.collapseWhitespace(html) : html;
    return HtmlBuilder.loadHtml(
      input,
      this.parserEngine === ParserEngine.JSDOM,
      contentType,
      this.suppressXpathErrors,
    );
  }

  private collapseWhitespace(html: string): string {
    return html
      .replace(/\t\t/g, '\t')
      .replace(/\t\n/g, '\n')
      .replace(/\n\n/g, '\n');
  }

  validateXpath(html: string, xpathPatterns?: string[]): ValidationResult {
    const dom = this.parse(html, 'text/html');
    const results: ValidationResult = { valid: true, results: [] };

    if (xpathPatterns && xpathPatterns.length > 0) {
      xpathPatterns.forEach((xpath) => {
        try {
          const nodes = dom.findXpath(xpath);
          results.results.push({
            xpath,
            valid: true,
            matchCount: nodes.length,
            sample: nodes.length > 0 ? dom.value(nodes[0]) : undefined,
          });
        } catch (error) {
          results.valid = false;
          results.results.push({
            xpath,
            valid: false,
            error: error instanceof Error ? error.message : String(error),
          });
        }
      });
    }

    dom.destroy();
    return results;
  }

  extractData<T = ExtractionResult>(
    patterns: PatternField[],
    dom: HtmlBuilder,
    url?: string,
  ): T[] {
    const containerPattern = patterns.find((p) => p.meta?.isContainer);
    const pagePattern = patterns.find((p) => p.meta?.isPage);
    const fieldPatterns = patterns.filter(
      (p) => !p.meta?.isContainer && !p.meta?.isPage,
    );

    const results: ExtractionResult[] = [];

    if (containerPattern) {
      results.push(
        ...this.extractFromContainers(
          containerPattern,
          fieldPatterns,
          dom,
          url,
        ),
      );
    } else {
      results.push(...this.extractWithoutContainer(fieldPatterns, dom, url));
    }

    if (pagePattern) {
      results.push(
        ...(this.extractPagePattern<T>(
          pagePattern,
          dom,
          url,
        ) as ExtractionResult[]),
      );
    }

    return results as T[];
  }

  private extractPagePattern<T = ExtractionResult>(
    pagePattern: PatternField,
    dom: HtmlBuilder,
    url?: string,
  ): T[] {
    const urlKey = pagePattern.meta?.pageUrlKey ?? 'url';
    const textKey = pagePattern.meta?.pageTextKey ?? 'text';
    const nodes = this.findByPattern(pagePattern, dom);

    return nodes.map((node) => {
      const urlNode = dom.findXpathInContext('./@href', node)[0];
      const textNode = dom.findXpathInContext(
        './text()[normalize-space()]',
        node,
      )[0];
      const rawUrl = urlNode ? dom.value(urlNode) : dom.value(node);
      const resolvedUrl =
        url && rawUrl && !rawUrl.startsWith('http')
          ? (() => {
              try {
                return new URL(rawUrl, url).toString();
              } catch {
                return rawUrl;
              }
            })()
          : rawUrl;
      return {
        [urlKey]: resolvedUrl,
        [textKey]: textNode ? dom.value(textNode) : dom.value(node),
      } as T;
    });
  }

  private extractFromContainers<T = ExtractionResult>(
    containerPattern: PatternField,
    fieldPatterns: PatternField[],
    dom: HtmlBuilder,
    url?: string,
  ): T[] {
    const containers = this.findByPattern(containerPattern, dom);
    const results: T[] = [];

    for (const container of containers) {
      const item: Record<string, unknown> = {};

      for (const pattern of fieldPatterns) {
        const value = this.extractFieldValue(pattern, dom, container, url);
        if (value !== null) {
          item[pattern.key] = value;
        }
      }

      if (Object.keys(item).length > 0) {
        results.push(item as T);
      }
    }

    return results;
  }

  private extractWithoutContainer<T = ExtractionResult>(
    patterns: PatternField[],
    dom: HtmlBuilder,
    url?: string,
  ): T[] {
    const item: Record<string, unknown> = {};

    for (const pattern of patterns) {
      const value = this.extractFieldValue(pattern, dom, undefined, url);
      if (value !== null) {
        item[pattern.key] = value;
      }
    }

    return Object.keys(item).length > 0 ? [item as T] : [];
  }

  private extractFieldValue(
    pattern: PatternField,
    dom: HtmlBuilder,
    context?: HtmlNode,
    url?: string,
  ): unknown {
    if (pattern.patternType !== 'xpath') {
      throw new Error(
        'Only xpath pattern type is supported in scraper-html mode',
      );
    }

    const nodes = this.findByPattern(pattern, dom, context);
    if (nodes.length === 0) {
      return null;
    }

    if (pattern.meta?.multiple) {
      return this.extractMultipleValues(nodes, pattern, dom, url);
    }

    const value = this.getNodeValue(nodes[0], pattern.returnType, dom);
    return this.pipeEngine && pattern.pipes
      ? this.pipeEngine.apply(value, pattern.pipes, url)
      : value;
  }

  private extractMultipleValues(
    nodes: HtmlNode[],
    pattern: PatternField,
    dom: HtmlBuilder,
    url?: string,
  ): unknown {
    if (pattern.pipes?.merge) {
      const rawValues = nodes.map((node) =>
        this.getNodeValue(node, pattern.returnType, dom),
      );

      let merged: string;
      const mergeType = pattern.pipes.merge;

      if (mergeType === 'with comma') {
        merged = rawValues.join(', ');
      } else {
        merged = rawValues.join(' ');
      }

      return this.pipeEngine
        ? this.pipeEngine.apply(merged, pattern.pipes, url)
        : merged;
    }

    const cleanedValues = nodes.map((node) => {
      const value = this.getNodeValue(node, pattern.returnType, dom);
      return this.pipeEngine && pattern.pipes
        ? this.pipeEngine.apply(value, pattern.pipes, url)
        : value;
    });

    if (pattern.meta?.multiple === 'with comma') {
      return cleanedValues.join(', ');
    }

    if (pattern.meta?.multiline) {
      return cleanedValues.join(' ');
    }

    return cleanedValues;
  }

  private findByPattern(
    pattern: PatternField,
    dom: HtmlBuilder,
    context?: HtmlNode,
  ): HtmlNode[] {
    const allPatterns = [...pattern.patterns];
    if (pattern.meta?.alterPattern) {
      allPatterns.push(...pattern.meta.alterPattern);
    }

    for (const xpath of allPatterns) {
      try {
        const nodes = context
          ? this.findXpathInContext(xpath, context, dom)
          : dom.findXpath(xpath);

        if (nodes && nodes.length > 0) {
          return nodes;
        }
      } catch (error) {
        this.logger.debug(`XPath failed: ${xpath}`, error);
      }
    }

    return [];
  }

  private findXpathInContext(
    xpath: string,
    context: HtmlNode,
    dom: HtmlBuilder,
  ): HtmlNode[] {
    if (!context) {
      return [];
    }

    try {
      return dom.findXpathInContext(xpath, context) as HtmlNode[];
    } catch (error) {
      this.logger.debug(`Context XPath failed: ${xpath}`, error);
      return [];
    }
  }

  private getNodeValue(
    node: HtmlNode,
    returnType: 'text' | 'rawHTML',
    dom: HtmlBuilder,
  ): string {
    if (returnType === 'rawHTML') {
      return dom.htmlString(node);
    }
    return dom.value(node);
  }
}
