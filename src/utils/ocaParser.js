import { getSchemaDataById } from "../SchemaVisualization/dataUtils";
import {
  FIELD_CHARACTER_ENCODING_OVERLAY,
  FIELD_CONFORMANCE_OVERLAY,
  FIELD_FORMAT_OVERLAY,
  FIELD_CARDINALITY_OVERLAY,
  FIELD_DATA_STANDARDS_OVERLAY,
  FIELD_UNIT_FRAMING_OVERLAY,
  FIELD_RANGE_OVERLAY,
  FIELD_ATTRIBUTE_FRAMING_OVERLAY,
  FIELD_FORM_INFORMATION_OVERLAY,
  TYPE_CHILD_SCHEMA,
  TYPE_ARRAY_CHILD_SCHEMA
} from "../constants/constants";
import { langNameFromTwoLetters, langNameFromCodeOCA, LanguageConstants, normalizeToOCACode } from "./languageUtils";
import { getPackageBundle, getPackageDependencies, getPackageBundleId } from "./packageUtils";
import { searchUnits } from "./helpers";

/**
 * OCA Package Parser Utility
 * 
 * Extracts and transforms OCA (Overlays Capture Architecture) package data
 * into the format expected by the schema editing components.
 * 
 * PRIMARY PURPOSE:
 * When a user uploads an OCA file, this parser converts the raw OCA format
 * into the schemaState structure used by React components.
 * 
 * Called by: MultiSchemaContext.initializeSchemaFromOCA()
 * 
 * KEY EXTRACTIONS:
 * - attributes: Array of {Attribute, Type, List, Required, ...}
 * - lanAttributeRowData: Labels/descriptions by language from label overlays
 *   NOTE: Keyed by language NAMES ("English", "French"), not OCA codes ("eng", "fra")
 * - entryCodes: Entry code definitions for list attributes
 * - overlayData: Character encoding, format rules, cardinality, etc.
 */
export class OCAParser {
  
