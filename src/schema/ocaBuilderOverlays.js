import { langCodeOCAFromName } from '../utils/languageUtils';

/**
 * Applies all overlay changes from editor state to OCA schema structure.
 * 
 * @param {Object} ocaSchema - OCA package schema to modify (bundle or dependency)
 * @param {Object} editorState - UI editing state with overlay data maps
 * 
 * Converts UI editing state (flat maps like attributeFormats, attributeCardinality)
 * into OCA overlay structures (format, cardinality, entry, label, etc.).
 */
export function applyAllOverlays(ocaSchema, editorState) {
  if (!ocaSchema.overlays) ocaSchema.overlays = {};

  const validAttributeNames = getValidAttributeNames(editorState);

  // Apply each overlay type
  applyDirectOverlays(ocaSchema, editorState);
  applyMetaOverlays(ocaSchema, editorState);
  applyConformanceOverlay(ocaSchema, editorState);
  applyFormatOverlay(ocaSchema, editorState, validAttributeNames);
  applyCharacterEncodingOverlay(ocaSchema, editorState);
  applyCardinalityOverlay(ocaSchema, editorState, validAttributeNames);
  applyStandardOverlay(ocaSchema, editorState, validAttributeNames);
  applyRangeOverlay(ocaSchema, editorState, validAttributeNames);
  applyEntryOverlay(ocaSchema, editorState);
  applyLabelAndInfoOverlays(ocaSchema, editorState);
}

// ============================================================================
// HELPERS
// ============================================================================

function getValidAttributeNames(editorState) {
  const attrs = editorState?.attributes || [];
  return new Set(attrs.map((a) => a.Attribute));
}

// ============================================================================
// OVERLAY APPLIERS
// ============================================================================

function applyDirectOverlays(ocaSchema, editorState) {
  // Direct overlay assignment from editorState.overlays
  if (editorState.overlays) {
    Object.entries(editorState.overlays).forEach(([overlayType, overlayData]) => {
      if (overlayData) {
        ocaSchema.overlays[overlayType] = overlayData;
      }
    });
  }
}

function applyMetaOverlays(ocaSchema, editorState) {
  const locMeta = editorState.metadata?.localized || {};
  if (Object.keys(locMeta).length === 0) return;

  const existingMeta = Array.isArray(ocaSchema.overlays?.meta) ? ocaSchema.overlays.meta : [];
  
  const metaArray = Object.entries(locMeta).map(([lang, obj]) => {
    const existingForLang = existingMeta.find((m) => m?.language === lang) || {};
    return {
      d: existingForLang.d,
      capture_base: ocaSchema.capture_base?.d,
      type: "spec/overlays/meta/1.1",
      language: lang,
      name: obj?.name || "",
      description: obj?.description || "",
    };
  });
  
  if (metaArray.length > 0) ocaSchema.overlays.meta = metaArray;
}

function applyConformanceOverlay(ocaSchema, editorState) {
  if (!editorState.attributes?.length) return;
  
  const hasRequiredFlags = editorState.attributes.some(
    (attr) => attr.Required === true || attr.Required === false
  );

  if (!hasRequiredFlags) return;
  
  const conformanceOverlay = {
    d: ocaSchema.overlays?.conformance?.d,
    capture_base: ocaSchema.capture_base.d,
    type: "spec/overlays/conformance/1.1",
    attribute_conformance: {},
  };

  editorState.attributes.forEach((attr) => {
    if (attr.Attribute && (attr.Required === true || attr.Required === false)) {
      conformanceOverlay.attribute_conformance[attr.Attribute] = attr.Required ? "M" : "O";
    }
  });

  if (Object.keys(conformanceOverlay.attribute_conformance).length > 0) {
    ocaSchema.overlays.conformance = conformanceOverlay;
  }
}

