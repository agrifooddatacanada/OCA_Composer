import { useContext, useMemo } from "react";
import { OcaPackage } from "oca_package";
import { Context } from "../App";
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
  SENSITIVE
} from "../constants/constants";
import {
  generateOCABundle,
  getDescriptiveFileName,
  getTransformedEntryCodes,
  getUnitFramingInput
} from "../constants/utils";
import useGenerateReadMeV2 from "./useGenerateReadMeV2";

const currentEnv = process.env.REACT_APP_ENV;

const useExportLogicV2 = () => {
  const {
    languages,
    attributeRowData,
    lanAttributeRowData,
    attributesList,
    schemaDescription,
    divisionGroup,
    savedEntryCodes,
    formatRuleRowData,
    unitFramedRowData,
    customIsos,
    characterEncodingRowData,
    overlay,
    cardinalityData
  } = useContext(Context);

  const { jsonToTextFile } = useGenerateReadMeV2();

  // CAPTURE SHEET DESCRIPTIONS DATA
  const OCADescriptionData = [];
  const OCADataArray = [];
  const languagesWithCode = [];
  const allLanguageCodes = [];

  const classificationCode = useMemo(() => {
    if (groupCodes[divisionGroup.group]) {
      return groupCodes[divisionGroup.group];
    }

    return divisionCodes[divisionGroup.division];
  }, [divisionGroup.division, divisionGroup.group]);

  languages.forEach((language) => {
    const rowObject = {};
    rowObject.Language = language;
    rowObject.Name = schemaDescription[language].name;
    rowObject.Description = schemaDescription[language].description;
    OCADescriptionData.push(rowObject);

    const languageObject = {};
    languageObject.language = language;
    languageObject.code =
      languageCodesObject[language.toLowerCase()] || customIsos[language.toLowerCase()];
    if (!languageObject.code) {
      languageObject.code = "unknown";
    }
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
  OCADataArray.push(OCADescriptionData);

  // CAPTURE ATTRIBUTE SHEET DATA
  languages.forEach((language) => {
    const rowData = [];
    attributesList.forEach((item, index) => {
      const rowObject = {};
      rowObject.Attribute = item;
      rowObject.Flagged = attributeRowData[index].Flagged ? "Y" : "";
      rowObject.Unit = attributeRowData[index].Unit;
      rowObject.Type = attributeRowData[index].Type;
      rowObject.Label = lanAttributeRowData[language][index].Label;
      rowObject.Description = lanAttributeRowData[language][index].Description;
      rowObject.List = lanAttributeRowData[language][index].List;
      rowObject.Language = language;
      rowData.push(rowObject);
    });
    OCADataArray.push(rowData);
  });

  const buildAttributesText = (data) => {
    let buildText = "# add attributes (capture base) \n";
    buildText += "ADD Attribute";

    attributesList.forEach((item, index) => {
      const attributeType = Array.isArray(data[1][index].Type)
        ? `Array[${data[1][index].Type[0]}]`
        : data[1][index].Type;
      buildText += ` ${item}=${attributeType}`;
    });

    buildText += "\n";
    return buildText;
  };

  const buildClassificationsText = () => {
    let buildText = "# TODO add classification\n";
    if (classificationCode) {
      buildText += `ADD classification ${classificationCode}`;
      buildText += "\n";
    }
    return buildText;
  };

  const buildMetaText = () => {
    let buildText = "# Add meta overlay";

    languagesWithCode.forEach((language) => {
      const languageIndex = OCADataArray[0].findIndex(
        (obj) => obj.Language === language.language
      );

      buildText += `\nADD Meta ${language.code} PROPS`;
      buildText += ` name="${OCADataArray[0][languageIndex].Name}"`;
      buildText += ` description="${OCADataArray[0][languageIndex].Description}"`;
    });

    buildText += "\n";
    return buildText;
  };

  const buildFormatText = () => {
    let buildText = "# Add Format Overlay\n";

    let tempText = "";
    formatRuleRowData.forEach((item, index) => {
      const formatRule = item[CUSTOM_FORMAT_RULE] || item.FormatText;
      if (formatRule) {
        // Any " in the format text needs to be escaped for OCA file
        // eslint-disable-next-line quotes
        tempText += ` ${attributesList[index]}="${formatRule.replace(/"/g, '\\"')}"`;
      }
    });

    if (tempText !== "") {
      buildText += "ADD Format ATTRS";
      buildText += tempText;
      buildText += "\n";
    }

    return buildText;
  };

  const buildConformanceText = () => {
    let buildText = "# Add Conformance Overlay\n";
    let conformanceText = "";

    attributesList.forEach((item, index) => {
      if (overlay["Make selected entries required"].selected) {
        conformanceText += ` ${item}=${characterEncodingRowData[index]["Make selected entries required"] ? "M" : "O"}`;
      }
    });
    if (conformanceText !== "") {
      buildText += `ADD CONFORMANCE ATTRS${conformanceText}\n`;
    }
    return buildText;
  };

  const buildLabelText = (data) => {
    let buildText = "# Add label overlay";

    languagesWithCode.forEach((language) => {
      let labelText = "";
      attributesList.forEach((item, index) => {
        const languageIndex =
          data
            .slice(1)
            .findIndex((element) => element[0].Language === language.language) + 1;
        if (data[languageIndex][index].Label && data[languageIndex][index].Label !== "") {
          labelText += ` ${item}="${data[languageIndex][index].Label}"`;
        }
      });
      if (labelText !== "") {
        buildText += `\nADD Label ${language.code} ATTRS${labelText}`;
      }
    });

    buildText += "\n";
    return buildText;
  };

  const buildInformationText = (data) => {
    let buildText = "# Add information overlay";

    languagesWithCode.forEach((language) => {
      let infoText = "";
      attributesList.forEach((item, index) => {
        const languageIndex =
          data
            .slice(1)
            .findIndex((element) => element[0].Language === language.language) + 1;
        if (
          data[languageIndex][index].Description &&
          data[languageIndex][index].Description !== ""
        ) {
          // Need to escape " and ' for OCA file
          const parsedDescription = data[languageIndex][index].Description
            // eslint-disable-next-line quotes
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
    return buildText;
  };

  const buildEntryCodeText = () => {
    let buildText = "# Add entry code overlay\n";
    // buildText += "ADD ENTRY_CODE ATTRS";

    let entryCodesText = "";
    attributesList.forEach((item) => {
      let entryCodes = "";
      if (savedEntryCodes[item]) {
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

    return buildText;
  };

  const buildUnitsText = (data) => {
    let buildText = "# Add units overlay\n";
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

    return buildText;
  };

  const buildCharacterEncodingText = () => {
    let buildText = "# Add character encoding\n";
    let isAdd = false;
    let buildNewText = "";

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

  const buildCardinalityText = () => {
    let buildText = "# Add cardinality overlay\n";

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

    return buildText;
  };

  const buildOCAText = (data) => {
    let buildBodyText = "";

    buildBodyText += buildAttributesText(data);
    buildBodyText += buildClassificationsText();
    buildBodyText += buildMetaText();
    buildBodyText += buildFormatText();
    buildBodyText += buildConformanceText();
    buildBodyText += buildLabelText(data);
    buildBodyText += buildInformationText(data);
    buildBodyText += buildEntryCodeText();
    buildBodyText += buildCardinalityText();
    buildBodyText += buildUnitsText(data);
    buildBodyText += buildCharacterEncodingText();

    return buildBodyText;
  };

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

  const exportData = async () => {
    const data = buildOCAText(OCADataArray);
    const bundle = await generateOCABundle(data);

    const sensitiveAttributes = attributeRowData
      .filter((item) => item.Flagged)
      .map((item) => item.Attribute);

    const extension = {
      extensions: {
        [ADC]: {
          [bundle.bundle.d]: [
            {
              ordering_overlay: {
                type: ORDERING,
                attribute_ordering: attributesList,
                entry_code_ordering: getTransformedEntryCodes(savedEntryCodes)
              }
            },
            {
              unit_framing_overlay: {
                type: UNIT_FRAMING,
                properties: {
                  id: UNIT_FRAME_ID,
                  label: UNIT_FRAME_LABEL,
                  location: UNIT_FRAME_LOCATION,
                  version: UNIT_FRAME_VERSION
                },
                units: getUnitFramingInput(unitFramedRowData)
              }
            },
            {
              sensitive_overlay: {
                type: SENSITIVE,
                sensitive_attributes: sensitiveAttributes
              }
            }
          ]
        }
      }
    };

    const ocaPackageService = new OcaPackage(extension, bundle);
    const ocaPackage = JSON.parse(ocaPackageService.GenerateOcaPackage());

    // Generate and download text readme
    jsonToTextFile(bundle.bundle, ocaPackage);

    downloadJsonFile(
      ocaPackage,
      getDescriptiveFileName(schemaDescription, "OCA_package.json")
    );

    // Download OCA file only on testing site
    if (currentEnv === "DEV") {
      downloadTextFile(data, getDescriptiveFileName(schemaDescription, "OCA_file.txt"));
    }

    // Download bundle only on testing site
    if (currentEnv === "DEV") {
      downloadJsonFile(
        bundle,
        getDescriptiveFileName(schemaDescription, "OCA_bundle.json")
      );
    }
  };

  return {
    exportData
  };
};

export default useExportLogicV2;