  /**
   * Parse OCA package data for a specific schema
   * 
   * @param {string} schemaId - The schema identifier
   * @param {Object} pkgUpload - The OCA package data
   * @returns {Object} Parsed schema state data ready for React components
   * 
   * IMPORTANT OUTPUTS:
   * - attributes: Always an array (even if empty: [])
   * - lanAttributeRowData: Object mapping language -> array of {Attribute, Label, Description, List}
   * - initialized: Always set to true (signals this schema has been parsed)
   * 
   * This ensures components don't need to re-parse from completeSchema.
   */
  static parseSchemaData(schemaId, pkgUpload) {
    // Normalize the OCA package format first
    // Handle oca_package format: { oca_bundle: { bundle, dependencies }, extensions }
    const pkgNormalized = pkgUpload?.oca_bundle ? {
      bundle: getPackageBundle(pkgUpload),
      dependencies: getPackageDependencies(pkgUpload),
      extensions: pkgUpload.extensions || pkgUpload.oca_bundle.extensions || {}
    } : pkgUpload;
    
    const schemaData = getSchemaDataById(pkgNormalized, schemaId);
    
    if (!schemaData) {
      return null;
    }

    // Get the capture_base ID for looking up extensions
    // Extensions are keyed by capture_base.d, not bundle.d
    // For root schema, use bundle.capture_base.d
    // For child schemas in dependencies, find the matching dependency's capture_base.d
    let captureBaseId = pkgNormalized?.bundle?.capture_base?.d;
    
    // Check if this is a child schema by looking in dependencies
    if (pkgNormalized?.dependencies) {
      const dependency = pkgNormalized.dependencies.find(
        dep => dep.d === schemaId || dep.capture_base?.d === schemaId
      );
      if (dependency) {
        captureBaseId = dependency.capture_base?.d || schemaId;
      }
    }
    
    // Fallback to schemaId if we couldn't determine capture_base ID
    captureBaseId = captureBaseId || schemaId;

    // Extract flagged_attributes from capture_base (for root schema)
    // For child schemas, get from dependencies
    let flaggedAttributes = [];
    const bundleId = getPackageBundleId(pkgNormalized);
    if (schemaId === bundleId || schemaId === pkgNormalized.bundle?.capture_base?.d || schemaId === "root") {
      flaggedAttributes = pkgNormalized.bundle?.capture_base?.flagged_attributes || [];
    } else if (pkgNormalized?.dependencies) {
      const dependency = pkgNormalized.dependencies.find(
        dep => dep.d === schemaId || dep.capture_base?.d === schemaId
      );
      if (dependency) {
        flaggedAttributes = dependency.capture_base?.flagged_attributes || [];
      }
    }

    // Build attributes array from OCA attributes object
    const attributes = this._buildAttributes(schemaData.attributes || {});

    // Parse entry overlays to mark lists and construct entry codes
    const { entryCodes, listSet } = this._parseEntryOverlays(schemaData.overlays?.entry);

    const attributesWithLists = attributes.map((a) => ({
      ...a,
      List: listSet.has(a.Attribute)
    }));

    // CRITICAL: Parse label and information overlays to extract Labels and Descriptions
    // This creates lanAttributeRowData with proper labels from the OCA file
    // If we don't do this, components will default to using Attribute names as Labels
    const lanAttributeRowData = this._parseLabelOverlays(
      schemaData.overlays?.label,
      schemaData.overlays?.information,
      attributesWithLists
    );

    // Copy descriptions from language data to main attributes for Attribute Details display
    // Use the first available language's description
    const firstLang = Object.keys(lanAttributeRowData)[0];
    if (firstLang && lanAttributeRowData[firstLang]) {
      attributesWithLists.forEach(attr => {
        const lanData = lanAttributeRowData[firstLang].find(lan => lan.Attribute === attr.Attribute);
        if (lanData?.Description) {
          attr.Description = lanData.Description;
        }
      });
    }

    // Parse overlays and populate display-friendly arrays for components
    // Pass captureBaseId for extension lookups
    const overlayData = this._parseOverlayData(
      schemaData.overlays, 
      attributesWithLists,
      pkgNormalized,
      captureBaseId
    );

    // Process conformance overlay for Required field in attributes
    this._processConformanceOverlay(
      schemaData.overlays?.conformance, 
      attributesWithLists
    );

    // Process unit overlay to populate Unit field in attributes
    this._processUnitOverlay(
      schemaData.overlays?.unit,
      attributesWithLists
    );

    // Process flagged_attributes to populate Sensitive field
    this._processFlaggedAttributes(
      flaggedAttributes,
      attributesWithLists
    );

    // Initialize overlay selections based on which overlays are present
    // Check if ADC extensions exist
    const hasUnitFramingExtension = !!pkgNormalized?.extensions?.adc?.[captureBaseId]?.overlays?.unit_framing;
    const hasRangeExtension = !!pkgNormalized?.extensions?.adc?.[captureBaseId]?.overlays?.range;
    const formOverlayData = pkgNormalized?.extensions?.adc?.[captureBaseId]?.overlays?.form_overlay || 
                           pkgNormalized?.extensions?.adc?.[captureBaseId]?.overlays?.form;
    const hasFormExtension = !!formOverlayData && (Array.isArray(formOverlayData) ? formOverlayData.length > 0 : !!formOverlayData.form_overlays);
    const overlaySelections = this._buildOverlaySelections(
      schemaData.overlays, 
      hasUnitFramingExtension,
      hasRangeExtension,
      hasFormExtension
    );

    // Build localized metadata from meta overlays
    const metadata = this._buildMetadata(schemaData, schemaId);

    return {
      metadata,
      attributes: attributesWithLists,  // Always an array, even if empty: []
      // Note: attributesList removed - now computed via getAttributesList() in MultiSchemaContext
      overlays: schemaData.overlays || {},
      overlaySelections,
      entryCodes,
      attributesWithLists: attributesWithLists
        .filter((a) => a.List)
        .map((a) => a.Attribute),
      lanAttributeRowData,  // Preserves labels from label overlays
      // Populated display-friendly overlay data for components
      ...overlayData,
      frameAllUnits: false,
      frameAllAttributes: false,
      unframedUnitList: [],
      unframedAttributeList: [],
      unitFramedThatAlreadyExist: {},
      initialized: true  // CRITICAL: Marks schema as parsed (don't re-parse)
    };
  }

  /**
   * Build attributes array from OCA attributes object
   * @private
   */
  static _buildAttributes(attributesObj) {
    return Object.entries(attributesObj).map(([name, type]) => ({
      Attribute: name,
      Type: this._normalizeType(type),
      Description: "",
      Required: false,
      List: false,
      Unit: "",
      Sensitive: false
    }));
  }

