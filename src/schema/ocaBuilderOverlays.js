/**
 * Applies all overlay changes from schemaState to targetSchema
 * Reads from schemaStore maps (attributeFormats, attributeCardinality, etc.)
 */
export function applyAllOverlays(targetSchema, schemaState) {
  if (!targetSchema.overlays) targetSchema.overlays = {};

  const validAttributeNames = getValidAttributeNames(schemaState);

  // Apply each overlay type
  applyDirectOverlays(targetSchema, schemaState);
  applyMetaOverlays(targetSchema, schemaState);
  applyConformanceOverlay(targetSchema, schemaState);
  applyFormatOverlay(targetSchema, schemaState, validAttributeNames);
  applyCharacterEncodingOverlay(targetSchema, schemaState);
  applyCardinalityOverlay(targetSchema, schemaState, validAttributeNames);
  applyStandardOverlay(targetSchema, schemaState, validAttributeNames);
  applyRangeOverlay(targetSchema, schemaState, validAttributeNames);
  applyEntryOverlay(targetSchema, schemaState);
  applyLabelAndInfoOverlays(targetSchema, schemaState);
}

// ============================================================================
// HELPERS
// ============================================================================

function getValidAttributeNames(schemaState) {
  const attrs = schemaState?.attributes || [];
  return new Set(attrs.map((a) => a.Attribute));
}

// ============================================================================
// OVERLAY APPLIERS
// ============================================================================

function applyDirectOverlays(targetSchema, schemaState) {
  // Direct overlay assignment from schemaState.overlays
  if (schemaState.overlays) {
    Object.entries(schemaState.overlays).forEach(([overlayType, overlayData]) => {
      if (overlayData) {
        targetSchema.overlays[overlayType] = overlayData;
      }
    });
  }
}

function applyMetaOverlays(targetSchema, schemaState) {
  const locMeta = schemaState.metadata?.localized || {};
  if (Object.keys(locMeta).length === 0) return;

  const existingMeta = Array.isArray(targetSchema.overlays?.meta) ? targetSchema.overlays.meta : [];
  
  const metaArray = Object.entries(locMeta).map(([lang, obj]) => {
    const existingForLang = existingMeta.find((m) => m?.language === lang) || {};
    return {
      d: existingForLang.d,
      capture_base: targetSchema.capture_base?.d,
      type: "spec/overlays/meta/1.1",
      language: lang,
      name: obj?.name || "",
      description: obj?.description || "",
    };
  });
  
  if (metaArray.length > 0) targetSchema.overlays.meta = metaArray;
}

function applyConformanceOverlay(targetSchema, schemaState) {
  if (!schemaState.attributes?.length) return;
  
  const hasRequiredFlags = schemaState.attributes.some(
    (attr) => attr.Required === true || attr.Required === false
  );

  if (!hasRequiredFlags) return;
  
  const conformanceOverlay = {
    d: targetSchema.overlays?.conformance?.d,
    capture_base: targetSchema.capture_base.d,
    type: "spec/overlays/conformance/1.1",
    attribute_conformance: {},
  };

  schemaState.attributes.forEach((attr) => {
    if (attr.Attribute && (attr.Required === true || attr.Required === false)) {
      conformanceOverlay.attribute_conformance[attr.Attribute] = attr.Required ? "M" : "O";
    }
  });

  if (Object.keys(conformanceOverlay.attribute_conformance).length > 0) {
    targetSchema.overlays.conformance = conformanceOverlay;
  }
}

function applyFormatOverlay(targetSchema, schemaState, validAttributeNames) {
  // ✅ Read from schemaState.attributeFormats (map from schemaStore)
  const attributeFormats = schemaState.attributeFormats || {};
  
  if (Object.keys(attributeFormats).length === 0) return;
  
  const formatOverlay = {
    d: targetSchema.overlays?.format?.d,
    capture_base: targetSchema.capture_base.d,
    type: "spec/overlays/format/1.1",
    attribute_formats: {},
  };

  Object.entries(attributeFormats).forEach(([attrName, formatRule]) => {
    if (validAttributeNames.has(attrName) && formatRule) {
      formatOverlay.attribute_formats[attrName] = formatRule;
    }
  });

  if (Object.keys(formatOverlay.attribute_formats).length > 0) {
    targetSchema.overlays.format = formatOverlay;
  }
}

