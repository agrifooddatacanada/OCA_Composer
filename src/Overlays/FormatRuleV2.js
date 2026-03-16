import { Box, Link, Popover, Alert } from "@mui/material";
import React, { useCallback, useContext, useMemo, useRef, useState, useEffect, forwardRef, useImperativeHandle } from "react";
import { AgGridReact } from "ag-grid-react";
import { useTranslation } from "react-i18next";
import { Context } from "../App";
import { useMultiSchema } from "../schema/schemaContext";
import "ag-grid-community/styles/ag-theme-balham.css";
import BackNextSkeleton from "../components/BackNextSkeleton";
import { BETWEEN_SECTION_SPACING } from "../constants/constants";
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
import { overlayGridOnFirstDataRendered } from "./gridUtils";
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
    getSchema, 
    updateSchema,
    updateOverlaySelection,
    setSelectedOverlay,
    getFormatRuleData,
    getRangeData,
    setFormatRuleRowData,
    setRangeRowData
  } = useMultiSchema();
  const schemaState = getSchema();
  const deleteHandler = useDeleteOverlayHandler(FIELD_FORMAT_OVERLAY);
  
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [customFormatRuleAnchorEl, setCustomFormatRuleAnchorEl] = useState(null);
  const [loading, setLoading] = useState(true);
  const gridRef = useRef();
  const [gridRowData, setGridRowData] = useState([]);
  
  // Initialize grid data ONCE when schema loads
  useEffect(() => {
    if (!schemaState?.attributes) {
      setGridRowData([]);
      setLoading(false);
      return;
    }

    // Get existing format rules from attributeFormats object
    const attributeFormats = schemaState.attributeFormats || {};

    const initialData = schemaState.attributes.map(attr => {
      const formatRegex = attributeFormats[attr.Attribute] || "";

      // Determine whether the stored regex matches a built-in description for this type
      const description = formatRegex ? getFormatRuleDescription(attr.Type, formatRegex) : "";
      const isBuiltInFormat = Boolean(formatRegex && description);

      // If it's a built-in format, put it in the "Format Rule" column.
      // If it's not built-in but exists (custom regex), rehydrate it into the custom column
      // so the user sees and can edit their custom regex.
      const customFormat = formatRegex && !isBuiltInFormat ? formatRegex : "";

      return {
        Attribute: attr.Attribute,
        Type: attr.Type || "Text",
        "Format Rule": isBuiltInFormat ? formatRegex : "",
        [CUSTOM_FORMAT_RULE]: customFormat
      };
    });

    setGridRowData(initialData);
    setLoading(false);
  }, [schemaState?.attributes, schemaState?.attributeFormats]); // Re-init when attributes or formats change
  
  // Get range data using computed getter (filters to Numeric/DateTime with format rules)
  const rangeRowData = useMemo(() => 
    getRangeData() || []
  , [getRangeData, schemaState?.attributeRanges, schemaState?.attributeFormats, schemaState?.attributes]);

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
  }, [rangeRowData, setFormatRuleRowData, setRangeRowData, updateOverlaySelection]);

  const handleForward = useCallback(() => {
    handleSave();
    setSelectedOverlay("");
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
          updateSchema({ attributeFormats });
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
        editable: (params) => !params.data["Format Rule"],
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

  const onCellValueChanged = useCallback((params) => {
    if (params.colDef.field === CUSTOM_FORMAT_RULE) {
      // When custom format rule changes, clear the built-in format rule and refresh
      if (params.newValue && params.data["Format Rule"]) {
        params.node.updateData({
          ...params.data,
          "Format Rule": ""
        });
      }
      // Force refresh the format rule cell to update its disabled state
      params.api.refreshCells({
        force: true,
        rowNodes: [params.node],
        columns: ["Format Rule"]
      });
    } else if (params.colDef.field === "Format Rule") {
      // When format rule changes, refresh custom format rule column to update editable state
      params.api.refreshCells({
        force: true,
        rowNodes: [params.node],
        columns: [CUSTOM_FORMAT_RULE]
      });
    }
  }, []);

  const handleCellKeyDown = useCallback((e) => {
    const colField = e.colDef?.field ?? e.column?.colId;
    const domEvent = e.event;
    if (
      colField === CUSTOM_FORMAT_RULE &&
      e.data?.["Format Rule"] &&
      domEvent?.key?.length === 1
    ) {
      domEvent?.preventDefault?.();
      const cellEl = domEvent?.target?.closest?.(".ag-cell") || domEvent?.target;
      setCustomFormatRuleAnchorEl(cellEl || null);
    }
  }, []);

  return (
    <BackNextSkeleton
      isForward
      pageForward={handleForward}
      isBack
      pageBack={() => setShowDeleteConfirmation(true)}
      backText="Remove overlay"
    >
      {loading && <Loading />}
      {showDeleteConfirmation && (
        <DeleteConfirmation
          removeFromSelected={deleteHandler}
          closeModal={() => setShowDeleteConfirmation(false)}
        />
      )}
      <Popover
        open={Boolean(customFormatRuleAnchorEl)}
        anchorEl={customFormatRuleAnchorEl}
        onClose={() => setCustomFormatRuleAnchorEl(null)}
        disableScrollLock
        anchorOrigin={{ vertical: "center", horizontal: "right" }}
        transformOrigin={{ vertical: "center", horizontal: "left" }}
        PaperProps={{
          sx: { mt: 1.5, ml: 1.5, p: 0, overflow: "visible" }
        }}
      >
        <Alert severity="error" sx={{ m: 0 }}>
          {t("Clear the Format Rule first to enter a custom format rule.")}
        </Alert>
      </Popover>
      <Box
        sx={{
          margin: "2rem",
          marginBottom: BETWEEN_SECTION_SPACING,
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
            onFirstDataRendered={overlayGridOnFirstDataRendered}
            onCellValueChanged={onCellValueChanged}
            onCellKeyDown={handleCellKeyDown}
            overlayNoRowsTemplate={`<span class="ag-overlay-no-rows-center">${t("No Rows to Show")}</span>`}
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
