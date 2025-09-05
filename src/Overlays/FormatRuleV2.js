import { Box, Link } from "@mui/material";
import React, { useCallback, useContext, useMemo, useRef, useState, useEffect } from "react";
import { AgGridReact } from "ag-grid-react";
import { useTranslation } from "react-i18next";
import { Context } from "../App";
import { useMultiSchema } from "../context/MultiSchemaContext";
import "ag-grid-community/styles/ag-theme-balham.css";
import BackNextSkeleton from "../components/BackNextSkeleton";
import CellHeader from "../components/CellHeader";
import { gridStyles, preWrapWordBreak, greyCellStyle } from "../constants/styles";
import TypeTooltip from "../AttributeDetails/TypeTooltip";
import DeleteConfirmation from "./DeleteConfirmation";
import { FormatRuleTypeRenderer, TrashCanButton } from "./FormatRuleCellRender";
import Loading from "../components/Loading";
import {
  CUSTOM_FORMAT_RULE
} from "../constants/constants";

const allowOverflowStyle = {
  ...preWrapWordBreak,
  overflow: "auto"
};

const FormatRulesV2 = () => {
  const { t } = useTranslation();
  const {
    setCurrentPage
  } = useContext(Context);
  
  // Use MultiSchema context with standard pattern
  const { 
    activeSchemaId, 
    editingSchemaId, 
    getSchemaState, 
    updateSchemaState,
    updateOverlaySelection,
    setSelectedOverlay
  } = useMultiSchema();
  
  const currentSchemaId = activeSchemaId || editingSchemaId;
  const schemaState = getSchemaState(currentSchemaId);
  
  const updateCurrentSchema = useCallback((updates) => {
    if (currentSchemaId) {
      updateSchemaState(currentSchemaId, updates);
    }
  }, [currentSchemaId, updateSchemaState]);
  
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [loading, setLoading] = useState(true);
  const gridRef = useRef();
  
  // Get format rule data directly from schema state - no complex initialization
  const formatRuleRowData = useMemo(() => {
    if (!schemaState?.attributes) return [];
    
    // Always ensure we have format rule data for all attributes
    const existingFormatRules = schemaState?.formatRuleData || [];
    const existingRulesMap = new Map(existingFormatRules.map(rule => [rule.Attribute, rule]));
    
    return schemaState.attributes.map(attr => {
      const existingRule = existingRulesMap.get(attr.Attribute);
      // Always merge with current attribute data to ensure Type is present
      return {
        Attribute: attr.Attribute,
        Type: attr.Type || "Text",
        "Format Rule": existingRule?.["Format Rule"] || "",
        [CUSTOM_FORMAT_RULE]: existingRule?.[CUSTOM_FORMAT_RULE] || ""
      };
    });
  }, [schemaState?.attributes, schemaState?.formatRuleData]);
  
  const rangeRowData = useMemo(() => 
    schemaState?.rangeData || []
  , [schemaState?.rangeData]);
  
  // Simple setter that only updates MultiSchema context
  const setFormatRuleRowData = useCallback((newData) => {
    updateCurrentSchema({ formatRuleData: newData });
  }, [updateCurrentSchema]);
  
  const setRangeRowData = useCallback((newData) => {
    updateCurrentSchema({ rangeData: newData });
  }, [updateCurrentSchema]);

  // Set loading false when we have schema state
  useEffect(() => {
    if (schemaState && schemaState.initialized) {
      setLoading(false);
    }
  }, [schemaState]);

  const handleSave = useCallback(() => {
    if (!gridRef.current) return;
    
    gridRef.current.api.stopEditing();
    const newFormatRuleRowData = gridRef.current.api
      .getRenderedNodes()
      ?.map((node) => node?.data) || [];
    
    // Only update if we have data to prevent clearing existing format rules
    if (newFormatRuleRowData.length > 0) {
      setFormatRuleRowData(newFormatRuleRowData);
    }

    const newRangeRowData = [];

    newFormatRuleRowData.forEach((row) => {
      if (
        (row.Type !== "Numeric" && row.Type !== "DateTime") ||
        (!row["Format Rule"] && !row[CUSTOM_FORMAT_RULE])
      ) {
        return;
      }

      const existingRangeRow = rangeRowData.find(
        (rangeRow) => rangeRow.Attribute === row.Attribute
      );

      if (existingRangeRow) {
        newRangeRowData.push({
          ...existingRangeRow,
          FormatRule: row["Format Rule"] || row[CUSTOM_FORMAT_RULE]
        });
      } else {
        newRangeRowData.push({
          Attribute: row.Attribute,
          Type: row.Type,
          FormatRule: row["Format Rule"] || row[CUSTOM_FORMAT_RULE],
          LowerBound: "",
          LowerInclusive: false,
          UpperBound: "",
          UpperInclusive: false
        });
      }
    });

    setRangeRowData(newRangeRowData);

    if (newRangeRowData.length === 0) {
      updateOverlaySelection(currentSchemaId, "Add range rule for data", { selected: false });
    }
  }, [rangeRowData, setFormatRuleRowData, setRangeRowData, updateOverlaySelection, currentSchemaId]);

  const handleDeleteCurrentOverlay = useCallback(() => {
    // Save current changes before deleting overlay
    handleSave();
    updateOverlaySelection(currentSchemaId, "Add format rule for data", { selected: false });
    updateOverlaySelection(currentSchemaId, "Add range rule for data", { selected: false });
    setCurrentPage("Overlays");
  }, [handleSave, updateOverlaySelection, currentSchemaId, setCurrentPage]);

  const handleForward = useCallback(() => {
    handleSave();
    setSelectedOverlay(currentSchemaId, "");
    setCurrentPage("Overlays");
  }, [handleSave, setSelectedOverlay, currentSchemaId, setCurrentPage]);

  // Save changes when component unmounts (user navigates away)
  useEffect(() => {
    const currentGridRef = gridRef.current;
    return () => {
      // Only save on unmount if we have valid data to prevent clearing existing format rules
      if (currentGridRef?.api) {
        const newFormatRuleRowData = currentGridRef.api
          .getRenderedNodes()
          ?.map((node) => node?.data);
        // Only update if we actually have data and it's not empty
        // This prevents clearing format rules when grid is being destroyed
        if (newFormatRuleRowData && newFormatRuleRowData.length > 0) {
          setFormatRuleRowData(newFormatRuleRowData);
        }
      }
    };
  }, [setFormatRuleRowData]);

  const columnDefs = useMemo(
    () => [
      {
        field: "Attribute",
        editable: false,
        width: 180,
        cellStyle: () => allowOverflowStyle,
        headerComponent: CellHeader,
        headerComponentParams: {
          headerText: t("Attributes"),
          helpText: t("This is the name for the attribute and, for example...")
        }
      },
      {
        field: "Type",
        editable: false,
        width: 150,
        autoHeight: true,
        cellStyle: () => greyCellStyle,
        headerComponent: CellHeader,
        headerComponentParams: {
          headerText: t("Type"),
          helpText: <TypeTooltip />
        }
      },
      {
        field: "Format Rule",
        headerComponent: CellHeader,
        headerComponentParams: {
          headerText: t("Format Rule"),
          helpText: t(
            "Select the formatting rule that applies to data for each attribute"
          )
        },
        cellRendererFramework: FormatRuleTypeRenderer,
        width: 200,
        cellRendererParams: (params) => ({
          onRefresh: () => {
            // Immediately save the current grid data to schema context
            const newFormatRuleRowData = gridRef.current.api
              .getRenderedNodes()
              ?.map((node) => node?.data);
            if (newFormatRuleRowData) {
              setFormatRuleRowData(newFormatRuleRowData);
            }
            gridRef.current.api.redrawRows({ rowNodes: [params.node] });
          }
        })
      },
      {
        field: CUSTOM_FORMAT_RULE,
        headerComponent: CellHeader,
        headerComponentParams: {
          headerText: t("Custom Format Rule", { defaultValue: "Custom Format Rule" }),
          helpText: t("Enter a custom regular expression for the attribute's data")
        },
        // A custom format rule can be provided only if no built-in format rule is selected
        editable: (params) => !params.node.data["Format Rule"],
        autoHeight: true,
        width: 200,
        wrapText: true
      },
      {
        headerName: "",
        field: "Delete",
        cellRendererFramework: TrashCanButton,
        width: 60,
        cellRendererParams: (params) => ({
          onRefresh: () => {
            // Immediately save the current grid data to schema context
            const newFormatRuleRowData = gridRef.current.api
              .getRenderedNodes()
              ?.map((node) => node?.data);
            if (newFormatRuleRowData) {
              setFormatRuleRowData(newFormatRuleRowData);
            }
            gridRef.current.api.redrawRows({ rowNodes: [params.node] });
          }
        })
      }
    ],
    [t, setFormatRuleRowData]
  );

  const onGridReady = useCallback(() => {
    setLoading(false);
  }, []);

  const handleKeyPress = (params) => {
    if (params.colDef.field !== CUSTOM_FORMAT_RULE) return;

    params.node.updateData({
      ...params.node.data,
      [CUSTOM_FORMAT_RULE]: params.event.target.value
    });

    // Force refresh the format rule cell to update its disabled state
    const formatRuleColumn = params.columnApi.getColumn("FormatRule");
    if (formatRuleColumn) {
      params.api.refreshCells({
        force: true,
        rowNodes: [params.node],
        columns: [formatRuleColumn]
      });
    }
  };

  return (
    <BackNextSkeleton
      isForward
      pageForward={handleForward}
      isBack
      pageBack={() => setShowDeleteConfirmation(true)}
      backText="Remove overlay"
    >
      {loading && formatRuleRowData?.length > 40 && <Loading />}
      {showDeleteConfirmation && (
        <DeleteConfirmation
          removeFromSelected={handleDeleteCurrentOverlay}
          closeModal={() => setShowDeleteConfirmation(false)}
        />
      )}
      <Box
        sx={{
          margin: "2rem",
          gap: "3rem",
          display: "flex",
          flexDirection: "column",
          alignItems: "center"
        }}
      >
        <Box className="ag-theme-balham" sx={{ width: 790 }}>
          <style>{gridStyles}</style>
          <AgGridReact
            ref={gridRef}
            rowData={formatRuleRowData}
            columnDefs={columnDefs}
            domLayout="autoHeight"
            suppressHorizontalScroll
            rowHeight={50}
            onGridReady={onGridReady}
            onCellKeyDown={handleKeyPress}
          />
        </Box>
        <Box
          sx={{
            width: "80%"
          }}
        >
          {t("All format rules are documented in the")}{" "}
          <Link
            href="https://github.com/agrifooddatacanada/format_options"
            target="_blank"
            rel="noreferrer"
          >
            {t("format GitHub repository")}
          </Link>
          . {t("Request a new format to be added by")}{" "}
          <Link
            href="https://github.com/agrifooddatacanada/format_options/issues"
            rel="noreferrer"
            target="_blank"
          >
            {t("raising an issue in the repository")}
          </Link>{" "}
          {t("or email us at")} <Link href="mailto:adc@uoguelph.ca">adc@uoguelph.ca</Link>
          .
        </Box>
      </Box>
    </BackNextSkeleton>
  );
};

export default FormatRulesV2;
