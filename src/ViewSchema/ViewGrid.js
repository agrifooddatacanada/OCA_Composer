import React, { useState, useRef, useEffect, useContext, useCallback, memo, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { AgGridReact } from "../components/AgGridReact";
import { Box } from "@mui/material";
import { Context } from "../App";
import { useMultiSchema } from "../schema/schemaContext";
import { greyCellStyle } from "../constants/styles";
import { measureTextHeight } from "../utils/measureTextLines";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-balham.css";
import { getListOfSelectedOverlays } from "../utils/overlayUtils";
import CellHeader from "../components/CellHeader";
import TypeTooltip from "../AttributeDetails/TypeTooltip";
import { getFormatRuleDescription } from "../utils/helpers";
import { getMapValueForAttributeName } from "../utils/stringUtils";
import { getRootCaptureBaseId } from "../utils/packageUtils";
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
  MAX_ATTR_DESCRIPTION_CHARS,
  MAX_ATTR_LABEL_CHARS,
  UNIT_FRAMING,
  CUSTOM_FORMAT_RULE
} from "../constants/constants";
import SelectedFeatureHeader from "./SelectedFeatureHeader";

const gridStyles = `
.ag-cell {
  line-height: 1 !important;
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

.ag-root-wrapper-body.ag-layout-auto-height {
  min-height: 80px !important;
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

import TruncatedListCell from "../components/TruncatedListCell";

export const ListRenderer = memo((props) => {
  const { t } = useTranslation();
  const listText = props?.data?.List;
  const notAListText = t("Not a List");

  if (!listText || listText === notAListText) {
    return <Box>{notAListText}</Box>;
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

  const reservedGridMinHeight = useMemo(() => {
    const headerRowPx = 49;
    if (!rowData.length) return headerRowPx + 80;
    return headerRowPx + rowData.reduce((sum, row) => sum + computeRowPixelHeight(row), 0);
  }, [rowData, computeRowPixelHeight]);

  useEffect(() => {
    const getColumns = () => {
      
      const predefinedColumns = [
        {
          field: "Attribute",
          headerName: t("Attribute"),
          wrapText: true,
          headerComponent: CellHeader,
          headerComponentParams: {
            headerText: t("Attribute"),
            helpText: t("This is the name for the attribute and, for example...")
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
              "The units of each attribute (or leave blank if the attribute is..."
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
              'Text': t('Text'),
              'Numeric': t('Numeric'),
              'Boolean': t('Boolean'),
              'Binary': t('Binary'),
              'Binaryfile': t('Binaryfile'),
              'DateTime': t('DateTime'),
              'Array[Text]': t('Array[Text]'),
              'Array[Numeric]': t('Array[Numeric]'),
              'Array[Boolean]': t('Array[Boolean]'),
              'Array[Binary]': t('Array[Binary]'),
              'Array[Binaryfile]': t('Array[Binaryfile]'),
              'Array[DateTime]': t('Array[DateTime]'),
              'Child Schema': t('Child Schema'),
              'Placeholder Child Schema': t('Placeholder Child Schema')
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
            helpText: t("This is the language specific label for an attribute")
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
              helpText: `${t("The lower bound of the range")}.`
            }
          });

          predefinedColumns.push({
            field: "LowerInclusive",
            width: 140,
            autoHeight: true,
            headerComponent: CellHeader,
            headerComponentParams: {
              headerText: t("Lower Inclusive"),
              helpText: `${t("Whether or not the lower bound is included in the range")}.`
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
              helpText: `${t("The upper bound of the range")}.`
            }
          });

          predefinedColumns.push({
            field: "UpperInclusive",
            width: 140,
            autoHeight: true,
            headerComponent: CellHeader,
            headerComponentParams: {
              headerText: t("Upper Inclusive"),
              helpText: `${t("Whether or not the upper bound is included in the range")}.`
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
  }, [overlay, t, displayArray, unitFramingOverlay?.framing_metadata]);

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
          : t("Not a List");

      // Translate Type column value
      item.Type = item.Type;
      
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
      }
    });

    setRowData(newRowData);
  }, [displayArray, currentLanguage, overlay, schemaState?.attributeFormats, schemaState?.requiredOverlayData, schemaState?.attributeCardinality, schemaState?.formPlaceholdersByLanguage, updateSchema, t]);

  return (
    <div
      className="view-schema-grid ag-theme-balham"
      style={{ width: "100%", minHeight: reservedGridMinHeight }}
    >
      <style>{gridStyles}</style>
      <AgGridReact
        key={i18n.language}
        ref={gridRef}
        rowData={rowData}
        columnDefs={columnDefs}
        defaultColDef={defaultColDef}
        domLayout="autoHeight"
        onGridReady={onGridReady}
        getRowHeight={getRowHeight}
        overlayNoRowsTemplate={`<span class="ag-overlay-no-rows-center">${t("No Rows to Show")}</span>`}
      />
    </div>
  );
}
