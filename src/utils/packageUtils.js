/**
 * Utilities for handling OCA package structure variations
 * 
 * The OCA ecosystem has evolved to include two package formats:
 * 
 * Format 1 (Legacy/Internal): { bundle: {...}, dependencies: [...] }
 * Format 2 (Official): { type: "oca_package/1.0", oca_bundle: { bundle: {...}, dependencies: [...] }, extensions: {...} }
 * 
 * These utilities provide a consistent interface to access package data regardless of format.
 */

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
