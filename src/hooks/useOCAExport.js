import { useContext, useMemo, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { OcaPackage } from "oca_package";
import { Context } from "../App";
import { useMultiSchema } from "../schema/schemaContext";
import { langCodeOCAFromName, langTwoLettersFromName } from "../utils/languageUtils";
import { getPackageBundle, getPackageDependencies, findSchemaById, getPackageBundleId } from "../utils/packageUtils";
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
  FORM,
  FIELD_FORM_INFORMATION_OVERLAY,
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
  escapeForOCAString
} from "../utils/helpers";
import { getMapValueForAttributeName } from "../utils/stringUtils";
import useGenerateTextReadmeFromJson from "../ViewSchema/useGenerateTextReadmeFromJson";

const currentEnv = process.env.REACT_APP_ENV;

/**
 * Unified OCA Export Hook
 * 
 * Handles all OCA export scenarios:
 * 1. Imported packages (flat or nested) - uses exportSchemaChanges()
 * 2. Manually created schemas (flat) - builds from scratch using text DSL
 * 3. Manually created schemas (nested) - builds and merges child schemas
 * 
 * Unified export hook - handles export and reset functionality for all schema types.
 */
const useOCAExport = () => {
  const navigate = useNavigate();
  
  // Global settings (not schema-specific)
  const {
    divisionGroup,
    customIsos,
    overlay,
    setIsZip,
    setOverlay,
    setSelectedOverlay,
    setCurrentPage
  } = useContext(Context);

  const { getCurrentSchemaId, getSchema, getSchemaById, getAttributesList, rebuildOcaPackageFromEditorState, schemaStates, currentSchemaId: activeSchemaId, clearAllSchemas, ocaPackage, setOcaPackage } = useMultiSchema();
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

  // Build OCA package from schema state using text DSL generation
  // Works for both single schemas and multi-schema packages
  const buildPackageFromTextDSL = async (schemaId, childSaidMap = {}) => {
    const schemaState = getSchemaById(schemaId);
    const metadata = schemaState?.metadata || {};
    
    // Extract all data for this schema
    const languages = metadata.languages || ["English"];
    const attributeRowData = schemaState?.attributes || [];
    const attributesList = attributeRowData.map(attr => attr.Attribute);
    const lanAttributeRowData = schemaState?.lanAttributeRowData || {};
    const savedEntryCodes = schemaState?.entryCodes || {};
    const attributeFormats = schemaState?.attributeFormats || {};
    const characterEncodingRowData = schemaState?.characterEncodingData || {};
    const attributeCardinality = schemaState?.attributeCardinality || {};
    const attributeRanges = schemaState?.attributeRanges || {};
    const attributeFramingRowData = schemaState?.attributeFramingData || [];
    const unitFramedRowData = schemaState?.unitFramedData || [];
    const overlaySelections = schemaState?.overlaySelections || overlay;
    const classificationCode = metadata?.classification || null;
    
    // Get original schema from ocaPackage to preserve reference types
    let originalSchema = null;
    if (ocaPackage) {
      originalSchema = findSchemaById(ocaPackage, schemaId);
    }
    
    // Build schema description for each language
    const schemaDescription = {};
    languages.forEach((language) => {
      const langCodeOCA = langCodeOCAFromName(language);
      const localized = metadata.localized?.[langCodeOCA] || {};
      schemaDescription[language] = {
        name: localized.name || metadata.name || "",
        description: localized.description || metadata.description || ""
      };
    });
    
    const attributeListMap = attributeRowData.reduce((acc, attr) => {
      acc[attr.Attribute] = attr.List;
      return acc;
    }, {});
    
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
      attributeRowData.forEach((attrRow, index) => {
        const rowObject = { Language: language, Attribute: attrRow.Attribute || "" };
        const lanRow = lanRows[index] || {};
        rowObject.Flagged = attrRow.Sensitive ? "Y" : "";
        rowObject.Unit = attrRow.Unit || "";
        // Keep "Child Schema" type as-is; conversion to refs:/refn: happens at DSL generation
        rowObject.Type = attrRow.Type || "";
        
        rowObject.Label = lanRow.Label || "";
        rowObject.Description = lanRow.Description || "";
        rowObject.List = lanRow.List || (attrRow.List ? "" : "Not a List");
        rowObject.Language = language;
        rowData.push(rowObject);
      });
      dataArray.push(rowData);
    });
    
    // Build text DSL
    const schemaMetadata = dataArray[0];
    const languagesWithCode = [];
    const allLanguageCodes = [];

    languages.forEach((language) => {
      const languageObject = {};
      languageObject.language = language;
      languageObject.code =
      // API does not accept 3-letter OCA codes? langCodeOCAFromName() gave unhelpful parsing error: "expected label, meta,..."
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

    let buildText = "";

    // Add attributes (capture base)
    buildText += "# add attributes (capture base)\n";

    // Only emit the `ADD Attribute` DSL when there are attributes to list. A
    // bare `ADD Attribute` (no attribute pairs) is invalid and causes the
    // OCA parser to fail with "expected attr_pairs".
    if (attributesList.length > 0) {
      buildText += "ADD Attribute";
      attributesList.forEach((item, index) => {
        let attributeType = Array.isArray(dataArray[1][index].Type)
          ? `Array[${dataArray[1][index].Type[0]}]`
          : dataArray[1][index].Type;
        
        // Convert "Child Schema" or "Placeholder Child Schema" UI type to OCA spec refs:/refn: format
        // - refs:SAID = child schema with cryptographic identifier (has been built)
        // - refn:name = named reference placeholder (not yet built)
        const isChildSchema = attributeType === "Child Schema" || attributeType === "Placeholder Child Schema";
        
        if (isChildSchema) {
          const originalValue = originalSchema?.capture_base?.attributes?.[item];
          const childSaid = childSaidMap[item];
          
          if (childSaid) {
            // Child schema was pre-built, use its SAID
            attributeType = `refs:${childSaid}`;
          } else if (originalValue && typeof originalValue === 'string' && (originalValue.startsWith('refs:') || originalValue.startsWith('refn:'))) {
            // Check if this refs: child schema exists and has attributes
            if (originalValue.startsWith('refs:')) {
              const refSaid = originalValue.replace('refs:', '');
              // Try to find the child schema in schemaStates
              const childSchemaState = getSchemaById(refSaid);
              const hasAttributes = childSchemaState?.attributes && childSchemaState.attributes.length > 0;
              
              if (!hasAttributes) {
                // Child schema is empty - convert to placeholder
                attributeType = `refn:${item}`;
              } else {
                // Use existing refs: from original schema
                attributeType = originalValue;
              }
            } else {
              // Use existing refn: from original schema
              attributeType = originalValue;
            }
          } else {
            // Fallback: named reference placeholder (child not yet built)
            attributeType = `refn:${item}`;
          }
        }
        
        buildText += ` ${item}=${attributeType}`;
      });
      buildText += "\n";
    } else {
      buildText += "# (no attributes present - skipped ADD Attribute)\n";
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
      const parsedDescription = normalizeEscapedQuotes(schemaMetadata[languageIndex].Description || "");
      const escapedDescription = escapeForOCAString(parsedDescription);
      buildText += `\nADD Meta ${language.code} PROPS`;
      buildText += ` name="${escapeForOCAString(normalizeEscapedQuotes(schemaMetadata[languageIndex].Name || ""))}"`;
      buildText += ` description="${escapedDescription}"`;
    });
    buildText += "\n";

    // Add Format Overlay
    buildText += "# Add Format Overlay\n";
    if (overlaySelections[FIELD_FORMAT_OVERLAY] && Object.keys(attributeFormats).length > 0) {
      let tempText = "";
      // Iterate over current attributes only (prevents deleted attributes from appearing)
      attributesList.forEach((attrName) => {
        const formatRule = getMapValueForAttributeName(attributeFormats, attrName);
        if (formatRule) {
          // Normalize first (unescape any already-escaped quotes), then escape all quotes
          // This prevents double-escaping when format rules contain \" from the original OCA file
          // Only escape double quotes for the DSL; avoid escaping backslashes/hyphens
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
        const attr = attributeRowData.find(a => a.Attribute === item);
        const isRequired = attr?.Required;
        conformanceText += ` ${item}=${isRequired ? "M" : "O"}`;
      });
      if (conformanceText !== "") {
        buildText += `ADD CONFORMANCE ATTRS${conformanceText}\n`;
      }
    }

    // Add Cardinality Overlay
    buildText += "# Add Cardinality Overlay\n";
    if (overlaySelections[FIELD_CARDINALITY_OVERLAY] && Object.keys(attributeCardinality).length > 0) {
      let cardinalityText = "";
      // Iterate over current attributes only (prevents deleted attributes from appearing)
      attributesList.forEach((attrName) => {
        const cardinalityValue = getMapValueForAttributeName(attributeCardinality, attrName);
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
        if (dataArray[languageIndex][index].Label && dataArray[languageIndex][index].Label !== "") {
          const escapedLabel = escapeForOCAString(normalizeEscapedQuotes(dataArray[languageIndex][index].Label));
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
          dataArray[languageIndex][index].Description !== "") {
          const escapedDescription = escapeForOCAString(normalizeEscapedQuotes(dataArray[languageIndex][index].Description));
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
      if (attributeListMap[item] && savedEntryCodes[item] && savedEntryCodes[item].length > 0) {
        const codes = savedEntryCodes[item].map((entry) => `"${entry.Code}"`).join(", ");
        entryCodesText += ` ${item}=[${codes}]`;
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
            const languageName = language.language;  // Use full name like "English"
            
            let entryString = "";
            for (const entry of savedEntryCodes[item]) {
              // Look up label using full language name
              const label = entry[languageName] || "";
              if (label) {
                entryString += `, "${entry.Code}": "${label}"`;
              }
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

    // Defensive validation: reject DSLs that contain a bare `ADD Attribute` line.
    // The OCA parser reports `expected attr_pairs` for `ADD Attribute` with no
    // following attribute=type pairs. If this happens, abort early and log the
    // full DSL so we can debug why attributes are missing from schema state.
    if (/^ADD Attribute\s*$/m.test(data)) {
      console.error("Generated DSL contains bare 'ADD Attribute' — aborting export. DSL follows:\n", data);
      throw new Error(
        "Export aborted: generated OCA DSL contains an empty `ADD Attribute` line. Please ensure the schema has attributes and try again. (DSL logged to console)"
      );
    }

    const filteredEntryCodes = {};
    Object.entries(attributeListMap).forEach(([attribute, isList]) => {
      if (isList && savedEntryCodes[attribute]) {
        filteredEntryCodes[attribute] = savedEntryCodes[attribute];
      }
    });

    const bundle = await generateOCABundle(data);

    const sensitiveAttributes = attributeRowData
      .filter((item) => item.Sensitive)
      .map((item) => item.Attribute);

    // Convert attributeFormats object to array format for helper functions
    const formatRuleRowData = attributeRowData.map(attr => ({
      Attribute: attr.Attribute,
      "Format Rule": getMapValueForAttributeName(attributeFormats, attr.Attribute) || ""
    }));

    // Convert attributeRanges object to array format for helper functions
    const rangeRowData = attributeRowData
      .filter(attr => attr.Type === "Numeric" || attr.Type === "DateTime")
      .map(attr => {
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

    const rangeOverlayInput = getRangeOverlayInput(rangeRowData, formatRuleRowData, attributesList);
    const retainedUniqueFramedUnits = unitFramedRowData.filter((row) => !row.deleted);

    const extension_overlay_object = {
      ordering_overlay: {
        type: ORDERING,
        attribute_ordering: attributesList,
        entry_code_ordering: getTransformedEntryCodes(filteredEntryCodes)
      },
      ...(overlaySelections[FIELD_UNIT_FRAMING_OVERLAY] && retainedUniqueFramedUnits.length > 0
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
      ...(overlaySelections[FIELD_RANGE_OVERLAY] && Object.keys(rangeOverlayInput).length > 0
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
                location: "https://raw.githubusercontent.com/FoodOntology/foodon/master/foodon.owl",
                version: "1.0"
              },
              attributes: getAttributeFramingInput(attributeFramingRowData, attributesList)
            }
          }
        : {}),
      ...(overlaySelections[FIELD_FORM_INFORMATION_OVERLAY]
        ? {
            form_overlay: {
              form_overlays: getFormInformationInput(schemaState.formBuilderPages || [], languages, schemaDescription, bundle.bundle.d)
            }
          }
        : {})
    };

    const extension_overlays = [extension_overlay_object];
    const extension = {
      extensions: {
        [ADC]: {
          [getPackageBundleId(bundle) || "bundle_id"]: extension_overlays
        }
      }
    };

    return { bundle, extension, textDSL: data };
  };

  // MAIN EXPORT FUNCTION
  const exportData = async () => {
    try {
      setError("");



      // For imported packages: Build ALL schemas from UI state to get fresh SAID digests
      // This matches agreeable-mushroom behavior - decompose bundle to UI state,
      // then rebuild from scratch which naturally generates new SAIDs
      if (ocaPackage) {
        const originalRootId = getPackageBundleId(ocaPackage);
        
        // CRITICAL: Ensure all schemas from OCA package are in schemaStates
        // If user only edited a child schema, the root might not be initialized
        const bundle = getPackageBundle(ocaPackage);
        const dependencies = getPackageDependencies(ocaPackage);
        
        // Check if root is initialized; if not, something is wrong
        const rootState = getSchemaById(originalRootId);
        
        if (!rootState || !rootState.initialized) {
          console.error("Root schema not initialized:", originalRootId);
          console.error("Available schemas:", Object.keys(schemaStates));
          throw new Error(`Root schema ${originalRootId} is not initialized. Please try reloading the schema.`);
        }
        
        const schemaIds = Object.keys(schemaStates).filter(id => {
          const state = getSchemaById(id);
          return state?.initialized;
        });
        
        // Verify originalRootId is in the list
        if (!schemaIds.includes(originalRootId)) {
          console.error("Root ID not in schemaStates:", originalRootId);
          console.error("Available:", schemaIds);
          throw new Error(`Root schema ID mismatch. Expected: ${originalRootId}`);
        }
        
        // Separate root from dependencies
        const dependencyIds = schemaIds.filter(id => id !== originalRootId);
        
        // Get original root schema to map child SAIDs to attribute names
        let originalRootSchema = null;
        if (ocaPackage) {
          originalRootSchema = findSchemaById(ocaPackage, originalRootId);
        }
        
        // Step 1: Build all dependency schemas FIRST to get their SAIDs
        const childSaidMap = {};
        const depResults = [];
        
        for (const depId of dependencyIds) {
          const depState = schemaStates[depId];
          // Skip empty schemas - they'll become refn: placeholders in parent
          if (!depState?.attributes || depState.attributes.length === 0) {
            continue;
          }
          
          const { bundle, extension, textDSL } = await buildPackageFromTextDSL(depId);
          const said = bundle?.bundle?.d;
          if (said) {
            // Map attribute names to child SAIDs
            if (originalRootSchema?.capture_base?.attributes) {
              Object.entries(originalRootSchema.capture_base.attributes).forEach(([attrName, attrValue]) => {
                const valueStr = Array.isArray(attrValue) ? attrValue[0] : attrValue;
                const extractedSaid = valueStr?.toString().match(/refs?n?:([^)]+)/)?.[1];
                if (extractedSaid === depId) {
                  childSaidMap[attrName] = said;
                }
              });
            }
            // Fallback for edge cases
            childSaidMap[depId] = said;
          }
          depResults.push({ schemaId: depId, bundle, extension, textDSL });
        }
        
        // Step 2: Build root schema WITH child SAIDs so it can use refs:SAID
        const { bundle: rootBundle, extension: rootExtension, textDSL: rootTextDSL } = 
          await buildPackageFromTextDSL(originalRootId, childSaidMap);

        if (!rootBundle) {
          throw new Error("Could not find root schema");
        }

        // Merge all extensions (root + all children) into one extension object
        const mergedExtension = {
          extensions: {
            adc: {
              ...rootExtension.extensions.adc, // Root schema extensions
              // Add all child schema extensions
              ...depResults.reduce((acc, dep) => {
                if (dep.extension?.extensions?.adc) {
                  return { ...acc, ...dep.extension.extensions.adc };
                }
                return acc;
              }, {})
            }
          }
        };

        // Collect child bundles for dependencies
        const childBundles = depResults.map(dep => dep.bundle.bundle);
        
        // Create bundle with dependencies
        const bundleWithDeps = {
          bundle: rootBundle.bundle,
          dependencies: childBundles
        };

        // Validate mergedExtension before handing to OcaPackage (catch malformed overlays early)
        const validateExtension = (ext) => {
          if (!ext || typeof ext !== 'object') throw new Error('extension must be an object');
          const adc = ext.extensions?.adc;
          if (!adc || typeof adc !== 'object') return; // nothing to validate
          Object.entries(adc).forEach(([schemaKey, overlays]) => {
            if (!overlays || (typeof overlays !== 'object' && !Array.isArray(overlays))) {
              throw new Error(`extensions.adc.${schemaKey} must be an object or array`);
            }
            const overlayArray = Array.isArray(overlays) ? overlays : [overlays];
            overlayArray.forEach((ov, idx) => {
              if (!ov || typeof ov !== 'object') throw new Error(`overlay at extensions.adc.${schemaKey}[${idx}] is not an object`);
              if (ov.form_overlay) {
                const fo = ov.form_overlay.form_overlays || ov.form_overlay.form_overlays;
                if (!Array.isArray(fo)) throw new Error('form_overlay.form_overlays must be an array');
                fo.forEach((page, pidx) => {
                  if (!page || typeof page !== 'object') throw new Error(`form_overlays[${pidx}] must be an object`);
                  if (page.labels && typeof page.labels === 'object') {
                    Object.entries(page.labels).forEach(([lang, label]) => {
                      if (typeof lang !== 'string') throw new Error('form overlay page label language key is not a string');
                      if (typeof label !== 'string') throw new Error(`form overlay page label for ${lang} must be a string`);
                    });
                  }
                });
              }
            });
          });
        };

        validateExtension(mergedExtension);
        // Use OcaPackage library to generate package with correct digests
        let exportPackage;
        try {
          const ocaPackageService = new OcaPackage(mergedExtension, bundleWithDeps);
          exportPackage = JSON.parse(ocaPackageService.GenerateOcaPackage());
        } catch (e) {
          console.error('Failed to generate OCA package from extension:', e, mergedExtension);
          throw new Error(`Failed to parse Extension JSON: ${e.message}`);
        }

        // Use root bundle for filename extraction
        const rootBundleData = rootBundle.bundle;
        
        // Extract schema name from meta overlays for filename
        const metaOverlays = rootBundleData?.overlays?.meta;
        const engMeta = Array.isArray(metaOverlays) 
          ? metaOverlays.find(m => m.language === 'eng') || metaOverlays[0]
          : null;
        const schemaName = engMeta?.name || getPackageBundleId(rootBundleData) || "schema";
        
        // Download OCA_package.json with regenerated digests
        const packageFileName = schemaName.split(" ")[0] + "_OCA_package.json";
        downloadJsonFile(exportPackage, packageFileName);
        
        // Generate README_OCA_schema.txt (schema name extracted from bundle automatically)
        if (rootBundleData?.overlays?.meta) {
          await jsonToTextFile(rootBundleData, exportPackage);
        }
        
        // Download OCA_bundle.json only on testing site
        if (currentEnv === "DEV" && rootBundleData) {
          const bundleFileName = schemaName.split(" ")[0] + "_OCA_bundle.json";
          downloadJsonFile(rootBundleData, bundleFileName);
        }
        
        return true;
      }

      // Determine the true root schema id from the package built from current editor state.
      // This ensures `Finish and Download` exports the full package (root + children)
      // even when the user is currently editing a child schema.
      const pkgFromState = rebuildOcaPackageFromEditorState(ocaPackage);
      const rootSchemaId = getPackageBundleId(pkgFromState) || currentSchemaId;

      const allSchemaIds = Object.keys(schemaStates);
      const childSchemaIds = allSchemaIds.filter((id) => id !== rootSchemaId);

      // Step 1: Build all child schemas first to get their SAIDs
      const childSaidMap = {};
      const childBundles = [];
      const childExtensions = []; // Store child extensions
      
      // Get root schema's original attributes to map child SAIDs to attribute names
      let originalRootSchema = null;
      if (ocaPackage) {
        originalRootSchema = findSchemaById(ocaPackage, rootSchemaId);
      }

      for (const childId of childSchemaIds) {
        const childState = schemaStates[childId];
        // Only build if the child has attributes (empty schemas become refn: placeholders)
        if (childState?.attributes && childState.attributes.length > 0) {
          const { bundle: childBundle, extension: childExtension } = await buildPackageFromTextDSL(childId);
          const said = childBundle?.bundle?.d;
          if (said) {
            // Map attribute names to child SAIDs instead of schema IDs to SAIDs
            // Check original root schema attributes to find which attribute(s) reference this child
            if (originalRootSchema?.capture_base?.attributes) {
              Object.entries(originalRootSchema.capture_base.attributes).forEach(([attrName, attrValue]) => {
                const valueStr = Array.isArray(attrValue) ? attrValue[0] : attrValue;
                const extractedSaid = valueStr?.toString().match(/refs?n?:([^)]+)/)?.[1];
                if (extractedSaid === childId) {
                  childSaidMap[attrName] = said;
                }
              });
            }
            // Also handle manually created schemas where childId === attributeName
            if (!originalRootSchema || childId === childId.toLowerCase() || childId.startsWith('q')) {
              childSaidMap[childId] = said;
            }
            
            childBundles.push(childBundle.bundle);
            childExtensions.push(childExtension);
          }
        }
      }

      // Step 2: Build root schema with child SAIDs (use rootSchemaId, not the currently open editor id)
      const { bundle, extension, textDSL } = await buildPackageFromTextDSL(rootSchemaId, childSaidMap);
      
      // Merge all extensions (root + all children)
      const mergedExtension = {
        extensions: {
          adc: {
            ...extension.extensions.adc, // Root schema extensions
            // Add all child schema extensions
            ...childExtensions.reduce((acc, childExt) => {
              if (childExt?.extensions?.adc) {
                return { ...acc, ...childExt.extensions.adc };
              }
              return acc;
            }, {})
          }
        }
      };
      
      // Create final package with root and dependencies
      const finalPackage = {
        bundle: bundle.bundle,
        dependencies: childBundles
      };
      
      // Merge extensions into the final package
      const validateExtension = (ext) => {
        if (!ext || typeof ext !== 'object') throw new Error('extension must be an object');
        const adc = ext.extensions?.adc;
        if (!adc || typeof adc !== 'object') return; // nothing to validate
        Object.entries(adc).forEach(([schemaKey, overlays]) => {
          if (!overlays || (typeof overlays !== 'object' && !Array.isArray(overlays))) {
            throw new Error(`extensions.adc.${schemaKey} must be an object or array`);
          }
          const overlayArray = Array.isArray(overlays) ? overlays : [overlays];
          overlayArray.forEach((ov, idx) => {
            if (!ov || typeof ov !== 'object') throw new Error(`overlay at extensions.adc.${schemaKey}[${idx}] is not an object`);
            if (ov.form_overlay) {
              const fo = ov.form_overlay.form_overlays || ov.form_overlay.form_overlays;
              if (!Array.isArray(fo)) throw new Error('form_overlay.form_overlays must be an array');
              fo.forEach((page, pidx) => {
                if (!page || typeof page !== 'object') throw new Error(`form_overlays[${pidx}] must be an object`);
                if (page.labels && typeof page.labels === 'object') {
                  Object.entries(page.labels).forEach(([lang, label]) => {
                    if (typeof lang !== 'string') throw new Error('form overlay page label language key is not a string');
                    if (typeof label !== 'string') throw new Error(`form overlay page label for ${lang} must be a string`);
                  });
                }
              });
            }
          });
        });
      };

      validateExtension(mergedExtension);
      let exportedPackageJson;
      try {
        const ocaPackageService = new OcaPackage(mergedExtension, { bundle: finalPackage.bundle, dependencies: finalPackage.dependencies });
        exportedPackageJson = JSON.parse(ocaPackageService.GenerateOcaPackage());
      } catch (e) {
        console.error('Failed to generate OCA package from extension:', e, mergedExtension);
        throw new Error(`Failed to parse Extension JSON: ${e.message}`);
      }

      try {
        if (finalPackage.bundle?.capture_base) {
          await jsonToTextFile(finalPackage.bundle, exportedPackageJson);
        }
      } catch (readmeError) {
        console.warn("Could not generate README:", readmeError);
      }

      const rootState = getSchemaById(rootSchemaId);
      const schemaNameForFile = rootState?.metadata?.name || rootState?.metadata?.localized?.eng?.name || null;

      downloadJsonFile(exportedPackageJson, getDescriptiveFileName(schemaNameForFile, "OCA_package.json"));

      if (currentEnv === "DEV") {
        downloadTextFile(textDSL, getDescriptiveFileName(schemaNameForFile, "OCA_file.txt"));
        downloadJsonFile(finalPackage, getDescriptiveFileName(schemaNameForFile, "OCA_bundle.json"));
      }

      return true;
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
    setIsZip(false);
    setOcaPackage(null);
    setOverlay(overlayItems);
    setSelectedOverlay("");
    
    clearAllSchemas();
    
    setCurrentPage("Landing");
    navigate("/");
  }, [
    setIsZip,
    setOcaPackage, setOverlay, setSelectedOverlay,
    clearAllSchemas, setCurrentPage, navigate
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
