import React, { useCallback, useContext, useEffect, useMemo, useRef, useState, forwardRef, useImperativeHandle } from "react";
import { useTranslation } from "react-i18next";
import { AgGridReact } from "../components/AgGridReact";
import { Alert, Box, Button, IconButton, Tooltip, Typography } from "@mui/material";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";

import { Context } from "../App";
import { useMultiSchema } from "../schema/schemaContext";
import BackNextSkeleton from "../components/BackNextSkeleton";
import {
  AG_GRID_VIRTUALIZE_MIN_ROWS,
  BETWEEN_SECTION_SPACING,
  FIELD_RANGE_OVERLAY,
  isRangeEligibleAttributeType
} from "../constants/constants";
import DeleteConfirmation from "./DeleteConfirmation";
import CellHeader from "../components/CellHeader";
import { flexCenter, gridStyles, greyCellStyle, rangeOverlayViewportCss } from "../constants/styles";
import CheckboxHeader from "../components/CheckboxHeader";
import Loading from "../components/Loading";
import CheckboxRenderer from "../AttributeDetails/CheckboxRenderer";
import { getCurrentData, getFormatRuleDescription } from "../utils/helpers";
import { getMapValueForAttributeName, normalizeAttributeNameKey } from "../utils/stringUtils";
import { measureTextHeight } from "../utils/measureTextLines";
import { matchFormat } from "../OCADataValidator/utils/matchRules";
import { useDeleteOverlayHandler } from "../utils/overlayUtils";
import { getAllGridRowData, useOverlayGridOnGridReady } from "./gridUtils";

const RANGE_FORMAT_ALERT_MS = 3000;

function computeRangeErrors(rows) {
  const nextErrors = {};
  for (const row of rows) {
    if (row.LowerBound === "" && row.UpperBound === "") continue;
    if (row.LowerBound) {
      if (!matchFormat(row.Type, row.FormatRule, row.LowerBound, false)) {
        nextErrors[row.Attribute] = { ...nextErrors[row.Attribute], LowerBound: true };
      }
    }
    if (row.UpperBound) {
      if (!matchFormat(row.Type, row.FormatRule, row.UpperBound, false)) {
        nextErrors[row.Attribute] = { ...nextErrors[row.Attribute], UpperBound: true };
      }
    }
  }
  return nextErrors;
}

function hasRangeValidationFailures(errors) {
  return Object.values(errors).some((attrErrors) =>
    Object.values(attrErrors).some(Boolean)
  );
}

