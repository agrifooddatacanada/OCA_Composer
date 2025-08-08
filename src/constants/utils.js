import i18next from "i18next";
import Fuse from "fuse.js";
import { DateTime, Duration } from "luxon";
import { codesToLanguages, alpha3CodesToTwoLetterCodes } from "./isoCodes";
import {
  ADC,
  CUSTOM_FORMAT_RULE,
  customDateFormatParsers,
  DEFAULT_LANGUAGE,
  DISALLOWED_CHARACTERS,
  FIELD_FORMAT_OVERLAY,
  formatCodeBinaryDescription,
  formatCodeDateDescription,
  formatCodeNumericDescription,
  formatCodeTextDescription,
  OCA_REPOSITORY_API_URL,
  RANGE,
  SSSOM_MAPPER_API_URL
} from "./constants";
import ucumUnits from "./ucumUnits";

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
  charsToReplace = DISALLOWED_CHARACTERS,
  replacement = "_"
) => {
  if (!obj) return obj;

  // Escape backslash to ensure it's treated as a literal backslash
  const escapedChars = charsToReplace.map((char) => (char === "\\" ? "\\\\" : char));
  const pattern = new RegExp(`[${escapedChars.join("")}]+`, "g");

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

export const hasDisallowedChars = (str, charsToCheck = DISALLOWED_CHARACTERS) => {
  const pattern = new RegExp(
    `[${charsToCheck.map((char) => (char === "\\" ? "\\\\" : char)).join("")}]`
  );
  return pattern.test(str);
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

export const getOrderedAttributeRowData = (attributeRowData, attributeOrdering) => {
  const orderedAttributeRowData = [];
  attributeOrdering.forEach((attributeName) => {
    const row = attributeRowData.find((item) => item.Attribute === attributeName);
    orderedAttributeRowData.push(row);
  });
  return orderedAttributeRowData;
};

export const hasEntryCodeOrdering = (OCAPackage) => {
  // For now, use the capture base SAID of the main/top-level bundle
  const captureBaseSaid = OCAPackage?.oca_bundle?.bundle?.capture_base?.d;
  return Boolean(
    Object.keys(OCAPackage?.extensions || {}).length > 0 &&
      OCAPackage.extensions?.[ADC]?.[captureBaseSaid]?.overlays?.ordering
        ?.entry_code_ordering
  );
};

export const hasAttributeOrdering = (OCAPackage) => {
  // For now, use the capture base SAID of the main/top-level bundle
  const captureBaseSaid = OCAPackage?.oca_bundle?.bundle?.capture_base?.d;
  return Boolean(
    Object.keys(OCAPackage?.extensions || {}).length > 0 &&
      OCAPackage.extensions?.[ADC]?.[captureBaseSaid]?.overlays?.ordering
        ?.attribute_ordering
  );
};

export const hasUnitFramingOverlay = (OCAPackage) => {
  // For now, use the capture base SAID of the main/top-level bundle
  const captureBaseSaid = OCAPackage?.oca_bundle?.bundle?.capture_base?.d;
  return Boolean(
    Object.keys(OCAPackage?.extensions || {}).length > 0 &&
      OCAPackage.extensions?.[ADC]?.[captureBaseSaid]?.overlays?.unit_framing
  );
};

export const hasAttributeFramingOverlay = (OCAPackage) => {
  // For now, use the capture base SAID of the main/top-level bundle
  const captureBaseSaid = OCAPackage?.oca_bundle?.bundle?.capture_base?.d;
  return Boolean(
    Object.keys(OCAPackage?.extensions || {}).length > 0 &&
      OCAPackage.extensions?.[ADC]?.[captureBaseSaid]?.overlays?.attribute_framing
  );
};

export const hasRangeOverlay = (OCAPackage) => {
  // For now, use the capture base SAID of the main/top-level bundle
  const captureBaseSaid = OCAPackage?.oca_bundle?.bundle?.capture_base?.d;
  return Boolean(
    Object.keys(OCAPackage?.extensions || {}).length > 0 &&
      OCAPackage.extensions?.[ADC]?.[captureBaseSaid]?.overlays?.[RANGE]
  );
};

export const getExtensionOverlays = (OCAPackage) => {
  // For now, use the capture base SAID of the main/top-level bundle
  const captureBaseSaid = OCAPackage?.oca_bundle?.bundle?.capture_base?.d;
  const extensionOverlays = Object.entries(OCAPackage?.extensions || {}).reduce(
    (acc, [extensionName, extensionData]) => {
      const overlay = extensionData?.[captureBaseSaid]?.overlays;
      if (overlay) {
        acc[extensionName] = overlay;
      }
      return acc;
    },
    {}
  );
  return extensionOverlays;
};

export const getTransformedEntryCodes = (entryCodes) => {
  const transformedEntryCodes = {};
  Object.entries(entryCodes).forEach(([attribute, codes]) => {
    transformedEntryCodes[attribute] = codes.map((item) => item.Code);
  });
  return transformedEntryCodes;
};

export const getOrderedAttributeMap = (attributeOrdering, attributeMap) => {
  const orderedAttributeMap = {};
  attributeOrdering.forEach((attributeName) => {
    if (Object.prototype.hasOwnProperty.call(attributeMap, attributeName)) {
      orderedAttributeMap[attributeName] = attributeMap[attributeName];
    }
  });
  return orderedAttributeMap;
};

export const getUnitsFramedThatAlreadyExistInOcaPackage = (OCAPackage) => {
  const captureBaseSaid = OCAPackage?.oca_bundle?.bundle?.capture_base?.d;

  const unitFramingOverlay = hasUnitFramingOverlay(OCAPackage)
    ? OCAPackage.extensions?.[ADC]?.[captureBaseSaid]?.overlays?.unit_framing
    : undefined;

  if (!unitFramingOverlay) return {};

  const unitsArleadyFramed = {};
  if (
    unitFramingOverlay &&
    typeof unitFramingOverlay === "object" &&
    unitFramingOverlay.units
  ) {
    for (const unit of Object.keys(unitFramingOverlay.units)) {
      unitsArleadyFramed[unit] = unitFramingOverlay.units[unit].term_id;
    }
  }

  return unitsArleadyFramed;
};

export const getAttributesFramedThatAlreadyExistInOcaPackage = (OCAPackage) => {
  const captureBaseSaid = OCAPackage?.oca_bundle?.bundle?.capture_base?.d;

  const attributeFramingOverlay = hasAttributeFramingOverlay(OCAPackage)
    ? OCAPackage.extensions?.[ADC]?.[captureBaseSaid]?.find(
        (overlay) => overlay.attribute_framing
      )?.attribute_framing
    : undefined;

  if (!attributeFramingOverlay) return {};

  const attributesAlreadyFramed = {};
  if (
    attributeFramingOverlay &&
    typeof attributeFramingOverlay === "object" &&
    attributeFramingOverlay.attributes
  ) {
    for (const attribute of Object.keys(attributeFramingOverlay.attributes)) {
      attributesAlreadyFramed[attribute] = attributeFramingOverlay.attributes[attribute];
    }
  }

  return attributesAlreadyFramed;
};

export const getUnitFramingInput = (unitFramingRowData) => {
  const unitFramingInput = {};
  for (const row of unitFramingRowData) {
    unitFramingInput[row.Unit] = {
      term_id: row["UCUM Code"],
      predicate_id: "skos:exactMatch",
      framing_justification: "semapv:ManualMappingCuration"
    };
  }
  return unitFramingInput;
};

export const options = {
  keys: ["code", "label", "description"],
  isCaseSensitive: true,
  includeScore: true,
  includeMatches: true,
  minMatchCharLength: 1,
  shouldSort: true,
  threshold: 0.4,
  distance: 100
};

export const searchUnits = (unit) => {
  if (!unit) return { firstMatch: null, results: [] };

  const fuse = new Fuse(ucumUnits, options);
  const searchResults = fuse.search(unit);
  const slicedResults = searchResults.slice(0, 20).map((result) => result.item);

  const uniqueResults = Array.from(new Set(slicedResults.map((item) => item.code))).map(
    (code) => slicedResults.find((item) => item.code === code)
  );

  return {
    firstMatch: uniqueResults[0] || null,
    results: uniqueResults
  };
};

export const updatedUnitFramingRowDataForViewSchema = (
  attributeRowData,
  unitFramedRowData
) =>
  attributeRowData.map((attributeRow) => {
    const matchingRow = unitFramedRowData.find(
      (unitRow) => unitRow.Unit === attributeRow.Unit && !unitRow.deleted
    );

    return matchingRow
      ? {
          ...attributeRow,
          "UCUM Code": matchingRow["UCUM Code"],
          "UCUM Label": matchingRow["UCUM Label"],
          Description: matchingRow.Description
        }
      : attributeRow;
  });

export const getCurrentUnitFramingRowData = (
  framedAllUnits,
  unitFramedRowData,
  unitRowDataWhenNoFrameAll
) => {
  if (framedAllUnits) {
    return unitFramedRowData;
  }
  return unitRowDataWhenNoFrameAll;
};

export const getAttributeFramingInput = (attributeFramingRowData) => {
  const attributeFramingInput = {};
  for (const row of attributeFramingRowData) {
    if (!row.objectId) continue;

    attributeFramingInput[row.Attribute] = {
      description: row.description,
      framing_justification: row.mappingJustification,
      predicate_id: row.predicateId,
      term_id: row.objectId
    };
  }
  return attributeFramingInput;
};

export const getRangeOverlayInput = (rangeRowData, formatRuleRowData) => {
  const rangeOverlayInput = {};
  rangeRowData.forEach((row) => {
    if (row.LowerBound === "" && row.UpperBound === "") return;

    const attributeFormatData = formatRuleRowData.find(
      (item) => item.Attribute === row.Attribute
    );
    if (!attributeFormatData?.FormatText && !attributeFormatData?.[CUSTOM_FORMAT_RULE])
      return;

    rangeOverlayInput[row.Attribute] = {
      lower: row.LowerBound,
      lower_inclusive: row.LowerInclusive,
      upper: row.UpperBound,
      upper_inclusive: row.UpperInclusive
    };
  });
  return rangeOverlayInput;
};

/*
"attribute_entries": {
  "d_attr": {
    "A": "10",
    "B": "20",
    "C": "30",
    "D": "40"
  }
}

"entry_code_ordering": {
  "d_attr": [
    "D",
    "A",
    "C",
    "B"
  ]
}
  */
export const getOrderedEntries = (entryCodeOrdering, attributeEntries) => {
  const orderedEntries = {};
  Object.entries(entryCodeOrdering).forEach(([attribute, entryCodes]) => {
    if (Object.prototype.hasOwnProperty.call(attributeEntries, attribute)) {
      const orderedCodeToLabelMap = {};
      entryCodes.forEach((code) => {
        if (Object.prototype.hasOwnProperty.call(attributeEntries[attribute], code)) {
          orderedCodeToLabelMap[code] = attributeEntries[attribute][code];
        }
      });
      orderedEntries[attribute] = orderedCodeToLabelMap;
    }
  });
  return orderedEntries;
};

const fetchOCABundle = async (said) => {
  const response = await fetch(`${OCA_REPOSITORY_API_URL}/oca-bundles/${said}`);
  const data = await response.json();
  return data;
};

export const generateOCABundle = async (OCAFileData) => {
  try {
    const response = await fetch(`${OCA_REPOSITORY_API_URL}/oca-bundles`, {
      method: "POST",
      headers: {
        "Content-Type": "text/plain"
      },
      body: OCAFileData
    });

    if (!response.ok) {
      throw new Error(`Failed to generate OCA bundle: ${response.statusText}`);
    }

    const { said } = await response.json();
    const bundle = await fetchOCABundle(said);

    return bundle;
  } catch (error) {
    console.error("Error generating OCA bundle from OCA file:", error);
    throw error;
  }
};

export const searchPredicates = async (data) => {
  // http://localhost:8080/search/?page=1&page_size=10&query=beans
  const response = await fetch(
    `${SSSOM_MAPPER_API_URL}/search/?page=${data.page}&page_size=${data.page_size}&query=${data.query}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json"
      }
    }
  );
  const responseData = await response.json();
  return responseData;
};

export const matchedSubjectAndPredicate = async (data) => {
  // return the first result, i,e first rdf triple that matches the query.
  // using this for the very first time the attribute framing is added (the page is loaded).
  const response = await searchPredicates(data);

  const { results } = response;
  return results[0];
};

export const getLabelofParentClass = async (uri) => {
  // return the label of the parent class of the given uri
  const response = await fetch(`${SSSOM_MAPPER_API_URL}/search/?query=${uri}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json"
    }
  });
  const responseData = await response.json();
  return responseData;
};

