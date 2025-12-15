import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
  useMemo
} from "react";
import {
  FIELD_CHARACTER_ENCODING_OVERLAY,
  FIELD_CONFORMANCE_OVERLAY,
  FIELD_FORMAT_OVERLAY,
  FIELD_CARDINALITY_OVERLAY,
  FIELD_DATA_STANDARDS_OVERLAY,
  FIELD_UNIT_FRAMING_OVERLAY,
  FIELD_RANGE_OVERLAY,
  FIELD_ATTRIBUTE_FRAMING_OVERLAY,
  CUSTOM_FORMAT_RULE
} from "../constants/constants";
import { OCAParser } from "../utils/ocaParser";
import { getSchemaDataById } from "../SchemaVisualization/dataUtils";
import { LanguageConstants } from "../utils/languageUtils";

/**
 * Multi-Schema Context
 * 
 * This context manages the state of multiple schemas within a single OCA package.
 * Each schema can be independently edited while maintaining a reference to its original OCA data.
 * 
 * STATE ARCHITECTURE:
 * -------------------
 * 1. `schemaStates` - Map of schemaId -> schemaState, where each schemaState contains:
 *    - `completeSchema`: Original OCA data (read-only reference, used for viewing/comparison)
 *    - `attributes`: Array of edited attributes (working copy for user edits)
 *    - `lanAttributeRowData`: Language-specific labels/descriptions extracted from label overlays
 *    - `overlays`: User-edited overlay data (character encoding, format rules, etc.)
 *    - `initialized`: Flag indicating if the schema has been processed (see lifecycle below)
 * 
 * 2. `currentSchemaId` - The schema currently being edited (null for manual creation flow)
 * 
 * INITIALIZATION LIFECYCLE:
 * -------------------------
 * A. Manual Creation (user starts from scratch):
 *    1. User enters attribute names in CreateManually component
 *    2. currentSchemaId = null (uses "manual-creation-schema" internally)
 *    3. attributes = [] initially, populated as user adds attributes
 *    4. initialized = false until first save in AttributeDetails
 *    5. When saved, initialized = true to prevent re-population
 * 
 * B. File Upload (user loads an OCA package):
 *    1. initializeFromOCAPackage() is called with the uploaded OCA data
 *    2. For each schema in the package, addSchemaFromOCA() is called:
 *       a. OCAParser.parseSchemaData() extracts attributes, labels, overlays from OCA format
 *       b. attributes array is populated with parsed data (even if empty: [])
 *       c. lanAttributeRowData is populated with labels from label overlays
 *       d. initialized = true (schema is ready to edit, don't re-parse)
 *    3. currentSchemaId is set to the root schema
 *    4. Components load the parsed data and display it
 * 
 * C. Attribute Deletion:
 *    1. User deletes attributes in AttributeDetails
 *    2. attributes array shrinks (can become empty: [])
 *    3. initialized = true (prevents re-population from completeSchema)
 *    4. Deleted attribute names are tracked in deletedAttributes array
 * 
 * IMPORTANT: The `initialized` flag distinguishes between:
 *   - "Never touched" (initialized=false, attributes=undefined) → Can init from completeSchema
 *   - "Parsed from file" (initialized=true, attributes=[...]) → Don't re-parse
 *   - "User deleted all" (initialized=true, attributes=[]) → Don't re-populate
 * 
 * EXPORT FLOW:
 * ------------
 * exportSchemaChanges() rebuilds the OCA package by:
 *   1. Only processing schemas where initialized=true (skip untouched schemas)
 *   2. Rebuilding capture_base.attributes from schemaState.attributes array
 *   3. Applying overlay changes from schemaState.overlays
 *   4. If attributes=[], the exported schema will have empty attributes (deletion persisted)
 */

// Create the multi-schema context
const MultiSchemaContext = createContext();

// Default schema state structure  
const createDefaultSchemaState = () => ({
  // Complete schema data (NEW: includes everything from OCA)
  completeSchema: {
    id: "",
    metadata: {
      name: "",
      description: "",
      languages: [LanguageConstants.DEFAULT_SCHEMA_LANGUAGE],
      digest: ""
    },
    attributes: {}, // Raw attribute definitions from OCA
    overlays: {
      label: [],
      unit: [],
      cardinality: [],
      format: [],
      character_encoding: [],
      conformance: [],
      entry: [],
      entry_code: []
    }
  },
  
  // User editing state (existing structure preserved)
  // Schema metadata
  metadata: {
    name: "",
    description: "",
    languages: [LanguageConstants.DEFAULT_SCHEMA_LANGUAGE]
  },
  // Schema attributes
  attributes: [],
  attributesList: [],
  // Schema overlays
  overlays: {
    label: {},
    unit: {},
    cardinality: {},
    format: {},
    character_encoding: {},
    conformance: {},
    entry: {}
  },
  // Entry codes
  entryCodes: {},
  attributesWithLists: [],
  // Overlay selection state (per-schema)
  overlaySelections: {
    [FIELD_CHARACTER_ENCODING_OVERLAY]: { feature: "Character Encoding", selected: false },
    [FIELD_CONFORMANCE_OVERLAY]: { feature: "Make selected entries required", selected: false },
    [FIELD_FORMAT_OVERLAY]: { feature: "Add format rule for data", selected: false },
    [FIELD_CARDINALITY_OVERLAY]: { feature: "Cardinality", selected: false },
    [FIELD_DATA_STANDARDS_OVERLAY]: { feature: "Data Standards", selected: false },
    [FIELD_UNIT_FRAMING_OVERLAY]: { feature: "Unit Framing", selected: false },
    [FIELD_RANGE_OVERLAY]: { feature: "Add range rule for data", selected: false },
    [FIELD_ATTRIBUTE_FRAMING_OVERLAY]: { feature: "Attribute Framing", selected: false }
  },
  selectedOverlay: "",
  // Language-specific data
  lanAttributeRowData: {},
  // Overlay display data (populated during initialization)
  characterEncodingData: {},  // Object mapping attribute name to encoding
  formatRuleData: [],
  cardinalityData: [],
  dataStandardsData: [],
  rangeData: [],
  unitData: [],
  unitFramedData: [],
  attributeFramingData: [],
  // Flags
  frameAllUnits: false,
  frameAllAttributes: false,
  unframedUnitList: [],
  unframedAttributeList: [],
  unitFramedThatAlreadyExist: {},
  // Lifecycle flags
  initialized: false,  // true = schema has been processed by OCAParser or saved by user (don't re-parse)
  // Persisted user removals
  deletedAttributes: []  // Track attribute names that user explicitly deleted
});

