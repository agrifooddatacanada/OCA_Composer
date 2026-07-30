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
import {
  getMapValueForAttributeName,
  normalizeAttributeNameKey
} from "../utils/stringUtils";
import {
  isRangeEligibleAttributeType,
  overlayItems,
  CUSTOM_FORMAT_RULE
} from "../constants/constants";

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
  overlaySelections: { ...overlayItems },
  selectedOverlay: "",
  // Language-specific data
  // IMPORTANT: lanAttributeRowData keys are language NAMES ("English", "French"), not OCA codes ("eng", "fra")
  // Structure: { "English": [{Attribute: "name", Label: "Name", Description: "...", List: "Not a List"}], ... }
  lanAttributeRowData: {},
  // Form Information overlay data (per-schema)
  FormInformationRowData: [],
  formPlaceholdersByLanguage: {}, // Placeholder text by language for form fields (parsed from form overlay)
  formBuilderPages: [],
  // Overlay display data (populated during initialization)
  characterEncodingData: {}, // Object mapping attribute name to encoding
  attributeFormats: {}, // Object mapping attribute name to format rule string
  attributeCardinality: {}, // Object mapping attribute name to cardinality value
  dataStandardsData: [],
  attributeRanges: {}, // Object mapping attribute name to {lower, upper, lower_inclusive, upper_inclusive}
  unitData: [],
  unitFramedData: [],
  attributeFramingData: [],
  // Data Separator overlay (ADC extension) - per-schema
  decimalSeparator: ".",
  fileDelimiterData: {
    fieldDelimiter: ",",
    // eslint-disable-next-line quotes -- Prettier formats a double-quote char as single-quoted
    quoteChar: '"',
    escapeChar: "\\",
    lineTerminator: "lf",
    dataStartRow: 1
  },
  arrayDelimiterData: {},
  enableDecimalSeparator: false,
  enableFileDelimiter: false,
  enableArrayDelimiter: false,
  // Example overlay — maps attribute name to an example value string
  exampleData: {},
  // Flags
  frameAllUnits: false,
  frameAllAttributes: false,
  unframedUnitList: [],
  unframedAttributeList: [],
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
  deletedAttributes: [] // Track attribute names that user explicitly deleted
});

/** Stable read fallback when no entry exists yet — do not mutate; updateSchema uses a fresh default for writes */
const READONLY_EMPTY_SCHEMA_STATE = createDefaultSchemaState();

