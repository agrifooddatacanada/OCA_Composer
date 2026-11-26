import { buildSchemaExport } from "./schemaExport";
import { generateOcaPackageJson } from "./packageAssembly";
import { getApiGeneratedBundle } from "../package/packageUtils";

const isReferenceType = (type) =>
  type === "Child Schema" ||
  type === "Placeholder Child Schema" ||
  (typeof type === "string" && (type.startsWith("refs:") || type.startsWith("refn:")));

/**
 * Builds a complete OCA package for one schema without child schemas: the same steps as the
 * Composer's manual export, minus reference resolution.
 *
 * @param {Object} schemaState - Editor state for the schema
 * @param {Object} options
 * @param {string} options.schemaId - Fallback name when the state has none
 * @param {Function} options.generateBundle - async (dslText) => bundle service response
 * @returns {Promise<{ocaPackage: Object, said: string, textDSL: string}>}
 */
export const buildSingleSchemaPackage = async (schemaState, { schemaId, generateBundle }) => {
  const childSchemaAttributes = (schemaState?.attributes || [])
    .filter((row) => isReferenceType(row?.Type))
    .map((row) => row.Attribute);
  if (childSchemaAttributes.length > 0) {
    throw new Error(
      `buildSingleSchemaPackage does not support child schemas (${childSchemaAttributes.join(", ")}).`
    );
  }

  const { bundle, extension, textDSL, generatedBundleDigest } = await buildSchemaExport(
    schemaState,
    { schemaId, generateBundle }
  );
  const ocaPackage = generateOcaPackageJson(extension, {
    bundle: getApiGeneratedBundle(bundle),
    dependencies: []
  });
  return { ocaPackage, said: generatedBundleDigest, textDSL };
};
