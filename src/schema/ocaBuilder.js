/**
 * OCA Package Builder
 * 
 * Converts user edits from schemaStates back into OCA package format.
 * Used for:
 * - Exporting schemas to JSON
 * - Real-time schema visualization in View Schema step
 * 
 * Build Process:
 * 1. Clone original OCA package (avoid mutations)
 * 2. Phase 1: Apply edits to initialized schemas
 * 3. Phase 2: Ensure child dependencies exist (iterative to handle nesting)
 * 4. Phase 3: Create empty placeholders for unedited refn: references
 * 
 * Schema Processing:
 * - Processes schemas where initialized=true OR has attributes (edited placeholders)
 * - Converts UI editor state to OCA JSON format
 * - Handles nested child schemas via iterative dependency resolution
 * - Auto-generates metadata for child schemas using parent attribute labels
 * 
 * Important: Only processes schemas that have been edited (schemaHasEdits check)
 */

import { getPackageBundle, getPackageDependencies } from "../utils/packageUtils";
import { applyAllOverlays } from "./ocaBuilderOverlays";
import { TYPE_CHILD_SCHEMA, TYPE_PLACEHOLDER_CHILD_SCHEMA, TYPE_ARRAY_PLACEHOLDER_CHILD_SCHEMA, MANUAL_CREATION_SCHEMA_ID } from "../constants/constants";
import { createMinimalOCASchema, createMetaOverlay } from "./createMinimalOCASchema";

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Check if a schema has edits that should be processed
 * 
 * A schema should be processed if:
 * - initialized=true: Schema was parsed from OCA file OR user made ANY change (metadata, attributes, overlays)
 * - attributes.length > 0: Fallback for edge cases where attributes exist but initialized wasn't set
 * 
 * This covers:
 * - Uploaded schemas that were parsed
 * - Schemas where user edited metadata, attributes, labels, or any other field
 * - Placeholder child schemas that now have attributes
 * 
 * Note: As of the updateSchema() fix, initialized is set on ANY change, so the
 * attributes.length check is mainly a defensive fallback for edge cases.
 */
function schemaHasEdits(schemaState) {
  return schemaState?.initialized || (schemaState?.attributes && schemaState.attributes.length > 0);
}

/**
 * Find the display name for a child schema by looking up its parent's attribute label
 * Searches through all schemas to find which attribute references this child via refn:
 * 
 * @param {string} childSchemaName - The schema name to find (e.g., "placeholder1")
 * @param {Object} bundle - Root bundle
 * @param {Array} dependencies - Dependency schemas
 * @returns {string} The attribute label/key from parent, or childSchemaName if not found
 */
function resolveChildSchemaDisplayName(childSchemaName, bundle, dependencies) {
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
              return attrLabel;
            }
          }
        }
        
        // Use attribute key as fallback (better than schema ID)
        return attrKey;
      }
    }
  }
  
  // Not found - use the schema name itself
  return childSchemaName;
}

// ============================================================================
// MAIN BUILD FUNCTION
// ============================================================================

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
    
    if (!schemaHasEdits(schemaState)) {
      return;
    }

    applySchemaStateToPkg({
      pkg,
      schemaId,
      schemaState,
      getSchemaById,
      schemaStates, // Pass schemaStates for refn: lookups
    });
  });

  // Phase 2 & 3: Ensure (if not existing, add) missing dependencies
  ensureChildSchemaDependencies(pkg, schemaStates, getSchemaById);
  ensurePlaceholderDependencies(pkg);
  
  const finalDeps = getPackageDependencies(pkg);

  return pkg;
}

// ============================================================================
// SCHEMA APPLICATION FUNCTIONS
// ============================================================================

/**
 * Updates a schema in the OCA package during building
 * 
 * @param {Object} pkg - Cloned OCA package being built
 * @param {string} schemaId - Schema ID to find/create
 * @param {Function} getSchemaById - Function to get editor state (only used for label lookup)
 * @param {Object} schemaStates - Map of all editor states
 * 
 */
