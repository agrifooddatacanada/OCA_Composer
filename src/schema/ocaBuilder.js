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
 * 4. Apply overlay changes (delegated to ocaOverlayAppliers.js)
 * 5. Ensure child schemas exist as dependencies
 * 
 * Important: Only processes schemas where initialized=true (skips untouched schemas)
 */

import { getPackageBundle, getPackageDependencies } from "../utils/packageUtils";
import { applyAllOverlays } from "./ocaBuilderOverlays";
import { TYPE_CHILD_SCHEMA, TYPE_ARRAY_CHILD_SCHEMA } from "../constants/constants";

/**
 * Rebuilds entire OCA package by applying user edits from schemaStates
 */
export function buildOcaPackageFromState({ ocaPackage, schemaStates, getSchemaState }) {
  if (!ocaPackage) return ocaPackage;

  const modifiedPackage = JSON.parse(JSON.stringify(ocaPackage));
  const bundle = getPackageBundle(modifiedPackage);

  // Phase 1: Apply edits to all initialized schemas
  Object.keys(schemaStates).forEach((schemaId) => {
    const schemaState = getSchemaState(schemaId);
    if (!schemaState?.initialized) return;

    const targetSchema = findOrCreateTargetSchema({
      modifiedPackage,
      bundle,
      schemaId,
      getSchemaState,
    });
    
    if (!targetSchema) return;

    rebuildCaptureBaseAttributes(targetSchema, schemaState);
    applyAllOverlays(targetSchema, schemaState); // ← Delegated to appliers
  });

  // Phase 2: Ensure child schemas exist as dependencies
  ensureChildSchemaDependencies({ modifiedPackage, bundle, schemaStates, getSchemaState });

  // Phase 3: Create placeholder dependencies
  ensurePlaceholderDependencies({ modifiedPackage, bundle });

  return modifiedPackage;
}

export function findOrCreateTargetSchema({
  modifiedPackage,
  bundle,
  schemaId,
  getSchemaState,
}) {
  const dependencies = getPackageDependencies(modifiedPackage);
  // 1) find existing
  let targetSchema = null;
  if (schemaId === bundle?.d) {
    targetSchema = bundle;
  } else {
    targetSchema = dependencies?.find((dep) => dep.d === schemaId);
  }
  if (targetSchema) return targetSchema;

  // 2) if missing, see if it’s a placeholder referenced by root schema attributes
  const rootAttributes = bundle?.capture_base?.attributes || {};
  const isPlaceholder = Object.entries(rootAttributes).some(
    ([key, value]) => key === schemaId && typeof value === "string" && value.startsWith("refn:")
  );
  if (!isPlaceholder) return null;

  // 3) derive display name from parent labels (fallback schemaId)
  const rootSchemaState = getSchemaState(bundle?.d);
  const rootLanData = rootSchemaState?.lanAttributeRowData || {};
  const engLabels = rootLanData["eng"] || rootLanData["English"] || [];
  const labelRow = engLabels.find((row) => row.Attribute === schemaId);
  const displayName = labelRow?.Label || schemaId;

  // 4) create dependency skeleton + push into package (wrapped/unwrapped)
  const captureBaseId = `placeholder_${schemaId}_${Date.now()}`;

  const newDependency = {
    d: schemaId,
    capture_base: {
      d: captureBaseId,
      type: "spec/capture_base/1.1",
      attributes: {},
      classification: "RDF508",
      flagged_attributes: [],
    },
    overlays: {
      meta: [
        {
          d: `meta_${schemaId}_${Date.now()}`,
          capture_base: captureBaseId,
          type: "spec/overlays/meta/1.1",
          language: "eng",
          name: displayName,
          description: "",
        },
      ],
    },
  };

  if (modifiedPackage.oca_bundle) {
    if (!modifiedPackage.oca_bundle.dependencies) modifiedPackage.oca_bundle.dependencies = [];
    modifiedPackage.oca_bundle.dependencies.push(newDependency);
  } else {
    if (!modifiedPackage.dependencies) modifiedPackage.dependencies = [];
    modifiedPackage.dependencies.push(newDependency);
  }

  return newDependency;
}

