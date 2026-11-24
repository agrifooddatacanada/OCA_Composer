/**
 * Framework-free build of a single schema's export: the OCA DSL text sent to the
 * bundle service, and the ADC extension overlays built locally from the bundle it
 * returns. Moved from src/hooks/useOCAExport.js (buildPackageFromTextDSL); React
 * context values are explicit parameters and the bundle service is injected.
 */
import { langCodeOCAFromName, langTwoLettersFromName } from "../utils/languageUtils";
import {
  getPackageBundleId,
  getRootCaptureBaseId,
  getApiGeneratedBundleDigest
} from "../package/packageUtils";
import {
  ADC,
  ORDERING,
  UNIT_FRAMING,
  UNIT_FRAME_ID,
  UNIT_FRAME_LABEL,
  UNIT_FRAME_LOCATION,
  UNIT_FRAME_VERSION,
  SENSITIVE,
  FIELD_CONFORMANCE_OVERLAY,
  FIELD_FORMAT_OVERLAY,
  FIELD_RANGE_OVERLAY,
  FIELD_CHARACTER_ENCODING_OVERLAY,
  FIELD_UNIT_FRAMING_OVERLAY,
  FIELD_ATTRIBUTE_FRAMING_OVERLAY,
  FIELD_CARDINALITY_OVERLAY,
  RANGE,
  ATTRIBUTE_FRAMING,
  ATTRIBUTE_FRAME_ID,
  ATTRIBUTE_FRAME_LABEL,
  ATTRIBUTE_FRAME_LOCATION,
  ATTRIBUTE_FRAME_VERSION,
  FIELD_FORM_INFORMATION_OVERLAY,
  FIELD_DATA_SEPARATOR_OVERLAY,
  DECIMAL_SEPARATOR,
  FILE_DELIMITER,
  ARRAY_DELIMITER,
  FIELD_EXAMPLE_OVERLAY,
  isUnitEligibleAttributeType
} from "../constants/constants";
import {
  normalizeEscapedQuotes,
  escapeForOCADoubleQuotedValue,
  escapeFormatRuleForOCA
} from "../utils/escaping";
import { getMapValueForAttributeName } from "../utils/stringUtils";
import {
  getRangeOverlayInput,
  getTransformedEntryCodes,
  getUnitFramingInput,
  getAttributeFramingInput,
  getEntryCodeFramingInput
} from "./overlayInputs";

export const buildSchemaDescriptionByLanguage = (metadata, languages, schemaId) => {
  const schemaDescription = {};
  languages.forEach((language) => {
    const langCodeOCA = langCodeOCAFromName(language);
    const localized = metadata.localized?.[langCodeOCA] || {};
    schemaDescription[language] = {
      name: localized.name || metadata.name || schemaId || "",
      description: localized.description || metadata.description || ""
    };
  });
  return schemaDescription;
};

export const buildUniqueLanguageCodes = (languages, customIsos = {}) => {
  const languagesWithCode = [];
  const allLanguageCodes = [];

  languages.forEach((language) => {
    const languageObject = {};
    languageObject.language = language;
    // Use two-letter codes because DSL parsing with three-letter codes is not reliable.
    languageObject.code =
      langTwoLettersFromName(language) || customIsos[language.toLowerCase()] || "unknown";

    if (allLanguageCodes.includes(languageObject.code)) {
      let number = 2;
      let newCode = `${languageObject.code}_${number}`;
      while (allLanguageCodes.includes(newCode)) {
        number++;
        newCode = `${languageObject.code}_${number}`;
      }
      languageObject.code = newCode;
    }

    allLanguageCodes.push(languageObject.code);
    languagesWithCode.push(languageObject);
  });

  return languagesWithCode;
};

/**
 * Derives everything the DSL and extension builders need from one schema's editor
 * state (the shape kept in MultiSchemaContext.schemaStates[schemaId]).
 *
 * @param {Object} schemaState - Editor state for the schema
 * @param {Object} options
 * @param {string} options.schemaId - Schema id, used as a fallback name
 * @param {Object} [options.defaultOverlaySelections] - Used when the state has no overlaySelections
 * @param {Object} [options.customIsos] - Custom language name -> code map
 */
