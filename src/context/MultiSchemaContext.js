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
  FIELD_ATTRIBUTE_FRAMING_OVERLAY
} from "../constants/constants";
import { OCAParser } from "../utils/ocaParser";
import { getSchemaDataById } from "../SchemaVisualization/dataUtils";
import { LanguageConstants } from "../utils/languageUtils";

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
  // Lifecycle
  initialized: false,
  // Persisted user removals
  deletedAttributes: []
});

// Multi-schema provider component
export const MultiSchemaProvider = ({ children, OCAPackage }) => {
  const PERSIST_VERSION = 2;

  // Multi-schema state
  const [schemaStates, setSchemaStates] = useState({});
  const [currentSchemaId, setCurrentSchemaId] = useState(null);

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
      
      const currentState = getSchemaState(targetId);
      
      setSchemaStates((prev) => {
        const newState = {
          ...prev,
          [targetId]: {
            ...currentState,
            ...updates
          }
        };
        return newState;
      });
    },
    [getSchemaState]
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

  // Initialize schema from OCA package
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

  // Export schema changes back to OCA package format
  const exportSchemaChanges = useCallback(
    (ocaPackage) => {
      if (!ocaPackage) {
        return ocaPackage;
      }

      const modifiedPackage = JSON.parse(JSON.stringify(ocaPackage));

      // Apply changes to all schemas that have been initialized
      Object.keys(schemaStates).forEach((schemaId) => {
        const schemaState = getSchemaState(schemaId);
        if (!schemaState.initialized) return;

        // Find the schema in the package
        let targetSchema = null;
        if (schemaId === modifiedPackage.bundle?.d) {
          targetSchema = modifiedPackage.bundle;
        } else {
          targetSchema = modifiedPackage.dependencies?.find((dep) => dep.d === schemaId);
        }

        // If targetSchema is not found, it might be a placeholder schema that needs to be created
        if (!targetSchema) {
          // Check if this is a placeholder schema by looking at the root schema's attributes
          const rootAttributes = modifiedPackage.bundle?.capture_base?.attributes || {};
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
            if (!modifiedPackage.dependencies) {
              modifiedPackage.dependencies = [];
            }
            modifiedPackage.dependencies.push(newDependency);
            targetSchema = newDependency;
          } else {
            // Not a placeholder schema, skip
            return;
          }
        }

        // Apply attribute changes - rebuild attributes map to reflect additions/removals
        if (schemaState.attributes && schemaState.attributes.length > 0) {
          const originalAttributes = targetSchema.capture_base.attributes || {};
          const rebuiltAttributes = {};

          schemaState.attributes.forEach((attr) => {
            if (!attr || !attr.Attribute) return;
            const name = attr.Attribute;
            const type = attr.Type;
            if (type === "Child Schema") {
              // Preserve original reference value if present; otherwise create a placeholder ref
              rebuiltAttributes[name] =
                originalAttributes[name] || `refn:placeholder_${name}`;
            } else {
              rebuiltAttributes[name] = type || "Text";
            }
          });

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
  
  // Add complete schema from OCA package
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
      // First initialize using existing logic
      initializeSchemaFromOCA(schemaId, ocaPackage);
      
      // Then immediately update with complete schema data
      setSchemaStates((prev) => ({
        ...prev,
        [schemaId]: {
          ...prev[schemaId],
          completeSchema,
          initialized: true
        }
      }));
    } else {
      // Just update the complete schema data
      setSchemaStates((prev) => ({
        ...prev,
        [schemaId]: {
          ...prev[schemaId],
          completeSchema,
          initialized: true
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
    
    // Add root schema
    if (ocaPackage.bundle) {
      const rootId = ocaPackage.bundle.d;
      if (rootId) {
        addSchemaFromOCA(ocaPackage, rootId);
        schemaIds.push(rootId);
      }
    }

    // Add dependency schemas
    if (ocaPackage.dependencies && Array.isArray(ocaPackage.dependencies)) {
      ocaPackage.dependencies.forEach((dep) => {
        if (dep.d) {
          addSchemaFromOCA(ocaPackage, dep.d);
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
    const stateToSave = {
      version: PERSIST_VERSION,
      schemaStates
    };

    try {
      localStorage.setItem(
        "oca_composer_multischema",
        JSON.stringify(stateToSave)
      );
    } catch (error) {
      // console.warn("Failed to save multi-schema state to localStorage:", error);
    }
  }, [schemaStates]);

  const loadFromLocalStorage = useCallback(() => {
    try {
      const saved = localStorage.getItem("oca_composer_multischema");
      if (!saved) return false;

      const parsed = JSON.parse(saved);
      if (parsed.version !== PERSIST_VERSION) return false;

      setSchemaStates(parsed.schemaStates || {});

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
  useEffect(() => {
    if (OCAPackage && Object.keys(schemaStates).length === 0) {
      // Only initialize if we don't have any schemas yet
      // This prevents re-initialization when user is actively editing
      console.log("MultiSchemaContext: Auto-initializing from OCA package");
      const schemaIds = initializeFromOCAPackage(OCAPackage);
      
      // Set the first schema as active if none is set
      if (schemaIds.length > 0 && !currentSchemaId) {
        setCurrentSchemaId(schemaIds[0]);
      }
    }
  }, [OCAPackage, initializeFromOCAPackage, schemaStates, currentSchemaId]);

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
