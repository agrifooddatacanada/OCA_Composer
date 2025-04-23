/**
 * SchemaTranslator module - Provides functionality for translating LinkML schemas to OCA format.
 * 
 * This module exports the main functionality for converting LinkML schemas to OCA bundles,
 * along with supporting validation and utility functions.
 */

// Main conversion functionality
export { translateLinkMLToOCA, validateYAMLSyntax, transformToPackage } from "./linkMLToOCA.ts";

// Validation functions
export { validateForOCATranslation } from "./validation.ts";

// Types
export type { LinkMLSchema, OCABundle, OCAPackage } from "./types.ts";

// Core processing functions
export { mapLinkMLToOCABundle } from "./mapLinkMLToOCABundle.ts";
