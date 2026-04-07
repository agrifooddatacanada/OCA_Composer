/**
 * Utilities for OCA package structure
 *
 * Canonical shape (Format 1): { type?: "oca_package/1.0", oca_bundle: { bundle, dependencies }, extensions? }
 * Format 3 adds top-level d (and optional type): https://github.com/agrifooddatacanada/OCA_package_standard
 *
 * Manual seed and builder working copy use canonical oca_bundle. Legacy top-level { bundle, dependencies } is coerced
 * at load (acceptOcaPackageOrNull) and at build start (coerceIfLegacyTopLevelBundle). getPackageBundle/getPackageDependencies
 * still accept flat for defensive reads.
 *
 * CHILD SCHEMA STORAGE: oca_bundle.dependencies — each item is a full bundle.
 */

import { langNameFromTwoLetters, langNameFromCodeOCA, normalizeToOCACode } from './languageUtils';

/**
 * Coerces only when the payload has legacy top-level `bundle` (+ optional `dependencies`) without `oca_bundle.bundle`.
 * Otherwise returns the input unchanged (no error). Does not validate loadability.
 */
export function coerceIfLegacyTopLevelBundle(pkg) {
  if (!pkg || typeof pkg !== "object") return pkg;
  if (pkg.oca_bundle?.bundle) return pkg;
  if (pkg.bundle) {
    const { bundle, dependencies = [], ...rest } = pkg;
    return {
      ...rest,
      type: rest.type || "oca_package/1.0",
      oca_bundle: {
        bundle,
        dependencies: Array.isArray(dependencies) ? dependencies : []
      }
    };
  }
  return pkg;
}

function hasRootBundle(pkg) {
  return Boolean(
    pkg &&
      typeof pkg === "object" &&
      pkg.oca_bundle &&
      typeof pkg.oca_bundle.bundle === "object" &&
      pkg.oca_bundle.bundle !== null
  );
}

export function acceptOcaPackageOrNull(pkg) {
  if (pkg == null) return null;
  const coerced = coerceIfLegacyTopLevelBundle(pkg);
  return hasRootBundle(coerced) ? coerced : null;
}

/**
 * Get the root bundle from an OCA package (canonical Format 1 / 3)
 * @param {Object} pkg - The OCA package object
 * @returns {Object|null} The bundle object or null if not found
 */
export const getPackageBundle = (pkg) => {
  if (!pkg) return null;
  if (pkg.oca_bundle?.bundle) return pkg.oca_bundle.bundle;
  return pkg.bundle ?? null;
};

/**
 * Get the dependencies array from an OCA package
 * @param {Object} pkg - The OCA package object
 * @returns {Array} The dependencies array (empty if not found)
 */
export const getPackageDependencies = (pkg) => {
  if (!pkg) return [];
  if (pkg.oca_bundle) {
    const d = pkg.oca_bundle.dependencies;
    return Array.isArray(d) ? d : [];
  }
  const d = pkg.dependencies;
  return Array.isArray(d) ? d : [];
};

/**
 * Get the root bundle's SAID (digest) from an OCA package
 * @param {Object} pkg - The OCA package object
 * @returns {string|null} The bundle digest or null if not found
 */
export const getPackageBundleId = (pkg) => {
  const bundle = getPackageBundle(pkg);
  return bundle?.d || null;
};

export const getRootCaptureBaseId = (pkg) => {
  const bundle = getPackageBundle(pkg);
  return bundle?.capture_base?.d ?? null;
};

/**
 * Get extensions from an OCA package
 * @param {Object} pkg - The OCA package object
 * @returns {Object} The extensions object (empty if not found)
 */
export const getPackageExtensions = (pkg) => {
  if (!pkg) return {};
  return pkg.extensions || {};
};

/**
 * Find a schema (bundle or dependency) by its SAID
 * @param {Object} pkg - The OCA package object
 * @param {string} schemaId - The SAID to search for
 * @returns {Object|null} The matching schema or null if not found
 */
export const findSchemaById = (pkg, schemaId) => {
  if (!pkg || !schemaId) return null;
  
  const bundle = getPackageBundle(pkg);
  if (bundle?.d === schemaId) {
    return bundle;
  }
  
  const dependencies = getPackageDependencies(pkg);
  return dependencies.find(dep => dep.d === schemaId) || null;
};