export const prepareSchemaExport = (
  schemaState,
  { schemaId, defaultOverlaySelections = {}, customIsos = {} } = {}
) => {
  const metadata = schemaState?.metadata || {};

  // Extract all data for this schema
  const languages = metadata.languages || ["English"];
  const rawAttributeRows = schemaState?.attributes || [];
  const attributeIndicesKept = rawAttributeRows
    .map((attr, idx) => (attr && String(attr.Attribute ?? "").trim() !== "" ? idx : -1))
    .filter((idx) => idx >= 0);
  const attributeRowData = attributeIndicesKept.map((idx) => rawAttributeRows[idx]);
  const attributesList = attributeRowData.map((attr) => attr.Attribute);
  const lanAttributeRowData = schemaState?.lanAttributeRowData || {};
  const savedEntryCodes = schemaState?.entryCodes || {};
  const attributeFormats = schemaState?.attributeFormats || {};
  const characterEncodingRowData = schemaState?.characterEncodingData || {};
  const attributeCardinality = schemaState?.attributeCardinality || {};
  const attributeRanges = schemaState?.attributeRanges || {};
  const attributeFramingSources = schemaState?.attributeFramingSources || [];
  const entryCodeFramingSources = schemaState?.entryCodeFramingSources || {};
  const unitFramedRowData = schemaState?.unitFramedData || [];
  const decimalSeparator = schemaState?.decimalSeparator || ".";
  const fileDelimiterData = schemaState?.fileDelimiterData || {};
  const arrayDelimiterData =
    schemaState?.arrayDelimiterData &&
    typeof schemaState.arrayDelimiterData === "object" &&
    !Array.isArray(schemaState.arrayDelimiterData)
      ? schemaState.arrayDelimiterData
      : {};
  const enableDecimalSeparator = !!schemaState?.enableDecimalSeparator;
  const enableFileDelimiter = !!schemaState?.enableFileDelimiter;
  const enableArrayDelimiter = !!schemaState?.enableArrayDelimiter;
  const exampleData = schemaState?.exampleData || {};
  const overlaySelections = schemaState?.overlaySelections || defaultOverlaySelections;
  const classificationCode = metadata?.classification || null;

  // Build schema description for each language
  const schemaDescription = buildSchemaDescriptionByLanguage(
    metadata,
    languages,
    schemaId
  );

  const attributeListMap = attributeRowData.reduce((acc, attr) => {
    acc[attr.Attribute] = attr.List;
    return acc;
  }, {});

  const filteredEntryCodes = {};
  Object.entries(attributeListMap).forEach(([attribute, isList]) => {
    if (isList && savedEntryCodes[attribute]) {
      filteredEntryCodes[attribute] = savedEntryCodes[attribute];
    }
  });

  // Build data array: [0] = schema metadata, [1+] = attribute data per language
  const dataArray = [];
  const descriptionRow = languages.map((language) => ({
    Language: language,
    Name: schemaDescription[language]?.name || "",
    Description: schemaDescription[language]?.description || ""
  }));
  dataArray.push(descriptionRow);

  languages.forEach((language) => {
    const rowData = [];
    const lanRows = lanAttributeRowData[language] || [];
    attributeIndicesKept.forEach((originalIndex) => {
      const attrRow = rawAttributeRows[originalIndex];
      const lanRow = lanRows[originalIndex] || {};
      const rowObject = { Language: language, Attribute: attrRow.Attribute || "" };
      rowObject.Flagged = attrRow.Sensitive ? "Y" : "";
      rowObject.Unit = attrRow.Unit || "";
      rowObject.Type = attrRow.Type || "";

      rowObject.Label = lanRow.Label || "";
      rowObject.Description = lanRow.Description || "";
      rowObject.List = lanRow.List || "";
      rowObject.Language = language;
      rowData.push(rowObject);
    });
    dataArray.push(rowData);
  });

  const schemaMetadata = dataArray[0];
  const languagesWithCode = buildUniqueLanguageCodes(languages, customIsos);

  return {
    schemaId,
    formBuilderPages: schemaState?.formBuilderPages || [],
    metadata,
    languages,
    rawAttributeRows,
    attributeIndicesKept,
    attributeRowData,
    attributesList,
    lanAttributeRowData,
    savedEntryCodes,
    attributeFormats,
    characterEncodingRowData,
    attributeCardinality,
    attributeRanges,
    attributeFramingSources,
    entryCodeFramingSources,
    unitFramedRowData,
    decimalSeparator,
    fileDelimiterData,
    arrayDelimiterData,
    enableDecimalSeparator,
    enableFileDelimiter,
    enableArrayDelimiter,
    exampleData,
    overlaySelections,
    classificationCode,
    schemaDescription,
    attributeListMap,
    filteredEntryCodes,
    dataArray,
    schemaMetadata,
    languagesWithCode
  };
};

