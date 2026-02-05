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
 * @param {Object|null} packageOCAJSON - Original OCA package JSON structure (null for manual creation)
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
export function buildPackageFromState({ packageOCAJSON, schemaStates, getSchemaById }) {
  // If no package provided (manual creation), create minimal structure
  let packageOCA;
  if (!packageOCAJSON) {
    packageOCA = createMinimalOCASchema(MANUAL_CREATION_SCHEMA_ID, {
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
    packageOCA = JSON.parse(JSON.stringify(packageOCAJSON));
  }

  // Phase 1: Apply edits to each schema
  Object.keys(schemaStates).forEach((schemaId) => {
    const schemaState = getSchemaById(schemaId);
    if (!schemaState?.initialized) return;

    applySchemaStateToPackage({
      packageOCA,
      schemaId,
      schemaState,
      getSchemaById,
    });
  });

  // Phase 2 & 3: Ensure (if not existing, add) missing dependencies
  ensureChildSchemaDependencies(packageOCA, schemaStates, getSchemaById);
  ensurePlaceholderDependencies(packageOCA);

  return packageOCA;
}

/**
 * Updates a schema in the OCA package during building
 * 
 * @param {Object} packageOCA - Cloned OCA package being built
 * @param {string} schemaId - Schema ID to find/create
 * @param {Function} getSchemaById - Function to get editor state (only used for label lookup)
 * 
 */
function applySchemaStateToPackage({ packageOCA, schemaId, schemaState, getSchemaById }) {
  const schemaInPackage = findOrCreatePackageSchema({
    packageOCA,
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
 * @param {Object} packageOCA - Cloned OCA package being built
 * @param {string} schemaId - Schema ID to find/create
 * @param {Function} getSchemaById - Function to get editor state (only used for label lookup)
 * @returns {Object|null} OCA schema structure (bundle or dependency), or null if not found
 * 
 * Note: Only creates placeholders for schemas referenced as refn:placeholder_* in attributes.
 * Returns the OCA JSON structure, not the editor state.
 */
export function findOrCreatePackageSchema({
  packageOCA,
  schemaId,
  getSchemaById,
}) {
  const dependencies = getPackageDependencies(packageOCA);
  const bundle = getPackageBundle(packageOCA);
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

  if (packageOCA.oca_bundle) {
    if (!packageOCA.oca_bundle.dependencies) packageOCA.oca_bundle.dependencies = [];
    packageOCA.oca_bundle.dependencies.push(newDependency);
  } else {
    if (!packageOCA.dependencies) packageOCA.dependencies = [];
    packageOCA.dependencies.push(newDependency);
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
    } else {
      rebuiltAttributes[name] = type || "Text"; // Use editor type
    }
  });

  schema.capture_base.attributes = rebuiltAttributes;
}

/**
 * Ensures all child schemas referenced in editor state exist as dependencies in package.
 * 
 * @param {Object} packageOCA - OCA package being built
 * @param {Function} getSchemaById - Get editor state by schema ID
 * @param {Object} schemaStates - Map of all editor states
 * 
 * Scans all schemas for Child Schema type attributes and creates dependency
 * structures in the package if they're missing.
 */
export function ensureChildSchemaDependencies(
  packageOCA,
  getSchemaById,
  schemaStates,
) {
  const dependencies = getPackageDependencies(packageOCA);
  
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
              packageOCA.bundle?.d === childSchemaName;

            if (!existsInPackage) {
              // Create new OCA dependency structure for this child
              const childAttributes = {};
              childschemaState.attributes?.forEach((childAttr) => {
                if (childAttr.Attribute) {
                  if (childAttr.Type === TYPE_CHILD_SCHEMA) {
                    childAttributes[childAttr.Attribute] = `refn:placeholder_${childAttr.Attribute}`;
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
              pushDependency(packageOCA, newDependency);
            }
          }
        }
      });
    }
  });
}

/**
 * Scan for refn:placeholder_* references and create missing child schema dependencies.
 * Keeps language inheritance from root meta overlays.
 */
export function ensurePlaceholderDependencies(packageOCA) {
  const dependencies = getPackageDependencies(packageOCA);
  const bundle = getPackageBundle(packageOCA);
  const existingDepIds = new Set((dependencies || []).map((dep) => dep.d));
  const placeholdersToCreate = new Set();

  // Scan root schema attributes
  if (bundle?.capture_base?.attributes) {
    Object.entries(bundle.capture_base.attributes).forEach(([_, attrType]) => {
      if (typeof attrType === "string" && attrType.startsWith("refn:placeholder_")) {
        const placeholderId = attrType.replace("refn:placeholder_", "");
        if (!existingDepIds.has(placeholderId)) {
          placeholdersToCreate.add(placeholderId);
        }
      }
    });
  }

  // Scan dependency schema attributes
  (dependencies || []).forEach((dep) => {
    if (dep?.capture_base?.attributes) {
      Object.entries(dep.capture_base.attributes).forEach(([_, attrType]) => {
        if (typeof attrType === "string" && attrType.startsWith("refn:placeholder_")) {
          const placeholderId = attrType.replace("refn:placeholder_", "");
          if (!existingDepIds.has(placeholderId)) {
            placeholdersToCreate.add(placeholderId);
          }
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

    pushDependency(packageOCA, newDependency);
  });
}

export function pushDependency(packageOCA, dependency) {
  const bundle = getPackageBundle(packageOCA);
  if (bundle) {
    if (!bundle.dependencies) bundle.dependencies = [];
    bundle.dependencies.push(dependency);
  } else {
    if (!packageOCA.dependencies) packageOCA.dependencies = [];
    packageOCA.dependencies.push(dependency);
  }
}