/**
 * Check if package is using the new official format (with oca_bundle wrapper)
 * @param {Object} pkg - The OCA package object
 * @returns {boolean} True if using new format
 */
export const isOfficialPackageFormat = (pkg) => {
  return pkg?.oca_bundle !== undefined;
};

/**
 * Extract all unique languages from an OCA package (parent + all child schemas)
 * @param {Object} pkg - The OCA package object
 * @returns {Array<string>} Array of language names (e.g., ["English", "French"])
 */
export const getPackageLanguages = (pkg) => {
  const languageSet = new Set();
  
  // Helper to extract languages from a schema
  const extractFromSchema = (schemaData) => {
    if (!schemaData?.overlays) return;
    
    // Check meta overlays for languages
    if (Array.isArray(schemaData.overlays.meta)) {
      schemaData.overlays.meta.forEach(metaOverlay => {
        if (metaOverlay.language) {
          // Convert any language code format to language name
          // Try OCA code (3-letter: eng, fra) first, then UI code (2-letter: en, fr)
          const langName = langNameFromCodeOCA(metaOverlay.language) || 
                          langNameFromTwoLetters(metaOverlay.language);
          if (langName) {
            languageSet.add(langName);
          }
        }
      });
    }
    
    // Check other language-specific overlays
    ['label', 'information', 'entry'].forEach(overlayType => {
      const overlay = schemaData.overlays[overlayType];
      if (Array.isArray(overlay)) {
        overlay.forEach(item => {
          if (item.language) {
            // Convert any language code format to language name
            // Try OCA code (3-letter: eng, fra) first, then UI code (2-letter: en, fr)
            const langName = langNameFromCodeOCA(item.language) || 
                            langNameFromTwoLetters(item.language);
            if (langName) {
              languageSet.add(langName);
            }
          }
        });
      }
    });
  };
  
  // Extract from parent schema
  const bundle = getPackageBundle(pkg);
  if (bundle) {
    extractFromSchema(bundle);
  }
  
  const childSchemas = getPackageDependencies(pkg);
  
  if (Array.isArray(childSchemas)) {
    childSchemas.forEach(childBundle => {
      extractFromSchema(childBundle);
    });
  }
  
  return Array.from(languageSet);
};

export const isOcaPackageLibSaidLength = (value) =>
  typeof value === "string" && value.length === 44;

function provisionalBundleDigest44() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
  const arr = new Uint8Array(44);
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    crypto.getRandomValues(arr);
  } else {
    for (let i = 0; i < 44; i++) arr[i] = Math.floor(Math.random() * 256);
  }
  return Array.from(arr, (b) => chars[b % chars.length]).join("");
}

function rewriteRefsInCaptureAttributes(attributes, idMap) {
  if (!attributes || typeof attributes !== "object") return;
  Object.keys(attributes).forEach((name) => {
    const value = attributes[name];
    if (typeof value === "string" && value.startsWith("refs:")) {
      const id = value.slice(5);
      if (idMap[id]) attributes[name] = `refs:${idMap[id]}`;
    } else if (
      Array.isArray(value) &&
      value[0] &&
      typeof value[0] === "string" &&
      value[0].startsWith("refs:")
    ) {
      const id = value[0].slice(5);
      if (idMap[id]) attributes[name] = [`refs:${idMap[id]}`];
    }
  });
}

export function normalizeNonSaidBundleDigestsForOcaPackage(pkg, adcMerged) {
  if (!pkg || typeof pkg !== "object" || !adcMerged || typeof adcMerged !== "object") return;

  const root = getPackageBundle(pkg);
  const deps = getPackageDependencies(pkg) || [];
  const bundles = [root, ...deps].filter(Boolean);

  const idMap = {};
  bundles.forEach((b) => {
    if (!b?.d || isOcaPackageLibSaidLength(b.d)) return;
    if (!idMap[b.d]) idMap[b.d] = provisionalBundleDigest44();
  });

  if (Object.keys(idMap).length === 0) return;

  bundles.forEach((b) => {
    if (b.d && idMap[b.d]) b.d = idMap[b.d];
    rewriteRefsInCaptureAttributes(b.capture_base?.attributes, idMap);
  });

  Object.keys(idMap).forEach((oldId) => {
    const newId = idMap[oldId];
    if (adcMerged[oldId] !== undefined) {
      adcMerged[newId] = adcMerged[oldId];
      delete adcMerged[oldId];
    }
  });
}
