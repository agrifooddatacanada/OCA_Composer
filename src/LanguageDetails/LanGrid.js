import React, {
  useState,
  useEffect,
  useContext,
  useImperativeHandle,
  forwardRef,
  useCallback,
  useMemo,
  useRef
} from "react";
import { useTranslation } from "react-i18next";
import { AgGridReact } from "ag-grid-react";
import { Context } from "../App";
import { useMultiSchema } from "../schema/schemaContext";
import CellHeader from "../components/CellHeader";
import { greyCellStyle, gridStyles, preWrapWordBreak } from "../constants/styles";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-balham.css";
import { MAX_ATTR_DESCRIPTION_CHARS, MAX_ATTR_LABEL_CHARS } from "../constants/constants";
import { getOCACodeFromLangName } from "../utils/languageUtils";

const textareaStyle = {
  width: "100%",
  height: "100%",
  resize: "none",
  outline: "none",
  border: "none",
  fontFamily:
    // eslint-disable-next-line quotes
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif',
  fontSize: "12px",
  padding: "4px 6px",
  boxSizing: "border-box",
  lineHeight: "1.4"
};

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

const TextareaCellEditor = forwardRef((props, ref) => {
  const [value, setValue] = useState(props.value);
  const textareaRef = useRef(null);

  useEffect(() => {
    setValue(props.value);
  }, [props.value]);

  // Auto-focus the textarea when editor opens
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
      // Move cursor to end of text
      textareaRef.current.setSelectionRange(
        textareaRef.current.value.length,
        textareaRef.current.value.length
      );
    }
  }, []);

  useImperativeHandle(ref, () => ({
    getValue() {
      return value;
    },

    isCancelBeforeStart() {
      return false;
    },

    isCancelAfterEnd() {
      return false;
    }
  }));

  return (
    <textarea
      ref={textareaRef}
      maxLength={MAX_ATTR_DESCRIPTION_CHARS}
      style={textareaStyle}
      value={value}
      onChange={(event) => setValue(event.target.value)}
    />
  );
});

export default function LanGrid({ gridRef, currentLanguage, setLoading }) {
  const { t } = useTranslation();

  // Use MultiSchemaContext
  const {
    getCurrentSchemaId,
    getSchemaState,
    getAttributesList,
    updateSchemaState,
    getLanguages
  } = useMultiSchema();
  
  // Get the current schema ID (handles manual creation case where currentSchemaId from context is null)
  const currentSchemaId = getCurrentSchemaId();
  
  // Get schema-specific languages from per-schema metadata
  const schemaState = getSchemaState();
  const languages = schemaState?.metadata?.languages || [];

  // Get schema-specific overlay data from unified context, formatted for LanGrid
  const schemaOverlay = useMemo(() => {
    const completeSchema = getSchemaState();
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
    if (rawOverlays.label && Array.isArray(rawOverlays.label)) {
      rawOverlays.label.forEach((labelOverlay) => {
        const lang = labelOverlay.language;
        if (lang && labelOverlay.attribute_labels) {
          transformedOverlay.label[lang] = labelOverlay.attribute_labels;
        }
      });
    }

    // Process information overlays (for Description)
    if (rawOverlays.information && Array.isArray(rawOverlays.information)) {
      rawOverlays.information.forEach((infoOverlay) => {
        const lang = infoOverlay.language;
        if (lang && infoOverlay.attribute_information) {
          transformedOverlay.information[lang] = infoOverlay.attribute_information;
        }
      });
    }

    // Process entry overlays
    if (rawOverlays.entry && Array.isArray(rawOverlays.entry)) {
      rawOverlays.entry.forEach((entryOverlay) => {
        const lang = entryOverlay.language;
        if (lang && entryOverlay.attribute_entries) {
          transformedOverlay.entry[lang] = entryOverlay.attribute_entries;
        }
      });
    }

    return transformedOverlay;
  }, [getSchemaState, currentSchemaId]);

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

  // Memoize entry codes to prevent unnecessary re-renders
  // Return entry codes regardless of initialized status to support manually created schemas
  const stableEntryCodes = useMemo(() => {
    if (!currentSchemaId) return {};
    const currentSchemaState = getSchemaState();
    return currentSchemaState?.entryCodes || {};
  }, [currentSchemaId, getSchemaState]); // eslint-disable-line react-hooks/exhaustive-deps





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
            listDisplay = "Not a List";
          } else {
            const overlayLangKey = getOCACodeFromLangName(language);
            const listDisplayArray = [];
            stableEntryCodes[item]?.forEach((i) => {
              const value = i[language] || i[overlayLangKey] || i.English || i.eng || i.Code;
              if (value) listDisplayArray.push(value);
            });
            const listDisplayString = listDisplayArray.join(" | ");
            listDisplay = listDisplayString || "Not a List";
          }
          
          const overlayLangKey = getOCACodeFromLangName(language);
          newLanguageList.push({
            Attribute: item,
            Label: schemaOverlay?.label?.[overlayLangKey]?.[item] || "",
            Description: schemaOverlay?.information?.[overlayLangKey]?.[item] || "",
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
            listDisplay = "Not a List";
          } else {
            const overlayLangKey = getOCACodeFromLangName(language);
            const listDisplayArray = [];
            stableEntryCodes[item.Attribute]?.forEach((i) => {
              const value = i[language] || i[overlayLangKey] || i.English || i.eng || i.Code;
              if (value) listDisplayArray.push(value);
            });
            const listDisplayString = listDisplayArray.join(" | ");
            listDisplay = listDisplayString || "Not a List";
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
    
    updateSchemaState({
      lanAttributeRowData: newLanAttributeRowData
    });
  }, [languages, stableEntryCodes, attributeRowData]);

  const [columnDefs, setColumnDefs] = useState([]);

  useEffect(() => {
    setColumnDefs([
      {
        field: "Attribute",
        editable: false,
        width: 120,
        wrapText: true,
        autoHeight: true,
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
        autoHeight: true,
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
        autoHeight: true,
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
    ]);
  }, [effectiveAttributesList, t, attributesWithLists]);

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
      updateSchemaState({
        lanAttributeRowData: updatedLanAttributeRowData
      });
    },
    [lanAttributeRowData, currentLanguage, updateSchemaState]
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