function applyFormatOverlay(ocaSchema, editorState, validAttributeNames) {
  const attributeFormats = editorState.attributeFormats || {};
  
  if (Object.keys(attributeFormats).length === 0) return;
  
  const formatOverlay = {
    d: ocaSchema.overlays?.format?.d,
    capture_base: ocaSchema.capture_base.d,
    type: "spec/overlays/format/1.1",
    attribute_formats: {},
  };

  Object.entries(attributeFormats).forEach(([attrName, formatRule]) => {
    if (validAttributeNames.has(attrName) && formatRule) {
      formatOverlay.attribute_formats[attrName] = formatRule;
    }
  });

  if (Object.keys(formatOverlay.attribute_formats).length > 0) {
    ocaSchema.overlays.format = formatOverlay;
  }
}

function applyCharacterEncodingOverlay(ocaSchema, editorState) {
  const charEncoding = editorState.characterEncodingData || {};
  if (Object.keys(charEncoding).length === 0) return;
  
  const charEncodingOverlay = {
    d: ocaSchema.overlays?.character_encoding?.d,
    capture_base: ocaSchema.capture_base.d,
    type: "spec/overlays/character_encoding/1.1",
    attribute_character_encoding: {},
  };

  Object.entries(charEncoding).forEach(([attr, encoding]) => {
    if (encoding) charEncodingOverlay.attribute_character_encoding[attr] = encoding;
  });

  if (Object.keys(charEncodingOverlay.attribute_character_encoding).length > 0) {
    ocaSchema.overlays.character_encoding = charEncodingOverlay;
 }
}

function applyCardinalityOverlay(ocaSchema, editorState, validAttributeNames) {
  const attributeCardinality = editorState.attributeCardinality || {};
  
  if (Object.keys(attributeCardinality).length === 0) return;
  
  const cardinalityOverlay = {
    d: ocaSchema.overlays?.cardinality?.d,
    capture_base: ocaSchema.capture_base.d,
    type: "spec/overlays/cardinality/1.1",
    attribute_cardinality: {},
  };

  Object.entries(attributeCardinality).forEach(([attrName, cardValue]) => {
    if (validAttributeNames.has(attrName) && cardValue) {
      cardinalityOverlay.attribute_cardinality[attrName] = cardValue;
    }
  });

  if (Object.keys(cardinalityOverlay.attribute_cardinality).length > 0) {
    ocaSchema.overlays.cardinality = cardinalityOverlay;
  }
}

function applyStandardOverlay(ocaSchema, editorState, validAttributeNames) {
  const dataStandards = editorState.dataStandardsData || [];
  if (dataStandards.length === 0) return;
  
  const standardOverlay = {
    d: ocaSchema.overlays?.standard?.d,
    capture_base: ocaSchema.capture_base.d,
    type: "spec/overlays/standard/1.1",
    attr_standards: {},
  };

  dataStandards
    .filter((std) => validAttributeNames.has(std.Attribute))
    .forEach((std) => {
      if (std.Attribute && std.DataStandard) {
        standardOverlay.attr_standards[std.Attribute] = std.DataStandard;
      }
    });

  if (Object.keys(standardOverlay.attr_standards).length > 0) {
    ocaSchema.overlays.standard = standardOverlay;
  }
}

function applyRangeOverlay(ocaSchema, editorState, validAttributeNames) {
  const attributeRanges = editorState.attributeRanges || {};
  
  if (Object.keys(attributeRanges).length === 0) return;
  
  const rangeOverlay = {
    d: ocaSchema.overlays?.range?.d,
    capture_base: ocaSchema.capture_base.d,
    type: "spec/overlays/range/1.1",
    attributes: {},
  };

  Object.entries(attributeRanges).forEach(([attrName, range]) => {
    if (validAttributeNames.has(attrName) && (range.lower || range.upper)) {
      rangeOverlay.attributes[attrName] = {
        lower: range.lower || "",
        lower_inclusive: range.lower_inclusive || false,
        upper: range.upper || "",
        upper_inclusive: range.upper_inclusive || false,
      };
    }
  });

  if (Object.keys(rangeOverlay.attributes).length > 0) {
    ocaSchema.overlays.range = rangeOverlay;
  }
}

