import { useContext, useMemo, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { OcaPackage } from "oca_package";
import { Context } from "../App";
import { useMultiSchema } from "../context/MultiSchemaContext";
import { getOCACodeFromLangName, getUICodeFromLangName } from "../utils/languageUtils";
import { getPackageBundle, getPackageDependencies, findSchemaById, getPackageBundleId } from "../utils/packageUtils";
import {
  ADC,
  CUSTOM_FORMAT_RULE,
  divisionCodes,
  groupCodes,
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
  getFormInformationInput
} from "../utils/helpers";
import useGenerateReadMeV2 from "../ViewSchema/useGenerateReadMeV2";

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
    OCAPackage,
    formBuilderPages,
    // Setters needed for resetToDefaults
    setFileData,
    setAttributesList,
    setSchemaDescription,
    setLanguages,
    setAttributeRowData,
    setEntryCodeRowData,
    setLanAttributeRowData,
    setAttributesWithLists,
    setSavedEntryCodes,
    setIsZip,
    setRawFile,
    setOCAPackage,
    setSchemaMode,
    setOverlay,
    setSelectedOverlay,
    setCurrentPage
  } = useContext(Context);

  // Get schema-specific data from MultiSchemaContext (single source of truth)
  const { getCurrentSchemaId, getSchemaState, exportSchemaChanges, schemaStates, currentSchemaId: activeSchemaId, clearAllSchemas } = useMultiSchema();
  const currentSchemaId = getCurrentSchemaId();
  const schemaState = getSchemaState(currentSchemaId);
  const metadata = schemaState?.metadata || {};

  // All schema-specific data comes from MultiSchemaContext only
  const languages = metadata.languages || ["English"];
  const attributeRowData = schemaState?.attributes || [];
  const attributesList = schemaState?.attributesList || [];
  const lanAttributeRowData = schemaState?.lanAttributeRowData || {};
  const savedEntryCodes = schemaState?.entryCodes || {};
  const formatRuleRowData = schemaState?.formatRuleData || [];
  const characterEncodingRowData = schemaState?.characterEncodingData || {};
  const cardinalityData = schemaState?.cardinalityData || [];
  const rangeRowData = schemaState?.rangeData || [];
  const attributeFramingRowData = schemaState?.attributeFramingData || [];
  const currentUnitFramedRowData = schemaState?.unitFramedData || [];

  // Build schemaDescription from MultiSchemaContext metadata
  const schemaDescription = useMemo(() => {
    const result = {};
    languages.forEach((language) => {
      const langKey = getOCACodeFromLangName(language);
      const localized = metadata.localized?.[langKey] || {};
      result[language] = {
        name: localized.name || metadata.name || "",
        description: localized.description || metadata.description || ""
      };
    });
    return result;
  }, [languages, metadata]);

  const { jsonToTextFile } = useGenerateReadMeV2();
  const [error, setError] = useState("");

  const attributeListMap = attributeRowData.reduce((acc, attr) => {
    acc[attr.Attribute] = attr.List;
    return acc;
  }, {});

  const classificationCode = useMemo(() => {
    if (groupCodes[divisionGroup.group]) {
      return groupCodes[divisionGroup.group];
    }
    return divisionCodes[divisionGroup.division];
  }, [divisionGroup.division, divisionGroup.group]);

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
    const targetState = getSchemaState(targetSchemaId);
    const targetMetadata = targetState?.metadata || {};
    
    // Extract data from target schema state
    const targetLanguages = targetMetadata.languages || ["English"];
    const targetAttributeRowData = targetState?.attributes || [];
    // Always derive attributesList from attributes array - it's the source of truth
    const targetAttributesList = targetAttributeRowData.map(attr => attr.Attribute);
    
    // DEBUG: Log attribute sync state
    console.log('=== EXPORT DEBUG ===');
    console.log('Schema ID:', targetSchemaId);
    console.log('Attributes from state:', targetAttributeRowData.map(a => a.Attribute));
    console.log('AttributesList from state:', targetState?.attributesList);
    console.log('Derived attributesList:', targetAttributesList);
    console.log('Range data:', targetState?.rangeData?.map(r => ({ attr: r.Attribute, lower: r.LowerBound, upper: r.UpperBound })));
    console.log('Format data:', targetState?.formatRuleData?.map(f => ({ attr: f.Attribute, rule: f["Format Rule"] || f[CUSTOM_FORMAT_RULE] })));
    console.log('===================');
    
    const targetLanAttributeRowData = targetState?.lanAttributeRowData || {};
    const targetSavedEntryCodes = targetState?.entryCodes || {};
    const targetFormatRuleRowData = targetState?.formatRuleData || [];
    const targetCharacterEncodingRowData = targetState?.characterEncodingData || {};
    const cardinalityData = targetState?.cardinalityData || [];
    const targetRangeRowData = targetState?.rangeData || [];
    const targetAttributeFramingRowData = targetState?.attributeFramingData || [];
    const targetUnitFramedRowData = targetState?.unitFramedData || [];
    const targetOverlaySelections = targetState?.overlaySelections || overlay;
    
    // Get the actual schema from OCAPackage to find reference types
    let targetSchema = null;
    if (OCAPackage) {
      targetSchema = findSchemaById(OCAPackage, targetSchemaId);
    }
    
    // Build schemaDescription for target
    const targetSchemaDescription = {};
    targetLanguages.forEach((language) => {
      const langKey = getOCACodeFromLangName(language);
      const localized = targetMetadata.localized?.[langKey] || {};
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
        getUICodeFromLangName(language) ||
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
      const parsedDescription = OCADescriptionData[languageIndex].Description
        .replace(/"/g, '\\"')
        .replace(/'/g, "\\'");
      buildText += `\nADD Meta ${language.code} PROPS`;
      buildText += ` name="${OCADescriptionData[languageIndex].Name}"`;
      buildText += ` description="${parsedDescription}"`;
    });
    buildText += "\n";

    // Add Format Overlay
    buildText += "# Add Format Overlay\n";
    if (targetOverlaySelections[FIELD_FORMAT_OVERLAY]?.selected) {
      let tempText = "";
      // Filter to only include attributes that exist in the current schema
      const validFormatRules = targetFormatRuleRowData.filter(item => 
        targetAttributesList.includes(item.Attribute)
      );
      validFormatRules.forEach((item) => {
        const formatRule = item[CUSTOM_FORMAT_RULE] || item.FormatText || item["Format Rule"];
        if (formatRule && item.Attribute) {
          // Normalize first (unescape any already-escaped quotes), then escape all quotes
          // This prevents double-escaping when format rules contain \" from the original OCA file
          const escapedRule = formatRule.replace(/\\"/g, '"').replace(/"/g, '\\"');
          tempText += ` ${item.Attribute}="${escapedRule}"`;
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
    if (targetOverlaySelections["Make selected entries required"]?.selected) {
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
    if (targetOverlaySelections[FIELD_CARDINALITY_OVERLAY]?.selected && cardinalityData.length > 0) {
      let cardinalityText = "";
      cardinalityData.forEach((item) => {
        const cardinalityValue = item.Cardinality || item.EntryLimit;
        if (cardinalityValue && item.Attribute) {
          cardinalityText += ` ${item.Attribute}="${cardinalityValue}"`;
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
          OCADataArray.slice(1).findIndex((element) => element[0].Language === language.language) + 1;
        if (OCADataArray[languageIndex][index].Label && OCADataArray[languageIndex][index].Label !== "") {
          labelText += ` ${item}="${OCADataArray[languageIndex][index].Label}"`;
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
          OCADataArray.slice(1).findIndex((element) => element[0].Language === language.language) + 1;
        if (OCADataArray[languageIndex][index].Description && OCADataArray[languageIndex][index].Description !== "") {
          informationText += ` ${item}="${OCADataArray[languageIndex][index].Description}"`;
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
            // Entry codes are stored with 3-letter OCA language codes (eng, fra, etc.)
            // Get the proper 3-letter OCA code from schema language name
            const threeLetterCode = getOCACodeFromLangName(language.language);
            
            let entryString = "";
            for (const entry of targetSavedEntryCodes[item]) {
              // Look up label using 3-letter OCA code
              const label = entry[threeLetterCode] || "";
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
    if (targetOverlaySelections[FIELD_CHARACTER_ENCODING_OVERLAY]?.selected) {
      let encodingText = "";
      targetAttributesList.forEach((item, index) => {
        encodingText += ` ${item}=utf-8`;
      });
      if (encodingText !== "") {
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

    // Generate bundle from text DSL
    const bundle = await generateOCABundle(data);

    // Debug logging
    if (!bundle) {
      console.error("generateOCABundle returned null/undefined");
      console.error("Text DSL sent:", data);
      throw new Error("generateOCABundle returned empty response");
    }
    
    if (!bundle.bundle) {
      console.error("Bundle structure missing .bundle property:", bundle);
      throw new Error("Invalid bundle structure - missing .bundle property");
    }

    if (!bundle.bundle.capture_base) {
      console.error("Bundle missing capture_base:", bundle.bundle);
      throw new Error("Invalid bundle structure - missing capture_base");
    }

    const sensitiveAttributes = targetAttributeRowData
      .filter((item) => item.Flagged)
      .map((item) => item.Attribute);

    const rangeOverlayInput = getRangeOverlayInput(targetRangeRowData, targetFormatRuleRowData, targetAttributesList);
    const retainedUniqueFramedUnits = targetUnitFramedRowData.filter((row) => !row.deleted);

    const extension_overlay_object = {
      ordering_overlay: {
        type: ORDERING,
        attribute_ordering: targetAttributesList,
        entry_code_ordering: getTransformedEntryCodes(filteredEntryCodes)
      },
      ...(targetOverlaySelections[FIELD_UNIT_FRAMING_OVERLAY]?.selected && retainedUniqueFramedUnits.length > 0
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
      ...(targetOverlaySelections[FIELD_RANGE_OVERLAY]?.selected && Object.keys(rangeOverlayInput).length > 0
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
      ...(targetOverlaySelections[FIELD_ATTRIBUTE_FRAMING_OVERLAY]?.selected
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
      ...(targetOverlaySelections[FIELD_FORM_INFORMATION_OVERLAY]?.selected
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
          [bundle?.bundle?.d || "bundle_id"]: extension_overlays
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
      if (OCAPackage) {
        const originalRootId = getPackageBundleId(OCAPackage);
        const schemaIds = Object.keys(schemaStates);
        
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

        // Use OcaPackage library to generate package with correct digests
        const ocaPackageService = new OcaPackage(rootExtension, rootBundle);
        const exportPackage = JSON.parse(ocaPackageService.GenerateOcaPackage());
        
        // Use root bundle for filename extraction
        const bundle = rootBundle.bundle;
        
        // Extract schema name from meta overlays for filename
        const metaOverlays = bundle?.overlays?.meta;
        const engMeta = Array.isArray(metaOverlays) 
          ? metaOverlays.find(m => m.language === 'eng') || metaOverlays[0]
          : null;
        const schemaName = engMeta?.name || bundle?.d || "schema";
        
        // Download OCA_package.json with regenerated digests
        const packageFileName = schemaName.split(" ")[0] + "_OCA_package.json";
        downloadJsonFile(exportPackage, packageFileName);
        
        // Generate README_OCA_schema.txt
        if (bundle?.overlays?.meta) {
          await jsonToTextFile(bundle, exportPackage, schemaDescription);
        }
        
        // Download OCA_bundle.json only on testing site
        if (currentEnv === "DEV" && bundle) {
          const bundleFileName = schemaName.split(" ")[0] + "_OCA_bundle.json";
          downloadJsonFile(bundle, bundleFileName);
        }
        
        return true;
      }

      // For manual creation (flat OR nested): Build child schemas first to get SAIDs
      const rootSchemaId = currentSchemaId || "manual-creation-schema";
      const allSchemaIds = Object.keys(schemaStates);
      const childSchemaIds = allSchemaIds.filter(id => id !== rootSchemaId);
      
      // Step 1: Build all child schemas first to get their SAIDs
      const childSaidMap = {};
      const childBundles = [];
      
      for (const childId of childSchemaIds) {
        const childState = schemaStates[childId];
        // Only build if the child has been initialized (user actually created it)
        if (childState?.initialized || (childState?.attributes && childState.attributes.length > 0)) {
          const { bundle: childBundle } = await buildPackageFromTextDSL(childId);
          const said = childBundle?.bundle?.d;
          if (said) {
            childSaidMap[childId] = said;
            childBundles.push(childBundle.bundle);
          }
        }
      }
      
      // Step 2: Build root schema with child SAIDs
      const { bundle, extension, textDSL } = await buildPackageFromTextDSL(rootSchemaId, childSaidMap);
      
      // Create final package with root and dependencies
      const finalPackage = {
        bundle: bundle.bundle,
        dependencies: childBundles
      };
      
      // Merge extensions into the final package
      const ocaPackageService = new OcaPackage(extension, { bundle: finalPackage.bundle, dependencies: finalPackage.dependencies });
      const ocaPackage = JSON.parse(ocaPackageService.GenerateOcaPackage());

      // Generate and download text readme
      try {
        if (finalPackage.bundle?.capture_base) {
          await jsonToTextFile(finalPackage.bundle, ocaPackage, schemaDescription);
        }
      } catch (readmeError) {
        console.warn("Could not generate README:", readmeError);
      }

      // Download files
      downloadJsonFile(ocaPackage, getDescriptiveFileName(schemaDescription, "OCA_package.json"));

      if (currentEnv === "DEV") {
        downloadTextFile(textDSL, getDescriptiveFileName(schemaDescription, "OCA_file.txt"));
        downloadJsonFile(finalPackage, getDescriptiveFileName(schemaDescription, "OCA_bundle.json"));
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
    setAttributesList([]);
    setSchemaDescription({
      English: { name: "", description: "" }
    });
    setLanguages(["English"]);
    setAttributeRowData([]);
    setEntryCodeRowData([]);
    setLanAttributeRowData([]);
    setAttributesWithLists([]);
    setSavedEntryCodes({});
    setIsZip(false);
    setRawFile([]);
    setOCAPackage(null);
    setSchemaMode(SCHEMA_MODE_SINGLE);
    setOverlay(overlayItems);
    setSelectedOverlay("");
    
    // Clear MultiSchemaContext state (schema states and localStorage)
    clearAllSchemas();
    
    setCurrentPage("Landing");
    navigate("/");
  }, [
    setFileData, setAttributesList, setSchemaDescription, setLanguages,
    setAttributeRowData, setEntryCodeRowData, setLanAttributeRowData,
    setAttributesWithLists, setSavedEntryCodes, setIsZip, setRawFile,
    setOCAPackage, setSchemaMode, setOverlay, setSelectedOverlay,
    clearAllSchemas, setCurrentPage, navigate
  ]);

  return {
    exportData,
    error,
    clearError: () => setError(""),
    hasNestedSchemas,
    isImportedPackage: !!OCAPackage,
    resetToDefaults
  };
};

export default useOCAExport;
