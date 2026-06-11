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
  FIELD_DATA_SEPARATOR_OVERLAY,
  FIELD_EXAMPLE_OVERLAY,
  TYPE_CHILD_SCHEMA,
  TYPE_PLACEHOLDER_CHILD_SCHEMA,
  SENSITIVE,
  DECIMAL_SEPARATOR,
  FILE_DELIMITER,
  ARRAY_DELIMITER,
  EXAMPLE
} from "../constants/constants";
import { langNameFromTwoLetters, langNameFromCodeOCA, LanguageConstants, normalizeToOCACode } from "./languageUtils";
import { getPackageBundle, getPackageDependencies, getPackageBundleId } from "./packageUtils";
import { searchUnits, normalizeEscapedQuotes, replaceCharsInKeys } from "./helpers";
import convertOverlayToFormBuilder from "../Overlays/FormBuilder/utils/convertOverlayToFormBuilder";

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
    // Flat { bundle, dependencies, extensions } for getSchemaDataById / extension lookups (same shape as unwrapOcaPackageForVisualization).
    const flatOcaPackageForParsing = ocaPackage?.oca_bundle ? {
      bundle: getPackageBundle(ocaPackage),
      dependencies: getPackageDependencies(ocaPackage),
      extensions: ocaPackage.extensions || ocaPackage.oca_bundle.extensions || {}
    } : ocaPackage;
    
    const schemaData = getSchemaDataById(flatOcaPackageForParsing, schemaId);
    
    if (!schemaData) {
      return null;
    }

    const captureBaseId = OCAParser._resolveCaptureBaseId(flatOcaPackageForParsing, schemaId);

    // Extract sensitive attributes from capture_base.flagged_attributes and ADC sensitive extension
    // For child schemas, get from dependencies
    let sensitiveAttributeNames = [];
    const bundleId = getPackageBundleId(flatOcaPackageForParsing);
    if (schemaId === bundleId || schemaId === flatOcaPackageForParsing.bundle?.capture_base?.d || schemaId === "root") {
      sensitiveAttributeNames = flatOcaPackageForParsing.bundle?.capture_base?.flagged_attributes || [];
    } else if (flatOcaPackageForParsing?.dependencies) {
      const dependency = flatOcaPackageForParsing.dependencies.find(
        dep => dep.d === schemaId || dep.capture_base?.d === schemaId
      );
      if (dependency) {
        sensitiveAttributeNames = dependency.capture_base?.flagged_attributes || [];
      }
    }
    // Merge with ADC sensitive extension (sensitive_attributes)
    const adcExtensions = flatOcaPackageForParsing?.extensions?.adc?.[captureBaseId] ??
      flatOcaPackageForParsing?.extensions?.adc?.[bundleId];
    const orderingOverlay = OCAParser._getAdcOrderingOverlay(adcExtensions);
    const sensitiveOverlay = Array.isArray(adcExtensions)
      ? adcExtensions.find((ov) => ov?.sensitive_overlay)?.sensitive_overlay
      : adcExtensions?.overlays?.[SENSITIVE];
    const adcSensitiveAttrs = Array.isArray(sensitiveOverlay?.sensitive_attributes)
      ? sensitiveOverlay.sensitive_attributes
      : [];
    sensitiveAttributeNames = [...new Set([...sensitiveAttributeNames, ...adcSensitiveAttrs])];

    // Build attributes array from OCA attributes object
    const attributes = this._buildAttributes(schemaData.attributes || {});

    // Parse entry overlays to mark lists and construct entry codes
    const { entryCodes, listSet } = this._parseEntryOverlays(schemaData.overlays?.entry);
    const entryCodesOrdered = OCAParser._applyEntryCodeOrderFromOverlay(
      entryCodes,
      orderingOverlay?.entry_code_ordering
    );

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

    const orderingNamesRaw = orderingOverlay?.attribute_ordering;
    let attributesOrdered = attributesWithLists;
    let lanOrdered = lanAttributeRowData;
    if (Array.isArray(orderingNamesRaw) && orderingNamesRaw.length > 0) {
      const orderingNames = replaceCharsInKeys(orderingNamesRaw);
      attributesOrdered = OCAParser._applyAttributeOrder(attributesWithLists, orderingNames);
      lanOrdered = OCAParser._orderLanRowsForAttributes(lanAttributeRowData, attributesOrdered);
    }

    // Copy descriptions from language data to main attributes for Attribute Details display
    // Use the first available language's description
    const firstLang = Object.keys(lanOrdered)[0];
    if (firstLang && lanOrdered[firstLang]) {
      attributesOrdered.forEach(attr => {
        const lanData = lanOrdered[firstLang].find(lan => lan.Attribute === attr.Attribute);
        if (lanData?.Description) {
          attr.Description = lanData.Description;
        }
      });
    }

    // Parse overlays and populate display-friendly arrays for components
    // Pass captureBaseId for extension lookups
    const overlayData = this._parseOverlayData(
      schemaData.overlays, 
      attributesOrdered,
      flatOcaPackageForParsing,
      captureBaseId,
      entryCodesOrdered,           // Pass entryCodes for form builder
      lanOrdered   // Pass lanAttributeRowData for form builder
    );

    // Process conformance overlay for Required field in attributes
    this._processConformanceOverlay(
      schemaData.overlays?.conformance, 
      attributesOrdered
    );

    // Process unit overlay to populate Unit field in attributes
    this._processUnitOverlay(
      schemaData.overlays?.unit,
      attributesOrdered
    );

    // Process sensitive attributes to populate Sensitive field
    this._processFlaggedAttributes(
      sensitiveAttributeNames,
      attributesOrdered
    );

    // Initialize overlay selections based on which overlays are present
    // Check if ADC extensions exist
    const hasUnitFramingExtension = !!flatOcaPackageForParsing?.extensions?.adc?.[captureBaseId]?.overlays?.unit_framing;
    const hasRangeExtension = !!flatOcaPackageForParsing?.extensions?.adc?.[captureBaseId]?.overlays?.range;
    const formOverlayData = flatOcaPackageForParsing?.extensions?.adc?.[captureBaseId]?.overlays?.form_overlay || 
                           flatOcaPackageForParsing?.extensions?.adc?.[captureBaseId]?.overlays?.form;
    const hasFormExtension = !!formOverlayData && (Array.isArray(formOverlayData) ? formOverlayData.length > 0 : !!formOverlayData.form_overlays);
    // Parse Data Separator ADC overlays (decimal/file/array) into UI-shaped fields.
    // Supports both ADC extension shapes: array-of-overlay-objects and { overlays: {...} }.
    const dataSeparator = this._parseDataSeparatorOverlays(adcExtensions);

    // Parse Example ADC overlay into UI-shaped exampleData map.
    const exampleParsed = this._parseExampleOverlay(adcExtensions);

    const overlaySelections = this._buildOverlaySelections(
      schemaData.overlays, 
      hasUnitFramingExtension,
      hasRangeExtension,
      hasFormExtension,
      dataSeparator.hasAny,
      exampleParsed.hasAny
    );

    // Build localized metadata from meta overlays
    const metadata = this._buildMetadata(schemaData, schemaId);

    return {
      metadata,
      attributes: attributesOrdered,  // Always an array, even if empty: []
      // Note: attributesList removed - now computed via getAttributesList() in MultiSchemaContext
      overlays: schemaData.overlays || {},
      overlaySelections,
      entryCodes: entryCodesOrdered,
      attributesWithLists: attributesOrdered
        .filter((a) => a.List)
        .map((a) => a.Attribute),
      lanAttributeRowData: lanOrdered,  // Preserves labels from label overlays
      // Populated display-friendly overlay data for components
      ...overlayData,
      frameAllUnits: false,
      frameAllAttributes: false,
      unframedUnitList: [],
      unframedAttributeList: [],
      // Data Separator overlay fields (imported from ADC extensions)
      decimalSeparator: dataSeparator.decimalSeparator,
      enableDecimalSeparator: dataSeparator.enableDecimalSeparator,
      ...(dataSeparator.fileDelimiterData
        ? { fileDelimiterData: dataSeparator.fileDelimiterData }
        : {}),
      enableFileDelimiter: dataSeparator.enableFileDelimiter,
      arrayDelimiterData: dataSeparator.arrayDelimiterData,
      enableArrayDelimiter: dataSeparator.enableArrayDelimiter,
      // Example overlay fields (imported from ADC extensions)
      exampleData: exampleParsed.exampleData,
      initialized: true  // CRITICAL: Marks schema as parsed (don't re-parse)
    };
  }

  static _resolveCaptureBaseId(flatOcaPackage, schemaId) {
    let captureBaseId = flatOcaPackage?.bundle?.capture_base?.d;
    if (flatOcaPackage?.dependencies) {
      const dependency = flatOcaPackage.dependencies.find(
        (dep) => dep.d === schemaId || dep.capture_base?.d === schemaId
      );
      if (dependency) {
        captureBaseId = dependency.capture_base?.d || schemaId;
      }
    }
    return captureBaseId || schemaId;
  }

  static getEntryCodeOrderingMapForSchema(ocaPackage, schemaId) {
    if (!ocaPackage || schemaId == null || schemaId === "") return null;
    const flatOcaPackage = ocaPackage?.oca_bundle
      ? {
          bundle: getPackageBundle(ocaPackage),
          dependencies: getPackageDependencies(ocaPackage),
          extensions: ocaPackage.extensions || ocaPackage.oca_bundle.extensions || {}
        }
      : ocaPackage;
    const captureBaseId = OCAParser._resolveCaptureBaseId(flatOcaPackage, schemaId);
    const bundleId = getPackageBundleId(flatOcaPackage);
    const adcExtensions =
      flatOcaPackage?.extensions?.adc?.[captureBaseId] ??
      flatOcaPackage?.extensions?.adc?.[bundleId];
    const orderingOverlay = OCAParser._getAdcOrderingOverlay(adcExtensions);
    const raw = orderingOverlay?.entry_code_ordering;
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
    if (Object.keys(raw).length === 0) return null;
    return replaceCharsInKeys(raw);
  }

  static mergeEntryCodesWithAdcOrdering(entryCodesByAttr, ocaPackage, schemaId) {
    const map = OCAParser.getEntryCodeOrderingMapForSchema(ocaPackage, schemaId);
    if (!map) return entryCodesByAttr;
    return OCAParser._reorderEntryCodeRowsByMap(entryCodesByAttr, map);
  }

  /**
   * Build attributes array from OCA attributes object
   * @private
   */
  static _buildAttributes(attributesObj) {
    return Object.entries(attributesObj).map(([name, type]) => ({
      Attribute: name,
      Type: this._normalizeType(type),
      OriginalType: type,  // Preserve original refs:SAID/refn:name for rebuild
      Description: "",
      Required: false,
      List: false,
      Unit: "",
      Sensitive: false
    }));
  }

  static _getAdcOrderingOverlay(adcExtensions) {
    if (adcExtensions == null) return null;
    if (Array.isArray(adcExtensions)) {
      for (let i = 0; i < adcExtensions.length; i += 1) {
        const ext = adcExtensions[i];
        const o = ext?.overlays?.ordering ?? ext?.ordering_overlay;
        if (
          (Array.isArray(o?.attribute_ordering) && o.attribute_ordering.length > 0) ||
          (o?.entry_code_ordering && Object.keys(o.entry_code_ordering).length > 0)
        ) {
          return o;
        }
      }
      return null;
    }
    return adcExtensions.overlays?.ordering ?? adcExtensions.ordering_overlay ?? null;
  }

  static _applyAttributeOrder(attributesWithLists, orderingNames) {
    if (!Array.isArray(orderingNames) || orderingNames.length === 0) return attributesWithLists;
    const byName = new Map(attributesWithLists.map((a) => [a.Attribute, a]));
    const ordered = [];
    const used = new Set();
    orderingNames.forEach((name) => {
      const row = byName.get(name);
      if (row) {
        ordered.push(row);
        used.add(name);
      }
    });
    attributesWithLists.forEach((row) => {
      if (!used.has(row.Attribute)) ordered.push(row);
    });
    return ordered;
  }

  static _orderLanRowsForAttributes(lanAttributeRowData, orderedAttributes) {
    const names = orderedAttributes.map((a) => a.Attribute);
    const next = {};
    Object.entries(lanAttributeRowData).forEach(([lang, rows]) => {
      if (!Array.isArray(rows)) {
        next[lang] = rows;
        return;
      }
      const byAttr = new Map(rows.map((r) => [r.Attribute, r]));
      const ord = [];
      const used = new Set();
      names.forEach((name) => {
        const r = byAttr.get(name);
        if (r) {
          ord.push(r);
          used.add(name);
        }
      });
      rows.forEach((r) => {
        if (!used.has(r.Attribute)) ord.push(r);
      });
      next[lang] = ord;
    });
    return next;
  }

  static _applyEntryCodeOrderFromOverlay(entryCodes, rawEntryCodeOrdering) {
    if (!entryCodes || typeof entryCodes !== "object") return entryCodes;
    if (
      !rawEntryCodeOrdering ||
      typeof rawEntryCodeOrdering !== "object" ||
      Array.isArray(rawEntryCodeOrdering) ||
      Object.keys(rawEntryCodeOrdering).length === 0
    ) {
      return entryCodes;
    }
    const orderMap = replaceCharsInKeys(rawEntryCodeOrdering);
    return OCAParser._reorderEntryCodeRowsByMap(entryCodes, orderMap);
  }

  static _reorderEntryCodeRowsByMap(entryCodes, orderMap) {
    if (!orderMap || typeof orderMap !== "object") return entryCodes;
    const next = { ...entryCodes };
    Object.keys(orderMap).forEach((attr) => {
      const order = orderMap[attr];
      const rows = next[attr];
      if (!Array.isArray(order) || order.length === 0 || !Array.isArray(rows) || rows.length === 0) {
        return;
      }
      const byCode = new Map(rows.map((r) => [r.Code, r]));
      const ordered = [];
      const used = new Set();
      order.forEach((code) => {
        const row = byCode.get(code);
        if (row) {
          ordered.push(row);
          used.add(code);
        }
      });
      rows.forEach((row) => {
        if (!used.has(row.Code)) ordered.push(row);
      });
      next[attr] = ordered;
    });
    return next;
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
        const mapped = this._getTypeMapping()[inner.toLowerCase()] || inner;
        return `Array[${mapped}]`;
      }
      return "Array[Text]";
    }
    
    if (typeof rawType !== "string") return "";
    
    const t = rawType.trim();
    // refs: = child schema with SAID, refn: = placeholder reference
    if (t.startsWith("refs:")) return TYPE_CHILD_SCHEMA;
    if (t.startsWith("refn:")) return TYPE_PLACEHOLDER_CHILD_SCHEMA;
    
    const arrayMatch = t.match(/^array\[(.+)\]$/i);
    if (arrayMatch) {
      const inner = arrayMatch[1];
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
        Label: normalizeEscapedQuotes(labels[attr.Attribute] || ""),
        Description: normalizeEscapedQuotes(descriptions[attr.Attribute] || ""),
        List: attr.List
      }));
    });

    return lanAttributeRowData;
  }

  /**
   * Parse various overlay types into display-friendly arrays
   * @private
   */
  static _parseOverlayData(overlays, attributes = [], ocaPackage = null, schemaId = null, entryCodes = {}, lanAttributeRowData = {}) {
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
    // Only populate UCUM data if explicitly provided in unit_framing extension
    // OCA spec uses attribute_units (plural) but some packages use attribute_unit (singular)
    const unitFramedData = [];
    const unitDataField = unitOverlay?.attribute_units || unitOverlay?.attribute_unit;
    if (unitDataField) {
      Object.entries(unitDataField).forEach(([attr, unit]) => {
        // Get UCUM framing data ONLY if it exists in the extension
        const unitFraming = unitFramingExtension?.units?.[unit];
        const termId = unitFraming?.term_id || "";
        
        // Only look up UCUM data if we have an explicit term_id from the extension
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
    const formPlaceholders = this._parseFormOverlay(ocaPackage, schemaId);
    
    // Parse form overlay structure to FormBuilder pages (ADC extension)
    const formBuilderPages = this._parseFormOverlayStructure(
      ocaPackage, 
      schemaId, 
      attributes,
      overlays,             // Pass overlays for format rules
      entryCodes,
      lanAttributeRowData
    );

    return {
      characterEncodingData,
      attributeFormats,
      attributeCardinality,
      dataStandardsData,
      attributeRanges,
      unitData,
      unitFramedData,
      attributeFramingData,
      formPlaceholdersByLanguage: formPlaceholders,
      formBuilderPages
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
  static _parseFormOverlay(ocaPackage, schemaId) {
    const formPlaceholdersByLanguage = {};
    
    if (!ocaPackage?.extensions?.adc?.[schemaId]?.overlays) {
      return formPlaceholdersByLanguage;
    }

    const formOverlayData = ocaPackage.extensions.adc[schemaId].overlays.form_overlay || 
                           ocaPackage.extensions.adc[schemaId].overlays.form;
    
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

      Object.entries(overlay.interaction[0].arguments).forEach(([attr, argData]) => {
        if (argData?.placeholder) {
          const placeholder = argData.placeholder;
          
          if (typeof placeholder === "string") {
            formPlaceholdersByLanguage[langName][attr] = normalizeEscapedQuotes(placeholder);
          } else if (typeof placeholder === "object" && placeholder !== null) {
            const placeholderValue = placeholder[langCode] || 
                                    placeholder[langName] || 
                                    Object.values(placeholder)[0] || "";
            if (placeholderValue) {
              formPlaceholdersByLanguage[langName][attr] = normalizeEscapedQuotes(placeholderValue);
            }
          }
        }
      });
    });

    return formPlaceholdersByLanguage;
  }

  /**
   * Parse form overlay structure to FormBuilder pages from ADC extensions
   * @private
   * 
   * Converts the form overlay structure (pages, sections, questions) into
   * the internal FormBuilder format during OCA import.
   * 
   * @param {Object} ocaPackage - The OCA package
   * @param {string} schemaId - The capture_base ID to look up extensions
   * @param {Array} attributes - Parsed attributes array
   * @param {Object} overlays - Schema overlays for format rules
   * @param {Object} entryCodes - Parsed entry codes
   * @param {Object} lanAttributeRowData - Language-specific label data
   * @returns {Array} FormBuilder pages array
   */
  static _parseFormOverlayStructure(ocaPackage, schemaId, attributes, overlays, entryCodes, lanAttributeRowData) {
    if (!ocaPackage?.extensions?.adc?.[schemaId]?.overlays) {
      return [];
    }

    const formOverlayData = ocaPackage.extensions.adc[schemaId].overlays.form_overlay ||
                           ocaPackage.extensions.adc[schemaId].overlays.form;
    
    if (!formOverlayData) {
      return [];
    }

    // Get languages from parsed lanAttributeRowData
    const languagesArray = Object.keys(lanAttributeRowData).length > 0
      ? Object.keys(lanAttributeRowData)
      : [LanguageConstants.DEFAULT_LANG_NAME];

    // Build format rule data from overlays
    const formatRuleRowData = [];
    if (overlays?.format?.attribute_formats) {
      attributes.forEach(attr => {
        const formatRule = overlays.format.attribute_formats[attr.Attribute];
        formatRuleRowData.push({
          Attribute: attr.Attribute,
          Type: attr.Type,
          "Format Rule": formatRule || "",
          FormatText: formatRule || ""
        });
      });
    }

    // Get list of attributes with entry codes
    const attributesWithLists = Object.keys(entryCodes);

    try {
      const pages = convertOverlayToFormBuilder(
        formOverlayData,
        languagesArray,
        attributes,
        formatRuleRowData,
        entryCodes,
        attributesWithLists,
        lanAttributeRowData
      );

      return pages || [];
    } catch (err) {
      console.warn("Failed to parse form overlay structure during OCA import:", err);
      return [];
    }
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
    const unitDataField = unitOverlay?.attribute_units || unitOverlay?.attribute_unit;
    
    if (unitDataField) {
      Object.entries(unitDataField).forEach(
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
   * Process sensitive attribute names to populate Sensitive field
   * @private
   */
  static _processFlaggedAttributes(sensitiveAttributeNames, attributesWithLists) {
    if (Array.isArray(sensitiveAttributeNames)) {
      sensitiveAttributeNames.forEach((attrName) => {
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
  static _buildOverlaySelections(overlays, hasUnitFramingExtension = false, hasRangeExtension = false, hasFormExtension = false, hasDataSeparatorExtension = false, hasExampleExtension = false) {
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
      [FIELD_UNIT_FRAMING_OVERLAY]: !!(unitOverlay?.attribute_units || unitOverlay?.attribute_unit) && hasUnitFramingExtension, // Only enable if explicit framing exists
      [FIELD_RANGE_OVERLAY]: hasRangeExtension,
      [FIELD_ATTRIBUTE_FRAMING_OVERLAY]: false,
      [FIELD_FORM_INFORMATION_OVERLAY]: hasFormExtension,
      [FIELD_DATA_SEPARATOR_OVERLAY]: hasDataSeparatorExtension,
      [FIELD_EXAMPLE_OVERLAY]: hasExampleExtension
    };
    return selections;
  }

  /**
   * Parse Data Separator ADC extension overlays into the UI state shape.
   *
   * Reads from either supported ADC shape:
   *   - Array:  [{ decimal_separator_overlay: {...}, file_delimiter_overlay: {...}, ... }]
   *   - Object: { overlays: { decimal_separator: {...}, file_delimiter: {...}, ... } }
   *
   * Returns the fields consumed by DataSeparator.jsx:
   *   - decimalSeparator / enableDecimalSeparator
   *   - fileDelimiterData / enableFileDelimiter
   *   - arrayDelimiterData / enableArrayDelimiter
   *   - hasAny: true when any of the three overlays were found (used to flip
   *     FIELD_DATA_SEPARATOR_OVERLAY on in overlaySelections so the overlay
   *     appears as "already added" after import).
   *
   * @private
   */
  static _parseDataSeparatorOverlays(adcExtensions) {
    const result = {
      decimalSeparator: ".",
      enableDecimalSeparator: false,
      fileDelimiterData: null,
      enableFileDelimiter: false,
      arrayDelimiterData: {},
      enableArrayDelimiter: false,
      hasAny: false
    };

    if (!adcExtensions) return result;

    let decimalOverlay;
    let fileOverlay;
    let arrayOverlay;

    if (Array.isArray(adcExtensions)) {
      decimalOverlay = adcExtensions.find((ov) => ov?.decimal_separator_overlay)?.decimal_separator_overlay;
      fileOverlay = adcExtensions.find((ov) => ov?.file_delimiter_overlay)?.file_delimiter_overlay;
      arrayOverlay = adcExtensions.find((ov) => ov?.array_delimiter_overlay)?.array_delimiter_overlay;
    } else {
      const overlays = adcExtensions?.overlays || {};
      decimalOverlay = overlays.decimal_separator_overlay || overlays[DECIMAL_SEPARATOR];
      fileOverlay = overlays.file_delimiter_overlay || overlays[FILE_DELIMITER];
      arrayOverlay = overlays.array_delimiter_overlay || overlays[ARRAY_DELIMITER];
    }

    if (decimalOverlay) {
      if (decimalOverlay.delimiter) {
        result.decimalSeparator = decimalOverlay.delimiter;
      }
      result.enableDecimalSeparator = true;
      result.hasAny = true;
    }

    if (fileOverlay) {
      result.fileDelimiterData = {
        fieldDelimiter: fileOverlay.delimiter ?? ",",
        quoteChar: fileOverlay.quote_char ?? "\"",
        escapeChar: fileOverlay.escape_char ?? "\\",
        lineTerminator: fileOverlay.line_terminator ?? "lf",
        dataStartRow: typeof fileOverlay.data_start_row === "number"
          ? fileOverlay.data_start_row
          : Number.parseInt(fileOverlay.data_start_row ?? 1, 10) || 1
      };
      result.enableFileDelimiter = true;
      result.hasAny = true;
    }

    if (arrayOverlay?.attributes && typeof arrayOverlay.attributes === "object") {
      result.arrayDelimiterData = { ...arrayOverlay.attributes };
      result.enableArrayDelimiter = true;
      result.hasAny = true;
    }

    return result;
  }

  /**
   * Parse Example ADC extension overlay into the UI state shape.
   *
   * Handles two supported ADC shapes:
   *
   *   Pre-processed (input to oca_package library, array of overlay objects):
   *     [ { example_overlay: { example_overlays: { "eng": { language: "eng", attribute_examples: {...} } } } } ]
   *
   *   Post-processed (output from oca_package library, object with overlays map):
   *     { overlays: { example: [ { d, capture_base, type, language, attribute_examples: {...} } ] } }
   *
   * Parses all language entries so the UI can show per-language example inputs.
   *
   * Returns:
   *   - exampleData: { attributeName: { languageName: "example value string" } }
   *   - hasAny: true when at least one example value was found
   *
   * @private
   */
  static _parseExampleOverlay(adcExtensions) {
    const result = {
      exampleData: {},
      hasAny: false
    };

    if (!adcExtensions) return result;

    // Collect { langCode: { attributeName: value } } from the source shape.
    const byLangCode = {};

    if (Array.isArray(adcExtensions)) {
      // Pre-processed shape: [{ example_overlay: { example_overlays: { "eng": {language, attribute_examples}, ... } } }]
      const dynOverlay = adcExtensions.find((ov) => ov?.example_overlay)?.example_overlay;
      const exampleOverlaysObj = dynOverlay?.example_overlays;
      if (exampleOverlaysObj && typeof exampleOverlaysObj === "object" && !Array.isArray(exampleOverlaysObj)) {
        Object.entries(exampleOverlaysObj).forEach(([langCode, entry]) => {
          if (entry?.attribute_examples) {
            byLangCode[langCode] = entry.attribute_examples;
          }
        });
      }
    } else {
      // Post-processed shape: { overlays: { example: [ {d, capture_base, type, language, attribute_examples} ] } }
      const overlays = adcExtensions?.overlays || {};
      const exampleArr = overlays[EXAMPLE] || overlays.example_overlay;
      const entries = Array.isArray(exampleArr) ? exampleArr : (exampleArr ? [exampleArr] : []);
      entries.forEach((entry) => {
        if (entry?.language && entry?.attribute_examples) {
          byLangCode[entry.language] = entry.attribute_examples;
        }
      });
    }

    Object.entries(byLangCode).forEach(([langCode, attributeExamples]) => {
      if (!attributeExamples || typeof attributeExamples !== "object") return;
      // Resolve full language name ("English", "French") from OCA code ("eng", "fra")
      const langName = langNameFromCodeOCA(langCode) || langNameFromTwoLetters(langCode) || langCode;
      Object.entries(attributeExamples).forEach(([attr, value]) => {
        if (value !== undefined && value !== null) {
          if (!result.exampleData[attr]) result.exampleData[attr] = {};
          result.exampleData[attr][langName] = String(value);
          result.hasAny = true;
        }
      });
    });

    return result;
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
          const normalizedCode = normalizeToOCACode(m.language);
          
          localized[normalizedCode] = {
            name: normalizeEscapedQuotes(m.name || schemaId),
            description: normalizeEscapedQuotes(m.description || "")
          };
          languageCodesSet.add(normalizedCode);
        }
      });
    }
    
    if (!languageCodesSet.has(LanguageConstants.DEFAULT_OCA_CODE)) {
      localized[LanguageConstants.DEFAULT_OCA_CODE] = {
        name: normalizeEscapedQuotes(schemaData.schemaName || schemaId),
        description: normalizeEscapedQuotes(schemaData.schemaDescription || "")
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