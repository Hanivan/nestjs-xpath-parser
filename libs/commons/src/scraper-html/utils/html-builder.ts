import { JSDOM } from 'jsdom';
import * as libxmljs from 'libxmljs2';
import { EngineHtmlBuilder } from '../enums';

export class HtmlBuilder {
  private engine: EngineHtmlBuilder;
  private dom: libxmljs.Document | JSDOM;

  private constructor(
    plainText: string,
    useJSDom: boolean = false,
    contentType: 'text/html' | 'text/xml' = 'text/html',
  ) {
    this.engine = useJSDom ? EngineHtmlBuilder.JSDOM : EngineHtmlBuilder.LIBXMLJS;

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
  ): HtmlBuilder {
    return new HtmlBuilder(plainText, useJSDom, contentType);
  }

  getXpath(expression: string): libxmljs.Element | Element | null {
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
      return dom.get(expression) as libxmljs.Element | null;
    }
  }

  findXpath(expression: string): (libxmljs.Element | Element)[] {
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
      return dom.find(expression) as libxmljs.Element[];
    }
  }

  getValueXML(node: libxmljs.Element | Element | null): string {
    if (!node) return '';

    if (this.engine === EngineHtmlBuilder.JSDOM) {
      const element = node as Element;
      return element.textContent?.trim() || '';
    } else {
      const element = node as any;

      // Check if it's a text node (has toString but not text method)
      if (typeof element.text === 'function') {
        // It's an element node
        const text = element.text().trim();
        // Normalize whitespace: replace multiple spaces with single space
        return text.replace(/\s+/g, ' ').trim();
      } else {
        // It's a text or attribute node, use toString()
        const text = element.toString().trim();
        // Normalize whitespace: replace multiple spaces with single space
        return text.replace(/\s+/g, ' ').trim();
      }
    }
  }

  value(node: libxmljs.Element | Element | null): string {
    return this.getValueXML(node);
  }

  htmlString(node: libxmljs.Element | Element | null): string {
    if (!node) return '';

    if (this.engine === EngineHtmlBuilder.JSDOM) {
      const element = node as Element;
      return element.innerHTML || '';
    } else {
      const element = node as libxmljs.Element;
      return element.toString();
    }
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
  findXpathInContext(
    expression: string,
    contextNode: libxmljs.Element | Element,
  ): (libxmljs.Element | Element)[] {
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
      return element.find(expression) as libxmljs.Element[];
    }
  }
}
