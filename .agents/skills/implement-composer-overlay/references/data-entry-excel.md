# Touchpoint 5: Generate Data Entry Excel

The data entry workbook is built with ExcelJS by `CreateDataEntryExcel` in `src/Landing/CreateDataEntryExcel.js` (button wiring in `src/Landing/GenerateDataEntryExcel.js`). The first sheet, **"Schema Description"** (`sheet1`), holds all schema metadata — that's where overlay information goes. The "Data" sheet is out of scope unless the overlay directly changes how data cells are formatted (as a delimiter overlay would).

## Load the overlay

Near the top of `CreateDataEntryExcel`, ADC overlays are read from the processed package and stored in local variables:

```js
if (isOcaPackage) {
  const extensions = inPutJsonResult[2];
  const overlays = extensions?.[ADC]?.[inPutJsonResult[0].captureBaseSAID]?.overlays;
  // ...
  fileDelimiterOverlay = overlays?.[FILE_DELIMITER];
  arrayDelimiterOverlay = overlays?.[ARRAY_DELIMITER];
}
```

Declare a `let myOverlay = null;` with the others and assign it here.

## Schema-level configuration → intro rows

Global values go into the intro block under a bold section label, following the "Global Schema Values:" pattern (~line 392): label in column 1 formatted with `formatFirstPage`, one value line per field in column 2, advancing `introSectionCurrentRow`:

```js
if (fileDelimiterOverlay) {
  sheet1.getCell(introSectionCurrentRow, 2).value =
    `File Delimiter: '${prettyPrintDelimiter(fileDelimiterOverlay.delimiter)}'`;
  introSectionCurrentRow++;
  // ...one row per field...
}
```

The whole block is wrapped in a presence check so absent overlays add no rows. Reuse the existing "Global Schema Values:" section if your overlay is conceptually a global schema value; otherwise add a similarly formatted section.

## Attribute-level configuration → a column in the attribute metadata table

Per-attribute values become an extra column in the attribute table further down the sheet, following the `arrayDelimiterOverlay` block (~line 979). The pattern computes the next free column from `extensionOverlayColumnCount`, writes a formatted header, then fills one cell per covered attribute using the `mappingAttrKeysandAttrValues` row lookup:

```js
if (myOverlay) {
  const columns = ["My Column Header"];
  const startColumnIndex = jsonData.length + 3 + extensionOverlayColumnCount - skipped;
  try {
    columns.forEach((column, i) => {
      const columnIndex = startColumnIndex + i;
      const columnHeaderCell = sheet1.getCell(shift + 1, columnIndex);
      sheet1.getColumn(columnIndex).width = 15;
      columnHeaderCell.value = column;
      formatHeader(columnHeaderCell);

      Object.keys(myOverlay.attributes).forEach((attribute) => {
        const rowIndex = mappingAttrKeysandAttrValues[attribute];
        if (!rowIndex) return;                     // attribute not in table — skip
        sheet1.getCell(shift + rowIndex, columnIndex).value =
          myOverlay.attributes[attribute];
      });
      extensionOverlayColumnCount += 1;            // keeps later columns from colliding
    });
  } catch (error) {
    throw new WorkbookError(".. Error in formatting my overlay columns ...");
  }
}
```

Incrementing `extensionOverlayColumnCount` is essential — later extension columns (e.g. Examples) compute their position from it, and forgetting it makes columns overwrite each other. Place your block in a sensible order relative to the existing extension column blocks (range → array delimiter → examples).

## Verify the output

Generate a file with and without the overlay and open both in Excel **and** LibreOffice Calc: no warnings on open, headers styled like the neighbors, values in the right rows, and zero trace of the overlay in the without-file.

## Checklist

- [ ] Overlay loaded from `extensions.adc[captureBaseSAID].overlays` alongside the others
- [ ] Schema-level values as labeled intro rows; attribute-level values as a metadata-table column
- [ ] `extensionOverlayColumnCount` incremented for each added column
- [ ] Absent overlay adds no rows or columns
- [ ] File opens cleanly in Excel and LibreOffice Calc
