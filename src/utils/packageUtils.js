/**
 * Utilities for handling OCA package structure variations
 * 
 * The OCA ecosystem supports multiple package formats:
 * 
 * Format 1 (HCF Endpoint): { type: "oca_package/1.0", oca_bundle: { bundle: {...}, dependencies: [...] }, extensions: {...} }
 *   - Returned by HCF schema generation endpoint
 *   - Base structure for OCA packages with oca_bundle wrapper
 * 
 * Format 2 (Draft): { bundle: {...}, dependencies: [...] }
 *   - Internal draft format used during initial multi-schema development
 *   - Direct bundle structure without oca_bundle wrapper
 *   - Still supported for backward compatibility
 * 
 * Format 3 (OCA Package Standard): { d: "SAID", type: "oca_package/1.0", oca_bundle: {...}, extensions: {...} }
 *   - Full OCA Package standard: https://github.com/agrifooddatacanada/OCA_package_standard
 *   - Includes top-level SAID (d) for package integrity
 *   - Supports community extensions following OCA Package Design Requirements
 *   - This app generates Format 1/3 packages (with extensions, may not include top-level SAID)
 * 
 * These utilities provide a consistent interface to access package data regardless of format.
 * 
 * CHILD SCHEMA STORAGE:
 * Child schemas are stored in oca_bundle.dependencies (Format 1/3) or dependencies (Format 2) as an array of bundles.
 * Each dependency is a complete OCA bundle that can be referenced by the parent schema.
 */

import { langNameFromCodeUI } from './languageUtils';

/**
 * Get the root bundle from an OCA package, handling both format variations
 * @param {Object} ocaPackage - The OCA package object
 * @returns {Object|null} The bundle object or null if not found
 */
export const getPackageBundle = (ocaPackage) => {
  if (!ocaPackage) return null;
  return ocaPackage.oca_bundle?.bundle || ocaPackage.bundle || null;
};

/**
 * Get the dependencies array from an OCA package, handling both format variations
 * @param {Object} ocaPackage - The OCA package object
 * @returns {Array} The dependencies array (empty if not found)
 */
export const getPackageDependencies = (ocaPackage) => {
  if (!ocaPackage) return [];
  return ocaPackage.oca_bundle?.dependencies || ocaPackage.dependencies || [];
};

/**
 * Get the root bundle's SAID (digest) from an OCA package
 * @param {Object} ocaPackage - The OCA package object
 * @returns {string|null} The bundle digest or null if not found
 */
export const getPackageBundleId = (ocaPackage) => {
  const bundle = getPackageBundle(ocaPackage);
  return bundle?.d || null;
};

/**
 * Get extensions from an OCA package
 * @param {Object} ocaPackage - The OCA package object
 * @returns {Object} The extensions object (empty if not found)
 */
export const getPackageExtensions = (ocaPackage) => {
  if (!ocaPackage) return {};
  return ocaPackage.extensions || {};
};

/**
 * Find a schema (bundle or dependency) by its SAID
 * @param {Object} ocaPackage - The OCA package object
 * @param {string} schemaId - The SAID to search for
 * @returns {Object|null} The matching schema or null if not found
 */
export const findSchemaById = (ocaPackage, schemaId) => {
  if (!ocaPackage || !schemaId) return null;
  
  const bundle = getPackageBundle(ocaPackage);
  if (bundle?.d === schemaId) {
    return bundle;
  }
  
  const dependencies = getPackageDependencies(ocaPackage);
  return dependencies.find(dep => dep.d === schemaId) || null;
};

/**
 * Check if package is using the new official format (with oca_bundle wrapper)
 * @param {Object} ocaPackage - The OCA package object
 * @returns {boolean} True if using new format
 */
export const isOfficialPackageFormat = (ocaPackage) => {
  return ocaPackage?.oca_bundle !== undefined;
};

/**
 * Extract all unique languages from an OCA package (parent + all child schemas)
 * @param {Object} ocaPackage - The OCA package object
 * @returns {Array<string>} Array of language names (e.g., ["English", "French"])
 */
export const getPackageLanguages = (ocaPackage) => {
  const languageSet = new Set();
  
  // Helper to extract languages from a schema
  const extractFromSchema = (schemaData) => {
    if (!schemaData?.overlays) return;
    
    // Check meta overlays for languages
    if (Array.isArray(schemaData.overlays.meta)) {
      schemaData.overlays.meta.forEach(metaOverlay => {
        if (metaOverlay.language) {
          // Convert OCA code (eng, fra) to language name (English, French)
          const langName = langNameFromCodeUI(metaOverlay.language) || 
                          (metaOverlay.language === 'eng' ? 'English' : metaOverlay.language);
          languageSet.add(langName);
        }
      });
    }
    
    // Check other language-specific overlays
    ['label', 'information', 'entry'].forEach(overlayType => {
      const overlay = schemaData.overlays[overlayType];
      if (Array.isArray(overlay)) {
        overlay.forEach(item => {
          if (item.language) {
            const langName = langNameFromCodeUI(item.language) || 
                            (item.language === 'eng' ? 'English' : item.language);
            languageSet.add(langName);
          }
        });
      }
    });
  };
  
  // Extract from parent schema
  const bundle = getPackageBundle(ocaPackage);
  if (bundle) {
    extractFromSchema(bundle);
  }
  
  // Extract from child schemas (stored in dependencies array)
  const childSchemas = ocaPackage?.oca_bundle?.dependencies || [];
  
  if (Array.isArray(childSchemas)) {
    childSchemas.forEach(childBundle => {
      extractFromSchema(childBundle);
    });
  }
  
  return Array.from(languageSet);
};
