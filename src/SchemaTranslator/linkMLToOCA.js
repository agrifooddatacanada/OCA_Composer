/**
 * Main module for converting LinkML schemas to OCA format.
 */
import { mapLinkMLToOCABundle } from "./mapLinkMLToOCABundle";

/**
 * Transforms an OCA bundle into an OCA package
 * @param {Object} bundle - The OCA bundle to package (includes extensions and captureBaseId)
 * @returns {Object} The OCA package
 */
export function transformToPackage(bundle) {
  const pkg = {
    type: "oca_package/1.0",
    __composerImportSource: "linkml",
    oca_bundle: {
      bundle: {
        d: bundle.d,
        capture_base: bundle.capture_base,
        overlays: bundle.overlays
      }
    },
    dependencies: [],
    extensions: {}
  };

  // Add ADC extensions if present
  if (bundle.extensions) {
    pkg.extensions.adc = {
      [bundle.captureBaseId]: {
        overlays: bundle.extensions
      }
    };
  }

  return pkg;
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
