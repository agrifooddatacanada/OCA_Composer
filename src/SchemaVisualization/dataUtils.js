/**
 * Utility functions for processing OCA schema data for visualization
 */

/**
 * Universal truncation function for all text in the application
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length before truncation
 * @returns {string} Truncated text with "..." if needed
 */
export const truncateText = (text, maxLength) => {
  if (!text || text.length <= maxLength) {
    return text;
  }
  const truncateAt = maxLength - 3; // Reserve 3 chars for "..."
  return `${text.substring(0, truncateAt)}...`;
};

/**
 * Create a dependency map from OCA package dependencies
 * @param {Array} dependencies - Array of dependency objects
 * @returns {Object} Map of dependency IDs to dependency objects
 */
export const createDependencyMap = (dependencies) => {
  const depMap = {};
  dependencies.forEach((dep) => {
    // Dependencies have flat structure: { capture_base: {...}, overlays: {...} }
    depMap[dep.d || dep.id] = dep;
  });

  return depMap;
};

// Field truncation constant
const FIELD_NAME_MAX_LENGTH = 35;

/**
 * Process attributes from schema and create field objects
 * @param {Object} attributes - The attributes object from schema
 * @param {Object} labels - Optional labels for field names
 * @returns {Array} Array of field objects
 */
export const processAttributes = (attributes, labels = {}) => {
  if (!attributes || typeof attributes !== "object") {
    return [];
  }

  return Object.entries(attributes).map(([key, value]) => {
    const fieldName = labels[key] || key;
    const isReference = typeof value === "string" && value.startsWith("refs:");
    const isPlaceholder = typeof value === "string" && value.startsWith("refn:");

    // Truncate field name if it's too long
    const truncatedName = truncateText(fieldName, FIELD_NAME_MAX_LENGTH);

    return {
      name: truncatedName,
      originalName: fieldName,
      attributeKey: key,  // The actual attribute key for schema lookups
      type: value,
      isReference,
      isPlaceholder
    };
  });
};

/**
 * Get dependency information by ID
 * @param {string} depId - Dependency ID
 * @param {Object} dependencyMap - Map of dependencies
 * @param {string} language - Language code
 * @returns {Object} Dependency info with name and fields
 */
export const getDependencyInfo = (depId, dependencyMap, language = "eng") => {
  const dependency = dependencyMap[depId];
  if (!dependency) {
    return {
      name: depId,
      fields: []
    };
  }

  // Get meta overlay for name
  const metaOverlay =
    dependency.overlays?.meta?.find((m) => m.language === language) ||
    dependency.overlays?.meta?.[0];
  const name = metaOverlay?.name || depId;

  // Get label overlay for field labels - LDAD changes will be saved directly to overlays
  const labelOverlay =
    dependency.overlays?.label?.find((l) => l.language === language) ||
    dependency.overlays?.label?.[0];
  const labels = labelOverlay?.attribute_labels || {};

  // Process attributes into fields
  const fields = processAttributes(dependency.capture_base?.attributes || {}, labels);

  return {
    name,
    fields
  };
};

/**
 * Normalize OCA package structure to handle different formats
 * @param {Object} ocaPackage - Raw OCA package 
 * @returns {Object} Normalized package with consistent structure
 */
const normalizeOCAPackage = (ocaPackage) => {
  if (!ocaPackage) return null;
  
  // Handle oca_package format: { oca_bundle: { bundle: {...}, dependencies: [...] }, extensions: {...} }
  if (ocaPackage.oca_bundle) {
    return {
      bundle: ocaPackage.oca_bundle.bundle,
      dependencies: ocaPackage.oca_bundle.dependencies || [],
      extensions: ocaPackage.extensions || ocaPackage.oca_bundle.extensions || {}
    };
  }
  
  // Handle direct format: { bundle: {...}, dependencies: [...], extensions: {...} }
  return ocaPackage;
};

/**
 * Extract schema data directly from OCA package for visualization
 * @param {Object} ocaPackage - OCA package object
 * @param {string} language - Language code (optional)
 * @param {Object} lanAttributeRowData - Updated language attribute data from LDAD
 * @returns {Object} Processed schema data for visualization
 */
export const extractSchemaDataFromPackage = (ocaPackage, language = "eng") => {
  if (!ocaPackage) {
    return null;
  }

  // Normalize package structure to handle both formats
  const normalizedPackage = normalizeOCAPackage(ocaPackage);
  if (!normalizedPackage) {
    return null;
  }

  // Extract labels from the bundle's overlays - no LDAD merging needed
  // LDAD changes will be saved directly to overlays by the Language Details component
  const labelOverlays = normalizedPackage.bundle.overlays?.label;
  const labelOverlay = Array.isArray(labelOverlays)
    ? (labelOverlays.find((l) => l.language === language) || labelOverlays[0] || {})
    : (labelOverlays || {});
  const labels = labelOverlay.attribute_labels || {};

  return {
    dependencies: normalizedPackage.dependencies || [],
    attributes: normalizedPackage.bundle.capture_base?.attributes || {},
    overlays: normalizedPackage.bundle.overlays || {},
    labels
  };
};

/**
 * Get schema data for a specific schema ID
 * @param {Object} ocaPackage - OCA package object
 * @param {string} schemaId - Schema ID to get data for
 * @param {string} language - Language code (optional)
 * @returns {Object} Schema data for the specified schema
 */

