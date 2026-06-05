import React, { useCallback, useEffect, useLayoutEffect, useRef } from "react";
import { alpha } from "@mui/material/styles";
import { useTranslation } from "react-i18next";
import { AgGridReact } from "../components/AgGridReact";
import {
  agGridEditableCellHoverCss,
  gridStyles
} from "../constants/styles";
import {
  AG_GRID_EMPTY_MAIN_STEP_BODY_MIN_PX,
  AG_GRID_EMPTY_MAIN_STEP_GRID_MIN_PX,
  ENTRY_CODE_PREVIEW_ROW_ID_KEY,
  ENTRY_CODE_UPLOAD_PREVIEW_SPINNER_MIN_MS,
  LAN_GRID_SHELL_WIDTH_PX
} from "../constants/constants";
import { CustomPalette } from "../constants/customPalette";
import { measureTextHeight } from "../utils/measureTextLines";

const PREVIEW_CELL_MIN_W = 88;

export default function EntryCodeUploadPreviewGrid({
  gridRef,
  rowData,
  columnDefs,
  fixedViewport,
  shellWidthPx,
  onPreviewStable,
  onCellValueChanged,
  gridMountKey
}) {
  const { t } = useTranslation();
  const hasGridRows = Array.isArray(rowData) && rowData.length > 0;
  const shellW = Math.min(
    LAN_GRID_SHELL_WIDTH_PX,
    Math.max(1, Number(shellWidthPx) || 1)
  );
  const settledRef = useRef(false);
  const spinnerMountAtRef = useRef(0);

  const getRowHeight = useCallback(
    (params) => {
      if (!columnDefs?.length) return 32;
      let maxH = 0;
      for (const col of columnDefs) {
        const w = col.width ?? PREVIEW_CELL_MIN_W;
        const text = params.data?.[col.field];
        maxH = Math.max(maxH, measureTextHeight(String(text ?? ""), w, {}));
      }
      return Math.max(32, maxH + 16);
    },
    [columnDefs]
  );

  const settlePreview = useCallback(() => {
    if (settledRef.current) return;
    settledRef.current = true;
    const elapsed = Date.now() - spinnerMountAtRef.current;
    const wait = Math.max(0, ENTRY_CODE_UPLOAD_PREVIEW_SPINNER_MIN_MS - elapsed);
    setTimeout(() => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          onPreviewStable?.();
        });
      });
    }, wait);
  }, [onPreviewStable]);

  useLayoutEffect(() => {
    settledRef.current = false;
    spinnerMountAtRef.current = Date.now();
  }, [gridMountKey]);

  useLayoutEffect(() => {
    const api = gridRef.current?.api;
    if (!api || !rowData?.length) return;
    api.resetRowHeights();
  }, [gridRef, rowData?.length, columnDefs, fixedViewport]);

  useEffect(() => {
    const id = setTimeout(() => settlePreview(), 750);
    return () => clearTimeout(id);
  }, [gridMountKey, settlePreview]);

  return (
    <div
      className={`entry-code-upload-preview-grid ag-theme-balham${
        fixedViewport ? "" : " ag-grid-compact"
      }`}
      style={{
        width: shellW,
        maxWidth: "100%",
        overflowX: "hidden",
        ...(hasGridRows ? { backgroundColor: CustomPalette.GREY_200 } : {}),
        ...(fixedViewport ? {} : { height: "fit-content" })
      }}
    >
      <style>
        {gridStyles}
        {`
          ${
            hasGridRows
              ? `
          .entry-code-upload-preview-grid .ag-root-wrapper,
          .entry-code-upload-preview-grid .ag-root-wrapper-body,
          .entry-code-upload-preview-grid .ag-body-viewport,
          .entry-code-upload-preview-grid .ag-center-cols-viewport,
          .entry-code-upload-preview-grid .ag-body-horizontal-scroll-viewport {
            background-color: ${CustomPalette.GREY_200} !important;
          }
          .entry-code-upload-preview-grid .ag-cell {
            background-color: ${CustomPalette.WHITE} !important;
          }
          .entry-code-upload-preview-grid .ag-header-cell {
            background-color: ${CustomPalette.GREY_200} !important;
          }
          `
              : ""
          }
          .entry-code-upload-preview-grid.ag-theme-balham .ag-cell:not(.unit-cell-disabled):hover {
            background-color: ${alpha(CustomPalette.PRIMARY, 0.04)} !important;
          }
          .entry-code-upload-preview-grid.ag-theme-balham {
            --ag-row-hover-color: transparent;
            --ag-column-hover-color: transparent;
            ${
              fixedViewport
                ? "height: min(70vh, 560px); min-height: 120px;"
                : !hasGridRows
                  ? `min-height: ${AG_GRID_EMPTY_MAIN_STEP_GRID_MIN_PX}px;`
                  : "min-height: 0;"
            }
          }
          .entry-code-upload-preview-grid .ag-root-wrapper {
            height: ${fixedViewport ? "100%" : "auto"};
          }
          ${
            !hasGridRows && !fixedViewport
              ? `
          .entry-code-upload-preview-grid .ag-root.ag-layout-auto-height .ag-body-viewport {
            min-height: ${AG_GRID_EMPTY_MAIN_STEP_BODY_MIN_PX}px !important;
          }
          `
              : ""
          }
          .entry-code-upload-preview-grid .ag-body-horizontal-scroll {
            display: none !important;
          }
          .entry-code-upload-preview-grid .ag-header-viewport,
          .entry-code-upload-preview-grid .ag-body-viewport,
          .entry-code-upload-preview-grid .ag-center-cols-viewport {
            padding-right: 0 !important;
            overflow-x: hidden !important;
          }
          .entry-code-upload-preview-grid .ag-root-wrapper,
          .entry-code-upload-preview-grid .ag-body-viewport-wrapper {
            overflow-x: hidden !important;
          }
          .entry-code-upload-preview-grid .ag-header-cell:last-child {
            border-right: none !important;
            --ag-header-column-separator-display: none !important;
          }
          .entry-code-upload-preview-grid .ag-header-cell:last-child * {
            border-right: none !important;
            box-shadow: none !important;
          }
          .entry-code-upload-preview-grid .ag-header-row .ag-header-cell:last-child::after {
            display: none !important;
          }
          .entry-code-upload-preview-grid .ag-center-cols-viewport .ag-cell:last-child {
            border-right: none !important;
          }
        `}
        {agGridEditableCellHoverCss}
      </style>
      <AgGridReact
        key={gridMountKey}
        ref={gridRef}
        domLayout={fixedViewport ? undefined : "autoHeight"}
        style={{
          width: "100%",
          height: fixedViewport ? "100%" : "auto"
        }}
        rowData={rowData}
        columnDefs={columnDefs}
        onCellValueChanged={onCellValueChanged}
        onFirstDataRendered={settlePreview}
        getRowHeight={getRowHeight}
        getRowId={(params) =>
          String(
            params.data?.[ENTRY_CODE_PREVIEW_ROW_ID_KEY] ??
              `ecp-${params.node?.rowIndex ?? 0}`
          )
        }
        immutableData
        suppressHorizontalScroll
        suppressRowHoverHighlight
        suppressFieldDotNotation
        overlayNoRowsTemplate={`<span class="ag-overlay-no-rows-center">${t("No Rows to Show")}</span>`}
      />
    </div>
  );
}
