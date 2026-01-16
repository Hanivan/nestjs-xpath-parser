/**
 * Examples Index
 *
 * This file exports all example demonstrations for easy access.
 * Each example can be run independently using ts-node or node.
 *
 * Usage:
 *   ts-node src/examples/01-basic-product-scraping.ts
 *   ts-node src/examples/02-xpath-validation.ts
 *   ... etc
 */

export * from './01-basic-product-scraping';
export * from './02-xpath-validation';
export * from './03-data-cleaning-pipes';
export * from './04-alternative-patterns';
export * from './05-xml-parsing';
export * from './06-real-world-ecommerce';
export * from './08-configuration-options';
export * from './09-custom-pipes';

// Export demonstration functions with descriptive names
export { demonstrateBasicProductScraping } from './01-basic-product-scraping';
export { demonstrateXPathValidation } from './02-xpath-validation';
export { demonstrateDataCleaningPipes } from './03-data-cleaning-pipes';
export { demonstrateAlternativePatterns } from './04-alternative-patterns';
export { demonstrateXmlParsing } from './05-xml-parsing';
export { demonstrateRealWorldEcommerce } from './06-real-world-ecommerce';
export {
  example1_SuppressXPathErrors,
  example2_EngineSelection_Libxmljs,
  example3_EngineSelection_JSDOM,
  example4_CompleteConfiguration,
  example5_XPathValidationWithErrorSuppression,
} from './08-configuration-options';
export {
  predefinedPipesExample,
  regexPipeExample,
  regexPipeWithMergeExample,
  parseAsURLPipeExample,
  chainPipesExample,
  customPipeExample,
  customPipeWithBaseUrlExample,
} from './09-custom-pipes';
