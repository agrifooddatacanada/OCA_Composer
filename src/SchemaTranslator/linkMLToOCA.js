/**
 * Main module for converting LinkML schemas to OCA format.
 */
import { mapLinkMLToOCABundle } from "./mapLinkMLToOCABundle";

/**
 * Transforms an OCA bundle into an OCA package
 * @param {Object} bundle - The OCA bundle to package
 * @returns {Object} The OCA package
 */
export function transformToPackage(bundle) {
  return {
    type: "oca_package/1.0",
    oca_bundle: {
      bundle
    },
    dependencies: [],
    extensions: []
  };
}

/**
 * Translates a LinkML schema to an OCA package
 * @param {string} yamlContent - The LinkML schema as YAML string
 * @returns {Promise<Object>} The OCA package
 */
export async function translateLinkMLToOCA(yamlContent) {
  // Convert to OCA bundle
  const bundle = mapLinkMLToOCABundle(yamlContent);

  return bundle;
}
