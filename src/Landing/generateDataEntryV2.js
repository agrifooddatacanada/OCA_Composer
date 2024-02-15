
import ExcelJS from 'exceljs';

// Custom error-handling function
function WorkbookError(message) {
  this.name = 'WorkbookError';
  this.message = message;
  this.stack = new Error().stack;
}

WorkbookError.prototype = Object.create(Error.prototype);
WorkbookError.prototype.constructor = WorkbookError;

export function generateDataEntryV2(acceptedFiles, setLoading) {
  try {
    setLoading(true);
    const reader = new FileReader();

    reader.onload = async (e) => {
      const originJsonData = [];
      const rawJson = JSON.parse(e.target.result);
      let json = rawJson?.['schema']?.[0] ? rawJson?.['schema']?.[0] : rawJson?.['bundle'] ? rawJson?.['bundle'] : rawJson;

      try {
        if (json.hasOwnProperty('capture_base')) {
          originJsonData.push(json.capture_base);
        };
        if (json.hasOwnProperty('overlays')) {
          const overlays = json.overlays;
          for (const o in overlays) {
            if (overlays[o].length !== undefined & overlays[o].length > 0) {
              for (const oo in overlays[o]) {
                originJsonData.push(overlays[o][oo]);
              };
            } else {
              originJsonData.push(overlays[o]);
            };
          };
        };
      } catch (error) {
        throw new WorkbookError('.. Error in reading the json file ...');
      };

      // Re-organize the json data:
      const selectedLang = 'eng';
      const captureBaseOverlays = [];
      const labelOverlays = [];
      const informationOverlays = [];
      const unitOverlays = [];
      const conformanceOverlays = [];
      const entryOverlays = [];
      const entryCodeOverlays = [];
      const otherOverlays = [];


      for (let i = 0; i < originJsonData.length; i++) {
        const overlay = originJsonData[i];

        if (overlay.type && overlay.type.includes('/capture_base/')) {
          captureBaseOverlays.push(overlay);
        } else if (overlay.type && overlay.type.includes('/label/')) {
          if (overlay.language === selectedLang) {
            labelOverlays.push(overlay);
          } else {
            continue;
          };
        } else if (overlay.type && overlay.type.includes('/information/')) {
          if (overlay.language === selectedLang) {
            informationOverlays.push(overlay);
          } else {
            continue;
          };
        } else if (overlay.type && overlay.type.includes('/unit/')) {
          if (overlay.measurement_system === 'Metric') {
            unitOverlays.push(overlay);
          } else {
            continue;
          };
        } else if (overlay.type && overlay.type.includes('/conformance/')) {
          conformanceOverlays.push(overlay);
        } else if (overlay.type && overlay.type.includes('/entry/')) {
          if (overlay.language === selectedLang) {
            entryOverlays.push(overlay);
          };
        } else if (overlay.type && overlay.type.includes('/entry_code/')) {
          entryCodeOverlays.push(overlay);
        } else {
          if (overlay.type && !overlay.type.includes('/meta/')) {
            otherOverlays.push(overlay);
          };
        };
      };

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
        cell.font = { size: 10, bold: true };
        cell.alignment = { vertical: 'top', wrapText: false };
      };

      function formatHyperlink(cell) {
        cell.style = {
          font: {
            bold: true,
            color: { argb: '0000EE' },
            underline: true
          }
        };
      };

      function formatHeader(cell) {
        cell.font = { size: 10, bold: true };
        cell.alignment = { vertical: 'top', wrapText: true };
        cell.border = { top: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
      };

      function formatAttr(cell) {
        cell.font = { size: 10 };
        cell.alignment = { vertical: 'top', wrapText: true };
        cell.border = { right: { style: 'thin' } };
      };

      function formatDataHeader(cell) {
        cell.font = { size: 10 };
        cell.alignment = { vertical: 'top', wrapText: true };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'E7E6E6' },
        };
        cell.border = {
          bottom: { style: 'thin' },
          right: { style: 'thin' },
        };
      };

      function formatLookupHeader(cell) {
        cell.font = { size: 10, bold: true };
        cell.alignment = { vertical: 'top', wrapText: true };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'E7E6E6' },
        };
      };

      function formatLookupAttr(cell) {
        cell.font = { size: 10, bold: true };
        cell.alignment = { vertical: 'top', wrapText: true };
      };

      function formatLookupValue(cell) {
        cell.font = { size: 10 };
        cell.alignment = { vertical: 'top', wrapText: true };
      };

      /// Creating first sheet
      const sheet1 = workbook.addWorksheet('Schema Description');

      let schemaName = null, schemaDescription = null,
        schemaLanguage = null, schemaClassification = null,
        schemaSAID = null;

      try {
        const metaOverlay = originJsonData.find(o => o.type && o.type.includes('/meta/') && o.language === selectedLang);
        schemaName = metaOverlay.name;
        schemaDescription = metaOverlay.description;
        schemaLanguage = metaOverlay.language;
        schemaClassification = jsonData.find(o => o.type && o.type.includes('/capture_base/')).classification;
        schemaSAID = json.d;

      } catch (error) {
        throw new WorkbookError('.. Error in reading the meta overlay ...');
      };

      // Step 5: first page edits
      sheet1.getRow(2).values = ['This is an Excel workbook for data entry.'];
      formatFirstPage(sheet1.getCell(2, 1));
      sheet1.getRow(3).values = ['This workbook has been prefilled with information to help users enter data. The prefilled information comes from a specific schema.'];
      sheet1.getCell(5, 2).value = `schema name: ${schemaName}`;
      sheet1.getCell(6, 2).value = `schema description: ${schemaDescription}`;
      sheet1.getCell(7, 2).value = `schema language: ${schemaLanguage}`;
      sheet1.getCell(8, 2).value = `schema SAID: ${schemaSAID}`;
      sheet1.getCell(9, 2).value = `schema classification: ${schemaClassification}`;
      sheet1.getRow(11).values = ["How to use this workbook: Enter your data in 'Data Entry' while referencing 'Schema Description' for guidance. 'Schema conformant data' contains data that conforms to the schema specification."];
      sheet1.getCell(13, 2).value = "Schema sheet";
      formatFirstPage(sheet1.getCell(13, 2));
      sheet1.getCell(13, 3).value = "Description";
      formatFirstPage(sheet1.getCell(13, 3));
      sheet1.getCell(14, 2).value = "Schema Description";
      sheet1.getCell(14, 3).value = "A schema describes a dataset, and 'Schema Description' includes helpful information from the schema. Here users can find relevant information to help with their data entry.";
      sheet1.getCell(15, 2).value = "Data Entry";
      sheet1.getCell(15, 3).value = "The' Data Entry' sheet is where a user enters data.";
      sheet1.getCell(16, 2).value = "Schema conformant data";
      sheet1.getCell(16, 3).value = "'Schema conformant data', contains the same information from Data Entry but may replace entries with the appropriate codes that are part of the schema the data entry sheet is derived from.";
      sheet1.getRow(18).values = ["Information about the schemas"];

      const ocaREf_cell = sheet1.getCell(19, 2);
      ocaREf_cell.value = {
        text: "A schema describes structures and rules of a dataset. The schema source used to create this Excel Workbook is described in the language of Overlays Capture Architecture (OCA, reference: https://doi.org/10.5281/zenodo.7707367)",
        hyperlink: "https://doi.org/10.5281/zenodo.7707367",
      };

      sheet1.mergeCells('B19:N19');
      formatHyperlink(ocaREf_cell);

      const semantic_cell = sheet1.getCell(20, 2);
      semantic_cell.value = {
        text: "Write your own schema in OCA at https://semanticengine.org",
        hyperlink: "https://semanticengine.org",
      };

      sheet1.mergeCells('B20:D20');
      formatHyperlink(semantic_cell);

      // Step 6: start the workbook
      const shift = 25;

      try {
        sheet1.getColumn(1).width = 17;
        sheet1.getCell(shift + 1, 1).value = 'Attribute Name';
        formatHeader(sheet1.getCell(shift + 1, 1));

        sheet1.getColumn(2).width = 24;
        sheet1.getCell(shift + 1, 2).value = 'Attribute Type';
        formatHeader(sheet1.getCell(shift + 1, 2));

        sheet1.getColumn(3).width = 17;
        sheet1.getCell(shift + 1, 3).value = 'Sensitive';
        formatHeader(sheet1.getCell(shift + 1, 3));

      } catch (error) {
        throw new WorkbookError('.. Error in formatting sheet1 capture base header ...');
      };

      const sheet2 = workbook.addWorksheet('Data Entry');
      try {
        const labelOverlay = jsonData.find(o => o.type && o.type.includes('/label/'));
        if (labelOverlay) {
          const attrLength = Object.keys(jsonData.find(o => o.type && o.type.includes('/capture_base/')).attributes).length;
          const labelsLength = Object.keys(jsonData.find(o => o.type && o.type.includes('/label/')).attribute_labels).length;

          if (labelsLength !== attrLength) {
            const attrKeys = Object.keys(jsonData.find(o => o.type && o.type.includes('/capture_base/')).attributes);
            sheet2.getRow(1).values = attrKeys;

            // format using the formatDataHeader function
            attrKeys.forEach((_attrName, index) => {
              const cell = sheet2.getCell(1, index + 1);
              formatDataHeader(cell);
            });
          };
        } else {
          sheet2.getRow(1).values = Object.keys(jsonData.find(o => o.type && o.type.includes('/capture_base/')).attributes);
          Object.keys(jsonData.find(o => o.type && o.type.includes('/capture_base/')).attributes).forEach((_attrName, index) => {
            const cell = sheet2.getCell(1, index + 1);
            formatDataHeader(cell);
          });
        };
      } catch (error) {
        throw new WorkbookError('.. Error assigning head names to sheet2 (Data Entry) ...');
      };



      const sheet3 = workbook.addWorksheet('Schema conformant data');

      const attributesIndex = {};
      let attributeNames = null;

      jsonData.forEach((overlay) => {
        if (overlay.type && overlay.type.includes('/capture_base/')) {
          Object.entries(overlay.attributes).forEach(([attrName, attrType], index) => {
            const attrIndex = index + 2;
            attributesIndex[[attrName, attrType]] = attrIndex;

            if (attrIndex !== undefined) {
              sheet1.getCell(shift + attrIndex, 1).value = attrName;
              formatAttr(sheet1.getCell(shift + attrIndex, 1));
            } else {
              throw new WorkbookError('.. Error check the attribute name ...');
            };

            if (attrIndex !== undefined) {
              sheet1.getCell(shift + attrIndex, 2).value = attrType;
              formatAttr(sheet1.getCell(shift + attrIndex, 2));
            } else {
              throw new WorkbookError('.. Error check the attribute type ...');
            };

            const isFlagged = overlay.flagged_attributes.includes(attrName);
            sheet1.getCell(shift + attrIndex, 3).value = isFlagged ? "Y" : "";
            formatAttr(sheet1.getCell(shift + attrIndex, 3));

          });

          // sheet 3
          attributeNames = Object.keys(overlay.attributes);

          try {
            sheet3.getRow(1).values = attributeNames;
            attributeNames.forEach((_attrName, index) => {
              const cell = sheet3.getCell(1, index + 1);
              formatDataHeader(cell);
            });
          } catch (error) {
            throw new WorkbookError('.. Error in formatting sheet3 data header ...');
          };

          try {
            for (let col = 0; col < attributeNames.length; col++) {
              const letter = String.fromCharCode(65 + col);

              for (let row = 1; row <= 1000; row++) {
                const formula = `IF(ISBLANK('Data Entry'!$${letter}$${row + 1}), "", 'Data Entry'!$${letter}$${row + 1})`;

                const cell = sheet3.getCell(row + 1, col + 1);
                cell.value = {
                  formula: formula,
                };
              }
            };
          } catch (error) {
            throw new WorkbookError('.. Error in creating the formulae sheet3 data ...');
          };

          const numColumns = attributeNames.length;
          const columnWidth = 15;

          for (let col = 0; col < numColumns; col++) {
            sheet2.getColumn(col + 1).width = columnWidth;
          };

          for (let col = 0; col < numColumns; col++) {
            sheet3.getColumn(col + 1).width = columnWidth;
          };
        };
      });

      let skipped = 0;
      const lookupEntries = {};

      jsonData.forEach((overlay, i) => {
        if (overlay.type && overlay.type.includes('/character_encoding/')) {
          try {
            sheet1.getColumn(i + 3 - skipped).width = 15;
            sheet1.getCell(shift + 1, i + 3 - skipped).value = 'Character Encoding';
            formatHeader(sheet1.getCell(shift + 1, i + 3 - skipped));

            for (let row = 2; row <= attributeNames.length + 1; row++) {
              sheet1.getCell(shift + row, i + 3 - skipped).value = null;
              formatAttr(sheet1.getCell(shift + row, i + 3 - skipped));
            };

            for (let [attrName, encoding] of Object.entries(overlay.attribute_character_encoding)) {
              if (typeof encoding == 'string') {
                const attrKeys = Object.keys(attributesIndex);
                const attrNameFromAttrKeys = attrKeys.map(key => key.split(',')[0]);
                const rowIndex = attrNameFromAttrKeys.indexOf(attrName) + 2;
                if (rowIndex) {
                  sheet1.getCell(shift + rowIndex, i + 3 - skipped).value = encoding;
                };
              };
            };

          } catch (error) {
            throw new WorkbookError('.. Error in formatting character encoding column (header and rows) ...');
          };
        } else if (overlay.type && overlay.type.includes('/cardinality/')) {
          try {
            sheet1.getColumn(i + 3 - skipped).width = 15;
            sheet1.getCell(shift + 1, i + 3 - skipped).value = 'Cardinality';
            formatHeader(sheet1.getCell(shift + 1, i + 3 - skipped));

            for (let row = 2; row <= attributeNames.length + 1; row++) {
              sheet1.getCell(shift + row, i + 3 - skipped).value = null;
              formatAttr(sheet1.getCell(shift + row, i + 3 - skipped));
            };

            for (let [attrName, cardinality] of Object.entries(overlay.attribute_cardinality)) {
              const attrKeys = Object.keys(attributesIndex);
              const attrNameFromAttrKeys = attrKeys.map(key => key.split(',')[0]);
              const rowIndex = attrNameFromAttrKeys.indexOf(attrName) + 2;
              if (rowIndex) {
                sheet1.getCell(shift + rowIndex, i + 3 - skipped).value = cardinality;
              };
            };

          } catch (error) {
            throw new WorkbookError('.. Error in formatting cardinality column (header and rows) ...');
          };
        } else if (overlay.type && overlay.type.includes('/conformance/')) {

          try {
            sheet1.getColumn(i + 3 - skipped).width = 15;
            sheet1.getCell(shift + 1, i + 3 - skipped).value = 'Required';
            formatHeader(sheet1.getCell(shift + 1, i + 3 - skipped));

            for (let row = 2; row <= attributeNames.length + 1; row++) {
              sheet1.getCell(shift + row, i + 3 - skipped).value = null;
              formatAttr(sheet1.getCell(shift + row, i + 3 - skipped));
            }

            for (let [attrName, conformance] of Object.entries(overlay.attribute_conformance)) {
              if (conformance === 'M') {
                conformance = 'Y';
              } else if (conformance === 'O') {
                conformance = ' ';
              }

              const attrKeys = Object.keys(attributesIndex);
              const attrNameFromAttrKeys = attrKeys.map(key => key.split(',')[0]);
              const rowIndex = attrNameFromAttrKeys.indexOf(attrName) + 2;
              if (rowIndex) {
                sheet1.getCell(shift + rowIndex, i + 3 - skipped).value = conformance;
              }
            }

          } catch (error) {
            throw new WorkbookError('.. Error in formatting conformance column (header and rows) ...');
          };
        } else if (overlay.type && overlay.type.includes('/conditional/')) {
          try {
            sheet1.getColumn(i + 3 - skipped).width = 15;
            sheet1.getCell(shift + 1, i + 3 - skipped).value = 'Conditional [Condition]';
            formatHeader(sheet1.getCell(shift + 1, i + 3 - skipped));

            sheet1.getColumn(i + 5 - skipped).width = 15;
            sheet1.getCell(shift + 1, i + 5 - skipped).value = 'Conditional [Dependecies]';
            formatHeader(sheet1.getCell(shift + 1, i + 5 - skipped));

            for (let row = 2; row <= attributeNames.length + 1; row++) {
              sheet1.getCell(shift + row, i + 3 - skipped).value = null;
              sheet1.getCell(shift + row, i + 5 - skipped).value = null;
              formatAttr(sheet1.getCell(shift + row, i + 3 - skipped));
              formatAttr(sheet1.getCell(shift + row, i + 5 - skipped));
            };

            for (let [attrName, condition] of Object.entries(overlay.attribute_conditions)) {
              const attrKeys = Object.keys(attributesIndex);
              const attrNameFromAttrKeys = attrKeys.map(key => key.split(',')[0]);
              const rowIndex = attrNameFromAttrKeys.indexOf(attrName) + 2;
              if (rowIndex) {
                sheet1.getCell(shift + rowIndex, i + 3 - skipped).value = condition;
              };
            };

            for (let [attrName, dependencies] of Object.entries(overlay.attribute_dependencies)) {
              const attrKeys = Object.keys(attributesIndex);
              const attrNameFromAttrKeys = attrKeys.map(key => key.split(',')[0]);
              const rowIndex = attrNameFromAttrKeys.indexOf(attrName) + 2;
              if (rowIndex) {
                sheet1.getCell(shift + rowIndex, i + 5 - skipped).value = dependencies.join(",");
              };
            };

            skipped -= 1;

          } catch (error) {
            throw new WorkbookError('.. Error in formatting conditional column (header and rows) ...');
          };
        } else if (overlay.type && overlay.type.includes('/format/')) {
          try {
            sheet1.getColumn(i + 3 - skipped).width = 15;
            sheet1.getCell(shift + 1, i + 3 - skipped).value = 'OL: Format';
            formatHeader(sheet1.getCell(shift + 1, i + 3 - skipped));

            for (let row = 2; row <= attributeNames.length + 1; row++) {
              sheet1.getCell(shift + row, i + 3 - skipped).value = null;
              formatAttr(sheet1.getCell(shift + row, i + 3 - skipped));
            };

            for (let [attrName, format] of Object.entries(overlay.attribute_formats)) {
              const attrKeys = Object.keys(attributesIndex);
              const attrNameFromAttrKeys = attrKeys.map(key => key.split(',')[0]);
              const rowIndex = attrNameFromAttrKeys.indexOf(attrName) + 2;

              if (rowIndex) {
                sheet1.getCell(shift + rowIndex, i + 3 - skipped).value = format;
              };

              const attrTypeFromAttrKeys = attrKeys.map(key => key.split(','));
              const attrTypeObjects = attrTypeFromAttrKeys.map(([attr, type]) => ({ attr, type }));;

              for (let attrTypeObject of attrTypeObjects) {
                if (attrTypeObject.attr === attrName && attrTypeObject.type === "DateTime") {
                  const format_attr = { numFmt: 'yyyy-mm-dd' };
                  const col_i = attributesIndex[[attrName, attrTypeObject.type]] - 1;
                  // const letter = String.fromCharCode(65 + col_i - 1);

                  for (let row = 1; row <= 1000; row++) {
                    sheet2.getCell(row + 1, col_i).value = null;
                    sheet2.getCell(row + 1, col_i).numFmt = format_attr.numFmt;
                    sheet3.getCell(row + 1, col_i).numFmt = format_attr.numFmt;
                  };
                };
              };
            };

          } catch (error) {
            throw new WorkbookError('.. Error in formatting format column (header and rows) ...');
          };
        } else if (overlay.type && overlay.type.includes('/entry_code/')) {
          try {
            sheet1.getColumn(i + 3 - skipped).width = 15;
            sheet1.getCell(shift + 1, i + 3 - skipped).value = 'Entry Code';
            formatHeader(sheet1.getCell(shift + 1, i + 3 - skipped));

            for (let row = 2; row <= attributeNames.length + 1; row++) {
              sheet1.getCell(shift + row, i + 3 - skipped).value = null;
              formatAttr(sheet1.getCell(shift + row, i + 3 - skipped));
            };


            for (let [attrName, entryCode] of Object.entries(overlay.attribute_entry_codes)) {
              if (Array.isArray(entryCode)) {
                const joinedCodes = entryCode.join('|');
                const attrKeys = Object.keys(attributesIndex);
                const attrNameFromAttrKeys = attrKeys.map(key => key.split(',')[0]);
                const rowIndex = attrNameFromAttrKeys.indexOf(attrName) + 2;
                if (rowIndex) {
                  sheet1.getCell(shift + rowIndex, i + 3 - skipped).value = joinedCodes;
                };
              };
            };

          } catch (error) {
            throw new WorkbookError('.. Error in formatting entry code column (header and rows) ...');
          };
        } else if (overlay.type && overlay.type.includes('/label/')) {
          const attr_labels = overlay.attribute_labels;

          if (attr_labels) {
            try {
              sheet1.getColumn(i + 3 - skipped).width = 17;
              sheet1.getCell(shift + 1, i + 3 - skipped).value = 'Label';
              formatHeader(sheet1.getCell(shift + 1, i + 3 - skipped));

              for (let row = 2; row <= attributeNames.length + 1; row++) {
                sheet1.getCell(shift + row, i + 3 - skipped).value = null;
                formatAttr(sheet1.getCell(shift + row, i + 3 - skipped));
              };

              for (let [attrName, label] of Object.entries(attr_labels)) {

                const attrKeys = Object.keys(attributesIndex);
                const attrNameFromAttrKeys = attrKeys.map(key => key.split(',')[0]);
                const rowIndex = attrNameFromAttrKeys.indexOf(attrName) + 2;
                if (rowIndex) {
                  sheet1.getCell(shift + rowIndex, i + 3 - skipped).value = label;
                };

                const labelValue = Object.values(attr_labels);
                sheet2.getRow(1).values = labelValue;

                labelValue.forEach((_label, index) => {
                  const cell = sheet2.getCell(1, index + 1);
                  formatDataHeader(cell);
                });
              };
            } catch (error) {
              throw new WorkbookError('.. Error in formatting labels code column (header and rows) ...');
            };

          } else {

            skipped += 1;
          };
        } else if (overlay.type && overlay.type.includes('/entry/')) {
          const attr_entries = overlay.attribute_entries;

          if (attr_entries) {
            try {
              sheet1.getColumn(i + 3 - skipped).width = 20;
              sheet1.getCell(shift + 1, i + 3 - skipped).value = 'Entry';
              formatHeader(sheet1.getCell(shift + 1, i + 3 - skipped));

              for (let row = 2; row <= attributeNames.length + 1; row++) {
                sheet1.getCell(shift + row, i + 3 - skipped).value = null;
                formatAttr(sheet1.getCell(shift + row, i + 3 - skipped));
              };

              for (let [attrName, entries] of Object.entries(attr_entries)) {

                if (entries !== undefined && entries !== null && entries instanceof Object) {
                  lookupEntries[attrName] = entries;
                  const attrKeys = Object.keys(attributesIndex);
                  const attrNameFromAttrKeys = attrKeys.map(key => key.split(',')[0]);
                  const rowIndex = attrNameFromAttrKeys.indexOf(attrName) + 2;

                  const formattedEntries = [];

                  for (const [key, value] of Object.entries(entries)) {
                    formattedEntries.push(`${key}:${value}`);
                  };

                  const formattedEntryString = formattedEntries.join('|');

                  if (rowIndex) {
                    sheet1.getCell(shift + rowIndex, i + 3 - skipped).value = formattedEntryString;
                  };
                };
              };
            } catch (error) {
              throw new WorkbookError('.. Error in formatting entry column (header and rows) ...', error.message);
              // console.error('Error in formatting entry column (header and rows):', error.message);
            };

          } else {

            skipped += 1;
          };
        } else if (overlay.type && overlay.type.includes('/information/')) {
          const attr_info = overlay.attribute_information;

          if (attr_info) {
            try {
              sheet1.getColumn(i + 3 - skipped).width = 20;
              sheet1.getCell(shift + 1, i + 3 - skipped).value = 'Information';
              formatHeader(sheet1.getCell(shift + 1, i + 3 - skipped));

              for (let row = 2; row <= attributeNames.length + 1; row++) {
                sheet1.getCell(shift + row, i + 3 - skipped).value = null;
                formatAttr(sheet1.getCell(shift + row, i + 3 - skipped));
              };

              for (let [attrName, info] of Object.entries(attr_info)) {
                const attrKeys = Object.keys(attributesIndex);
                const attrNameFromAttrKeys = attrKeys.map(key => key.split(',')[0]);
                const rowIndex = attrNameFromAttrKeys.indexOf(attrName) + 2;
                if (rowIndex) {
                  sheet1.getCell(shift + rowIndex, i + 3 - skipped).value = info;
                };
              };

            } catch (error) {
              throw new WorkbookError('.. Error in formatting information column (header and rows) ...');
            };
          } else {

            skipped += 1;
          };
        } else if (overlay.type && overlay.type.includes('/unit/')) {
          const attr_units = overlay.attribute_units;

          if (attr_units) {
            try {
              sheet1.getColumn(i + 3 - skipped).width = 20;
              sheet1.getCell(shift + 1, i + 3 - skipped).value = 'Unit';
              formatHeader(sheet1.getCell(shift + 1, i + 3 - skipped));

              for (let row = 2; row <= attributeNames.length + 1; row++) {
                sheet1.getCell(shift + row, i + 3 - skipped).value = null;
                formatAttr(sheet1.getCell(shift + row, i + 3 - skipped));
              };

              for (let [attrName, unit] of Object.entries(attr_units)) {
                const attrKeys = Object.keys(attributesIndex);
                const attrNameFromAttrKeys = attrKeys.map(key => key.split(',')[0]);
                const rowIndex = attrNameFromAttrKeys.indexOf(attrName) + 2;
                if (rowIndex) {
                  sheet1.getCell(shift + rowIndex, i + 3 - skipped).value = unit;
                }
              };
            } catch (error) {
              throw new WorkbookError('.. Error in formatting unit column (header and rows) ...');
            }
          };
        };
      });

      // Step 7: lookup table
      const lookUpTable = new Map();
      let lookUpStart = shift + attributeNames.length + 6;

      sheet1.getCell(lookUpStart, 1).value = 'Lookup tables';
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
      };

      for (const [attrName, entries] of Object.entries(lookupEntries)) {
        const values = [];
        const keys = [];
        for (const [k, v] of Object.entries(entries)) {
          values.push(v);
          keys.push(k);
        };

        const startRow = lookUpTable.get(attrName)[0];
        const endRow = lookUpTable.get(attrName)[1];

        for (let i = startRow; i <= endRow; i++) {
          sheet1.getCell(i, 1).value = values[i - startRow];
          formatLookupValue(sheet1.getCell(i, 1));
          sheet1.getCell(i, 2).value = keys[i - startRow];
          formatLookupValue(sheet1.getCell(i, 2));
        };
      };
      // transform lookupEntries to fit the data validation rule
      const transformedEntries = {};

      for (const [key, values] of Object.entries(lookupEntries)) {
        const keys = Object.keys(values);
        const valueList = Object.values(values);

        transformedEntries[key] = [keys, valueList];
      };

      for (const [attrName, [start, end]] of lookUpTable) {
        let listEntries = null;

        for (const [key, [, valueList]] of Object.entries(transformedEntries)) {
          if (key === attrName) {
            listEntries = ['"' + valueList.join(',') + '"'];
          };
        };

        const validationRule = {
          type: 'list',
          showDropDown: true,
          // formula1: `='Schema Description'!$A$${start}:$A$${end}`,
          formulae: listEntries,
          showErrorMessage: true,
        };

        for (let row = 2; row <= 1000; row++) {
          const attrKeys = Object.keys(attributesIndex);
          const attrNameFromAttrKeys = attrKeys.map(key => key.split(',')[0]);
          const col_i = attrNameFromAttrKeys.indexOf(attrName) + 1;
          const letter = String.fromCharCode(65 + col_i - 1);
          sheet2.getCell(row, col_i).dataValidation = validationRule;
          const formula = `IF(ISBLANK('Data Entry'!$${letter}$${row}), "", VLOOKUP('Data Entry'!$${letter}$${row}, 'Schema Description'!$A$${start}:$B$${end}, 2))`;
          sheet3.getCell(row, col_i).value = {
            formula: formula,
          };
        }
      };


      workbook.xlsx.writeBuffer().then((buffer) => {
        const blob = new Blob([buffer], {
          type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "data_entry";
        a.click();
      });

      setLoading(false);
    };

    reader.readAsText(acceptedFiles[0]);

  } catch (error) {
    setLoading(false);
  }
}