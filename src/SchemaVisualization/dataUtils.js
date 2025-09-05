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

  // Get label overlay for field labels
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
 * Extract schema data directly from OCA package for visualization
 * @param {Object} ocaPackage - OCA package object
 * @param {string} language - Language code (optional)
 * @returns {Object} Processed schema data for visualization
 */
export const extractSchemaDataFromPackage = (ocaPackage, language = "eng") => {
  if (!ocaPackage) {
    return null;
  }

  // Extract labels from the bundle's overlays
  const labelOverlay =
    ocaPackage.bundle.overlays?.label?.find((l) => l.language === language) ||
    ocaPackage.bundle.overlays?.label?.[0] ||
    {};
  const labels = labelOverlay.attribute_labels || {};

  return {
    dependencies: ocaPackage.dependencies || [],
    attributes: ocaPackage.bundle.capture_base?.attributes || {},
    overlays: ocaPackage.bundle.overlays || {},
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

  // If it's the root schema (either by bundle digest, capture base digest, by "root" ID, or by schema name)
  if (
    schemaId === ocaPackage.bundle?.d ||
    schemaId === ocaPackage.bundle?.capture_base?.d ||
    schemaId === "root"
  ) {
    // Get the schema name and description from meta overlays
    const metaOverlay =
      ocaPackage.bundle.overlays?.meta?.find((m) => m.language === language) ||
      ocaPackage.bundle.overlays?.meta?.[0];
    const schemaName = metaOverlay?.name || ocaPackage.bundle?.d || "root";
    const schemaDescription = metaOverlay?.description || "";

    return {
      schemaId: ocaPackage.bundle.d || "root",
      schemaName,
      schemaDescription,
      attributes: ocaPackage.bundle.capture_base?.attributes || {},
      overlays: ocaPackage.bundle.overlays || {},
      labels:
        ocaPackage.bundle.overlays?.label?.find((l) => l.language === language)
          ?.attribute_labels || {}
    };
  }

  // Check if it's the root schema by name (e.g., "sample_questionnaire")
  const rootMetaOverlay =
    ocaPackage.bundle.overlays?.meta?.find((m) => m.language === language) ||
    ocaPackage.bundle.overlays?.meta?.[0];
  if (rootMetaOverlay?.name === schemaId) {
    return {
      schemaId: ocaPackage.bundle.d || "root",
      schemaName: rootMetaOverlay.name,
      schemaDescription: rootMetaOverlay.description || "",
      attributes: ocaPackage.bundle.capture_base?.attributes || {},
      overlays: ocaPackage.bundle.overlays || {},
      labels:
        ocaPackage.bundle.overlays?.label?.find((l) => l.language === language)
          ?.attribute_labels || {}
    };
  }

  // If it's a dependency schema - try to find by digest first
  let dependency = ocaPackage.dependencies?.find((dep) => dep.d === schemaId);

  // If not found by digest, try to find by name in meta overlays
  if (!dependency && ocaPackage.dependencies) {
    dependency = ocaPackage.dependencies.find((dep) => {
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
  if (ocaPackage.bundle?.capture_base?.attributes) {
    const rootAttributes = ocaPackage.bundle.capture_base.attributes;
    for (const [key, value] of Object.entries(rootAttributes)) {
      if (typeof value === "string" && value.startsWith("refn:") && key === schemaId) {
        // Check if this placeholder schema now has actual attributes in dependencies
        const dependencyWithAttributes = ocaPackage.dependencies?.find((dep) => {
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
