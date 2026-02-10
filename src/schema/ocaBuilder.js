/**
 * OCA Package Builder
 * 
 * Converts user edits from schemaStates back into OCA package format.
 * Used for:
 * - Exporting schemas to JSON
 * - Real-time schema visualization in View Schema step
 * 
 * Process:
 * 1. Clone original OCA package (avoid mutations)
 * 2. Find each initialized schema and apply edits
 * 3. Rebuild capture_base attributes from schemaState.attributes array
 * 4. Apply overlay changes (delegated to ocaBuilderOverlays.js)
 * 5. Ensure child schemas exist as dependencies
 * 
 * Important: Only processes schemas where initialized=true (skips untouched schemas)
 */

import { getPackageBundle, getPackageDependencies } from "../utils/packageUtils";
import { applyAllOverlays } from "./ocaBuilderOverlays";
import { TYPE_CHILD_SCHEMA, TYPE_ARRAY_CHILD_SCHEMA, MANUAL_CREATION_SCHEMA_ID } from "../constants/constants";
import { createMinimalOCASchema, createMetaOverlay } from "./createMinimalOCASchema";

/**
 * Rebuilds entire OCA package by applying user edits from editor state.
 * 
 * @param {Object|null} pkgUpload - Original OCA package JSON structure (null for manual creation)
 * @param {Object} schemaStates - Map of schemaId -> editor state (UI changes)
 * @param {Function} getSchemaById - Function to get editor state by schema ID
 * @returns {Object} Modified OCA package with all edits applied
 * 
 * Process:
 * 1. Clone original package (or create empty structure for manual creation)
 * 2. For each edited schema, find its OCA structure and apply editor changes
 * 3. Ensure child schemas exist as dependencies
 * 4. Create placeholder dependencies for referenced but undefined schemas
 */
export function buildPkgFromState({ pkgUpload, schemaStates, getSchemaById }) {
  // If no package provided (manual creation), create minimal structure
  let pkg;
  if (!pkgUpload) {
    pkg = createMinimalOCASchema(MANUAL_CREATION_SCHEMA_ID, {
      captureBaseType: "spec/capture_base/1.0",
      classification: "",
      overlays: {
        meta: [],
        label: [],
        information: []
      },
      asBundle: true
    });
  } else {
    pkg = JSON.parse(JSON.stringify(pkgUpload));
  }

  // Phase 1: Apply edits to each schema
  Object.keys(schemaStates).forEach((schemaId) => {
    const schemaState = getSchemaById(schemaId);
    if (!schemaState?.initialized) return;

    applySchemaStateToPkg({
      pkg,
      schemaId,
      schemaState,
      getSchemaById,
    });
  });

  // Phase 2 & 3: Ensure (if not existing, add) missing dependencies
  ensureChildSchemaDependencies(pkg, schemaStates, getSchemaById);
  ensurePlaceholderDependencies(pkg);

  return pkg;
}

/**
 * Updates a schema in the OCA package during building
 * 
 * @param {Object} pkg - Cloned OCA package being built
 * @param {string} schemaId - Schema ID to find/create
 * @param {Function} getSchemaById - Function to get editor state (only used for label lookup)
 * 
 */
function applySchemaStateToPkg({ pkg, schemaId, schemaState, getSchemaById }) {
  const schemaInPackage = findOrCreatePkgSchema({
    pkg,
    schemaId,
    getSchemaById,
  });
  
  if (!schemaInPackage) return;

  rebuildAttributes(schemaInPackage, schemaState);
  applyAllOverlays(schemaInPackage, schemaState);
}

/**
 * Finds a schema in the OCA package JSON, or creates a new placeholder if missing.
 * 
 * @param {Object} pkg - Cloned OCA package being built
 * @param {string} schemaId - Schema ID to find/create
 * @param {Function} getSchemaById - Function to get editor state (only used for label lookup)
 * @returns {Object|null} OCA schema structure (bundle or dependency), or null if not found
 * 
 * Note: Only creates placeholders for schemas referenced as refn:placeholder_* in attributes.
 * Returns the OCA JSON structure, not the editor state.
 */
