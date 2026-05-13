import { useContext, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { OcaPackage } from "oca_package";
import { Context } from "../App";
import { useMultiSchema } from "../schema/schemaContext";
import { langCodeOCAFromName, langTwoLettersFromName } from "../utils/languageUtils";
import {
  getPackageBundle,
  getPackageDependencies,
  getPackageBundleId,
  getRootCaptureBaseId
} from "../utils/packageUtils";
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
  FIELD_FORM_INFORMATION_OVERLAY,
  FIELD_DATA_SEPARATOR_OVERLAY,
  DECIMAL_SEPARATOR,
  FILE_DELIMITER,
  ARRAY_DELIMITER,
  overlayItems
} from "../constants/constants";
import {
  generateOCABundle,
  getDescriptiveFileName,
  getRangeOverlayInput,
  getTransformedEntryCodes,
  getUnitFramingInput,
  getAttributeFramingInput,
  getFormInformationInput,
  normalizeEscapedQuotes,
  escapeForOCADoubleQuotedValue
} from "../utils/helpers";
import { getMapValueForAttributeName } from "../utils/stringUtils";
import useGenerateTextReadmeFromJson from "../ViewSchema/useGenerateTextReadmeFromJson";

const currentEnv = process.env.REACT_APP_ENV;

/**
 * Export OCA packages from editor state.
 *
 * Rules:
 * 1. UI state is the source of truth for export.
 * 2. refs:* tokens must resolve to materialized SAIDs; unresolved refs fail export.
 * 3. refn:* tokens are placeholders; unresolved placeholders are preserved.
 * 4. Imported and manual flows both rebuild via DSL/API and rewrite references before packaging.
 */
