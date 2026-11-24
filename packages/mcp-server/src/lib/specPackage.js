import {
  buildSingleSchemaPackage,
  createBundleClient,
  getPackageBundleId,
  OCAParser
} from "@oca-composer/oca-core";
import { editorStateToSpec, specToEditorState } from "./specConversion.js";

// Only used as the meta name when a spec has none, which checkSchemaSpec rejects.
const SPEC_SCHEMA_ID = "schema-spec";

/**
 * Builds an OCA package from a checked schema spec through the OCA bundle service.
 *
 * @param {Object} spec - A spec that passed schemaSpecSchema and checkSchemaSpec
 * @param {Object} [options]
 * @param {Object} [options.bundleService] - createBundleClient options: baseUrl, timeoutMs, fetch
 * @returns {Promise<{ocaPackage: Object, said: string, textDSL: string}>}
 */
export async function buildPackageFromSpec(spec, { bundleService = {} } = {}) {
  const client = createBundleClient(bundleService);
  return buildSingleSchemaPackage(specToEditorState(spec), {
    schemaId: SPEC_SCHEMA_ID,
    generateBundle: client.generateBundle
  });
}

/** Reads the root schema of an OCA package back into a canonical schema spec. */
export function readSpecFromPackage(ocaPackage) {
  const said = getPackageBundleId(ocaPackage);
  const state = said ? OCAParser.parseSchemaData(said, ocaPackage) : null;
  if (!state) throw new Error("Could not find a schema in the OCA package.");
  return editorStateToSpec(state);
}
