import i18next from "i18next";
import Fuse from "fuse.js";
import { DateTime, Duration } from "luxon";
import {
  langCodeOCAFromName,
  langNameFromTwoLetters,
  langTwoLettersFromCodeOCA
} from "./languageUtils";
import {
  ADC,
  CUSTOM_FORMAT_RULE,
  customDateFormatParsers,
  DEFAULT_LANGUAGE,
  FIELD_CARDINALITY_OVERLAY,
  FIELD_FORMAT_OVERLAY,
  FIELD_FORM_INFORMATION_OVERLAY,
  FIELD_RANGE_OVERLAY,
  isFormatEligibleAttributeType,
  isRangeEligibleAttributeType,
  formatCodeBinaryDescription,
  formatCodeDateDescription,
  formatCodeNumericDescription,
  formatCodeTextDescription,
  OCA_REPOSITORY_API_URL,
  RANGE,
  SSSOM_MAPPER_API_URL
} from "../constants/constants";

import {
  buildFormOverlayInteraction,
  convertToFormInformationOverlay
} from "../Overlays/FormBuilder/utils/convertToFormInformation";
import ucumUnits from "../constants/ucumUnits";
import { getRootCaptureBaseId } from "./packageUtils";

export const translateDataType = (type, t = null) => {
  if (!type || !t) return type;

  const typeMap = {
    Text: t("Text"),
    Numeric: t("Numeric"),
    Boolean: t("Boolean"),
    Binary: t("Binary"),
    Binaryfile: t("Binaryfile"),
    DateTime: t("DateTime"),
    "Array[Text]": t("Array[Text]"),
    "Array[Numeric]": t("Array[Numeric]"),
    "Array[Boolean]": t("Array[Boolean]"),
    "Array[Binary]": t("Array[Binary]"),
    "Array[Binaryfile]": t("Array[Binaryfile]"),
    "Array[DateTime]": t("Array[DateTime]"),
    "Child Schema": t("Child Schema"),
    "Placeholder Child Schema": t("Placeholder Child Schema")
  };

  return typeMap[type] || type;
};

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

// this function is used to pretty print the delimiter value in the markdown table or excel sheet
export const prettyPrintDelimiter = (value) => {
  if (value === "\t") return "\\t (tab)";
  if (value === ",") return ", (comma)";
  if (value === ";") return "; (semicolon)";
  if (value === "|") return "\\| (pipe)";
  return value;
};

/**
 * Generate a descriptive filename with optional schema name prefix
 * @param {string|Object} schemaNameOrDescription - Either a string name or legacy schemaDescription object
 * @param {string} commonFileName - Base filename (e.g., "README_OCA_schema.txt")
 * @returns {string} Filename with schema name prefix if available
 */
export const getDescriptiveFileName = (schemaNameOrDescription, commonFileName) => {
  let schemaName = null;

  // Handle string input (new format)
  if (typeof schemaNameOrDescription === "string") {
    schemaName = schemaNameOrDescription;
  }
  // Handle legacy schemaDescription object format
  else if (schemaNameOrDescription && typeof schemaNameOrDescription === "object") {
    const currentLanguage = langNameFromTwoLetters(i18next.language) || DEFAULT_LANGUAGE;
    schemaName = schemaNameOrDescription[currentLanguage]?.name;
  }

  const fileName = `${schemaName ? `${schemaName.split(" ")[0]}_` : ""}${commonFileName}`;
  return fileName;
};

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
  const captureBaseSaid = getRootCaptureBaseId(OCAPackage);
  return Boolean(
    Object.keys(OCAPackage?.extensions || {}).length > 0 &&
      OCAPackage.extensions?.[ADC]?.[captureBaseSaid]?.overlays?.ordering
        ?.entry_code_ordering
  );
};

export const hasAttributeOrdering = (OCAPackage) => {
  // For now, use the capture base SAID of the main/top-level bundle
  const captureBaseSaid = getRootCaptureBaseId(OCAPackage);
  return Boolean(
    Object.keys(OCAPackage?.extensions || {}).length > 0 &&
      OCAPackage.extensions?.[ADC]?.[captureBaseSaid]?.overlays?.ordering
        ?.attribute_ordering
  );
};

