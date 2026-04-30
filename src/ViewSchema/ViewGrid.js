import React, { useState, useRef, useEffect, useCallback, memo } from "react";
import { useTranslation } from "react-i18next";
import { Box } from "@mui/material";
import { AgGridReact } from "../components/AgGridReact";
import { useMultiSchema } from "../schema/schemaContext";
import { agGridEditableCellHoverCss, greyCellStyle } from "../constants/styles";
import { measureTextHeight } from "../utils/measureTextLines";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-balham.css";
import { getListOfSelectedOverlays } from "../utils/overlayUtils";
import CellHeader from "../components/CellHeader";
import TypeTooltip from "../AttributeDetails/TypeTooltip";
import { getFormatRuleDescription } from "../utils/helpers";
import { getMapValueForAttributeName } from "../utils/stringUtils";
import { getRootCaptureBaseId } from "../utils/packageUtils";
import TruncatedListCell from "../components/TruncatedListCell";
import {
  ADC,
  FIELD_CHARACTER_ENCODING_OVERLAY,
  FIELD_RANGE_OVERLAY,
  FIELD_UNIT_FRAMING_OVERLAY,
  FIELD_FORMAT_OVERLAY,
  FIELD_CONFORMANCE_OVERLAY,
  FIELD_CARDINALITY_OVERLAY,
  FIELD_ATTRIBUTE_FRAMING_OVERLAY,
  FIELD_FORM_INFORMATION_OVERLAY,
  FIELD_DATA_SEPARATOR_OVERLAY,
  MAX_ATTR_DESCRIPTION_CHARS,
  MAX_ATTR_LABEL_CHARS,
  UNIT_FRAMING,
  AG_GRID_EMPTY_MAIN_STEP_BODY_MIN_PX,
  AG_GRID_EMPTY_MAIN_STEP_GRID_MIN_PX,
  AG_GRID_VIRTUALIZE_MIN_ROWS
} from "../constants/constants";

const viewGridStyles = `
.ag-cell {
  line-height: 1.25 !important;
  padding: 0 6px !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
}

.ag-row {
  border-bottom-width: 1px !important;
}

.ag-header-cell-label {
  display: flex;
  justify-content: center;
  align-items: center;
}

.ag-body-viewport-wrapper.ag-layout-normal {
  overflow-x: scroll;
  overflow-y: scroll;
}

.ag-center-cols-clipper {
  min-height: unset !important;
}

.ag-cell[col-id="List"] {
  overflow: hidden;
  padding: 0 0 0 6px !important;
}

.ag-cell[col-id="Format Rule"] {
  padding: 6px !important;
}

.view-schema-grid .ag-header-viewport {
  padding-right: 17px;
}

.view-schema-grid .ag-pinned-left-cols-container {
  border-right: 1px solid var(--ag-border-color, #babfc7);
}

.view-schema-grid .ag-horizontal-left-spacer,
.view-schema-grid .ag-horizontal-right-spacer {
  overflow-x: hidden !important;
}

.ag-header-cell:last-child {
  border-right: none !important;
  --ag-header-column-separator-display: none !important;
}
.ag-header-cell:last-child * {
  border-right: none !important;
  box-shadow: none !important;
}
.ag-header-row .ag-header-cell:last-child::after {
  display: none !important;
}
.ag-center-cols-viewport .ag-cell:last-child {
  border-right: none !important;
}
`;

const defaultColDef = {
  width: 120,
  editable: false,
  cellStyle: () => greyCellStyle
};

const CheckboxRenderer = ({ value }) => {
  const inputRef = useRef();

  useEffect(() => {
    inputRef.current.checked = value;
  }, [value]);

  return <input type="checkbox" ref={inputRef} disabled />;
};


export const ListRenderer = memo((props) => {
  const { t } = useTranslation();
  const listText = props?.data?.List;
  const notAListText = t("Not a List");

  if (!listText || listText === notAListText) {
    return <Box />;
  }

  return <TruncatedListCell value={listText} />;
});