/**
 * Builds the OCA DSL text for a prepared schema export.
 * Throws if the DSL would contain an empty ADD ATTRIBUTE line.
 */
export const buildOcaDsl = (prepared) => {
  const {
    attributeRowData,
    attributesList,
    savedEntryCodes,
    attributeFormats,
    characterEncodingRowData,
    attributeCardinality,
    overlaySelections,
    classificationCode,
    schemaDescription,
    attributeListMap,
    dataArray,
    schemaMetadata,
    languagesWithCode,
    schemaId
  } = prepared;

  let buildText = "";

  // Add attributes (capture base)
  buildText += "# add attributes (capture base)\n";

  if (attributesList.length > 0) {
    buildText += "ADD ATTRIBUTE";
    attributesList.forEach((item, index) => {
      if (!String(item ?? "").trim()) return;
      let attributeType = Array.isArray(dataArray[1][index].Type)
        ? `Array[${dataArray[1][index].Type[0]}]`
        : dataArray[1][index].Type;

      const isReferenceType =
        typeof attributeType === "string" &&
        (attributeType.startsWith("refs:") || attributeType.startsWith("refn:"));
      const isChildSchema =
        attributeType === "Child Schema" ||
        attributeType === "Placeholder Child Schema" ||
        isReferenceType;

      if (isChildSchema) {
        attributeType = `refn:${item}`;
      }

      buildText += ` ${escapeForOCADoubleQuotedValue(item)}=${escapeForOCADoubleQuotedValue(attributeType)}`;
    });
    buildText += "\n";
  } else {
    buildText += "# (no attributes present - skipped ADD ATTRIBUTE)\n";
  }

  // Add classification
  buildText += "# Add classification\n";
  if (classificationCode) {
    buildText += `ADD classification ${classificationCode}`;
    buildText += "\n";
  }

  // Add meta overlay
  buildText += "# Add meta overlay";
  languagesWithCode.forEach((language) => {
    const languageIndex = schemaMetadata.findIndex(
      (obj) => obj.Language === language.language
    );
    const parsedDescription = normalizeEscapedQuotes(
      schemaMetadata[languageIndex].Description || ""
    );
    const rawMetaName = normalizeEscapedQuotes(schemaMetadata[languageIndex].Name || "");
    const metaNameForDsl =
      rawMetaName.trim() !== ""
        ? rawMetaName
        : String(
            schemaDescription[language.language]?.name || schemaId || "schema"
          ).trim() || String(schemaId || "schema");
    buildText += `\nADD Meta ${language.code} PROPS`;
    buildText += ` name="${escapeForOCADoubleQuotedValue(metaNameForDsl)}"`;
    buildText += ` description="${escapeForOCADoubleQuotedValue(parsedDescription)}"`;
  });
  buildText += "\n";

  // Add Format Overlay
  buildText += "# Add Format Overlay\n";
  if (
    overlaySelections[FIELD_FORMAT_OVERLAY] &&
    Object.keys(attributeFormats).length > 0
  ) {
    let tempText = "";
    // Iterate over current attributes only (prevents deleted attributes from appearing)
    attributesList.forEach((attrName) => {
      const formatRule = getMapValueForAttributeName(attributeFormats, attrName);
      if (formatRule) {
        tempText += ` ${attrName}="${escapeFormatRuleForOCA(formatRule)}"`;
      }
    });
    if (tempText !== "") {
      buildText += "ADD Format ATTRS";
      buildText += tempText;
      buildText += "\n";
    }
  }

  // Add Conformance Overlay
  buildText += "# Add Conformance Overlay\n";
  if (overlaySelections[FIELD_CONFORMANCE_OVERLAY]) {
    let conformanceText = "";
    // Required status is stored in the attributes array
    attributesList.forEach((item) => {
      const attr = attributeRowData.find((a) => a.Attribute === item);
      const isRequired = attr?.Required;
      conformanceText += ` ${item}=${isRequired ? "M" : "O"}`;
    });
    if (conformanceText !== "") {
      buildText += `ADD CONFORMANCE ATTRS${conformanceText}\n`;
    }
  }

  // Add Cardinality Overlay
  buildText += "# Add Cardinality Overlay\n";
  if (
    overlaySelections[FIELD_CARDINALITY_OVERLAY] &&
    Object.keys(attributeCardinality).length > 0
  ) {
    let cardinalityText = "";
    // Iterate over current attributes only (prevents deleted attributes from appearing)
    attributesList.forEach((attrName, index) => {
      if (!String(attributeRowData[index]?.Type).includes("Array")) return;
      const cardinalityValue = getMapValueForAttributeName(
        attributeCardinality,
        attrName
      );
      if (cardinalityValue) {
        cardinalityText += ` ${attrName}="${cardinalityValue}"`;
      }
    });
    if (cardinalityText !== "") {
      buildText += `ADD CARDINALITY ATTRS${cardinalityText}\n`;
    }
  }

  // Add label overlay
  buildText += "# Add label overlay";
  languagesWithCode.forEach((language) => {
    let labelText = "";
    attributesList.forEach((item, index) => {
      const languageIndex =
        dataArray
          .slice(1)
          .findIndex((element) => element[0].Language === language.language) + 1;
      if (
        dataArray[languageIndex][index].Label &&
        dataArray[languageIndex][index].Label !== ""
      ) {
        const escapedLabel = escapeForOCADoubleQuotedValue(
          normalizeEscapedQuotes(dataArray[languageIndex][index].Label)
        );
        labelText += ` ${item}="${escapedLabel}"`;
      }
    });
    if (labelText !== "") {
      buildText += `\nADD Label ${language.code} ATTRS${labelText}`;
    }
  });
  buildText += "\n";

  // Add information overlay
  buildText += "# Add information overlay";
  languagesWithCode.forEach((language) => {
    let informationText = "";
    attributesList.forEach((item, index) => {
      const languageIndex =
        dataArray
          .slice(1)
          .findIndex((element) => element[0].Language === language.language) + 1;
      if (
        dataArray[languageIndex][index].Description &&
        dataArray[languageIndex][index].Description !== ""
      ) {
        const escapedDescription = escapeForOCADoubleQuotedValue(
          normalizeEscapedQuotes(dataArray[languageIndex][index].Description)
        );
        informationText += ` ${item}="${escapedDescription}"`;
      }
    });
    if (informationText !== "") {
      buildText += `\nADD Information ${language.code} ATTRS${informationText}`;
    }
  });
  buildText += "\n";

  // Add entry code overlay
  buildText += "# Add entry code overlay\n";

  // First add ENTRY_CODE overlay with just the codes
  let entryCodesText = "";
  attributesList.forEach((item) => {
    if (
      attributeListMap[item] &&
      savedEntryCodes[item] &&
      savedEntryCodes[item].length > 0
    ) {
      const codes = savedEntryCodes[item]
        .map((entry) => String(entry?.Code ?? "").trim())
        .filter((c) => c !== "")
        .map((c) => `"${escapeForOCADoubleQuotedValue(c)}"`)
        .join(", ");
      if (codes) {
        entryCodesText += ` ${item}=[${codes}]`;
      }
    }
  });

  if (entryCodesText !== "") {
    buildText += `ADD ENTRY_CODE ATTRS${entryCodesText}\n`;

    // Then add ENTRY language overlays with code-to-label mappings
    languagesWithCode.forEach((language) => {
      let entryText = "";
      attributesList.forEach((item) => {
        if (savedEntryCodes[item] && savedEntryCodes[item].length > 0) {
          // Entry codes are stored with FULL language names (English, French, etc.)
          // NOT 3-letter OCA codes (eng, fra)
          const languageName = language.language; // Use full name like "English"

          let entryString = "";
          for (const entry of savedEntryCodes[item]) {
            const code = String(entry?.Code ?? "").trim();
            if (!code) continue;
            const label = entry[languageName] || "";
            if (!label) continue;
            const escapedCode = escapeForOCADoubleQuotedValue(code);
            const escapedLabel = escapeForOCADoubleQuotedValue(
              normalizeEscapedQuotes(label)
            );
            entryString += `, "${escapedCode}": "${escapedLabel}"`;
          }
          if (entryString) {
            entryText += ` ${item}={${entryString.slice(2)}}`;
          }
        }
      });
      // Only add the ENTRY line if there's actual content
      if (entryText !== "") {
        buildText += `ADD ENTRY ${language.code} ATTRS${entryText}\n`;
      }
    });
  }
  buildText += "\n";

  // Unit overlay (attribute units)
  buildText += "# Add units overlay\n";
  let unitText = "";
  attributesList.forEach((item) => {
    const row = attributeRowData.find((r) => r.Attribute === item);
    if (row && row.Unit && row.Unit !== "") {
      unitText += ` ${item}="${row.Unit}"`;
    }
  });
  if (unitText !== "") {
    buildText += `ADD Unit ATTRS${unitText}\n`;
  }

  // Add character encoding overlay
  buildText += "# Add character encoding overlay\n";
  if (overlaySelections[FIELD_CHARACTER_ENCODING_OVERLAY]) {
    let encodingText = "";
    let hasEncoding = false;

    attributesList.forEach((item, index) => {
      // characterEncodingRowData can be either:
      // - an object mapping attributeName -> encoding (schema state)
      // - an array of row objects [{ Attribute, "Character Encoding" }] (legacy/UI)
      // Prefer object map lookup for correctness.
      const encoding = Array.isArray(characterEncodingRowData)
        ? characterEncodingRowData[index]?.[FIELD_CHARACTER_ENCODING_OVERLAY]
        : characterEncodingRowData[item];

      if (encoding) {
        hasEncoding = true;
        encodingText += ` ${item}="${encoding}"`;
      }
    });

    if (hasEncoding) {
      buildText += `ADD CHARACTER_ENCODING ATTRS${encodingText}\n`;
    }
  }

  const data = buildText;

  if (/^ADD ATTRIBUTE\s*$/m.test(data)) {
    console.error(
      "Generated DSL contains bare 'ADD ATTRIBUTE' — aborting export. DSL follows:\n",
      data
    );
    throw new Error(
      "Export aborted: generated OCA DSL contains an empty `ADD ATTRIBUTE` line. Please ensure the schema has attributes and try again. (DSL logged to console)"
    );
  }

  return data;
};

