import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef
} from "react";
import { useTranslation } from "react-i18next";
import { AgGridReact } from "ag-grid-react";
import { useMultiSchema } from "../schema/schemaContext";
import CellHeader from "../components/CellHeader";
import { greyCellStyle, gridStyles, preWrapWordBreak } from "../constants/styles";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-balham.css";
import { MAX_ATTR_DESCRIPTION_CHARS, MAX_ATTR_LABEL_CHARS } from "../constants/constants";
import { langCodeOCAFromName } from "../utils/languageUtils";
import { measureTextHeight } from "../utils/measureTextLines";
import TextareaCellEditor from "../components/TextareaCellEditor";

// Compact renderer moved to module scope to avoid defining components during render
const CompactListRenderer = ({ value }) => {
  const text = value || "";
  return (
    <span
      title={text}
      style={{
        display: "inline-block",
        maxWidth: "100%",
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis"
      }}
    >
      {text}
    </span>
  );
};

export default function LanGrid({ gridRef, currentLanguage, setLoading }) {
  const { t, i18n } = useTranslation();

  // Use MultiSchemaContext
  const {
    getSchema,
    getAttributesList,
    updateSchema,
    getLanguages
  } = useMultiSchema();

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
  }, [getSchema]);

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
  const attributesWithLists = useMemo(
    () => schemaState?.attributesWithLists || [],
    [schemaState?.attributesWithLists]
  );

  // effectiveAttributesList is now just attributesList (already computed correctly)
  const effectiveAttributesList = attributesList;

  const stableEntryCodes = useMemo(() => {
    const schemaState = getSchema();
    return schemaState?.entryCodes || {};
  }, [getSchema]);

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
            listDisplay = t("Not a List");
          } else {
            const listDisplayArray = [];
            stableEntryCodes[item]?.forEach((row) => {
              // Entry codes are normalized at source to use language names
              const value = row[language] || row.Code;
              if (value) listDisplayArray.push(value);
            });
            const listDisplayString = listDisplayArray.join(" | ");
            listDisplay = listDisplayString || t("Not a List");
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
            listDisplay = t("Not a List");
          } else {
            const listDisplayArray = [];
            stableEntryCodes[item.Attribute]?.forEach((row) => {
              // Entry codes are normalized at source to use language names
              const value = row[language] || row.Code;
              if (value) listDisplayArray.push(value);
            });
            const listDisplayString = listDisplayArray.join(" | ");
            listDisplay = listDisplayString || t("Not a List");
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

  const columnDefs = useMemo(() => [
    {
      field: "Attribute",
      editable: false,
      width: 120,
      wrapText: true,
      cellStyle: () => preWrapWordBreak,
      headerComponent: CellHeader,
      headerComponentParams: {
        headerText: t("Attribute"),
        helpText: t("This is the name for the attribute and, for example...")
      }
    },
    {
      field: "Label",
      editable: true,
      width: 250,
      wrapText: true,
      cellEditor: TextareaCellEditor,
      cellStyle: () => preWrapWordBreak,
      headerComponent: CellHeader,
      headerComponentParams: {
        headerText: t("Label"),
        constraint: t("max label chars", { maxLabelChars: MAX_ATTR_LABEL_CHARS }),
        helpText: t("This is the language specific label for an attribute")
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
        helpText: t("This is a language specific description of the attribute...")
      }
    },
    {
      field: "List",
      headerName: t("List"),
      editable: false,
      flex: 2,
      minWidth: 320,
      tooltipField: "List",
      cellRenderer: CompactListRenderer,
      cellStyle: (params) =>
        attributesWithLists.includes(params.data.Attribute) ? {} : greyCellStyle
    }
  ], [t, attributesWithLists]);

  const getRowHeight = useCallback((params) => {
    const attrH = measureTextHeight(params.data?.Attribute || "", 104);
    const labelH = measureTextHeight(params.data?.Label || "", 234);
    const descH = measureTextHeight(params.data?.Description || "", 244);
    const maxH = Math.max(attrH, labelH, descH);
    return Math.max(32, maxH + 4);
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

  useEffect(() => {
    const api = gridRef.current?.api;
    if (!api) return;
    const raf = requestAnimationFrame(() => {
      api.resetRowHeights();
    });
    return () => cancelAnimationFrame(raf);
  }, [currentLanguage]);

  const onCellValueChanged = useCallback(
    (event) => {
      // Only update state after editing is complete, not during typing
      if (event.source !== "edit") return;
      
      const { colDef, data, newValue } = event;
      const attributeName = data.Attribute;
      const { field } = colDef;

      // Update local lanAttributeRowData
      const updatedLanAttributeRowData = { ...lanAttributeRowData };
      if (!updatedLanAttributeRowData[currentLanguage]) {
        updatedLanAttributeRowData[currentLanguage] = [];
      }

      updatedLanAttributeRowData[currentLanguage] = updatedLanAttributeRowData[
        currentLanguage
      ].map((row) =>
        row.Attribute === attributeName ? { ...row, [field]: newValue } : row
      );

      // Update schema state
      updateSchema({
        lanAttributeRowData: updatedLanAttributeRowData
      });
    },
    [lanAttributeRowData, currentLanguage, updateSchema]
  );

  return (
    <div className="ag-theme-balham" style={{ width: 890 }}>
      <style>
        {gridStyles}
        {`
          .ag-theme-balham .ag-root-wrapper-body.ag-layout-auto-height {
            min-height: unset !important;
          }
          .ag-theme-balham.ag-layout-auto-height {
            height: auto !important;
          }
        `}
      </style>
      {lanAttributeRowData[currentLanguage] &&
      lanAttributeRowData[currentLanguage].length > 0 ? (
        <AgGridReact
          ref={gridRef}
          rowData={lanAttributeRowData[currentLanguage]}
          columnDefs={columnDefs}
          onCellKeyDown={onCellKeyDown}
          onCellValueChanged={onCellValueChanged}
          domLayout="autoHeight"
          onGridReady={onGridReady}
          getRowHeight={getRowHeight}
          getRowId={(params) => params.data.Attribute}
          immutableData={true}
        />
      ) : (
        <div style={{ padding: "20px", textAlign: "center", color: "#666" }}>
          {t("No attributes available")}
        </div>
      )}
    </div>
  );
}