  /**
   * Normalize OCA attribute types to display format
   * @private
   */
  static _normalizeType(rawType) {
    if (!rawType) return "";
    
    // Handle array types (OCA arrays are represented as single-element arrays)
    if (Array.isArray(rawType)) {
      const first = rawType[0];
      if (typeof first === "string") {
        const inner = first.trim();
        // refs:/refn: = child schema reference in OCA spec
        if (inner.startsWith("refn:") || inner.startsWith("refs:"))
          return TYPE_ARRAY_CHILD_SCHEMA;
        const mapped = this._getTypeMapping()[inner.toLowerCase()] || inner;
        return `Array[${mapped}]`;
      }
      return "Array[Text]";
    }
    
    if (typeof rawType !== "string") return "";
    
    const t = rawType.trim();
    // refs:/refn: = child schema reference in OCA spec → display as "Child Schema"
    if (t.startsWith("refn:") || t.startsWith("refs:")) return TYPE_CHILD_SCHEMA;
    
    const arrayMatch = t.match(/^array\[(.+)\]$/i);
    if (arrayMatch) {
      const inner = arrayMatch[1];
      if (
        inner.toLowerCase().startsWith("refn:") ||
        inner.toLowerCase().startsWith("refs:")
      )
        return TYPE_ARRAY_CHILD_SCHEMA;
      const mapped = this._getTypeMapping()[inner.toLowerCase()] || inner;
      return `Array[${mapped}]`;
    }
    
    return this._getTypeMapping()[t.toLowerCase()] || rawType;
  }

  /**
   * Get type mapping for normalization
   * @private
   */
  static _getTypeMapping() {
    return {
      text: "Text",
      numeric: "Numeric",
      boolean: "Boolean",
      binary: "Binary",
      binaryfile: "Binaryfile",
      datetime: "DateTime"
    };
  }

  /**
   * Parse entry overlays to identify lists and build entry codes
   * 
   * Converts OCA file format (3-letter codes) to internal UI format (full language names):
   * INPUT:  entry overlays with language: "eng", "fra"
   * OUTPUT: entryCodes with keys: "English", "French"
   * 
   * @private
   */
  static _parseEntryOverlays(entryOverlay) {
    const entryCodes = {};
    const listSet = new Set();
    
    const addEntry = (attrName, code, langCode, text) => {
      listSet.add(attrName);
      if (!entryCodes[attrName]) entryCodes[attrName] = [];
      let row = entryCodes[attrName].find((r) => r.Code === code);
      if (!row) {
        row = { Code: code };
        entryCodes[attrName].push(row);
      }
      // CONVERSION: Any language code format → Full language name
      // Try OCA code (3-letter: eng, fra) first, then 2-letter: en, fr
      // This is how we store entry codes internally for consistency with UI
      const langName = langNameFromCodeOCA(langCode) || langNameFromTwoLetters(langCode) || langCode;
      row[langName] = text || "";
    };

    if (Array.isArray(entryOverlay)) {
      entryOverlay.forEach((o) => {
        const lang = o.language || LanguageConstants.DEFAULT_OCA_CODE;
        const attrMap = o.attribute_entries || {};
        Object.entries(attrMap).forEach(([attr, codeMap]) => {
          Object.entries(codeMap || {}).forEach(([code, text]) =>
            addEntry(attr, code, lang, text)
          );
        });
      });
    } else if (entryOverlay && typeof entryOverlay === "object") {
      Object.entries(entryOverlay).forEach(([lang, o]) => {
        const attrMap = o?.attribute_entries || {};
        Object.entries(attrMap).forEach(([attr, codeMap]) => {
          Object.entries(codeMap || {}).forEach(([code, text]) =>
            addEntry(attr, code, lang, text)
          );
        });
      });
    }

    return { entryCodes, listSet };
  }