export const hasUnitFramingOverlay = (OCAPackage) => {
  // For now, use the capture base SAID of the main/top-level bundle
  const captureBaseSaid = getRootCaptureBaseId(OCAPackage);
  return Boolean(
    Object.keys(OCAPackage?.extensions || {}).length > 0 &&
      OCAPackage.extensions?.[ADC]?.[captureBaseSaid]?.overlays?.unit_framing
  );
};

export const hasAttributeFramingOverlay = (OCAPackage) => {
  // For now, use the capture base SAID of the main/top-level bundle
  const captureBaseSaid = getRootCaptureBaseId(OCAPackage);
  return Boolean(
    Object.keys(OCAPackage?.extensions || {}).length > 0 &&
      OCAPackage.extensions?.[ADC]?.[captureBaseSaid]?.overlays?.attribute_framing
  );
};

export const hasRangeOverlay = (OCAPackage) => {
  // For now, use the capture base SAID of the main/top-level bundle
  const captureBaseSaid = getRootCaptureBaseId(OCAPackage);
  return Boolean(
    Object.keys(OCAPackage?.extensions || {}).length > 0 &&
      OCAPackage.extensions?.[ADC]?.[captureBaseSaid]?.overlays?.[RANGE]
  );
};

export const getExtensionOverlays = (OCAPackage) => {
  // For now, use the capture base SAID of the main/top-level bundle
  const captureBaseSaid = getRootCaptureBaseId(OCAPackage);
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
  const captureBaseSaid = getRootCaptureBaseId(OCAPackage);

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
  const captureBaseSaid = getRootCaptureBaseId(OCAPackage);

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

export const getAttributeFramingInput = (
  attributeFramingRowData,
  attributesList = null
) => {
  const attributeFramingInput = {};
  // Create a Set of valid attributes if provided for O(1) lookup
  const validAttributes = attributesList ? new Set(attributesList) : null;

  for (const row of attributeFramingRowData) {
    if (!row.objectId) continue;

    // Skip if attribute doesn't exist in the schema
    if (validAttributes && !validAttributes.has(row.Attribute)) continue;

    attributeFramingInput[row.Attribute] = {
      description: row.description,
      framing_justification: row.mappingJustification,
      predicate_id: row.predicateId,
      term_id: row.objectId
    };
  }
  return attributeFramingInput;
};

export const getRangeOverlayInput = (
  rangeRowData,
  formatRuleRowData,
  attributesList = null
) => {
  const rangeOverlayInput = {};
  // Create a Set of valid attributes if provided for O(1) lookup
  const validAttributes = attributesList ? new Set(attributesList) : null;

  rangeRowData.forEach((row) => {
    if (row.LowerBound === "" && row.UpperBound === "") return;

    // Skip if attribute doesn't exist in the schema
    if (validAttributes && !validAttributes.has(row.Attribute)) return;

    const attributeFormatData = formatRuleRowData.find(
      (item) => item.Attribute === row.Attribute
    );
    if (
      !attributeFormatData?.FormatText &&
      !attributeFormatData?.[CUSTOM_FORMAT_RULE] &&
      !attributeFormatData?.["Format Rule"]
    )
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

export const getFormInformationInput = (
  formBuilderPages,
  languages,
  schemaDescription,
  captureBase
) => {
  const threeLetterCodes = languages.map((lang) => langCodeOCAFromName(lang));

  const schemaName = {};
  languages.forEach((lang, index) => {
    const threeLetterCode = threeLetterCodes[index];
    schemaName[threeLetterCode] = schemaDescription[lang]?.name || "";
  });

  const baseFormInfo = convertToFormInformationOverlay(
    formBuilderPages,
    languages,
    schemaName
  );

  const formOverlays = threeLetterCodes.map((langCode, langIndex) => ({
    language: langCode,
    capture_base: captureBase,
    pages: baseFormInfo.pages,
    page_order: baseFormInfo.page_order,
    page_labels: baseFormInfo.page_labels,
    sidebar_label: baseFormInfo.sidebar_label,
    description: baseFormInfo.description,
    title: baseFormInfo.title,
    interaction: buildFormOverlayInteraction(formBuilderPages, languages, langIndex)
  }));

  return formOverlays;
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

const postOCADslForValidation = async (dslText) => {
  try {
    const response = await fetch(`${OCA_REPOSITORY_API_URL}/oca-bundles`, {
      method: "POST",
      headers: {
        "Content-Type": "text/plain"
      },
      body: dslText
    });

    const responseContentType = response.headers.get("content-type") || "";
    const rawText = await response.text();

    let responseData = null;
    let parseError = null;
    try {
      responseData = rawText ? JSON.parse(rawText) : {};
    } catch (e) {
      parseError = String(e);
      responseData = { parseError, rawTextPreview: String(rawText || "").slice(0, 200) };
    }

    const isHtmlResponse = /^\s*</.test(rawText || "");
    const transportIssue =
      response.status >= 500 ||
      parseError !== null ||
      isHtmlResponse ||
      (!responseContentType.toLowerCase().includes("application/json") && !response.ok);

    const failed =
      !response.ok ||
      responseData?.success === false ||
      (Array.isArray(responseData?.errors) && responseData.errors.length > 0) ||
      (responseData?.errors && !Array.isArray(responseData.errors));

    return {
      ok: transportIssue ? null : !failed,
      transportIssue,
      status: response.status,
      statusText: response.statusText,
      responseData
    };
  } catch (error) {
    return {
      ok: null,
      transportIssue: true,
      status: 0,
      statusText: "network_error",
      responseData: { error: String(error) }
    };
  }
};

const splitTopLevelTokens = (text) => {
  const tokens = [];
  let current = "";
  let inQuotes = false;
  let escaped = false;
  let braceDepth = 0;
  let bracketDepth = 0;

  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];

    if (escaped) {
      current += ch;
      escaped = false;
      continue;
    }

    if (ch === "\\") {
      current += ch;
      escaped = true;
      continue;
    }

    if (ch === '"') {
      inQuotes = !inQuotes;
      current += ch;
      continue;
    }

    if (!inQuotes) {
      if (ch === "{") braceDepth += 1;
      if (ch === "}") braceDepth = Math.max(0, braceDepth - 1);
      if (ch === "[") bracketDepth += 1;
      if (ch === "]") bracketDepth = Math.max(0, bracketDepth - 1);

      if (ch === " " && braceDepth === 0 && bracketDepth === 0) {
        if (current.trim()) tokens.push(current.trim());
        current = "";
        continue;
      }
    }

    current += ch;
  }

  if (current.trim()) tokens.push(current.trim());
  return tokens;
};

const isolateOCADslFailure = async (dslText) => {
  const lines = String(dslText || "").split(/\r?\n/);
  const debugLimit = 120;
  let calls = 0;
  const unstableEvents = [];

  const validate = async (content) => {
    if (calls >= debugLimit) {
      return {
        ok: null,
        transportIssue: true,
        status: 0,
        statusText: "debug_limit_reached",
        responseData: { errors: ["debug_limit_reached"] }
      };
    }

    let latest = null;
    for (let attempt = 0; attempt < 3; attempt += 1) {
      calls += 1;
      latest = await postOCADslForValidation(content);
      if (!latest.transportIssue) return latest;
      if (calls >= debugLimit) break;
    }

    return latest || {
      ok: null,
      transportIssue: true,
      status: 0,
      statusText: "unknown_transport_error",
      responseData: { errors: ["unknown_transport_error"] }
    };
  };

  let failingLineIndex = -1;
  let failingResponse = null;

  for (let i = 0; i < lines.length; i += 1) {
    const candidate = lines.slice(0, i + 1).join("\n");
    const result = await validate(candidate);
    if (result.transportIssue) {
      unstableEvents.push({ lineNumber: i + 1, status: result.status, statusText: result.statusText });
      continue;
    }
    if (result.ok === false) {
      failingLineIndex = i;
      failingResponse = result;
      break;
    }
  }

  if (failingLineIndex < 0) {
    return {
      calls,
      unstable: unstableEvents.length > 0,
      unstableEvents: unstableEvents.slice(0, 10),
      message:
        unstableEvents.length > 0
          ? "No deterministic failing line isolated because API debug probes were unstable (5xx/non-JSON)."
          : "No failing line isolated (full DSL may depend on context not reproduced incrementally)."
    };
  }

  const failingLine = lines[failingLineIndex] || "";
  const lineResult = {
    lineNumber: failingLineIndex + 1,
    line: failingLine,
    apiError: failingResponse?.responseData
  };

  const attrsMarker = " ATTRS";
  const attrsIdx = failingLine.indexOf(attrsMarker);
  if (attrsIdx < 0) {
    return {
      calls,
      failingLine: lineResult,
      tokenAnalysis: { message: "Line has no ATTRS segment; token analysis skipped." }
    };
  }

  const linePrefix = failingLine.slice(0, attrsIdx + attrsMarker.length).trim();
  const tokenText = failingLine.slice(attrsIdx + attrsMarker.length).trim();
  const tokens = splitTopLevelTokens(tokenText);

  if (tokens.length === 0) {
    return {
      calls,
      failingLine: lineResult,
      tokenAnalysis: { message: "No tokens after ATTRS." }
    };
  }

  const beforeLines = lines.slice(0, failingLineIndex);
  const singleTokenFailures = [];

  for (let i = 0; i < tokens.length; i += 1) {
    const tokenCandidate = [...beforeLines, `${linePrefix} ${tokens[i]}`].join("\n");
    const tokenResult = await validate(tokenCandidate);
    if (tokenResult.transportIssue) {
      unstableEvents.push({
        lineNumber: failingLineIndex + 1,
        tokenIndex: i,
        status: tokenResult.status,
        statusText: tokenResult.statusText
      });
      continue;
    }
    if (tokenResult.ok === false) {
      singleTokenFailures.push({
        tokenIndex: i,
        token: tokens[i],
        apiError: tokenResult.responseData
      });
    }
  }

  let firstFailingPrefix = null;
  for (let i = 0; i < tokens.length; i += 1) {
    const prefixTokens = tokens.slice(0, i + 1).join(" ");
    const prefixCandidate = [...beforeLines, `${linePrefix} ${prefixTokens}`].join("\n");
    const prefixResult = await validate(prefixCandidate);
    if (prefixResult.transportIssue) {
      unstableEvents.push({
        lineNumber: failingLineIndex + 1,
        tokenIndex: i,
        status: prefixResult.status,
        statusText: prefixResult.statusText
      });
      continue;
    }
    if (prefixResult.ok === false) {
      firstFailingPrefix = {
        tokenIndex: i,
        token: tokens[i],
        apiError: prefixResult.responseData
      };
      break;
    }
  }

  return {
    calls,
    unstable: unstableEvents.length > 0,
    unstableEvents: unstableEvents.slice(0, 10),
    failingLine: lineResult,
    tokenAnalysis: {
      tokenCount: tokens.length,
      singleTokenFailures,
      firstFailingPrefix
    }
  };
};

const validateDslWithRetry = async (dslText, attempts = 2) => {
  let latest = null;
  for (let i = 0; i < attempts; i += 1) {
    latest = await postOCADslForValidation(dslText);
    if (!latest.transportIssue) break;
  }
  return latest;
};

const runDifferentialDslChecks = async (dslText) => {
  const lines = String(dslText || "").split(/\r?\n/);
  const hasEntry = lines.some((l) => l.startsWith("ADD ENTRY "));
  const hasEntryCode = lines.some((l) => l.startsWith("ADD ENTRY_CODE "));
  const hasLabel = lines.some((l) => l.startsWith("ADD Label "));

  const variants = [
    {
      id: "without_entry",
      enabled: hasEntry,
      text: lines.filter((l) => !l.startsWith("ADD ENTRY ")).join("\n")
    },
    {
      id: "without_entry_code",
      enabled: hasEntryCode,
      text: lines.filter((l) => !l.startsWith("ADD ENTRY_CODE ")).join("\n")
    },
    {
      id: "without_entry_and_entry_code",
      enabled: hasEntry || hasEntryCode,
      text: lines
        .filter((l) => !l.startsWith("ADD ENTRY ") && !l.startsWith("ADD ENTRY_CODE "))
        .join("\n")
    },
    {
      id: "without_label",
      enabled: hasLabel,
      text: lines.filter((l) => !l.startsWith("ADD Label ")).join("\n")
    }
  ].filter((v) => v.enabled);

  const results = [];
  for (const variant of variants) {
    const response = await validateDslWithRetry(variant.text, 2);
    results.push({
      id: variant.id,
      ok: response?.ok,
      transportIssue: response?.transportIssue,
      status: response?.status,
      statusText: response?.statusText,
      errors: response?.responseData?.errors || null
    });
  }

  return results;
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

    const responseData = await response.json();

    // Check for API-level errors (even with 200 status)
    if (responseData.success === false || responseData.errors) {
      // eslint-disable-next-line no-console
      console.error("API returned error response:", responseData);
      let isolationSummary = "";
      // Log the submitted DSL so we can inspect why the parser rejected it
      try {
        // eslint-disable-next-line no-console
        console.error("Submitted OCA DSL:", OCAFileData);

        const serializedErrors = JSON.stringify(responseData?.errors || "");
        if (serializedErrors.includes("key is empty")) {
          const isolation = await isolateOCADslFailure(OCAFileData);
          const differential = await runDifferentialDslChecks(OCAFileData);
          const isDeterministic = !isolation?.unstable && Boolean(isolation?.failingLine?.lineNumber);
          const failLine = isolation?.failingLine?.lineNumber;
          const failToken =
            isolation?.tokenAnalysis?.firstFailingPrefix?.token ||
            isolation?.tokenAnalysis?.singleTokenFailures?.[0]?.token;
          if (isDeterministic) {
            isolationSummary = ` [isolation: line ${failLine}${failToken ? `, token ${failToken}` : ""}]`;
          } else if (isolation?.unstable) {
            isolationSummary = " [isolation: API unstable during debug probes]";
          }
          // eslint-disable-next-line no-console
          console.error("Systematic OCA DSL failure isolation:", isolation);
          // eslint-disable-next-line no-console
          console.error("Differential DSL checks:", differential);
        }
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error("Failed to log submitted DSL:", e);
      }

      // Properly serialize errors - handle arrays of strings, arrays of objects, or single objects
      let errorMessages = "Unknown error";
      if (responseData.errors) {
        if (Array.isArray(responseData.errors)) {
          errorMessages = responseData.errors
            .map((e) => (typeof e === "object" ? JSON.stringify(e) : String(e)))
            .join(", ");
        } else if (typeof responseData.errors === "object") {
          errorMessages = JSON.stringify(responseData.errors);
        } else {
          errorMessages = String(responseData.errors);
        }
      }
      throw new Error(
        `OCA Bundle generation failed: ${errorMessages}${isolationSummary} (see console for submitted DSL)`
      );
    }

    if (!response.ok) {
      // eslint-disable-next-line no-console
      console.error("API returned error status:", response.status, responseData);
      throw new Error(
        `Failed to generate OCA bundle: ${response.statusText} - ${JSON.stringify(responseData)}`
      );
    }

    const { said } = responseData;

    if (!said) {
      // eslint-disable-next-line no-console
      console.error("No SAID in response:", responseData);
      throw new Error("API response missing SAID field");
    }

    const bundle = await fetchOCABundle(said);

    return bundle;
  } catch (error) {
    // eslint-disable-next-line no-console
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

export const normalizeEscapedQuotes = (s) =>
  typeof s === "string" ? s.replace(/\\"/g, "\"").replace(/\\'/g, "'") : s;

export const escapeForOCAString = (s) => {
  if (typeof s !== "string") return s;
  // First escape backslashes, then escape double quotes, single quotes, and dashes for OCA output
  return String(s)
    .replace(/\\/g, "\\\\")
    .replace(/"/g, "\\\"")
    .replace(/'/g, "\\'")
    .replace(/-/g, "\\-");
};

export const generateOCAFileFromMergedOverlays = (coreOverlays) => {
  const attributes = Object.keys(coreOverlays.capture_base.attributes);
  const attributeTypeMap = coreOverlays.capture_base.attributes;
  let fileContent = "# Add attributes (capture base)\n";

  if (attributes.length > 0) {
    fileContent += "ADD ATTRIBUTE";

    attributes.forEach((attribute) => {
      const attributeType = Array.isArray(attributeTypeMap[attribute])
        ? `Array[${attributeTypeMap[attribute][0]}]`
        : attributeTypeMap[attribute];
      fileContent += ` ${attribute}=${attributeType}`;
    });

    fileContent += "\n";
  } else {
    fileContent += "# (no attributes present - skipped ADD ATTRIBUTE)\n";
  }

  // Classification
  fileContent += "# Add classification\n";
  if (coreOverlays.capture_base.classification) {
    fileContent += `ADD classification ${coreOverlays.capture_base.classification}`;
    fileContent += "\n";
  }

  // Meta overlay
  fileContent += "# Add meta overlay";
  coreOverlays.meta.forEach((item) => {
    // Emit 2-letter language code for DSL (parser expects UI-style codes here)
    const twoLetterLang = langTwoLettersFromCodeOCA(item.language || "") || item.language;

    // Escape quotes in name and description
    const escapedName = escapeForOCAString(normalizeEscapedQuotes(item.name || ""));
    const escapedDesc = escapeForOCAString(
      normalizeEscapedQuotes(item.description || "")
    );
    fileContent += `\nADD Meta ${twoLetterLang} PROPS name="${escapedName}" description="${escapedDesc}"`;
  });
  fileContent += "\n";

  // Format overlay
  fileContent += "# Add format overlay\n";
  if (coreOverlays.format) {
    const formatEntries = Object.entries(
      coreOverlays.format.attribute_formats || {}
    ).filter(([attr, rule]) => attributes.includes(attr) && rule);
    if (formatEntries.length > 0) {
      fileContent += "ADD Format ATTRS";
      formatEntries.forEach(([attribute, formatRule]) => {
        // Normalize and escape quotes to prevent double-escaping issues
        const escapedRule = escapeForOCAString(normalizeEscapedQuotes(formatRule));
        fileContent += ` ${attribute}="${escapedRule}"`;
      });
      fileContent += "\n";
    }
  }

  // Conformance overlay
  fileContent += "# Add conformance overlay\n";
  if (coreOverlays.conformance) {
    const confEntries = Object.entries(
      coreOverlays.conformance.attribute_conformance || {}
    ).filter(([attr]) => attributes.includes(attr));
    if (confEntries.length > 0) {
      fileContent += "ADD CONFORMANCE ATTRS";
      confEntries.forEach(([attribute, val]) => {
        fileContent += ` ${attribute}="${val}"`;
      });
      fileContent += "\n";
    }
  }

  // Label overlay
  fileContent += "# Add label overlay";
  if (coreOverlays.label) {
    coreOverlays.label.forEach((item) => {
      const labels = Object.entries(item.attribute_labels || {}).filter(([attr]) =>
        attributes.includes(attr)
      );
      if (labels.length > 0) {
        const twoLetterLang =
          langTwoLettersFromCodeOCA(item.language || "") || item.language;
        fileContent += `\nADD Label ${twoLetterLang} ATTRS`;
        labels.forEach(([attribute, labelVal]) => {
          // Escape quotes in labels
          const escapedLabel = escapeForOCAString(normalizeEscapedQuotes(labelVal || ""));
          fileContent += ` ${attribute}="${escapedLabel}"`;
        });
      }
    });
  }
  fileContent += "\n";

  // Information overlay
  fileContent += "# Add information overlay";
  if (coreOverlays.information) {
    coreOverlays.information.forEach((item) => {
      const infos = Object.entries(item.attribute_information || {}).filter(([attr]) =>
        attributes.includes(attr)
      );
      if (infos.length > 0) {
        const twoLetterLang =
          langTwoLettersFromCodeOCA(item.language || "") || item.language;
        fileContent += `\nADD Information ${twoLetterLang} ATTRS`;
        infos.forEach(([attribute, infoVal]) => {
          // Escape quotes in information/descriptions
          const escapedInfo = escapeForOCAString(normalizeEscapedQuotes(infoVal || ""));
          fileContent += ` ${attribute}="${escapedInfo}"`;
        });
      }
    });
  }
  fileContent += "\n";

  // Entry code and entry overlay
  fileContent += "# Add entry code overlay\n";
  if (coreOverlays.entry_code) {
    const entryCodes = coreOverlays.entry_code.attribute_entry_codes || {};
    const filteredEntryCodes = Object.entries(entryCodes).filter(([attr]) =>
      attributes.includes(attr)
    );
    if (filteredEntryCodes.length > 0) {
      fileContent += "ADD ENTRY_CODE ATTRS";
      filteredEntryCodes.forEach(([attribute, codes]) => {
        const codesInQuotes = (codes || []).map(
          (code) => `"${escapeForOCAEntryToken(String(code ?? ""))}"`
        );
        fileContent += ` ${attribute}=[${codesInQuotes.join(", ")}]`;
      });
      fileContent += "\n";
    }

    if (coreOverlays.entry) {
      coreOverlays.entry.forEach((item) => {
        const entriesForAttrs = Object.entries(item.attribute_entries || {}).filter(
          ([attr]) => attributes.includes(attr)
        );
        if (entriesForAttrs.length > 0) {
          const twoLetterLang =
            langTwoLettersFromCodeOCA(item.language || "") || item.language;
          fileContent += `ADD ENTRY ${twoLetterLang} ATTRS`;
          entriesForAttrs.forEach(([attribute, entries]) => {
            const entriesText = Object.keys(entries)
              .map(
                (code) =>
                  `"${escapeForOCAEntryToken(String(code ?? ""))}": "${escapeForOCAEntryToken(
                    normalizeEscapedQuotes(String(entries[code] ?? ""))
                  )}"`
              )
              .join(", ");
            fileContent += ` ${attribute}={${entriesText}}`;
          });
          fileContent += "\n";
        }
      });
    }
  }

  // Cardinality overlay
  fileContent += "# Add cardinality overlay\n";
  if (coreOverlays.cardinality) {
    const cardinalityEntries = Object.entries(
      coreOverlays.cardinality.attribute_cardinality || {}
    ).filter(([attr]) => attributes.includes(attr));
    if (cardinalityEntries.length > 0) {
      fileContent += "ADD CARDINALITY ATTRS";
      cardinalityEntries.forEach(([attribute, val]) => {
        fileContent += ` ${attribute}="${val}"`;
      });
      fileContent += "\n";
    }
  }

  // Unit overlay
  fileContent += "# Add units overlay\n";
  if (coreOverlays.unit) {
    const unitEntries = Object.entries(coreOverlays.unit.attribute_unit || {}).filter(
      ([attr]) => attributes.includes(attr)
    );
    if (unitEntries.length > 0) {
      fileContent += "ADD Unit ATTRS";
      unitEntries.forEach(([attribute, val]) => {
        fileContent += ` ${attribute}="${val}"`;
      });
      fileContent += "\n";
    }
  }

  // Character encoding overlay
  fileContent += "# Add character encoding overlay\n";
  if (coreOverlays.character_encoding) {
    const charEncEntries = Object.entries(
      coreOverlays.character_encoding.attribute_character_encoding || {}
    ).filter(([attr]) => attributes.includes(attr));
    if (charEncEntries.length > 0) {
      fileContent += "ADD CHARACTER_ENCODING ATTRS";
      charEncEntries.forEach(([attribute, val]) => {
        fileContent += ` ${attribute}="${val}"`;
      });
      fileContent += "\n";
    }
  }

  return fileContent;
};

export const downloadJsonFile = (data, fileName) => {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");

  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export const escapeForOCADoubleQuotedValue = (s) => {
  if (typeof s !== "string") return s;
    return String(s).replace(/\\/g, "\\\\").replace(/"/g, "\\\"");
};

export const escapeForOCAEntryToken = (s) => {
  if (typeof s !== "string") return s;
  return escapeForOCADoubleQuotedValue(s).replace(/,/g, "\\,");
};

export const getFormatRuleDescription = (attributeType, formatRule, t = null) => {
  const normalizedRule = normalizeEscapedQuotes(formatRule);

  const description = attributeType.includes("Date")
    ? formatCodeDateDescription[normalizedRule]
    : attributeType.includes("Numeric")
      ? formatCodeNumericDescription[normalizedRule]
      : attributeType.includes("Binary")
        ? formatCodeBinaryDescription[normalizedRule]
        : attributeType.includes("Text")
          ? formatCodeTextDescription[normalizedRule]
          : "";

  if (description && t) {
    return t(description, { defaultValue: description });
  }
  return description;
};

export const shouldDisableRangeOverlay = (
  overlayKey,
  selectedKeys,
  attributes,
  rangeRowData,
  formatRuleData = []
) => {
  if (overlayKey !== FIELD_RANGE_OVERLAY) return false;

  // Check if there are any Numeric/DateTime attributes with format rules
  // Need to match formatRuleData against attributes to get Type info
  const hasAttributesWithFormatRules = formatRuleData.some((rule) => {
    if (!rule["Format Rule"] && !rule[CUSTOM_FORMAT_RULE]) return false;

    // Find the corresponding attribute to get its Type
    const attribute = attributes.find((attr) => attr.Attribute === rule.Attribute);
    return attribute && isRangeEligibleAttributeType(attribute.Type);
  });

  return !hasAttributesWithFormatRules || !selectedKeys.includes(FIELD_FORMAT_OVERLAY);
};

export const shouldDisableFormInformationOverlay = (overlayKey, selectedKeys) =>
  overlayKey === FIELD_FORM_INFORMATION_OVERLAY &&
  !selectedKeys.includes(FIELD_FORMAT_OVERLAY);

export const shouldDisableCardinalityOverlay = (overlayKey, attributes) => {
  if (overlayKey !== FIELD_CARDINALITY_OVERLAY) return false;
  return !attributes.some((attr) => attr?.Type && String(attr.Type).includes("Array"));
};

export const getCardinalityOverlayDisabledReason = (overlayKey, attributes) => {
  if (overlayKey !== FIELD_CARDINALITY_OVERLAY) return "";
  if (!shouldDisableCardinalityOverlay(overlayKey, attributes)) return "";
  return i18next.t(
    "Entry limits can only be created for attributes with an array datatype"
  );
};

export const getRangeOverlayDisabledReason = (
  overlayKey,
  selectedKeys,
  attributes,
  rangeRowData,
  formatRuleData = []
) => {
  if (overlayKey !== FIELD_RANGE_OVERLAY) return "";

  if (!selectedKeys.includes(FIELD_FORMAT_OVERLAY)) {
    return i18next.t("Range overlay requires 'Formats' to be added first.");
  }

  // Check if there are any Numeric/DateTime attributes
  const hasNumericOrDateTimeAttributes = attributes.some(
    (attribute) => attribute.Type === "Numeric" || attribute.Type === "DateTime"
  );

  if (!hasNumericOrDateTimeAttributes) {
    return i18next.t(
      "Range overlay requires Numeric or DateTime attributes with format rules."
    );
  }

  // Check if any Numeric/DateTime attributes have format rules
  // Need to match formatRuleData against attributes to get Type info
  const hasAttributesWithFormatRules = formatRuleData.some((rule) => {
    if (!rule["Format Rule"] && !rule[CUSTOM_FORMAT_RULE]) return false;

    // Find the corresponding attribute to get its Type
    const attribute = attributes.find((attr) => attr.Attribute === rule.Attribute);
    return attribute && isRangeEligibleAttributeType(attribute.Type);
  });

  if (!hasAttributesWithFormatRules) {
    return i18next.t(
      "A format rule must be applied to at least one numeric, date, or time attribute before a range rule can be added."
    );
  }

  return "";
};

export const getFormInformationDisabledReason = (overlayKey, selectedKeys) =>
  shouldDisableFormInformationOverlay(overlayKey, selectedKeys)
    ? i18next.t("Form Information requires 'Format' to be added first.")
    : "";

export const hasAnyAttributes = (attributes) =>
  Array.isArray(attributes) && attributes.length > 0;

export const hasFormatEligibleAttribute = (attributes) =>
  hasAnyAttributes(attributes) &&
  attributes.some((attr) => isFormatEligibleAttributeType(attr?.Type));

export const isOverlayAddDisabled = (
  overlayKey,
  selectedKeys,
  attributes,
  rangeRowData,
  formatRuleData = []
) => {
  if (!hasAnyAttributes(attributes)) return true;
  if (overlayKey === FIELD_FORMAT_OVERLAY && !hasFormatEligibleAttribute(attributes))
    return true;
  return (
    shouldDisableRangeOverlay(
      overlayKey,
      selectedKeys,
      attributes,
      rangeRowData,
      formatRuleData
    ) ||
    shouldDisableFormInformationOverlay(overlayKey, selectedKeys) ||
    shouldDisableCardinalityOverlay(overlayKey, attributes)
  );
};

/** Tooltip when the add button is disabled; no-attributes message wins over overlay-specific reasons. */
export const getOverlayAddDisabledReason = (
  overlayKey,
  selectedKeys,
  attributes,
  rangeRowData,
  formatRuleData = []
) => {
  if (!hasAnyAttributes(attributes)) {
    return i18next.t("Add at least one attribute before adding schema features.");
  }
  if (overlayKey === FIELD_FORMAT_OVERLAY && !hasFormatEligibleAttribute(attributes)) {
    return i18next.t(
      "Format requires at least one Text, Numeric, DateTime, or Binary attribute (including Array variants of those types)."
    );
  }
  return (
    getFormInformationDisabledReason(overlayKey, selectedKeys) ||
    getRangeOverlayDisabledReason(
      overlayKey,
      selectedKeys,
      attributes,
      rangeRowData,
      formatRuleData
    ) ||
    getCardinalityOverlayDisabledReason(overlayKey, attributes) ||
    ""
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
