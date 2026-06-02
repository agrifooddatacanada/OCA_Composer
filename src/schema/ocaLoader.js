/**
 * OCA Package Loader
 * 
 * Parses OCA packages into editing state.
 * Used when:
 * - Loading an OCA bundle from JSON upload
 * - Initializing app with URL-loaded package
 * 
 * Responsibilities:
 * - Extract schemas from oca_bundle and dependencies
 * - Parse OCA format into normalized schemaState structure
 * - Store original schema reference for exports
 * - Only parse once (check initialized flag)
 */

import {
  getPackageBundle,
  getPackageDependencies,
  getPackageBundleId,
  coerceIfLegacyTopLevelBundle
} from "../utils/packageUtils";
import { OCAParser } from "../utils/ocaParser";
import { getSchemaDataById } from "../SchemaVisualization/dataUtils";
import { createDefaultSchemaState } from "./schemaStore";

// Re-export utilities used by other schema modules
export { getPackageBundle, getPackageBundleId } from "../utils/packageUtils";

export function createOcaLoader({
  getSchemaById,
  setSchemaStates,
}) {
  /**
   * LOW-LEVEL: parse schema from OCA (no initialized flag here)
   * Only used internally by addSchemaFromOCA.
   */
  const parseSchemaFromOCA = (schemaId, ocaPackage) => {
    const parsedState = OCAParser.parseSchemaData(schemaId, ocaPackage);
    return parsedState || null;
  };

  const addSchemaFromOCA = (ocaPackage, schemaId) => {
    if (!ocaPackage || !schemaId) return null;

    // Extract raw schema data
    const schemaData = getSchemaDataById(ocaPackage, schemaId);
    if (!schemaData) return null;

    // Build complete schema reference
    const completeSchema = {
      id: schemaId,
      metadata: {
        name: schemaData.schemaName || schemaId,
        description: schemaData.schemaDescription || "",
        languages: schemaData.languages || ["English"],
        digest: schemaData.digest || ""
      },
      attributes: schemaData.attributes || [],
      overlays: schemaData.overlays || {}
    };

    const existingState = getSchemaById(schemaId);
    // Only parse if schema not already initialized
    const parsedState =
      existingState?.initialized ? null : parseSchemaFromOCA(schemaId, ocaPackage);

    setSchemaStates(prev => {
      const base = prev[schemaId] || createDefaultSchemaState();
      const newState = {
        ...prev,
        [schemaId]: {
            ...base,
            ...(parsedState || {}),
            completeSchema,
            initialized: true
        }
      };
      return newState;
    });

    return completeSchema;
  };

  /**
   * Load all schemas from package
   */
  const loadAllSchemasFromOcaPackage = (ocaPackage) => {
    if (!ocaPackage) return [];

    const schemaIds = [];
    const pkgAfterCoercion = coerceIfLegacyTopLevelBundle(ocaPackage);

    const bundle = getPackageBundle(pkgAfterCoercion);
    const dependencies = getPackageDependencies(pkgAfterCoercion);

    if (bundle) {
      const rootId = bundle.d;
      if (rootId) {
        addSchemaFromOCA(pkgAfterCoercion, rootId);
        schemaIds.push(rootId);
      }
    }

    if (dependencies && Array.isArray(dependencies)) {
      dependencies.forEach((dep) => {
        if (dep.d) {
          addSchemaFromOCA(pkgAfterCoercion, dep.d);
          schemaIds.push(dep.d);
        }
      });
    }

    return schemaIds;
  };

  return {
    addSchemaFromOCA,
    loadAllSchemasFromOcaPackage
  };
}