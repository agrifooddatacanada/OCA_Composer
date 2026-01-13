import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { AgGridReact } from "ag-grid-react";
import { Alert, Box, Button, Typography } from "@mui/material";

import { Context } from "../App";
import { useMultiSchema } from "../context/MultiSchemaContext";
import BackNextSkeleton from "../components/BackNextSkeleton";
import DeleteConfirmation from "./DeleteConfirmation";
import CellHeader from "../components/CellHeader";
import { flexCenter, gridStyles, preWrapWordBreak } from "../constants/styles";
import CheckboxHeader from "../components/CheckboxHeader";
import Loading from "../components/Loading";
import CheckboxRenderer from "../AttributeDetails/CheckboxRenderer";
import { getCurrentData, getFormatRuleDescription } from "../utils/helpers";
import { FIELD_RANGE_OVERLAY } from "../constants/constants";
import { matchFormat } from "../OCADataValidator/utils/matchRules";
import { useDeleteOverlayHandler } from "../utils/overlayUtils";

const Range = () => {
  const {
    setCurrentPage,
    setSelectedOverlay,
  } = useContext(Context);
  
  // Use MultiSchema context with standard pattern
  const { currentSchemaId, getSchemaState, updateSchemaState } = useMultiSchema();
  
  const schemaState = getSchemaState(currentSchemaId);
  const deleteHandler = useDeleteOverlayHandler(FIELD_RANGE_OVERLAY);
  
  const updateCurrentSchema = useCallback((updates) => {
    // MultiSchemaContext handles null schemaId internally
    updateSchemaState(currentSchemaId, updates);
  }, [currentSchemaId, updateSchemaState]);
  
  // Get range data from schema state
  const rangeRowData = useMemo(() => {
    return schemaState?.rangeData || [];
  }, [schemaState?.rangeData]);
  
  const setRangeRowData = useCallback((newData) => {
    updateCurrentSchema({
      rangeData: newData
    });
  }, [updateCurrentSchema]);
  const { t } = useTranslation();
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

  const columnDefs = useMemo(
    () => [
      {
        field: "Attribute",
        width: 180,
        autoHeight: true,
        cellStyle: () => preWrapWordBreak,
        headerComponent: CellHeader,
        headerComponentParams: {
          headerText: t("Attributes"),
          helpText: t("This is the name for the attribute and, for example...")
        }
      },
      {
        field: "FormatRule",
        width: 200,
        autoHeight: true,
        cellStyle: () => preWrapWordBreak,
        headerComponent: CellHeader,
        headerComponentParams: {
          headerText: t("Format Rule"),
          helpText: t("The format rule that is applied to the attribute")
        },
        valueFormatter: (params) =>
          getFormatRuleDescription(params.data.Type, params.value) || params.value
      },
      {
        field: "LowerBound",
        width: 130,
        editable: true,
        autoHeight: true,
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
        autoHeight: true,
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

  const onGridReady = () => {
    setLoading(false);
  };

  const handleSave = () => {
    gridRef.current.api.stopEditing();
    const rowData = gridRef.current.api.getRenderedNodes()?.map((node) => node?.data);
    setRangeRowData(rowData);
  };

  const handleForward = () => {
    const hasValidationError = Object.values(errors).some((attrErrors) =>
      Object.values(attrErrors).some((isError) => isError)
    );

    if (hasValidationError) {
      setShowValidationError(true);
      setTimeout(() => {
        setShowValidationError(false);
      }, 3000);
      return;
    }

    handleSave();
    setSelectedOverlay("");
    setCurrentPage("Overlays");
  };

  // Save changes when component unmounts (user navigates away)
  useEffect(() => {
    return () => {
      if (gridRef.current?.api) {
        gridRef.current.api.stopEditing();
        const rowData = gridRef.current.api.getRenderedNodes()?.map((node) => node?.data);
        if (rowData && rowData.length > 0) {
          setRangeRowData(rowData);
        }
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty deps - only run on mount/unmount

  // Initialize rangeData from formatRuleData if empty (e.g., after deletion and re-adding)
  useEffect(() => {
    const formatRuleData = schemaState?.formatRuleData || [];
    const attributes = schemaState?.attributes || [];
    const currentRangeData = schemaState?.rangeData || [];
    
    // Only initialize if rangeData is empty but formatRuleData exists
    if (currentRangeData.length === 0 && formatRuleData.length > 0 && attributes.length > 0) {
      const newRangeRowData = [];
      
      formatRuleData.forEach((row) => {
        // Find the corresponding attribute to get its Type
        const attribute = attributes.find(attr => attr.Attribute === row.Attribute);
        if (!attribute) return;
        
        if (
          (attribute.Type !== "Numeric" && attribute.Type !== "DateTime") ||
          (!row["Format Rule"] && !row["Custom format rule"])
        ) {
          return;
        }

        newRangeRowData.push({
          Attribute: row.Attribute,
          Type: attribute.Type,
          FormatRule: row["Format Rule"] || row["Custom format rule"],
          LowerBound: "",
          LowerInclusive: false,
          UpperBound: "",
          UpperInclusive: false
        });
      });

      if (newRangeRowData.length > 0) {
        setRangeRowData(newRangeRowData);
      }
    }
  }, [schemaState?.formatRuleData, schemaState?.rangeData, schemaState?.attributes, setRangeRowData]);

  const handleBack = () => {
    setShowDeleteConfirmation(true);
  };

  const onCellValueChanged = (params) => {
    if (params.colDef.field === "LowerBound" || params.colDef.field === "UpperBound") {
      params.column.colDef.cellStyle = { "background-color": "none" };
      params.api.refreshCells({
        force: true,
        columns: [params.colDef.field],
        rowNodes: [params.node]
      });
      setShouldRevalidate(true);
    }
  };

  const handleValidate = () => {
    gridRef.current.api.stopEditing();
    setShouldRevalidate(false);
    setErrors({});
    const newData = getCurrentData(gridRef.current.api, true);

    newData.forEach((row) => {
      if (row.LowerBound === "" && row.UpperBound === "") return;
      if (row.LowerBound) {
        const isValid = matchFormat(row.Type, row.FormatRule, row.LowerBound, false);
        setErrors((prev) => ({
          ...prev,
          [row.Attribute]: {
            ...prev[row.Attribute],
            LowerBound: !isValid
          }
        }));
      }
      if (row.UpperBound) {
        const isValid = matchFormat(row.Type, row.FormatRule, row.UpperBound, false);
        setErrors((prev) => ({
          ...prev,
          [row.Attribute]: {
            ...prev[row.Attribute],
            UpperBound: !isValid
          }
        }));
      }
    });
  };

  return (
    <BackNextSkeleton
      isForward
      isBack
      pageForward={handleForward}
      pageBack={handleBack}
      backText="Remove overlay"
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
      <Box sx={{ my: "2rem" }}>
        <Box className="ag-theme-balham" sx={{ width: 881.5 }}>
          <style>{gridStyles}</style>
          <Box sx={{ display: "flex", alignItems: "center", mb: "1.6rem" }}>
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
            ref={gridRef}
            rowData={rangeRowData}
            columnDefs={columnDefs}
            domLayout="autoHeight"
            stopEditingWhenCellsLoseFocus
            onGridReady={onGridReady}
            onCellValueChanged={onCellValueChanged}
          />
          <Typography sx={{ textAlign: "left", mt: "1.6rem" }}>
            {t("Range bounds must match the format rules.")}
          </Typography>
        </Box>
      </Box>
    </BackNextSkeleton>
  );
};

export default Range;
