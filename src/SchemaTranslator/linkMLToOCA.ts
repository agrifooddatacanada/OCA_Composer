import * as yaml from "js-yaml";
import { mapLinkMLToOCABundle } from "./mapLinkMLToOCABundle.ts";
import { OCAPackage, OCABundle, LinkMLSchema } from "./types.ts";
import { validateForOCATranslation } from "./validation.ts";

/**
 * Validates that the input is valid YAML syntax
 * @param yamlContent - The YAML content to validate
 * @returns parsed YAML object if valid, throws error if invalid
 */
export function validateYAMLSyntax(yamlContent: string): object {
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
 * @param bundle - The OCA bundle to package
 * @returns The OCA package
 */
export function transformToPackage(bundle: OCABundle): OCAPackage {
  return {
    type: "oca_package/1.0",
    oca_bundle: {
      bundle, // Using property shorthand
    },
    dependencies: [],
    extensions: []
  };
}

/**
 * Translates a LinkML schema to an OCA package
 * @param yamlContent - The LinkML schema as YAML string
 * @returns The OCA package
 */
export async function translateLinkMLToOCA(yamlContent: string): Promise<OCABundle> {
  // First validate the YAML syntax
  const parsedSchema = validateYAMLSyntax(yamlContent) as LinkMLSchema;
  
  // Then validate the LinkML schema
  validateForOCATranslation(parsedSchema);
  
  // Convert to OCA bundle
  const bundle = mapLinkMLToOCABundle(parsedSchema);
  
  return bundle;
}
