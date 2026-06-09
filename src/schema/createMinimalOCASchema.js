/**
 * Utilities for creating minimal OCA schema structures
 * 
 * Used by:
 * - ocaBuilder.js: Creating manual creation schemas and placeholder dependencies
 * - Any other code that needs to generate OCA schema structures programmatically
 */

/**
 * Creates a minimal OCA schema structure (bundle or dependency)
 * 
 * @param {string} schemaId - The schema digest/ID
 * @param {Object} options - Configuration options
 * @param {string} options.captureBaseId - Capture base digest (defaults to schemaId)
 * @param {string} options.captureBaseType - Capture base type version (default: "spec/capture_base/1.1")
 * @param {Object} options.attributes - Schema attributes map (default: {})
 * @param {string} options.classification - Schema classification (default: "RDF508")
 * @param {Array} options.flaggedAttributes - Flagged attributes array (default: [])
 * @param {Object} options.overlays - Overlay structure (default: {})
 * @param {boolean} options.asBundle - Return canonical oca_package with oca_bundle.bundle + dependencies (default: false)
 * @returns {Object} Single bundle/dependency schema, or full oca_package when asBundle
 */
export function createMinimalOCASchema(schemaId, options = {}) {
  const captureBaseId = options.captureBaseId || schemaId;
  
  const schema = {
    d: schemaId,
    capture_base: {
      d: captureBaseId,
      type: options.captureBaseType || "spec/capture_base/1.1",
      attributes: options.attributes || {},
      ...(options.classification !== undefined && { classification: options.classification }),
      flagged_attributes: options.flaggedAttributes || [],
    },
    overlays: options.overlays || {},
  };

  // Remove classification if explicitly set to empty/null unless specified
  if (options.classification === "" || options.classification === null) {
    delete schema.capture_base.classification;
  } else if (options.classification === undefined) {
    schema.capture_base.classification = "RDF508";
  }

  if (options.asBundle) {
    const dependencies = Array.isArray(options.dependencies) ? options.dependencies : [];
    return {
      type: options.packageType || "oca_package/1.0",
      oca_bundle: {
        bundle: schema,
        dependencies
      },
      ...(options.extensions !== undefined && { extensions: options.extensions })
    };
  }

  return schema;
}

/**
 * Creates a meta overlay structure for a schema
 * 
 * @param {string} captureBaseId - The capture base digest this overlay references
 * @param {string} language - Language code (e.g., "eng", "fra")
 * @param {string} name - Schema name
 * @param {string} description - Schema description (default: "")
 * @returns {Object} Meta overlay structure
 */
export function createMetaOverlay(captureBaseId, language, name, description = "") {
  return {
    d: `meta_${captureBaseId}_${language}_${Date.now()}`,
    capture_base: captureBaseId,
    type: "spec/overlays/meta/1.1",
    language,
    name,
    description,
  };
}
