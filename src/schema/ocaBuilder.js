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
  let pkg;
  if (!packageOCAJSON) {
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
    pkg = JSON.parse(JSON.stringify(packageOCAJSON));
  }

  // Phase 1: Apply edits to each schema
  console.log('[buildPackageFromState] Phase 1: Processing schemas', Object.keys(schemaStates));
  Object.keys(schemaStates).forEach((schemaId) => {
    const schemaState = getSchemaById(schemaId);
    // Process schema if it's initialized OR if it has attributes (edited placeholder)
    const hasAttributes = schemaState?.attributes && schemaState.attributes.length > 0;
    if (!schemaState?.initialized && !hasAttributes) {
      console.log(`[buildPackageFromState] Skipping uninitialized schema: ${schemaId}`);
      return;
    }

    console.log(`[buildPackageFromState] Applying schema state for: ${schemaId}`, {
      hasAttributes: !!schemaState.attributes,
      attributeCount: schemaState.attributes?.length || 0
    });
    applySchemaStateToPackage({
      pkg,
      schemaId,
      schemaState,
      getSchemaById,
      schemaStates, // Pass schemaStates for refn: lookups
    });
  });

  // Phase 2 & 3: Ensure (if not existing, add) missing dependencies
  console.log('[buildPackageFromState] Phase 2: Ensuring child schema dependencies');
  ensureChildSchemaDependencies(pkg, schemaStates, getSchemaById);
  console.log('[buildPackageFromState] Phase 3: Ensuring placeholder dependencies');
  ensurePlaceholderDependencies(pkg);
  
  const finalDeps = getPackageDependencies(pkg);
  console.log('[buildPackageFromState] Final dependencies:', finalDeps?.map(d => d.d) || []);

  return pkg;
}

/**
 * Updates a schema in the OCA package during building
 * 
 * @param {Object} pkg - Cloned OCA package being built
 * @param {string} schemaId - Schema ID to find/create
 * @param {Function} getSchemaById - Function to get editor state (only used for label lookup)
 * @param {Object} schemaStates - Map of all editor states
 * 
 */