function applyCharacterEncodingOverlay(targetSchema, schemaState) {
  const charEncoding = schemaState.characterEncodingData || {};
  if (Object.keys(charEncoding).length === 0) return;
  
  const charEncodingOverlay = {
    d: targetSchema.overlays?.character_encoding?.d,
    capture_base: targetSchema.capture_base.d,
    type: "spec/overlays/character_encoding/1.1",
    attribute_character_encoding: {},
  };

  Object.entries(charEncoding).forEach(([attr, encoding]) => {
    if (encoding) charEncodingOverlay.attribute_character_encoding[attr] = encoding;
  });

  if (Object.keys(charEncodingOverlay.attribute_character_encoding).length > 0) {
    targetSchema.overlays.character_encoding = charEncodingOverlay;
  }
}

function applyCardinalityOverlay(targetSchema, schemaState, validAttributeNames) {
  // ✅ Read from schemaState.attributeCardinality (map from schemaStore)
  const attributeCardinality = schemaState.attributeCardinality || {};
  
  if (Object.keys(attributeCardinality).length === 0) return;
  
  const cardinalityOverlay = {
    d: targetSchema.overlays?.cardinality?.d,
    capture_base: targetSchema.capture_base.d,
    type: "spec/overlays/cardinality/1.1",
    attribute_cardinality: {},
  };

  Object.entries(attributeCardinality).forEach(([attrName, cardValue]) => {
    if (validAttributeNames.has(attrName) && cardValue) {
      cardinalityOverlay.attribute_cardinality[attrName] = cardValue;
    }
  });

  if (Object.keys(cardinalityOverlay.attribute_cardinality).length > 0) {
    targetSchema.overlays.cardinality = cardinalityOverlay;
  }
}

function applyStandardOverlay(targetSchema, schemaState, validAttributeNames) {
  const dataStandards = schemaState.dataStandardsData || [];
  if (dataStandards.length === 0) return;
  
  const standardOverlay = {
    d: targetSchema.overlays?.standard?.d,
    capture_base: targetSchema.capture_base.d,
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
    targetSchema.overlays.standard = standardOverlay;
  }
}

function applyRangeOverlay(targetSchema, schemaState, validAttributeNames) {
  // ✅ Read from schemaState.attributeRanges (map from schemaStore)
  const attributeRanges = schemaState.attributeRanges || {};
  
  if (Object.keys(attributeRanges).length === 0) return;
  
  const rangeOverlay = {
    d: targetSchema.overlays?.range?.d,
    capture_base: targetSchema.capture_base.d,
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
    targetSchema.overlays.range = rangeOverlay;
  }
}

function applyEntryOverlay(targetSchema, schemaState) {
  const entryCodes = schemaState.entryCodes || {};
  if (Object.keys(entryCodes).length === 0) return;
  
  const entryOverlay = {
    d: targetSchema.overlays?.entry?.d,
    capture_base: targetSchema.capture_base.d,
    type: "spec/overlays/entry/1.1",
    language: "eng",
    attribute_entries: {},
  };

  Object.entries(entryCodes).forEach(([attrName, codes]) => {
    if (Array.isArray(codes)) {
      entryOverlay.attribute_entries[attrName] = {};
      codes.forEach((code) => {
        if (code.Code) {
          entryOverlay.attribute_entries[attrName][code.Code] = code.eng || code.English || "";
        }
      });
    }
  });

  if (Object.keys(entryOverlay.attribute_entries).length > 0) {
    targetSchema.overlays.entry = [entryOverlay];
  }
}

function applyLabelAndInfoOverlays(targetSchema, schemaState) {
  const lanData = schemaState.lanAttributeRowData || {};
  if (Object.keys(lanData).length === 0) return;

  const labelOverlays = [];
  const informationOverlays = [];

  Object.entries(lanData).forEach(([language, rows]) => {
    const langCodeMap = {
      English: "eng",
      French: "fra",
      German: "deu",
      Spanish: "spa",
      eng: "eng",
      fra: "fra",
      deu: "deu",
      spa: "spa",
    };
    const langCode = langCodeMap[language] || language;

    const existingLabel = targetSchema.overlays?.label?.find((l) => l.language === langCode);
    const existingInfo = targetSchema.overlays?.information?.find((i) => i.language === langCode);

    const labelOverlay = {
      d: existingLabel?.d,
      capture_base: targetSchema.capture_base.d,
      type: "spec/overlays/label/1.0",
      language: langCode,
      attribute_labels: {},
    };

    const informationOverlay = {
      d: existingInfo?.d,
      capture_base: targetSchema.capture_base.d,
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

  if (labelOverlays.length > 0) targetSchema.overlays.label = labelOverlays;
  if (informationOverlays.length > 0) targetSchema.overlays.information = informationOverlays;
}