/**
 * Builds the ADC extension overlays for a prepared schema export, keyed by the digest
 * of the bundle the bundle service generated from its DSL.
 *
 * @param {Object} prepared - Result of prepareSchemaExport
 * @param {Object} bundle - Bundle service response for the DSL
 * @param {Object} [options]
 * @param {Function} [options.buildFormInformation] - (pages, languages, schemaDescription, captureBase) => form overlays.
 *   Required only when the form information overlay is selected.
 */
export const buildAdcExtension = (prepared, bundle, { buildFormInformation } = {}) => {
  const {
    languages,
    attributeRowData,
    attributesList,
    attributeFormats,
    attributeRanges,
    attributeFramingSources,
    entryCodeFramingSources,
    unitFramedRowData,
    decimalSeparator,
    fileDelimiterData,
    arrayDelimiterData,
    enableDecimalSeparator,
    enableFileDelimiter,
    enableArrayDelimiter,
    exampleData,
    overlaySelections,
    schemaDescription,
    filteredEntryCodes,
    schemaId,
    formBuilderPages
  } = prepared;

  if (overlaySelections[FIELD_FORM_INFORMATION_OVERLAY] && !buildFormInformation) {
    throw new Error(
      "The form information overlay is selected but no buildFormInformation was provided."
    );
  }

  const formCaptureBaseDigest =
    getRootCaptureBaseId(bundle) ?? getPackageBundleId(bundle);

  const sensitiveAttributes = attributeRowData
    .filter((item) => item.Sensitive)
    .map((item) => item.Attribute);

  // Convert attributeFormats object to array format for helper functions
  const formatRuleRowData = attributeRowData.map((attr) => ({
    Attribute: attr.Attribute,
    "Format Rule": getMapValueForAttributeName(attributeFormats, attr.Attribute) || ""
  }));

  // Convert attributeRanges object to array format for helper functions
  const rangeRowData = attributeRowData
    .filter((attr) => attr.Type === "Numeric" || attr.Type === "DateTime")
    .map((attr) => {
      const range = getMapValueForAttributeName(attributeRanges, attr.Attribute) || {};
      return {
        Attribute: attr.Attribute,
        Type: attr.Type,
        FormatRule: getMapValueForAttributeName(attributeFormats, attr.Attribute) || "",
        LowerBound: range.lower || "",
        UpperBound: range.upper || "",
        LowerInclusive: range.lower_inclusive ?? false,
        UpperInclusive: range.upper_inclusive ?? false
      };
    });

  const rangeOverlayInput = getRangeOverlayInput(
    rangeRowData,
    formatRuleRowData,
    attributesList
  );
  const retainedUniqueFramedUnits = unitFramedRowData.filter((row) => {
    if (row.deleted) return false;
    const attr = attributeRowData.find((a) => a.Attribute === row.Attribute);
    return attr && isUnitEligibleAttributeType(attr.Type);
  });

  const extensionOverlayPayload = {
    ordering_overlay: {
      type: ORDERING,
      attribute_ordering: attributesList,
      entry_code_ordering: getTransformedEntryCodes(filteredEntryCodes)
    },
    ...(overlaySelections[FIELD_UNIT_FRAMING_OVERLAY] &&
    retainedUniqueFramedUnits.length > 0
      ? {
          unit_framing_overlay: {
            type: UNIT_FRAMING,
            properties: {
              id: UNIT_FRAME_ID,
              label: UNIT_FRAME_LABEL,
              location: UNIT_FRAME_LOCATION,
              version: UNIT_FRAME_VERSION
            },
            units: getUnitFramingInput(retainedUniqueFramedUnits)
          }
        }
      : {}),
    ...(overlaySelections[FIELD_RANGE_OVERLAY] &&
    Object.keys(rangeOverlayInput).length > 0
      ? {
          range_overlay: {
            type: RANGE,
            attributes: rangeOverlayInput
          }
        }
      : {}),
    ...(sensitiveAttributes.length > 0
      ? {
          sensitive_overlay: {
            type: SENSITIVE,
            sensitive_attributes: sensitiveAttributes
          }
        }
      : {}),
    // Each attribute-framing source is an independent vocabulary the schema's
    // attributes are framed against; the oca_package library expects them as
    // an array (attribute_framing_overlays), the same array-of-instances
    // pattern used for example_overlay/example_overlays above.
    ...(overlaySelections[FIELD_ATTRIBUTE_FRAMING_OVERLAY]
      ? (() => {
          const builtAttributeFramingOverlays = attributeFramingSources
            .map((source) => {
              const metadata = source?.metadata || {};
              return {
                type: ATTRIBUTE_FRAMING,
                framing_metadata: {
                  id: metadata.id ?? ATTRIBUTE_FRAME_ID,
                  label: metadata.label ?? ATTRIBUTE_FRAME_LABEL,
                  location: metadata.location ?? ATTRIBUTE_FRAME_LOCATION,
                  version: metadata.version ?? ATTRIBUTE_FRAME_VERSION,
                  ...(metadata.imports &&
                  typeof metadata.imports === "object" &&
                  Object.keys(metadata.imports).length > 0
                    ? { imports: metadata.imports }
                    : {})
                },
                attributes: getAttributeFramingInput(source?.rows || [], attributesList)
              };
            })
            .filter((entry) => Object.keys(entry.attributes).length > 0);
          return builtAttributeFramingOverlays.length > 0
            ? {
                attribute_framing_overlay: {
                  attribute_framing_overlays: builtAttributeFramingOverlays
                }
              }
            : {};
        })()
      : {}),
    ...(() => {
      const entryCodeFramingOverlays = getEntryCodeFramingInput(
        entryCodeFramingSources,
        filteredEntryCodes
      );
      return entryCodeFramingOverlays.length > 0
        ? {
            entry_code_framing_overlay: {
              entry_code_framing_overlays: entryCodeFramingOverlays
            }
          }
        : {};
    })(),
    ...(overlaySelections[FIELD_FORM_INFORMATION_OVERLAY]
      ? {
          form_overlay: {
            form_overlays: buildFormInformation(
              formBuilderPages,
              languages,
              schemaDescription,
              formCaptureBaseDigest
            )
          }
        }
      : {}),
    ...(overlaySelections[FIELD_DATA_SEPARATOR_OVERLAY] && enableDecimalSeparator
      ? {
          decimal_separator_overlay: {
            type: DECIMAL_SEPARATOR,
            decimal_separator: decimalSeparator
          }
        }
      : {}),
    ...(overlaySelections[FIELD_DATA_SEPARATOR_OVERLAY] && enableFileDelimiter
      ? {
          file_delimiter_overlay: {
            type: FILE_DELIMITER,
            delimiter: fileDelimiterData.fieldDelimiter,
            quote_char: fileDelimiterData.quoteChar,
            escape_char: fileDelimiterData.escapeChar,
            line_terminator: fileDelimiterData.lineTerminator,
            data_start_row: fileDelimiterData.dataStartRow
          }
        }
      : {}),
    ...(overlaySelections[FIELD_DATA_SEPARATOR_OVERLAY] &&
    enableArrayDelimiter &&
    Object.keys(arrayDelimiterData).length > 0
      ? {
          array_delimiter_overlay: {
            type: ARRAY_DELIMITER,
            attributes: { ...arrayDelimiterData }
          }
        }
      : {}),
    ...(overlaySelections[FIELD_EXAMPLE_OVERLAY] && Object.keys(exampleData).length > 0
      ? (() => {
          // Build per-language attribute_examples maps.
          // exampleData shape: { attributeName: { language: value } }
          // Legacy flat shape ({ attributeName: value }) is also supported as a fallback.
          // The oca_package library expects `example_overlays` to be an array of
          // { language, attribute_examples } overlay objects.
          const exampleOverlays = [];
          languages.forEach((language) => {
            const langCode = langCodeOCAFromName(language);
            const filteredExamples = {};
            attributesList.forEach((attrName) => {
              const attrEntry = exampleData[attrName];
              let val;
              if (
                attrEntry &&
                typeof attrEntry === "object" &&
                !Array.isArray(attrEntry)
              ) {
                // Per-language shape
                val = attrEntry[language];
              } else {
                // Legacy flat shape — same value for all languages
                val = attrEntry;
              }
              if (val !== undefined && val !== null && String(val).trim() !== "") {
                filteredExamples[attrName] = String(val);
              }
            });
            if (Object.keys(filteredExamples).length > 0) {
              exampleOverlays.push({
                language: langCode,
                attribute_examples: filteredExamples
              });
            }
          });
          if (exampleOverlays.length === 0) return {};
          return {
            example_overlay: {
              example_overlays: exampleOverlays
            }
          };
        })()
      : {})
  };

  const extensionOverlays = [extensionOverlayPayload];
  const generatedBundleDigest = getApiGeneratedBundleDigest(bundle);
  if (!generatedBundleDigest) {
    throw new Error(
      `Export failed: generated bundle is missing a digest for schema ${schemaId}`
    );
  }

  const extension = {
    extensions: {
      [ADC]: {
        [generatedBundleDigest]: extensionOverlays
      }
    }
  };

  return { extension, generatedBundleDigest };
};

