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
  overlayItems,
  SCHEMA_MODE_SINGLE
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
    formBuilderPages,
    // Setters needed for resetToDefaults
    setFileData,
    setIsZip,
    setRawFile,
    setSchemaMode,
    setOverlay,
    setSelectedOverlay,
    setCurrentPage
  } = useContext(Context);

  const { getCurrentSchemaId, getSchema, getSchemaById, getAttributesList, pkgBuildFromState, schemaStates, currentSchemaId: activeSchemaId, clearAllSchemas, pkgUpload, setPkgUpload } = useMultiSchema();
  const currentSchemaId = getCurrentSchemaId();
  const schemaState = getSchema();
  const metadata = schemaState?.metadata || {};

  // All schema-specific data comes from MultiSchemaContext only
  const languages = metadata.languages || ["English"];
  const attributeRowData = schemaState?.attributes || [];
  const attributesList = getAttributesList(); // Computed from attributes
  const lanAttributeRowData = schemaState?.lanAttributeRowData || {};
  const savedEntryCodes = schemaState?.entryCodes || {};
  const attributeFormats = schemaState?.attributeFormats || {};
  const characterEncodingRowData = schemaState?.characterEncodingData || {};
  const attributeCardinality = schemaState?.attributeCardinality || {};
  const attributeRanges = schemaState?.attributeRanges || {};
  const attributeFramingRowData = schemaState?.attributeFramingData || [];
  const currentUnitFramedRowData = schemaState?.unitFramedData || [];

  // REMOVED: schemaDescription - no longer needed, schema name extracted from bundles directly
  
  const { jsonToTextFile } = useGenerateTextReadmeFromJson();
  const [error, setError] = useState("");

  const attributeListMap = attributeRowData.reduce((acc, attr) => {
    acc[attr.Attribute] = attr.List;
    return acc;
  }, {});

  const classificationCode = useMemo(() => {
    return metadata?.classification || null;
  }, [metadata?.classification]);

  // Check if schema has nested child schemas (refs: or refn: types, or "Child Schema" display format)
  const hasNestedSchemas = useMemo(() => {
    return attributeRowData.some((attr) => {
      const type = attr.Type;
      return typeof type === "string" && (
        type.startsWith("refs:") || 
        type.startsWith("refn:") || 
        type === "Child Schema" || 
        type === "Array[Child Schema]"
      );
    });
  }, [attributeRowData]);

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
  const buildPackageFromTextDSL = async (targetSchemaId, childSaidMap = {}) => {
    const targetState = getSchemaById(targetSchemaId);
    const targetMetadata = targetState?.metadata || {};
    
    // Extract data from target schema state
    const targetLanguages = targetMetadata.languages || ["English"];
    const targetAttributeRowData = targetState?.attributes || [];
    // Always derive attributesList from attributes array - it's the source of truth
    const targetAttributesList = targetAttributeRowData.map(attr => attr.Attribute);
    
    const targetLanAttributeRowData = targetState?.lanAttributeRowData || {};
    const targetSavedEntryCodes = targetState?.entryCodes || {};
    const targetAttributeFormats = targetState?.attributeFormats || {};
    const targetCharacterEncodingRowData = targetState?.characterEncodingData || {};
    const targetAttributeCardinality = targetState?.attributeCardinality || {};
    const targetAttributeRanges = targetState?.attributeRanges || {};
    const targetAttributeFramingRowData = targetState?.attributeFramingData || [];
    const targetUnitFramedRowData = targetState?.unitFramedData || [];
    const targetOverlaySelections = targetState?.overlaySelections || overlay;
    
    // Get the actual schema from pkgUpload to find reference types
    let targetSchema = null;
    if (pkgUpload) {
      targetSchema = findSchemaById(pkgUpload, targetSchemaId);
    }
    
    // Build schemaDescription for target
    const targetSchemaDescription = {};
    targetLanguages.forEach((language) => {
      const langCodeOCA = langCodeOCAFromName(language);
      const localized = targetMetadata.localized?.[langCodeOCA] || {};
      targetSchemaDescription[language] = {
        name: localized.name || targetMetadata.name || "",
        description: localized.description || targetMetadata.description || ""
      };
    });
    
    const targetAttributeListMap = targetAttributeRowData.reduce((acc, attr) => {
      acc[attr.Attribute] = attr.List;
      return acc;
    }, {});
    
    // Prepare OCA data array for target schema
    const OCADataArray = [];
    const descriptionRow = targetLanguages.map((language) => ({
      Language: language,
      Name: targetSchemaDescription[language]?.name || "",
      Description: targetSchemaDescription[language]?.description || ""
    }));
    OCADataArray.push(descriptionRow);

    targetLanguages.forEach((language) => {
      const rowData = [];
      const lanRows = targetLanAttributeRowData[language] || [];
      targetAttributeRowData.forEach((attrRow, index) => {
        const rowObject = { Language: language, Attribute: attrRow.Attribute || "" };
        const lanRow = lanRows[index] || {};
        rowObject.Flagged = attrRow.Flagged ? "Y" : "";
        rowObject.Unit = attrRow.Unit || "";
        // Keep "Child Schema" type as-is; conversion to refs:/refn: happens at DSL generation
        rowObject.Type = attrRow.Type || "";
        
        rowObject.Label = lanRow.Label || "";
        rowObject.Description = lanRow.Description || "";
        rowObject.List = lanRow.List || (attrRow.List ? "" : "Not a List");
        rowObject.Language = language;
        rowData.push(rowObject);
      });
      OCADataArray.push(rowData);
    });
    
    // Build text DSL for target schema (inline simplified version)
    const OCADescriptionData = OCADataArray[0];
    const languagesWithCode = [];
    const allLanguageCodes = [];

    targetLanguages.forEach((language) => {
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
    buildText += "# add attributes (capture base) \n";
    buildText += "ADD Attribute";
    targetAttributesList.forEach((item, index) => {
      let attributeType = Array.isArray(OCADataArray[1][index].Type)
        ? `Array[${OCADataArray[1][index].Type[0]}]`
        : OCADataArray[1][index].Type;
      
      // Convert "Child Schema" UI type to OCA spec refs:/refn: format
      // - refs:SAID = child schema with cryptographic identifier (has been built)
      // - refn:name = named reference placeholder (not yet built)
      const isArray = attributeType === "Array[Child Schema]";
      const isChildSchema = attributeType === "Child Schema" || isArray;
      
      if (isChildSchema) {
        const originalValue = targetSchema?.capture_base?.attributes?.[item];
        const childSaid = childSaidMap[item];
        
        if (childSaid) {
          // Child schema was pre-built, use its SAID
          attributeType = isArray ? `Array[refs:${childSaid}]` : `refs:${childSaid}`;
        } else if (originalValue && typeof originalValue === 'string' && (originalValue.startsWith('refs:') || originalValue.startsWith('refn:'))) {
          // Use existing refs:/refn: from original schema
          attributeType = originalValue;
        } else if (originalValue && Array.isArray(originalValue) && originalValue[0]?.startsWith?.('refs:') || originalValue?.[0]?.startsWith?.('refn:')) {
          // Array of references from original schema
          attributeType = `Array[${originalValue[0]}]`;
        } else {
          // Fallback: named reference placeholder (child not yet built)
          attributeType = isArray ? `Array[refn:${item}]` : `refn:${item}`;
        }
      }
      
      buildText += ` ${item}=${attributeType}`;
    });
    buildText += "\n";

    // Add classification
    buildText += "# Add classification\n";
    if (classificationCode) {
      buildText += `ADD classification ${classificationCode}`;
      buildText += "\n";
    }

    // Add meta overlay
    buildText += "# Add meta overlay";
    languagesWithCode.forEach((language) => {
      const languageIndex = OCADescriptionData.findIndex(
        (obj) => obj.Language === language.language
      );
      const parsedDescription = normalizeEscapedQuotes(OCADescriptionData[languageIndex].Description || "");
      const escapedDescription = escapeForOCAString(parsedDescription);
      buildText += `\nADD Meta ${language.code} PROPS`;
      buildText += ` name="${escapeForOCAString(normalizeEscapedQuotes(OCADescriptionData[languageIndex].Name || ""))}"`;
      buildText += ` description="${escapedDescription}"`;
    });
    buildText += "\n";

    // Add Format Overlay
    buildText += "# Add Format Overlay\n";
    if (targetOverlaySelections[FIELD_FORMAT_OVERLAY] && Object.keys(targetAttributeFormats).length > 0) {
      let tempText = "";
      // Filter to only include attributes that exist in the current schema
      Object.entries(targetAttributeFormats).forEach(([attrName, formatRule]) => {
        if (formatRule && targetAttributesList.includes(attrName)) {
          // Normalize first (unescape any already-escaped quotes), then escape all quotes
          // This prevents double-escaping when format rules contain \" from the original OCA file
          const escapedRule = escapeForOCAString(normalizeEscapedQuotes(formatRule));
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
    if (targetOverlaySelections["Make selected entries required"]) {
      let conformanceText = "";
      // Required status is stored in the attributes array
      targetAttributesList.forEach((item) => {
        const attr = targetAttributeRowData.find(a => a.Attribute === item);
        const isRequired = attr?.Required;
        conformanceText += ` ${item}=${isRequired ? "M" : "O"}`;
      });
      if (conformanceText !== "") {
        buildText += `ADD CONFORMANCE ATTRS${conformanceText}\n`;
      }
    }

    // Add Cardinality Overlay
    buildText += "# Add Cardinality Overlay\n";
    if (targetOverlaySelections[FIELD_CARDINALITY_OVERLAY] && Object.keys(targetAttributeCardinality).length > 0) {
      let cardinalityText = "";
      Object.entries(targetAttributeCardinality).forEach(([attrName, cardinalityValue]) => {
        if (cardinalityValue && attrName) {
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
      targetAttributesList.forEach((item, index) => {
        const languageIndex =
          OCADataArray
            .slice(1)
            .findIndex((element) => element[0].Language === language.language) + 1;
        if (OCADataArray[languageIndex][index].Label && OCADataArray[languageIndex][index].Label !== "") {
          const escapedLabel = escapeForOCAString(normalizeEscapedQuotes(OCADataArray[languageIndex][index].Label));
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
      targetAttributesList.forEach((item, index) => {
        const languageIndex =
          OCADataArray
            .slice(1)
            .findIndex((element) => element[0].Language === language.language) + 1;
        if (
          OCADataArray[languageIndex][index].Description && 
          OCADataArray[languageIndex][index].Description !== "") {
          const escapedDescription = escapeForOCAString(normalizeEscapedQuotes(OCADataArray[languageIndex][index].Description));
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
    targetAttributesList.forEach((item) => {
      if (targetAttributeListMap[item] && targetSavedEntryCodes[item] && targetSavedEntryCodes[item].length > 0) {
        const codes = targetSavedEntryCodes[item].map((entry) => `"${entry.Code}"`).join(", ");
        entryCodesText += ` ${item}=[${codes}]`;
      }
    });
    
    if (entryCodesText !== "") {
      buildText += `ADD ENTRY_CODE ATTRS${entryCodesText}\n`;
      
      // Then add ENTRY language overlays with code-to-label mappings
      languagesWithCode.forEach((language) => {
        let entryText = "";
        targetAttributesList.forEach((item) => {
          if (targetSavedEntryCodes[item] && targetSavedEntryCodes[item].length > 0) {
            // Entry codes are stored with FULL language names (English, French, etc.)
            // NOT 3-letter OCA codes (eng, fra)
            const languageName = language.language;  // Use full name like "English"
            
            let entryString = "";
            for (const entry of targetSavedEntryCodes[item]) {
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

    // Add character encoding overlay
    buildText += "# Add character encoding overlay\n";
    if (targetOverlaySelections[FIELD_CHARACTER_ENCODING_OVERLAY]) {
      let encodingText = "";
      let hasEncoding = false;
      
      targetAttributesList.forEach((item, index) => {
        // Use actual data from characterEncodingRowData, matching agreeable-mushroom
        const encoding = targetCharacterEncodingRowData[index]?.[FIELD_CHARACTER_ENCODING_OVERLAY];
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

    const filteredEntryCodes = {};
    Object.entries(targetAttributeListMap).forEach(([attribute, isList]) => {
      if (isList && targetSavedEntryCodes[attribute]) {
        filteredEntryCodes[attribute] = targetSavedEntryCodes[attribute];
      }
    });

    const bundle = await generateOCABundle(data);

    const sensitiveAttributes = targetAttributeRowData
      .filter((item) => item.Flagged)
      .map((item) => item.Attribute);

    // Convert attributeFormats object to array format for helper functions
    const targetFormatRuleRowData = targetAttributeRowData.map(attr => ({
      Attribute: attr.Attribute,
      "Format Rule": targetAttributeFormats[attr.Attribute] || ""
    }));

    // Convert attributeRanges object to array format for helper functions
    const targetRangeRowData = targetAttributeRowData
      .filter(attr => attr.Type === "Numeric" || attr.Type === "DateTime")
      .map(attr => {
        const range = targetAttributeRanges[attr.Attribute] || {};
        return {
          Attribute: attr.Attribute,
          Type: attr.Type,
          FormatRule: targetAttributeFormats[attr.Attribute] || "",
          LowerBound: range.lower || "",
          UpperBound: range.upper || "",
          LowerInclusive: range.lower_inclusive ?? false,
          UpperInclusive: range.upper_inclusive ?? false
        };
      });

    const rangeOverlayInput = getRangeOverlayInput(targetRangeRowData, targetFormatRuleRowData, targetAttributesList);
    const retainedUniqueFramedUnits = targetUnitFramedRowData.filter((row) => !row.deleted);

    const extension_overlay_object = {
      ordering_overlay: {
        type: ORDERING,
        attribute_ordering: targetAttributesList,
        entry_code_ordering: getTransformedEntryCodes(filteredEntryCodes)
      },
      ...(targetOverlaySelections[FIELD_UNIT_FRAMING_OVERLAY] && retainedUniqueFramedUnits.length > 0
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
      ...(targetOverlaySelections[FIELD_RANGE_OVERLAY] && Object.keys(rangeOverlayInput).length > 0
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
      ...(targetOverlaySelections[FIELD_ATTRIBUTE_FRAMING_OVERLAY]
        ? {
            attribute_framing_overlay: {
              type: ATTRIBUTE_FRAMING,
              framing_metadata: {
                id: "FOODON",
                label: "Food Ontology",
                location: "https://raw.githubusercontent.com/FoodOntology/foodon/master/foodon.owl",
                version: "1.0"
              },
              attributes: getAttributeFramingInput(targetAttributeFramingRowData, targetAttributesList)
            }
          }
        : {}),
      ...(targetOverlaySelections[FIELD_FORM_INFORMATION_OVERLAY]
        ? {
            form_overlay: {
              form_overlays: formBuilderPages.map((page) => ({
                type: FORM,
                ...page,
                schemaName: targetSchemaDescription[targetLanguages[0]]?.name || targetMetadata.name || "",
                schemaDigest: bundle.bundle.d
              }))
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
      if (pkgUpload) {
        const originalRootId = getPackageBundleId(pkgUpload);
        
        // CRITICAL: Ensure all schemas from OCA package are in schemaStates
        // If user only edited a child schema, the root might not be initialized
        const bundle = getPackageBundle(pkgUpload);
        const dependencies = getPackageDependencies(pkgUpload);
        
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
        
        // Step 1: Build all dependency schemas FIRST to get their SAIDs
        const childSaidMap = {};
        const depResults = [];
        
        for (const depId of dependencyIds) {
          const { bundle, extension, textDSL } = await buildPackageFromTextDSL(depId);
          const said = bundle?.bundle?.d;
          if (said) {
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

        // Use OcaPackage library to generate package with correct digests
        const ocaPackageService = new OcaPackage(mergedExtension, bundleWithDeps);
        const exportPackage = JSON.parse(ocaPackageService.GenerateOcaPackage());
        
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

      const allSchemaIds = Object.keys(schemaStates);
      const childSchemaIds = allSchemaIds.filter(id => id !== currentSchemaId);
      
      // Step 1: Build all child schemas first to get their SAIDs
      const childSaidMap = {};
      const childBundles = [];
      const childExtensions = []; // Store child extensions
      
      for (const childId of childSchemaIds) {
        const childState = schemaStates[childId];
        // Only build if the child has been initialized (user actually created it)
        if (childState?.initialized || (childState?.attributes && childState.attributes.length > 0)) {
          const { bundle: childBundle, extension: childExtension } = await buildPackageFromTextDSL(childId);
          const said = childBundle?.bundle?.d;
          if (said) {
            childSaidMap[childId] = said;
            childBundles.push(childBundle.bundle);
            childExtensions.push(childExtension);
          }
        }
      }
      
      // Step 2: Build root schema with child SAIDs
      const { bundle, extension, textDSL } = await buildPackageFromTextDSL(currentSchemaId, childSaidMap);
      
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
      const ocaPackageService = new OcaPackage(mergedExtension, { bundle: finalPackage.bundle, dependencies: finalPackage.dependencies });
      const ocaPackage = JSON.parse(ocaPackageService.GenerateOcaPackage());

      // Generate and download text readme (schema name extracted from bundle automatically)
      try {
        if (finalPackage.bundle?.capture_base) {
          await jsonToTextFile(finalPackage.bundle, ocaPackage);
        }
      } catch (readmeError) {
        console.warn("Could not generate README:", readmeError);
      }

      // Get schema name for filenames (extract from metadata)
      const schemaNameForFile = metadata?.name || metadata?.localized?.eng?.name || null;

      // Download files
      downloadJsonFile(ocaPackage, getDescriptiveFileName(schemaNameForFile, "OCA_package.json"));

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
    // Clear legacy Context state
    setFileData([]);
    setIsZip(false);
    setRawFile([]);
    setPkgUpload(null);
    setSchemaMode(SCHEMA_MODE_SINGLE);
    setOverlay(overlayItems);
    setSelectedOverlay("");
    
    // Clear MultiSchemaContext state (all schema data now managed here)
    clearAllSchemas();
    
    setCurrentPage("Landing");
    navigate("/");
  }, [
    setFileData, setIsZip, setRawFile,
    setPkgUpload, setSchemaMode, setOverlay, setSelectedOverlay,
    clearAllSchemas, setCurrentPage, navigate
  ]);

  return {
    exportData,
    error,
    clearError: () => setError(""),
    hasNestedSchemas,
    isImportedPackage: !!pkgUpload,
    resetToDefaults
  };
};

export default useOCAExport;
