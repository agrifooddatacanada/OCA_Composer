/**
 * Main module for converting LinkML schemas to OCA format.
 */
import yaml from "js-yaml";
import { mapLinkMLToOCABundle } from "./mapLinkMLToOCABundle";
import validateForOCATranslation from "./validation";

/**
 * Validates that the input is valid YAML syntax
 * @param {string} yamlContent - The YAML content to validate
 * @returns {Object} parsed YAML object if valid, throws error if invalid
 */
export function validateYAMLSyntax(yamlContent) {
  try {
    const parsed = yaml.load(yamlContent);
    if (!parsed || typeof parsed !== "object") {
      throw new Error("Invalid YAML: content must be an object");
    }
    return parsed;
  } catch (error) {
    // Handle all errors without checking for YAMLException
    if (error instanceof Error) {
      throw new Error(`Invalid YAML syntax: ${error.message}`);
    }
    throw error;
  }
}

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
  // First validate the YAML syntax
  const parsedSchema = validateYAMLSyntax(yamlContent);

  // Then validate the LinkML schema
  validateForOCATranslation(parsedSchema);

  // Convert to OCA bundle
  const bundle = mapLinkMLToOCABundle(parsedSchema);

  return bundle;
}
