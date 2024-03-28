import { useContext, useMemo } from "react";
import { Context } from "../App";
import { languageCodesObject } from "../constants/isoCodes";
import { divisionCodes, groupCodes } from "../constants/constants";

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
    customIsos,
    characterEncodingRowData,
    overlay,
  } = useContext(Context);

  //CAPTURE SHEET DESCRIPTIONS DATA
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
      languageCodesObject[language.toLowerCase()] ||
      customIsos[language.toLowerCase()];
    if (!languageObject.code) {
      languageObject.code = "unknown";
    }
    if (allLanguageCodes.includes(languageObject.code)) {
      let number = 2;
      let newCode = languageObject.code + "_" + number;
      while (allLanguageCodes.includes(newCode)) {
        number++;
        newCode = languageObject.code + "_" + number;
      }
      languageObject.code = newCode;
    }
    allLanguageCodes.push(languageObject.code);
    languagesWithCode.push(languageObject);
  });
  OCADataArray.push(OCADescriptionData);

  //CAPTURE ATTRIBUTE SHEET DATA
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
      buildText += ` ${item}=${data[1][index].Type}`;
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

    languagesWithCode.forEach((language, _) => {
      const languageIndex = OCADataArray[0].findIndex(
        (obj) => obj.Language === language.language
      );

      buildText += `\nADD Meta ${language.code} PROPS`;
      buildText += ` name="${OCADataArray[0][languageIndex].Name}"`;
      buildText += ` description="${OCADataArray[0][languageIndex].Description}"`;
    });

    buildText += `\n`;
    return buildText;
  };

  const buildFormatText = () => {
    let buildText = "# Add Format Overlay\n";

    let tempText = '';
    formatRuleRowData.forEach((item, index) => {
      if (item['FormatText']) {
        tempText += ` ${attributesList[index]}="${item['FormatText']}"`;
      }
    });

    if (tempText !== '') {
      buildText += "ADD Format ATTRS";
      buildText += tempText;
      buildText += "\n";
    }

    return buildText;
  };

  const buildConformanceText = () => {
    let buildText = "# Add Conformance Overlay\n";
    let conformanceText = '';

    attributesList.forEach((item, index) => {
      if (overlay["Make selected entries required"].selected) {
        conformanceText += ` ${item}=${characterEncodingRowData[index]['Make selected entries required'] ? "M" : "O"}`;
      }
    });
    if (conformanceText !== '') {
      buildText += `ADD CONFORMANCE ATTRS${conformanceText}\n`;
    }
    return buildText;
  };

  const buildLabelText = (data) => {
    let buildText = "# Add label overlay";

    languagesWithCode.forEach((language, _) => {
      let labelText = "";
      attributesList.forEach((item, index) => {
        const languageIndex =
          data
            .slice(1)
            .findIndex(
              (element) => element[0].Language === language.language
            ) + 1;
        if (data[languageIndex][index].Label && data[languageIndex][index].Label !== '') {
          labelText += ` ${item}="${data[languageIndex][index].Label}"`;
        }
      });
      if (labelText !== "") {
        buildText += `\nADD Label ${language.code} ATTRS${labelText}`;
      }
    });

    buildText += `\n`;
    return buildText;
  };

  const buildInformationText = (data) => {
    let buildText = "# Add information overlay";

    languagesWithCode.forEach((language, _) => {
      let infoText = "";
      attributesList.forEach((item, index) => {
        const languageIndex =
          data
            .slice(1)
            .findIndex(
              (element) => element[0].Language === language.language
            ) + 1;
        if (data[languageIndex][index].Description && data[languageIndex][index].Description !== '') {

          infoText += ` ${item}="${data[languageIndex][index].Description}"`;
        }
      });
      if (infoText !== "") {
        buildText += `\nADD Information ${language.code} ATTRS${infoText}`;
      }
    });

    buildText += `\n`;
    return buildText;
  };

  const buildEntryCodeText = () => {
    let buildText = "# Add entry code overlay\n";
    // buildText += "ADD ENTRY_CODE ATTRS";

    let entryCodesText = '';
    attributesList.forEach((item, _) => {
      let entryCodes = '';
      if (savedEntryCodes[item]) {
        for (const entry of savedEntryCodes[item]) {
          entryCodes += (', "' + entry.Code + '"');
        }
        entryCodesText += ` ${item}=[${entryCodes.slice(2)}]`;
      }
    });

    if (entryCodesText !== '') {
      buildText += `ADD ENTRY_CODE ATTRS${entryCodesText}\n`;

      languagesWithCode.forEach((language, _) => {
        buildText += `ADD ENTRY ${language.code} ATTRS`;
        attributesList.forEach((item, _) => {
          if (savedEntryCodes[item]) {
            let entryString = '';
            for (const entry of savedEntryCodes[item]) {
              entryString += (', "' + entry.Code + '": "' + entry[language.language] + '"');
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
    buildText += "ADD Unit si ATTRS";

    attributesList.forEach((item, index) => {
      buildText += ` ${item}=${data[1][index].Unit}`;
    });

    buildText += `\n`;
    return buildText;
  };

  const buildCharacterEncodingText = (data) => {
    let buildText = "# Add character encoding\n";
    buildText += "ADD CHARACTER_ENCODING ATTRS";

    attributesList.forEach((item, index) => {
      if (characterEncodingRowData?.[index] && characterEncodingRowData?.[index]?.['Character Encoding']) {
        buildText += ` ${item}="${characterEncodingRowData[index]['Character Encoding']}"`;
      } else {
        buildText += ` ${item}="${(data[1][index].Type === 'Array[Binary]' || data[1][index].Type === 'Binary') ? 'base64' : 'utf-8'}"`;
      };
    });

    buildText += `\n`;
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
    // buildBodyText += buildUnitsText(data);
    buildBodyText += buildCharacterEncodingText(data);

    return buildBodyText;
  };

  const exportData = async () => {
    const data = buildOCAText(OCADataArray);

    const blob = new Blob([data], { type: 'text/plain' });

    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = 'ocafile.txt';
    document.body.appendChild(a);
    a.click();

    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return {
    exportData
  };
};

export default useExportLogicV2;