import { Box, Popover, Alert, Typography } from "@mui/material";
import MuiLink from "@mui/material/Link";
import React, { useCallback, useContext, useMemo, useRef, useState, useEffect, forwardRef, useImperativeHandle } from "react";
import { AgGridReact } from "../components/AgGridReact";
import { useTranslation } from "react-i18next";
import { Context } from "../App";
import { useMultiSchema } from "../schema/schemaContext";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-balham.css";
import BackNextSkeleton from "../components/BackNextSkeleton";
import CellHeader from "../components/CellHeader";
import TextareaCellEditor from "../components/TextareaCellEditor";
import { gridStyles, preWrapWordBreak, greyCellStyle } from "../constants/styles";
import TypeTooltip from "../AttributeDetails/TypeTooltip";
import { FormatRuleTypeRenderer } from "./FormatRuleCellRender";
import Loading from "../components/Loading";
import {
  AG_GRID_EMPTY_NO_ATTRIBUTES_BODY_MIN_PX,
  AG_GRID_EMPTY_NO_ATTRIBUTES_GRID_MIN_PX,
  AG_GRID_VIRTUALIZE_MIN_ROWS,
  BETWEEN_SECTION_SPACING,
  CUSTOM_FORMAT_RULE,
  FIELD_RANGE_OVERLAY,
  isChildSchemaType,
  isRangeEligibleAttributeType,
  MAX_ATTR_DESCRIPTION_CHARS
} from "../constants/constants";
import { getAllGridRowData } from "./gridUtils";
import { getFormatRuleDescription } from "../utils/helpers";
import { measureTextHeight } from "../utils/measureTextLines";
import { getMapValueForAttributeName, normalizeAttributeNameKey } from "../utils/stringUtils";

const allowOverflowStyle = {
  ...preWrapWordBreak,
  overflow: "hidden"
};