export const generateOCAFileFromMergedOverlays = (coreOverlays) => {
  const attributes = Object.keys(coreOverlays.capture_base.attributes);
  const attributeTypeMap = coreOverlays.capture_base.attributes;
  let fileContent = "# Add attributes (capture base) \n";
  fileContent += "ADD ATTRIBUTE";

  attributes.forEach((attribute) => {
    const attributeType = Array.isArray(attributeTypeMap[attribute])
      ? `Array[${attributeTypeMap[attribute][0]}]`
      : attributeTypeMap[attribute];
    fileContent += ` ${attribute}=${attributeType}`;
  });

  fileContent += "\n";

  // Classification
  fileContent += "# Add classification\n";
  if (coreOverlays.capture_base.classification) {
    fileContent += `ADD CLASSIFICATION ${coreOverlays.capture_base.classification}`;
    fileContent += "\n";
  }

  // Meta overlay
  fileContent += "# Add meta overlay";
  coreOverlays.meta.forEach((item) => {
    fileContent += `\nADD META ${alpha3CodesToTwoLetterCodes[item.language]} PROPS name="${item.name}" description="${item.description}"`;
  });
  fileContent += "\n";

  // Format overlay
  fileContent += "# Add format overlay\n";
  if (coreOverlays.format) {
    fileContent += "ADD FORMAT ATTRS";
    Object.keys(coreOverlays.format.attribute_formats).forEach((attribute) => {
      fileContent += ` ${attribute}="${coreOverlays.format.attribute_formats[attribute]}"`;
    });
    fileContent += "\n";
  }

  // Conformance overlay
  fileContent += "# Add conformance overlay\n";
  if (coreOverlays.conformance) {
    fileContent += "ADD CONFORMANCE ATTRS";
    Object.keys(coreOverlays.conformance.attribute_conformance).forEach((attribute) => {
      fileContent += ` ${attribute}="${coreOverlays.conformance.attribute_conformance[attribute]}"`;
    });
    fileContent += "\n";
  }

  // Label overlay
  fileContent += "# Add label overlay";
  if (coreOverlays.label) {
    coreOverlays.label.forEach((item) => {
      fileContent += `\nADD LABEL ${alpha3CodesToTwoLetterCodes[item.language]} ATTRS`;
      Object.keys(item.attribute_labels).forEach((attribute) => {
        fileContent += ` ${attribute}="${item.attribute_labels[attribute]}"`;
      });
    });
  }
  fileContent += "\n";

  // Information overlay
  fileContent += "# Add information overlay";
  if (coreOverlays.information) {
    coreOverlays.information.forEach((item) => {
      fileContent += `\nADD INFORMATION ${alpha3CodesToTwoLetterCodes[item.language]} ATTRS`;
      Object.keys(item.attribute_information).forEach((attribute) => {
        fileContent += ` ${attribute}="${item.attribute_information[attribute]}"`;
      });
    });
  }
  fileContent += "\n";

  // Entry code and entry overlay
  fileContent += "# Add entry code overlay\n";
  if (coreOverlays.entry_code) {
    fileContent += "ADD ENTRY_CODE ATTRS";
    const entryCodes = coreOverlays.entry_code.attribute_entry_codes;
    Object.keys(entryCodes).forEach((attribute) => {
      const codesInQuotes = entryCodes[attribute].map((code) => `"${code}"`);
      fileContent += ` ${attribute}=[${codesInQuotes.join(", ")}]`;
    });
    fileContent += "\n";

    if (coreOverlays.entry) {
      coreOverlays.entry.forEach((item) => {
        fileContent += `ADD ENTRY ${alpha3CodesToTwoLetterCodes[item.language]} ATTRS`;
        Object.keys(item.attribute_entries).forEach((attribute) => {
          const entries = item.attribute_entries[attribute];
          const entriesText = Object.keys(entries)
            .map((code) => `"${code}": "${entries[code]}"`)
            .join(", ");
          fileContent += ` ${attribute}={${entriesText}}`;
        });
        fileContent += "\n";
      });
    }
  }

  // Cardinality overlay
  fileContent += "# Add cardinality overlay\n";
  if (coreOverlays.cardinality) {
    fileContent += "ADD CARDINALITY ATTRS";
    Object.keys(coreOverlays.cardinality.attribute_cardinality).forEach((attribute) => {
      fileContent += ` ${attribute}="${coreOverlays.cardinality.attribute_cardinality[attribute]}"`;
    });
    fileContent += "\n";
  }

  // Unit overlay
  fileContent += "# Add units overlay\n";
  if (coreOverlays.unit) {
    fileContent += "ADD UNIT ATTRS";
    Object.keys(coreOverlays.unit.attribute_unit).forEach((attribute) => {
      fileContent += ` ${attribute}="${coreOverlays.unit.attribute_unit[attribute]}"`;
    });
    fileContent += "\n";
  }

  // Character encoding overlay
  fileContent += "# Add character encoding overlay\n";
  if (coreOverlays.character_encoding) {
    fileContent += "ADD CHARACTER_ENCODING ATTRS";
    Object.keys(coreOverlays.character_encoding.attribute_character_encoding).forEach(
      (attribute) => {
        fileContent += ` ${attribute}="${coreOverlays.character_encoding.attribute_character_encoding[attribute]}"`;
      }
    );
    fileContent += "\n";
  }

  return fileContent;
};