function applySchemaStateToPackage({ pkg, schemaId, schemaState, getSchemaById, schemaStates }) {
  const schemaInPackage = findOrCreatePackageSchema({
    pkg,
    schemaId,
    getSchemaById,
    schemaStates, // Pass schemaStates for refn: lookups
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
 * @param {Object} schemaStates - Map of all editor states (for refn: lookups)
 * @returns {Object|null} OCA schema structure (bundle or dependency), or null if not found
 * 
 * Note: Only creates placeholders for schemas referenced as refn:* in attributes.
 * Returns the OCA JSON structure, not the editor state.
 */
export function findOrCreatePackageSchema({
  pkg,
  schemaId,
  getSchemaById,
  schemaStates = {},
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

  // 2) Check if this is a placeholder reference (refn:*) in ANY schema
  // We need to check both the package AND the schemaStates since some schemas
  // might have been edited but not yet written to the package
  let parentSchemaId = null;
  
  // Helper to check if schemaId is referenced as refn: in attributes
  const checkAttributes = (attributes) => {
    return Object.entries(attributes || {}).some(
      ([key, value]) => key === schemaId && typeof value === "string" && value.startsWith("refn:")
    );
  };
  
  // Check root attributes in package
  if (checkAttributes(bundle?.capture_base?.attributes)) {
    parentSchemaId = bundle?.d;
  }
  
  // Check all dependencies' attributes in package (if not found yet)
  if (!parentSchemaId) {
    for (const dep of (dependencies || [])) {
      if (checkAttributes(dep?.capture_base?.attributes)) {
        parentSchemaId = dep.d;
        break;
      }
    }
  }
  
  // Also check schemaStates for refn: references (for newly created schemas)
  if (!parentSchemaId) {
    for (const [stateSchemaId, _] of Object.entries(schemaStates)) {
      const schemaState = getSchemaById(stateSchemaId);
      if (!schemaState?.attributes) continue;
      
      // Check if this schema has refn:schemaId in its attributes
      const hasRefn = schemaState.attributes.some((attr) => {
        return attr.Attribute === schemaId && 
               (attr.Type === TYPE_CHILD_SCHEMA || attr.Type === TYPE_ARRAY_CHILD_SCHEMA);
      });
      
      if (hasRefn) {
        parentSchemaId = stateSchemaId;
        break;
      }
    }
  }
  
  if (!parentSchemaId) return null; // Not found and not a placeholder

  // 3) Create new placeholder - derive display name from parent's label overlay
  const parentSchemaState = getSchemaById(parentSchemaId); // Parent's editor state
  const parentLanData = parentSchemaState?.lanAttributeRowData || {};
  const engLabels = parentLanData["eng"] || parentLanData["English"] || [];
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

  if (pkg.oca_bundle) {
    if (!pkg.oca_bundle.dependencies) pkg.oca_bundle.dependencies = [];
    pkg.oca_bundle.dependencies.push(newDependency);
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
  schemaStates,
  getSchemaById,
) {
  // Keep looping until no new dependencies are created ability(handles nested refn: references)
  let foundNewDependencies = true;
  let iteration = 0;
  const maxIterations = 10; // Safety limit to avoid infinite loops
  
  while (foundNewDependencies && iteration < maxIterations) {
    iteration++;
    foundNewDependencies = false;
    
    const dependencies = getPackageDependencies(pkg);
    const bundle = getPackageBundle(pkg);
    
    // Track which child schemas need dependencies created
    const childSchemasToCreate = new Map(); // Map<schemaName, schemaState>
  
  // Phase 1: Collect all child schemas from TYPE_CHILD_SCHEMA attributes
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
            childSchemasToCreate.set(childSchemaName, childschemaState);
          }
        }
      });
    }
  });
  
  // Phase 2: Also check for refn: references that have been edited
  // Scan all schema attributes (bundle and dependencies) for refn: references
  const allSchemas = [bundle, ...(dependencies || [])].filter(Boolean);
  console.log('[ensureChildSchemaDependencies] Scanning schemas for refn: references:', allSchemas.length);
  allSchemas.forEach((schema) => {
    const attributes = schema?.capture_base?.attributes || {};
    console.log(`[ensureChildSchemaDependencies] Checking schema ${schema.d}:`, Object.keys(attributes));
    Object.entries(attributes).forEach(([key, value]) => {
      if (typeof value === "string" && value.startsWith("refn:")) {
        // Extract the schema name from refn:name
        const refnSchemaName = value.replace("refn:", "");
        console.log(`[ensureChildSchemaDependencies] Found refn:${refnSchemaName} in ${schema.d}`);
        
        // Check if this schema has been edited
        const refnSchemaState = getSchemaById(refnSchemaName);
        if (refnSchemaState && (refnSchemaState.initialized || refnSchemaState.attributes?.length > 0)) {
          console.log(`[ensureChildSchemaDependencies] Schema ${refnSchemaName} has been edited, adding to create list`);
          childSchemasToCreate.set(refnSchemaName, refnSchemaState);
        } else {
          console.log(`[ensureChildSchemaDependencies] Schema ${refnSchemaName} not edited yet`);
        }
      }
    });
  });
  
  // Phase 3: Create dependencies for all collected child schemas
  console.log('[ensureChildSchemaDependencies] Creating dependencies for:', Array.from(childSchemasToCreate.keys()));
  childSchemasToCreate.forEach((childschemaState, childSchemaName) => {
    // Check if child already exists in package JSON
    const existsInPackage =
      dependencies?.some((dep) => dep.d === childSchemaName) ||
      bundle?.d === childSchemaName;

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
      
      // Ensure metadata overlay exists with schema name
      // If schema state didn't have metadata, create default metadata
      if (!newDependency.overlays.meta || newDependency.overlays.meta.length === 0) {
        // Get languages from root schema or default to English
        const rootMetaOverlays = bundle?.overlays?.meta || [];
        const parentLanguages = rootMetaOverlays.map((m) => m.language).filter(Boolean);
        const languagesToUse = parentLanguages.length > 0 ? parentLanguages : ["eng"];
        
        // Try to find a better display name by looking for the parent attribute label
        let displayName = childSchemaName; // Default to the schema ID
        
        // Search all schemas (bundle + dependencies) for an attribute with refn:childSchemaName
        const allSchemas = [bundle, ...(dependencies || [])].filter(Boolean);
        for (const schema of allSchemas) {
          const attrs = schema?.capture_base?.attributes || {};
          for (const [attrKey, attrValue] of Object.entries(attrs)) {
            if (attrValue === `refn:${childSchemaName}`) {
              // Found the parent attribute! Try to get its label
              const labelOverlays = schema?.overlays?.label;
              if (Array.isArray(labelOverlays)) {
                // Try to find label in the first available language
                for (const labelOverlay of labelOverlays) {
                  const attrLabel = labelOverlay?.attribute_labels?.[attrKey];
                  if (attrLabel) {
                    displayName = attrLabel;
                    break;
                  }
                }
              }
              // If we found a label, use the attribute key as fallback
              if (displayName === childSchemaName && attrKey) {
                displayName = attrKey;
              }
              break;
            }
          }
          if (displayName !== childSchemaName) break; // Found it, stop searching
        }
        
        newDependency.overlays.meta = languagesToUse.map((lang) =>
          createMetaOverlay(
            newDependency.capture_base.d,
            lang,
            displayName, // Use the found display name (attribute label or key)
            `Schema for ${displayName}`
          )
        );
      }
      
      pushDependency(pkg, newDependency);
      foundNewDependencies = true; // Flag that we created a new dependency
    }
  });
  } // End while loop
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
  // Push to the correct location based on package structure
  if (pkg.oca_bundle) {
    if (!pkg.oca_bundle.dependencies) pkg.oca_bundle.dependencies = [];
    pkg.oca_bundle.dependencies.push(dependency);
  } else {
    if (!pkg.dependencies) pkg.dependencies = [];
    pkg.dependencies.push(dependency);
  }
}
