import ExcelJS from "exceljs";
import JSZip from "jszip";
import { codesToLanguages } from "../constants/isoCodes";
import {
  replaceAttributeCharsInJsonString,
  replaceAttributeCharsInParsedJson
} from "../constants/utils";
import { ADC, RANGE, SENSITIVE, UNIT_FRAMING } from "../constants/constants";

// Custom error-handling function
function WorkbookError(message) {
  this.name = "WorkbookError";
  this.message = message;
  this.stack = new Error().stack;
}

function readJSON(originJsonData_jsonSaid, e) {
  let isOcaPackage = false;
  let extensions = null;
  let ocaPackageSaid = "";

  try {
    const textDecoder = new TextDecoder("utf-8");
    const jsonString = textDecoder.decode(e.target.result);
    const rawJson = JSON.parse(jsonString);

    // check if the json is a valid oca-package or just a normal oca-bundle
    let json = null;
    if (rawJson.type && rawJson.type.includes("oca_package")) {
      isOcaPackage = true;
      extensions = rawJson.extensions;
      ocaPackageSaid = rawJson?.d || "";
      json = rawJson.oca_bundle.bundle;
    } else if (rawJson.oca_bundle && rawJson.oca_bundle.bundle) {
      json = rawJson.oca_bundle.bundle;
    } else if (rawJson.bundle) {
      json = rawJson.bundle;
    } else {
      throw new WorkbookError(".. Error in reading the json file ...");
    }

    originJsonData_jsonSaid.jsonSaid = json.d;
    originJsonData_jsonSaid.captureBaseSAID = json.capture_base.d;
    json = replaceAttributeCharsInParsedJson(json);

    if (Object.prototype.hasOwnProperty.call(json, "capture_base")) {
      originJsonData_jsonSaid.originJsonData.push(json.capture_base);
    }

    if (Object.prototype.hasOwnProperty.call(json, "overlays")) {
      const { overlays } = json;
      for (const o in overlays) {
        if (Array.isArray(overlays[o]) && overlays[o].length > 0) {
          for (const oo of overlays[o]) {
            originJsonData_jsonSaid.originJsonData.push(oo);
          }
        } else if (!Array.isArray(overlays[o])) {
          originJsonData_jsonSaid.originJsonData.push(overlays[o]);
        }
      }
    }
  } catch (error) {
    throw new WorkbookError(".. Error in reading the json file ...");
  }
  // exports oca_bundle organized, if it is an oca-package, and the extensions
  return [originJsonData_jsonSaid, isOcaPackage, extensions, ocaPackageSaid];
}

async function readZIP(originJsonData_jsonSaid, e) {
  try {
    const zip = await JSZip.loadAsync(e.target.result);
    for (const file of Object.values(zip.files)) {
      // eslint-disable-next-line no-await-in-loop
      const loadData = await file.async("text");
      const parsedData = replaceAttributeCharsInJsonString(loadData, true);
      originJsonData_jsonSaid.originJsonData.push(parsedData);
      if (parsedData.type && parsedData.type.includes("capture_base")) {
        originJsonData_jsonSaid.jsonSaid = parsedData.digest || "unavailable";
      }
    }
  } catch (error) {
    throw new WorkbookError(".. Error in reading the zip file ...");
  }

  // return originJsonData_jsonSaid;
  return [originJsonData_jsonSaid, false, null];
}

