import { JSDOM } from 'jsdom';
import * as libxmljs from 'libxmljs2';
import { EngineHtmlBuilder } from '../enums';
import { HtmlNode, HtmlNodeArray } from '../types';

export class HtmlBuilder {
  private engine: EngineHtmlBuilder;
  private dom: libxmljs.Document | JSDOM;

  private constructor(
    plainText: string,
    useJSDom: boolean = false,
    contentType: 'text/html' | 'text/xml' = 'text/html',
  ) {
    this.engine = useJSDom
      ? EngineHtmlBuilder.JSDOM
      : EngineHtmlBuilder.LIBXMLJS;

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
      const element = node as Element;
      return element.textContent?.trim() || '';
    } else {
      const element = node as libxmljs.Node;

      // Check if it's a text node (has toString but not text method)
      if ('text' in element && typeof element.text === 'function') {
        // It's an element node
        const text = (element.text as () => string)().trim();
        // Normalize whitespace: replace multiple spaces with single space
        return text.replace(/\s+/g, ' ').trim();
      } else {
        // It's a text or attribute node, use toString()
        const text = (element.toString as () => string)().trim();
        // Normalize whitespace: replace multiple spaces with single space
        return text.replace(/\s+/g, ' ').trim();
      }
    }
  }

  value(node: HtmlNode): string {
    return this.getValueXML(node);
  }

  htmlString(node: HtmlNode): string {
    if (!node) return '';

    if (this.engine === EngineHtmlBuilder.JSDOM) {
      const element = node as Element;
      return element.innerHTML || '';
    } else {
      const element = node as libxmljs.Node;
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