export function rebuildCaptureBaseAttributes(targetSchema, schemaState) {
  // Only rebuild if explicitly present
  if (schemaState.attributes === undefined || schemaState.attributes === null) return;

  const originalAttributes = targetSchema.capture_base.attributes || {};
  const rebuiltAttributes = {};

  schemaState.attributes.forEach((attr) => {
    if (!attr || !attr.Attribute) return;

    const name = attr.Attribute;
    const type = attr.Type;

    // For child schemas, preserve original refs:/refn: if it exists, otherwise use type as-is
    // (Child schema dependency creation is handled separately in ensureChildSchemaDependencies)
    const originalValue = originalAttributes[name];
    if (
      typeof originalValue === "string" &&
      (originalValue.startsWith("refn:") || originalValue.startsWith("refs:"))
    ) {
      rebuiltAttributes[name] = originalValue;
    } else {
      rebuiltAttributes[name] = type || "Text";
    }
  });

  targetSchema.capture_base.attributes = rebuiltAttributes;
}

export function ensureChildSchemaDependencies({
  modifiedPackage,
  bundle,
  getSchemaState,
  schemaStates,
}) {
  const dependencies = getPackageDependencies(modifiedPackage);
  
  // After processing all schemas, check for child schemas that need to be added as dependencies
  Object.keys(schemaStates).forEach((schemaId) => {
    const schemaState = getSchemaState(schemaId);
    if (!schemaState.initialized) return;

    // Look for child schema type attributes in this schema
    if (schemaState.attributes) {
      schemaState.attributes.forEach((attr) => {
        if (attr.Type === TYPE_CHILD_SCHEMA || attr.Type === TYPE_ARRAY_CHILD_SCHEMA) {
          const childSchemaName = attr.Attribute;

          // Check if there's a schema state for this child schema
          const childSchemaState = getSchemaState(childSchemaName);
          if (childSchemaState && (childSchemaState.initialized || childSchemaState.attributes?.length > 0)) {
            // Check if this child schema is already in the package
            const existsInPackage =
              dependencies?.some((dep) => dep.d === childSchemaName) ||
              modifiedPackage.bundle?.d === childSchemaName;

            if (!existsInPackage) {
              // Create a new dependency for this child schema
              const childAttributes = {};
              childSchemaState.attributes?.forEach((childAttr) => {
                if (childAttr.Attribute) {
                  if (childAttr.Type === TYPE_CHILD_SCHEMA) {
                    childAttributes[childAttr.Attribute] = `refn:placeholder_${childAttr.Attribute}`;
                  } else {
                    childAttributes[childAttr.Attribute] = childAttr.Type || "Text";
                  }
                }
              });

              const newDependency = {
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

              applyAllOverlays(newDependency, childSchemaState);
              pushDependency(modifiedPackage, newDependency);
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
export function ensurePlaceholderDependencies({ 
    modifiedPackage, 
    bundle,
 }) {
  const dependencies = getPackageDependencies(modifiedPackage);
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

    const metaOverlays = languagesToUse.map((lang) => ({
      d: `meta_${placeholderId}_${lang}_${Date.now()}`,
      capture_base: captureBaseId,
      type: "spec/overlays/meta/1.1",
      language: lang,
      name: placeholderId,
      description: `Placeholder child schema for ${placeholderId}`,
    }));

    const newDependency = {
      d: placeholderId,
      capture_base: {
        d: captureBaseId,
        type: "spec/capture_base/1.1",
        attributes: {},
        classification: "RDF508",
        flagged_attributes: [],
      },
      overlays: {
        meta: metaOverlays,
      },
    };

    pushDependency(modifiedPackage, newDependency);
  });
}

export function pushDependency(modifiedPackage, dependency) {
  if (modifiedPackage.oca_bundle) {
    if (!modifiedPackage.oca_bundle.dependencies) modifiedPackage.oca_bundle.dependencies = [];
    modifiedPackage.oca_bundle.dependencies.push(dependency);
  } else {
    if (!modifiedPackage.dependencies) modifiedPackage.dependencies = [];
    modifiedPackage.dependencies.push(dependency);
  }
}