const useOCAExport = () => {
  const navigate = useNavigate();

  // Global settings (not schema-specific)
  const {
    customIsos,
    overlay,
    setSummaryExportMode,
    setOverlay,
    setSelectedOverlay,
    setCurrentPage
  } = useContext(Context);

  const {
    getCurrentSchemaId,
    getSchemaById,
    rebuildOcaPackageFromEditorState,
    schemaStates,
    clearAllSchemas,
    ocaPackage,
    setOcaPackage
  } = useMultiSchema();
  const currentSchemaId = getCurrentSchemaId();
  const { jsonToTextFile } = useGenerateTextReadmeFromJson();
  const [error, setError] = useState("");

  // Shared download utilities
  const downloadTextFile = (data, fileName) => {
    const blob = new Blob([data], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const downloadJsonFile = (data, fileName) => {
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

  const buildSchemaDescriptionByLanguage = (metadata, languages, schemaId) => {
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

  const buildUniqueLanguageCodes = (languages) => {
    const languagesWithCode = [];
    const allLanguageCodes = [];

    languages.forEach((language) => {
      const languageObject = {};
      languageObject.language = language;
      // Use two-letter codes because DSL parsing with three-letter codes is not reliable.
      languageObject.code =
        langTwoLettersFromName(language) ||
        customIsos[language.toLowerCase()] ||
        "unknown";

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

  const throwUnresolvedReferenceError = (unresolvedTokens) => {
    if (!unresolvedTokens?.length) return;
    throw new Error(
      `Unresolved reference tokens from UI state: ${unresolvedTokens.slice(0, 6).join(", ")}`
    );
  };

  const deepCloneJson = (value) => JSON.parse(JSON.stringify(value));

  // Build OCA package from schema state using text DSL generation
  // Works for both single schemas and multi-schema packages
  const buildPackageFromTextDSL = async (schemaId) => {
    const schemaState = getSchemaById(schemaId);
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
    const attributeFramingRowData = schemaState?.attributeFramingData || [];
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
    const overlaySelections = schemaState?.overlaySelections || overlay;
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

    let data = "";
    let bundle;

    const schemaMetadata = dataArray[0];
    const languagesWithCode = buildUniqueLanguageCodes(languages);

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
      const rawMetaName = normalizeEscapedQuotes(
        schemaMetadata[languageIndex].Name || ""
      );
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
          // Normalize first (unescape any already-escaped quotes), then escape all quotes
          // This prevents double-escaping when format rules contain \" from the original OCA file
          // Only escape double quotes for the DSL; avoid escaping backslashes/hyphens
          // eslint-disable-next-line quotes
          const escapedRule = normalizeEscapedQuotes(formatRule).replace(/"/g, '\\"');
          tempText += ` ${attrName}="${escapedRule}"`;
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
      attributesList.forEach((attrName) => {
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

    data = buildText;

    if (/^ADD ATTRIBUTE\s*$/m.test(data)) {
      console.error(
        "Generated DSL contains bare 'ADD ATTRIBUTE' — aborting export. DSL follows:\n",
        data
      );
      throw new Error(
        "Export aborted: generated OCA DSL contains an empty `ADD ATTRIBUTE` line. Please ensure the schema has attributes and try again. (DSL logged to console)"
      );
    }

    // eslint-disable-next-line prefer-const
    bundle = await generateOCABundle(data);

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
    const retainedUniqueFramedUnits = unitFramedRowData.filter((row) => !row.deleted);

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
      ...(overlaySelections[FIELD_ATTRIBUTE_FRAMING_OVERLAY]
        ? {
            attribute_framing_overlay: {
              type: ATTRIBUTE_FRAMING,
              framing_metadata: {
                id: "FOODON",
                label: "Food Ontology",
                location:
                  "https://raw.githubusercontent.com/FoodOntology/foodon/master/foodon.owl",
                version: "1.0"
              },
              attributes: getAttributeFramingInput(
                attributeFramingRowData,
                attributesList
              )
            }
          }
        : {}),
      ...(overlaySelections[FIELD_FORM_INFORMATION_OVERLAY]
        ? {
            form_overlay: {
              form_overlays: getFormInformationInput(
                schemaState.formBuilderPages || [],
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
        : {})
    };

    const extensionOverlays = [extensionOverlayPayload];
    const extension = {
      extensions: {
        [ADC]: {
          [getPackageBundleId(bundle) || "bundle_id"]: extensionOverlays
        }
      }
    };

    return { bundle, extension, textDSL: data };
  };

  const getSchemaMaterializationKey = (schemaId) => {
    const state = getSchemaById(schemaId);
    return state?.metadata?.localized?.eng?.name || state?.metadata?.name || schemaId;
  };

  const setResolvedSaidForSchema = (saidByReferenceToken, schemaId, said) => {
    if (!schemaId || !said) return;
    saidByReferenceToken[schemaId] = said;
    saidByReferenceToken[getSchemaMaterializationKey(schemaId)] = said;
  };

  const createResolveSaid = (saidByReferenceToken) => (token) => {
    if (!token) return null;
    if (saidByReferenceToken[token]) return saidByReferenceToken[token];
    const byMaterializationKey = saidByReferenceToken[getSchemaMaterializationKey(token)];
    if (byMaterializationKey) return byMaterializationKey;
    return null;
  };

  const getReferenceToken = (rawValue) => {
    const value = Array.isArray(rawValue) ? rawValue[0] : rawValue;
    if (typeof value !== "string") return null;
    if (value.startsWith("refs:") || value.startsWith("refn:")) return value.slice(5);
    return null;
  };

  const seedResolvedAliasTokensFromBundles = (schemaBundles, saidByReferenceToken) => {
    const resolveSaid = createResolveSaid(saidByReferenceToken);
    (schemaBundles || []).filter(Boolean).forEach((schemaBundle) => {
      const attrs = schemaBundle?.capture_base?.attributes;
      if (!attrs || typeof attrs !== "object") return;
      Object.entries(attrs).forEach(([attrName, rawValue]) => {
        const token = getReferenceToken(rawValue);
        if (!token) return;
        const resolvedSaid = resolveSaid(token);
        if (resolvedSaid) {
          saidByReferenceToken[attrName] = resolvedSaid;
        }
      });
    });
  };

  const rewriteBundleRefs = ({ schemaBundle, resolveSaid }) => {
    const attrs = schemaBundle?.capture_base?.attributes;
    if (!attrs || typeof attrs !== "object") return [];

    const unresolvedTokens = [];

    Object.keys(attrs).forEach((attrName) => {
      const value = attrs[attrName];
      const token = getReferenceToken(value);
      if (!token) return;

      const isRefn = (Array.isArray(value) ? value[0] : value)?.startsWith("refn:");
      const resolvedSaid = resolveSaid(token);
      if (!resolvedSaid) {
        if (isRefn) return;
        unresolvedTokens.push(`${schemaBundle?.d || "bundle"}.${attrName}:${token}`);
        return;
      }

      attrs[attrName] = Array.isArray(value)
        ? [`refs:${resolvedSaid}`]
        : `refs:${resolvedSaid}`;
    });

    return unresolvedTokens;
  };

  const validateExtension = (ext) => {
    if (!ext || typeof ext !== "object") throw new Error("extension must be an object");
    const adc = ext.extensions?.adc;
    if (!adc || typeof adc !== "object") return;
    Object.entries(adc).forEach(([schemaKey, overlays]) => {
      if (!overlays || (typeof overlays !== "object" && !Array.isArray(overlays))) {
        throw new Error(`extensions.adc.${schemaKey} must be an object or array`);
      }
      const overlayArray = Array.isArray(overlays) ? overlays : [overlays];
      overlayArray.forEach((ov, idx) => {
        if (!ov || typeof ov !== "object")
          throw new Error(
            `overlay at extensions.adc.${schemaKey}[${idx}] is not an object`
          );
        if (ov.form_overlay) {
          const fo = ov.form_overlay.form_overlays;
          if (!Array.isArray(fo))
            throw new Error("form_overlay.form_overlays must be an array");
          fo.forEach((page, pidx) => {
            if (!page || typeof page !== "object")
              throw new Error(`form_overlays[${pidx}] must be an object`);
            if (page.labels && typeof page.labels === "object") {
              Object.entries(page.labels).forEach(([lang, label]) => {
                if (typeof lang !== "string")
                  throw new Error("form overlay page label language key is not a string");
                if (typeof label !== "string")
                  throw new Error(`form overlay page label for ${lang} must be a string`);
              });
            }
          });
        }
      });
    });
  };

  const generateOcaPackageJson = (extension, bundlePayload) => {
    validateExtension(extension);
    try {
      const ocaPackageService = new OcaPackage(extension, bundlePayload);
      return JSON.parse(ocaPackageService.GenerateOcaPackage());
    } catch (e) {
      console.error("Failed to generate OCA package from extension:", e, extension);
      throw new Error(`Failed to parse Extension JSON: ${e.message}`);
    }
  };

  const exportImportedPackage = async () => {
    const saidByReferenceToken = {};
    const originalRootId = getPackageBundleId(ocaPackage);

    const rootState = getSchemaById(originalRootId);
    if (!rootState || !rootState.initialized) {
      console.error("Root schema not initialized:", originalRootId);
      console.error("Available schemas:", Object.keys(schemaStates));
      throw new Error(
        `Root schema ${originalRootId} is not initialized. Please try reloading the schema.`
      );
    }

    const schemaIds = Object.keys(schemaStates).filter((id) => {
      const state = getSchemaById(id);
      return state?.initialized;
    });
    if (!schemaIds.includes(originalRootId)) {
      console.error("Root ID not in schemaStates:", originalRootId);
      console.error("Available:", schemaIds);
      throw new Error(`Root schema ID mismatch. Expected: ${originalRootId}`);
    }

    const pkgRebuilt = rebuildOcaPackageFromEditorState(ocaPackage);
    const pkgForExport = deepCloneJson(pkgRebuilt);
    const rootBundle = getPackageBundle(pkgForExport);
    const dependencies = getPackageDependencies(pkgForExport) || [];

    if (!rootBundle) {
      throw new Error("Could not find root schema in rebuilt package");
    }

    const adcMerged = {};
    const generatedBundleByOriginalId = {};

    const mergeExtensionsForBundle = async (schemaBundle) => {
      const bid = schemaBundle?.d;
      if (!bid) return;
      const st = getSchemaById(bid);
      if (!st?.initialized) return;
      const result = await buildPackageFromTextDSL(bid);

      const generatedBundle = getPackageBundle(result.bundle);
      if (generatedBundle?.d) {
        generatedBundleByOriginalId[bid] = generatedBundle;
        setResolvedSaidForSchema(saidByReferenceToken, bid, generatedBundle.d);
      }

      if (result?.extension?.extensions?.[ADC]) {
        Object.assign(adcMerged, result.extension.extensions[ADC]);
      }
    };

    for (const dep of dependencies) {
      // eslint-disable-next-line no-await-in-loop
      await mergeExtensionsForBundle(dep);
    }
    await mergeExtensionsForBundle(rootBundle);

    const mergedExtension = {
      extensions: {
        adc: adcMerged
      }
    };

    // UI-only aliasing: allow refn:<attribute_name> tokens to resolve via rebuilt graph.
    seedResolvedAliasTokensFromBundles(
      [rootBundle, ...dependencies],
      saidByReferenceToken
    );
    const resolveImportedSaid = createResolveSaid(saidByReferenceToken);

    const exportedRootBundle = generatedBundleByOriginalId[rootBundle.d] || rootBundle;
    const exportedDependencies = dependencies.map(
      (dep) => generatedBundleByOriginalId[dep.d] || dep
    );

    const unresolvedTokens = [];
    unresolvedTokens.push(
      ...rewriteBundleRefs({
        schemaBundle: exportedRootBundle,
        resolveSaid: resolveImportedSaid
      })
    );
    exportedDependencies.forEach((dep) => {
      unresolvedTokens.push(
        ...rewriteBundleRefs({
          schemaBundle: dep,
          resolveSaid: resolveImportedSaid
        })
      );
    });

    throwUnresolvedReferenceError(unresolvedTokens);

    const bundleWithDeps = {
      bundle: exportedRootBundle,
      dependencies: exportedDependencies
    };

    const exportPackage = generateOcaPackageJson(mergedExtension, bundleWithDeps);

    const rootBundleData = exportedRootBundle;
    const metaOverlays = rootBundleData?.overlays?.meta;
    const engMeta = Array.isArray(metaOverlays)
      ? metaOverlays.find((m) => m.language === "eng") || metaOverlays[0]
      : null;
    const schemaName = engMeta?.name || getPackageBundleId(rootBundleData) || "schema";

    const packageFileName = `${schemaName.split(" ")[0]}_OCA_package.json`;
    downloadJsonFile(exportPackage, packageFileName);

    if (rootBundleData?.overlays?.meta) {
      await jsonToTextFile(rootBundleData, exportPackage);
    }

    if (currentEnv === "DEV" && rootBundleData) {
      const bundleFileName = `${schemaName.split(" ")[0]}_OCA_bundle.json`;
      downloadJsonFile(rootBundleData, bundleFileName);
    }

    return true;
  };

  const exportManualPackage = async () => {
    const pkgFromState = rebuildOcaPackageFromEditorState(ocaPackage);
    const rootSchemaId = getPackageBundleId(pkgFromState) || currentSchemaId;

    const allSchemaIds = Object.keys(schemaStates);
    const childSchemaIds = allSchemaIds.filter((id) => id !== rootSchemaId);

    const childBuilds = [];
    for (const childId of childSchemaIds) {
      const childState = schemaStates[childId];
      if (childState?.attributes && childState.attributes.length > 0) {
        // eslint-disable-next-line no-await-in-loop
        const { bundle: childBundle, extension: childExtension } =
          await buildPackageFromTextDSL(childId);
        const said = childBundle?.bundle?.d;
        if (said) {
          childBuilds.push({
            schemaId: childId,
            bundle: childBundle.bundle,
            extension: childExtension
          });
        }
      }
    }

    const { bundle, extension, textDSL } = await buildPackageFromTextDSL(rootSchemaId);

    const mergedExtension = {
      extensions: {
        adc: {
          ...extension.extensions.adc,
          ...childBuilds
            .map((b) => b.extension)
            .reduce((acc, childExt) => {
              if (childExt?.extensions?.adc) {
                return { ...acc, ...childExt.extensions.adc };
              }
              return acc;
            }, {})
        }
      }
    };

    const saidByReferenceToken = {};
    setResolvedSaidForSchema(saidByReferenceToken, rootSchemaId, bundle.bundle.d);
    childBuilds.forEach(({ schemaId, bundle: childBundle }) => {
      setResolvedSaidForSchema(saidByReferenceToken, schemaId, childBundle.d);
    });

    const rebuiltRootBundle = getPackageBundle(pkgFromState);
    const rebuiltDependencies = getPackageDependencies(pkgFromState) || [];
    seedResolvedAliasTokensFromBundles(
      [rebuiltRootBundle, ...rebuiltDependencies],
      saidByReferenceToken
    );

    const resolveManualSaid = createResolveSaid(saidByReferenceToken);

    const finalBundle = deepCloneJson(bundle.bundle);
    const finalDependencies = childBuilds.map(({ bundle: childBundle }) =>
      deepCloneJson(childBundle)
    );
    const unresolvedTokens = [];
    unresolvedTokens.push(
      ...rewriteBundleRefs({ schemaBundle: finalBundle, resolveSaid: resolveManualSaid })
    );
    finalDependencies.forEach((dep) =>
      unresolvedTokens.push(
        ...rewriteBundleRefs({ schemaBundle: dep, resolveSaid: resolveManualSaid })
      )
    );

    throwUnresolvedReferenceError(unresolvedTokens);

    const finalPackage = {
      bundle: finalBundle,
      dependencies: finalDependencies
    };

    const exportedPackageJson = generateOcaPackageJson(mergedExtension, {
      bundle: finalPackage.bundle,
      dependencies: finalPackage.dependencies
    });

    try {
      if (finalPackage.bundle?.capture_base) {
        await jsonToTextFile(finalPackage.bundle, exportedPackageJson);
      }
    } catch (readmeError) {
      console.warn("Could not generate README:", readmeError);
    }

    const rootState = getSchemaById(rootSchemaId);
    const schemaNameForFile =
      rootState?.metadata?.name || rootState?.metadata?.localized?.eng?.name || null;

    downloadJsonFile(
      exportedPackageJson,
      getDescriptiveFileName(schemaNameForFile, "OCA_package.json")
    );

    if (currentEnv === "DEV") {
      downloadTextFile(
        textDSL,
        getDescriptiveFileName(schemaNameForFile, "OCA_file.txt")
      );
      downloadJsonFile(
        finalPackage,
        getDescriptiveFileName(schemaNameForFile, "OCA_bundle.json")
      );
    }

    return true;
  };

  // MAIN EXPORT FUNCTION
  const exportData = async () => {
    try {
      setError("");
      if (ocaPackage) {
        return await exportImportedPackage();
      }
      return await exportManualPackage();
    } catch (error) {
      console.error("Export failed:", error);
      setError(error.message || "Export failed");
      return false;
    }
  };

  /**
   * Reset all application state to defaults and navigate to landing page
   */
  const resetToDefaults = useCallback(() => {
    setSummaryExportMode(false);
    setOcaPackage(null);
    setOverlay(overlayItems);
    setSelectedOverlay("");

    clearAllSchemas();

    setCurrentPage("Landing");
    navigate("/");
  }, [
    setSummaryExportMode,
    setOcaPackage,
    setOverlay,
    setSelectedOverlay,
    clearAllSchemas,
    setCurrentPage,
    navigate
  ]);

  return {
    exportData,
    error,
    clearError: () => setError(""),
    isImportedPackage: !!ocaPackage,
    resetToDefaults
  };
};

export default useOCAExport;
