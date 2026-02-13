/**
 * Schema Store
 * 
 * Manages state for each schema in the multi-schema context.
 * Provides getters and setters for:
 * - Core schema data (attributes, metadata, flagged attributes)
 * - Overlay selections (which overlays are enabled)
 * - Overlay data (format rules, cardinality, ranges, etc.)
 * 
 * Data storage formats:
 * - Attributes: Array of {Attribute, Type, Required} objects (AG-Grid format)
 * - Overlay data: Maps of attributeName -> value (e.g., attributeFormats, attributeCardinality)
 * - Grid setters normalize AG-Grid row arrays into maps for internal storage
 */

import { LanguageConstants } from "../utils/languageUtils";
import { overlayItems, CUSTOM_FORMAT_RULE } from "../constants/constants";

export const createDefaultSchemaState = () => ({
  completeSchema: {
    id: "",
    metadata: {
      name: "",
      description: "",
      languages: [LanguageConstants.DEFAULT_LANG_NAME],
      digest: ""
    },
    attributes: {},
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
  
  metadata: {
    name: "",
    description: "",
    languages: [LanguageConstants.DEFAULT_LANG_NAME]
  },
  attributes: [],
  // Note: attributesList is now computed via getAttributesList() - not stored
  overlays: {
    label: {},
    unit: {},
    cardinality: {},
    format: {},
    character_encoding: {},
    conformance: {},
    entry: {}
  },
  /**
   * Entry codes: Maps attribute name -> array of code objects
   * 
   * IMPORTANT: Language keys use FULL NAMES (English, French), NOT OCA codes (eng, fra)
   * This is the internal UI format. Export functions convert to OCA 3-letter codes.
   * 
   * Structure:
   * {
   *   "attribute_name": [
   *     { Code: "001", English: "Red", French: "Rouge" },
   *     { Code: "002", English: "Green", French: "Vert" }
   *   ]
   * }
   */
  entryCodes: {},
  attributesWithLists: [],
  // Overlay selection state (per-schema) - generated from overlayItems
  overlaySelections: overlayItems,
  selectedOverlay: "",
  // Language-specific data
  // IMPORTANT: lanAttributeRowData keys are language NAMES ("English", "French"), not OCA codes ("eng", "fra")
  // Structure: { "English": [{Attribute: "name", Label: "Name", Description: "...", List: "Not a List"}], ... }
  lanAttributeRowData: {},
  // Form Information overlay data (per-schema)
  FormInformationRowData: [],
  formPlaceholdersByLanguage: {},  // Placeholder text by language for form fields (parsed from form overlay)
  // Overlay display data (populated during initialization)
  characterEncodingData: {},  // Object mapping attribute name to encoding
  attributeFormats: {},  // Object mapping attribute name to format rule string
  attributeCardinality: {},  // Object mapping attribute name to cardinality value
  dataStandardsData: [],
  attributeRanges: {},  // Object mapping attribute name to {lower, upper, lower_inclusive, upper_inclusive}
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
  /**
   * initialized: Marks schema as "ready for export/visualization"
   * 
   * Automatically set to true when:
   * - Schema parsed from uploaded OCA package (ocaParser.js)
   * - ANY updateSchema() call is made (metadata, attributes, overlays, etc.)
   * - User saves attributes in AttributeDetails step
   * - ViewSchema ensures root schema is initialized before export
   * 
   * Used by buildPackageFromState to determine which schemas to process.
   * 
   * Design note: This flag serves dual purpose:
   * 1. "Has been loaded with data" (prevents re-parsing)
   * 2. "Has user edits" (includes in export)
   * Both purposes benefit from "true = touched by user or parser"
   */
  initialized: false,
  
  // Persisted user removals
  deletedAttributes: []  // Track attribute names that user explicitly deleted
});

export const makeSchemaStore = ({ getAllSchemaStates, setSchemaStates, getCurrentSchemaId }) => {
    
  // ============================================================================
  // CORE STATE ACCESS
  // ============================================================================
  
  const getSchema = () => {
    const schemaId = getCurrentSchemaId();
    const allStates = getAllSchemaStates();
    return allStates[schemaId] || createDefaultSchemaState();
  };

  const getSchemaById = (schemaId) => {
    const allStates = getAllSchemaStates();
    return allStates[schemaId] || null;
  };

  // ============================================================================
  // STATE MUTATIONS (SETTERS)
  // ============================================================================
  
  const updateSchema = (updates) => {
    const schemaId = getCurrentSchemaId();
    
    setSchemaStates((prev) => {
      const currentState = prev[schemaId] || createDefaultSchemaState();
      
      const updatedState = { ...currentState, ...updates };
      if (updates.metadata) {
        updatedState.metadata = {
          ...currentState.metadata,
          ...updates.metadata
        };
      }
      
      // CRITICAL: Mark schema as initialized whenever ANY change is made
      // This ensures schema is processed for export/visualization even if user
      // only edits metadata/overlays without touching attributes
      // Exception: Don't override if explicitly setting initialized to false
      if (updates.initialized !== false) {
        updatedState.initialized = true;
      }
      
      return {
        ...prev,
        [schemaId]: updatedState
      };
    });
  };

  const addDeletedAttributes = (attributeNames) => {
    const schemaId = getCurrentSchemaId();
    
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
  };

  const setRangeRowData = (newData) => {
    const attributeRanges = {};
    newData.forEach((row) => {
      if (row.LowerBound || row.UpperBound) {
        attributeRanges[row.Attribute] = {
          lower: row.LowerBound || "",
          upper: row.UpperBound || "",
          lower_inclusive: row.LowerInclusive ?? false,
          upper_inclusive: row.UpperInclusive ?? false,
        };
      }
    });
    updateSchema({ attributeRanges });
  };

  const setFormatRuleRowData = (newData) => {
    const attributeFormats = {};
    newData.forEach(row => {
      const formatRule = row["Format Rule"] || row[CUSTOM_FORMAT_RULE];
      if (formatRule) {
        attributeFormats[row.Attribute] = formatRule;
      }
    });
    updateSchema({ attributeFormats });
  };

  const setCardinalityData = (newData) => {
    const attributeCardinality = {};
    newData.forEach(item => {
      const cardinalityValue = item.EntryLimit || item.Cardinality || "";
      if (cardinalityValue) {
        attributeCardinality[item.Attribute] = cardinalityValue;
      }
    });
    updateSchema({ attributeCardinality });
  };

  // ============================================================================
  // OVERLAY SELECTION STATE
  // ============================================================================
  
  const getOverlaySelections = () => {
    const state = getSchema();
    return state?.overlaySelections || overlayItems;
  };

  const updateOverlaySelection = (overlayKey, selected) => {
    setSchemaStates((prevStates) => {
      const targetId = getCurrentSchemaId();
      const currentState = prevStates[targetId] || {};
      const currentSelections = currentState.overlaySelections || overlayItems;

      return {
        ...prevStates,
        [targetId]: {
          ...currentState,
          overlaySelections: {
            ...currentSelections,
            [overlayKey]: selected,
          },
        },
      };
    });
  };

  const setSelectedOverlay = (overlayKey) => {
    updateSchema({ selectedOverlay: overlayKey });
  };

  const getSelectedOverlay = () => {
    const state = getSchema();
    return state.selectedOverlay || "";
  };

  // ============================================================================
  // COMPUTED/DERIVED DATA (QUERIES)
  // ============================================================================
  
  const getDeletedAttributes = () => {
    const state = getSchema();
    return new Set(state.deletedAttributes || []);
  };

  const getAttributesList = () => {
    const state = getSchema();
    const attributes = state?.attributes || [];
    return attributes.map((attr) => attr.Attribute);
  };

  const getLanguages = () => {
    const state = getSchema();
    return state?.metadata?.languages || [];
  };

  const getCardinalityData = () => {
    const state = getSchema();
    const attributes = state?.attributes || [];
    const map = state?.attributeCardinality || {};

    return attributes.map(attr => ({
      Attribute: attr.Attribute,
      Type: attr.Type,
      Cardinality: map[attr.Attribute] || ""
    }));
  };

  const getFormatRuleData = () => {
    const state = getSchema();
    const attributes = state?.attributes || [];
    const attributeFormats = state?.attributeFormats || {};

    return attributes.map((attr) => {
      const rule = attributeFormats[attr.Attribute] || "";
      return {
        Attribute: attr.Attribute,
        Type: attr.Type,
        "Format Rule": rule,
        FormatText: rule,
      };
    });
  };

  const getRangeData = () => {
    const state = getSchema();
    const attributes = state?.attributes || [];
    const attributeRanges = state?.attributeRanges || {};
    const attributeFormats = state?.attributeFormats || {};

    return attributes
      .filter((attr) => attr.Type === "Numeric" || attr.Type === "DateTime")
      .map((attr) => {
        const range = attributeRanges[attr.Attribute] || {};
        return {
          Attribute: attr.Attribute,
          Type: attr.Type,
          FormatRule: attributeFormats[attr.Attribute] || "",
          LowerBound: range.lower || "",
          UpperBound: range.upper || "",
          LowerInclusive: range.lower_inclusive ?? false,
          UpperInclusive: range.upper_inclusive ?? false,
        };
      });
  };

  return { 
    // Core state access
    getSchema,
    getSchemaById,

    // State mutations
    updateSchema,
    addDeletedAttributes,
    setRangeRowData,
    setFormatRuleRowData, 
    setCardinalityData,
    
    // Overlay selection state
    getOverlaySelections,
    updateOverlaySelection,
    setSelectedOverlay,
    getSelectedOverlay,
    
    // Computed/derived data
    getDeletedAttributes,
    getAttributesList,
    getLanguages,
    getCardinalityData,
    getFormatRuleData,
    getRangeData,
  };
};