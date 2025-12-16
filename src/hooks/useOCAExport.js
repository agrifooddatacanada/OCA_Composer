import { useContext, useMemo, useState } from "react";
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
  FIELD_FORM_INFORMATION_OVERLAY
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
 * Consolidates useExportLogicV2 and useMultiSchemaExport into single export system.
 */
const useOCAExport = () => {
  // Global settings (not schema-specific)
  const {
    divisionGroup,
    customIsos,
    overlay,
    OCAPackage,
    formBuilderPages
  } = useContext(Context);

  // Get schema-specific data from MultiSchemaContext (single source of truth)
  const { getCurrentSchemaId, getSchemaState, exportSchemaChanges, schemaStates, currentSchemaId: activeSchemaId } = useMultiSchema();
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
  const currentUnitFramedRowData = schemaState?.unitFramingData || [];

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
  const buildPackageFromTextDSL = async (targetSchemaId) => {
    const targetState = getSchemaState(targetSchemaId);
    const targetMetadata = targetState?.metadata || {};
    
    // Extract data from target schema state
    const targetLanguages = targetMetadata.languages || ["English"];
    const targetAttributeRowData = targetState?.attributes || [];
    const targetAttributesList = targetState?.attributesList || [];
    const targetLanAttributeRowData = targetState?.lanAttributeRowData || {};
    const targetSavedEntryCodes = targetState?.entryCodes || {};
    const targetFormatRuleRowData = targetState?.formatRuleData || [];
    const targetCharacterEncodingRowData = targetState?.characterEncodingData || {};
    const cardinalityData = targetState?.cardinalityData || [];
    const targetRangeRowData = targetState?.rangeData || [];
    const targetAttributeFramingRowData = targetState?.attributeFramingData || [];
    const targetUnitFramedRowData = targetState?.unitFramingData || [];
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
        
        // Convert "Child Schema" display type to OCA spec "Reference" type
        let attrType = attrRow.Type || "";
        if (attrType === "Child Schema") {
          attrType = "Reference";
        } else if (attrType === "Array[Child Schema]") {
          attrType = "Array[Reference]";
        }
        rowObject.Type = attrType;
        
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
      
      // Handle reference types - get actual refs:SAID or refn:name from original schema
      if (attributeType === "Reference" || attributeType === "Array[Reference]") {
        const originalValue = targetSchema?.capture_base?.attributes?.[item];
        if (originalValue) {
          // Use the actual refs:SAID or refn:name value from the schema
          if (Array.isArray(originalValue)) {
            // Array of references: ["refs:SAID"] or originalValue[0] is the ref string
            attributeType = `Array[${originalValue[0]}]`;
          } else {
            // Single reference: just the refs:SAID or refn:name string
            attributeType = originalValue;
          }
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
      targetFormatRuleRowData.forEach((item) => {
        const formatRule = item[CUSTOM_FORMAT_RULE] || item.FormatText || item["Format Rule"];
        if (formatRule && item.Attribute) {
          tempText += ` ${item.Attribute}="${formatRule.replace(/"/g, '\\"')}"`;
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

    const rangeOverlayInput = getRangeOverlayInput(targetRangeRowData, targetFormatRuleRowData);
    const retainedUniqueFramedUnits = targetUnitFramedRowData.filter((row) => !row.deleted);

    const extension_overlay_object = {
      ordering_overlay: {
        type: ORDERING,
        attribute_ordering: targetAttributesList,
        entry_code_ordering: getTransformedEntryCodes(filteredEntryCodes)
      },
      ...(targetOverlaySelections[FIELD_UNIT_FRAMING_OVERLAY]?.selected && retainedUniqueFramedUnits.length > 0
        ? [
            {
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
          ]
        : []),
      ...(targetOverlaySelections[FIELD_RANGE_OVERLAY]?.selected
        ? [
            {
              range_overlay: {
                type: RANGE,
                attributes: rangeOverlayInput
              }
            }
          ]
        : []),
      ...(sensitiveAttributes.length > 0
        ? [
            {
              sensitive_overlay: {
                type: SENSITIVE,
                sensitive_attributes: sensitiveAttributes
              }
            }
          ]
        : []),
      ...(targetOverlaySelections[FIELD_ATTRIBUTE_FRAMING_OVERLAY]?.selected
        ? [
            {
              attribute_framing_overlay: {
                type: ATTRIBUTE_FRAMING,
                attributes: getAttributeFramingInput(targetAttributeFramingRowData)
              }
            }
          ]
        : []),
      ...(targetOverlaySelections[FIELD_FORM_INFORMATION_OVERLAY]?.selected
        ? [
            {
              form_information_overlay: {
                type: FORM,
                pages: formBuilderPages.map((page) => ({
                  ...page,
                  schemaName: targetSchemaDescription[targetLanguages[0]]?.name || targetMetadata.name || "",
                  schemaDigest: bundle.bundle.d
                }))
              }
            }
          ]
        : [])
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
        // Build package for each schema from its UI state (generates fresh SAIDs)
        const schemaIds = Object.keys(schemaStates);
        const schemaResults = await Promise.all(
          schemaIds.map(async (schemaId) => {
            const { bundle, extension, textDSL } = await buildPackageFromTextDSL(schemaId);
            return { schemaId, bundle, extension, textDSL };
          })
        );

        // Find root schema (always use the original package root, not current view)
        const originalRootId = getPackageBundleId(OCAPackage);
        const rootResult = schemaResults.find(r => r.schemaId === originalRootId);
        const depResults = schemaResults.filter(r => r.schemaId !== originalRootId);

        if (!rootResult) {
          throw new Error("Could not find root schema");
        }

        // Build final export package with fresh SAIDs for all schemas
        const exportPackage = {
          oca_bundle: {
            bundle: rootResult.bundle.bundle,
            dependencies: depResults.map(dep => dep.bundle.bundle)
          },
          extensions: rootResult.extension.extensions
        };
        
        // Use root bundle for filename extraction
        const bundle = rootResult.bundle.bundle;
        
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

      // For manual creation (flat OR nested): Build from text DSL + use exportSchemaChanges for child schemas
      const { bundle, extension, textDSL } = await buildPackageFromTextDSL(currentSchemaId);
      
      // Create a temporary package structure for text DSL-based schema
      const tempPackage = {
        bundle: bundle.bundle,
        dependencies: []
      };
      
      // Use exportSchemaChanges to add any child schemas from MultiSchemaContext
      // This handles both manually created nested schemas AND manually created flat schemas
      const finalPackage = exportSchemaChanges(tempPackage) || tempPackage;
      
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

  return {
    exportData,
    error,
    clearError: () => setError(""),
    hasNestedSchemas,
    isImportedPackage: !!OCAPackage
  };
};

export default useOCAExport;
