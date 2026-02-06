import React, { useState, useRef, useEffect, useContext, useCallback, memo, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { AgGridReact } from "ag-grid-react";
import { Box, Tooltip } from "@mui/material";
import { Context } from "../App";
import { useMultiSchema } from "../schema/schemaContext";
import { greyCellStyle } from "../constants/styles";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-balham.css";
import { getListOfSelectedOverlays } from "../utils/overlayUtils";
import CellHeader from "../components/CellHeader";
import TypeTooltip from "../AttributeDetails/TypeTooltip";
import { getFormatRuleDescription } from "../utils/helpers";
import {
  ADC,
  FIELD_RANGE_OVERLAY,
  FIELD_UNIT_FRAMING_OVERLAY,
  FIELD_FORMAT_OVERLAY,
  FIELD_CONFORMANCE_OVERLAY,
  FIELD_FORM_INFORMATION_OVERLAY,
  MAX_ATTR_DESCRIPTION_CHARS,
  MAX_ATTR_LABEL_CHARS,
  UNIT_FRAMING,
  CUSTOM_FORMAT_RULE
} from "../constants/constants";
import SelectedFeatureHeader from "./SelectedFeatureHeader";

const gridStyles = `
.ag-cell {
  line-height: 1 !important;
  padding: 0 !important;
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

::-webkit-scrollbar {
  -webkit-appearance: none;
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-thumb {
  border-radius: 4px;
  background-color: rgba(0,0,0,.5);
  box-shadow: 0 0 1px rgba(255,255,255,.5);
}

.ag-center-cols-clipper {
  min-height: unset !important;
}

.ag-root-wrapper-body.ag-layout-auto-height {
  min-height: 80px !important;
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
  const listText = props?.data?.List;
  if (!listText || listText === "Not a List") {
    return <Box>Not a List</Box>;
  }

  // Render plain text with single-line ellipsis and a tooltip for full content
  return (
    <Tooltip title={listText} placement="top" arrow>
      <Box
        sx={{
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
          width: "100%"
        }}
      >
        {listText}
      </Box>
    </Tooltip>
  );
});

export default function ViewGrid({
  displayArray,
  currentLanguage,
  setLoading = () => {},
  packageWithEdits = null
}) {
  const { t } = useTranslation();
  
  // Get overlay data from MultiSchemaContext
  const { getOverlaySelections, getSchema, updateSchema } = useMultiSchema();
  const overlay = getOverlaySelections();
  const schemaState = getSchema();
  
  const [columnDefs, setColumnDefs] = useState([]);
  const [rowData, setRowData] = useState([]);

  // Extract unit framing metadata from built package (with edits)
  // But the metadata CAN'T be edited so is this pointless?
  const unitFramingOverlay =
    packageWithEdits?.extensions?.[ADC]?.[packageWithEdits?.oca_bundle?.bundle?.capture_base?.d]
      ?.overlays?.[UNIT_FRAMING];

  const onGridReady = useCallback(() => {
    if (setLoading) {
      setLoading(false);
    }
  }, [setLoading]);

  useEffect(() => {
    const getColumns = () => {
      
      const predefinedColumns = [
        {
          field: "Attribute",
          headerName: t("Attributes"),
          autoHeight: true,
          headerComponent: CellHeader,
          headerComponentParams: {
            headerText: t("Attributes"),
            helpText: t("This is the name for the attribute and, for example...")
          }
        },
        {
          field: "Flagged",
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
          autoHeight: true,
          headerComponent: CellHeader,
          headerComponentParams: {
            headerText: t("Unit"),
            helpText: t(
              "The units of each attribute (or leave blank if the attribute is..."
            )
          }
        },
        {
          field: "Type",
          headerName: t("Type"),
          autoHeight: true,
          headerComponent: CellHeader,
          headerComponentParams: {
            headerText: t("Type"),
            helpText: <TypeTooltip />
          }
        },
        {
          field: "Label",
          autoHeight: true,
          width: 170,
          headerComponent: CellHeader,
          headerComponentParams: {
            headerText: t("Label"),
            constraint: t("max label chars", { maxLabelChars: MAX_ATTR_LABEL_CHARS }),
            helpText: t("This is the language specific label for an attribute")
          }
        },
        {
          field: "Description",
          flex: 1,
          minWidth: 350,
          autoHeight: true,
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
          flex: 2,
          minWidth: 320,
          wrapText: false,
          headerComponent: CellHeader,
          headerComponentParams: {
            headerText: t("List"),
            helpText: t("Rather than allow free text entry into a record, you may...")
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
            headerComponent: SelectedFeatureHeader,
            headerComponentParams: {
              feature: overlayKey
            },
            cellRenderer: CheckboxRenderer
          });
        } else if (overlayKey === FIELD_FORMAT_OVERLAY) {
          // Handle Format Rule column
          predefinedColumns.push({
            field: "Format Rule",
            width: 160,
            autoHeight: true,
            headerComponent: SelectedFeatureHeader,
            headerComponentParams: {
              feature: overlayKey
            },
            valueFormatter: (params) =>
              getFormatRuleDescription(params.data.Type, params.value) || params.value
          });
        } else if (overlayKey === FIELD_UNIT_FRAMING_OVERLAY) {
          let helpText = "";
          if (unitFramingOverlay?.framing_metadata) {
            const helpTextElements = Object.entries(
              unitFramingOverlay.framing_metadata
            ).map(([key, value], index) => (
              <React.Fragment key={key}>
                {index > 0 && <br />}
                <strong>{key}:</strong> &quot;{value}&quot;
              </React.Fragment>
            ));
            helpText = helpTextElements;
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
            field: "Add Form Information",
            headerName: t("Form"),
            width: 98,
            autoHeight: true,
            headerComponent: CellHeader,
            headerComponentParams: {
              headerText: t("Form"),
              helpText: t("Indicates whether this attribute is included in the form")
            },
            cellRenderer: CheckboxRenderer
          });
        } else {
          // Map overlay feature names to actual data fields when needed
          const normalized = (overlayKey || "").toString().toLowerCase();
          const isFormat =
            normalized === "format rules" ||
            normalized === "format rule" ||
            normalized === "add format rule for data";
          const isRequired =
            normalized === "make selected entries required" ||
            normalized === "required entry" ||
            normalized === "required";
          const mappedField = isFormat
            ? "Format Rule"
            : isRequired
              ? "Required"
              : overlayKey;
          const useCheckbox = isRequired || overlayKey === "Make selected entries required";

          predefinedColumns.push({
            field: mappedField,
            width: 160,
            autoHeight: true,
            headerComponent: SelectedFeatureHeader,
            headerComponentParams: {
              feature: overlayKey
            },
            cellRenderer: useCheckbox ? CheckboxRenderer : null
          });
        }
      });

      return predefinedColumns;
    };

    setColumnDefs(getColumns());
  }, [overlay, t, displayArray, unitFramingOverlay?.framing_metadata]);

  useEffect(() => {
    const newRowData = JSON.parse(JSON.stringify(displayArray));
    const attributeCardinality = schemaState?.attributeCardinality || {};
    const attributeFormats = schemaState?.attributeFormats || {};

    // Initialize attributeFormats if overlay is selected but data doesn't exist
    if (overlay && overlay[FIELD_FORMAT_OVERLAY] && typeof schemaState?.attributeFormats === 'undefined') {
      updateSchema({ attributeFormats: {} });
    }

    newRowData.forEach((item, index) => {
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
          : "Not a List";

      // Get cardinality value from object
      const cardinalityValue = attributeCardinality[item.Attribute];
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
          item["Format Rule"] = attributeFormats[item.Attribute] || "";
        }
        
        // Add Form Information checkbox data
        if (overlay[FIELD_FORM_INFORMATION_OVERLAY]) {
          // Check if this attribute has a placeholder defined in any language
          const formPlaceholders = schemaState?.formPlaceholdersByLanguage || {};
          const hasPlaceholder = Object.values(formPlaceholders).some(
            langPlaceholders => langPlaceholders && langPlaceholders[item.Attribute]
          );
          item["Add Form Information"] = hasPlaceholder;
        }
      }
    });

    setRowData(newRowData);
  }, [displayArray, currentLanguage, overlay, schemaState?.attributeFormats, schemaState?.requiredOverlayData, schemaState?.attributeCardinality, schemaState?.formPlaceholdersByLanguage, updateSchema]);

  return (
    <div className="ag-theme-balham" style={{ width: "100%" }}>
      <style>{gridStyles}</style>
      <AgGridReact
        rowData={rowData}
        columnDefs={columnDefs}
        defaultColDef={defaultColDef}
        domLayout="autoHeight"
        onGridReady={onGridReady}
      />
    </div>
  );
}
