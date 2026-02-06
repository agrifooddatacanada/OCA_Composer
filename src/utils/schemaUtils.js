/**
 * Schema utility functions for checking OCA package structure
 */

import { getPackageDependencies } from "./packageUtils";

/**
 * Check if an OCA package has a hierarchical (multi-schema) structure
 * @param {Object} ocaPackage - The OCA package to check
 * @returns {boolean} True if the package has dependencies, false otherwise
 */
export const hasMultipleSchemas = (ocaPackage) => {
  if (!ocaPackage) return false;
  
  const dependencies = getPackageDependencies(ocaPackage);
  
  return dependencies.length > 0;
};

/**
 * Check if an OCA package has actual dependencies with content
 * (not just empty placeholder dependencies)
 * @param {Object} ocaPackage - The OCA package to check
 * @returns {boolean} True if the package has dependencies with attributes
 */
export const hasActualDependencies = (ocaPackage) => {
  if (!ocaPackage) return false;
  
  const dependencies = getPackageDependencies(ocaPackage);
  
  return dependencies.length > 0 && dependencies.some(dep => {
    const attributes = dep?.capture_base?.attributes || {};
    return Object.keys(attributes).length > 0;
  });
};
