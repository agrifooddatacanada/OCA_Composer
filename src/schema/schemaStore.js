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
import { overlayItems } from "../constants/constants";

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
  entryCodes: {},
  attributesWithLists: [],
  // Overlay selection state (per-schema) - generated from overlayItems
  overlaySelections: overlayItems,
  selectedOverlay: "",
  // Language-specific data
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
  initialized: false,  // true = schema has been processed by OCAParser or saved by user (don't re-parse)
  hasLoadedFromOverlays: false,  // true = component has already loaded entry codes/lang data from overlays
  // Persisted user removals
  deletedAttributes: []  // Track attribute names that user explicitly deleted
});

export const makeSchemaStore = ({ getAllSchemaStates, setSchemaStates, getCurrentSchemaId }) => {
    
  // ============================================================================
  // CORE STATE ACCESS
  // ============================================================================
  
  const getSchemaState = () => {
    const schemaId = getCurrentSchemaId();
    const allStates = getAllSchemaStates();
    return allStates[schemaId] || createDefaultSchemaState();
  };

  const getSchemaStateById = (schemaId) => {
    const allStates = getAllSchemaStates();
    return allStates[schemaId] || null;
  };

  // ============================================================================
  // STATE MUTATIONS (SETTERS)
  // ============================================================================
  
  const updateSchemaState = (updates) => {
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
    updateSchemaState({ attributeRanges });
  };

  const setFormatRuleRowData = (newData) => {
    const attributeFormats = {};
    newData.forEach(row => {
      const formatRule = row["Format Rule"] || row["Custom Format Rule"];
      if (formatRule) {
        attributeFormats[row.Attribute] = formatRule;
      }
    });
    updateSchemaState({ attributeFormats });
  };

  const setCardinalityData = (newData) => {
    const attributeCardinality = {};
    newData.forEach(item => {
      const cardinalityValue = item.EntryLimit || item.Cardinality || "";
      if (cardinalityValue) {
        attributeCardinality[item.Attribute] = cardinalityValue;
      }
    });
    updateSchemaState({ attributeCardinality });
  };

  // ============================================================================
  // OVERLAY SELECTION STATE
  // ============================================================================
  
  const getOverlaySelections = () => {
    const state = getSchemaState();
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
    updateSchemaState({ selectedOverlay: overlayKey });
  };

  const getSelectedOverlay = () => {
    const state = getSchemaState();
    return state.selectedOverlay || "";
  };

  // ============================================================================
  // COMPUTED/DERIVED DATA (QUERIES)
  // ============================================================================
  
  const getDeletedAttributes = () => {
    const state = getSchemaState();
    return new Set(state.deletedAttributes || []);
  };

  const getAttributesList = () => {
    const state = getSchemaState();
    const attributes = state?.attributes || [];
    return attributes.map((attr) => attr.Attribute);
  };

  const getLanguages = () => {
    const state = getSchemaState();
    return state?.metadata?.languages || [];
  };

  const getCardinalityData = () => {
    const state = getSchemaState();
    const attributes = state?.attributes || [];
    const map = state?.attributeCardinality || {};

    return attributes.map(attr => ({
      Attribute: attr.Attribute,
      Type: attr.Type,
      Cardinality: map[attr.Attribute] || ""
    }));
  };

  const getFormatRuleData = () => {
    const state = getSchemaState();
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
    const state = getSchemaState();
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
    getSchemaState,
    getSchemaStateById,

    // State mutations
    updateSchemaState,
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