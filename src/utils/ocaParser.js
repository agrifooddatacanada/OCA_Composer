import { getSchemaDataById } from "../SchemaVisualization/dataUtils";
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
import { getLangNameFromUICode, LanguageConstants } from "./languageUtils";

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
 * - entryCodes: Entry code definitions for list attributes
 * - overlayData: Character encoding, format rules, cardinality, etc.
 */
export class OCAParser {
  
  /**
   * Parse OCA package data for a specific schema
   * 
   * @param {string} schemaId - The schema identifier
   * @param {Object} ocaPackage - The OCA package data
   * @returns {Object} Parsed schema state data ready for React components
   * 
   * IMPORTANT OUTPUTS:
   * - attributes: Always an array (even if empty: [])
   * - lanAttributeRowData: Object mapping language -> array of {Attribute, Label, Description, List}
   * - initialized: Always set to true (signals this schema has been parsed)
   * 
   * This ensures components don't need to re-parse from completeSchema.
   */
  static parseSchemaData(schemaId, ocaPackage) {
    // Normalize the OCA package format first
    // Handle oca_package format: { oca_bundle: { bundle, dependencies }, extensions }
    const normalizedPackage = ocaPackage?.oca_bundle ? {
      bundle: ocaPackage.oca_bundle.bundle,
      dependencies: ocaPackage.oca_bundle.dependencies || [],
      extensions: ocaPackage.extensions || ocaPackage.oca_bundle.extensions || {}
    } : ocaPackage;
    
    const schemaData = getSchemaDataById(normalizedPackage, schemaId);
    
    if (!schemaData) {
      return null;
    }

    // Get the capture_base ID for looking up extensions
    // Extensions are keyed by capture_base.d, not bundle.d
    // For root schema, use bundle.capture_base.d
    // For child schemas in dependencies, find the matching dependency's capture_base.d
    let captureBaseId = normalizedPackage?.bundle?.capture_base?.d;
    
    // Check if this is a child schema by looking in dependencies
    if (normalizedPackage?.dependencies) {
      const dependency = normalizedPackage.dependencies.find(
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
    if (schemaId === normalizedPackage.bundle?.d || schemaId === normalizedPackage.bundle?.capture_base?.d || schemaId === "root") {
      flaggedAttributes = normalizedPackage.bundle?.capture_base?.flagged_attributes || [];
    } else if (normalizedPackage?.dependencies) {
      const dependency = normalizedPackage.dependencies.find(
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
      normalizedPackage,
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
    const hasUnitFramingExtension = !!normalizedPackage?.extensions?.adc?.[captureBaseId]?.overlays?.unit_framing;
    const hasRangeExtension = !!normalizedPackage?.extensions?.adc?.[captureBaseId]?.overlays?.range;
    const overlaySelections = this._buildOverlaySelections(
      schemaData.overlays, 
      hasUnitFramingExtension,
      hasRangeExtension
    );

    // Build localized metadata from meta overlays
    const metadata = this._buildMetadata(schemaData, schemaId);

    return {
      metadata,
      attributes: attributesWithLists,  // Always an array, even if empty: []
      attributesList: attributesWithLists.map((a) => a.Attribute),
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
    
    if (Array.isArray(rawType)) {
      const first = rawType[0];
      if (typeof first === "string") {
        const inner = first.trim();
        if (inner.startsWith("refn:") || inner.startsWith("refs:"))
          return "Array[Child Schema]";
        const mapped = this._getTypeMapping()[inner.toLowerCase()] || inner;
        return `Array[${mapped}]`;
      }
      return "Array[Text]";
    }
    
    if (typeof rawType !== "string") return "";
    
    const t = rawType.trim();
    if (t.startsWith("refn:") || t.startsWith("refs:")) return "Child Schema";
    
    const arrayMatch = t.match(/^array\[(.+)\]$/i);
    if (arrayMatch) {
      const inner = arrayMatch[1];
      if (
        inner.toLowerCase().startsWith("refn:") ||
        inner.toLowerCase().startsWith("refs:")
      )
        return "Array[Child Schema]";
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
   * @private
   */
  static _parseEntryOverlays(entryOverlay) {
    const entryCodes = {};
    const listSet = new Set();
    
    const addEntry = (attrName, code, lang, text) => {
      listSet.add(attrName);
      if (!entryCodes[attrName]) entryCodes[attrName] = [];
      let row = entryCodes[attrName].find((r) => r.Code === code);
      if (!row) {
        row = { Code: code };
        entryCodes[attrName].push(row);
      }
      row[lang] = text || "";
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
      
      // Convert 2-letter OCA code (e.g., "en") to schema language name (e.g., "English")
      // This ensures lanAttributeRowData keys match what LanguageDetails expects
      const languageName = getLangNameFromUICode(langCode) || langCode;
      
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
  static _parseOverlayData(overlays, attributes = [], ocaPackage = null, schemaId = null) {
    const charEncodingOverlay = overlays?.character_encoding;
    const formatOverlay = overlays?.format;
    const cardinalityOverlay = overlays?.cardinality;
    const unitOverlay = overlays?.unit;
    
    // Get ADC extension overlays (ADC spec format)
    const unitFramingExtension = ocaPackage?.extensions?.adc?.[schemaId]?.overlays?.unit_framing;
    const rangeOverlay = ocaPackage?.extensions?.adc?.[schemaId]?.overlays?.range;

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

    // Format rule data for components
    const formatRuleData = [];
    if (formatOverlay?.attribute_formats) {
      Object.entries(formatOverlay.attribute_formats).forEach(([attr, format]) => {
        formatRuleData.push({
          Attribute: attr,
          "Format Rule": format || ""
        });
      });
    }

    // Cardinality data for components
    const cardinalityData = [];
    if (cardinalityOverlay?.attribute_cardinality) {
      Object.entries(cardinalityOverlay.attribute_cardinality).forEach(
        ([attr, cardinality]) => {
          cardinalityData.push({
            Attribute: attr,
            Cardinality: cardinality || ""
          });
        }
      );
    }

    // Range data for components (ADC spec format)
    // Add ALL eligible attributes (Numeric and DateTime), not just those with existing ranges
    // This matches useZipParser behavior and allows users to add ranges to any eligible attribute
    const rangeData = [];
    attributes.forEach((attribute) => {
      const attrType = attribute.Type || "";
      // Only Numeric and DateTime attributes can have range rules
      if (attrType === "Numeric" || attrType === "DateTime") {
        const formatRule = formatOverlay?.attribute_formats?.[attribute.Attribute] || "";
        // Check if this attribute has existing range data
        const existingRange = rangeOverlay?.attributes?.[attribute.Attribute];
        
        rangeData.push({
          Attribute: attribute.Attribute,
          Type: attrType,
          FormatRule: formatRule,
          LowerBound: existingRange?.lower || "",
          UpperBound: existingRange?.upper || "",
          // Default to false (matches useZipParser), override with actual values if they exist
          LowerInclusive: existingRange?.lower_inclusive !== undefined ? existingRange.lower_inclusive : false,
          UpperInclusive: existingRange?.upper_inclusive !== undefined ? existingRange.upper_inclusive : false
        });
      }
    });

    // Unit framing data for components
    // Combines basic unit data from unit overlay with UCUM data from unit framing extension
    const unitFramedData = [];
    if (unitOverlay?.attribute_unit) {
      Object.entries(unitOverlay.attribute_unit).forEach(([attr, unit]) => {
        // Get UCUM framing data for this unit if it exists
        const unitFraming = unitFramingExtension?.units?.[unit];
        
        unitFramedData.push({
          Attribute: attr,
          Unit: unit || "",
          "UCUM Code": unitFraming?.term_id || "",
          "UCUM Label": "", // Label not stored in extension, would come from UCUM lookup
          Description: ""  // Description not stored in extension
        });
      });
    }

    // Initialize empty arrays for other overlay types
    const unitData = [];
    const dataStandardsData = [];
    const attributeFramingData = [];

    return {
      characterEncodingData,
      formatRuleData,
      cardinalityData,
      dataStandardsData,
      rangeData,
      unitData,
      unitFramedData,
      attributeFramingData
    };
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
    // Standard OCA format: {attribute_units: {...}}
    const unitData = unitOverlay?.attribute_units;
    
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
  static _buildOverlaySelections(overlays, hasUnitFramingExtension = false, hasRangeExtension = false) {
    const charEncodingOverlay = overlays?.character_encoding;
    const formatOverlay = overlays?.format;
    const cardinalityOverlay = overlays?.cardinality;
    const conformanceOverlay = overlays?.conformance;
    const unitOverlay = overlays?.unit;

    return {
      [FIELD_CHARACTER_ENCODING_OVERLAY]: { 
        feature: "Character Encoding", 
        selected: !!charEncodingOverlay?.attribute_character_encoding 
      },
      [FIELD_CONFORMANCE_OVERLAY]: { 
        feature: "Make selected entries required", 
        selected: !!conformanceOverlay?.attribute_conformance 
      },
      [FIELD_FORMAT_OVERLAY]: { 
        feature: "Add format rule for data", 
        selected: !!formatOverlay?.attribute_formats 
      },
      [FIELD_CARDINALITY_OVERLAY]: { 
        feature: "Cardinality", 
        selected: !!cardinalityOverlay?.attribute_cardinality 
      },
      [FIELD_DATA_STANDARDS_OVERLAY]: { 
        feature: "Data Standards", 
        selected: false 
      },
      [FIELD_UNIT_FRAMING_OVERLAY]: { 
        feature: "Unit Framing", 
        selected: !!unitOverlay?.attribute_unit && hasUnitFramingExtension 
      },
      [FIELD_RANGE_OVERLAY]: { 
        feature: "Add range rule for data", 
        selected: hasRangeExtension
      },
      [FIELD_ATTRIBUTE_FRAMING_OVERLAY]: { 
        feature: "Attribute Framing", 
        selected: false 
      }
    };
  }

  /**
   * Build metadata from meta overlays
   * @private
   */
  static _buildMetadata(schemaData, schemaId) {
    const metaOverlay = schemaData.overlays?.meta;
    const localized = {};
    
    // Extract from OCA meta overlays (array format)
    if (Array.isArray(metaOverlay)) {
      metaOverlay.forEach((m) => {
        if (m?.language) {
          localized[m.language] = {
            name: m.name || schemaId,
            description: m.description || ""
          };
        }
      });
    }
    
    // Fallback to default English if no meta overlays
    if (!localized.eng) {
      localized.eng = {
        name: schemaData.schemaName || schemaId,
        description: schemaData.schemaDescription || ""
      };
    }

    // Extract actual languages from meta overlays
    const detectedLanguages = Object.keys(localized);
    
    // Sort languages with English first, then alphabetically
    const sortedLanguages = detectedLanguages.sort((a, b) => {
      if (a === 'eng') return -1;
      if (b === 'eng') return 1;
      return a.localeCompare(b);
    });
    
    const languages = sortedLanguages.length > 0 
      ? sortedLanguages.map(code => {
          // Convert language codes to full names (eng -> English, fra -> French)
          const codeMap = { eng: 'English', fra: 'French', deu: 'German', spa: 'Spanish' };
          return codeMap[code] || code;
        })
      : LanguageConstants.FALLBACK_LANG_NAMES;

    return {
      localized,
      languages
    };
  }
}