// Multi-schema provider component
export const MultiSchemaProvider = ({ children, OCAPackage }) => {
  const PERSIST_VERSION = 2;

  // Multi-schema state - Use ref to persist across StrictMode remounts
  const schemaStatesRef = useRef({});
  const [schemaStates, _setSchemaStates] = useState({});
  const [currentSchemaId, setCurrentSchemaId] = useState(null);
  
  // Wrapper to keep ref in sync with state
  const setSchemaStates = useCallback((updater) => {
    _setSchemaStates(prevState => {
      const newState = typeof updater === 'function' ? updater(prevState) : updater;
      schemaStatesRef.current = newState; // Keep ref in sync
      return newState;
    });
  }, []);
  
  // CRITICAL FIX: Restore from ref on mount (survives StrictMode remounts)
  useEffect(() => {
    if (Object.keys(schemaStates).length === 0 && Object.keys(schemaStatesRef.current).length > 0) {
      _setSchemaStates(schemaStatesRef.current);
    }
  }, []); // Run only on mount

  // Step management callback

  // Refs for persistence
  const saveTimerRef = useRef(null);

  // Constants for special schema IDs
  const MANUAL_CREATION_SCHEMA_ID = "manual-creation-schema";

  // Get state for a specific schema - auto-create temp schemas
  const getSchemaState = useCallback(
    (schemaId) => {
      // If no schemaId provided, use manual creation schema
      const targetId = schemaId || MANUAL_CREATION_SCHEMA_ID;
      
      // Return existing schema state or create default
      return schemaStates[targetId] || createDefaultSchemaState();
    },
    [schemaStates]
  );

  // Update state for a specific schema - auto-create if needed
  const updateSchemaState = useCallback(
    (schemaId, updates) => {
      // If no schemaId provided, use manual creation schema
      const targetId = schemaId || MANUAL_CREATION_SCHEMA_ID;
      
      setSchemaStates((prev) => {
        // CRITICAL: Use prev (latest state) instead of getSchemaState (potentially stale)
        // This prevents race conditions when multiple components update state simultaneously
        const currentState = prev[targetId] || createDefaultSchemaState();
        
        // Deep merge metadata to prevent race conditions
        const updatedState = { ...currentState, ...updates };
        if (updates.metadata) {
          updatedState.metadata = {
            ...currentState.metadata,
            ...updates.metadata
          };
        }
        
        return {
          ...prev,
          [targetId]: updatedState
        };
      });
    },
    [] // No dependencies needed - using functional setState
  );

  // Get current working schema ID (with fallback to temp)
  const getCurrentSchemaId = useCallback(() => 
    currentSchemaId || MANUAL_CREATION_SCHEMA_ID
  , [currentSchemaId]);

  // Switch to a schema or create manual creation schema if none specified
  const ensureSchemaExists = useCallback((schemaId) => {
    const targetId = schemaId || MANUAL_CREATION_SCHEMA_ID;
    
    // Initialize schema if it doesn't exist
    if (!schemaStates[targetId]) {
      setSchemaStates((prev) => ({
        ...prev,
        [targetId]: createDefaultSchemaState()
      }));
    }
    
    return targetId;
  }, [schemaStates]);

  // Track deleted attributes
  const addDeletedAttributes = useCallback((schemaId, attributeNames) => {
    if (!Array.isArray(attributeNames) || attributeNames.length === 0) return;
    setSchemaStates((prev) => {
      const prevState = prev[schemaId] || createDefaultSchemaState();
      const existing = new Set(prevState.deletedAttributes || []);
      attributeNames.forEach((n) => existing.add(n));
      return {
        ...prev,
        [schemaId]: {
          ...prevState,
          deletedAttributes: Array.from(existing)
        }
      };
    });
  }, []);

  const getDeletedAttributes = useCallback(
    (schemaId) => {
      const state = getSchemaState(schemaId);
      return new Set(state.deletedAttributes || []);
    },
    [getSchemaState]
  );

  /**
   * Initialize schema from OCA package (low-level parser call)
   * 
   * Called by: addSchemaFromOCA() and switchToSchema()
   * 
   * What it does:
   * - Calls OCAParser.parseSchemaData() to extract attributes, labels, overlays from OCA format
   * - Sets the parsed state in schemaStates
   * - Does NOT set initialized=true (caller is responsible for that)
   * 
   * Note: Prefer using addSchemaFromOCA() instead, which also sets initialized=true
   */
  const initializeSchemaFromOCA = useCallback((schemaId, ocaPackage) => {
    const parsedState = OCAParser.parseSchemaData(schemaId, ocaPackage);
    if (!parsedState) {
      return;
    }
    
    setSchemaStates((prev) => ({
      ...prev,
      [schemaId]: parsedState
    }));
  }, []);

  // Switch to editing a different schema
  const switchToSchema = useCallback(
    (schemaId, ocaPackage) => {
      // Canonicalize schema id so root aliases ("root", name) map to the same key
      const canonicalizeSchemaId = (pkg, id) => {
        if (!pkg) return id;
        const rootDigest = pkg.bundle?.d;
        // Collect possible root names from meta overlays if present (handle array or object)
        const rootNames = new Set();
        const metaOverlay = pkg.bundle?.overlays?.meta;
        if (Array.isArray(metaOverlay)) {
          metaOverlay.forEach((m) => {
            if (m && typeof m.name === "string") {
              rootNames.add(m.name);
            }
          });
        } else if (metaOverlay && typeof metaOverlay === "object") {
          Object.keys(metaOverlay).forEach((lang) => {
            const metaForLang = metaOverlay[lang];
            if (
              metaForLang &&
              typeof metaForLang === "object" &&
              typeof metaForLang.name === "string"
            ) {
              rootNames.add(metaForLang.name);
            }
          });
        }
        if (id === "root" || (rootDigest && id === rootDigest) || rootNames.has(id)) {
          return rootDigest || "root";
        }
        return id;
      };

      const resolvedId = canonicalizeSchemaId(ocaPackage, schemaId);

      // If state exists under the original id and not under resolved id, migrate it.
      // Also determine if initialization is needed based on current state snapshot.
      let shouldInitialize = false;
      setSchemaStates((prev) => {
        const willMigrate =
          schemaId !== resolvedId && prev[schemaId] && !prev[resolvedId];
        const hasExisting = !!(prev[resolvedId] || prev[schemaId]);
        shouldInitialize = !hasExisting;
        if (willMigrate) {
          return {
            ...prev,
            [resolvedId]: prev[schemaId]
          };
        }
        return prev;
      });

      setCurrentSchemaId(resolvedId);

      // Initialize schema if it doesn't exist (based on snapshot above)
      if (shouldInitialize && ocaPackage) {
        initializeSchemaFromOCA(resolvedId, ocaPackage);
      }
    },
    [initializeSchemaFromOCA]
  );

  /**
   * Export schema changes back to OCA package format
   * 
   * Called by: ViewSchema (for visualization and export), useMultiSchemaExport
   * 
   * What it does:
   * - Takes the original OCA package and applies all user edits from schemaStates
   * - Only processes schemas where initialized=true (skips untouched schemas)
   * - Rebuilds capture_base.attributes from schemaState.attributes array
   * - Applies overlay changes from schemaState.overlays
   * 
   * Important behavior:
   * - If schemaState.attributes=[], the exported schema will have empty attributes {}
   * - This ensures attribute deletions are persisted in exports
   * - If schemaState.attributes is undefined/null, rebuilding is skipped (use original)
   */
  const exportSchemaChanges = useCallback(
    (ocaPackage) => {
      if (!ocaPackage) {
        return ocaPackage;
      }

      const modifiedPackage = JSON.parse(JSON.stringify(ocaPackage));

      // Handle both package formats: direct { bundle, dependencies } or wrapped { oca_bundle: { bundle, dependencies } }
      const { getPackageBundle } = require("../utils/packageUtils");
      const bundle = getPackageBundle(modifiedPackage);
      const dependencies = modifiedPackage.oca_bundle?.dependencies || modifiedPackage.dependencies;

      // Apply changes to all schemas that have been initialized
      Object.keys(schemaStates).forEach((schemaId) => {
        const schemaState = getSchemaState(schemaId);
        if (!schemaState.initialized) return;  // Skip untouched schemas

        // Find the schema in the package
        let targetSchema = null;
        if (schemaId === bundle?.d) {
          targetSchema = bundle;
        } else {
          targetSchema = dependencies?.find((dep) => dep.d === schemaId);
        }

        // If targetSchema is not found, it might be a placeholder schema that needs to be created
        if (!targetSchema) {
          // Check if this is a placeholder schema by looking at the root schema's attributes
          const rootAttributes = bundle?.capture_base?.attributes || {};
          const isPlaceholder = Object.entries(rootAttributes).some(
            ([key, value]) =>
              key === schemaId && typeof value === "string" && value.startsWith("refn:")
          );

          if (isPlaceholder) {
            // Create a new dependency schema for this placeholder
            const newDependency = {
              d: schemaId,
              capture_base: {
                d: `placeholder_${schemaId}_${Date.now()}`,
                type: "spec/capture_base/1.1",
                attributes: {},
                classification: "RDF508",
                flagged_attributes: []
              },
              overlays: {
                meta: [
                  {
                    d: `meta_${schemaId}_${Date.now()}`,
                    capture_base: `placeholder_${schemaId}_${Date.now()}`,
                    type: "spec/overlays/meta/1.1",
                    language: "eng",
                    name: schemaId,
                    description: ""
                  }
                ]
              }
            };

            // Add the new dependency to the package
            if (modifiedPackage.oca_bundle) {
              if (!modifiedPackage.oca_bundle.dependencies) {
                modifiedPackage.oca_bundle.dependencies = [];
              }
              modifiedPackage.oca_bundle.dependencies.push(newDependency);
            } else {
              if (!modifiedPackage.dependencies) {
                modifiedPackage.dependencies = [];
              }
              modifiedPackage.dependencies.push(newDependency);
            }
            targetSchema = newDependency;
          } else {
            // Not a placeholder schema, skip
            return;
          }
        }

        // Apply attribute changes - rebuild attributes map to reflect additions/removals
        // CRITICAL: Check if schemaState.attributes is defined (not undefined/null)
        // - If attributes=[], rebuiltAttributes will be {} (all attributes deleted - persist this!)
        // - If attributes=[{...}], rebuiltAttributes will have the edited attributes
        // - If attributes is undefined, skip rebuilding (use original OCA data)
        if (schemaState.attributes !== undefined && schemaState.attributes !== null) {
          const originalAttributes = targetSchema.capture_base.attributes || {};
          const rebuiltAttributes = {};

          schemaState.attributes.forEach((attr) => {
            if (!attr || !attr.Attribute) return;
            const name = attr.Attribute;
            const type = attr.Type;
            if (type === "Child Schema") {
              // Always create a placeholder reference for Child Schema types
              // Check if original was already a reference (refn: or refs:), preserve that format
              const originalValue = originalAttributes[name];
              if (typeof originalValue === 'string' && (originalValue.startsWith('refn:') || originalValue.startsWith('refs:'))) {
                rebuiltAttributes[name] = originalValue;
              } else {
                rebuiltAttributes[name] = `refn:placeholder_${name}`;
              }
            } else {
              rebuiltAttributes[name] = type || "Text";
            }
          });

          // Set the rebuilt attributes (even if empty - this persists deletions)
          targetSchema.capture_base.attributes = rebuiltAttributes;
        }

        // Apply overlay changes - preserve original overlay structure
        if (!targetSchema.overlays) targetSchema.overlays = {};
        if (schemaState.overlays) {
          Object.entries(schemaState.overlays).forEach(([overlayType, overlayData]) => {
            if (overlayData) {
              targetSchema.overlays[overlayType] = overlayData;
            }
          });
        }

        // Rebuild meta overlays from localized metadata if present
        const locMeta = schemaState.metadata?.localized || {};
        const existingMeta = Array.isArray(targetSchema.overlays?.meta)
          ? targetSchema.overlays.meta
          : [];
        const metaArray = Object.entries(locMeta).map(([lang, obj]) => {
          const existingForLang = existingMeta.find((m) => m?.language === lang) || {};
          return {
            d: existingForLang.d || `meta_${Date.now()}_${lang}`,
            capture_base: targetSchema.capture_base?.d,
            type: "spec/overlays/meta/1.1",
            language: lang,
            name: obj?.name || "",
            description: obj?.description || ""
          };
        });
        if (metaArray.length > 0) {
          targetSchema.overlays.meta = metaArray;
        }

        // Rebuild conformance overlay from Required flags in attributes
        if (schemaState.attributes && schemaState.attributes.length > 0) {
          const hasRequiredFlags = schemaState.attributes.some((attr) => attr.Required === true || attr.Required === false);
          
          if (hasRequiredFlags) {
            const conformanceOverlay = {
              d: targetSchema.overlays?.conformance?.d || `conformance_${Date.now()}`,
              capture_base: targetSchema.capture_base.d,
              type: "spec/overlays/conformance/1.1",
              attribute_conformance: {}
            };

            schemaState.attributes.forEach((attr) => {
              if (attr.Attribute && (attr.Required === true || attr.Required === false)) {
                conformanceOverlay.attribute_conformance[attr.Attribute] = attr.Required ? "M" : "O";
              }
            });

            if (Object.keys(conformanceOverlay.attribute_conformance).length > 0) {
              if (!targetSchema.overlays) targetSchema.overlays = {};
              targetSchema.overlays.conformance = conformanceOverlay;
            }
          }
        }

        // Rebuild format overlay from formatRuleData
        if (schemaState.formatRuleData && schemaState.formatRuleData.length > 0) {
          const formatOverlay = {
            d: targetSchema.overlays?.format?.d || `format_${Date.now()}`,
            capture_base: targetSchema.capture_base.d,
            type: "spec/overlays/format/1.1",
            attribute_formats: {}
          };

          schemaState.formatRuleData.forEach((rule) => {
            if (rule.Attribute) {
              const formatRule = rule["Format Rule"] || rule[CUSTOM_FORMAT_RULE] || rule.FormatText;
              if (formatRule) {
                formatOverlay.attribute_formats[rule.Attribute] = formatRule;
              }
            }
          });

          if (Object.keys(formatOverlay.attribute_formats).length > 0) {
            if (!targetSchema.overlays) targetSchema.overlays = {};
            targetSchema.overlays.format = formatOverlay;
          }
        }

        // Rebuild character_encoding overlay from characterEncodingData
        if (schemaState.characterEncodingData && Object.keys(schemaState.characterEncodingData).length > 0) {
          const charEncodingOverlay = {
            d: targetSchema.overlays?.character_encoding?.d || `character_encoding_${Date.now()}`,
            capture_base: targetSchema.capture_base.d,
            type: "spec/overlays/character_encoding/1.1",
            attribute_character_encoding: {}
          };

          Object.entries(schemaState.characterEncodingData).forEach(([attr, encoding]) => {
            if (encoding) {
              charEncodingOverlay.attribute_character_encoding[attr] = encoding;
            }
          });

          if (Object.keys(charEncodingOverlay.attribute_character_encoding).length > 0) {
            if (!targetSchema.overlays) targetSchema.overlays = {};
            targetSchema.overlays.character_encoding = charEncodingOverlay;
          }
        }

        // Rebuild cardinality overlay from cardinalityData
        if (schemaState.cardinalityData && schemaState.cardinalityData.length > 0) {
          const cardinalityOverlay = {
            d: targetSchema.overlays?.cardinality?.d || `cardinality_${Date.now()}`,
            capture_base: targetSchema.capture_base.d,
            type: "spec/overlays/cardinality/1.1",
            attribute_cardinality: {}
          };

          schemaState.cardinalityData.forEach((card) => {
            if (card.Attribute) {
              const cardinalityValue = card.Cardinality || card.EntryLimit;
              if (cardinalityValue) {
                cardinalityOverlay.attribute_cardinality[card.Attribute] = cardinalityValue;
              }
            }
          });

          if (Object.keys(cardinalityOverlay.attribute_cardinality).length > 0) {
            if (!targetSchema.overlays) targetSchema.overlays = {};
            targetSchema.overlays.cardinality = cardinalityOverlay;
          }
        }

        // Rebuild standard overlay from dataStandardsData
        if (schemaState.dataStandardsData && schemaState.dataStandardsData.length > 0) {
          const standardOverlay = {
            d: targetSchema.overlays?.standard?.d || `standard_${Date.now()}`,
            capture_base: targetSchema.capture_base.d,
            type: "spec/overlays/standard/1.1",
            attr_standards: {}
          };

          schemaState.dataStandardsData.forEach((std) => {
            if (std.Attribute && std.DataStandard) {
              standardOverlay.attr_standards[std.Attribute] = std.DataStandard;
            }
          });

          if (Object.keys(standardOverlay.attr_standards).length > 0) {
            if (!targetSchema.overlays) targetSchema.overlays = {};
            targetSchema.overlays.standard = standardOverlay;
          }
        }

        // Rebuild range overlay from rangeData
        if (schemaState.rangeData && schemaState.rangeData.length > 0) {
          const rangeOverlay = {
            d: targetSchema.overlays?.range?.d || `range_${Date.now()}`,
            capture_base: targetSchema.capture_base.d,
            type: "spec/overlays/range/1.1",
            attributes: {}
          };

          schemaState.rangeData.forEach((range) => {
            if (range.Attribute && (range.LowerBound || range.UpperBound)) {
              rangeOverlay.attributes[range.Attribute] = {
                lower: range.LowerBound || "",
                lower_inclusive: range.LowerInclusive || false,
                upper: range.UpperBound || "",
                upper_inclusive: range.UpperInclusive || false
              };
            }
          });

          if (Object.keys(rangeOverlay.attributes).length > 0) {
            if (!targetSchema.overlays) targetSchema.overlays = {};
            targetSchema.overlays.range = rangeOverlay;
          }
        }

        // Apply entry codes
        if (schemaState.entryCodes && Object.keys(schemaState.entryCodes).length > 0) {
          // Reconstruct entry overlay from entry codes
          const entryOverlay = {
            d: targetSchema.overlays?.entry?.d || `entry_${Date.now()}`,
            capture_base: targetSchema.capture_base.d,
            type: "spec/overlays/entry/1.1",
            language: "eng",
            attribute_entries: {}
          };

          Object.entries(schemaState.entryCodes).forEach(([attrName, codes]) => {
            if (Array.isArray(codes)) {
              entryOverlay.attribute_entries[attrName] = {};
              codes.forEach((code) => {
                if (code.Code) {
                  entryOverlay.attribute_entries[attrName][code.Code] =
                    code.eng || code.English || "";
                }
              });
            }
          });

          if (!targetSchema.overlays) targetSchema.overlays = {};
          targetSchema.overlays.entry = [entryOverlay];
        }

        // Rebuild label and information overlays from lanAttributeRowData
        if (schemaState.lanAttributeRowData && Object.keys(schemaState.lanAttributeRowData).length > 0) {
          const labelOverlays = [];
          const informationOverlays = [];

          Object.entries(schemaState.lanAttributeRowData).forEach(([language, rows]) => {
            // Map language names to codes (English -> eng, French -> fra)
            const langCodeMap = { 
              'English': 'eng', 'French': 'fra', 'German': 'deu', 'Spanish': 'spa',
              'eng': 'eng', 'fra': 'fra', 'deu': 'deu', 'spa': 'spa'
            };
            const langCode = langCodeMap[language] || language;

            // Build label overlay for this language
            const labelOverlay = {
              d: targetSchema.overlays?.label?.find(l => l.language === langCode)?.d || `label_${langCode}_${Date.now()}`,
              capture_base: targetSchema.capture_base.d,
              type: "spec/overlays/label/1.0",
              language: langCode,
              attribute_labels: {}
            };

            // Build information overlay for this language
            const informationOverlay = {
              d: targetSchema.overlays?.information?.find(i => i.language === langCode)?.d || `information_${langCode}_${Date.now()}`,
              capture_base: targetSchema.capture_base.d,
              type: "spec/overlays/information/1.0",
              language: langCode,
              attribute_information: {}
            };

            if (Array.isArray(rows)) {
              rows.forEach((row) => {
                if (row.Attribute) {
                  if (row.Label) {
                    labelOverlay.attribute_labels[row.Attribute] = row.Label;
                  }
                  if (row.Description) {
                    informationOverlay.attribute_information[row.Attribute] = row.Description;
                  }
                }
              });
            }

            // Only add overlays if they have data
            if (Object.keys(labelOverlay.attribute_labels).length > 0) {
              labelOverlays.push(labelOverlay);
            }
            if (Object.keys(informationOverlay.attribute_information).length > 0) {
              informationOverlays.push(informationOverlay);
            }
          });

          if (labelOverlays.length > 0) {
            if (!targetSchema.overlays) targetSchema.overlays = {};
            targetSchema.overlays.label = labelOverlays;
          }
          if (informationOverlays.length > 0) {
            if (!targetSchema.overlays) targetSchema.overlays = {};
            targetSchema.overlays.information = informationOverlays;
          }
        }
      });

      // After processing all schemas, check for child schemas that need to be added as dependencies
      Object.keys(schemaStates).forEach((schemaId) => {
        const schemaState = getSchemaState(schemaId);
        if (!schemaState.initialized) return;

        // Look for "Child Schema" type attributes in this schema
        if (schemaState.attributes) {
          schemaState.attributes.forEach((attr) => {
            if (attr.Type === "Child Schema" || attr.Type === "Array[Child Schema]") {
              const childSchemaName = attr.Attribute;
              
              // Check if there's a schema state for this child schema
              const childSchemaState = getSchemaState(childSchemaName);              
              if (childSchemaState && (childSchemaState.initialized || childSchemaState.attributes?.length > 0)) {
                // Check if this child schema is already in the package
                const existsInPackage = modifiedPackage.dependencies?.some((dep) => dep.d === childSchemaName) ||
                                      modifiedPackage.bundle?.d === childSchemaName;
                
                if (!existsInPackage) {
                  // Create a new dependency for this child schema
                  const childAttributes = {};
                  childSchemaState.attributes?.forEach((childAttr) => {
                    if (childAttr.Attribute) {
                      if (childAttr.Type === "Child Schema") {
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
                      flagged_attributes: []
                    },
                    overlays: {
                      meta: [
                        {
                          d: `meta_${childSchemaName}_${Date.now()}`,
                          capture_base: `schema_${childSchemaName}_${Date.now()}`,
                          type: "spec/overlays/meta/1.1",
                          language: "eng",
                          name: childSchemaState.metadata?.name || childSchemaName,
                          description: childSchemaState.metadata?.description || ""
                        }
                      ]
                    }
                  };

                  // Add overlays from child schema state
                  if (childSchemaState.overlays) {
                    Object.entries(childSchemaState.overlays).forEach(([overlayType, overlayData]) => {
                      if (overlayData) newDependency.overlays[overlayType] = overlayData;
                    });
                  }

                  // Rebuild conformance overlay from Required flags in child schema attributes
                  if (childSchemaState.attributes && childSchemaState.attributes.length > 0) {
                    const hasRequiredFlags = childSchemaState.attributes.some((attr) => attr.Required === true || attr.Required === false);
                    
                    if (hasRequiredFlags) {
                      const conformanceOverlay = {
                        d: `conformance_${childSchemaName}_${Date.now()}`,
                        capture_base: newDependency.capture_base.d,
                        type: "spec/overlays/conformance/1.1",
                        attribute_conformance: {}
                      };

                      childSchemaState.attributes.forEach((attr) => {
                        if (attr.Attribute && (attr.Required === true || attr.Required === false)) {
                          conformanceOverlay.attribute_conformance[attr.Attribute] = attr.Required ? "M" : "O";
                        }
                      });

                      if (Object.keys(conformanceOverlay.attribute_conformance).length > 0) {
                        if (!newDependency.overlays) newDependency.overlays = {};
                        newDependency.overlays.conformance = conformanceOverlay;
                      }
                    }
                  }

                  // Rebuild format overlay from formatRuleData
                  if (childSchemaState.formatRuleData && childSchemaState.formatRuleData.length > 0) {
                    const formatOverlay = {
                      d: `format_${childSchemaName}_${Date.now()}`,
                      capture_base: newDependency.capture_base.d,
                      type: "spec/overlays/format/1.1",
                      attribute_formats: {}
                    };

                    childSchemaState.formatRuleData.forEach((rule) => {
                      if (rule.Attribute) {
                        const formatRule = rule["Format Rule"] || rule[CUSTOM_FORMAT_RULE] || rule.FormatText;
                        if (formatRule) {
                          formatOverlay.attribute_formats[rule.Attribute] = formatRule;
                        }
                      }
                    });

                    if (Object.keys(formatOverlay.attribute_formats).length > 0) {
                      if (!newDependency.overlays) newDependency.overlays = {};
                      newDependency.overlays.format = formatOverlay;
                    }
                  }

                  // Rebuild character_encoding overlay from characterEncodingData
                  if (childSchemaState.characterEncodingData && Object.keys(childSchemaState.characterEncodingData).length > 0) {
                    const charEncodingOverlay = {
                      d: `character_encoding_${childSchemaName}_${Date.now()}`,
                      capture_base: newDependency.capture_base.d,
                      type: "spec/overlays/character_encoding/1.1",
                      attribute_character_encoding: {}
                    };

                    Object.entries(childSchemaState.characterEncodingData).forEach(([attr, encoding]) => {
                      if (encoding) {
                        charEncodingOverlay.attribute_character_encoding[attr] = encoding;
                      }
                    });

                    if (Object.keys(charEncodingOverlay.attribute_character_encoding).length > 0) {
                      if (!newDependency.overlays) newDependency.overlays = {};
                      newDependency.overlays.character_encoding = charEncodingOverlay;
                    }
                  }

                  // Rebuild cardinality overlay from cardinalityData
                  if (childSchemaState.cardinalityData && childSchemaState.cardinalityData.length > 0) {
                    const cardinalityOverlay = {
                      d: `cardinality_${childSchemaName}_${Date.now()}`,
                      capture_base: newDependency.capture_base.d,
                      type: "spec/overlays/cardinality/1.1",
                      attribute_cardinality: {}
                    };

                    childSchemaState.cardinalityData.forEach((card) => {
                      if (card.Attribute) {
                        const cardinalityValue = card.Cardinality || card.EntryLimit;
                        if (cardinalityValue) {
                          cardinalityOverlay.attribute_cardinality[card.Attribute] = cardinalityValue;
                        }
                      }
                    });

                    if (Object.keys(cardinalityOverlay.attribute_cardinality).length > 0) {
                      if (!newDependency.overlays) newDependency.overlays = {};
                      newDependency.overlays.cardinality = cardinalityOverlay;
                    }
                  }

                  // Rebuild standard overlay from dataStandardsData
                  if (childSchemaState.dataStandardsData && childSchemaState.dataStandardsData.length > 0) {
                    const standardOverlay = {
                      d: `standard_${childSchemaName}_${Date.now()}`,
                      capture_base: newDependency.capture_base.d,
                      type: "spec/overlays/standard/1.1",
                      attr_standards: {}
                    };

                    childSchemaState.dataStandardsData.forEach((std) => {
                      if (std.Attribute && std.DataStandard) {
                        standardOverlay.attr_standards[std.Attribute] = std.DataStandard;
                      }
                    });

                    if (Object.keys(standardOverlay.attr_standards).length > 0) {
                      if (!newDependency.overlays) newDependency.overlays = {};
                      newDependency.overlays.standard = standardOverlay;
                    }
                  }

                  // Rebuild range overlay from rangeData
                  if (childSchemaState.rangeData && childSchemaState.rangeData.length > 0) {
                    const rangeOverlay = {
                      d: `range_${childSchemaName}_${Date.now()}`,
                      capture_base: newDependency.capture_base.d,
                      type: "spec/overlays/range/1.1",
                      attributes: {}
                    };

                    childSchemaState.rangeData.forEach((range) => {
                      if (range.Attribute && (range.LowerBound || range.UpperBound)) {
                        rangeOverlay.attributes[range.Attribute] = {
                          lower: range.LowerBound || "",
                          lower_inclusive: range.LowerInclusive || false,
                          upper: range.UpperBound || "",
                          upper_inclusive: range.UpperInclusive || false
                        };
                      }
                    });

                    if (Object.keys(rangeOverlay.attributes).length > 0) {
                      if (!newDependency.overlays) newDependency.overlays = {};
                      newDependency.overlays.range = rangeOverlay;
                    }
                  }

                  // Add entry codes if present
                  if (childSchemaState.entryCodes && Object.keys(childSchemaState.entryCodes).length > 0) {
                    const entryOverlay = {
                      d: `entry_${childSchemaName}_${Date.now()}`,
                      capture_base: newDependency.capture_base.d,
                      type: "spec/overlays/entry/1.1",
                      language: "eng",
                      attribute_entries: {}
                    };

                    Object.entries(childSchemaState.entryCodes).forEach(([attrName, codes]) => {
                      if (Array.isArray(codes)) {
                        entryOverlay.attribute_entries[attrName] = {};
                        codes.forEach((code) => {
                          if (code.Code) {
                            entryOverlay.attribute_entries[attrName][code.Code] =
                              code.eng || code.English || "";
                          }
                        });
                      }
                    });

                    if (!newDependency.overlays) newDependency.overlays = {};
                    newDependency.overlays.entry = [entryOverlay];
                  }

                  // Add the new dependency to the package
                  if (!modifiedPackage.dependencies) {
                    modifiedPackage.dependencies = [];
                  }
                  modifiedPackage.dependencies.push(newDependency);
                }
              }
            }
          });
        }
      });

      // After processing all schemas, scan for refn:placeholder_* references and create missing child schema dependencies
      const existingDepIds = new Set((dependencies || []).map(dep => dep.d));
      const placeholdersToCreate = new Set();

      // Scan root schema attributes
      if (bundle?.capture_base?.attributes) {
        Object.entries(bundle.capture_base.attributes).forEach(([attrName, attrType]) => {
          if (typeof attrType === 'string' && attrType.startsWith('refn:placeholder_')) {
            const placeholderId = attrType.replace('refn:placeholder_', '');
            if (!existingDepIds.has(placeholderId)) {
              placeholdersToCreate.add(placeholderId);
            }
          }
        });
      }

      // Scan dependency schema attributes
      (dependencies || []).forEach(dep => {
        if (dep?.capture_base?.attributes) {
          Object.entries(dep.capture_base.attributes).forEach(([attrName, attrType]) => {
            if (typeof attrType === 'string' && attrType.startsWith('refn:placeholder_')) {
              const placeholderId = attrType.replace('refn:placeholder_', '');
              if (!existingDepIds.has(placeholderId)) {
                placeholdersToCreate.add(placeholderId);
              }
            }
          });
        }
      });

      // Create placeholder child schema dependencies
      // Inherit languages from root schema
      const rootMetaOverlays = bundle?.overlays?.meta || [];
      const parentLanguages = rootMetaOverlays.map(m => m.language).filter(Boolean);
      const languagesToUse = parentLanguages.length > 0 ? parentLanguages : ['eng'];
      
      placeholdersToCreate.forEach(placeholderId => {
        // Create meta overlays for each language that the parent has
        const metaOverlays = languagesToUse.map(lang => ({
          d: `meta_${placeholderId}_${lang}_${Date.now()}`,
          capture_base: `capture_base_${placeholderId}_${Date.now()}`,
          type: "spec/overlays/meta/1.1",
          language: lang,
          name: placeholderId,
          description: `Placeholder child schema for ${placeholderId}`
        }));
        
        const newDependency = {
          d: placeholderId,
          capture_base: {
            d: `capture_base_${placeholderId}_${Date.now()}`,
            type: "spec/capture_base/1.1",
            attributes: {},
            classification: "RDF508",
            flagged_attributes: []
          },
          overlays: {
            meta: metaOverlays
          }
        };

        // Add to both wrapped and unwrapped package formats
        if (modifiedPackage.oca_bundle) {
          if (!modifiedPackage.oca_bundle.dependencies) {
            modifiedPackage.oca_bundle.dependencies = [];
          }
          modifiedPackage.oca_bundle.dependencies.push(newDependency);
        } else {
          if (!modifiedPackage.dependencies) {
            modifiedPackage.dependencies = [];
          }
          modifiedPackage.dependencies.push(newDependency);
        }
      });

      return modifiedPackage;
    },
    [getSchemaState, schemaStates]
  );

  // Clear all schema states
  const clearAllSchemas = useCallback(() => {
    setSchemaStates({});
    setCurrentSchemaId(null);

    // Clear localStorage for all multi-schema data
    try {
      // Clear all multi-schema entries (in case there are old ones)
      const keys = Object.keys(localStorage);
      keys.forEach((key) => {
        if (key.startsWith("oca_composer_multischema_")) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      // console.warn("Failed to clear localStorage:", error);
    }
  }, []);

    // === SIMPLIFIED: Direct field access with proper initialization ===
  
  /**
   * Add complete schema from OCA package (high-level initialization)
   * 
   * Called by: initializeFromOCAPackage() when user uploads an OCA file
   * 
   * What it does:
   * 1. Extracts schema metadata and structure from OCA package
   * 2. Calls initializeSchemaFromOCA() to parse attributes, labels, overlays
   * 3. Sets initialized=true to mark schema as ready for editing
   * 
   * This is the PRIMARY way schemas are loaded from files.
   * After this runs:
   * - attributes array is populated (even if empty: [])
   * - lanAttributeRowData has labels from label overlays
   * - initialized=true (components won't re-parse)
   */
  const addSchemaFromOCA = useCallback((ocaPackage, schemaId) => {
    if (!ocaPackage || !schemaId) return null;
    
    // Get complete schema data
    const schemaData = getSchemaDataById(ocaPackage, schemaId);
    if (!schemaData) return null;

    // Create complete schema object
    const completeSchema = {
      id: schemaId,
      metadata: {
        name: schemaData.schemaName || schemaId,
        description: schemaData.schemaDescription || "",
        languages: schemaData.languages || ["English"],
        digest: schemaData.digest || ""
      },
      attributes: schemaData.attributes || {},
      overlays: schemaData.overlays || {}
    };

    // Get existing state or create default
    const existingState = getSchemaState(schemaId);
    
    // If this is the first time initializing, use the existing initialization but add complete schema
    if (!existingState.initialized) {
      // First initialize using existing logic (calls OCAParser)
      initializeSchemaFromOCA(schemaId, ocaPackage);
      
      // Then immediately update with complete schema data and mark as initialized
      setSchemaStates((prev) => ({
        ...prev,
        [schemaId]: {
          ...prev[schemaId],
          completeSchema,
          initialized: true  // CRITICAL: Prevents components from re-parsing this schema
        }
      }));
    } else {
      // Schema was already initialized, just update the complete schema reference
      setSchemaStates((prev) => ({
        ...prev,
        [schemaId]: {
          ...prev[schemaId],
          completeSchema,
          initialized: true  // Ensure it stays marked as initialized
        }
      }));
    }

    return completeSchema;
  }, [getSchemaState, initializeSchemaFromOCA]);

  // Get complete schema (replaces getSchemaDataById calls)
  const getCompleteSchema = useCallback((schemaId) => {
    if (!schemaId) return null;
    const state = getSchemaState(schemaId);
    return state.completeSchema || null;
  }, [getSchemaState]);

  // Initialize multiple schemas from OCA package
  const initializeFromOCAPackage = useCallback((ocaPackage) => {
    if (!ocaPackage) return [];

    const schemaIds = [];
    
    // Normalize package structure - handle both wrapped and unwrapped formats
    const normalizedPackage = ocaPackage.oca_bundle ? ocaPackage : { oca_bundle: ocaPackage };
    const bundle = normalizedPackage.oca_bundle?.bundle || ocaPackage.bundle;
    const dependencies = normalizedPackage.oca_bundle?.dependencies || ocaPackage.dependencies;
    
    // Add root schema
    if (bundle) {
      const rootId = bundle.d;
      if (rootId) {
        addSchemaFromOCA(normalizedPackage, rootId);
        schemaIds.push(rootId);
      }
    }

    // Add dependency schemas
    if (dependencies && Array.isArray(dependencies)) {
      dependencies.forEach((dep) => {
        if (dep.d) {
          addSchemaFromOCA(normalizedPackage, dep.d);
          schemaIds.push(dep.d);
        }
      });
    }

    return schemaIds;
  }, [addSchemaFromOCA]);

  // Export schema to OCA format
  const exportSchemaToOCA = useCallback((schemaId) => {
    const state = getSchemaState(schemaId);
    if (!state.completeSchema) return null;

    // Merge complete schema with user edits
    const { completeSchema } = state;
    const userEdits = {
      attributes: state.attributes,
      overlays: state.overlays,
      entryCodes: state.entryCodes
    };

    // TODO: Implement proper OCA export logic
    // This would merge the complete schema with user edits
    return {
      ...completeSchema,
      userEdits
    };
  }, [getSchemaState]);

  // === OVERLAY SELECTION METHODS ===
  // Remove useCallback to avoid stale closure issues completely
  const getOverlaySelections = (schemaId) => {
    // Direct access to current schemaStates
    const targetId = schemaId || MANUAL_CREATION_SCHEMA_ID;
    const state = schemaStates[targetId] || createDefaultSchemaState();
    
    // Return default overlay options if none exist yet
    return state.overlaySelections || {
      [FIELD_CHARACTER_ENCODING_OVERLAY]: { feature: "Character Encoding", selected: false },
      [FIELD_CONFORMANCE_OVERLAY]: { feature: "Make selected entries required", selected: false },
      [FIELD_FORMAT_OVERLAY]: { feature: "Add format rule for data", selected: false },
      [FIELD_CARDINALITY_OVERLAY]: { feature: "Cardinality", selected: false },
      [FIELD_DATA_STANDARDS_OVERLAY]: { feature: "Data Standards", selected: false },
      [FIELD_UNIT_FRAMING_OVERLAY]: { feature: "Unit Framing", selected: false },
      [FIELD_RANGE_OVERLAY]: { feature: "Add range rule for data", selected: false },
      [FIELD_ATTRIBUTE_FRAMING_OVERLAY]: { feature: "Attribute Framing", selected: false }
    };
  };

  const updateOverlaySelection = useCallback((schemaId, overlayKey, updates) => {
    // Use setSchemaStates to get fresh state at update time
    setSchemaStates(prevStates => {
      const targetId = schemaId || currentSchemaId;
      const currentState = prevStates[targetId] || createDefaultSchemaState();
      const currentSelections = currentState.overlaySelections || {
        [FIELD_CHARACTER_ENCODING_OVERLAY]: { feature: "Character Encoding", selected: false },
        [FIELD_CONFORMANCE_OVERLAY]: { feature: "Make selected entries required", selected: false },
        [FIELD_FORMAT_OVERLAY]: { feature: "Add format rule for data", selected: false },
        [FIELD_CARDINALITY_OVERLAY]: { feature: "Cardinality", selected: false },
        [FIELD_DATA_STANDARDS_OVERLAY]: { feature: "Data Standards", selected: false },
        [FIELD_UNIT_FRAMING_OVERLAY]: { feature: "Unit Framing", selected: false },
        [FIELD_RANGE_OVERLAY]: { feature: "Add range rule for data", selected: false },
        [FIELD_ATTRIBUTE_FRAMING_OVERLAY]: { feature: "Attribute Framing", selected: false }
      };
      
      const updatedSelections = {
        ...currentSelections,
        [overlayKey]: {
          ...currentSelections[overlayKey],
          ...updates
        }
      };
      
      return {
        ...prevStates,
        [targetId]: {
          ...currentState,
          overlaySelections: updatedSelections
        }
      };
    });
  }, [currentSchemaId]);

  const setSelectedOverlay = useCallback((schemaId, overlayKey) => {
    updateSchemaState(schemaId, { selectedOverlay: overlayKey });
  }, [updateSchemaState]);

  const getSelectedOverlay = useCallback((schemaId) => {
    const state = getSchemaState(schemaId);
    return state.selectedOverlay || "";
  }, [getSchemaState]);

  // === END OVERLAY SELECTION METHODS ===

  // === END NEW UNIFIED SCHEMA METHODS ===


  // Persistence functions
  const saveToLocalStorage = useCallback(() => {
    // CRITICAL FIX: Use ref to get current value and don't save empty state during StrictMode remount
    const currentSchemaStates = schemaStatesRef.current;
    
    // Don't save if schemaStates is empty (likely during StrictMode remount)
    if (Object.keys(currentSchemaStates).length === 0) {
      return;
    }
    
    const stateToSave = {
      version: PERSIST_VERSION,
      schemaStates: currentSchemaStates
    };

    try {
      localStorage.setItem(
        "oca_composer_multischema",
        JSON.stringify(stateToSave)
      );
    } catch (error) {
      // console.warn("Failed to save multi-schema state to localStorage:", error);
    }
  }, []); // No dependencies - using ref

  const loadFromLocalStorage = useCallback(() => {
    try {
      const saved = localStorage.getItem("oca_composer_multischema");
      if (!saved) return false;

      const parsed = JSON.parse(saved);
      if (parsed.version !== PERSIST_VERSION) return false;

      const savedSchemas = parsed.schemaStates || {};
      const currentSchemas = schemaStatesRef.current;
      
      // CRITICAL FIX: Don't overwrite existing schemas with empty state
      if (Object.keys(savedSchemas).length === 0 && Object.keys(currentSchemas).length > 0) {
        return false;
      }
      
      setSchemaStates(savedSchemas);
      return true;
    } catch (error) {
      // console.warn("Failed to load multi-schema state from localStorage:", error);
      return false;
    }
  }, []);

  // Auto-save on changes
  useEffect(() => {
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }

    saveTimerRef.current = setTimeout(() => {
      saveToLocalStorage();
    }, 1000);

    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
    };
  }, [schemaStates, saveToLocalStorage]);

  // Auto-initialize from OCA package when it changes
  // DISABLED: This was causing re-initialization and data loss when navigating between pages
  // Now initialization is handled explicitly by components that need it (StartSchema, SchemaUpload)
  // useEffect(() => {
  //   if (OCAPackage && Object.keys(schemaStates).length === 0) {
  //     console.log("MultiSchemaContext: Auto-initializing from OCA package");
  //     const schemaIds = initializeFromOCAPackage(OCAPackage);
  //     
  //     if (schemaIds.length > 0 && !currentSchemaId) {
  //       setCurrentSchemaId(schemaIds[0]);
  //     }
  //   }
  // }, [OCAPackage, initializeFromOCAPackage, schemaStates, currentSchemaId]);

  // Context value
  const contextValue = useMemo(
    () => ({
      // State
      schemaStates,
      currentSchemaId,

      // Actions
      getSchemaState,
      updateSchemaState,
      getCurrentSchemaId,
      ensureSchemaExists,
      addDeletedAttributes,
      getDeletedAttributes,
      initializeSchemaFromOCA,
      switchToSchema,
      exportSchemaChanges,
      clearAllSchemas,

      // NEW: Unified schema methods
      addSchemaFromOCA,
      getCompleteSchema,
      initializeFromOCAPackage,
      exportSchemaToOCA,

      // Overlay selection methods
      getOverlaySelections,
      updateOverlaySelection,
      setSelectedOverlay,
      getSelectedOverlay,

      // Persistence
      saveToLocalStorage,
      loadFromLocalStorage
    }),
    [
      schemaStates,
      currentSchemaId,
      getSchemaState,
      updateSchemaState,
      getCurrentSchemaId,
      ensureSchemaExists,
      addDeletedAttributes,
      getDeletedAttributes,
      initializeSchemaFromOCA,
      switchToSchema,
      exportSchemaChanges,
      clearAllSchemas,
      addSchemaFromOCA,
      getCompleteSchema,
      initializeFromOCAPackage,
      exportSchemaToOCA,
      getOverlaySelections,
      updateOverlaySelection,
      setSelectedOverlay,
      getSelectedOverlay,
      saveToLocalStorage,
      loadFromLocalStorage
    ]
  );

  return (
    <MultiSchemaContext.Provider value={contextValue}>
      {children}
    </MultiSchemaContext.Provider>
  );
};

// Hook to use the multi-schema context
export const useMultiSchema = () => {
  const context = useContext(MultiSchemaContext);
  if (!context) {
    throw new Error("useMultiSchema must be used within a MultiSchemaProvider");
  }
  return context;
};