export const makeSchemaStore = ({
  getAllSchemaStates,
  setSchemaStates,
  getCurrentSchemaId
}) => {
  // ============================================================================
  // CORE STATE ACCESS
  // ============================================================================

  const getSchema = () => {
    const schemaId = getCurrentSchemaId();
    const allStates = getAllSchemaStates();
    return allStates[schemaId] || READONLY_EMPTY_SCHEMA_STATE;
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
        attributeRanges[normalizeAttributeNameKey(row.Attribute)] = {
          lower: row.LowerBound || "",
          upper: row.UpperBound || "",
          lower_inclusive: row.LowerInclusive ?? false,
          upper_inclusive: row.UpperInclusive ?? false
        };
      }
    });
    updateSchema({ attributeRanges });
  };

  const setFormatRuleRowData = (newData) => {
    const attributeFormats = {};
    newData.forEach((row) => {
      const formatRule = row["Format Rule"] || row[CUSTOM_FORMAT_RULE];
      if (formatRule) {
        attributeFormats[normalizeAttributeNameKey(row.Attribute)] = formatRule;
      }
    });
    updateSchema({ attributeFormats });
  };

  const setCardinalityData = (newData) => {
    const attributeCardinality = {};
    newData.forEach((item) => {
      const cardinalityValue = item.EntryLimit || item.Cardinality || "";
      if (cardinalityValue) {
        attributeCardinality[normalizeAttributeNameKey(item.Attribute)] =
          cardinalityValue;
      }
    });
    updateSchema({ attributeCardinality });
  };

  // ============================================================================
  // OVERLAY SELECTION STATE
  // ============================================================================

  const getOverlaySelections = () => {
    const state = getSchema();
    const stored = state?.overlaySelections;
    if (!stored) return overlayItems;
    // Merge so that any overlay added to overlayItems after the state was
    // initialized (e.g. new overlays, HMR) is always present in the result.
    return { ...overlayItems, ...stored };
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
            [overlayKey]: selected
          }
        }
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
    const langs = state?.metadata?.languages;
    return Array.isArray(langs) && langs.length
      ? langs
      : [LanguageConstants.DEFAULT_LANG_NAME];
  };

  const getCardinalityData = () => {
    const state = getSchema();
    const attributes = state?.attributes || [];
    const map = state?.attributeCardinality || {};

    return attributes.map((attr) => ({
      Attribute: attr.Attribute,
      Type: attr.Type,
      Cardinality: getMapValueForAttributeName(map, attr.Attribute) || ""
    }));
  };

  const getFormatRuleData = () => {
    const state = getSchema();
    const attributes = state?.attributes || [];
    const attributeFormats = state?.attributeFormats || {};

    return attributes.map((attr) => {
      const rule = getMapValueForAttributeName(attributeFormats, attr.Attribute) || "";
      return {
        Attribute: attr.Attribute,
        Type: attr.Type,
        "Format Rule": rule,
        FormatText: rule
      };
    });
  };

  const getRangeData = () => {
    const state = getSchema();
    const attributes = state?.attributes || [];
    const attributeRanges = state?.attributeRanges || {};
    const attributeFormats = state?.attributeFormats || {};

    return attributes
      .filter((attr) => {
        const hasCorrectType = isRangeEligibleAttributeType(attr.Type);
        const formatRule = getMapValueForAttributeName(attributeFormats, attr.Attribute);
        const hasFormatRule = formatRule && String(formatRule).trim() !== "";
        return hasCorrectType && hasFormatRule;
      })
      .map((attr) => {
        const range = getMapValueForAttributeName(attributeRanges, attr.Attribute) || {};
        return {
          Attribute: attr.Attribute,
          Type: attr.Type,
          FormatRule: getMapValueForAttributeName(attributeFormats, attr.Attribute),
          LowerBound: range.lower || "",
          UpperBound: range.upper || "",
          LowerInclusive: range.lower_inclusive ?? false,
          UpperInclusive: range.upper_inclusive ?? false
        };
      });
  };

  const renameAttribute = (oldAttributeValue, newAttributeValue) => {
    if (typeof oldAttributeValue !== "string" || typeof newAttributeValue !== "string")
      return;
    if (oldAttributeValue === newAttributeValue) return;

    const oldNorm = normalizeAttributeNameKey(oldAttributeValue);
    const newNorm = normalizeAttributeNameKey(newAttributeValue);

    setSchemaStates((prev) => {
      const schemaId = getCurrentSchemaId();
      const currentState = prev[schemaId] || createDefaultSchemaState();

      if (!currentState) return prev;

      const renameInArrayOfObjectsAttribute = (arr) => {
        if (!Array.isArray(arr)) return arr;
        return arr.map((row) => {
          if (!row || typeof row !== "object") return row;
          const rowAttr = row.Attribute;
          if (typeof rowAttr !== "string") return row;
          const rowNorm = normalizeAttributeNameKey(rowAttr);
          const matches = rowAttr === oldAttributeValue || rowNorm === oldNorm;
          return matches ? { ...row, Attribute: newAttributeValue } : row;
        });
      };

      const renameInStringArray = (arr) => {
        if (!Array.isArray(arr)) return arr;
        let didRename = false;
        const next = arr.map((s) => {
          if (typeof s !== "string") return s;
          const sNorm = normalizeAttributeNameKey(s);
          const matches = s === oldAttributeValue || sNorm === oldNorm;
          if (!matches) return s;
          didRename = true;
          return newAttributeValue;
        });
        return didRename ? next : arr;
      };

      const renameKeyInObjectByNorm = (obj, targetKey) => {
        if (!obj || typeof obj !== "object" || Array.isArray(obj)) return obj;
        const next = { ...obj };
        const keys = Object.keys(obj);
        let didRename = false;

        keys.forEach((k) => {
          const kNorm = normalizeAttributeNameKey(k);
          const matches = k === oldAttributeValue || kNorm === oldNorm;
          if (!matches) return;
          if (k === targetKey) return;
          const existingTarget = Object.prototype.hasOwnProperty.call(next, targetKey);
          if (existingTarget) {
            delete next[k];
            didRename = true;
            return;
          }
          next[targetKey] = obj[k];
          delete next[k];
          didRename = true;
        });

        return didRename ? next : obj;
      };

      const renameOverlayMapKeys = (map) => {
        if (!map || typeof map !== "object" || Array.isArray(map)) return map;
        const next = { ...map };
        const targetKey = newNorm;
        const keys = Object.keys(map);
        let didRename = false;

        keys.forEach((k) => {
          const kNorm = normalizeAttributeNameKey(k);
          if (kNorm !== oldNorm) return;
          if (k === targetKey) return;
          if (Object.prototype.hasOwnProperty.call(next, targetKey) && k !== targetKey) {
            delete next[k];
            didRename = true;
            return;
          }
          next[targetKey] = map[k];
          delete next[k];
          didRename = true;
        });

        return didRename ? next : map;
      };

      const updatedState = { ...currentState };

      updatedState.attributes = renameInArrayOfObjectsAttribute(currentState.attributes);
      updatedState.attributeFormats = renameOverlayMapKeys(
        currentState.attributeFormats || {}
      );
      updatedState.attributeRanges = renameOverlayMapKeys(
        currentState.attributeRanges || {}
      );
      updatedState.attributeCardinality = renameOverlayMapKeys(
        currentState.attributeCardinality || {}
      );

      updatedState.formatRuleData = renameInArrayOfObjectsAttribute(
        currentState.formatRuleData
      );
      updatedState.rangeData = renameInArrayOfObjectsAttribute(currentState.rangeData);
      updatedState.cardinalityData = renameInArrayOfObjectsAttribute(
        currentState.cardinalityData
      );

      updatedState.characterEncodingData = renameKeyInObjectByNorm(
        currentState.characterEncodingData || {},
        newAttributeValue
      );

      const entryCodes = currentState.entryCodes || {};
      updatedState.entryCodes = renameKeyInObjectByNorm(entryCodes, newAttributeValue);

      updatedState.attributesWithLists = renameInStringArray(
        currentState.attributesWithLists || []
      );
      updatedState.deletedAttributes = renameInStringArray(
        currentState.deletedAttributes || []
      );

      updatedState.lanAttributeRowData = (() => {
        const lan = currentState.lanAttributeRowData || {};
        if (!lan || typeof lan !== "object") return lan;
        let didRename = false;
        const nextLan = { ...lan };
        Object.keys(lan).forEach((language) => {
          const rows = lan[language];
          if (!Array.isArray(rows)) return;
          const nextRows = rows.map((row) => {
            if (!row || typeof row !== "object") return row;
            const rowAttr = row.Attribute;
            if (typeof rowAttr !== "string") return row;
            const rowNorm = normalizeAttributeNameKey(rowAttr);
            const matches = rowAttr === oldAttributeValue || rowNorm === oldNorm;
            if (!matches) return row;
            didRename = true;
            return { ...row, Attribute: newAttributeValue };
          });
          nextLan[language] = didRename ? nextRows : rows;
        });
        return didRename ? nextLan : lan;
      })();

      updatedState.exampleData = renameOverlayMapKeys(currentState.exampleData || {});
      updatedState.unitFramedData = renameInArrayOfObjectsAttribute(currentState.unitFramedData);
      updatedState.attributeFramingData = renameInArrayOfObjectsAttribute(currentState.attributeFramingData);
      updatedState.dataStandardsData = renameInArrayOfObjectsAttribute(currentState.dataStandardsData);
      updatedState.FormInformationRowData = renameInArrayOfObjectsAttribute(
        currentState.FormInformationRowData || []
      );

      updatedState.unitData = renameInStringArray(currentState.unitData || []);
      updatedState.unframedUnitList = renameInStringArray(
        currentState.unframedUnitList || []
      );
      updatedState.unframedAttributeList = renameInStringArray(
        currentState.unframedAttributeList || []
      );

      updatedState.formPlaceholdersByLanguage = (() => {
        const fp = currentState.formPlaceholdersByLanguage || {};
        if (typeof fp !== "object") return fp;
        let didRename = false;
        const next = {};
        Object.keys(fp).forEach((language) => {
          const langMap = fp[language];
          const nextMap = renameKeyInObjectByNorm(langMap, newAttributeValue);
          if (nextMap !== langMap) didRename = true;
          next[language] = nextMap;
        });
        return didRename ? next : fp;
      })();

      updatedState.formBuilderPages = (() => {
        const pages = currentState.formBuilderPages;
        if (!Array.isArray(pages) || pages.length === 0) return pages;

        const renameQuestion = (q) => {
          if (!q || typeof q !== "object") return q;
          let next = q;
          if (typeof q.attribute === "string") {
            const rowNorm = normalizeAttributeNameKey(q.attribute);
            const matches = q.attribute === oldAttributeValue || rowNorm === oldNorm;
            if (matches) next = { ...next, attribute: newAttributeValue };
          }
          if (Array.isArray(next.showingAttribute) && next.showingAttribute.length > 0) {
            const nextShowing = renameInStringArray(next.showingAttribute);
            if (nextShowing !== next.showingAttribute) {
              next = { ...next, showingAttribute: nextShowing };
            }
            // pre-normalization questions may still carry `showing_attribute`.
          } else if (
            Array.isArray(next.showing_attribute) &&
            next.showing_attribute.length > 0
          ) {
            const nextShowing = renameInStringArray(next.showing_attribute);
            if (nextShowing !== next.showing_attribute) {
              next = { ...next, showing_attribute: nextShowing };
            }
          }
          return next;
        };

        let didRename = false;
        const nextPages = pages.map((page) => {
          if (!page) return page;
          const questions = (page.questions || []).map((q) => {
            const nextQ = renameQuestion(q);
            if (nextQ !== q) didRename = true;
            return nextQ;
          });
          const sections = (page.sections || []).map((section) => {
            const sectionQuestions = (section.questions || []).map((q) => {
              const nextQ = renameQuestion(q);
              if (nextQ !== q) didRename = true;
              return nextQ;
            });
            return sectionQuestions === section.questions
              ? section
              : { ...section, questions: sectionQuestions };
          });
          if (questions === page.questions && sections === page.sections) return page;
          return { ...page, questions, sections };
        });
        return didRename ? nextPages : pages;
      })();

      return {
        ...prev,
        [schemaId]: updatedState
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
    renameAttribute
  };
};
