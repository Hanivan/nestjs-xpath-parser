import { JSDOM } from 'jsdom';
import * as libxmljs from 'libxmljs2';
import { EngineHtmlBuilder } from '../enums';
import { HtmlNode, HtmlNodeArray } from '../types';

/**
 * Type augmentation for libxmljs error handling
 * See: src/types/libxmljs.d.ts for the full type definition
 */
type LibxmljsModule = typeof libxmljs & {
  errorCatchingHandler?: ((message: string) => void) | undefined;
};

const libxmljsWithHandlers = libxmljs as LibxmljsModule;

export class HtmlBuilder {
  private engine: EngineHtmlBuilder;
  private dom: libxmljs.Document | JSDOM;
  private originalErrorHandler?: ((message: string) => void) | undefined;

  private constructor(
    plainText: string,
    useJSDom: boolean = false,
    contentType: 'text/html' | 'text/xml' = 'text/html',
    suppressErrors: boolean = false,
  ) {
    this.engine = useJSDom
      ? EngineHtmlBuilder.JSDOM
      : EngineHtmlBuilder.LIBXMLJS;

    if (this.engine === EngineHtmlBuilder.LIBXMLJS && suppressErrors) {
      // Suppress libxmljs XPath errors by replacing the error handler
      this.originalErrorHandler = libxmljsWithHandlers.errorCatchingHandler;
      libxmljsWithHandlers.errorCatchingHandler = () => {
        // Silently ignore XPath errors
      };
    }

    if (this.engine === EngineHtmlBuilder.JSDOM) {
      this.dom = new JSDOM(plainText);
    } else {
      this.dom =
        contentType === 'text/html'
          ? libxmljs.parseHtml(plainText)
          : libxmljs.parseXml(plainText);
    }
  }

  static loadHtml(
    plainText: string,
    useJSDom: boolean = false,
    contentType: 'text/html' | 'text/xml' = 'text/html',
    suppressErrors: boolean = false,
  ): HtmlBuilder {
    return new HtmlBuilder(plainText, useJSDom, contentType, suppressErrors);
  }

  /**
   * Clean up error handler suppression
   */
  destroy(): void {
    if (
      this.originalErrorHandler !== undefined &&
      this.engine === EngineHtmlBuilder.LIBXMLJS
    ) {
      // Restore the original error handler
      libxmljsWithHandlers.errorCatchingHandler = this.originalErrorHandler;
      this.originalErrorHandler = undefined;
    }
  }

  getXpath(expression: string): HtmlNode {
    if (this.engine === EngineHtmlBuilder.JSDOM) {
      const dom = this.dom as JSDOM;
      const node = dom.window.document.evaluate(
        expression,
        dom.window.document,
        null,
        dom.window.XPathResult.FIRST_ORDERED_NODE_TYPE,
        null,
      ).singleNodeValue;
      return node as Element | null;
    } else {
      const dom = this.dom as libxmljs.Document;
      return dom.get(expression);
    }
  }

  findXpath(expression: string): HtmlNodeArray {
    if (this.engine === EngineHtmlBuilder.JSDOM) {
      const dom = this.dom as JSDOM;
      const iterator = dom.window.document.evaluate(
        expression,
        dom.window.document,
        null,
        dom.window.XPathResult.ORDERED_NODE_ITERATOR_TYPE,
        null,
      );
      const nodes: Element[] = [];
      let node = iterator.iterateNext();
      while (node) {
        nodes.push(node as Element);
        node = iterator.iterateNext();
      }
      return nodes;
    } else {
      const dom = this.dom as libxmljs.Document;
      return dom.find(expression) as HtmlNodeArray;
    }
  }

  getValueXML(node: HtmlNode): string {
    if (!node) return '';

    if (this.engine === EngineHtmlBuilder.JSDOM) {
      return (node as Element).textContent?.trim() || '';
    }

    const libxmlNode = node as libxmljs.Node;

    // Attribute node: use value() method (only Attribute has value())
    if ('value' in libxmlNode && typeof libxmlNode.value === 'function') {
      return (libxmlNode as { value: () => string }).value().trim();
    }

    // Element or Text node: use text() method if available
    if ('text' in libxmlNode && typeof libxmlNode.text === 'function') {
      return this.normalizeWhitespace(libxmlNode.text());
    }

    // Fallback: use toString() method
    return this.normalizeWhitespace(libxmlNode.toString());
  }

  private normalizeWhitespace(text: string): string {
    return text.trim().replace(/\s+/g, ' ');
  }

  value(node: HtmlNode): string {
    return this.getValueXML(node);
  }

  htmlString(node: HtmlNode): string {
    if (!node) return '';

    if (this.engine === EngineHtmlBuilder.JSDOM) {
      return (node as Element).innerHTML || '';
    }

    return (node as libxmljs.Node).toString();
  }

  getDom(): libxmljs.Document | JSDOM {
    return this.dom;
  }

  getDocument(): libxmljs.Document | Document {
    if (this.engine === EngineHtmlBuilder.JSDOM) {
      return (this.dom as JSDOM).window.document;
    }
    return this.dom as libxmljs.Document;
  }

  getEngine(): EngineHtmlBuilder {
    return this.engine;
  }

  /**
   * Find nodes using XPath relative to a context node
   */
  findXpathInContext(expression: string, contextNode: HtmlNode): HtmlNodeArray {
    if (this.engine === EngineHtmlBuilder.JSDOM) {
      const dom = this.dom as JSDOM;
      const iterator = dom.window.document.evaluate(
        expression,
        contextNode as Node,
        null,
        dom.window.XPathResult.ORDERED_NODE_ITERATOR_TYPE,
        null,
      );
      const nodes: Element[] = [];
      let node = iterator.iterateNext();
      while (node) {
        nodes.push(node as Element);
        node = iterator.iterateNext();
      }
      return nodes;
    } else {
      const element = contextNode as libxmljs.Element;
      return element.find(expression) as HtmlNodeArray;
    }
  }
}