  /**
   * Parse label and information overlays for language-specific data
   * @private
   */
  static _parseLabelOverlays(labelOverlays, informationOverlays, attributesWithLists) {
    const lanAttributeRowData = {};
    
    // First, process label overlays for labels
    const labelsByLang = {};
    if (Array.isArray(labelOverlays)) {
      labelOverlays.forEach((overlay) => {
        if (overlay && overlay.language) {
          labelsByLang[overlay.language] = overlay.attribute_labels || {};
        }
      });
    } else if (labelOverlays && typeof labelOverlays === "object") {
      Object.entries(labelOverlays).forEach(([lang, overlay]) => {
        if (overlay) {
          labelsByLang[lang] = overlay.attribute_labels || {};
        }
      });
    }

    // Then, process information overlays for descriptions
    const descriptionsByLang = {};
    if (Array.isArray(informationOverlays)) {
      informationOverlays.forEach((overlay) => {
        if (overlay && overlay.language) {
          descriptionsByLang[overlay.language] = overlay.attribute_information || {};
        }
      });
    } else if (informationOverlays && typeof informationOverlays === "object") {
      Object.entries(informationOverlays).forEach(([lang, overlay]) => {
        if (overlay) {
          descriptionsByLang[lang] = overlay.attribute_information || {};
        }
      });
    }

    // Combine both into lanAttributeRowData
    // Convert language codes to language names for consistency with UI
    const allLanguages = new Set([...Object.keys(labelsByLang), ...Object.keys(descriptionsByLang)]);
    allLanguages.forEach((langCode) => {
      const labels = labelsByLang[langCode] || {};
      const descriptions = descriptionsByLang[langCode] || {};
      
      // Convert OCA code (e.g., "eng") to schema language name (e.g., "English")
      // Prefer OCA->Name mapping, then UI code mapping, then fallback to raw code
      const languageName = langNameFromCodeOCA(langCode) || langNameFromTwoLetters(langCode) || langCode;
      
      lanAttributeRowData[languageName] = attributesWithLists.map((attr) => ({
        Attribute: attr.Attribute,
        Label: labels[attr.Attribute] || "",
        Description: descriptions[attr.Attribute] || "",
        List: attr.List
      }));
    });

    return lanAttributeRowData;
  }

  /**
   * Parse various overlay types into display-friendly arrays
   * @private
   */
  static _parseOverlayData(overlays, attributes = [], pkgUpload = null, schemaId = null) {
    const charEncodingOverlay = overlays?.character_encoding;
    const formatOverlay = overlays?.format;
    const cardinalityOverlay = overlays?.cardinality;
    const unitOverlay = overlays?.unit;
    
    // Get ADC extension overlays (ADC spec format)
    const unitFramingExtension = pkgUpload?.extensions?.adc?.[schemaId]?.overlays?.unit_framing;
    const rangeOverlay = pkgUpload?.extensions?.adc?.[schemaId]?.overlays?.range;

    // Character encoding data for components
    // Store as object { attributeName: encoding } for easy lookup
    const characterEncodingData = {};
    if (charEncodingOverlay?.attribute_character_encoding) {
      Object.entries(charEncodingOverlay.attribute_character_encoding).forEach(
        ([attr, encoding]) => {
          characterEncodingData[attr] = encoding || "";
        }
      );
    }

    // Format rules - store as object mapping attribute name to format rule string
    const attributeFormats = {};
    if (formatOverlay?.attribute_formats) {
      Object.entries(formatOverlay.attribute_formats).forEach(([attr, format]) => {
        attributeFormats[attr] = format || "";
      });
    }

    // Cardinality - store as object mapping attribute name to cardinality value
    const attributeCardinality = {};
    if (cardinalityOverlay?.attribute_cardinality) {
      Object.entries(cardinalityOverlay.attribute_cardinality).forEach(
        ([attr, cardinality]) => {
          attributeCardinality[attr] = cardinality || "";
        }
      );
    }

    // Range data - store as object mapping attribute name to range values
    // Only store ranges that actually exist in the range overlay
    const attributeRanges = {};
    if (rangeOverlay?.attributes) {
      Object.entries(rangeOverlay.attributes).forEach(([attr, rangeValues]) => {
        attributeRanges[attr] = {
          lower: rangeValues.lower || "",
          upper: rangeValues.upper || "",
          lower_inclusive: rangeValues.lower_inclusive ?? false,
          upper_inclusive: rangeValues.upper_inclusive ?? false
        };
      });
    }

    // Unit framing data for components
    // Combines basic unit data from unit overlay with UCUM data from unit framing extension
    const unitFramedData = [];
    if (unitOverlay?.attribute_unit) {
      Object.entries(unitOverlay.attribute_unit).forEach(([attr, unit]) => {
        // Get UCUM framing data for this unit if it exists
        const unitFraming = unitFramingExtension?.units?.[unit];
        const termId = unitFraming?.term_id || "";
        
        // Look up UCUM label and description from the UCUM database
        let ucumLabel = "";
        let ucumDescription = "";
        if (termId) {
          const { firstMatch } = searchUnits(termId);
          if (firstMatch) {
            ucumLabel = firstMatch.label || "";
            ucumDescription = firstMatch.description || "";
          }
        }
        
        unitFramedData.push({
          Attribute: attr,
          Unit: unit || "",
          "UCUM Code": termId,
          "UCUM Label": ucumLabel,
          Description: ucumDescription
        });
      });
    }

    // Initialize empty arrays for other overlay types
    const unitData = [];
    const dataStandardsData = [];
    const attributeFramingData = [];

    // Parse form overlay placeholders (ADC extension)
    const formPlaceholders = this._parseFormOverlay(pkgUpload, schemaId);

    return {
      characterEncodingData,
      attributeFormats,
      attributeCardinality,
      dataStandardsData,
      attributeRanges,
      unitData,
      unitFramedData,
      attributeFramingData,
      formPlaceholdersByLanguage: formPlaceholders
    };
  }