function applySchemaStateToPkg({ pkg, schemaId, schemaState, getSchemaById, schemaStates }) {
  const schemaInPackage = findOrCreatePkgSchema({
    pkg,
    schemaId,
    getSchemaById,
    schemaStates, // Pass schemaStates for refn: lookups
  });
  
  if (!schemaInPackage) return;

  rebuildAttributes(schemaInPackage, schemaState, schemaStates, getSchemaById);
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
export function findOrCreatePkgSchema({
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
               (attr.Type === TYPE_CHILD_SCHEMA || attr.Type === TYPE_PLACEHOLDER_CHILD_SCHEMA || 
                attr.Type === TYPE_ARRAY_PLACEHOLDER_CHILD_SCHEMA);
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
 * @param {Object} schemaStates - Map of all editor states (for checking child schema status)
 * @param {Function} getSchemaById - Function to get editor state by ID
 * 
 * Converts flat editor format (array of {Attribute, Type}) to OCA format (map).
 * Preserves refs:/refn: references for child schemas, but converts refs: to refn: if child is empty.
 */
export function rebuildAttributes(schema, schemaState, schemaStates = {}, getSchemaById = null) {
  // Only rebuild if attributes exist in editor state
  if (schemaState.attributes === undefined || schemaState.attributes === null) return;

  const originalAttributes = schema.capture_base.attributes || {};
  const rebuiltAttributes = {};

  schemaState.attributes.forEach((attr) => {
    if (!attr || !attr.Attribute) return;

    const name = attr.Attribute;
    const type = attr.Type;
    const originalType = attr.OriginalType;  // Preserve refs:SAID from loaded package

    // First priority: Check if we have OriginalType with refs:/refn: from loaded package
    if (originalType && typeof originalType === "string" && originalType.startsWith("refs:")) {
      // Check if the child schema still has attributes
      const refSaid = originalType.replace("refs:", "");
      const childSchemaState = getSchemaById ? getSchemaById(refSaid) : null;
      const hasAttributes = childSchemaState?.attributes && childSchemaState.attributes.length > 0;
      
      if (!hasAttributes) {
        // Child schema is now empty - convert to placeholder
        rebuiltAttributes[name] = `refn:${name}`;
      } else {
        // Preserve refs:SAID from original package
        rebuiltAttributes[name] = originalType;
      }
    } else if (originalType && typeof originalType === "string" && originalType.startsWith("refn:")) {
      // Check if placeholder now has attributes - if so, convert to refs:
      // Search for child schema by ID (manual creation) or metadata.name (imports)
      const childEntry = Object.entries(schemaStates).find(([id, s]) => id === name || s.metadata?.name === name);
      const childSchemaId = childEntry?.[0];
      const childSchemaState = childEntry?.[1];
      const hasAttributes = childSchemaState?.attributes && childSchemaState.attributes.length > 0;
      
      if (hasAttributes && childSchemaId) {
        // Placeholder now has attributes - promote to refs:SAID
        rebuiltAttributes[name] = `refs:${childSchemaId}`;
      } else {
        // Still a placeholder - keep as is
        rebuiltAttributes[name] = originalType;
      }
    } else if (originalType && Array.isArray(originalType) && originalType[0]) {
      if (originalType[0].startsWith("refs:")) {
        // Check if the child schema still has attributes
        const refSaid = originalType[0].replace("refs:", "");
        const childSchemaState = getSchemaById ? getSchemaById(refSaid) : null;
        const hasAttributes = childSchemaState?.attributes && childSchemaState.attributes.length > 0;
        
        if (!hasAttributes) {
          // Child schema is now empty - convert to placeholder
          rebuiltAttributes[name] = [`refn:${name}`];
        } else {
          // Preserve Array[refs:SAID] from original package
          rebuiltAttributes[name] = originalType;
        }
      } else if (originalType[0].startsWith("refn:")) {
        // Check if placeholder now has attributes - if so, convert to refs:
        // Search for child schema by ID (manual creation) or metadata.name (imports)
        const childEntry = Object.entries(schemaStates).find(([id, s]) => id === name || s.metadata?.name === name);
        const childSchemaId = childEntry?.[0];
        const childSchemaState = childEntry?.[1];
        const hasAttributes = childSchemaState?.attributes && childSchemaState.attributes.length > 0;
        
        if (hasAttributes && childSchemaId) {
          // Placeholder now has attributes - promote to Array[refs:SAID]
          rebuiltAttributes[name] = [`refs:${childSchemaId}`];
        } else {
          // Still a placeholder - preserve Array[refn:]
          rebuiltAttributes[name] = originalType;
        }
      } else {
        rebuiltAttributes[name] = originalType;
      }
    }
    // Second priority: Check originalAttributes from package (for schemas that were edited)
    else {
      const originalValue = originalAttributes[name];
      if (
        typeof originalValue === "string" &&
        (originalValue.startsWith("refn:") ||originalValue.startsWith("refs:"))
      ) {
        // If it's a refs: reference, check if the child schema still has attributes
        if (originalValue.startsWith("refs:") && getSchemaById) {
          // Extract SAID and find child schema
          const refSaid = originalValue.replace("refs:", "");
          const childSchemaState = getSchemaById(refSaid);
          const hasAttributes = childSchemaState?.attributes && childSchemaState.attributes.length > 0;
          
          if (!hasAttributes) {
            // Child schema has no attributes - convert to placeholder
            rebuiltAttributes[name] = `refn:${name}`;
          } else {
            // Child still has attributes - keep the refs: reference
            rebuiltAttributes[name] = originalValue;
          }
        } else {
          // refn: reference - check if it now has attributes
          if (originalValue.startsWith("refn:")) {
            // Search for child schema by ID (manual creation) or metadata.name (imports)
            const childEntry = Object.entries(schemaStates).find(([id, s]) => id === name || s.metadata?.name === name);
            const childSchemaId = childEntry?.[0];
            const childSchemaState = childEntry?.[1];
            const hasAttributes = childSchemaState?.attributes && childSchemaState.attributes.length > 0;
            
            if (hasAttributes && childSchemaId) {
              // Placeholder now has attributes - promote to refs:SAID
              rebuiltAttributes[name] = `refs:${childSchemaId}`;
            } else {
              // Still a placeholder - keep as is
              rebuiltAttributes[name] = originalValue;
            }
          } else {
            // No way to check - keep as is
            rebuiltAttributes[name] = originalValue;
          }
        }
      } else if (type === TYPE_CHILD_SCHEMA || type === TYPE_PLACEHOLDER_CHILD_SCHEMA) {
        // Convert "Child Schema" or "Placeholder Child Schema" UI type to refn: format for newly added attributes
        rebuiltAttributes[name] = `refn:${name}`;
      } else if (type === TYPE_ARRAY_PLACEHOLDER_CHILD_SCHEMA) {
        // Convert "Array[Placeholder Child Schema]" UI type to refn: format
        rebuiltAttributes[name] = [`refn:${name}`];
      } else {
        rebuiltAttributes[name] = type || "Text"; // Use editor type
      }
    }
  });

  schema.capture_base.attributes = rebuiltAttributes;
}

// ============================================================================
// DEPENDENCY MANAGEMENT FUNCTIONS
// ============================================================================

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
  // Iterative approach: Keep looping until no new dependencies are created
  // This handles nested refn: references (e.g., placeholder1 contains refn:placeholder2)
  let foundNewDependencies = true;
  let iteration = 0;
  const maxIterations = 10; // Safety limit to prevent infinite loops
  
  while (foundNewDependencies && iteration < maxIterations) {
    iteration++;
    foundNewDependencies = false;
    
    const dependencies = getPackageDependencies(pkg);
    const bundle = getPackageBundle(pkg);
    
    // Track which child schemas need dependencies created
    const childSchemasToCreate = new Map(); // Map<schemaName, schemaState>
  
    // Phase 1: Collect child schemas from TYPE_CHILD_SCHEMA attributes
    // (This handles the old UI pattern where users selected "Child Schema" type)
    Object.keys(schemaStates).forEach((schemaId) => {
      const schemaState = getSchemaById(schemaId);
      if (!schemaState.initialized) return;

      // Look for Child Schema type attributes
      if (schemaState.attributes) {
        schemaState.attributes.forEach((attr) => {
          if (attr.Type === TYPE_CHILD_SCHEMA || attr.Type === TYPE_PLACEHOLDER_CHILD_SCHEMA || 
              attr.Type === TYPE_ARRAY_PLACEHOLDER_CHILD_SCHEMA) {
            const childSchemaName = attr.Attribute;

            // Check if child has editor state AND has attributes (empty schemas become placeholders)
            const childschemaState = getSchemaById(childSchemaName);
            if (schemaHasEdits(childschemaState) && childschemaState.attributes && childschemaState.attributes.length > 0) {
              childSchemasToCreate.set(childSchemaName, childschemaState);
            }
          }
        });
      }
    });
  
    // Phase 2: Scan for refs:/refn: references
    // - refn: references that have been edited and now have attributes
    // - refs: references from original package that need to be preserved
    const allSchemas = [bundle, ...(dependencies || [])].filter(Boolean);
    allSchemas.forEach((schema) => {
      const attributes = schema?.capture_base?.attributes || {};
      Object.entries(attributes).forEach(([key, value]) => {
        // Handle refn: placeholders that now have attributes
        if (typeof value === "string" && value.startsWith("refn:")) {
          const refnSchemaName = value.replace("refn:", "");
          const refnSchemaState = getSchemaById(refnSchemaName);
          if (schemaHasEdits(refnSchemaState) && refnSchemaState.attributes && refnSchemaState.attributes.length > 0) {
            childSchemasToCreate.set(refnSchemaName, refnSchemaState);
          }
        }
        // Handle refs: references from original package - always preserve child schemas with attributes
        else if (typeof value === "string" && value.startsWith("refs:")) {
          const refsSchemaId = value.replace("refs:", "");
          const refsSchemaState = getSchemaById(refsSchemaId);
          // Include if initialized (was loaded from package) and has attributes
          if (schemaHasEdits(refsSchemaState) && refsSchemaState.attributes && refsSchemaState.attributes.length > 0) {
            childSchemasToCreate.set(refsSchemaId, refsSchemaState);
          }
        }
      });
    });
  
    // Phase 3: Create OCA dependency structures for collected child schemas
    // Only creates dependencies that don't already exist in the package
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
          // Convert "Child Schema" or "Placeholder Child Schema" types to refn: format in nested schemas too
          if (childAttr.Type === TYPE_CHILD_SCHEMA || childAttr.Type === TYPE_PLACEHOLDER_CHILD_SCHEMA) {
            childAttributes[childAttr.Attribute] = `refn:${childAttr.Attribute}`;
          } else if (childAttr.Type === TYPE_ARRAY_PLACEHOLDER_CHILD_SCHEMA) {
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
        overlays: {
          meta: [],
          label: [],
          information: [],
        },
      };

      applyAllOverlays(newDependency, childschemaState);
      
      // Ensure metadata overlay exists with a meaningful name
      // If schema state didn't have metadata, create default metadata using parent's attribute label
      if (!newDependency.overlays.meta || newDependency.overlays.meta.length === 0) {
        // Get languages from root schema or default to English
        const rootMetaOverlays = bundle?.overlays?.meta || [];
        const parentLanguages = rootMetaOverlays.map((m) => m.language).filter(Boolean);
        const languagesToUse = parentLanguages.length > 0 ? parentLanguages : ["eng"];
        
        // Find the best display name by looking up the parent's attribute label
        const displayName = resolveChildSchemaDisplayName(childSchemaName, bundle, dependencies);
        
        newDependency.overlays.meta = languagesToUse.map((lang) =>
          createMetaOverlay(
            newDependency.capture_base.d,
            lang,
            displayName,
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