const FormatRulesV2 = forwardRef((props, ref) => {
  const { t, i18n } = useTranslation();
  const {
    setCurrentPage
  } = useContext(Context);
  
  // Use MultiSchema context with standard pattern
  const { 
    getSchema, 
    updateSchema,
    updateOverlaySelection,
    setSelectedOverlay,
    getRangeData,
    setFormatRuleRowData,
    setRangeRowData,
    schemaStates,
    getCurrentSchemaId
  } = useMultiSchema();
  const schemaState = getSchema();

  const [customFormatRuleAnchorEl, setCustomFormatRuleAnchorEl] = useState(null);
  const [loading, setLoading] = useState(true);
  const gridRef = useRef();
  const [gridRowData, setGridRowData] = useState([]);
  
  // Initialize grid data when schema loads
  useEffect(() => {
    const attrs = schemaState?.attributes;
    if (!Array.isArray(attrs)) {
      setGridRowData([]);
      setLoading(false);
      return;
    }

    // Get existing format rules from attributeFormats object
    const attributeFormats = schemaState.attributeFormats || {};

    const initialData = attrs
      .filter((attr) => {
        const rawType = attr?.Type || "Text";
        const baseType = rawType.includes("Array")
          ? rawType.replace(/Array\[|\]/g, "")
          : rawType;
        return !isChildSchemaType(baseType);
      })
      .map((attr) => {
        const formatRegex = getMapValueForAttributeName(attributeFormats, attr.Attribute) || "";

        const description = formatRegex
          ? getFormatRuleDescription(attr.Type || "Text", formatRegex)
          : "";
        const isBuiltInFormat = Boolean(formatRegex && description);
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
  const rangeRowData = useMemo(
    () => getRangeData() || [],
    [getRangeData, schemaStates, getCurrentSchemaId]
  );

  const handleSave = useCallback(() => {
    if (!gridRef.current) {
      return;
    }
    
    gridRef.current.api.stopEditing();
    const newFormatRuleRowData = getAllGridRowData(gridRef.current.api);
    
    // Only update if we have data to prevent clearing existing format rules
    if (newFormatRuleRowData.length > 0) {
      setFormatRuleRowData(newFormatRuleRowData);
    }

    const newRangeRowData = [];

    newFormatRuleRowData.forEach((row) => {
      if (
        !isRangeEligibleAttributeType(row.Type) ||
        (!row["Format Rule"] && !row[CUSTOM_FORMAT_RULE])
      ) {
        return;
      }

      const existingRangeRow = rangeRowData.find(
        (rangeRow) =>
          normalizeAttributeNameKey(rangeRow.Attribute) === normalizeAttributeNameKey(row.Attribute)
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

  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    const prevScrollbarGutter = html.style.scrollbarGutter;
    const prevScrollbarWidth = body.style.scrollbarWidth;
    html.style.scrollbarGutter = "auto";
    body.style.scrollbarWidth = "none";
    body.classList.add("format-rules-no-scrollbar");
    return () => {
      html.style.scrollbarGutter = prevScrollbarGutter;
      body.style.scrollbarWidth = prevScrollbarWidth;
      body.classList.remove("format-rules-no-scrollbar");
    };
  }, []);

  // Save changes when component unmounts (user navigates away)
  useEffect(() => {
    return () => {
      // Save on unmount - capture the grid data at unmount time
      if (gridRef.current?.api) {
        const newFormatRuleRowData = getAllGridRowData(gridRef.current.api);
        if (newFormatRuleRowData && newFormatRuleRowData.length > 0) {
          const currentSchema = getSchema();
          const attributeFormats = { ...(currentSchema?.attributeFormats || {}) };
          newFormatRuleRowData.forEach((row) => {
            const formatRule = row["Format Rule"] || row[CUSTOM_FORMAT_RULE];
            const norm = normalizeAttributeNameKey(row.Attribute);
            Object.keys(attributeFormats).forEach((k) => {
              if (normalizeAttributeNameKey(k) === norm) delete attributeFormats[k];
            });
            if (formatRule) {
              attributeFormats[norm] = formatRule;
            }
          });
          updateSchema({ attributeFormats });
        }
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty deps - only run on mount/unmount

  const getRowHeight = useCallback(
    (params) => {
      const d = params.data || {};
      const attrH = measureTextHeight(d.Attribute || "", 164);
      const typeH = measureTextHeight(d.Type || "", 134);
      const builtIn = d["Format Rule"] || "";
      const custom = d[CUSTOM_FORMAT_RULE] || "";
      const rawType = d.Type || "Text";
      const baseType = rawType.includes("Array") ? rawType.replace(/Array\[|\]/g, "") : rawType;
      const hasDropdown =
        baseType.includes("Date") ||
        baseType.includes("Numeric") ||
        baseType.includes("Binary") ||
        baseType.includes("Text") ||
        baseType === "Text";
      const noDd = t("No Dropdown Available", { defaultValue: "No Dropdown Available" });
      let formatColH = 0;
      if (custom) {
        formatColH = measureTextHeight(builtIn, 244);
      } else if (hasDropdown) {
        const desc = builtIn ? getFormatRuleDescription(d.Type || "Text", builtIn, t) || builtIn : "";
        formatColH = measureTextHeight(desc, 244);
      } else {
        formatColH = measureTextHeight(noDd, 244);
      }
      const customH = measureTextHeight(custom, 184);
      const maxH = Math.max(attrH, typeH, formatColH, customH);
      return Math.max(32, maxH + 8);
    },
    [t]
  );

  const onFormatFirstDataRendered = useCallback(() => {
    if (gridRef.current?.api) {
      gridRef.current.api.resetRowHeights();
    }
  }, []);

  const columnDefs = useMemo(
    () => [
      {
        field: "Attribute",
        editable: false,
        width: 180,
        wrapText: true,
        cellStyle: () => greyCellStyle,
        headerComponent: CellHeader,
        headerComponentParams: {
          headerText: t("Attribute"),
          helpText: t("This is the name for the attribute and, for example...")
        }
      },
      {
        field: "Type",
        editable: false,
        width: 150,
        wrapText: true,
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
          helpText: (
            <>
              {t("Select the formatting rule that applies to data for each attribute")} {t(
                "Dropdowns are available for types Text, Numeric, DateTime, Binary, and Arrays of those types"
              )}
            </>
          )
        },
        cellStyle: (params) => {
          const rawType = params?.data?.Type || "Text";
          const baseType = rawType.includes("Array")
            ? rawType.replace(/Array\[|\]/g, "")
            : rawType;

          const hasDropdown =
            baseType.includes("Date") ||
            baseType.includes("Numeric") ||
            baseType.includes("Binary") ||
            baseType.includes("Text") ||
            baseType === "Text";
          const hasCustom = Boolean(params?.data?.[CUSTOM_FORMAT_RULE]);

          return hasDropdown && !hasCustom ? allowOverflowStyle : greyCellStyle;
        },
        cellRenderer: FormatRuleTypeRenderer,
        width: 260,
        cellRendererParams: () => ({
          onRefresh: () => {}
        })
      },
      {
        field: CUSTOM_FORMAT_RULE,
        headerComponent: CellHeader,
        headerComponentParams: {
          headerText: t("Custom Format Rule", { defaultValue: "Custom Format Rule" }),
          helpText: `${t("Enter a custom regular expression for the attribute's data")}.`
        },
        // A custom format rule can be provided only if no built-in format rule is selected
        editable: (params) => !params.data["Format Rule"],
        cellStyle: (params) =>
          params?.data?.["Format Rule"] ? greyCellStyle : preWrapWordBreak,
        cellEditor: TextareaCellEditor,
        cellEditorParams: { maxLength: MAX_ATTR_DESCRIPTION_CHARS },
        width: 200,
        wrapText: true
      }
    ],
    [t]
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
      params.api.resetRowHeights();
    } else if (params.colDef.field === "Format Rule") {
      // When format rule changes, refresh custom format rule column to update editable state
      params.api.refreshCells({
        force: true,
        rowNodes: [params.node],
        columns: [CUSTOM_FORMAT_RULE]
      });
      params.api.resetRowHeights();
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

  const formatGridScrollViewport =
    gridRowData.length >= AG_GRID_VIRTUALIZE_MIN_ROWS;
  const noAttributes = (schemaState?.attributes || []).length === 0;

  return (
    <BackNextSkeleton
      isForward
      pageForward={handleForward}
      isBack
      pageBack={() => setCurrentPage("Overlays")}
    >
      {loading && <Loading />}
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
          flexDirection: "column"
        }}
      >
        <Box
          className={`format-rule-v2-grid overlay-grid-suppress-hscroll ag-theme-balham${formatGridScrollViewport ? "" : " ag-grid-compact"}`}
          sx={{
            width: 790,
            overflow: "hidden",
            ...(formatGridScrollViewport
              ? {
                  height: "min(70vh, 560px)",
                  minHeight: 120,
                  "& .ag-root-wrapper": { height: "100%" }
                }
              : {
                  "& .ag-root-wrapper": { height: "auto" },
                  "& .ag-root-wrapper-body.ag-layout-auto-height": {
                    alignItems: "flex-start"
                  },
                  "& .ag-layout-auto-height .ag-center-cols-clipper": { minHeight: 0 },
                  "& .ag-layout-auto-height .ag-center-cols-container": { minHeight: 0 },
                  "& .ag-root.ag-layout-auto-height .ag-body-viewport": {
                    flex: "0 0 auto",
                    height: "auto",
                    minHeight: noAttributes ? AG_GRID_EMPTY_NO_ATTRIBUTES_BODY_MIN_PX : 0
                  },
                  ...(noAttributes
                    ? { minHeight: AG_GRID_EMPTY_NO_ATTRIBUTES_GRID_MIN_PX }
                    : {})
                })
          }}
        >
          <style>{gridStyles}</style>
          <AgGridReact
            key={`${i18n.language}-${formatGridScrollViewport ? "fx" : "ah"}`}
            ref={gridRef}
            domLayout={formatGridScrollViewport ? undefined : "autoHeight"}
            containerStyle={{
              width: "100%",
              height: formatGridScrollViewport ? "100%" : "auto"
            }}
            rowData={gridRowData}
            columnDefs={columnDefs}
            getRowHeight={getRowHeight}
            suppressRowHoverHighlight
            suppressHorizontalScroll
            suppressScrollOnNewData
            onFirstDataRendered={onFormatFirstDataRendered}
            onCellValueChanged={onCellValueChanged}
            onCellKeyDown={handleCellKeyDown}
            overlayNoRowsTemplate={`<span class="ag-overlay-no-rows-center">${t("No Rows to Show")}</span>`}
          />
        </Box>
        <Typography
          variant="body2"
          sx={{
            color: "text.secondary",
            textAlign: "center",
            alignSelf: "center",
            mt: 2,
            maxWidth: 790,
            px: 1,
            lineHeight: 1.5
          }}
        >
          {t("Rules are documented in the", { defaultValue: "Rules are documented in the" })}{" "}
          <MuiLink
            href="https://github.com/agrifooddatacanada/format_options"
            target="_blank"
            rel="noreferrer"
            underline="hover"
          >
            {t("GitHub repo", { defaultValue: "GitHub repo" })}
          </MuiLink>
          . {t("Request new rules by", { defaultValue: "Request new rules by" })}{" "}
          <MuiLink
            href="https://github.com/agrifooddatacanada/format_options/issues"
            target="_blank"
            rel="noreferrer"
            underline="hover"
          >
            {t("raise an issue", { defaultValue: "raise an issue" })}
          </MuiLink>{" "}
          {t("or email", { defaultValue: "or email" })}{" "}
          <MuiLink href="mailto:adc@uoguelph.ca" underline="hover">
            adc@uoguelph.ca
          </MuiLink>
          .
        </Typography>
      </Box>
    </BackNextSkeleton>
  );
});

FormatRulesV2.displayName = 'FormatRulesV2';

export default FormatRulesV2;