export function findOrCreatePkgSchema({
  pkg,
  schemaId,
  getSchemaById,
}) {
  const dependencies = getPackageDependencies(pkg);
  const bundle = getPackageBundle(pkg);
  // 1) Find existing schema in package JSON
  let schema = null;
  if (schemaId === bundle?.d) {
    schema = bundle; // Root schema
  } else {
    schema = dependencies?.find((dep) => dep.d === schemaId); // Child dependency
  }
  if (schema) return schema;

  // 2) Check if this is a placeholder reference (refn:*) in root attributes
  const rootAttributes = bundle?.capture_base?.attributes || {};
  const isPlaceholder = Object.entries(rootAttributes).some(
    ([key, value]) => key === schemaId && typeof value === "string" && value.startsWith("refn:")
  );
  if (!isPlaceholder) return null; // Not found and not a placeholder

  // 3) Create new placeholder - derive display name from parent's label overlay
  // (This is the ONLY place we use getSchemaById - to peek at parent's UI labels)
  const rootSchemaState = getSchemaById(bundle?.d); // Parent's editor state
  const rootLanData = rootSchemaState?.lanAttributeRowData || {};
  const engLabels = rootLanData["eng"] || rootLanData["English"] || [];
  const labelRow = engLabels.find((row) => row.Attribute === schemaId);
  const displayName = labelRow?.Label || schemaId;

  // 4) Build OCA package structure for the placeholder
  const captureBaseId = `placeholder_${schemaId}_${Date.now()}`;

  const newDependency = createMinimalOCASchema(schemaId, {
    captureBaseId,
    overlays: {
      meta: [
        createMetaOverlay(captureBaseId, "eng", displayName)
      ],
    },
  });
  if (bundle) {
    if (!bundle.dependencies) bundle.dependencies = [];
    bundle.dependencies.push(newDependency);
  } else {
    if (!pkg.dependencies) pkg.dependencies = [];
    pkg.dependencies.push(newDependency);
  }

  return newDependency;
}

/**
 * Rebuilds capture_base.attributes from editor state.
 * 
 * @param {Object} schema - OCA package schema (bundle or dependency) to modify
 * @param {Object} schemaState - Editor state with attributes array from UI
 * 
 * Converts flat editor format (array of {Attribute, Type}) to OCA format (map).
 * Preserves refs:/refn: references for child schemas.
 */
export function rebuildAttributes(schema, schemaState) {
  // Only rebuild if attributes exist in editor state
  if (schemaState.attributes === undefined || schemaState.attributes === null) return;

  const originalAttributes = schema.capture_base.attributes || {};
  const rebuiltAttributes = {};

  schemaState.attributes.forEach((attr) => {
    if (!attr || !attr.Attribute) return;

    const name = attr.Attribute;
    const type = attr.Type;

    // Preserve refs:/refn: child schema references from original package
    const originalValue = originalAttributes[name];
    if (
      typeof originalValue === "string" &&
      (originalValue.startsWith("refn:") || originalValue.startsWith("refs:"))
    ) {
      rebuiltAttributes[name] = originalValue; // Keep reference
    } else if (type === TYPE_CHILD_SCHEMA) {
      // Convert "Child Schema" UI type to refn: format for newly added attributes
      rebuiltAttributes[name] = `refn:${name}`;
    } else if (type === TYPE_ARRAY_CHILD_SCHEMA) {
      // Convert "Array[Child Schema]" UI type to refn: format
      rebuiltAttributes[name] = [`refn:${name}`];
    } else {
      rebuiltAttributes[name] = type || "Text"; // Use editor type
    }
  });

  schema.capture_base.attributes = rebuiltAttributes;
}

/**
 * Ensures all child schemas referenced in editor state exist as dependencies in package.
 * 
 * @param {Object} pkg - OCA package being built
 * @param {Function} getSchemaById - Get editor state by schema ID
 * @param {Object} schemaStates - Map of all editor states
 * 
 * Scans all schemas for Child Schema type attributes and creates dependency
 * structures in the package if they're missing.
 */