export const getSchemaDataById = (ocaPackage, schemaId, language = "eng") => {
  if (!ocaPackage || !schemaId) {
    return null;
  }

  // Normalize the package structure
  const normalizedPackage = normalizeOCAPackage(ocaPackage);
  if (!normalizedPackage) {
    return null;
  }

  // If it's the root schema (either by bundle digest, capture base digest, by "root" ID, or by schema name)
  if (
    schemaId === normalizedPackage.bundle?.d ||
    schemaId === normalizedPackage.bundle?.capture_base?.d ||
    schemaId === "root"
  ) {
    // Get the schema name and description from meta overlays
    const metaOverlay =
      normalizedPackage.bundle.overlays?.meta?.find((m) => m.language === language) ||
      normalizedPackage.bundle.overlays?.meta?.[0];
    const schemaName = metaOverlay?.name || normalizedPackage.bundle?.d || "root";
    const schemaDescription = metaOverlay?.description || "";

    return {
      schemaId: normalizedPackage.bundle.d || "root",
      schemaName,
      schemaDescription,
      attributes: normalizedPackage.bundle.capture_base?.attributes || {},
      overlays: normalizedPackage.bundle.overlays || {},
      labels:
        normalizedPackage.bundle.overlays?.label?.find((l) => l.language === language)
          ?.attribute_labels || {}
    };
  }

  // Check if it's the root schema by name (e.g., "sample_questionnaire")
  const rootMetaOverlay =
    normalizedPackage.bundle.overlays?.meta?.find((m) => m.language === language) ||
    normalizedPackage.bundle.overlays?.meta?.[0];
  if (rootMetaOverlay?.name === schemaId) {
    return {
      schemaId: normalizedPackage.bundle.d || "root",
      schemaName: rootMetaOverlay.name,
      schemaDescription: rootMetaOverlay.description || "",
      attributes: normalizedPackage.bundle.capture_base?.attributes || {},
      overlays: normalizedPackage.bundle.overlays || {},
      labels:
        normalizedPackage.bundle.overlays?.label?.find((l) => l.language === language)
          ?.attribute_labels || {}
    };
  }

  // If it's a dependency schema - try to find by digest first
  let dependency = normalizedPackage.dependencies?.find((dep) => dep.d === schemaId);

  // If not found by digest, try to find by name in meta overlays
  if (!dependency && normalizedPackage.dependencies) {
    dependency = normalizedPackage.dependencies.find((dep) => {
      const metaOverlay =
        dep.overlays?.meta?.find((m) => m.language === language) ||
        dep.overlays?.meta?.[0];
      return metaOverlay?.name === schemaId;
    });
  }

  if (dependency) {
    // Get the schema name and description from meta overlays
    const metaOverlay =
      dependency.overlays?.meta?.find((m) => m.language === language) ||
      dependency.overlays?.meta?.[0];
    const schemaName = metaOverlay?.name || dependency.d;
    const schemaDescription = metaOverlay?.description || "";

    return {
      schemaId: dependency.d,
      schemaName,
      schemaDescription,
      attributes: dependency.capture_base?.attributes || {},
      overlays: dependency.overlays || {},
      labels:
        dependency.overlays?.label?.find((l) => l.language === language)
          ?.attribute_labels || {}
    };
  }

  // If it's a placeholder schema (like q9)
  if (schemaId.startsWith("placeholder-")) {
    // Extract the field name from the placeholder ID
    const fieldName = schemaId.split("-").pop(); // e.g., "q9" from "placeholder-root-q9"
    return {
      schemaId,
      attributes: {}, // Placeholder schemas start with no attributes
      overlays: {},
      labels: {},
      isPlaceholder: true,
      fieldName
    };
  }

  // If it's a placeholder field name (like q9) - check if it exists in the root schema's refn fields
  const { getPackageBundle, getPackageDependencies } = require("../utils/packageUtils");
  const bundle = getPackageBundle(ocaPackage);
  const deps = getPackageDependencies(ocaPackage);
  
  if (bundle?.capture_base?.attributes) {
    const rootAttributes = bundle.capture_base.attributes;
    for (const [key, value] of Object.entries(rootAttributes)) {
      if (typeof value === "string" && value.startsWith("refn:") && key === schemaId) {
        // Check if this placeholder schema now has actual attributes in dependencies
        const dependencyWithAttributes = deps?.find((dep) => {
          const metaOverlay =
            dep.overlays?.meta?.find((m) => m.language === language) ||
            dep.overlays?.meta?.[0];
          return metaOverlay?.name === schemaId;
        });

        if (
          dependencyWithAttributes &&
          dependencyWithAttributes.capture_base?.attributes
        ) {
          // This placeholder schema now has attributes, treat it as a real schema
          const metaOverlay =
            dependencyWithAttributes.overlays?.meta?.find(
              (m) => m.language === language
            ) || dependencyWithAttributes.overlays?.meta?.[0];
          const schemaName = metaOverlay?.name || dependencyWithAttributes.d;
          const schemaDescription = metaOverlay?.description || "";

          return {
            schemaId: dependencyWithAttributes.d,
            schemaName,
            schemaDescription,
            attributes: dependencyWithAttributes.capture_base.attributes || {},
            overlays: dependencyWithAttributes.overlays || {},
            labels:
              dependencyWithAttributes.overlays?.label?.find(
                (l) => l.language === language
              )?.attribute_labels || {}
          };
        }

        // Still a placeholder with no attributes
        return {
          schemaId,
          attributes: {}, // Placeholder schemas start with no attributes
          overlays: {},
          labels: {},
          isPlaceholder: true,
          fieldName: key
        };
      }
    }
  }

  return null;
};