export const downloadJsonFile = (data, fileName) => {
  const blob = new Blob([JSON.stringify(data)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");

  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export const getFormatRuleDescription = (attributeType, formatRule) =>
  attributeType.includes("Date")
    ? formatCodeDateDescription[formatRule]
    : attributeType.includes("Numeric")
      ? formatCodeNumericDescription[formatRule]
      : attributeType.includes("Binary")
        ? formatCodeBinaryDescription[formatRule]
        : attributeType.includes("Text")
          ? formatCodeTextDescription[formatRule]
          : "";

export const shouldDisableRangeOverlay = (
  overlayText,
  selectedFeatures,
  attributes,
  rangeRowData
) => {
  const hasValidAttribute = attributes.some(
    (attribute) => attribute.Type === "Numeric" || attribute.Type === "DateTime"
  );
  return (
    overlayText === "Add range rule for data" &&
    (rangeRowData.length === 0 ||
      !selectedFeatures.includes(FIELD_FORMAT_OVERLAY) ||
      !hasValidAttribute)
  );
};

export const toMegabytes = (bytes) => (bytes / (1024 * 1024)).toFixed();
export const isValidNumber = (value) => !Number.isNaN(Number.parseFloat(value));

export const parseDateString = (str) => {
  let result;
  // Custom parser is needed for non ISO 8601 formats
  const customParser = customDateFormatParsers.find((parser) => parser.regex.test(str));

  if (customParser) {
    result = customParser.parse(str);
  } else if (str.startsWith("P")) {
    result = Duration.fromISO(str);
  } else {
    result = DateTime.fromISO(str);
  }

  if (result.isValid) return result;
  return null;
};

export const isMultiLevelSchema = (attributeTypeMap) => {
  const types = Object.values(attributeTypeMap);
  if (types.length === 0) return false;
  return types.some((type) =>
    Array.isArray(type) ? type[0].includes("ref") : type.includes("ref")
  );
};
