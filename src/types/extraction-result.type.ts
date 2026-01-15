/**
 * Base type for extraction results
 * All extracted data will be indexed by string keys
 */
export type ExtractionResult = Record<string, unknown>;

/**
 * Helper type for defining extraction result interfaces
 * Use this as a base for your custom interfaces
 *
 * @example
 * ```typescript
 * interface Product extends BaseExtractionResult {
 *   name: string;
 *   price: string;
 * }
 * ```
 */
export type BaseExtractionResult = Record<string, unknown>;
