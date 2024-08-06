import ExcelJS from "exceljs";
import JSZip from "jszip";
import { codesToLanguages } from "../constants/isoCodes";

// Custom error-handling function
function WorkbookError(message) {
  this.name = "WorkbookError";
  this.message = message;
  this.stack = new Error().stack;
}

function readJSON(originJsonData_jsonSaid, e) {
  try {
    const textDecoder = new TextDecoder("utf-8");
    const jsonString = textDecoder.decode(e.target.result);
    const rawJson = JSON.parse(jsonString);
    let json = rawJson?.["schema"]?.[0]
      ? rawJson?.["schema"]?.[0]
      : rawJson?.["bundle"]
      ? rawJson?.["bundle"]
      : rawJson;
    originJsonData_jsonSaid.jsonSaid = json.d;

    if (json.hasOwnProperty("capture_base")) {
      originJsonData_jsonSaid.originJsonData.push(json.capture_base);
    }
    if (json.hasOwnProperty("overlays")) {
      const overlays = json.overlays;
      for (const o in overlays) {
        if ((overlays[o].length !== undefined) & (overlays[o].length > 0)) {
          for (const oo in overlays[o]) {
            originJsonData_jsonSaid.originJsonData.push(overlays[o][oo]);
          }
        } else {
          originJsonData_jsonSaid.originJsonData.push(overlays[o]);
        }
      }
    }
  } catch (error) {
    throw new WorkbookError(".. Error in reading the json file ...");
  }
  return originJsonData_jsonSaid;
}

async function readZIP(originJsonData_jsonSaid, e) {
  try {
    const zip = await JSZip.loadAsync(e.target.result);
    for (const file of Object.values(zip.files)) {
      const loadData = await file.async("text");
      const parsedData = JSON.parse(loadData);
      originJsonData_jsonSaid.originJsonData.push(parsedData);
    }
  } catch (error) {
    throw new WorkbookError(".. Error in reading the zip file ...");
  }

  originJsonData_jsonSaid.jsonSaid = "unavailable";
  return originJsonData_jsonSaid;
}

WorkbookError.prototype = Object.create(Error.prototype);
WorkbookError.prototype.constructor = WorkbookError;

