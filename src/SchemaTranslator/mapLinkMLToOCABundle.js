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
 * Collect mappings between attributes and enums, including nested references
 * @param {Object} slots - The slots dictionary
 * @param {Object} enums - The enums dictionary
 * @returns {Object} Map of attribute names to enum names
 */
function collectAttributeEnumMappings(slots, enums) {
  const mappings = {};

  // Skip if no slots or enums
  if (!slots || !enums) return mappings;

  // Process all slots to find enum references
  Object.entries(slots).forEach(([slotName, slotDef]) => {
    if (!slotDef.range) return;

    // eslint-disable-next-line no-console
    console.log(`DEBUG - Checking slot ${slotName} with range ${slotDef.range}`);

    // Match with defined enum names
    if (enums[slotDef.range]) {
      mappings[slotName] = slotDef.range;

      // Check if the enum has permissible values
      const enumDef = enums[slotDef.range];
      if (
        !enumDef.permissible_values ||
        Object.keys(enumDef.permissible_values).length === 0
      ) {
        // eslint-disable-next-line no-console
        console.warn(
          `WARNING: Enum ${slotDef.range} exists but has no permissible values`
        );
      }
    }
  });

  // eslint-disable-next-line no-console
  console.log("DEBUG - Enum mappings result:", mappings);

  return mappings;
}

/**
 * Build overlays from enums used in slots
 * @param {Object} slots - The slots dictionary
 * @param {Object} enums - The enums dictionary
 * @returns {Object} Entry and entry_code overlays
 */
function buildEntryOverlays(slots, enums) {
  const attributeEnumMappings = collectAttributeEnumMappings(slots, enums);

  if (Object.keys(attributeEnumMappings).length === 0) {
    return {};
  }

  const entry_code_data = {};
  const entry_data = {};

  Object.entries(attributeEnumMappings).forEach(([attrName, enumName]) => {
    const enumDef = enums[enumName];

    if (
      !enumDef ||
      !enumDef.permissible_values ||
      Object.keys(enumDef.permissible_values).length === 0
    ) {
      return;
    }

    const permValues = Object.keys(enumDef.permissible_values);

    entry_code_data[attrName] = permValues;
    entry_data[attrName] = Object.fromEntries(
      Object.entries(enumDef.permissible_values).map(([value]) => [
        value,
        // Nothing from linkML fits neatly here, so we use the value as is
        value
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
      key: "attribute_units",
      data: Object.fromEntries(
        Object.entries(slots)
          .filter(([, slot]) => slot.unit?.ucum_code)
          .map(([key, slot]) => [key, slot.unit?.ucum_code || ""])
      )
    }
  ];

  overlaySpecs.forEach(({ name, type, key, data }) => {
    const overlay = buildOverlay(type, key, data);
    if (overlay) {
      overlays[name] = [overlay];
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

  return { overlays };
}

// Map LinkML ranges to OCA types
function mapRangeToOCAType(range) {
  if (!range) return "Text";

  if (range === "string") {
    return "Text";
  }

  if (["integer", "decimal", "float"].includes(range)) {
    return "Numeric";
  }

  if (["datetime", "date"].includes(range)) {
    return "DateTime";
  }

  if (range === "boolean") {
    return "Boolean";
  }

  // Any other type defaults to Text
  return "Text";
}

/**
 * Collects all slots from all classes in the LinkML schema
 * @param {Object} linkmlSchema - The LinkML schema
 * @returns {Object} All collected slots
 */
function collectAllSlots(linkmlSchema) {
  const allSlots = {};

  // Process slots defined directly in the schema
  if (linkmlSchema.slots) {
    Object.entries(linkmlSchema.slots).forEach(([slotName, slotDef]) => {
      allSlots[slotName] = { ...slotDef };
    });
  }

  // Process all classes
  if (linkmlSchema.classes) {
    Object.entries(linkmlSchema.classes).forEach(([, classData]) => {
      // Process slots directly defined in the class
      if (classData.slots) {
        classData.slots.forEach((slotName) => {
          // If slot isn't already defined, add an empty entry
          if (!allSlots[slotName]) {
            allSlots[slotName] = {};
          }
        });
      }

      // Process slot_usage
      if (classData.slot_usage) {
        Object.entries(classData.slot_usage).forEach(([slotName, slotUsage]) => {
          // Create or update slot definition
          if (!allSlots[slotName]) {
            allSlots[slotName] = { ...slotUsage };
          } else {
            // Merge with existing definition
            allSlots[slotName] = { ...allSlots[slotName], ...slotUsage };
          }
        });
      }
    });
  }

  return allSlots;
}

/**
 * Maps a LinkML schema to an OCA bundle structure.
 * @param {Object} linkmlSchema - The LinkML schema to convert
 * @returns {Object} An OCA bundle
 */
export function mapLinkMLToOCABundle(linkmlSchema) {
  try {
    const slots = collectAllSlots(linkmlSchema);

    // Create a simple bundle even if there are issues
    const attributes = {};

    // Try to extract attributes from slots
    try {
      Object.entries(slots).forEach(([key, slot]) => {
        try {
          const ocaType = mapRangeToOCAType(slot.range);
          attributes[key] = ocaType;
        } catch (e) {
          // If there's an error with this slot, use Text as fallback
          attributes[key] = "Text";
        }
      });
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error("Error processing slots:", e);
    }

    // If no attributes were found, add a dummy one
    if (Object.keys(attributes).length === 0) {
      attributes.dummy = "Text";
    }

    // Define capture_base
    const capture_base = {
      type: "spec/capture_base/1.0",
      language: "en",
      attributes
    };

    // Basic overlays
    const overlays = {
      meta: [
        {
          type: "spec/overlays/meta/1.0",
          capture_base: "",
          language: "en",
          name: linkmlSchema.name || "Unnamed Schema",
          description: linkmlSchema.description || "No description available"
        }
      ]
    };

    // Try to build more overlays if possible
    try {
      const enums = linkmlSchema.enums || {};
      const builtOverlays = buildOverlays(slots, enums, linkmlSchema);

      // Debug the entry overlays
      if (builtOverlays.overlays && builtOverlays.overlays.entry_code) {
        // eslint-disable-next-line no-console
        console.log(
          "DEBUG - Built entry_code overlays:",
          JSON.stringify(builtOverlays.overlays.entry_code, null, 2)
        );
      } else {
        // eslint-disable-next-line no-console
        console.log("DEBUG - No entry_code overlays were built");
      }

      Object.assign(overlays, builtOverlays.overlays);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error("Error building overlays:", e);
    }

    return { capture_base, overlays };
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Fatal error processing schema:", error);

    // Return a minimal valid bundle
    return {
      capture_base: {
        type: "spec/capture_base/1.0",
        language: "en",
        attributes: { error_message: "Text" }
      },
      overlays: {
        meta: [
          {
            type: "spec/overlays/meta/1.0",
            capture_base: "",
            language: "en",
            name: "Error Processing Schema",
            description: error.message
          }
        ],
        information: [
          {
            type: "spec/overlays/information/1.0",
            capture_base: "",
            language: "en",
            attribute_information: {
              error_message:
                "There was an error processing this schema. Please try with a simpler schema."
            }
          }
        ]
      }
    };
  }
}