  /**
   * Parse form overlay placeholders from ADC extensions
   * @private
   * 
   * Form overlay structure in ADC extensions:
   * extensions.adc[captureBaseId].overlays.form = [
   *   {
   *     language: "eng",
   *     interaction: [{
   *       arguments: {
   *         attributeName: { placeholder: "text" },
   *         ...
   *       }
   *     }]
   *   },
   *   ...
   * ]
   * 
   * Returns: { UILanguageName: { attributeName: "placeholder text", ... }, ... }
   */
  static _parseFormOverlay(pkgUpload, schemaId) {
    const formPlaceholdersByLanguage = {};
    
    if (!pkgUpload?.extensions?.adc?.[schemaId]?.overlays) {
      return formPlaceholdersByLanguage;
    }

    const formOverlayData = pkgUpload.extensions.adc[schemaId].overlays.form_overlay || 
                           pkgUpload.extensions.adc[schemaId].overlays.form;
    
    const formOverlayArray = Array.isArray(formOverlayData)
      ? formOverlayData
      : formOverlayData?.form_overlays || [];

    if (!Array.isArray(formOverlayArray) || formOverlayArray.length === 0) {
      return formPlaceholdersByLanguage;
    }

    // Extract placeholders from interaction.arguments
    formOverlayArray.forEach((overlay) => {
      const langCode = overlay.language || "eng";  // 3-letter ISO code
      // Prefer OCA->language name conversion, then UI code mapping, then fallback
      const langName = langNameFromCodeOCA(langCode) || langNameFromTwoLetters(langCode) || langCode;
      
      if (!overlay.interaction?.[0]?.arguments) {
        return;
      }

      if (!formPlaceholdersByLanguage[langName]) {
        formPlaceholdersByLanguage[langName] = {};
      }

      // overlay.interaction[0].arguments = { attributeName: { placeholder: "text" }, ... }
      Object.entries(overlay.interaction[0].arguments).forEach(([attr, argData]) => {
        if (argData?.placeholder) {
          const placeholder = argData.placeholder;
          
          // Placeholder can be a string or object
          if (typeof placeholder === "string") {
            formPlaceholdersByLanguage[langName][attr] = placeholder;
          } else if (typeof placeholder === "object" && placeholder !== null) {
            // If object, try to find matching language or use first available
            const placeholderValue = placeholder[langCode] || 
                                    placeholder[langName] || 
                                    Object.values(placeholder)[0] || "";
            if (placeholderValue) {
              formPlaceholdersByLanguage[langName][attr] = placeholderValue;
            }
          }
        }
      });
    });

    return formPlaceholdersByLanguage;
  }

  /**
   * Process conformance overlay to mark required attributes
   * @private
   */
  static _processConformanceOverlay(conformanceOverlay, attributesWithLists) {
    if (conformanceOverlay?.attribute_conformance) {
      Object.entries(conformanceOverlay.attribute_conformance).forEach(
        ([attr, conformance]) => {
          const attrData = attributesWithLists.find((a) => a.Attribute === attr);
          if (attrData) {
            attrData.Required = conformance === "M";
          }
        }
      );
    }
  }

  /**
   * Process unit overlay and add units to attributes
   * @private
   */
  static _processUnitOverlay(unitOverlay, attributesWithLists) {
    // OCA spec uses attribute_units (plural) but some packages use attribute_unit (singular)
    const unitData = unitOverlay?.attribute_units || unitOverlay?.attribute_unit;
    
    if (unitData) {
      Object.entries(unitData).forEach(
        ([attr, unit]) => {
          const attrData = attributesWithLists.find((a) => a.Attribute === attr);
          if (attrData) {
            attrData.Unit = unit || "";
          }
        }
      );
    }
  }

