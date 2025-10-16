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
import { LanguageUtils, LanguageConstants } from "./languageUtils";

/**
 * OCA Package Parser Utility
 * 
 * Extracts and transforms OCA (Overlays Capture Architecture) package data
 * into the format expected by the schema editing components.
 */
export class OCAParser {
  
  /**
   * Parse OCA package data for a specific schema
   * @param {string} schemaId - The schema identifier
   * @param {Object} ocaPackage - The OCA package data
   * @returns {Object} Parsed schema state data ready for React components
   */
  static parseSchemaData(schemaId, ocaPackage) {
    const schemaData = getSchemaDataById(ocaPackage, schemaId);
    if (!schemaData) {
      return null;
    }

    // Build attributes
    const attributes = this._buildAttributes(schemaData.attributes || {});

    // Parse entry overlays to mark lists and construct entry codes
    const { entryCodes, listSet } = this._parseEntryOverlays(schemaData.overlays?.entry);

    const attributesWithLists = attributes.map((a) => ({
      ...a,
      List: listSet.has(a.Attribute)
    }));

    // Parse label overlays for language-specific data
    const lanAttributeRowData = this._parseLabelOverlays(
      schemaData.overlays?.label, 
      attributesWithLists
    );

    // Parse overlays and populate display-friendly arrays for components
    const overlayData = this._parseOverlayData(schemaData.overlays);

    // Process conformance overlay for Required field in attributes
    this._processConformanceOverlay(
      schemaData.overlays?.conformance, 
      attributesWithLists
    );

    // Initialize overlay selections based on which overlays are present
    const overlaySelections = this._buildOverlaySelections(schemaData.overlays);

    // Build localized metadata from meta overlays
    const metadata = this._buildMetadata(schemaData, schemaId);

    return {
      metadata,
      attributes: attributesWithLists,
      attributesList: attributesWithLists.map((a) => a.Attribute),
      overlays: schemaData.overlays || {},
      overlaySelections,
      entryCodes,
      attributesWithLists: attributesWithLists
        .filter((a) => a.List)
        .map((a) => a.Attribute),
      lanAttributeRowData,
      // Populated display-friendly overlay data for components
      ...overlayData,
      frameAllUnits: false,
      frameAllAttributes: false,
      unframedUnitList: [],
      unframedAttributeList: [],
      unitFramedThatAlreadyExist: {},
      initialized: true
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
      Unit: ""
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
   * Parse label overlays for language-specific data
   * @private
   */
  static _parseLabelOverlays(labelOverlays, attributesWithLists) {
    const lanAttributeRowData = {};
    
    if (Array.isArray(labelOverlays)) {
      labelOverlays.forEach((overlay) => {
        if (overlay && overlay.language) {
          const lang = overlay.language;
          lanAttributeRowData[lang] = attributesWithLists.map((attr) => ({
            Attribute: attr.Attribute,
            Label: overlay.attribute_labels?.[attr.Attribute] || "",
            Description: overlay.attribute_descriptions?.[attr.Attribute] || "",
            List: attr.List
          }));
        }
      });
    } else if (labelOverlays && typeof labelOverlays === "object") {
      Object.entries(labelOverlays).forEach(([lang, overlay]) => {
        if (overlay) {
          lanAttributeRowData[lang] = attributesWithLists.map((attr) => ({
            Attribute: attr.Attribute,
            Label: overlay.attribute_labels?.[attr.Attribute] || "",
            Description: overlay.attribute_descriptions?.[attr.Attribute] || "",
            List: attr.List
          }));
        }
      });
    }

    return lanAttributeRowData;
  }

  /**
   * Parse various overlay types into display-friendly arrays
   * @private
   */
  static _parseOverlayData(overlays) {
    const charEncodingOverlay = overlays?.character_encoding;
    const formatOverlay = overlays?.format;
    const cardinalityOverlay = overlays?.cardinality;

    // Character encoding data for components
    const characterEncodingData = [];
    if (charEncodingOverlay?.attribute_character_encoding) {
      Object.entries(charEncodingOverlay.attribute_character_encoding).forEach(
        ([attr, encoding]) => {
          characterEncodingData.push({
            Attribute: attr,
            "Character Encoding": encoding || ""
          });
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

    // Initialize empty arrays for other overlay types
    const rangeData = [];
    const unitData = [];
    const dataStandardsData = [];
    const unitFramedData = [];
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
   * Build overlay selections based on present overlays
   * @private
   */
  static _buildOverlaySelections(overlays) {
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
        selected: !!unitOverlay?.attribute_units 
      },
      [FIELD_RANGE_OVERLAY]: { 
        feature: "Add range rule for data", 
        selected: false 
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

    return {
      localized,
      languages: LanguageConstants.FALLBACK_LANGUAGES
    };
  }
}