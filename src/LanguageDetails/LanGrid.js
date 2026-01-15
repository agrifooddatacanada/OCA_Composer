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
import { useMultiSchema } from "../context/MultiSchemaContext";
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
    getCompleteSchema
  } = useMultiSchema();
  
  // Get the current schema ID (handles manual creation case where currentSchemaId from context is null)
  const currentSchemaId = getCurrentSchemaId();
  
  // Get schema-specific languages from per-schema metadata
  const schemaState = getSchemaState(currentSchemaId);
  const languages = schemaState?.metadata?.languages || [];

  // Get schema-specific overlay data from unified context, formatted for LanGrid
  const schemaOverlay = useMemo(() => {
    const completeSchema = getCompleteSchema(currentSchemaId);
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
  }, [getCompleteSchema, currentSchemaId]);

  // Get schema state data with stable references
  const attributesList = useMemo(
    () => getAttributesList(currentSchemaId), // Computed from attributes
    [getAttributesList, currentSchemaId, schemaState?.attributes] // Re-compute when attributes change
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
    const currentSchemaState = getSchemaState(currentSchemaId);
    return currentSchemaState?.entryCodes || {};
  }, [currentSchemaId, getSchemaState]); // eslint-disable-line react-hooks/exhaustive-deps





  // Track last computed data per schema to prevent infinite updates
  const lastDataHashRef = useRef({});

  // Sets Language Dependent Attribute row data
  useEffect(() => {
    if (!currentSchemaId) return;

    // Get current schema state
    const currentSchemaState = getSchemaState(currentSchemaId);
    
    // For manually created schemas (not initialized yet but has attributes),
    // we still need to populate the language data.
    // Skip update ONLY if there are no attributes to populate from.
    const hasAttributes = effectiveAttributesList && effectiveAttributesList.length > 0;
    
    if (!hasAttributes) return;

    // Debounce the update to prevent flickering during rapid state changes
    const timeoutId = setTimeout(() => {
      // Get entry codes from memoized value
      const entryCodesMap = stableEntryCodes;

      // Build schema-scoped overlay maps (labels, entries, codes) from overlay context first
      const labelByLang = {};
      const entriesByLang = {};

      // Use overlay data from context
      if (schemaOverlay?.label) {
        Object.keys(schemaOverlay.label).forEach((lang) => {
          labelByLang[lang] = schemaOverlay.label[lang] || {};
        });
      }
      if (schemaOverlay?.entry) {
        Object.keys(schemaOverlay.entry).forEach((lang) => {
          entriesByLang[lang] = schemaOverlay.entry[lang] || {};
        });
      }

      // Check if we have existing language attribute data - if so, we should preserve user edits
      const existingLanData = lanAttributeRowData;
      const hasExistingUserData = existingLanData && Object.keys(existingLanData).length > 0 && 
        Object.values(existingLanData).some(langData => 
          Array.isArray(langData) && langData.some(item => item.Label && item.Label.trim() !== "")
        );

      // If user has made edits, don't regenerate from scratch - just ensure all attributes are present
      if (hasExistingUserData) {
        // Only add missing attributes, don't overwrite existing ones, and remove deleted attributes
        const updatedLanData = { ...existingLanData };
        
        languages.forEach((language) => {
          if (!updatedLanData[language]) {
            updatedLanData[language] = [];
          }
          
          // Remove attributes that are no longer in the effective attributes list
          updatedLanData[language] = updatedLanData[language].filter(item => 
            effectiveAttributesList.includes(item.Attribute)
          );
          
          // Add any new attributes that aren't already present
          const existingAttributes = updatedLanData[language].map(item => item.Attribute);
          effectiveAttributesList.forEach((attr) => {
            if (!existingAttributes.includes(attr)) {
              const overlayLangKey = getOCACodeFromLangName(language);
              const infoByLang = schemaOverlay.information || {};
              updatedLanData[language].push({
                Attribute: attr,
                Label: labelByLang?.[overlayLangKey]?.[attr] || "",
                Description: infoByLang?.[overlayLangKey]?.[attr] || "",
                List: "Not a List"
              });
            }
          });
        });
        
        // Update schema state with preserved user data
        // MultiSchemaContext handles null schemaId internally
        const newDataHash = JSON.stringify(updatedLanData);
        if (lastDataHashRef.current !== newDataHash) {
          lastDataHashRef.current = newDataHash;
          updateSchemaState(currentSchemaId, {
            lanAttributeRowData: updatedLanData
          });
        }
        return;
      }

      // Recompute from scratch for the current schema to avoid leaking rows across schemas
      const newLanAttributeRowData = {};
      languages.forEach((language) => {
        const overlayLang = getOCACodeFromLangName(language);
        
        const newLanguageList = [];
        effectiveAttributesList.forEach((item) => {
          // Use saved entry codes for List display (no fallback to avoid flickering)
          const overlayLangKey =
            getOCACodeFromLangName(language);
          const entryCodesForItem = entryCodesMap?.[item] || [];

          const listDisplayArray = entryCodesForItem
            .map((row) => {
              // Prioritize human-readable text over raw codes
              const displayValue =
                row?.[language] || row?.[overlayLangKey] || row?.English || row?.eng;
              // Only use Code as last resort and only if it's meaningful text
              return (
                displayValue ||
                (row?.Code && row.Code !== displayValue ? row.Code : null)
              );
            })
            .filter((txt) => txt && txt.trim() !== "");

          // Only show list if we have actual entry codes (prevents flickering on initial load)
          const listDisplayString = listDisplayArray.join(" | ");

          // Check if this attribute should have entry codes
          const shouldHaveEntryCodes =
            Object.prototype.hasOwnProperty.call(entryCodesMap, item) ||
            effectiveAttributesList?.some(
              (attr) => attr.name === item && attr.type === "array"
            );

          let listDisplay = listDisplayString;
          if (!listDisplayString) {
            listDisplay = shouldHaveEntryCodes ? "Loading..." : "Not a List";
          }

          if (listDisplayArray.length > 3) {
            const shown = listDisplayArray.slice(0, 3).join(" | ");
            const remaining = listDisplayArray.length - 3;
            listDisplay = `${shown} +${remaining} more`;
          }
          
          // Get information (description) for this language
          const infoByLang = schemaOverlay.information || {};
          
          newLanguageList.push({
            Attribute: item,
            Label: labelByLang?.[overlayLang]?.[item] || "",
            Description: infoByLang?.[overlayLang]?.[item] || "",
            List: listDisplay
          });
        });
        newLanAttributeRowData[language] = newLanguageList;
      });

      // Save to schema state only if data has changed to prevent infinite loops
      // MultiSchemaContext handles null schemaId internally
      const newDataHash = JSON.stringify(newLanAttributeRowData);

      // Only update if the data has actually changed for this specific schema
      if (lastDataHashRef.current[currentSchemaId] !== newDataHash) {
        lastDataHashRef.current[currentSchemaId] = newDataHash;
        updateSchemaState(currentSchemaId, {
          lanAttributeRowData: newLanAttributeRowData
        });
      }
    }, 100); // 100ms debounce to prevent flickering

    // Cleanup timeout on unmount or dependency change
    return () => clearTimeout(timeoutId);
  }, [
    languages,
    attributeRowData,
    schemaOverlay,
    currentSchemaId,
    effectiveAttributesList,
    stableEntryCodes
  ]); // eslint-disable-line react-hooks/exhaustive-deps

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
      updateSchemaState(currentSchemaId, {
        lanAttributeRowData: updatedLanAttributeRowData
      });
    },
    [lanAttributeRowData, currentLanguage, currentSchemaId, updateSchemaState]
  );

  // Refresh List data when currentLanguage changes or entry codes update
  // Use a ref to track if we've already updated to prevent infinite loops
  const listUpdateInProgressRef = useRef(false);
  
  useEffect(() => {
    if (!currentLanguage || !currentSchemaId || listUpdateInProgressRef.current) return;

    const schemaState = getSchemaState(currentSchemaId);
    const savedEntryCodes = schemaState?.entryCodes || {};
    const currentLangData = schemaState?.lanAttributeRowData?.[currentLanguage] || [];

    // Update List column for current language
    const updatedLangData = currentLangData.map((row) => {
      const attrName = row.Attribute;
      const entryCodesForAttr = savedEntryCodes[attrName] || [];

      if (entryCodesForAttr.length > 0) {
        const listItems = entryCodesForAttr
          .map((codeRow) => {
            // Prioritize human-readable text over raw codes
            const displayValue =
              codeRow[currentLanguage] || codeRow.English || codeRow.eng;
            // Only use Code as last resort if it's meaningful
            return (
              displayValue ||
              (codeRow.Code && codeRow.Code !== displayValue ? codeRow.Code : null)
            );
          })
          .filter(Boolean);

        let listDisplay = listItems.join(" | ") || "Loading...";
        if (listItems.length > 3) {
          const shown = listItems.slice(0, 3).join(" | ");
          const remaining = listItems.length - 3;
          listDisplay = `${shown} +${remaining} more`;
        }

        return { ...row, List: listDisplay };
      }

      // Check if this attribute should have entry codes
      const shouldHaveEntryCodes =
        Object.prototype.hasOwnProperty.call(savedEntryCodes, attrName) ||
        effectiveAttributesList?.some(
          (attr) => attr.name === attrName && attr.type === "array"
        );

      const listDisplay = shouldHaveEntryCodes ? "Loading..." : "Not a List";
      return { ...row, List: listDisplay };
    });

    // Only update if the List values actually changed (to prevent infinite loops)
    const listDataChanged = currentLangData.some((row, index) => {
      const newRow = updatedLangData[index];
      return newRow && row.List !== newRow.List;
    });

    if (listDataChanged) {
      listUpdateInProgressRef.current = true;
      const updatedLanAttributeRowData = {
        ...schemaState.lanAttributeRowData,
        [currentLanguage]: updatedLangData
      };

      updateSchemaState(currentSchemaId, {
        lanAttributeRowData: updatedLanAttributeRowData
      });
      
      // Reset the flag after state update completes
      setTimeout(() => {
        listUpdateInProgressRef.current = false;
      }, 0);
    }
  }, [currentLanguage, currentSchemaId, stableEntryCodes]);

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