  /**
   * Process flagged_attributes to populate Sensitive field
   * @private
   */
  static _processFlaggedAttributes(flaggedAttributes, attributesWithLists) {
    if (Array.isArray(flaggedAttributes)) {
      flaggedAttributes.forEach((attrName) => {
        const attrData = attributesWithLists.find((a) => a.Attribute === attrName);
        if (attrData) {
          attrData.Sensitive = true;
        }
      });
    }
  }

  /**
   * Build overlay selections based on present overlays
   * @private
   */
  static _buildOverlaySelections(overlays, hasUnitFramingExtension = false, hasRangeExtension = false, hasFormExtension = false) {
    const charEncodingOverlay = overlays?.character_encoding;
    const formatOverlay = overlays?.format;
    const cardinalityOverlay = overlays?.cardinality;
    const conformanceOverlay = overlays?.conformance;
    const unitOverlay = overlays?.unit;

    const selections = {
      [FIELD_CHARACTER_ENCODING_OVERLAY]: !!charEncodingOverlay?.attribute_character_encoding,
      [FIELD_CONFORMANCE_OVERLAY]: !!conformanceOverlay?.attribute_conformance,
      [FIELD_FORMAT_OVERLAY]: !!formatOverlay?.attribute_formats,
      [FIELD_CARDINALITY_OVERLAY]: !!cardinalityOverlay?.attribute_cardinality,
      [FIELD_DATA_STANDARDS_OVERLAY]: false,
      [FIELD_UNIT_FRAMING_OVERLAY]: !!unitOverlay?.attribute_unit && hasUnitFramingExtension,
      [FIELD_RANGE_OVERLAY]: hasRangeExtension,
      [FIELD_ATTRIBUTE_FRAMING_OVERLAY]: false,
      [FIELD_FORM_INFORMATION_OVERLAY]: hasFormExtension
    };
    return selections;
  }

  /**
   * Build metadata from meta overlays
   * @private
   * 
   * ARCHITECTURE: Normalize to OCA standard (3-letter codes) at the boundary
   * - Accepts any format: 2-letter (en, fr) or 3-letter (eng, fra) codes
   * - Normalizes to OCA standard: "eng", "fra"
   * - Stores localized with OCA codes as keys (expected by SchemaMetadata)
   * - Deduplicates automatically: "en" and "eng" both normalize to "eng"
   * - Exports language list as full names for UI display
   */
  static _buildMetadata(schemaData, schemaId) {
    const metaOverlay = schemaData.overlays?.meta;
    const localized = {};
    const languageCodesSet = new Set();
    
    // Extract from OCA meta overlays (array format)
    // Normalize all codes to OCA 3-letter format to prevent duplicates
    if (Array.isArray(metaOverlay)) {
      metaOverlay.forEach((m) => {
        if (m?.language) {
          // Normalize to OCA code (en → eng, fr → fra)
          const normalizedCode = normalizeToOCACode(m.language);
          
          localized[normalizedCode] = {
            name: m.name || schemaId,
            description: m.description || ""
          };
          languageCodesSet.add(normalizedCode);
        }
      });
    }
    
    // Fallback to default English if no meta overlays
    if (!languageCodesSet.has(LanguageConstants.DEFAULT_OCA_CODE)) {
      localized[LanguageConstants.DEFAULT_OCA_CODE] = {
        name: schemaData.schemaName || schemaId,
        description: schemaData.schemaDescription || ""
      };
      languageCodesSet.add(LanguageConstants.DEFAULT_OCA_CODE);
    }

    // Convert OCA codes to language names for UI display
    // Sort with English first, then alphabetically
    const languages = Array.from(languageCodesSet)
      .map(code => langNameFromCodeOCA(code) || code)
      .sort((a, b) => {
        if (a === LanguageConstants.DEFAULT_LANG_NAME) return -1;
        if (b === LanguageConstants.DEFAULT_LANG_NAME) return 1;
        return a.localeCompare(b);
      });

    return {
      localized,   // Keyed by OCA codes: { eng: {...}, fra: {...} }
      languages,   // Array of language names: ["English", "French"]
      classification: schemaData.classification || null  // Extract from capture_base
    };
  }
}