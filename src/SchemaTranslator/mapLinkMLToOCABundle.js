/**
 * Maps LinkML schemas to OCA bundle structures.
 */

/**
 * Helper: build an overlay block only if data has keys
 * @param {string} type - The type of overlay
 * @param {string} key - The key for the data
 * @param {Object} data - The overlay data
 * @returns {Object|null} An overlay object or null if no data
 */
function buildOverlay(type, key, data) {
  if (Object.keys(data).length === 0) return null;

  return {
    type,
    capture_base: "",
    language: "en",
    [key]: data
  };
}

/**
 * Build overlays from enums used in slots
 * @param {Object} slots - The slots dictionary
 * @param {Object} enums - The enums dictionary
 * @returns {Object} Entry and entry_code overlays
 */
function buildEntryOverlays(slots, enums) {
  const entry_code_data = {};
  const entry_data = {};

  Object.entries(slots).forEach(([slotName, slot]) => {
    const enumName = slot.range;
    const enumDef = enums[enumName];
    if (!enumDef) return;

    // For "Entry Code" overlay
    entry_code_data[slotName] = Object.keys(enumDef.permissible_values || {});

    // For "Entry" overlay
    entry_data[slotName] = Object.fromEntries(
      Object.entries(enumDef.permissible_values || {}).map(([code, value]) => [
        code,
        value.description || code
      ])
    );
  });

  const overlays = {};

  if (Object.keys(entry_code_data).length > 0) {
    overlays.entry_code = [
      {
        type: "spec/overlays/entry_code/1.0",
        capture_base: "",
        language: "en",
        attribute_entry_codes: entry_code_data
      }
    ];
  }

  if (Object.keys(entry_data).length > 0) {
    overlays.entry = [
      {
        type: "spec/overlays/entry/1.0",
        capture_base: "",
        language: "en",
        attribute_entries: entry_data
      }
    ];
  }

  return overlays;
}

/**
 * Build cardinality overlay from LinkML slots
 * @param {Object} slots - The slots dictionary
 * @param {Object} linkmlSchema - The LinkML schema
 * @returns {Object|null} A cardinality overlay or null if no cardinality data
 */
function buildCardinalityOverlay(slots, linkmlSchema) {
  const cardinalityData = {};

  // First, check slots directly for cardinality properties
  Object.entries(slots).forEach(([slotName, slot]) => {
    let minCard = null;
    let maxCard = null;

    // Check for minimum and maximum cardinality
    if (slot.minimum_cardinality !== undefined) {
      minCard = slot.minimum_cardinality;
    }
    if (slot.maximum_cardinality !== undefined) {
      maxCard = slot.maximum_cardinality;
    }

    // If not multivalued or cardinality not specified, skip
    if (slot.multivalued && minCard === null && maxCard === null) {
      return;
    }

    // Build cardinality string
    if (minCard !== null && maxCard !== null) {
      cardinalityData[slotName] = `${minCard}-${maxCard}`;
    } else if (minCard !== null) {
      cardinalityData[slotName] = `${minCard}-*`;
    } else if (maxCard !== null) {
      cardinalityData[slotName] = `0-${maxCard}`;
    }
  });
  
  // Return overlay only if there's cardinality data
  if (Object.keys(cardinalityData).length === 0) return null;

  return {
    type: "spec/overlays/cardinality/1.0",
    capture_base: "",
    attribute_cardinality: cardinalityData
  };
}

/**
 * Build overlays for an OCA bundle
 * @param {Object} slots - The slots dictionary
 * @param {Object} enums - The enums dictionary
 * @param {Object} linkmlSchema - The LinkML schema
 * @returns {Object} The overlays object
 */