WorkbookError.prototype = Object.create(Error.prototype);
WorkbookError.prototype.constructor = WorkbookError;
// eslint-disable-next-line import/prefer-default-export
export async function CreateDataEntryExcel(data, selectedLang) {
  const DEFAULT_LANGUAGE = "en";

  if (selectedLang === "English") {
    selectedLang = DEFAULT_LANGUAGE;
  } else {
    selectedLang = Object.keys(codesToLanguages).find(
      (key) => codesToLanguages[key] === selectedLang
    );
  }

  let inPutJsonResult = null;
  try {
    inPutJsonResult = readJSON({ originJsonData: [], jsonSaid: "" }, data);
  } catch (jsonError) {
    try {
      inPutJsonResult = await readZIP({ originJsonData: [], jsonSaid: "" }, data);
    } catch (zipError) {
      console.error("Error reading JSON or ZIP file:", zipError);
    }
  }

  const { jsonSaid, originJsonData } = inPutJsonResult[0];

  const isOcaPackage = inPutJsonResult[1];
  const ocaPackageSaid = inPutJsonResult[3];
  let attribute_ordering_container = null;
  let entry_code_ordering = null;
  let sensitiveOverlay = null;
  let rangeOverlay = null;
  let unitFramingOverlay = null;
  let extensionOverlayColumnCount = 0;

  if (isOcaPackage) {
    const extensions = inPutJsonResult[2];
    if (Object.keys(extensions || {}).length > 0) {
      // For now, use ADC extension overlays for the top-level/main schema bundle
      const overlays = extensions?.[ADC]?.[inPutJsonResult[0].captureBaseSAID]?.overlays;
      for (const overlayKey of Object.keys(overlays || {})) {
        if (overlays[overlayKey].type.includes("ordering")) {
          attribute_ordering_container = overlays[overlayKey].attribute_ordering;
          entry_code_ordering = overlays[overlayKey].entry_code_ordering;
        }

        if (overlays[overlayKey].type.includes(SENSITIVE)) {
          sensitiveOverlay = overlays[overlayKey];
        }

        if (overlays[overlayKey].type.includes(RANGE)) {
          rangeOverlay = overlays[overlayKey];
        }

        if (overlays[overlayKey].type.includes(UNIT_FRAMING)) {
          unitFramingOverlay = overlays[overlayKey];
        }
      }
    }
  }

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
      unitOverlays.push(overlay);
    } else if (overlay.type && overlay.type.includes("/conformance/")) {
      conformanceOverlays.push(overlay);
    } else if (overlay.type && overlay.type.includes("/entry_code/")) {
      entryCodeOverlays.push(overlay);
    } else if (
      overlay.type &&
      !overlay.type.includes("/label/") &&
      !overlay.type.includes("/entry/") &&
      !overlay.type.includes("/information/") &&
      !overlay.type.includes("/meta/")
    ) {
      otherOverlays.push(overlay);
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
    ...otherOverlays
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
      right: { style: "thin" }
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
      fgColor: { argb: "E7E6E6" }
    };
    cell.border = {
      bottom: { style: "thin" },
      right: { style: "thin" }
    };
  }

  function formatLookupHeader(cell) {
    cell.font = { size: 10, bold: true };
    cell.alignment = { vertical: "top", wrapText: true };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "E7E6E6" }
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

  let schemaTitle = null;
  let schemaDescription = null;
  let schemaLanguage = null;
  let schemaClassification = null;

  try {
    schemaTitle = metaOverlays[0].name;
    schemaDescription = metaOverlays[0].description
      ? // eslint-disable-next-line quotes
        metaOverlays[0].description.replace(/\\"/g, '"').replace(/\\'/g, "'")
      : "";
    schemaLanguage = metaOverlays[0].language;
    schemaClassification = jsonData.find(
      (o) => o.type && o.type.includes("/capture_base/")
    ).classification;
  } catch (error) {
    throw new WorkbookError(".. Error in reading the meta overlay ...");
  }

  // Step 5: Schema Description Sheet Content
  let introSectionCurrentRow = 1;
  sheet1.getCell(introSectionCurrentRow, 1).value =
    "This is an Excel workbook for data display and data entry.";
  formatFirstPage(sheet1.getCell(introSectionCurrentRow, 1));
  introSectionCurrentRow++;

  sheet1.getCell(introSectionCurrentRow, 2).value =
    "This workbook has been prefilled with information to help users use the data. The prefilled information comes from a schema.";
  introSectionCurrentRow++;

  sheet1.getCell(introSectionCurrentRow, 2).value =
    "Enter or view your data in 'Data' while referencing 'Schema Description' for guidance.";
  introSectionCurrentRow += 2;

  sheet1.getCell(introSectionCurrentRow, 1).value = "Schema details:";
  formatFirstPage(sheet1.getCell(introSectionCurrentRow, 1));
  introSectionCurrentRow++;

  sheet1.getCell(introSectionCurrentRow, 2).value = `Schema title: ${schemaTitle}`;
  introSectionCurrentRow++;

  sheet1.getCell(introSectionCurrentRow, 2).value =
    `Schema description: ${schemaDescription}`;
  introSectionCurrentRow++;

  sheet1.getCell(introSectionCurrentRow, 2).value = `Schema language: ${schemaLanguage}`;
  introSectionCurrentRow++;

  sheet1.getCell(introSectionCurrentRow, 2).value = `Schema SAID: ${jsonSaid}`;
  introSectionCurrentRow++;

  if (ocaPackageSaid) {
    sheet1.getCell(introSectionCurrentRow, 2).value = `Package SAID: ${ocaPackageSaid}`;
    introSectionCurrentRow++;
  }

  sheet1.getCell(introSectionCurrentRow, 2).value =
    `Schema classification: ${schemaClassification}`;
  introSectionCurrentRow += 2;

  sheet1.getCell(introSectionCurrentRow, 1).value = "What is a schema?";
  formatFirstPage(sheet1.getCell(introSectionCurrentRow, 1));
  introSectionCurrentRow++;

  sheet1.getCell(introSectionCurrentRow, 2).value =
    "A schema describes structures and rules of a dataset.";
  introSectionCurrentRow++;

  sheet1.getCell(introSectionCurrentRow, 2).value =
    "Learn more and write your own schema at https://semanticengine.org";
  introSectionCurrentRow += 2;

  sheet1.getCell(introSectionCurrentRow, 1).value = "Schema Description:";
  formatFirstPage(sheet1.getCell(introSectionCurrentRow, 1));
  introSectionCurrentRow++;

  sheet1.getCell(introSectionCurrentRow, 2).value =
    "Here is a table describing each of the attributes which you will find on the Data sheet. This information has been supplied by your schema.";

  // Step 6: Start the Workbook
  const shift = introSectionCurrentRow;

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
    throw new WorkbookError(".. Error in formatting sheet1 capture base header ...");
  }

  const sheet2 = workbook.addWorksheet("Data");

  const attributesIndex = {};
  let attributeNames = null;
  const TypesOfLookUpEntries = {};

  // TODO: add an index i.e., the order from the ordering overlay if the json is an oca-package
  jsonData.forEach((overlay) => {
    if (overlay.type && overlay.type.includes("/capture_base/")) {
      const sensitiveAttributes = Array.isArray(sensitiveOverlay?.sensitive_attributes)
        ? sensitiveOverlay?.sensitive_attributes
        : Array.isArray(overlay.flagged_attributes)
          ? overlay.flagged_attributes
          : [];
      Object.entries(overlay.attributes).forEach(([attrName, attrType], index) => {
        let attrIndex = null;

        if (isOcaPackage && attribute_ordering_container.includes(attrName)) {
          attrIndex = attribute_ordering_container.indexOf(attrName) + 2;
        } else {
          attrIndex = index + 2;
        }

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

        const isFlagged = sensitiveAttributes.includes(attrName);
        sheet1.getCell(shift + attrIndex, 3).value = isFlagged ? "Y" : "";
        formatAttr(sheet1.getCell(shift + attrIndex, 3));
      });

      // Step 6.1: Data Entry sheet

      if (isOcaPackage) {
        attributeNames = attribute_ordering_container;
      } else {
        attributeNames = Object.keys(overlay.attributes);
      }

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

  // mapping with new index from the ordering overlay
  const attrKeys = Object.keys(attributesIndex);
  const attrValues = Object.values(attributesIndex);
  const mappingAttrKeysandAttrValues = attrKeys.reduce((acc, key, index) => {
    acc[key.split(",")[0]] = attrValues[index];
    return acc;
  }, {});

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

        for (const [attrName, encoding] of Object.entries(
          overlay.attribute_character_encoding
        )) {
          if (typeof encoding === "string") {
            const rowIndex = mappingAttrKeysandAttrValues[attrName];
            if (rowIndex) {
              sheet1.getCell(shift + rowIndex, i + 3 - skipped).value = encoding;
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

        for (const [attrName, cardinality] of Object.entries(
          overlay.attribute_cardinality
        )) {
          const rowIndex = mappingAttrKeysandAttrValues[attrName];
          if (rowIndex) {
            sheet1.getCell(shift + rowIndex, i + 3 - skipped).value = cardinality;
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
        // eslint-disable-next-line prefer-const
        for (let [attrName, conformance] of Object.entries(
          overlay.attribute_conformance
        )) {
          if (conformance === "M") {
            conformance = "Y";
          } else if (conformance === "O") {
            conformance = " ";
          }
          const rowIndex = mappingAttrKeysandAttrValues[attrName];
          if (rowIndex) {
            sheet1.getCell(shift + rowIndex, i + 3 - skipped).value = conformance;
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
        sheet1.getCell(shift + 1, i + 3 - skipped).value = "Conditional [Condition]";
        formatHeader(sheet1.getCell(shift + 1, i + 3 - skipped));

        sheet1.getColumn(i + 5 - skipped).width = 15;
        sheet1.getCell(shift + 1, i + 5 - skipped).value = "Conditional [Dependecies]";
        formatHeader(sheet1.getCell(shift + 1, i + 5 - skipped));

        for (let row = 2; row <= attributeNames.length + 1; row++) {
          sheet1.getCell(shift + row, i + 3 - skipped).value = null;
          sheet1.getCell(shift + row, i + 5 - skipped).value = null;
          formatAttr(sheet1.getCell(shift + row, i + 3 - skipped));
          formatAttr(sheet1.getCell(shift + row, i + 5 - skipped));
        }

        for (const [attrName, condition] of Object.entries(
          overlay.attribute_conditions
        )) {
          const rowIndex = mappingAttrKeysandAttrValues[attrName];
          if (rowIndex) {
            sheet1.getCell(shift + rowIndex, i + 3 - skipped).value = condition;
          }
        }

        for (const [attrName, dependencies] of Object.entries(
          overlay.attribute_dependencies
        )) {
          const rowIndex = mappingAttrKeysandAttrValues[attrName];
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

        for (const [attrName, format] of Object.entries(overlay.attribute_formats)) {
          const rowIndex = mappingAttrKeysandAttrValues[attrName];

          if (rowIndex) {
            sheet1.getCell(shift + rowIndex, i + 3 - skipped).value = format;
          }

          const attrTypeFromAttrKeys = attrKeys.map((key) => key.split(","));
          const attrTypeObjects = attrTypeFromAttrKeys.map(([attr, type]) => ({
            attr,
            type
          }));

          for (const attrTypeObject of attrTypeObjects) {
            if (attrTypeObject.attr === attrName && attrTypeObject.type === "DateTime") {
              const format_attr = { numFmt: "yyyy-mm-dd" };
              const col_i = attributesIndex[[attrName, attrTypeObject.type]] - 1; // TODO: test inf the column still works after the manipulation of using ordering overlay

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
    } else if (overlay.type && overlay.type.includes("/standard/")) {
      try {
        sheet1.getColumn(i + 3 - skipped).width = 15;
        const dataStandardHeaderCell = sheet1.getCell(shift + 1, i + 3 - skipped);
        dataStandardHeaderCell.value = "Data Standard";

        formatHeader(dataStandardHeaderCell);

        Object.keys(overlay.attribute_standards).forEach((attrName, attrIndex) => {
          const dataStandard = overlay.attribute_standards[attrName];
          const rowIndex = attrIndex + 2;
          const dataStandardCell = sheet1.getCell(shift + rowIndex, i + 3 - skipped);
          dataStandardCell.value = dataStandard;

          formatAttr(dataStandardCell);
        });
      } catch (error) {
        throw new WorkbookError(
          ".. Error in formatting data standard column (header and rows) ..."
        );
      }
    } else if (overlay.type && overlay.type.includes("/entry_code/")) {
      let { attribute_entry_codes } = overlay;

      if (isOcaPackage && Object.keys(entry_code_ordering).length > 0) {
        attribute_entry_codes = entry_code_ordering;
      }

      try {
        sheet1.getColumn(i + 3 - skipped).width = 15;
        sheet1.getCell(shift + 1, i + 3 - skipped).value = "Entry Code";
        formatHeader(sheet1.getCell(shift + 1, i + 3 - skipped));

        for (let row = 2; row <= attributeNames.length + 1; row++) {
          sheet1.getCell(shift + row, i + 3 - skipped).value = null;
          formatAttr(sheet1.getCell(shift + row, i + 3 - skipped));
        }

        for (const [attrName, entryCode] of Object.entries(attribute_entry_codes)) {
          if (Array.isArray(entryCode)) {
            const joinedCodes = entryCode.join("|");
            const rowIndex = mappingAttrKeysandAttrValues[attrName];

            if (rowIndex) {
              sheet1.getCell(shift + rowIndex, i + 3 - skipped).value = joinedCodes;
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

          for (const [attrName, label] of Object.entries(attr_labels)) {
            const rowIndex = mappingAttrKeysandAttrValues[attrName];

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
      let attr_entries = overlay.attribute_entries;
      const orderedEntries = {};

      if (isOcaPackage && Object.keys(entry_code_ordering).length > 0) {
        for (const attr of Object.keys(entry_code_ordering)) {
          if (attr_entries[attr]) {
            orderedEntries[attr] = {};
            for (const key of entry_code_ordering[attr]) {
              if (attr_entries[attr][key]) {
                orderedEntries[attr][key] = attr_entries[attr][key];
              }
            }
          }
        }

        attr_entries = orderedEntries;
      }

      if (attr_entries) {
        try {
          sheet1.getColumn(i + 3 - skipped).width = 20;
          sheet1.getCell(shift + 1, i + 3 - skipped).value = "Entry";
          formatHeader(sheet1.getCell(shift + 1, i + 3 - skipped));

          for (let row = 2; row <= attributeNames.length + 1; row++) {
            sheet1.getCell(shift + row, i + 3 - skipped).value = null;
            formatAttr(sheet1.getCell(shift + row, i + 3 - skipped));
          }

          for (const [attrName, entries] of Object.entries(attr_entries)) {
            if (Object.prototype.hasOwnProperty.call(attr_entries, attrName)) {
              if (
                entries !== undefined &&
                entries !== null &&
                entries instanceof Object
              ) {
                lookupEntries[attrName] = entries;
                const rowIndex = mappingAttrKeysandAttrValues[attrName];

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

          for (const [attrName, info] of Object.entries(attr_info)) {
            const rowIndex = mappingAttrKeysandAttrValues[attrName];

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
      const attr_units = overlay.attribute_units || overlay.attribute_unit;

      if (attr_units) {
        try {
          sheet1.getColumn(i + 3 - skipped).width = 20;
          sheet1.getCell(shift + 1, i + 3 - skipped).value = "Unit";
          formatHeader(sheet1.getCell(shift + 1, i + 3 - skipped));

          for (let row = 2; row <= attributeNames.length + 1; row++) {
            sheet1.getCell(shift + row, i + 3 - skipped).value = null;
            formatAttr(sheet1.getCell(shift + row, i + 3 - skipped));
          }

          for (const [attrName, unit] of Object.entries(attr_units)) {
            const rowIndex = mappingAttrKeysandAttrValues[attrName];
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

  if (Object.keys(unitFramingOverlay?.units || {}).length > 0) {
    const unitOverlay = jsonData.find((overlay) => overlay.type.includes("/unit/"));
    const attributeUnitMap = unitOverlay?.attribute_units || unitOverlay?.attribute_unit;
    if (attributeUnitMap) {
      const columns = ["Unit Framing"];
      const startColumnIndex =
        jsonData.length + 3 + extensionOverlayColumnCount - skipped;
      try {
        columns.forEach((column, i) => {
          const columnIndex = startColumnIndex + i;
          const columnHeaderCell = sheet1.getCell(shift + 1, columnIndex);

          sheet1.getColumn(columnIndex).width = 15;
          columnHeaderCell.value = column;
          formatHeader(columnHeaderCell);
          attributeNames.forEach((attribute) => {
            const rowIndex = mappingAttrKeysandAttrValues[attribute];
            if (!rowIndex) return;

            const unit = attributeUnitMap[attribute];
            if (!unit) return;

            const unitFramingData = unitFramingOverlay.units[unit];
            if (!unitFramingData) return;

            const valueCell = sheet1.getCell(shift + rowIndex, columnIndex);
            valueCell.value = unitFramingData.term_id;
          });
          extensionOverlayColumnCount += 1;
        });
      } catch (error) {
        throw new WorkbookError(
          ".. Error in formatting unit framing columns (header and rows) ..."
        );
      }
    }
  }

  if (rangeOverlay?.attributes) {
    const columns = ["Lower Bound", "Inclusive", "Upper Bound", "Inclusive"];
    const startColumnIndex = jsonData.length + 3 + extensionOverlayColumnCount - skipped;

    try {
      columns.forEach((column, i) => {
        const columnIndex = startColumnIndex + i;
        const columnHeaderCell = sheet1.getCell(shift + 1, columnIndex);

        sheet1.getColumn(columnIndex).width = 15;
        columnHeaderCell.value = column;
        formatHeader(columnHeaderCell);

        Object.keys(rangeOverlay.attributes).forEach((attribute) => {
          const rowIndex = mappingAttrKeysandAttrValues[attribute];
          if (!rowIndex) return;

          const valueCell = sheet1.getCell(shift + rowIndex, columnIndex);

          if (i === 0) {
            valueCell.value = rangeOverlay.attributes[attribute].lower;
          } else if (i === 1) {
            valueCell.value = rangeOverlay.attributes[attribute].lower_inclusive;
          } else if (i === 2) {
            valueCell.value = rangeOverlay.attributes[attribute].upper;
          } else if (i === 3) {
            valueCell.value = rangeOverlay.attributes[attribute].upper_inclusive;
          }
        });
        extensionOverlayColumnCount += 1;
      });
    } catch (error) {
      throw new WorkbookError(
        ".. Error in formatting range columns (header and rows) ..."
      );
    }
  }

  // Step 7: lookup table
  const lookUpTable = new Map();
  const lookUpStart = shift + attributeNames.length + 6;

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
    if (
      Object.keys(TypesOfLookUpEntries).includes(attrName) &&
      Array.isArray(TypesOfLookUpEntries[attrName])
    ) {
      continue;
    } else {
      const validationRule = {
        type: "list",
        showDropDown: true,
        formulae: [`'Schema Description'!$B$${start}:$B$${end}`],
        showErrorMessage: true
      };
      // Get the correct column index from mappingAttrKeysandAttrValues
      // Subtracting 1 to get the correct column index since we stored indices starting from 2
      const col_i = mappingAttrKeysandAttrValues[attrName] - 1;

      for (let row = 2; row <= 1000; row++) {
        sheet2.getCell(row, col_i).dataValidation = validationRule;
      }
    }
  }
  return workbook;
}
