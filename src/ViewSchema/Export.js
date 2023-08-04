import React, { useContext, useMemo, useState } from "react";
import { Button, Tooltip, Box } from "@mui/material";
import { Context } from "../App";
import { CustomPalette } from "../constants/customPalette";

import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import { dataFormatsArray, documentationArray } from "./documentationArray";
import { languageCodesObject } from "../constants/isoCodes";
import { divisionCodes, groupCodes } from "../constants/constants";

const ExcelJS = require("exceljs");

function columnToLetter(column) {
  var temp, letter = '';
  while (column > 0) {
    temp = (column - 1) % 26;
    letter = String.fromCharCode(temp + 65) + letter;
    column = (column - temp - 1) / 26;
  }
  return letter;
}

export default function Export({ setShowLink }) {
  const {
    languages,
    attributeRowData,
    lanAttributeRowData,
    attributesList,
    schemaDescription,
    divisionGroup,
    savedEntryCodes,
    setFileData,
    setAttributesList,
    setCurrentPage,
    setSchemaDescription,
    setLanguages,
    setAttributeRowData,
    setEntryCodeRowData,
    setLanAttributeRowData,
    setAttributesWithLists,
    setSavedEntryCodes,
    customIsos,
  } = useContext(Context);

  const classificationCode = useMemo(() => {
    if (groupCodes[divisionGroup.group]) {
      return groupCodes[divisionGroup.group];
    }

    return divisionCodes[divisionGroup.division];
  }, [divisionGroup.division, divisionGroup.group]);

  const [exportDisabled, setExportDisabled] = useState(false);

  const OCADataArray = [];

  //CAPTURE SHEET DESCRIPTIONS DATA
  const OCADescriptionData = [];

  languages.forEach((language) => {
    const rowObject = {};

    rowObject.Language = language;
    rowObject.Name = schemaDescription[language].name;
    rowObject.Description = schemaDescription[language].description;
    OCADescriptionData.push(rowObject);
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

  const handleOCAExport = (dataArray) => {
    const workbook = new ExcelJS.Workbook();

    const defaultColumnStyle = {
      alignment: {
        wrapText: true,
      },
    };

    const makeHeaderRow = (rowHeadersArray, worksheetName, columnWidth) => {
      const allColumns = [];
      rowHeadersArray.forEach((item, index) => {
        allColumns.push({ width: columnWidth, style: defaultColumnStyle });
        worksheetName.getCell(3, index + 1).value = item;
        worksheetName.getCell(3, index + 1).style = {
          wrapText: true,
          ...defaultColumnStyle,
        };
      });
      return allColumns;
    };

    //////CREATE 'READ ME' WORKSHEET
    const languagesWithCode = [];
    try {
      const worksheet = workbook.addWorksheet("READ ME");

      worksheet.columns = [
        {
          width: 2,
          style: defaultColumnStyle,
        },
        {
          width: 35,
          style: defaultColumnStyle,
        },
        {
          width: 35,
          style: defaultColumnStyle,
        },
        {
          width: 75,
          style: defaultColumnStyle,
        },
        {
          width: 35,
          style: defaultColumnStyle,
        },
        {
          width: 35,
          style: defaultColumnStyle,
        },
        {
          width: 35,
          style: defaultColumnStyle,
        },
        {
          width: 35,
          style: defaultColumnStyle,
        },
        {
          width: 35,
          style: defaultColumnStyle,
        },
        {
          width: 35,
          style: defaultColumnStyle,
        },
        {
          width: 35,
          style: defaultColumnStyle,
        },
        {
          width: 35,
          style: defaultColumnStyle,
        },
        {
          width: 35,
          style: defaultColumnStyle,
        },
      ];

      const titleCell = worksheet.getCell(1, 2);
      titleCell.value = "OCA DATA CAPTURE SPECIFICATION";
      titleCell.style.font = { bold: true };

      worksheet.mergeCells("B2:D2");
      worksheet.mergeCells("B3:D3");
      worksheet.mergeCells("B4:D4");
      worksheet.mergeCells("B5:D5");

      const userCell = worksheet.getCell(5, 2);
      userCell.value = "User Entry";
      userCell.style.font = { bold: true };

      worksheet.getCell(6, 3).value = OCADataArray[0][0].Name;
      worksheet.getCell(7, 3).value = OCADataArray[0][0].Description;

      //All language codes must be unique for export to work
      //Creates language codes for all custom languages

      const allLanguageCodes = [];
      languages.forEach((language) => {
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

      const cellDisplay = [
        {
          title: "Schema name: ",
          firstRow: 6,
        },
        {
          title: "Schema description: ",
          firstRow: 7,
        },
        {
          title: "User assigned identifier: ",
          firstRow: 9,
        },
        {
          title: "Lanuages(s) supported: ",
          firstRow: 11,
          data: languagesWithCode,
        },
        {
          title: "Last Updated: ",
          firstRow: 12 + languages.length,
          data: null,
        },
        {
          title: "Any questions, please contact: ",
          firstRow: 13 + languages.length,
          data: null,
        },
      ];

      cellDisplay.forEach((item) => {
        worksheet.getCell(item.firstRow, 2).value = item.title;
        if (Array.isArray(item.data)) {
          item.data.forEach((data, index) => {
            worksheet.getCell(
              item.firstRow + index,
              3
            ).value = `${data.language.replace(/\b\w/g, (match) =>
              match.toUpperCase()
            )} [${data.code}]`;
          });
        } else {
          if (item.data) {
            worksheet.getCell(item.firstRow, 3).value = item.data;
          }
        }
      });

      dataFormatsArray.forEach((item) => {
        const currentCell = worksheet.getCell(
          item.row + languages.length,
          item.column
        );
        currentCell.value = item.text;
      });

      const preDefinedTitleCell = worksheet.getCell(15 + languages.length, 2);
      preDefinedTitleCell.style.font = { bold: true };
      const documentationStartIndex = 32 + languages.length;

      documentationArray.forEach((item) => {
        const currentCell = worksheet.getCell(
          item.row + documentationStartIndex,
          item.column
        );
        currentCell.value = item.text;
      });

      const documentationTitle = worksheet.getCell(documentationStartIndex, 2);
      documentationTitle.style.font = { bold: true };

      const abbreviationsTitle = worksheet.getCell(
        30 + documentationStartIndex,
        2
      );
      abbreviationsTitle.style.font = { bold: true };

      worksheet.mergeCells(
        `B${documentationStartIndex + 2}:D${documentationStartIndex + 2}`
      );
      worksheet.mergeCells(
        `B${documentationStartIndex + 5}:B${documentationStartIndex + 8}`
      );
      worksheet.mergeCells(
        `B${documentationStartIndex + 14}:B${documentationStartIndex + 15}`
      );
      worksheet.mergeCells(
        `B${documentationStartIndex + 19}:B${documentationStartIndex + 26}`
      );

      for (let i = 30; i < 42; i++) {
        worksheet.mergeCells(
          `B${documentationStartIndex + i}:D${documentationStartIndex + i}`
        );
      }
      const linkCell = worksheet.getCell(documentationStartIndex + 41, 2);

      linkCell.value = {
        text: "© The Human Colossus Foundation 2022. Some rights reserved. This work is available under the CC BY-NC-SA 3.0 IGO licence.",
        hyperlink: "https://creativecommons.org/licenses/by-nc-sa/3.0/igo/",
      };
      linkCell.font = {
        color: { argb: "0563C1" },
        underline: true,
      };
    } catch (error) {
      console.error(error);
      console.log('Error creating "Start Here" page');
    }

    //////CREATE DATA WORKSHEET FOR ENTRY_CODE DROPDOWN MENUS
    try {
      const entryCodeOptionWorksheet = workbook.addWorksheet("options");
      attributesList.forEach((item, index) => {
        const codesArray = savedEntryCodes[item];
        if (codesArray) {
          let columnCounter = 1;
          for (const entryCodeOption of codesArray) {
            let languageCounter = 1;
            for (const lang of languagesWithCode) {
              entryCodeOptionWorksheet.getCell(2 * index + languageCounter, columnCounter).value = entryCodeOption[lang.language];
              languageCounter++;
            }
            columnCounter++;
          }
        }

      });
    } catch (error) {
      console.error(error);
    }

    //////CREATE 'MAIN' WORKSHEET
    try {
      const worksheetMain = workbook.addWorksheet("Main");
      const columnHeaders = [
        "CB-CL: Classification",
        "CB-AN: Attribute Name",
        "Attribute Type",
        "CB-AT: Attribute Type",
        "CB-FA: Flagged Attribute",
        "OL-CH: Character Encoding",
        "OL-FT: Format",
        "OL-EC: Entry Code",
        "OL-CN: Conformance",
        "OL-UT: Unit",
        "CB-RS: Reference",
      ];

      const allColumns = makeHeaderRow(columnHeaders, worksheetMain, 15);

      attributesList.forEach((item, index) => {
        const attributeCell = worksheetMain.getCell(index + 4, 2);
        attributeCell.value = item;
        const classificationCell = worksheetMain.getCell(index + 4, 1);
        classificationCell.value = {
          formula: `IF(B${index + 4}="", "", "${classificationCode}")`,
          result: attributeCell.value === "" ? "" : classificationCode,
        };
        const typeCell = worksheetMain.getCell(index + 4, 3);
        typeCell.value = dataArray[1][index].Type;
        typeCell.dataValidation = {
          type: "list",
          allowBlank: true,
          formulae: [
            '"Binary,Boolean,DateTime,Numeric,Reference,Text,Array[Binary],Array[Boolean],Array[DateTime],Array[Numeric],Array[Reference],Array[Text]"',
          ],
        };

        //typeCellAuto content is currently identical to the typeCell - the two cells should be linked on the Excel sheet, though, and not just here
        const typeCellAuto = worksheetMain.getCell(index + 4, 4);
        typeCellAuto.value = {
          formula: `IF(ISBLANK(C${index + 4}), "", C${index + 4})`,
          result: typeCell.value,
        };

        const flaggedCell = worksheetMain.getCell(index + 4, 5);
        flaggedCell.value = dataArray[1][index].Flagged;
        flaggedCell.dataValidation = {
          type: "list",
          allowBlank: true,
          formulae: ['"Y"'],
        };
        const encodingCell = worksheetMain.getCell(index + 4, 6);
        encodingCell.value = {
          formula: `IF(OR(C${index + 4}="Binary", C${index + 4
            }="Array[Binary]"), "base64", "utf-8")`,

          result:
            typeCell.value === "Binary" || typeCell.value === "Array[Binary]"
              ? "base64"
              : "utf-8",
        };

        const entryCodesCell = worksheetMain.getCell(index + 4, 8);

        const codesArray = savedEntryCodes[item];

        if (codesArray) {
          const codeDisplay = [];
          codesArray.forEach((code) => {
            codeDisplay.push(code.Code);
          });
          //This item has very specific quotes formatting to make the drop-down work in the Excel file
          const menuList = `"${codeDisplay.join(",")}"`;
          entryCodesCell.dataValidation = {
            type: "list",
            allowBlank: true,
            formulae: [menuList],
          };
        }

        const conformanceCell = worksheetMain.getCell(index + 4, 9);
        conformanceCell.dataValidation = {
          type: "list",
          allowBlank: true,
          formulae: ['"M,O"'],
        };

        worksheetMain.getCell(index + 4, 10).value = dataArray[1][index].Unit;

        const referenceCell = worksheetMain.getCell(index + 4, 11);
        if (
          typeCell.value === "Reference" ||
          typeCell.value === "Array[Reference]"
        ) {
          referenceCell.value = "Reference SAI";
        }
      });
      worksheetMain.columns = allColumns;
    } catch (error) {
      console.error(error);
      console.log('Error creating "Main" worksheet');
    }

    //////CREATE 'LANGUAGE' WORKSHEETS
    try {
      let doubleIndex = 1;
      console.log('languagesWithCode', languagesWithCode);
      languagesWithCode.forEach((language, langIndex) => {
        let worksheetLanguage;
        let worksheetName = language.code;
        try {
          if (worksheetName !== "unknown") {
            worksheetLanguage = workbook.addWorksheet(worksheetName);
          } else {
            worksheetName = `${worksheetName}_${doubleIndex}`;
            worksheetLanguage = workbook.addWorksheet(worksheetName);
            doubleIndex += 1;
          }
        } catch (error) {
          worksheetName = `${worksheetName}__${langIndex}`;
        }

        const englishHeaders = [
          "OL-MN: Meta [Meta attribute name]",
          "OL-MV: Meta [Meta attribute value]",
          "CB-AN: Attribute Name",
          "OL-LA: Label",
          "OL-EN: Entry",
          "OL-IN: Information",
        ];
        const frenchHeaders = [
          "OL-MN: Méta [Nom de l'attribut méta]",
          "OL-MV: Méta [Valeur de l'attribut méta]",
          "CB-AN: Nom d'attribut",
          "OL-LA: Étiquette",
          "OL-EN: Saisie",
          "OL-IN: Information",
        ];
        let allColumns;
        if (language.code === "fr") {
          allColumns = makeHeaderRow(frenchHeaders, worksheetLanguage, 30);
        } else {
          allColumns = makeHeaderRow(englishHeaders, worksheetLanguage, 30);
        }
        worksheetLanguage.columns = allColumns;
        const languageIndex = OCADataArray[0].findIndex(
          (obj) => obj.Language === language.language
        );
        worksheetLanguage.getCell(4, 1).value = "name";
        worksheetLanguage.getCell(5, 1).value = "description";

        worksheetLanguage.getCell(4, 2).value =
          OCADataArray[0][languageIndex].Name;
        worksheetLanguage.getCell(5, 2).value =
          OCADataArray[0][languageIndex].Description;

        attributesList.forEach((item, index) => {
          const languageIndex =
            dataArray
              .slice(1)
              .findIndex(
                (element) => element[0].Language === language.language
              ) + 1;

          worksheetLanguage.getCell(index + 4, 3).value = item;

          const labelCell = worksheetLanguage.getCell(index + 4, 4);
          labelCell.value = dataArray[languageIndex][index].Label;

          const entryCodesCell = worksheetLanguage.getCell(index + 4, 5);

          if (savedEntryCodes[item]) {
            const optionsIndex = 2 * index + (langIndex + 1);
            entryCodesCell.dataValidation = {
              type: "list",
              allowBlank: true,
              formulae: [`options!A${optionsIndex}:${columnToLetter(savedEntryCodes[item].length)}${optionsIndex}`],
            };
          }

          const descriptionCell = worksheetLanguage.getCell(index + 4, 6);
          descriptionCell.value = dataArray[languageIndex][index].Description;
        });
      });
    } catch (error) {
      console.error(error);
      console.log('Error creating "Language" worksheets');
    }

    ////////CREATE WORKBOOK AND EXPORT
    const workbookName = `OCA_Template_${new Date().toISOString()}.xlsx`;

    try {
      workbook.xlsx.writeBuffer().then((buffer) => {
        const blob = new Blob([buffer], {
          type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = workbookName;
        a.click();
      });
      setShowLink(true);
      setExportDisabled(true);
      setTimeout(() => {
        setExportDisabled(false);
      }, 3000);
    } catch (error) {
      console.error(error);
    }
  };

  const resetToDefaults = () => {
    setFileData([]);
    setAttributesList([]);
    setCurrentPage("Start");
    setSchemaDescription({
      English: { name: "", description: "" },
    });
    setLanguages(["English"]);
    setAttributeRowData([]);
    setEntryCodeRowData([]);
    setLanAttributeRowData([]);
    setAttributesWithLists([]);
    setSavedEntryCodes({});
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",

        alignItems: "flex-end",
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          color: CustomPalette.GREY_600,
          mb: 5,
        }}
      >
        <Box sx={{ marginRight: "1rem" }}>
          <Tooltip
            title="Export your schema in an Excel format. This format includes all the information you’ve provided here. After you have created and downloaded the Excel schema template you can upload it into the SemanticEngine.org to create the machine-actionable OCA Schema Bundle."
            placement="left"
            arrow
          >
            <HelpOutlineIcon sx={{ fontSize: 15 }} />
          </Tooltip>
        </Box>
        <Button
          color="button"
          variant="contained"
          onClick={() => handleOCAExport(OCADataArray)}
          sx={{
            alignSelf: "flex-end",
            width: "12rem",
            display: "flex",
            justifyContent: "space-around",
            p: 1,
          }}
          disabled={exportDisabled}
        >
          Finish and Export <CheckCircleIcon />
        </Button>
      </Box>
      <Button
        color="warning"
        variant="outlined"
        onClick={() => resetToDefaults()}
        sx={{
          alignSelf: "flex-end",
          width: "20rem",
          display: "flex",
          justifyContent: "space-around",
          p: 1,
          mb: 5,
        }}
      >
        Clear All Data and Restart
      </Button>
    </Box>
  );
}
