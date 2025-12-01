import { useContext, useMemo, useState } from "react";
import { OcaPackage } from "oca_package";
import { Context } from "../App";
import { useMultiSchema } from "../context/MultiSchemaContext";
import { languageCodesObject } from "../constants/isoCodes";
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
} from "../constants/utils";
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
  const { getCurrentSchemaId, getSchemaState, exportSchemaChanges } = useMultiSchema();
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
      const langKey = language.toLowerCase().substring(0, 3);
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

  // TEXT DSL GENERATION (from useExportLogicV2)
  const buildOCAText = (data) => {
    const OCADescriptionData = data[0];
    const OCADataArray = data;
    
    const languagesWithCode = [];
    const allLanguageCodes = [];

    languages.forEach((language) => {
      const languageObject = {};
      languageObject.language = language;
      languageObject.code =
        languageCodesObject[language.toLowerCase()] ||
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
    attributesList.forEach((item, index) => {
      const attributeType = Array.isArray(data[1][index].Type)
        ? `Array[${data[1][index].Type[0]}]`
        : data[1][index].Type;
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
    if (overlay[FIELD_FORMAT_OVERLAY].selected) {
      let tempText = "";
      formatRuleRowData.forEach((item, index) => {
        const formatRule = item[CUSTOM_FORMAT_RULE] || item.FormatText;
        if (formatRule) {
          tempText += ` ${attributesList[index]}="${formatRule.replace(/"/g, '\\"')}"`;
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
    let conformanceText = "";
    attributesList.forEach((item, index) => {
      if (overlay["Make selected entries required"].selected) {
        conformanceText += ` ${item}=${characterEncodingRowData[index]["Make selected entries required"] ? "M" : "O"}`;
      }
    });
    if (conformanceText !== "") {
      buildText += `ADD CONFORMANCE ATTRS${conformanceText}\n`;
    }

    // Add label overlay
    buildText += "# Add label overlay";
    languagesWithCode.forEach((language) => {
      let labelText = "";
      attributesList.forEach((item, index) => {
        const languageIndex =
          data.slice(1).findIndex((element) => element[0].Language === language.language) + 1;
        if (data[languageIndex][index].Label && data[languageIndex][index].Label !== "") {
          labelText += ` ${item}="${data[languageIndex][index].Label}"`;
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
      let infoText = "";
      attributesList.forEach((item, index) => {
        const languageIndex =
          data.slice(1).findIndex((element) => element[0].Language === language.language) + 1;
        if (data[languageIndex][index].Description && data[languageIndex][index].Description !== "") {
          const parsedDescription = data[languageIndex][index].Description
            .replace(/"/g, '\\"')
            .replace(/'/g, "\\'");
          infoText += ` ${item}="${parsedDescription}"`;
        }
      });
      if (infoText !== "") {
        buildText += `\nADD Information ${language.code} ATTRS${infoText}`;
      }
    });
    buildText += "\n";

    // Add entry code overlay
    buildText += "# Add entry code overlay\n";
    let entryCodesText = "";
    attributesList.forEach((item) => {
      let entryCodes = "";
      if (attributeListMap[item] && savedEntryCodes[item]) {
        for (const entry of savedEntryCodes[item]) {
          entryCodes += `, "${entry.Code}"`;
        }
        entryCodesText += ` ${item}=[${entryCodes.slice(2)}]`;
      }
    });
    if (entryCodesText !== "") {
      buildText += `ADD ENTRY_CODE ATTRS${entryCodesText}\n`;
      languagesWithCode.forEach((language) => {
        buildText += `ADD ENTRY ${language.code} ATTRS`;
        attributesList.forEach((item) => {
          if (savedEntryCodes[item]) {
            let entryString = "";
            for (const entry of savedEntryCodes[item]) {
              entryString += `, "${entry.Code}": "${entry[language.language]}"`;
            }
            buildText += ` ${item}={${entryString.slice(2)}}`;
          }
        });
        buildText += "\n";
      });
    }

    // Add cardinality overlay
    buildText += "# Add cardinality overlay\n";
    if (overlay.Cardinality.selected) {
      let isAdd = false;
      let buildNewText = "";
      if (cardinalityData.length > 0) {
        cardinalityData.forEach((item) => {
          if (item.EntryLimit && item.EntryLimit !== "") {
            isAdd = true;
            buildNewText += ` ${item.Attribute}="${item.EntryLimit}"`;
          }
        });
      }
      if (isAdd) {
        buildText += "ADD CARDINALITY ATTRS";
        buildText += buildNewText;
        buildText += "\n";
      }
    }

    // Add units overlay
    buildText += "# Add units overlay\n";
    let isAdd = false;
    let buildNewText = "";
    attributesList.forEach((item, index) => {
      if (data[1][index].Unit && data[1][index].Unit !== "undefined") {
        isAdd = true;
        buildNewText += ` ${item}="${data[1][index].Unit}"`;
      }
    });
    if (isAdd) {
      buildText += "ADD Unit ATTRS";
      buildText += buildNewText;
      buildText += "\n";
    }

    // Add character encoding
    buildText += "# Add character encoding\n";
    isAdd = false;
    buildNewText = "";
    attributesList.forEach((item, index) => {
      if (
        characterEncodingRowData?.[index] &&
        characterEncodingRowData?.[index]?.["Character Encoding"]
      ) {
        isAdd = true;
        buildNewText += ` ${item}="${characterEncodingRowData[index]["Character Encoding"]}"`;
      }
    });
    if (isAdd) {
      buildText += "ADD CHARACTER_ENCODING ATTRS";
      buildText += buildNewText;
      buildText += "\n";
    }

    return buildText;
  };

  // Prepare OCA data array for text DSL generation
  const prepareOCADataArray = () => {
    const OCADataArray = [];
    const OCADescriptionData = [];

    // CAPTURE SHEET DESCRIPTIONS DATA
    languages.forEach((language) => {
      const rowObject = {};
      rowObject.Language = language;
      if (schemaDescription && schemaDescription[language]) {
        rowObject.Name = schemaDescription[language].name || "Unknown";
        rowObject.Description = schemaDescription[language].description || "Unknown";
      } else {
        rowObject.Name = "Unknown";
        rowObject.Description = "Unknown";
      }
      OCADescriptionData.push(rowObject);
    });
    OCADataArray.push(OCADescriptionData);

    // CAPTURE ATTRIBUTE SHEET DATA
    languages.forEach((language) => {
      const rowData = [];
      attributesList.forEach((item, index) => {
        const rowObject = {};
        rowObject.Attribute = item;
        const attrRow = attributeRowData[index] || {};
        const lanRows = lanAttributeRowData?.[language] || [];
        const lanRow = lanRows[index] || {};
        rowObject.Flagged = attrRow.Flagged ? "Y" : "";
        rowObject.Unit = attrRow.Unit || "";
        rowObject.Type = attrRow.Type || "";
        rowObject.Label = lanRow.Label || "";
        rowObject.Description = lanRow.Description || "";
        rowObject.List = lanRow.List || (attrRow.List ? "" : "Not a List");
        rowObject.Language = language;
        rowData.push(rowObject);
      });
      OCADataArray.push(rowData);
    });

    return OCADataArray;
  };

  // Build OCA package from current schema state using text DSL generation
  const buildPackageFromTextDSL = async () => {
    const OCADataArray = prepareOCADataArray();
    const data = buildOCAText(OCADataArray);

    const filteredEntryCodes = {};
    Object.entries(attributeListMap).forEach(([attribute, isList]) => {
      if (isList && savedEntryCodes[attribute]) {
        filteredEntryCodes[attribute] = savedEntryCodes[attribute];
      }
    });

    // Generate bundle from text DSL
    const bundle = await generateOCABundle(data);

    const sensitiveAttributes = attributeRowData
      .filter((item) => item.Flagged)
      .map((item) => item.Attribute);

    const rangeOverlayInput = getRangeOverlayInput(rangeRowData, formatRuleRowData);
    const retainedUniqueFramedUnits = currentUnitFramedRowData.filter((row) => !row.deleted);

    // Build extension overlays
    const extension_overlay_object = {
      ordering_overlay: {
        type: ORDERING,
        attribute_ordering: attributesList,
        entry_code_ordering: getTransformedEntryCodes(filteredEntryCodes)
      },
      ...(overlay["Unit Framing"].selected && {
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
      }),
      ...(overlay[FIELD_RANGE_OVERLAY].selected && {
        range_overlay: {
          type: RANGE,
          attributes: rangeOverlayInput
        }
      }),
      ...(sensitiveAttributes.length > 0 && {
        sensitive_overlay: {
          type: SENSITIVE,
          sensitive_attributes: sensitiveAttributes
        }
      }),
      ...(overlay["Attribute Framing"].selected &&
        Object.keys(getAttributeFramingInput(attributeFramingRowData)).length > 0 && {
          attribute_framing_overlay: {
            type: ATTRIBUTE_FRAMING,
            framing_metadata: {
              id: "FOODON",
              label: "Food Ontology",
              location: "https://raw.githubusercontent.com/FoodOntology/foodon/master/foodon.owl",
              version: "1.0"
            },
            attributes: getAttributeFramingInput(attributeFramingRowData)
          }
        }),
      ...(overlay[FIELD_FORM_INFORMATION_OVERLAY].selected &&
        formBuilderPages &&
        formBuilderPages.length > 0 && {
          form_overlay: {
            type: FORM,
            ...getFormInformationInput(
              formBuilderPages,
              languages,
              schemaDescription,
              bundle.bundle.d
            )
          }
        })
    };

    const extension_overlays = [extension_overlay_object];
    const extension = {
      extensions: {
        [ADC]: {
          [bundle?.bundle?.d || "bundle_id"]: extension_overlays
        }
      }
    };

    // Validate bundle structure before creating package
    if (!bundle || !bundle.bundle || !bundle.bundle.capture_base) {
      throw new Error("Invalid bundle structure - missing capture_base");
    }

    return { bundle, extension, textDSL: data };
  };

  // MAIN EXPORT FUNCTION
  const exportData = async () => {
    try {
      setError("");

      // For imported packages: Use exportSchemaChanges to merge edits into existing structure
      if (OCAPackage) {
        const exportPackage = exportSchemaChanges(OCAPackage);
        
        // Handle both package formats: {bundle: ...} and {oca_bundle: {bundle: ...}}
        const bundle = exportPackage.oca_bundle?.bundle || exportPackage.bundle;
        
        // Extract schema name from meta overlays for filename
        const metaOverlays = bundle?.overlays?.meta;
        const engMeta = Array.isArray(metaOverlays) 
          ? metaOverlays.find(m => m.language === 'eng') || metaOverlays[0]
          : null;
        const schemaName = engMeta?.name || bundle?.d || "schema";
        
        // Download OCA_package.json (the exportPackage already has the correct structure)
        const packageFileName = schemaName.split(" ")[0] + "_OCA_package.json";
        downloadJsonFile(exportPackage, packageFileName);
        
        // Generate README_OCA_schema.txt
        if (bundle?.overlays?.meta) {
          await jsonToTextFile(bundle, exportPackage);
        }
        
        // Download OCA_bundle.json only on testing site
        if (currentEnv === "DEV" && bundle) {
          const bundleFileName = schemaName.split(" ")[0] + "_OCA_bundle.json";
          downloadJsonFile(bundle, bundleFileName);
        }
        
        return true;
      }

      // For manual creation (flat OR nested): Build from text DSL + use exportSchemaChanges for child schemas
      const { bundle, extension, textDSL } = await buildPackageFromTextDSL();
      
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
          await jsonToTextFile(finalPackage.bundle, ocaPackage);
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