export function ensureChildSchemaDependencies(
  pkg,
  getSchemaById,
  schemaStates,
) {
  const dependencies = getPackageDependencies(pkg);
  
  // Check each edited schema for child schema attributes
  Object.keys(schemaStates).forEach((schemaId) => {
    const schemaState = getSchemaById(schemaId);
    if (!schemaState.initialized) return;

    // Look for Child Schema type attributes
    if (schemaState.attributes) {
      schemaState.attributes.forEach((attr) => {
        if (attr.Type === TYPE_CHILD_SCHEMA || attr.Type === TYPE_ARRAY_CHILD_SCHEMA) {
          const childSchemaName = attr.Attribute;

          // Check if child has editor state (was edited in UI)
          const childschemaState = getSchemaById(childSchemaName);
          if (childschemaState && (childschemaState.initialized || childschemaState.attributes?.length > 0)) {
            // Check if child already exists in package JSON
            const existsInPackage =
              dependencies?.some((dep) => dep.d === childSchemaName) ||
              pkg.bundle?.d === childSchemaName;

            if (!existsInPackage) {
              // Create new OCA dependency structure for this child
              const childAttributes = {};
              childschemaState.attributes?.forEach((childAttr) => {
                if (childAttr.Attribute) {
                  // Convert "Child Schema" types to refn: format in nested schemas too
                  if (childAttr.Type === TYPE_CHILD_SCHEMA) {
                    childAttributes[childAttr.Attribute] = `refn:${childAttr.Attribute}`;
                  } else if (childAttr.Type === TYPE_ARRAY_CHILD_SCHEMA) {
                    childAttributes[childAttr.Attribute] = [`refn:${childAttr.Attribute}`];
                  } else {
                    childAttributes[childAttr.Attribute] = childAttr.Type || "Text";
                  }
                }
              });

              const newDependency = { // New OCA schema structure
                d: childSchemaName,
                capture_base: {
                  d: `schema_${childSchemaName}_${Date.now()}`,
                  type: "spec/capture_base/1.1",
                  attributes: childAttributes,
                  classification: "RDF508",
                  flagged_attributes: [],
                },
                overlays: {},
              };

              applyAllOverlays(newDependency, childschemaState);
              pushDependency(pkg, newDependency);
            }
          }
        }
      });
    }
  });
}

/**
 * Scan for refn:* references and create missing child schema dependencies.
 * Keeps language inheritance from root meta overlays.
 */
export function ensurePlaceholderDependencies(pkg) {
  const dependencies = getPackageDependencies(pkg);
  const bundle = getPackageBundle(pkg);
  const existingDepIds = new Set((dependencies || []).map((dep) => dep.d));
  const placeholdersToCreate = new Set();

  // Helper to extract placeholder ID from refn: reference
  const extractPlaceholderId = (attrType) => {
    if (typeof attrType === "string" && attrType.startsWith("refn:")) {
      // Handle both "refn:placeholder_name" and "refn:name" formats
      const refValue = attrType.replace("refn:", "");
      return refValue.startsWith("placeholder_") ? refValue.replace("placeholder_", "") : refValue;
    }
    return null;
  };

  // Scan root schema attributes
  if (bundle?.capture_base?.attributes) {
    Object.entries(bundle.capture_base.attributes).forEach(([_, attrType]) => {
      const placeholderId = extractPlaceholderId(attrType);
      if (placeholderId && !existingDepIds.has(placeholderId)) {
        placeholdersToCreate.add(placeholderId);
      }
    });
  }

  // Scan dependency schema attributes
  (dependencies || []).forEach((dep) => {
    if (dep?.capture_base?.attributes) {
      Object.entries(dep.capture_base.attributes).forEach(([_, attrType]) => {
        const placeholderId = extractPlaceholderId(attrType);
        if (placeholderId && !existingDepIds.has(placeholderId)) {
          placeholdersToCreate.add(placeholderId);
        }
      });
    }
  });

  // Inherit languages from root schema meta overlays
  const rootMetaOverlays = bundle?.overlays?.meta || [];
  const parentLanguages = rootMetaOverlays.map((m) => m.language).filter(Boolean);
  const languagesToUse = parentLanguages.length > 0 ? parentLanguages : ["eng"];

  placeholdersToCreate.forEach((placeholderId) => {
    const captureBaseId = `capture_base_${placeholderId}_${Date.now()}`;

    const metaOverlays = languagesToUse.map((lang) =>
      createMetaOverlay(
        captureBaseId,
        lang,
        placeholderId,
        `Placeholder child schema for ${placeholderId}`
      )
    );

    const newDependency = createMinimalOCASchema(placeholderId, {
      captureBaseId,
      overlays: {
        meta: metaOverlays,
      },
    });

    pushDependency(pkg, newDependency);
  });
}

export function pushDependency(pkg, dependency) {
  const bundle = getPackageBundle(pkg);
  if (bundle) {
    if (!bundle.dependencies) bundle.dependencies = [];
    bundle.dependencies.push(dependency);
  } else {
    if (!pkg.dependencies) pkg.dependencies = [];
    pkg.dependencies.push(dependency);
  }
}