export function buildOverlays(slots, enums, linkmlSchema) {
  const overlays = {};

  const overlaySpecs = [
    {
      name: "format",
      type: "spec/overlays/format/1.0",
      key: "attribute_formats",
      data: Object.fromEntries(
        Object.entries(slots)
          .filter(([, s]) => s.pattern)
          .map(([k, s]) => [k, s.pattern])
      )
    },
    {
      name: "information",
      type: "spec/overlays/information/1.0",
      key: "attribute_information",
      data: Object.fromEntries(
        Object.entries(slots)
          .filter(([, s]) => s.description)
          .map(([k, s]) => [k, s.description])
      )
    },
    {
      name: "label",
      type: "spec/overlays/label/1.0",
      key: "attribute_labels",
      data: Object.fromEntries(
        Object.entries(slots)
          .filter(([, s]) => s.title)
          .map(([k, s]) => [k, s.title])
      )
    },
    {
      name: "standard",
      type: "spec/overlays/standard/1.0",
      key: "attr_standards",
      data: Object.fromEntries(
        Object.entries(slots)
          .filter(([, s]) => s.slot_uri)
          .map(([k, s]) => [k, s.slot_uri])
      )
    },
    {
      name: "unit",
      type: "spec/overlays/unit/1.0",
      key: "attribute_units",  // Correct OCA spec field name (plural)
      data: Object.fromEntries(
        Object.entries(slots)
          .filter(([, slot]) => slot.unit?.ucum_code)
          .map(([key, slot]) => [key, slot.unit?.ucum_code || ""])
      )
    }
  ];

  overlaySpecs.forEach(({ name, type, key, data }) => {
    // Unit overlay is language-independent and not wrapped in array
    if (name === "unit") {
      if (Object.keys(data).length > 0) {
        overlays[name] = {
          type,
          capture_base: "",
          measurement_system: "Metric",  // Default to Metric for LinkML
          [key]: data
        };
      }
    } else {
      // Language-dependent overlays (label, information, etc.) use buildOverlay
      const overlay = buildOverlay(type, key, data);
      if (overlay) {
        overlays[name] = [overlay];
      }
    }
  });

  // Meta overlay
  const metaOverlay = {
    type: "spec/overlays/meta/1.0",
    capture_base: "",
    language: "en",
    name: linkmlSchema.name,
    description: linkmlSchema.description || ""
  };

  if (metaOverlay.name || metaOverlay.description) {
    overlays.meta = [metaOverlay];
  }

  // Add entry/entry_code overlays
  const entryOverlays = buildEntryOverlays(slots, enums);
  Object.assign(overlays, entryOverlays);

  // Conformance overlay (language-independent)
  const conformanceData = Object.fromEntries(
    Object.entries(slots).map(([key, slot]) => {
      // If required is explicitly true, set to "M", otherwise "O"
      const conformance = slot.required === true ? "M" : "O";
      return [key, conformance];
    })
  );

  if (Object.keys(conformanceData).length > 0) {
    overlays.conformance = {
      type: "spec/overlays/conformance/1.0",
      capture_base: "",
      attribute_conformance: conformanceData
    };
  }

  // Cardinality overlay (language-independent)
  const cardinalityOverlay = buildCardinalityOverlay(slots, linkmlSchema);
  if (cardinalityOverlay) {
    overlays.cardinality = cardinalityOverlay;
  }

  // Build ADC unit_framing extension if ucum_code is present
  const unitFramingExtension = {};
  Object.entries(slots)
    .filter(([, slot]) => slot.unit?.ucum_code)
    .forEach(([, slot]) => {
      const ucumCode = slot.unit.ucum_code;
      if (!unitFramingExtension[ucumCode]) {
        unitFramingExtension[ucumCode] = {
          term_id: ucumCode,
          predicate_id: "skos:exactMatch"
        };
      }
    });

  const extensions = Object.keys(unitFramingExtension).length > 0 ? { unit_framing: { units: unitFramingExtension } } : null;

  return { overlays, extensions };
}

/**
 * Maps a LinkML schema to an OCA bundle structure.
 * @param {Object} linkmlSchema - The LinkML schema to convert
 * @returns {Object} An OCA bundle
 */
export function mapLinkMLToOCABundle(linkmlSchema) {
  const slots = linkmlSchema.slots || {};
  const enums = linkmlSchema.enums || {};

  // Extract OCA attributes and flagged attributes
  const attributes = Object.fromEntries(
    Object.entries(slots).map(([key, slot]) => {
      let range = "Text";

      if (["integer", "decimal", "float"].includes(slot.range)) {
        range = "Numeric";
      }

      if (slot.range === "datetime") {
        range = "Datetime";
      }

      // OCA does not support Event or Type?
      if (/Event|Type/.test(slot.range)) {
        range = "";
      }

      return [key, range];
    })
  );

  const flaggedAttributes = Object.entries(slots)
    .filter(([, slot]) => slot.annotations?.flagged)
    .map(([key]) => key);

  // Generate a deterministic ID based on schema name or timestamp
  const schemaId = linkmlSchema.name 
    ? `linkml_${linkmlSchema.name}_${Date.now()}` 
    : `linkml_schema_${Date.now()}`;
  
  const captureBaseId = `${schemaId}_capture_base`;

  // Define capture_base separately with digest
  const capture_base = {
    d: captureBaseId,
    type: "spec/capture_base/1.0",
    language: "en",
    attributes,
    flagged_attributes: flaggedAttributes
  };

  const { overlays, extensions } = buildOverlays(slots, enums, linkmlSchema);

  return {
    d: schemaId,
    capture_base,
    overlays,
    extensions,
    captureBaseId
  };
}