/**
 * Builds one schema's export: DSL -> bundle service -> ADC extension overlays.
 *
 * @param {Object} schemaState - Editor state for the schema
 * @param {Object} options
 * @param {string} options.schemaId
 * @param {Function} options.generateBundle - async (dslText) => bundle service response
 * @param {Object} [options.defaultOverlaySelections]
 * @param {Object} [options.customIsos]
 * @param {Function} [options.buildFormInformation]
 * @returns {Promise<{bundle: Object, extension: Object, textDSL: string, generatedBundleDigest: string}>}
 */
export const buildSchemaExport = async (
  schemaState,
  {
    schemaId,
    generateBundle,
    defaultOverlaySelections,
    customIsos,
    buildFormInformation
  } = {}
) => {
  if (typeof generateBundle !== "function") {
    throw new Error("buildSchemaExport requires a generateBundle function.");
  }
  const prepared = prepareSchemaExport(schemaState, {
    schemaId,
    defaultOverlaySelections,
    customIsos
  });
  const textDSL = buildOcaDsl(prepared);
  const bundle = await generateBundle(textDSL);
  const { extension, generatedBundleDigest } = buildAdcExtension(prepared, bundle, {
    buildFormInformation
  });
  return { bundle, extension, textDSL, generatedBundleDigest };
};
