import React, { useEffect, useLayoutEffect, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { AgGridReact } from "../components/AgGridReact";
import { useMultiSchema } from "../schema/schemaContext";
import CellHeader from "../components/CellHeader";
import {
  agGridEditableCellHoverCss,
  greyCellStyle,
  gridStyles,
  preWrapWordBreak
} from "../constants/styles";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-balham.css";
import {
  AG_GRID_EMPTY_MAIN_STEP_BODY_MIN_PX,
  AG_GRID_EMPTY_MAIN_STEP_GRID_MIN_PX,
  AG_GRID_VIRTUALIZE_MIN_ROWS,
  MAX_ATTR_DESCRIPTION_CHARS,
  MAX_ATTR_LABEL_CHARS
} from "../constants/constants";
import { langCodeOCAFromName } from "../utils/languageUtils";
import { measureTextHeight } from "../utils/measureTextLines";
import TextareaCellEditor from "../components/TextareaCellEditor";
import TruncatedListCell from "../components/TruncatedListCell";
import CustomPalette from "../constants/customPalette";

export default function LanGrid({ gridRef, currentLanguage, setLoading }) {
  const { t, i18n } = useTranslation();

  // Use MultiSchemaContext
  const { getSchema, getAttributesList, updateSchema } = useMultiSchema();

  // Get schema-specific languages from per-schema metadata
  const schemaState = getSchema();
  const languages = schemaState?.metadata?.languages || [];

  // Get schema-specific overlay data from unified context, formatted for LanGrid
  const schemaOverlay = useMemo(() => {
    const completeSchema = getSchema();
    const rawOverlays = completeSchema?.overlays;

    if (!rawOverlays) {
      return {};
    }

    // Transform OCA overlay format to LanGrid expected format
    const transformedOverlay = {
      label: {},
      information: {},
      entry: {}
    };

    // Process label overlays
    // labelOverlay.language contains OCA code (e.g., "eng")
    if (rawOverlays.label && Array.isArray(rawOverlays.label)) {
      rawOverlays.label.forEach((labelOverlay) => {
        const langCodeOCA = labelOverlay.language;
        if (langCodeOCA && labelOverlay.attribute_labels) {
          transformedOverlay.label[langCodeOCA] = labelOverlay.attribute_labels;
        }
      });
    }

    // Process information overlays (for Description)
    if (rawOverlays.information && Array.isArray(rawOverlays.information)) {
      rawOverlays.information.forEach((infoOverlay) => {
        const langCodeOCA = infoOverlay.language;
        if (langCodeOCA && infoOverlay.attribute_information) {
          transformedOverlay.information[langCodeOCA] = infoOverlay.attribute_information;
        }
      });
    }

    // Process entry overlays
    if (rawOverlays.entry && Array.isArray(rawOverlays.entry)) {
      rawOverlays.entry.forEach((entryOverlay) => {
        const langCodeOCA = entryOverlay.language;
        if (langCodeOCA && entryOverlay.attribute_entries) {
          transformedOverlay.entry[langCodeOCA] = entryOverlay.attribute_entries;
        }
      });
    }

    return transformedOverlay;
  }, [schemaState?.completeSchema?.overlays, schemaState?.overlays]);

  // Get schema state data with stable references
  const attributesList = useMemo(
    () => getAttributesList(), // Computed from attributes
    [getAttributesList, schemaState?.attributes] // Re-compute when attributes change
  );
  const lanAttributeRowData = useMemo(
    () => schemaState?.lanAttributeRowData || {},
    [schemaState?.lanAttributeRowData]
  );
  const attributeRowData = useMemo(
    () => schemaState?.attributes || [],
    [schemaState?.attributes]
  );
  // effectiveAttributesList is now just attributesList (already computed correctly)
  const effectiveAttributesList = attributesList;

  const stableEntryCodes = useMemo(() => {
    const schemaState = getSchema();
    return schemaState?.entryCodes || {};
  }, [schemaState?.entryCodes]);

  // Sets Language Dependent Attribute row data - simplified version
  useEffect(() => {
    const newLanAttributeRowData = JSON.parse(JSON.stringify(lanAttributeRowData));

    languages.forEach((language) => {
      if (!newLanAttributeRowData[language]) {
        // Generate initial data for this language
        const newLanguageList = [];
        effectiveAttributesList.forEach((item) => {
          let listDisplay = attributeRowData.find((obj) => obj.Attribute === item)?.List;
          if (!listDisplay) {
            listDisplay = "";
          } else {
            const listDisplayArray = [];
            stableEntryCodes[item]?.forEach((row) => {
              // Entry codes are normalized at source to use language names
              const value = row[language] || row.Code;
              if (value) listDisplayArray.push(value);
            });
            const listDisplayString = listDisplayArray.join(" | ");
            listDisplay = listDisplayString || "";
          }

          const overlaylangCodeOCA = langCodeOCAFromName(language);
          newLanguageList.push({
            Attribute: item,
            Label: schemaOverlay?.label?.[overlaylangCodeOCA]?.[item] || "",
            Description: schemaOverlay?.information?.[overlaylangCodeOCA]?.[item] || "",
            List: listDisplay
          });
        });
        newLanAttributeRowData[language] = newLanguageList;
      } else {
        // Update existing data for this language
        const newLanguageList = [];
        attributeRowData.forEach((item) => {
          let newLabel = "";
          let newDescription = "";

          const existingItem = newLanAttributeRowData[language]?.find(
            (i) => i.Attribute === item.Attribute
          );

          if (existingItem) {
            newLabel = existingItem.Label;
            newDescription = existingItem.Description;
          }

          let listDisplay = item.List;
          if (!listDisplay) {
            listDisplay = "";
          } else {
            const listDisplayArray = [];
            stableEntryCodes[item.Attribute]?.forEach((row) => {
              // Entry codes are normalized at source to use language names
              const value = row[language] || row.Code;
              if (value) listDisplayArray.push(value);
            });
            const listDisplayString = listDisplayArray.join(" | ");
            listDisplay = listDisplayString || "";
          }

          newLanguageList.push({
            Attribute: item.Attribute,
            Label: newLabel,
            Description: newDescription,
            List: listDisplay
          });
        });
        newLanAttributeRowData[language] = newLanguageList;
      }
    });

    updateSchema({
      lanAttributeRowData: newLanAttributeRowData
    });
  }, [languages, stableEntryCodes, attributeRowData, i18n.language]);

  const columnDefs = useMemo(
    () => [
      {
        field: "Attribute",
        editable: false,
        width: 120,
        wrapText: true,
        cellStyle: () => greyCellStyle,
        headerComponent: CellHeader,
        headerComponentParams: {
          headerText: t("Attribute"),
          helpText: t(
            "Name for the attribute and, for example, the column header in every tabular data set no matter what language"
          )
        }
      },
      {
        field: "Label",
        editable: true,
        width: 200,
        wrapText: true,
        cellEditor: TextareaCellEditor,
        cellStyle: () => preWrapWordBreak,
        headerComponent: CellHeader,
        headerComponentParams: {
          headerText: t("Label"),
          constraint: t("max label chars", { maxLabelChars: MAX_ATTR_LABEL_CHARS }),
          helpText: t("Language-specific label for an attribute")
        },
        cellEditorParams: {
          maxLength: MAX_ATTR_LABEL_CHARS
        }
      },
      {
        field: "Description",
        editable: true,
        width: 260,
        cellEditor: TextareaCellEditor,
        cellEditorParams: {
          maxLength: MAX_ATTR_DESCRIPTION_CHARS
        },
        wrapText: true,
        cellStyle: () => preWrapWordBreak,
        headerComponent: CellHeader,
        headerComponentParams: {
          headerText: t("Description"),
          constraint: t("max description chars", {
            maxDescriptionChars: MAX_ATTR_DESCRIPTION_CHARS
          }),
          helpText: t(
            "Language-specific description of the attribute and should contain information that will help dataset users understand necessary details about each attribute"
          )
        }
      },
      {
        field: "List",
        editable: false,
        width: 305,
        cellRenderer: TruncatedListCell,
        cellStyle: () => greyCellStyle,
        headerComponent: CellHeader,
        headerComponentParams: {
          headerText: t("List"),
          helpText: t("Entry codes for Array type attributes")
        }
      }
    ],
    [t]
  );

  const getRowHeight = useCallback((params) => {
    const attrH = measureTextHeight(params.data?.Attribute || "", 120, {});
    const labelH = measureTextHeight(params.data?.Label || "", 200, {});
    const descH = measureTextHeight(params.data?.Description || "", 260, {});
    const maxH = Math.max(attrH, labelH, descH);
    return Math.max(32, maxH + 16);
  }, []);

  const onCellKeyDown = (e) => {
    const keyPressed = e.event.code;
    const isLabelRow = e.column.colId === "Label";

    if (keyPressed === "Enter" && isLabelRow) {
      const { api } = e;
      const editingRowIndex = e.rowIndex;
      api.setFocusedCell(editingRowIndex + 1, "Label");
    }
  };

  const onGridReady = useCallback(() => {
    setLoading(false);
  }, [setLoading]);

  const lanGridFixedViewport = attributeRowData.length >= AG_GRID_VIRTUALIZE_MIN_ROWS;
  const rowsForCurrentLanguage = lanAttributeRowData[currentLanguage] ?? [];
  const hasGridRows = rowsForCurrentLanguage.length > 0;

  useLayoutEffect(() => {
    const api = gridRef.current?.api;
    if (!api || !lanAttributeRowData[currentLanguage]?.length) return;
    api.resetRowHeights();
  }, [currentLanguage, lanAttributeRowData[currentLanguage]?.length]);

  const onCellValueChanged = useCallback(
    (event) => {
      if (event.source !== "edit") return;

      const { colDef, data, newValue } = event;
      const attributeName = data.Attribute;
      const { field } = colDef;

      const updatedLanAttributeRowData = { ...lanAttributeRowData };
      if (!updatedLanAttributeRowData[currentLanguage]) {
        updatedLanAttributeRowData[currentLanguage] = [];
      }

      updatedLanAttributeRowData[currentLanguage] = updatedLanAttributeRowData[
        currentLanguage
      ].map((row) =>
        row.Attribute === attributeName ? { ...row, [field]: newValue } : row
      );

      updateSchema({
        lanAttributeRowData: updatedLanAttributeRowData
      });

      if (colDef.field === "Label" || colDef.field === "Description") {
        event.api.refreshCells({ rowNodes: [event.node], force: true });
        event.api.resetRowHeights();
      }
    },
    [lanAttributeRowData, currentLanguage, updateSchema]
  );

  return (
    <div
      className={`lan-grid ag-theme-balham${lanGridFixedViewport ? "" : " ag-grid-compact"}`}
      style={{
        width: 885,
        overflowX: "hidden",
        ...(hasGridRows ? { backgroundColor: CustomPalette.GREY_200 } : {}),
        ...(lanGridFixedViewport ? {} : { height: "fit-content" })
      }}
    >
      <style>
        {gridStyles}
        {`
          ${
            hasGridRows
              ? `
          .lan-grid .ag-root-wrapper,
          .lan-grid .ag-root-wrapper-body,
          .lan-grid .ag-body-viewport,
          .lan-grid .ag-center-cols-viewport,
          .lan-grid .ag-body-horizontal-scroll-viewport {
            background-color: ${CustomPalette.GREY_200} !important;
          }
          .lan-grid .ag-cell[col-id="Label"],
          .lan-grid .ag-cell[col-id="Description"] {
            background-color: ${CustomPalette.WHITE} !important;
          }
          .lan-grid .ag-header-cell[col-id="Attribute"],
          .lan-grid .ag-header-cell[col-id="Label"],
          .lan-grid .ag-header-cell[col-id="Description"],
          .lan-grid .ag-header-cell[col-id="List"] {
            background-color: ${CustomPalette.WHITE} !important;
          }
          `
              : ""
          }
          .lan-grid.ag-theme-balham {
            --ag-row-hover-color: transparent;
            --ag-column-hover-color: transparent;
            ${
              lanGridFixedViewport
                ? "height: min(70vh, 560px); min-height: 120px;"
                : !hasGridRows
                  ? `min-height: ${AG_GRID_EMPTY_MAIN_STEP_GRID_MIN_PX}px;`
                  : "min-height: 0;"
            }
          }
          .lan-grid .ag-root-wrapper {
            height: ${lanGridFixedViewport ? "100%" : "auto"};
          }
          ${
            !hasGridRows && !lanGridFixedViewport
              ? `
          .lan-grid .ag-root.ag-layout-auto-height .ag-body-viewport {
            min-height: ${AG_GRID_EMPTY_MAIN_STEP_BODY_MIN_PX}px !important;
          }
          `
              : ""
          }
          .lan-grid .ag-body-horizontal-scroll {
            display: none !important;
          }
          .lan-grid .ag-header-viewport,
          .lan-grid .ag-body-viewport,
          .lan-grid .ag-center-cols-viewport {
            padding-right: 0 !important;
            overflow-x: hidden !important;
          }
          .lan-grid .ag-root-wrapper,
          .lan-grid .ag-body-viewport-wrapper {
            overflow-x: hidden !important;
          }
          .lan-grid .ag-header-cell:last-child {
            border-right: none !important;
            --ag-header-column-separator-display: none !important;
          }
          .lan-grid .ag-header-cell:last-child * {
            border-right: none !important;
            box-shadow: none !important;
          }
          .lan-grid .ag-header-row .ag-header-cell:last-child::after {
            display: none !important;
          }
          .lan-grid .ag-center-cols-viewport .ag-cell:last-child {
            border-right: none !important;
          }
          .lan-grid .ag-cell[col-id="List"] {
            overflow: hidden;
            padding-right: 0;
          }
          .lan-grid .ag-cell[col-id="List"] .ag-cell-wrapper,
          .lan-grid .ag-cell[col-id="List"] .ag-cell-wrapper > * {
            width: 100%;
          }
        `}
        {agGridEditableCellHoverCss}
      </style>
      <AgGridReact
        key={`${i18n.language}-${lanGridFixedViewport ? "fx" : "ah"}`}
        ref={gridRef}
        domLayout={lanGridFixedViewport ? undefined : "autoHeight"}
        style={{
          width: "100%",
          height: lanGridFixedViewport ? "100%" : "auto"
        }}
        rowData={lanAttributeRowData[currentLanguage] ?? []}
        columnDefs={columnDefs}
        onCellKeyDown={onCellKeyDown}
        onCellValueChanged={onCellValueChanged}
        onGridReady={onGridReady}
        getRowHeight={getRowHeight}
        suppressHorizontalScroll
        suppressRowHoverHighlight
        getRowId={(params) => params.data.Attribute}
        immutableData
        overlayNoRowsTemplate={`<span class="ag-overlay-no-rows-center">${t("No Rows to Show")}</span>`}
      />
    </div>
  );
}