function applyEntryOverlay(ocaSchema, editorState) {
  const entryCodes = editorState.entryCodes || {};
  if (Object.keys(entryCodes).length === 0) return;
  
  // Detect all languages present in entry code data
  // Entry codes stored as: { Code: "001", English: "Red", French: "Rouge", ... }
  const languagesSet = new Set();
  Object.values(entryCodes).forEach((codes) => {
    if (Array.isArray(codes)) {
      codes.forEach((code) => {
        Object.keys(code).forEach((key) => {
          if (key !== "Code" && code[key]) {
            languagesSet.add(key);
          }
        });
      });
    }
  });
  
  const languages = Array.from(languagesSet);
  if (languages.length === 0) return;
  
  // Create one entry overlay per language
  const entryOverlays = [];
  
  languages.forEach((languageName) => {
    // Convert language name to 3-letter OCA code (English -> eng, French -> fra)
    const langCode = langCodeOCAFromName(languageName) || languageName.toLowerCase().slice(0, 3);
    
    const entryOverlay = {
      d: undefined,  // Will be calculated when package is SAIDified
      capture_base: ocaSchema.capture_base.d,
      type: "spec/overlays/entry/1.1",
      language: langCode,
      attribute_entries: {},
    };

    Object.entries(entryCodes).forEach(([attrName, codes]) => {
      if (Array.isArray(codes) && codes.length > 0) {
        entryOverlay.attribute_entries[attrName] = {};
        codes.forEach((code) => {
          if (code.Code && code[languageName]) {
            entryOverlay.attribute_entries[attrName][code.Code] = code[languageName];
          }
        });
      }
    });

    // Only add overlay if it has entries
    if (Object.keys(entryOverlay.attribute_entries).length > 0) {
      entryOverlays.push(entryOverlay);
    }
  });
  
  if (entryOverlays.length > 0) {
    ocaSchema.overlays.entry = entryOverlays;
  }
}

function applyLabelAndInfoOverlays(ocaSchema, editorState) {
  const lanData = editorState.lanAttributeRowData || {};
  if (Object.keys(lanData).length === 0) return;

  const labelOverlays = [];
  const informationOverlays = [];

  Object.entries(lanData).forEach(([language, rows]) => {
    // Convert language name to 3-letter OCA code (English -> eng, French -> fra)
    // Same pattern as applyEntryOverlay above
    const langCode = langCodeOCAFromName(language) || language.toLowerCase().slice(0, 3);

    const existingLabel = ocaSchema.overlays?.label?.find((l) => l.language === langCode);
    const existingInfo = ocaSchema.overlays?.information?.find((i) => i.language === langCode);

    const labelOverlay = {
      d: existingLabel?.d,
      capture_base: ocaSchema.capture_base.d,
      type: "spec/overlays/label/1.0",
      language: langCode,
      attribute_labels: {},
    };

    const informationOverlay = {
      d: existingInfo?.d,
      capture_base: ocaSchema.capture_base.d,
      type: "spec/overlays/information/1.0",
      language: langCode,
      attribute_information: {},
    };

    if (Array.isArray(rows)) {
      rows.forEach((row) => {
        if (row.Attribute) {
          if (row.Label) labelOverlay.attribute_labels[row.Attribute] = row.Label;
          if (row.Description) informationOverlay.attribute_information[row.Attribute] = row.Description;
        }
      });
    }

    if (Object.keys(labelOverlay.attribute_labels).length > 0) labelOverlays.push(labelOverlay);
    if (Object.keys(informationOverlay.attribute_information).length > 0) informationOverlays.push(informationOverlay);
  });

  if (labelOverlays.length > 0) ocaSchema.overlays.label = labelOverlays;
  if (informationOverlays.length > 0) ocaSchema.overlays.information = informationOverlays;
}