export default function ViewGrid({
  displayArray,
  currentLanguage,
  setLoading = () => {},
  packageWithEdits = null
}) {
  const { t, i18n } = useTranslation();
  
  // Get overlay data from MultiSchemaContext
  const { getOverlaySelections, getSchema, updateSchema } = useMultiSchema();
  const overlay = getOverlaySelections();
  const schemaState = getSchema();
  
  const [columnDefs, setColumnDefs] = useState([]);
  const [rowData, setRowData] = useState([]);
  const gridRef = useRef();

  // Extract unit framing metadata from built package (with edits)
  // But the metadata CAN'T be edited so is this pointless?
  const unitFramingOverlay =
    packageWithEdits?.extensions?.[ADC]?.[getRootCaptureBaseId(packageWithEdits)]
      ?.overlays?.[UNIT_FRAMING];

  const onGridReady = useCallback(() => {
    if (setLoading) {
      setLoading(false);
    }
  }, [setLoading]);

  const computeRowPixelHeight = useCallback((data) => {
    const opts = { compact: true };
    const attrH = measureTextHeight(data?.Attribute || "", 104, opts);
    const unitH = measureTextHeight(data?.Unit || "", 74, opts);
    const typeH = measureTextHeight(data?.Type || "", 104, opts);
    const labelH = measureTextHeight(data?.Label || "", 154, opts);
    const descH = measureTextHeight(data?.Description || "", 334, opts);
    const maxH = Math.max(attrH, unitH, typeH, labelH, descH);
    return Math.max(32, maxH + 14);
  }, []);

  const getRowHeight = useCallback(
    (params) => computeRowPixelHeight(params.data),
    [computeRowPixelHeight]
  );

  useEffect(() => {
    const getColumns = () => {
      
      const predefinedColumns = [
        {
          field: "Attribute",
          headerName: t("Attribute"),
          width: 120,
          pinned: "left",
          lockPosition: "left",
          suppressMovable: true,
          wrapText: true,
          headerComponent: CellHeader,
          headerComponentParams: {
            headerText: t("Attribute"),
            helpText: t("Name for the attribute and, for example, the column header in every tabular data set no matter what language")
          }
        },
        {
          field: "Sensitive",
          width: 98,
          headerComponent: CellHeader,
          headerComponentParams: {
            headerText: t("Sensitive"),
            helpText: (
              <>
                <div>
                  {t("If the attribute could be considered Personally Identifiable...")}
                </div>
                <br />
                <div>
                  {t("Examples of PII include names, locations, postal codes...")}
                </div>
              </>
            )
          },
          cellRenderer: CheckboxRenderer
        },
        {
          field: "Unit",
          headerName: t("Unit"),
          width: 90,
          wrapText: true,
          headerComponent: CellHeader,
          headerComponentParams: {
            headerText: t("Unit"),
            helpText: t(
              "The units of each attribute. Leave blank if the attribute is not a measurement and has no units."
            )
          }
        },
        {
          field: "Type",
          headerName: t("Type"),
          wrapText: true,
          headerComponent: CellHeader,
          headerComponentParams: {
            headerText: t("Type"),
            helpText: <TypeTooltip />
          },
          valueFormatter: (params) => {
            const type = params.value;
            const typeMap = {
              "Text": t("Text"),
              "Numeric": t("Numeric"),
              "Boolean": t("Boolean"),
              "Binary": t("Binary"),
              "Binaryfile": t("Binaryfile"),
              "DateTime": t("DateTime"),
              "Array[Text]": t("Array[Text]"),
              "Array[Numeric]": t("Array[Numeric]"),
              "Array[Boolean]": t("Array[Boolean]"),
              "Array[Binary]": t("Array[Binary]"),
              "Array[Binaryfile]": t("Array[Binaryfile]"),
              "Array[DateTime]": t("Array[DateTime]"),
              "Child Schema": t("Child Schema"),
              "Placeholder Child Schema": t("Placeholder Child Schema")
            };
            return typeMap[type] || type;
          }
        },
        {
          field: "Label",
          wrapText: true,
          width: 215,
          headerComponent: CellHeader,
          headerComponentParams: {
            headerText: t("Label"),
            constraint: t("max label chars", { maxLabelChars: MAX_ATTR_LABEL_CHARS }),
            helpText: t("Language-specific label for an attribute")
          }
        },
        {
          field: "Description",
          flex: 1,
          minWidth: 350,
          wrapText: true,
          headerComponent: CellHeader,
          headerComponentParams: {
            headerText: t("Description"),
            constraint: t("max description chars", {
              maxDescriptionChars: MAX_ATTR_DESCRIPTION_CHARS
            }),
            helpText: t("Language-specific description of the attribute and should contain information that will help dataset users understand necessary details about each attribute")
          }
        },
        {
          field: "List",
          headerName: t("List"),
          flex: 2,
          minWidth: 320,
          wrapText: false,
          headerComponent: CellHeader,
          headerComponentParams: {
            headerText: t("List"),
            helpText: t("Rather than allowing free text entry into a record, you may wish to limit entries to one of a few in a list. For example, you may wish to create a list of choices for gender, or for experimental farm name, or for species. You will then be able to create entries for your list that will be part of the schema.")
          },
          cellRenderer: ListRenderer
        }
      ];

      const { selectedKeys } = getListOfSelectedOverlays(overlay);
      selectedKeys.forEach((overlayKey) => {
        if (overlayKey === FIELD_RANGE_OVERLAY) {
          predefinedColumns.push({
            field: "LowerBound",
            width: 130,
            autoHeight: true,
            headerComponent: CellHeader,
            headerComponentParams: {
              headerText: t("Lower Bound"),
              helpText: t("The lower bound of the range")
            }
          });

          predefinedColumns.push({
            field: "LowerInclusive",
            width: 140,
            autoHeight: true,
            headerComponent: CellHeader,
            headerComponentParams: {
              headerText: t("Lower Inclusive"),
              helpText: t("Whether or not the lower bound is included in the range")
            },
            cellRenderer: CheckboxRenderer
          });

          predefinedColumns.push({
            field: "UpperBound",
            width: 130,
            autoHeight: true,
            headerComponent: CellHeader,
            headerComponentParams: {
              headerText: t("Upper Bound"),
              helpText: t("The upper bound of the range")
            }
          });

          predefinedColumns.push({
            field: "UpperInclusive",
            width: 140,
            autoHeight: true,
            headerComponent: CellHeader,
            headerComponentParams: {
              headerText: t("Upper Inclusive"),
              helpText: t("Whether or not the upper bound is included in the range")
            },
            cellRenderer: CheckboxRenderer
          });
        } else if (overlayKey === FIELD_CONFORMANCE_OVERLAY) {
          // Handle Required column
          predefinedColumns.push({
            field: "Required",
            width: 120,
            autoHeight: true,
            headerComponent: CellHeader,
            headerComponentParams: {
              headerText: t("Required"),
              helpText: t("Check for each attribute where the data entry cannot be left empty in a dataset")
            },
            cellRenderer: CheckboxRenderer
          });
        } else if (overlayKey === FIELD_CHARACTER_ENCODING_OVERLAY) {
          predefinedColumns.push({
            field: FIELD_CHARACTER_ENCODING_OVERLAY,
            width: 180,
            autoHeight: true,
            headerComponent: CellHeader,
            headerComponentParams: {
              headerText: t("Character Encoding"),
              helpText: t("The character encoding that is applied to the attribute")
            }
          });
        } else if (overlayKey === FIELD_FORMAT_OVERLAY) {
          // Handle Format Rule column
          predefinedColumns.push({
            field: "Format Rule",
            width: 160,
            autoHeight: true,
            headerComponent: CellHeader,
            headerComponentParams: {
              headerText: t("Format Rule"),
              helpText: t("The format rule that is applied to the attribute")
            },
            valueFormatter: (params) =>
              getFormatRuleDescription(params.data.Type, params.value, t) || params.value
          });
        } else if (overlayKey === FIELD_CARDINALITY_OVERLAY) {
          predefinedColumns.push({
            field: FIELD_CARDINALITY_OVERLAY,
            width: 140,
            autoHeight: true,
            headerComponent: CellHeader,
            headerComponentParams: {
              headerText: t("Cardinality"),
              helpText: t("The cardinality that is applied to the attribute")
            }
          });
        } else if (overlayKey === FIELD_ATTRIBUTE_FRAMING_OVERLAY) {
          predefinedColumns.push({
            field: FIELD_ATTRIBUTE_FRAMING_OVERLAY,
            width: 180,
            autoHeight: true,
            headerComponent: CellHeader,
            headerComponentParams: {
              headerText: t("Attribute Framing"),
              helpText: t("The attribute framing that is applied to the attribute")
            }
          });
        } else if (overlayKey === FIELD_UNIT_FRAMING_OVERLAY) {
          const baseHelpText = t("The unit framing that is applied to the attribute");
          let helpText = baseHelpText;
          if (unitFramingOverlay?.framing_metadata) {
            const helpTextElements = Object.entries(unitFramingOverlay.framing_metadata).map(
              ([key, value], index) => (
                <React.Fragment key={key}>
                  {index > 0 && <br />}
                  <strong>{key}:</strong> &quot;{value}&quot;
                </React.Fragment>
              )
            );
            helpText = (
              <>
                {baseHelpText}
                <br />
                {helpTextElements}
              </>
            );
          }

          predefinedColumns.push({
            field: "Unit Framing",
            width: 160,
            autoHeight: true,
            headerComponent: CellHeader,
            headerComponentParams: {
              headerText: t("Unit Framing"),
              helpText
            }
          });
        } else if (overlayKey === FIELD_FORM_INFORMATION_OVERLAY) {
          predefinedColumns.push({
            field: FIELD_FORM_INFORMATION_OVERLAY,
            headerName: t("Form"),
            width: 102,
            autoHeight: true,
            headerComponent: CellHeader,
            headerComponentParams: {
              headerText: t("Form"),
              helpText: t("Indicates whether this attribute is included in the form")
            },
            cellRenderer: CheckboxRenderer
          });
        } else if (overlayKey === FIELD_DATA_SEPARATOR_OVERLAY) {
          // Data Separator is the only overlay with an attribute-specific part
          // (the Array Delimiter). Only surface the column when the user has
          // actually enabled the Array Delimiter sub-section.
          if (!schemaState?.enableArrayDelimiter) return;

          const arrayDelimiterLabel = (value) => {
            switch (value) {
              case ",": return t("Comma (,)");
              case "\t": return t("Tab (\\t)");
              case ";": return t("Semicolon (;)");
              case "|": return t("Pipe (|)");
              default: return value || "";
            }
          };

          predefinedColumns.push({
            field: "ArrayDelimiter",
            width: 160,
            autoHeight: true,
            headerComponent: CellHeader,
            headerComponentParams: {
              headerText: t("Array Delimiter"),
              helpText: t("Delimiter used between values inside this array attribute")
            },
            valueFormatter: (params) => arrayDelimiterLabel(params.value)
          });
        } else {
          // Map overlay feature names to actual data fields when needed
          const normalized = (overlayKey || "").toString().toLowerCase();
          const isFormat =
            normalized === "format rules" ||
            normalized === "format rule" ||
            normalized === "format";
          const isRequired =
            normalized === "required entry" ||
            normalized === "required entry" ||
            normalized === "required";
          const mappedField = isFormat
            ? "Format Rule"
            : isRequired
              ? "Required"
              : overlayKey;
          const useCheckbox = isRequired || overlayKey === FIELD_CONFORMANCE_OVERLAY;

          predefinedColumns.push({
            field: mappedField,
            width: 160,
            autoHeight: true,
            headerComponent: CellHeader,
            headerComponentParams: {
              headerText: isFormat
                ? t("Format Rule")
                : isRequired
                  ? t("Required")
                  : t(overlayKey),
              helpText: isRequired
                ? t("Check for each attribute where the data entry cannot be left empty in a dataset")
                : isFormat
                  ? t("The format rule that is applied to the attribute")
                  : t("Overlay value for this attribute") + "."
            },
            cellRenderer: useCheckbox ? CheckboxRenderer : null
          });
        }
      });

      return predefinedColumns;
    };

    setColumnDefs(getColumns());
  }, [overlay, t, displayArray, unitFramingOverlay?.framing_metadata, schemaState?.enableArrayDelimiter]);

  useEffect(() => {
    const api = gridRef.current?.api;
    if (!api) return;
    const raf = requestAnimationFrame(() => {
      api.resetRowHeights();
    });
    return () => cancelAnimationFrame(raf);
  }, [currentLanguage]);

  useEffect(() => {
    const newRowData = JSON.parse(JSON.stringify(displayArray));
    const attributeCardinality = schemaState?.attributeCardinality || {};
    const attributeFormats = schemaState?.attributeFormats || {};

    // Initialize attributeFormats if overlay is selected but data doesn't exist
    if (overlay && overlay[FIELD_FORMAT_OVERLAY] && typeof schemaState?.attributeFormats === "undefined") {
      updateSchema({ attributeFormats: {} });
    }

    newRowData.forEach((item) => {
      // Add null checks to prevent errors
      item.Description =
        item.Description && item.Description[currentLanguage]
          ? item.Description[currentLanguage]
          : "";
      item.Label =
        item.Label && item.Label[currentLanguage] ? item.Label[currentLanguage] : "";
      item.List =
        item.List && item.List[currentLanguage]
          ? item.List[currentLanguage]
          : "";

      // Translate Type column value
      item.Type = item.Type; // why is this self assigned?
      
      // Get cardinality value from object
      const cardinalityValue = getMapValueForAttributeName(attributeCardinality, item.Attribute);
      if (cardinalityValue) {
        item.Cardinality = cardinalityValue;
      }
      
      // Add Required and Format Rule data from overlay selections
      if (overlay) {
        // Add Required field data
        if (overlay[FIELD_CONFORMANCE_OVERLAY]) {
          // Load required data from schema state
          const requiredOverlayData = schemaState?.requiredOverlayData;
          if (requiredOverlayData) {
            const requiredItem = requiredOverlayData.find((req) => req.Attribute === item.Attribute);
            item.Required = requiredItem ? requiredItem.Required : false;
          } else {
            item.Required = item.Required || false; // Default to false if not set
          }
        }
        
        // Add Format Rule field data
        if (overlay[FIELD_FORMAT_OVERLAY]) {
          // Get format rule from object
          item["Format Rule"] = getMapValueForAttributeName(attributeFormats, item.Attribute) || "";
        }
        
        // Add Form Information checkbox data
        if (overlay[FIELD_FORM_INFORMATION_OVERLAY]) {
          // Check if this attribute has a placeholder defined in any language
          const formPlaceholders = schemaState?.formPlaceholdersByLanguage || {};
          const hasPlaceholder = Object.values(formPlaceholders).some(
            langPlaceholders => langPlaceholders && langPlaceholders[item.Attribute]
          );
          item[FIELD_FORM_INFORMATION_OVERLAY] = hasPlaceholder;
        }

        // Array Delimiter: only populated for Array[...] attributes when the
        // Array Delimiter sub-section of the Data Separator overlay is enabled.
        if (overlay[FIELD_DATA_SEPARATOR_OVERLAY] && schemaState?.enableArrayDelimiter) {
          const isArrayType = typeof item.Type === "string" && item.Type.startsWith("Array[");
          if (isArrayType) {
            const arrayDelimiterData = schemaState?.arrayDelimiterData || {};
            item.ArrayDelimiter = arrayDelimiterData[item.Attribute] ?? "";
          } else {
            item.ArrayDelimiter = "";
          }
        }
      }
    });

    setRowData(newRowData);
  }, [displayArray, currentLanguage, overlay, schemaState?.attributeFormats, schemaState?.requiredOverlayData, schemaState?.attributeCardinality, schemaState?.formPlaceholdersByLanguage, schemaState?.arrayDelimiterData, schemaState?.enableArrayDelimiter, updateSchema]);

  const viewSchemaGridFixedViewport =
    rowData.length >= AG_GRID_VIRTUALIZE_MIN_ROWS;
  const noAttributes = (schemaState?.attributes || []).length === 0;
  const viewSchemaBodyViewportMinHeight = noAttributes
    ? `${AG_GRID_EMPTY_MAIN_STEP_BODY_MIN_PX}px`
    : "unset";

  const viewSchemaAutoHeightTightBodyCss = viewSchemaGridFixedViewport
    ? ""
    : `.view-schema-grid .ag-root-wrapper-body.ag-layout-auto-height{min-height:unset!important}.view-schema-grid .ag-layout-auto-height .ag-center-cols-clipper{min-height:unset!important}.view-schema-grid .ag-layout-auto-height .ag-body-viewport{flex:none!important;min-height:${viewSchemaBodyViewportMinHeight}!important}.view-schema-grid .ag-body-viewport-wrapper{min-height:unset!important}.view-schema-grid .ag-layout-auto-height .ag-body-viewport-wrapper{flex:none!important;min-height:unset!important}`;

  return (
    <div
      className={`view-schema-grid ag-theme-balham${viewSchemaGridFixedViewport ? "" : " ag-grid-compact"}`}
      style={{ width: "100%" }}
    >
      <style>{`${viewGridStyles}${agGridEditableCellHoverCss}`}</style>
      <style>{`
.view-schema-grid.ag-theme-balham {
  ${viewSchemaGridFixedViewport ? "height: min(70vh, 560px);" : ""}
  min-height: ${noAttributes ? AG_GRID_EMPTY_MAIN_STEP_GRID_MIN_PX : 120}px;
}
.view-schema-grid .ag-root-wrapper {
  height: ${viewSchemaGridFixedViewport ? "100%" : "auto"};
}
${viewSchemaAutoHeightTightBodyCss}
`}</style>
      <AgGridReact
        key={`${i18n.language}-${viewSchemaGridFixedViewport ? "fx" : "ah"}`}
        ref={gridRef}
        domLayout={viewSchemaGridFixedViewport ? undefined : "autoHeight"}
        style={{
          width: "100%",
          height: viewSchemaGridFixedViewport ? "100%" : "auto"
        }}
        rowData={rowData}
        columnDefs={columnDefs}
        defaultColDef={defaultColDef}
        onGridReady={onGridReady}
        getRowHeight={getRowHeight}
        overlayNoRowsTemplate={`<span class="ag-overlay-no-rows-center">${t("No Rows to Show")}</span>`}
      />
    </div>
  );
}
