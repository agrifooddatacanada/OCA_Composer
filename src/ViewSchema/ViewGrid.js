import React, { useState, useRef, useEffect, useContext, useCallback, memo } from "react";
import { useTranslation } from "react-i18next";
import { AgGridReact } from "ag-grid-react";
import { Box, Tooltip } from "@mui/material";
import { Context } from "../App";
import { useMultiSchema } from "../context/MultiSchemaContext";
import { greyCellStyle } from "../constants/styles";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-balham.css";
import getListOfSelectedOverlays from "../constants/getListOfSelectedOverlays";
import CellHeader from "../components/CellHeader";
import TypeTooltip from "../AttributeDetails/TypeTooltip";
import {
  ADC,
  FIELD_RANGE_OVERLAY,
  FIELD_UNIT_FRAMING_OVERLAY,
  FIELD_FORMAT_OVERLAY,
  FIELD_CONFORMANCE_OVERLAY,
  MAX_ATTR_DESCRIPTION_CHARS,
  MAX_ATTR_LABEL_CHARS,
  UNIT_FRAMING,
  CUSTOM_FORMAT_RULE
} from "../constants/constants";
import SelectedFeatureHeader from "./SelectedFeatureHeader";

const gridStyles = `
.ag-cell {
  line-height: 1.5
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
  setLoading = () => {}
}) {
  const { t } = useTranslation();
  const { OCAPackage } = useContext(Context);
  
  // Get overlay data from MultiSchemaContext
  const { activeSchemaId, getOverlaySelections, getSchemaState, updateSchemaState } = useMultiSchema();
  const currentSchemaId = activeSchemaId;
  const overlay = getOverlaySelections(currentSchemaId);
  const schemaState = getSchemaState(currentSchemaId);
  
  // Get cardinality data from MultiSchema context instead of legacy context
  const cardinalityData = schemaState?.cardinalityData || [];
  
  const [columnDefs, setColumnDefs] = useState([]);
  const [rowData, setRowData] = useState([]);

  const unitFramingOverlay =
    OCAPackage?.extensions?.[ADC]?.[OCAPackage?.oca_bundle?.bundle?.capture_base?.d]
      ?.overlays?.[UNIT_FRAMING];

  const onGridReady = useCallback(() => {
    if (setLoading) {
      setLoading(false);
    }
  }, [setLoading]);

  useEffect(() => {
    const getColumns = () => {
      // // eslint-disable-next-line no-console
      // console.log("ViewGrid Debug - overlay:", overlay);
      // // eslint-disable-next-line no-console  
      // console.log("ViewGrid Debug - displayArray:", displayArray);
      // // eslint-disable-next-line no-console
      // console.log("ViewGrid Debug - Format Rules:", displayArray.map(item => ({ 
      //   Attribute: item.Attribute, 
      //   FormatRule: item["Format Rule"] 
      // })));
      
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
        // Character Encoding follows (in case overlay not selected)
        {
          field: "Character Encoding",
          width: 180,
          autoHeight: true,
          headerComponent: CellHeader,
          headerComponentParams: {
            headerText: t("Character Encoding")
          }
        },
        {
          field: "List",
          headerName: t("List"),
          flex: 2,
          minWidth: 320,
          autoHeight: true,
          headerComponent: CellHeader,
          headerComponentParams: {
            headerText: t("List"),
            helpText: t("Rather than allow free text entry into a record, you may...")
          },
          cellRenderer: ListRenderer
        }
      ];

      const { selectedFeatures } = getListOfSelectedOverlays(overlay);
      selectedFeatures.forEach((feature) => {
        if (feature === FIELD_RANGE_OVERLAY) {
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
            width: 120,
            autoHeight: true,
            headerComponent: CellHeader,
            headerComponentParams: {
              headerText: t("Inclusive"),
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
            width: 120,
            autoHeight: true,
            headerComponent: CellHeader,
            headerComponentParams: {
              headerText: t("Inclusive"),
              helpText: t("Whether or not the upper bound is included in the range")
            },
            cellRenderer: CheckboxRenderer
          });
        } else if (feature === FIELD_CONFORMANCE_OVERLAY) {
          // Handle Required column
          predefinedColumns.push({
            field: "Required",
            width: 120,
            autoHeight: true,
            headerComponent: SelectedFeatureHeader,
            headerComponentParams: {
              feature
            },
            cellRenderer: CheckboxRenderer
          });
        } else if (feature === FIELD_FORMAT_OVERLAY) {
          // Handle Format Rule column
          predefinedColumns.push({
            field: "Format Rule",
            width: 160,
            autoHeight: true,
            headerComponent: SelectedFeatureHeader,
            headerComponentParams: {
              feature
            }
          });
        } else if (feature === FIELD_UNIT_FRAMING_OVERLAY) {
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
        } else {
          // Map overlay feature names to actual data fields when needed
          const normalized = (feature || "").toString().toLowerCase();
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
              : feature;
          const useCheckbox = isRequired || feature === "Make selected entries required";

          predefinedColumns.push({
            field: mappedField,
            width: 160,
            autoHeight: true,
            headerComponent: SelectedFeatureHeader,
            headerComponentParams: {
              feature
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
    const newCardinalityData = JSON.parse(JSON.stringify(cardinalityData));

    // Initialize format rule data in schema state if overlay is selected but data doesn't exist
    if (overlay && overlay[FIELD_FORMAT_OVERLAY]?.selected && !schemaState?.formatRuleData && newRowData.length > 0) {
      const initialFormatRuleData = newRowData.map((item) => ({
        Attribute: item.Attribute,
        Type: item.Type || "Text",
        "Format Rule": "",
        [CUSTOM_FORMAT_RULE]: ""
      }));
      updateSchemaState(currentSchemaId, { formatRuleData: initialFormatRuleData });
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

      // Find cardinality data by attribute name instead of index to ensure correct mapping
      const cardinalityItem = newCardinalityData.find(card => card.Attribute === item.Attribute);
      if (cardinalityItem && (cardinalityItem.EntryLimit || cardinalityItem.Cardinality)) {
        item.Cardinality = cardinalityItem.EntryLimit || cardinalityItem.Cardinality;
      }
      
      // Add Required and Format Rule data from overlay selections
      if (overlay) {
        // Add Required field data
        if (overlay[FIELD_CONFORMANCE_OVERLAY]?.selected) {
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
        if (overlay[FIELD_FORMAT_OVERLAY]?.selected) {
          // Load format rule data from schema state
          const formatRuleData = schemaState?.formatRuleData;
          if (formatRuleData) {
            const formatRuleItem = formatRuleData.find((rule) => rule.Attribute === item.Attribute);
            // Handle both legacy FormatText field and new "Format Rule" field
            item["Format Rule"] = formatRuleItem ? (formatRuleItem["Format Rule"] || formatRuleItem.FormatText || "") : "";
          } else {
            item["Format Rule"] = item["Format Rule"] || ""; // Default to empty if not set
          }
        }
      }
    });

    setRowData(newRowData);
  }, [displayArray, cardinalityData, currentLanguage, overlay, schemaState?.formatRuleData, schemaState?.requiredOverlayData, currentSchemaId, updateSchemaState]);

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