const Range = forwardRef((props, ref) => {
  const {
    setCurrentPage,
    setSelectedOverlay,
  } = useContext(Context);
  
  // Use MultiSchema context with standard pattern
  const { 
    getSchema, 
    updateSchema, 
    getRangeData,
    setRangeRowData,
    schemaStates,
    getCurrentSchemaId
  } = useMultiSchema();
  
  const schemaState = getSchema();
  const deleteHandler = useDeleteOverlayHandler(FIELD_RANGE_OVERLAY);

  const rangeRowData = useMemo(() => {
    return getRangeData() || [];
  }, [getRangeData, schemaStates, getCurrentSchemaId]);
  
  const { t, i18n } = useTranslation();
  const gridRef = useRef();
  const [loading, setLoading] = useState(true);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [shouldRevalidate, setShouldRevalidate] = useState(false);
  const [errors, setErrors] = useState({});
  const [showValidationError, setShowValidationError] = useState(false);

  const getCellValidationStyle = useCallback(
    (params) => {
      if (errors[params.data.Attribute]?.[params.colDef.field]) {
        return {
          backgroundColor: "#ffd7e9"
        };
      }
      return {
        backgroundColor: "#d2f8d2"
      };
    },
    [errors]
  );

  const getRowHeight = useCallback(
    (params) => {
      const attrH = measureTextHeight(params.data?.Attribute || "", 164);
      const formatDesc = getFormatRuleDescription(params.data?.Type, params.data?.FormatRule, t) || "";
      const formatH = measureTextHeight(formatDesc, 224);
      const lowerH = measureTextHeight(params.data?.LowerBound || "", 114);
      const upperH = measureTextHeight(params.data?.UpperBound || "", 114);
      const maxH = Math.max(attrH, formatH, lowerH, upperH);
      return Math.max(32, maxH + 8);
    },
    [t]
  );

  const columnDefs = useMemo(
    () => [
      {
        field: "Attribute",
        width: 180,
        wrapText: true,
        cellStyle: () => greyCellStyle,
        headerComponent: CellHeader,
        headerComponentParams: {
          headerText: t("Attribute"),
          helpText: t("Name for the attribute and, for example, the column header in every tabular data set no matter what language")
        }
      },
      {
        field: "FormatRule",
        width: 240,
        wrapText: true,
        cellStyle: () => greyCellStyle,
        headerComponent: CellHeader,
        headerComponentParams: {
          headerText: t("Format Rule"),
          helpText: t("The format rule that is applied to the attribute")
        },
        valueFormatter: (params) =>
          getFormatRuleDescription(params.data.Type, params.value, t) || params.value
      },
      {
        field: "LowerBound",
        width: 130,
        editable: true,
        wrapText: true,
        headerComponent: CellHeader,
        headerComponentParams: {
          headerText: t("Lower Bound"),
          helpText: t("The lower bound of the range")
        },
        cellStyle: getCellValidationStyle,
        wrapText: true
      },
      {
        field: "LowerInclusive",
        width: 120,
        headerComponent: CheckboxHeader,
        headerComponentParams: {
          gridRef,
          field: "LowerInclusive",
          columnName: t("Inclusive"),
          helpText: t("Whether or not the lower bound is included in the range")
        },
        cellRenderer: CheckboxRenderer,
        cellRendererParams: {
          gridRef
        },
        checkboxSelection: false,
        cellStyle: () => flexCenter
      },
      {
        field: "UpperBound",
        width: 130,
        editable: true,
        wrapText: true,
        headerComponent: CellHeader,
        headerComponentParams: {
          headerText: t("Upper Bound"),
          helpText: t("The upper bound of the range")
        },
        cellStyle: getCellValidationStyle,
        wrapText: true
      },
      {
        field: "UpperInclusive",
        width: 120,
        headerComponent: CheckboxHeader,
        headerComponentParams: {
          gridRef,
          field: "UpperInclusive",
          columnName: t("Inclusive"),
          helpText: t("Whether or not the upper bound is included in the range")
        },
        cellRenderer: CheckboxRenderer,
        cellRendererParams: {
          gridRef
        },
        checkboxSelection: false,
        cellStyle: () => flexCenter
      }
    ],
    [t, getCellValidationStyle]
  );

  const onGridReady = useOverlayGridOnGridReady(setLoading);

  const flashRangeValidationAlert = useCallback(() => {
    setShowValidationError(true);
    setTimeout(() => {
      setShowValidationError(false);
    }, RANGE_FORMAT_ALERT_MS);
  }, []);

  const validateGrid = useCallback(
    (options = {}) => {
      const { flashOnError = true } = options;
      const api = gridRef.current?.api;
      if (!api) {
        return true;
      }
      api.stopEditing();
      const newData = getCurrentData(api, true);
      const nextErrors = computeRangeErrors(newData);
      setErrors(nextErrors);
      if (hasRangeValidationFailures(nextErrors)) {
        if (flashOnError) {
          flashRangeValidationAlert();
        }
        api.refreshCells({ force: true });
        return false;
      }
      return true;
    },
    [flashRangeValidationAlert]
  );

  const handleSave = useCallback(() => {
    if (!gridRef.current?.api) return;
    gridRef.current.api.stopEditing();
    const rowData = getAllGridRowData(gridRef.current.api);
    setRangeRowData(rowData);
  }, [setRangeRowData]);

  useImperativeHandle(
    ref,
    () => ({
      validate: () => validateGrid({ flashOnError: true }),
      save: handleSave
    }),
    [validateGrid, handleSave]
  );

  const handleForward = () => {
    if (!validateGrid()) {
      return;
    }
    handleSave();
    setSelectedOverlay("");
    setCurrentPage("Overlays");
  };

  const handleLeaveToOverlays = () => {
    if (!validateGrid()) {
      return;
    }
    handleSave();
    setCurrentPage("Overlays");
  };

  // Initialize attributeRanges from attributeFormats if empty (e.g., after deletion and re-adding)
  useEffect(() => {
    const attributeFormats = schemaState?.attributeFormats || {};
    const attributeRanges = schemaState?.attributeRanges || {};
    const attributes = schemaState?.attributes || [];
    
    // Only initialize if attributeRanges is empty but attributeFormats exists
    if (Object.keys(attributeRanges).length === 0 && Object.keys(attributeFormats).length > 0 && attributes.length > 0) {
      const newRanges = {};
      
      attributes.forEach((attribute) => {
        const formatRule = getMapValueForAttributeName(attributeFormats, attribute.Attribute);
        
        if (!isRangeEligibleAttributeType(attribute.Type) || !formatRule) {
          return;
        }

        newRanges[normalizeAttributeNameKey(attribute.Attribute)] = {
          lower: "",
          upper: "",
          lower_inclusive: false,
          upper_inclusive: false
        };
      });

      if (Object.keys(newRanges).length > 0) {
        updateSchema({ attributeRanges: newRanges });
      }
    }
  }, [schemaState?.attributeFormats, schemaState?.attributeRanges, schemaState?.attributes, updateSchema]);

  const onCellValueChanged = (params) => {
    if (params.colDef.field === "LowerBound" || params.colDef.field === "UpperBound") {
      params.column.colDef.cellStyle = { "background-color": "none" };
      params.api.refreshCells({
        force: true,
        columns: [params.colDef.field],
        rowNodes: [params.node]
      });
      params.api.resetRowHeights();
      setShouldRevalidate(true);
    }
  };

  const rangeGridFixedViewport =
    rangeRowData.length >= AG_GRID_VIRTUALIZE_MIN_ROWS;
  const handleValidate = () => {
    setShouldRevalidate(false);
    validateGrid({ flashOnError: false });
  };

  return (
    <BackNextSkeleton
      isForward
      isBack
      pageForward={handleForward}
      pageBack={handleLeaveToOverlays}
    >
      {loading && <Loading />}
      {showDeleteConfirmation && (
        <DeleteConfirmation
          removeFromSelected={deleteHandler}
          closeModal={() => setShowDeleteConfirmation(false)}
        />
      )}
      {showValidationError && (
        <Alert severity="error">
          One or more range values do not match the format rules. Please fix them before
          proceeding.
        </Alert>
      )}
      <Box sx={{ my: "2rem", mb: BETWEEN_SECTION_SPACING }}>
        <Box
          className={`range-overlay-grid overlay-grid-suppress-hscroll ag-theme-balham${rangeGridFixedViewport ? "" : " ag-grid-compact"}`}
          sx={{ width: 920 }}
        >
          <style>{gridStyles}</style>
          <style>{rangeOverlayViewportCss(rangeGridFixedViewport)}</style>
          <Box sx={{ display: "flex", alignItems: "center", mb: "1.6rem", position: "relative" }}>
            <Tooltip title={t("Range bounds must match the format rules.")} placement="top" arrow>
              <IconButton size="small" sx={{ position: "absolute", left: -32, top: "50%", transform: "translateY(-50%)" }} aria-label="Range bounds info">
                <HelpOutlineIcon sx={{ fontSize: 15 }} />
              </IconButton>
            </Tooltip>
            <Button
              color="button"
              variant="contained"
              target="_blank"
              style={{
                width: "120px",
                height: "40px"
              }}
              onClick={handleValidate}
              disabled={false}
            >
              {t("Verify")}
            </Button>
            {shouldRevalidate && (
              <Typography
                sx={{
                  marginLeft: "20px",
                  color: "red",
                  fontWeight: "bold"
                }}
              >
                {t("Please re-verify the data!")}
              </Typography>
            )}
          </Box>
          <AgGridReact
            key={`${i18n.language}-${rangeGridFixedViewport ? "fx" : "ah"}`}
            ref={gridRef}
            domLayout={rangeGridFixedViewport ? undefined : "autoHeight"}
            style={{
              width: "100%",
              height: rangeGridFixedViewport ? "100%" : "auto"
            }}
            rowData={rangeRowData}
            columnDefs={columnDefs}
            getRowHeight={getRowHeight}
            suppressRowHoverHighlight
            stopEditingWhenCellsLoseFocus
            onGridReady={onGridReady}
            onCellValueChanged={onCellValueChanged}
            suppressHorizontalScroll
            overlayNoRowsTemplate={`<span class="ag-overlay-no-rows-center">${t("No Rows to Show")}</span>`}
          />
        </Box>
      </Box>
    </BackNextSkeleton>
  );
});

export default Range;