export async function CreateDataEntryExcel(data, selectedLang) {
  const DEFAULT_LANGUAGE = "en";

  if (selectedLang === "English") {
    selectedLang = DEFAULT_LANGUAGE;
  } else {
    selectedLang = Object.keys(codesToLanguages).find(
      (key) => codesToLanguages[key] === selectedLang
    );
  }

  const originJsonData_jsonSaid = { originJsonData: [], jsonSaid: "" };
  try {
    readJSON(originJsonData_jsonSaid, data);
  } catch (jsonError) {
    try {
      await readZIP(originJsonData_jsonSaid, data);
    } catch (zipError) {
      console.error("Error reading JSON or ZIP file:", zipError);
    }
  }

  const originJsonData = originJsonData_jsonSaid.originJsonData;

  // Re-organize the json data:
  let entryOverlays = [];
  let labelOverlays = [];
  let metaOverlays = [];
  let informationOverlays = [];
  const captureBaseOverlays = [];
  const unitOverlays = [];
  const conformanceOverlays = [];
  const entryCodeOverlays = [];
  const otherOverlays = [];

  // handle multiple languages:
  function handleMultipleLanguages(
    overlayName,
    selectedLang,
    DEFAULT_LANGUAGE,
    toUseOverlay
  ) {
    const allOverlays = originJsonData.filter(
      (o) => o.type && o.type.includes(overlayName)
    );

    if (allOverlays.length !== 0) {
      let selectedOverlay = false;

      if (selectedLang === DEFAULT_LANGUAGE) {
        const default_language_overlay = allOverlays.find((o) =>
          o.language.startsWith(DEFAULT_LANGUAGE)
        );
        if (default_language_overlay) {
          toUseOverlay.push(default_language_overlay);
          selectedOverlay = true;
        }
      } else {
        const selectedLanguageOverlay = allOverlays.find((o) =>
          o.language.startsWith(selectedLang)
        );
        if (selectedLanguageOverlay) {
          toUseOverlay.push(selectedLanguageOverlay);
          selectedOverlay = true;
        }

        if (!selectedOverlay) {
          const default_language_overlay = allOverlays.find((o) =>
            o.language.startsWith(DEFAULT_LANGUAGE)
          );
          if (default_language_overlay) {
            toUseOverlay.push(default_language_overlay);
            selectedOverlay = true;
          }
        }
      }
    }
    return toUseOverlay;
  }

  labelOverlays = handleMultipleLanguages(
    "/label/",
    selectedLang,
    DEFAULT_LANGUAGE,
    labelOverlays
  );
  entryOverlays = handleMultipleLanguages(
    "/entry/",
    selectedLang,
    DEFAULT_LANGUAGE,
    entryOverlays
  );
  informationOverlays = handleMultipleLanguages(
    "/information/",
    selectedLang,
    DEFAULT_LANGUAGE,
    informationOverlays
  );
  metaOverlays = handleMultipleLanguages(
    "/meta/",
    selectedLang,
    DEFAULT_LANGUAGE,
    metaOverlays
  );

  for (let i = 0; i < originJsonData.length; i++) {
    const overlay = originJsonData[i];
    if (overlay.type && overlay.type.includes("/capture_base/")) {
      captureBaseOverlays.push(overlay);
    } else if (overlay.type && overlay.type.includes("/unit/")) {
      if (Object.keys(overlay).includes("metric_system")) { // adjust of oca-file & oca-bundle json.
        unitOverlays.push(overlay);
      }
    } else if (overlay.type && overlay.type.includes("/conformance/")) {
      conformanceOverlays.push(overlay);
    } else if (overlay.type && overlay.type.includes("/entry_code/")) {
      entryCodeOverlays.push(overlay);
    } else {
      if (
        overlay.type &&
        !overlay.type.includes("/label/") &&
        !overlay.type.includes("/entry/") &&
        !overlay.type.includes("/information/") &&
        !overlay.type.includes("/meta/")
      ) {
        otherOverlays.push(overlay);
      }
    }
  }

  const jsonData = [
    ...captureBaseOverlays,
    ...labelOverlays,
    ...informationOverlays,
    ...unitOverlays,
    ...conformanceOverlays,
    ...entryOverlays,
    ...entryCodeOverlays,
    ...otherOverlays,
  ];

  // Step 3: Create a new Excel workbook
  const workbook = new ExcelJS.Workbook();

  // Step 4: Format function
  function formatFirstPage(cell) {
    cell.font = { size: 11, bold: true };
    cell.alignment = { vertical: "top", wrapText: false };
  }

  function formatHeader(cell) {
    cell.font = { size: 10, bold: true };
    cell.alignment = { vertical: "top", wrapText: true };
    cell.border = {
      top: { style: "thin" },
      bottom: { style: "thin" },
      right: { style: "thin" },
    };
  }

  function formatAttr(cell) {
    cell.font = { size: 10 };
    cell.alignment = { vertical: "top", wrapText: true };
    cell.border = { right: { style: "thin" } };
  }

  function formatDataHeader(cell) {
    cell.font = { size: 10 };
    cell.alignment = { vertical: "top", wrapText: true };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "E7E6E6" },
    };
    cell.border = {
      bottom: { style: "thin" },
      right: { style: "thin" },
    };
  }

  function formatLookupHeader(cell) {
    cell.font = { size: 10, bold: true };
    cell.alignment = { vertical: "top", wrapText: true };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "E7E6E6" },
    };
  }

  function formatLookupAttr(cell) {
    cell.font = { size: 10, bold: true };
    cell.alignment = { vertical: "top", wrapText: true };
  }

  function formatLookupValue(cell) {
    cell.font = { size: 10 };
    cell.alignment = { vertical: "top", wrapText: true };
  }

  // Create Schema Description sheet
  const sheet1 = workbook.addWorksheet("Schema Description");

  let schemaTitle = null,
    schemaDescription = null,
    schemaLanguage = null,
    schemaClassification = null,
    schemaSAID = null;

  try {
    schemaTitle = metaOverlays[0].name;
    schemaDescription = metaOverlays[0].description;
    schemaLanguage = metaOverlays[0].language;
    schemaClassification = jsonData.find(
      (o) => o.type && o.type.includes("/capture_base/")
    ).classification;
    schemaSAID = originJsonData_jsonSaid.jsonSaid;
  } catch (error) {
    throw new WorkbookError(".. Error in reading the meta overlay ...");
  }

  // Step 5: Schema Description Sheet Content
  sheet1.getCell(1,1).value = "This is an Excel workbook for data display and data entry.";
  formatFirstPage(sheet1.getCell(1, 1));

  sheet1.getCell(2,2).value = "This workbook has been prefilled with information to help users use the data. The prefilled information comes from a schema.";
  sheet1.getCell(3,2).value = "Enter or view your data in 'Data' while referencing 'Schema Description' for guidance.";

  sheet1.getCell(5, 1).value = "Schema details:";
  formatFirstPage(sheet1.getCell(5, 1));

  sheet1.getCell(6, 2).value = `Schema title: ${schemaTitle}`;
  sheet1.getCell(7, 2).value = `Schema description: ${schemaDescription}`;
  sheet1.getCell(8, 2).value = `Schema language: ${schemaLanguage}`;
  sheet1.getCell(9, 2).value = `Schema SAID: ${schemaSAID}`;
  sheet1.getCell(10, 2).value = `Schema classification: ${schemaClassification}`;

  sheet1.getCell(12,1).value = "What is a schema?";
  formatFirstPage(sheet1.getCell(12, 1));

  sheet1.getCell(13, 2).value = "A schema describes structures and rules of a dataset.";
  sheet1.getCell(14, 2).value = "Learn more and write your own schema at https://semanticengine.org";

  sheet1.getCell(16,1).value = "Schema Description:";
  formatFirstPage(sheet1.getCell(16, 1));
  sheet1.getCell(17,2).value = "Here is a table describing of each of the attributes which you will find on the Data sheet. This information has been supplied by your schema."

  // Step 6: Start the Workbook
  const shift = 17;

  try {
    sheet1.getColumn(1).width = 17;
    sheet1.getCell(shift + 1, 1).value = "Attribute Name";
    formatHeader(sheet1.getCell(shift + 1, 1));

    sheet1.getColumn(2).width = 24;
    sheet1.getCell(shift + 1, 2).value = "Attribute Type";
    formatHeader(sheet1.getCell(shift + 1, 2));

    sheet1.getColumn(3).width = 17;
    sheet1.getCell(shift + 1, 3).value = "Sensitive";
    formatHeader(sheet1.getCell(shift + 1, 3));
  } catch (error) {
    throw new WorkbookError(
      ".. Error in formatting sheet1 capture base header ..."
    );
  }

  const sheet2 = workbook.addWorksheet("Data");

  const attributesIndex = {};
  let attributeNames = null;
  const TypesOfLookUpEntries = {};

  jsonData.forEach((overlay) => {
    if (overlay.type && overlay.type.includes("/capture_base/")) {
      Object.entries(overlay.attributes).forEach(
        ([attrName, attrType], index) => {
          const attrIndex = index + 2;
          attributesIndex[[attrName, attrType]] = attrIndex;
          TypesOfLookUpEntries[attrName] = attrType;

          if (attrIndex !== undefined) {
            sheet1.getCell(shift + attrIndex, 1).value = attrName;
            formatAttr(sheet1.getCell(shift + attrIndex, 1));
          } else {
            throw new WorkbookError(".. Error check the attribute name ...");
          }

          if (attrIndex !== undefined) {
            sheet1.getCell(shift + attrIndex, 2).value = attrType;
            formatAttr(sheet1.getCell(shift + attrIndex, 2));
          } else {
            throw new WorkbookError(".. Error check the attribute type ...");
          }

          const isFlagged = overlay.flagged_attributes.includes(attrName);
          sheet1.getCell(shift + attrIndex, 3).value = isFlagged ? "Y" : "";
          formatAttr(sheet1.getCell(shift + attrIndex, 3));
        }
      );

      // Step 6.1: Data Entry sheet
      attributeNames = Object.keys(overlay.attributes);
      const numColumns = attributeNames.length;
      const columnWidth = 15;
      sheet2.getRow(1).values = attributeNames;
      for (let col = 0; col < numColumns; col++) {
        const cell = sheet2.getCell(1, col + 1);
        sheet2.getColumn(col + 1).width = columnWidth;
        formatDataHeader(cell);
      }
    }
  });

  let skipped = 0;
  const lookupEntries = {};

  jsonData.forEach((overlay, i) => {
    if (overlay.type && overlay.type.includes("/character_encoding/")) {
      try {
        sheet1.getColumn(i + 3 - skipped).width = 15;
        sheet1.getCell(shift + 1, i + 3 - skipped).value = "Character Encoding";
        formatHeader(sheet1.getCell(shift + 1, i + 3 - skipped));

        for (let row = 2; row <= attributeNames.length + 1; row++) {
          sheet1.getCell(shift + row, i + 3 - skipped).value = null;
          formatAttr(sheet1.getCell(shift + row, i + 3 - skipped));
        }

        for (let [attrName, encoding] of Object.entries(
          overlay.attribute_character_encoding
        )) {
          if (typeof encoding == "string") {
            const attrKeys = Object.keys(attributesIndex);
            const attrNameFromAttrKeys = attrKeys.map(
              (key) => key.split(",")[0]
            );
            const rowIndex = attrNameFromAttrKeys.indexOf(attrName) + 2;
            if (rowIndex) {
              sheet1.getCell(shift + rowIndex, i + 3 - skipped).value =
                encoding;
            }
          }
        }
      } catch (error) {
        throw new WorkbookError(
          ".. Error in formatting character encoding column (header and rows) ..."
        );
      }
    } else if (overlay.type && overlay.type.includes("/cardinality/")) {
      try {
        sheet1.getColumn(i + 3 - skipped).width = 15;
        sheet1.getCell(shift + 1, i + 3 - skipped).value = "Cardinality";
        formatHeader(sheet1.getCell(shift + 1, i + 3 - skipped));

        for (let row = 2; row <= attributeNames.length + 1; row++) {
          sheet1.getCell(shift + row, i + 3 - skipped).value = null;
          formatAttr(sheet1.getCell(shift + row, i + 3 - skipped));
        }

        for (let [attrName, cardinality] of Object.entries(
          overlay.attribute_cardinality
        )) {
          const attrKeys = Object.keys(attributesIndex);
          const attrNameFromAttrKeys = attrKeys.map((key) => key.split(",")[0]);
          const rowIndex = attrNameFromAttrKeys.indexOf(attrName) + 2;
          if (rowIndex) {
            sheet1.getCell(shift + rowIndex, i + 3 - skipped).value =
              cardinality;
          }
        }
      } catch (error) {
        throw new WorkbookError(
          ".. Error in formatting cardinality column (header and rows) ..."
        );
      }
    } else if (overlay.type && overlay.type.includes("/conformance/")) {
      try {
        sheet1.getColumn(i + 3 - skipped).width = 15;
        sheet1.getCell(shift + 1, i + 3 - skipped).value = "Required";
        formatHeader(sheet1.getCell(shift + 1, i + 3 - skipped));

        for (let row = 2; row <= attributeNames.length + 1; row++) {
          sheet1.getCell(shift + row, i + 3 - skipped).value = null;
          formatAttr(sheet1.getCell(shift + row, i + 3 - skipped));
        }

        for (let [attrName, conformance] of Object.entries(
          overlay.attribute_conformance
        )) {
          if (conformance === "M") {
            conformance = "Y";
          } else if (conformance === "O") {
            conformance = " ";
          }

          const attrKeys = Object.keys(attributesIndex);
          const attrNameFromAttrKeys = attrKeys.map((key) => key.split(",")[0]);
          const rowIndex = attrNameFromAttrKeys.indexOf(attrName) + 2;
          if (rowIndex) {
            sheet1.getCell(shift + rowIndex, i + 3 - skipped).value =
              conformance;
          }
        }
      } catch (error) {
        throw new WorkbookError(
          ".. Error in formatting conformance column (header and rows) ..."
        );
      }
    } else if (overlay.type && overlay.type.includes("/conditional/")) {
      try {
        sheet1.getColumn(i + 3 - skipped).width = 15;
        sheet1.getCell(shift + 1, i + 3 - skipped).value =
          "Conditional [Condition]";
        formatHeader(sheet1.getCell(shift + 1, i + 3 - skipped));

        sheet1.getColumn(i + 5 - skipped).width = 15;
        sheet1.getCell(shift + 1, i + 5 - skipped).value =
          "Conditional [Dependecies]";
        formatHeader(sheet1.getCell(shift + 1, i + 5 - skipped));

        for (let row = 2; row <= attributeNames.length + 1; row++) {
          sheet1.getCell(shift + row, i + 3 - skipped).value = null;
          sheet1.getCell(shift + row, i + 5 - skipped).value = null;
          formatAttr(sheet1.getCell(shift + row, i + 3 - skipped));
          formatAttr(sheet1.getCell(shift + row, i + 5 - skipped));
        }

        for (let [attrName, condition] of Object.entries(
          overlay.attribute_conditions
        )) {
          const attrKeys = Object.keys(attributesIndex);
          const attrNameFromAttrKeys = attrKeys.map((key) => key.split(",")[0]);
          const rowIndex = attrNameFromAttrKeys.indexOf(attrName) + 2;
          if (rowIndex) {
            sheet1.getCell(shift + rowIndex, i + 3 - skipped).value = condition;
          }
        }

        for (let [attrName, dependencies] of Object.entries(
          overlay.attribute_dependencies
        )) {
          const attrKeys = Object.keys(attributesIndex);
          const attrNameFromAttrKeys = attrKeys.map((key) => key.split(",")[0]);
          const rowIndex = attrNameFromAttrKeys.indexOf(attrName) + 2;
          if (rowIndex) {
            sheet1.getCell(shift + rowIndex, i + 5 - skipped).value =
              dependencies.join(",");
          }
        }

        skipped -= 1;
      } catch (error) {
        throw new WorkbookError(
          ".. Error in formatting conditional column (header and rows) ..."
        );
      }
    } else if (overlay.type && overlay.type.includes("/format/")) {
      try {
        sheet1.getColumn(i + 3 - skipped).width = 15;
        sheet1.getCell(shift + 1, i + 3 - skipped).value = "OL: Format";
        formatHeader(sheet1.getCell(shift + 1, i + 3 - skipped));

        for (let row = 2; row <= attributeNames.length + 1; row++) {
          sheet1.getCell(shift + row, i + 3 - skipped).value = null;
          formatAttr(sheet1.getCell(shift + row, i + 3 - skipped));
        }

        for (let [attrName, format] of Object.entries(
          overlay.attribute_formats
        )) {
          const attrKeys = Object.keys(attributesIndex);
          const attrNameFromAttrKeys = attrKeys.map((key) => key.split(",")[0]);
          const rowIndex = attrNameFromAttrKeys.indexOf(attrName) + 2;

          if (rowIndex) {
            sheet1.getCell(shift + rowIndex, i + 3 - skipped).value = format;
          }

          const attrTypeFromAttrKeys = attrKeys.map((key) => key.split(","));
          const attrTypeObjects = attrTypeFromAttrKeys.map(([attr, type]) => ({
            attr,
            type,
          }));

          for (let attrTypeObject of attrTypeObjects) {
            if (
              attrTypeObject.attr === attrName &&
              attrTypeObject.type === "DateTime"
            ) {
              const format_attr = { numFmt: "yyyy-mm-dd" };
              const col_i =
                attributesIndex[[attrName, attrTypeObject.type]] - 1;

              for (let row = 1; row <= 1000; row++) {
                sheet2.getCell(row + 1, col_i).value = null;
                sheet2.getCell(row + 1, col_i).numFmt = format_attr.numFmt;
              }
            }
          }
        }
      } catch (error) {
        throw new WorkbookError(
          ".. Error in formatting format column (header and rows) ..."
        );
      }
    } else if (overlay.type && overlay.type.includes("/entry_code/")) {
      try {
        sheet1.getColumn(i + 3 - skipped).width = 15;
        sheet1.getCell(shift + 1, i + 3 - skipped).value = "Entry Code";
        formatHeader(sheet1.getCell(shift + 1, i + 3 - skipped));

        for (let row = 2; row <= attributeNames.length + 1; row++) {
          sheet1.getCell(shift + row, i + 3 - skipped).value = null;
          formatAttr(sheet1.getCell(shift + row, i + 3 - skipped));
        }

        for (let [attrName, entryCode] of Object.entries(
          overlay.attribute_entry_codes
        )) {
          if (Array.isArray(entryCode)) {
            const joinedCodes = entryCode.join("|");
            const attrKeys = Object.keys(attributesIndex);
            const attrNameFromAttrKeys = attrKeys.map(
              (key) => key.split(",")[0]
            );
            const rowIndex = attrNameFromAttrKeys.indexOf(attrName) + 2;
            if (rowIndex) {
              sheet1.getCell(shift + rowIndex, i + 3 - skipped).value =
                joinedCodes;
            }
          }
        }
      } catch (error) {
        throw new WorkbookError(
          ".. Error in formatting entry code column (header and rows) ..."
        );
      }
    } else if (overlay.type && overlay.type.includes("/label/")) {
      const attr_labels = overlay.attribute_labels;

      if (attr_labels) {
        try {
          sheet1.getColumn(i + 3 - skipped).width = 17;
          sheet1.getCell(shift + 1, i + 3 - skipped).value = "Label";
          formatHeader(sheet1.getCell(shift + 1, i + 3 - skipped));

          for (let row = 2; row <= attributeNames.length + 1; row++) {
            sheet1.getCell(shift + row, i + 3 - skipped).value = null;
            formatAttr(sheet1.getCell(shift + row, i + 3 - skipped));
          }

          for (let [attrName, label] of Object.entries(attr_labels)) {
            const attrKeys = Object.keys(attributesIndex);
            const attrNameFromAttrKeys = attrKeys.map(
              (key) => key.split(",")[0]
            );
            const rowIndex = attrNameFromAttrKeys.indexOf(attrName) + 2;
            if (rowIndex) {
              sheet1.getCell(shift + rowIndex, i + 3 - skipped).value = label;
            }
          }
        } catch (error) {
          throw new WorkbookError(
            ".. Error in formatting labels code column (header and rows) ..."
          );
        }
      } else {
        skipped += 1;
      }
    } else if (overlay.type && overlay.type.includes("/entry/")) {
      const attr_entries = overlay.attribute_entries;

      if (attr_entries) {
        try {
          sheet1.getColumn(i + 3 - skipped).width = 20;
          sheet1.getCell(shift + 1, i + 3 - skipped).value = "Entry";
          formatHeader(sheet1.getCell(shift + 1, i + 3 - skipped));

          for (let row = 2; row <= attributeNames.length + 1; row++) {
            sheet1.getCell(shift + row, i + 3 - skipped).value = null;
            formatAttr(sheet1.getCell(shift + row, i + 3 - skipped));
          }

          for (let [attrName, entries] of Object.entries(attr_entries)) {
            if (
              entries !== undefined &&
              entries !== null &&
              entries instanceof Object
            ) {
              lookupEntries[attrName] = entries;
              const attrKeys = Object.keys(attributesIndex);
              const attrNameFromAttrKeys = attrKeys.map(
                (key) => key.split(",")[0]
              );
              const rowIndex = attrNameFromAttrKeys.indexOf(attrName) + 2;

              const formattedEntries = [];

              for (const [key, value] of Object.entries(entries)) {
                formattedEntries.push(`${key}:${value}`);
              }

              const formattedEntryString = formattedEntries.join("|");

              if (rowIndex) {
                sheet1.getCell(shift + rowIndex, i + 3 - skipped).value =
                  formattedEntryString;
              }
            }
          }
        } catch (error) {
          throw new WorkbookError(
            ".. Error in formatting entry column (header and rows) ...",
            error.message
          );
        }
      } else {
        skipped += 1;
      }
    } else if (overlay.type && overlay.type.includes("/information/")) {
      const attr_info = overlay.attribute_information;

      if (attr_info) {
        try {
          sheet1.getColumn(i + 3 - skipped).width = 20;
          sheet1.getCell(shift + 1, i + 3 - skipped).value = "Information";
          formatHeader(sheet1.getCell(shift + 1, i + 3 - skipped));

          for (let row = 2; row <= attributeNames.length + 1; row++) {
            sheet1.getCell(shift + row, i + 3 - skipped).value = null;
            formatAttr(sheet1.getCell(shift + row, i + 3 - skipped));
          }

          for (let [attrName, info] of Object.entries(attr_info)) {
            const attrKeys = Object.keys(attributesIndex);
            const attrNameFromAttrKeys = attrKeys.map(
              (key) => key.split(",")[0]
            );
            const rowIndex = attrNameFromAttrKeys.indexOf(attrName) + 2;
            if (rowIndex) {
              sheet1.getCell(shift + rowIndex, i + 3 - skipped).value = info;
            }
          }
        } catch (error) {
          throw new WorkbookError(
            ".. Error in formatting information column (header and rows) ..."
          );
        }
      } else {
        skipped += 1;
      }
    } else if (overlay.type && overlay.type.includes("/unit/")) {
      const attr_units = overlay.attribute_units;

      if (attr_units) {
        try {
          sheet1.getColumn(i + 3 - skipped).width = 20;
          sheet1.getCell(shift + 1, i + 3 - skipped).value = "Unit";
          formatHeader(sheet1.getCell(shift + 1, i + 3 - skipped));

          for (let row = 2; row <= attributeNames.length + 1; row++) {
            sheet1.getCell(shift + row, i + 3 - skipped).value = null;
            formatAttr(sheet1.getCell(shift + row, i + 3 - skipped));
          }

          for (let [attrName, unit] of Object.entries(attr_units)) {
            const attrKeys = Object.keys(attributesIndex);
            const attrNameFromAttrKeys = attrKeys.map(
              (key) => key.split(",")[0]
            );
            const rowIndex = attrNameFromAttrKeys.indexOf(attrName) + 2;
            if (rowIndex) {
              sheet1.getCell(shift + rowIndex, i + 3 - skipped).value = unit;
            }
          }
        } catch (error) {
          throw new WorkbookError(
            ".. Error in formatting unit column (header and rows) ..."
          );
        }
      }
    }
  });

  // Step 7: lookup table
  const lookUpTable = new Map();
  let lookUpStart = shift + attributeNames.length + 6;

  sheet1.getCell(lookUpStart, 1).value = "Lookup tables";
  formatLookupHeader(sheet1.getCell(lookUpStart, 1));

  sheet1.getCell(lookUpStart, 2).value = null;
  formatLookupHeader(sheet1.getCell(lookUpStart, 2));

  let offset = 0;

  for (const [attrName, entries] of Object.entries(lookupEntries)) {
    sheet1.getCell(lookUpStart + 1 + offset, 1).value = attrName;
    formatLookupAttr(sheet1.getCell(lookUpStart + 1 + offset, 1));

    const startRow = lookUpStart + 2 + offset;
    const endRow = lookUpStart + 1 + offset + Object.keys(entries).length;

    lookUpTable.set(attrName, [startRow, endRow]);

    offset += Object.keys(entries).length + 2;
  }

  for (const [attrName, entries] of Object.entries(lookupEntries)) {
    const values = [];
    const keys = [];
    for (const [k, v] of Object.entries(entries)) {
      values.push(v);
      keys.push(k);
    }

    const startRow = lookUpTable.get(attrName)[0];
    const endRow = lookUpTable.get(attrName)[1];

    for (let i = startRow; i <= endRow; i++) {
      sheet1.getCell(i, 1).value = values[i - startRow];
      formatLookupValue(sheet1.getCell(i, 1));
      sheet1.getCell(i, 2).value = keys[i - startRow];
      formatLookupValue(sheet1.getCell(i, 2));
    }
  }
  
  for (const [attrName, [start, end]] of lookUpTable) {
    if (Object.keys(TypesOfLookUpEntries).includes(attrName) && Array.isArray(TypesOfLookUpEntries[attrName])) {
      continue;
    } else {
      const validationRule = {
        type: "list",
        showDropDown: true,
        formulae: [`'Schema Description'!$B$${start}:$B$${end}`],
        showErrorMessage: true,
      };
      for (let row = 2; row <= 1000; row++) {
        const attrKeys = Object.keys(attributesIndex);
        const attrNameFromAttrKeys = attrKeys.map((key) => key.split(",")[0]);
        const col_i = attrNameFromAttrKeys.indexOf(attrName) + 1;
        sheet2.getCell(row, col_i).dataValidation = validationRule;
      }
    }
  }
  return workbook;
}
