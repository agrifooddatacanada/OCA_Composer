import { isDeepStrictEqual } from "node:util";
import {
  buildOcaDsl,
  buildSingleSchemaPackage,
  createBundleClient,
  getPackageBundleId,
  OCAParser,
  prepareSchemaExport
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

/** The OCA DSL a checked spec turns into, without calling the bundle service. */
export function previewDsl(spec) {
  return buildOcaDsl(
    prepareSchemaExport(specToEditorState(spec), { schemaId: SPEC_SCHEMA_ID })
  );
}

/** Reads the root schema of an OCA package back into a canonical schema spec. */
export function readSpecFromPackage(ocaPackage) {
  const said = getPackageBundleId(ocaPackage);
  const state = said ? OCAParser.parseSchemaData(said, ocaPackage) : null;
  if (!state) throw new Error("Could not find a schema in the OCA package.");
  return editorStateToSpec(state);
}

/**
 * Compares a spec with what OCA Composer reads back from the package built from it. Returns
 * the top-level fields and attribute names that differ; empty when the package is faithful.
 * The importer orders languages English first, so language order is ignored.
 */
export function diffReadBack(spec, ocaPackage) {
  const expected = editorStateToSpec(specToEditorState(spec));
  const actual = readSpecFromPackage(ocaPackage);
  const differences = [];

  ["name", "description", "classification"].forEach((field) => {
    if (!isDeepStrictEqual(expected[field], actual[field])) differences.push(field);
  });
  if (!isDeepStrictEqual([...expected.languages].sort(), [...actual.languages].sort())) {
    differences.push("languages");
  }
  const actualByName = new Map(actual.attributes.map((attribute) => [attribute.name, attribute]));
  expected.attributes.forEach((attribute) => {
    if (!isDeepStrictEqual(attribute, actualByName.get(attribute.name))) {
      differences.push(`attribute ${attribute.name}`);
    }
  });
  const expectedOrder = expected.attributes.map((attribute) => attribute.name);
  const actualOrder = actual.attributes.map((attribute) => attribute.name);
  const sameNames =
    expectedOrder.length === actualOrder.length &&
    expectedOrder.every((name) => actualOrder.includes(name));
  if (sameNames && !isDeepStrictEqual(expectedOrder, actualOrder)) {
    differences.push("attribute order");
  }
  actualOrder
    .filter((name) => !expectedOrder.includes(name))
    .forEach((name) => differences.push(`unexpected attribute ${name}`));
  return differences;
}
