// Helper function to replace specified characters in object keys
export const replaceCharsInKeys = (obj, replacement = "_") => {
  if (!obj) return obj;

  // Pattern matches anything that IS NOT a letter, number, underscore, hyphen, or period
  const pattern = /[^a-zA-Z0-9_\-.]+/g;

  const cleanString = (str) => {
    // Replace consecutive special chars with a single replacement character
    let result = str.replace(pattern, replacement);
    // Remove replacement character from the end if present
    result = result.replace(new RegExp(`${replacement}+$`), "");
    return result;
  };

  // If it's an array of strings
  if (Array.isArray(obj)) {
    return obj.map(cleanString);
  }

  // If it's an object with attribute names as keys
  const converted = {};
  Object.entries(obj).forEach(([key, value]) => {
    const newKey = cleanString(key);
    converted[newKey] = value;
  });
  return converted;
};

export const hasDisallowedChars = (str) => /[^a-zA-Z0-9_\-.]/.test(str);

export const collectInvalidAttributeNames = (names) => {
  const invalidNames = [];
  names.forEach((name) => {
    const trimmed = typeof name === "string" ? name.trim().replace(/\s+/g, " ") : name;
    if (trimmed && hasDisallowedChars(trimmed) && !invalidNames.includes(name)) {
      invalidNames.push(name);
    }
  });
  return invalidNames;
};

// Sanitize attributes in JSON string from ZIP schema upload
export const replaceAttributeCharsInJsonString = (jsonString, parsed = false) => {
  const parsedJson = JSON.parse(jsonString);

  if (parsedJson.type) {
    if (parsedJson.type.includes("capture_base")) {
      if (parsedJson.attributes) {
        parsedJson.attributes = replaceCharsInKeys(parsedJson.attributes);
      }
    }

    if (parsedJson.type.split("/")[2] === "cardinality") {
      if (parsedJson.attribute_cardinality) {
        parsedJson.attribute_cardinality = replaceCharsInKeys(
          parsedJson.attribute_cardinality
        );
      }
    }

    if (parsedJson.type.split("/")[2] === "character_encoding") {
      if (parsedJson.attribute_character_encoding) {
        parsedJson.attribute_character_encoding = replaceCharsInKeys(
          parsedJson.attribute_character_encoding
        );
      }
    }

    if (parsedJson.type.split("/")[2] === "conformance") {
      if (parsedJson.attribute_conformance) {
        parsedJson.attribute_conformance = replaceCharsInKeys(
          parsedJson.attribute_conformance
        );
      }
    }

    if (parsedJson.type.split("/")[2] === "entry") {
      if (parsedJson.attribute_entries) {
        parsedJson.attribute_entries = replaceCharsInKeys(parsedJson.attribute_entries);
      }
    }

    if (parsedJson.type.split("/")[2] === "entry_code") {
      if (parsedJson.attribute_entry_codes) {
        parsedJson.attribute_entry_codes = replaceCharsInKeys(
          parsedJson.attribute_entry_codes
        );
      }
    }

    if (parsedJson.type.split("/")[2] === "format") {
      if (parsedJson.attribute_formats) {
        parsedJson.attribute_formats = replaceCharsInKeys(parsedJson.attribute_formats);
      }
    }

    if (parsedJson.type.split("/")[2] === "information") {
      if (parsedJson.attribute_information) {
        parsedJson.attribute_information = replaceCharsInKeys(
          parsedJson.attribute_information
        );
      }
    }

    if (parsedJson.type.split("/")[2] === "label") {
      if (parsedJson.attribute_labels) {
        parsedJson.attribute_labels = replaceCharsInKeys(parsedJson.attribute_labels);
      }
    }

    if (parsedJson.type.split("/")[2] === "unit") {
      if (parsedJson.attribute_units) {
        parsedJson.attribute_units = replaceCharsInKeys(parsedJson.attribute_units);
      } else if (parsedJson.attribute_unit) {
        parsedJson.attribute_unit = replaceCharsInKeys(parsedJson.attribute_unit);
      }
    }
  }

  return parsed ? parsedJson : JSON.stringify(parsedJson);
};

