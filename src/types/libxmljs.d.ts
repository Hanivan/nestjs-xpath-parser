/**
 * Type augmentations for libxmljs2
 *
 * This module extends the official libxmljs2 type definitions with internal
 * properties and methods that exist at runtime but are not included in the official types.
 */

import type { Element, Node } from 'libxmljs2';

declare module 'libxmljs2' {
  /**
   * Handler function for catching and processing XPath/parser errors.
   * When set, this function receives error messages that would otherwise
   * be printed to stderr.
   */
  type ErrorCatchingHandler = (message: string) => void;

  /**
   * Extend the libxmljs module with internal error handling properties.
   * These properties exist at runtime but are not part of the public API.
   */
  export const errorCatchingHandler: ErrorCatchingHandler | undefined;

  /**
   * Extend Node interface with methods that exist at runtime.
   * The base Node type doesn't include text() and value() methods,
   * but these are available on Element and Attribute subclasses.
   */
  export interface Node {
    /**
     * Get the text content of the node.
     * This method exists on Element and Text nodes at runtime.
     */
    text?(): string;
  }

  /**
   * Extend Element interface (already has text() method in base types).
   */
  export interface Element {
    text(): string;
  }
}
