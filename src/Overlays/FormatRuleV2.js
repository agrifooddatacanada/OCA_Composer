import { Box, Link } from "@mui/material";
import React, { useCallback, useContext, useMemo, useRef, useState, useEffect, forwardRef, useImperativeHandle } from "react";
import { AgGridReact } from "ag-grid-react";
import { useTranslation } from "react-i18next";
import { Context } from "../App";
import { useMultiSchema } from "../schema/schemaContext";
import "ag-grid-community/styles/ag-theme-balham.css";
import BackNextSkeleton from "../components/BackNextSkeleton";
import CellHeader from "../components/CellHeader";
import { gridStyles, preWrapWordBreak, greyCellStyle } from "../constants/styles";
import TypeTooltip from "../AttributeDetails/TypeTooltip";
import DeleteConfirmation from "./DeleteConfirmation";
import { FormatRuleTypeRenderer, TrashCanButton } from "./FormatRuleCellRender";
import Loading from "../components/Loading";
import {
  CUSTOM_FORMAT_RULE,
  FIELD_FORMAT_OVERLAY,
  FIELD_RANGE_OVERLAY
} from "../constants/constants";
import { useDeleteOverlayHandler } from "../utils/overlayUtils";
import { getFormatRuleDescription } from "../utils/helpers";

const allowOverflowStyle = {
  ...preWrapWordBreak,
  overflow: "auto"
};

const FormatRulesV2 = forwardRef((props, ref) => {
  const { t } = useTranslation();
  const {
    setCurrentPage
  } = useContext(Context);
  
  // Use MultiSchema context with standard pattern
  const { 
    currentSchemaId, 
    getSchemaState, 
    updateSchemaState,
    updateOverlaySelection,
    setSelectedOverlay,
    getFormatRuleData,
    getRangeData,
    setFormatRuleRowData,
    setRangeRowData
  } = useMultiSchema();
  const schemaState = getSchemaState();
  const deleteHandler = useDeleteOverlayHandler(FIELD_FORMAT_OVERLAY);
  
  const updateCurrentSchema = useCallback((updates) => {
    // MultiSchemaContext handles null schemaId internally
    updateSchemaState( updates);
  }, [currentSchemaId, updateSchemaState]);
  
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [loading, setLoading] = useState(true);
  const gridRef = useRef();
  const [gridRowData, setGridRowData] = useState([]);
  
  // Initialize grid data ONCE when schema loads
  useEffect(() => {
    if (!schemaState?.attributes) {
      setGridRowData([]);
      return;
    }

    // Get existing format rules from attributeFormats object
    const attributeFormats = schemaState.attributeFormats || {};

    const initialData = schemaState.attributes.map(attr => {
      const formatRegex = attributeFormats[attr.Attribute] || "";
      
      // Check if this regex matches a built-in format
      const description = formatRegex ? getFormatRuleDescription(attr.Type, formatRegex) : "";
      const isCustom = !description;
      
      return {
        Attribute: attr.Attribute,
        Type: attr.Type || "Text",
        "Format Rule": isCustom ? "" : formatRegex,
        [CUSTOM_FORMAT_RULE]: isCustom ? formatRegex : ""
      };
    });

    setGridRowData(initialData);
  }, [schemaState?.attributes, schemaState?.attributeFormats, currentSchemaId]); // Re-init when attributes or formats change
  
  // Get range data using computed getter (filters to Numeric/DateTime with format rules)
  const rangeRowData = useMemo(() => 
    getRangeData() || []
  , [getRangeData, schemaState?.attributeRanges, schemaState?.attributeFormats, schemaState?.attributes]);

  // Set loading false when we have schema state
  useEffect(() => {
    if (schemaState && schemaState.initialized) {
      setLoading(false);
    }
  }, [schemaState]);

  const handleSave = useCallback(() => {
    if (!gridRef.current) {
      return;
    }
    
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
      updateOverlaySelection(FIELD_RANGE_OVERLAY, false);
    }
  }, [rangeRowData, setFormatRuleRowData, setRangeRowData, updateOverlaySelection, currentSchemaId]);



  const handleForward = useCallback(() => {
    handleSave();
    setSelectedOverlay(currentSchemaId, "");
    setCurrentPage("Overlays");
  }, [handleSave, setSelectedOverlay, setCurrentPage]);

  // Expose save method to parent (Home) for navigation handling
  useImperativeHandle(ref, () => ({
    save: handleSave
  }));

  // Save changes when component unmounts (user navigates away)
  useEffect(() => {
    return () => {
      // Save on unmount - capture the grid data at unmount time
      if (gridRef.current?.api) {
        const newFormatRuleRowData = gridRef.current.api
          .getRenderedNodes()
          ?.map((node) => node?.data);
        // Convert to object format and save
        if (newFormatRuleRowData && newFormatRuleRowData.length > 0) {
          const attributeFormats = {};
          newFormatRuleRowData.forEach(row => {
            const formatRule = row["Format Rule"] || row[CUSTOM_FORMAT_RULE];
            if (formatRule) {
              attributeFormats[row.Attribute] = formatRule;
            }
          });
          updateCurrentSchema({ attributeFormats });
        }
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty deps - only run on mount/unmount

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
        cellRenderer: FormatRuleTypeRenderer,
        width: 200,
        cellRendererParams: () => ({
          onRefresh: () => {
            // Do nothing - let grid handle data updates
            // Data will be saved on navigation via handleSave
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
        cellRenderer: TrashCanButton,
        width: 60,
        cellRendererParams: () => ({
          onRefresh: () => {
            // Do nothing - let grid handle data updates
            // Data will be saved on navigation via handleSave
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
      {loading && gridRowData?.length > 40 && <Loading />}
      {showDeleteConfirmation && (
        <DeleteConfirmation
          removeFromSelected={deleteHandler}
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
            rowData={gridRowData}
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
});

FormatRulesV2.displayName = 'FormatRulesV2';

export default FormatRulesV2;