// Sanitize attributes in parsed JSON from JSON schema upload
export const replaceAttributeCharsInParsedJson = (parsedJson) => {
  const modifiedParsedJson = JSON.parse(JSON.stringify(parsedJson));
  if (modifiedParsedJson?.capture_base?.attributes) {
    modifiedParsedJson.capture_base.attributes = replaceCharsInKeys(
      modifiedParsedJson.capture_base.attributes
    );
  }

  if (modifiedParsedJson?.overlays?.cardinality?.attribute_cardinality) {
    modifiedParsedJson.overlays.cardinality.attribute_cardinality = replaceCharsInKeys(
      modifiedParsedJson.overlays.cardinality.attribute_cardinality
    );
  }

  if (modifiedParsedJson?.overlays?.character_encoding?.attribute_character_encoding) {
    modifiedParsedJson.overlays.character_encoding.attribute_character_encoding =
      replaceCharsInKeys(
        modifiedParsedJson.overlays.character_encoding.attribute_character_encoding
      );
  }

  if (modifiedParsedJson?.overlays?.conformance?.attribute_conformance) {
    modifiedParsedJson.overlays.conformance.attribute_conformance = replaceCharsInKeys(
      modifiedParsedJson.overlays.conformance.attribute_conformance
    );
  }

  // In case of JSON schema upload, entry overlay is an array of objects
  if (modifiedParsedJson?.overlays?.entry) {
    if (Array.isArray(modifiedParsedJson.overlays.entry)) {
      modifiedParsedJson.overlays.entry.forEach((entryItem) => {
        if (entryItem.attribute_entries) {
          entryItem.attribute_entries = replaceCharsInKeys(entryItem.attribute_entries);
        }
      });
    } else if (modifiedParsedJson.overlays.entry.attribute_entries) {
      modifiedParsedJson.overlays.entry.attribute_entries = replaceCharsInKeys(
        modifiedParsedJson.overlays.entry.attribute_entries
      );
    }
  }

  if (modifiedParsedJson?.overlays?.entry_code?.attribute_entry_codes) {
    modifiedParsedJson.overlays.entry_code.attribute_entry_codes = replaceCharsInKeys(
      modifiedParsedJson.overlays.entry_code.attribute_entry_codes
    );
  }

  if (modifiedParsedJson?.overlays?.format?.attribute_formats) {
    modifiedParsedJson.overlays.format.attribute_formats = replaceCharsInKeys(
      modifiedParsedJson.overlays.format.attribute_formats
    );
  }

  // In case of JSON schema upload, information overlay is an array of objects
  if (modifiedParsedJson?.overlays?.information) {
    if (Array.isArray(modifiedParsedJson.overlays.information)) {
      modifiedParsedJson.overlays.information.forEach((info) => {
        if (info.attribute_information) {
          info.attribute_information = replaceCharsInKeys(info.attribute_information);
        }
      });
    } else if (modifiedParsedJson.overlays.information.attribute_information) {
      modifiedParsedJson.overlays.information.attribute_information = replaceCharsInKeys(
        modifiedParsedJson.overlays.information.attribute_information
      );
    }
  }

  // In case of JSON schema upload, label overlay is an array of objects
  if (modifiedParsedJson?.overlays?.label) {
    if (Array.isArray(modifiedParsedJson.overlays.label)) {
      modifiedParsedJson.overlays.label.forEach((labelItem) => {
        if (labelItem.attribute_labels) {
          labelItem.attribute_labels = replaceCharsInKeys(labelItem.attribute_labels);
        }
      });
    } else if (modifiedParsedJson.overlays.label.attribute_labels) {
      modifiedParsedJson.overlays.label.attribute_labels = replaceCharsInKeys(
        modifiedParsedJson.overlays.label.attribute_labels
      );
    }
  }

  if (modifiedParsedJson?.overlays?.unit?.attribute_units) {
    modifiedParsedJson.overlays.unit.attribute_units = replaceCharsInKeys(
      modifiedParsedJson.overlays.unit.attribute_units
    );
  } else if (modifiedParsedJson.overlays.unit?.attribute_unit) {
    modifiedParsedJson.overlays.unit.attribute_unit = replaceCharsInKeys(
      modifiedParsedJson.overlays.unit.attribute_unit
    );
  }

  return modifiedParsedJson;
};
