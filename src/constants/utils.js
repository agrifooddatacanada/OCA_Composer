import i18next from "i18next";
import { codesToLanguages } from "./isoCodes";
import { DEFAULT_LANGUAGE } from "./constants";

export const getCurrentData = (currentApi, includedError) => {
  const newData = [];
  currentApi.forEachNode((node) => {
    const newObject = { ...node?.data };
    if (!includedError) {
      delete newObject.error;
    }
    newData.push(newObject);
  });
  return newData;
};

export const getDescriptiveFileName = (schemaDescription, commonFileName) => {
  const currentLanguage = codesToLanguages[i18next.language] || DEFAULT_LANGUAGE;
  const schemaName = schemaDescription[currentLanguage]?.name;
  const fileName = `${schemaName ? `${schemaName.split(" ")[0]}_` : ""}${commonFileName}`;
  return fileName;
};

// Helper function to replace specified characters in object keys
export const replaceCharsInKeys = (
  obj,
  charsToReplace = [".", ","],
  replacement = "_"
) => {
  if (!obj) return obj;

  const pattern = new RegExp(`[${charsToReplace.join("")}]`, "g");

  // If it's an array of strings
  if (Array.isArray(obj)) {
    return obj.map((item) => item.replace(pattern, replacement));
  }

  // If it's an object with attribute names as keys
  const converted = {};
  Object.entries(obj).forEach(([key, value]) => {
    const newKey = key.replace(pattern, replacement);
    converted[newKey] = value;
  });
  return converted;
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
  }

  return modifiedParsedJson;
};

export const getOrderedAttributeRowData = (attributeRowData, attributeOrdering) => {
  const orderedAttributeRowData = [];
  attributeOrdering.forEach((attributeName) => {
    const row = attributeRowData.find((item) => item.Attribute === attributeName);
    orderedAttributeRowData.push(row);
  });
  return orderedAttributeRowData;
};

export const hasEntryCodeOrdering = (OCAPackage) =>
  Boolean(
    Array.isArray(OCAPackage?.extensions) &&
      OCAPackage.extensions.length > 0 &&
      OCAPackage.extensions[0]?.overlays?.ordering?.entry_code_ordering
  );

export const hasAttributeOrdering = (OCAPackage) =>
  Boolean(
    Array.isArray(OCAPackage?.extensions) &&
      OCAPackage.extensions.length > 0 &&
      OCAPackage.extensions[0]?.overlays?.ordering?.attribute_ordering
  );
