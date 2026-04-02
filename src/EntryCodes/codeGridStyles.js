import { CustomPalette } from "../constants/customPalette";

export const codeGridStyle = `
  .entry-codes-grid.ag-theme-balham {
    --ag-border-color: ${CustomPalette.GREY_300};
    --ag-secondary-border-color: ${CustomPalette.GREY_300};
    --ag-row-border-color: transparent;
    --ag-header-background-color: #fff;
    --ag-borders: none;
    --ag-borders-critical: none;
    --ag-borders-secondary: none;
    --ag-cell-horizontal-border: none;
    --ag-header-column-separator-display: none;
  }
  .entry-codes-grid.ag-theme-balham .ag-root-wrapper {
    border: none !important;
  }
  .entry-codes-grid .ag-root-wrapper-body,
  .entry-codes-grid .ag-body,
  .entry-codes-grid .ag-body-clipper,
  .entry-codes-grid .ag-body-viewport,
  .entry-codes-grid .ag-body-viewport-wrapper,
  .entry-codes-grid .ag-header-viewport,
  .entry-codes-grid .ag-center-cols-viewport,
  .entry-codes-grid .ag-body-horizontal-scroll,
  .entry-codes-grid .ag-body-vertical-scroll {
    border: none !important;
    box-shadow: none !important;
  }
  .entry-codes-grid .ag-body-horizontal-scroll:not(.ag-scrollbar-invisible) .ag-horizontal-left-spacer:not(.ag-scroller-corner),
  .entry-codes-grid .ag-body-horizontal-scroll:not(.ag-scrollbar-invisible) .ag-horizontal-right-spacer:not(.ag-scroller-corner) {
    border: none !important;
  }
  .entry-codes-grid .ag-header {
    border: none !important;
  }
  .entry-codes-grid .ag-header-cell {
    border-right: none !important;
    border-bottom: 1px solid ${CustomPalette.GREY_300} !important;
    border-left: none !important;
    border-top: none !important;
  }
  .entry-codes-grid .ag-cell {
    border-right: 1px solid ${CustomPalette.GREY_300} !important;
    border-bottom: 1px solid ${CustomPalette.GREY_300} !important;
    border-left: none !important;
    border-top: none !important;
  }
  .entry-codes-grid .ag-header-cell[col-id="Delete"],
  .entry-codes-grid .ag-cell[col-id="Delete"] {
    border-right: none !important;
  }
  .entry-codes-grid .ag-cell.ag-cell-last-right-pinned:not(.ag-cell-range-left):not(.ag-cell-range-single-cell) {
    border-right: none !important;
  }
  .entry-codes-grid .ag-row-last .ag-cell {
    border-bottom: none !important;
  }
  .entry-codes-grid .ag-row {
    border-bottom: none !important;
  }
  .entry-codes-grid .ag-cell.ag-cell-last-left-pinned:not(.ag-cell-range-right):not(.ag-cell-range-single-cell) {
    border-right: 1px solid ${CustomPalette.GREY_300} !important;
  }
  .entry-codes-grid .ag-cell.ag-cell-first-right-pinned:not(.ag-cell-range-left):not(.ag-cell-range-single-cell) {
    border-left: none !important;
  }
  .entry-codes-grid .ag-pinned-left-header,
  .entry-codes-grid .ag-pinned-left-cols-container {
    border-right: none !important;
  }
  .entry-codes-grid .ag-pinned-right-header,
  .entry-codes-grid .ag-pinned-right-cols-container {
    border-left: none !important;
  }
  .entry-codes-grid .ag-pinned-right-header .ag-header-cell-resize::after {
    display: none !important;
  }
  .entry-codes-grid .ag-cell[col-id="Code"],
  .entry-codes-grid .ag-cell[col-id="Code"] .ag-cell-wrapper,
  .entry-codes-grid .ag-cell[col-id="Code"] .ag-cell-value {
    min-width: 0;
    overflow: hidden !important;
  }
  .entry-codes-grid .ag-cell[col-id="Code"] textarea {
    overflow: hidden !important;
    scrollbar-width: none;
    -ms-overflow-style: none;
  }
  .entry-codes-grid .ag-cell[col-id="Code"] textarea::-webkit-scrollbar {
    width: 0;
    height: 0;
    display: none;
  }
  .entry-codes-grid .ag-header-cell-label {
    display: flex;
    justify-content: center;
    align-items: center;
  }
  .entry-codes-grid .ag-cell[col-id="Delete"] {
    padding-left: 0 !important;
    padding-right: 0 !important;
  }
  .entry-codes-grid .ag-cell.entry-code-delete-cell,
  .entry-codes-grid .ag-cell.entry-code-delete-cell .ag-cell-wrapper,
  .entry-codes-grid .ag-cell.entry-code-delete-cell .ag-cell-value {
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
  }
  .entry-codes-grid .ag-cell.entry-code-delete-cell .ag-cell-wrapper {
    width: 100%;
    height: 100%;
  }
  .entry-codes-grid .ag-select-list {
    height: 90px;
    overflow-y: auto;
  }
  .entry-codes-grid .ag-center-cols-clipper,
  .entry-codes-grid.ag-theme-balham.ag-grid-compact .ag-center-cols-clipper,
  .entry-codes-grid.ag-theme-balham.ag-grid-compact .ag-center-cols-container {
    min-height: unset !important;
  }
  .entry-codes-grid .ag-root-wrapper-body.ag-layout-auto-height {
    min-height: unset !important;
  }
  .entry-codes-grid .ag-root-wrapper:has(.ag-overlay-no-rows-wrapper) .ag-root-wrapper-body {
    min-height: 88px !important;
  }
  .entry-codes-grid .ag-row .delete-icon-solid {
    display: none;
  }
  .entry-codes-grid .ag-row:hover .delete-icon-outline {
    display: none;
  }
  .entry-codes-grid .ag-row:hover .delete-icon-solid {
    display: block;
  }
  .entry-codes-grid .ag-row:hover .ag-cell {
    background-color: ${CustomPalette.PINK_200} !important;
  }
  .entry-codes-grid .ag-cell-value {
    display: flex;
    justify-content: center;
    align-items: center;
  }
  .entry-codes-grid .ag-cell,
  .entry-codes-grid .ag-full-width-row .ag-cell-wrapper.ag-row-group {
    line-height: 1.5;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .entry-codes-grid .ag-cell .ag-drag-handle {
    margin-right: 0;
  }
  .entry-codes-grid-fixed-viewport.ag-theme-balham .ag-root-wrapper {
    height: 100%;
  }
  .entry-codes-grid .ag-horizontal-left-spacer,
  .entry-codes-grid .ag-horizontal-right-spacer {
    scrollbar-width: none;
    -ms-overflow-style: none;
  }
  .entry-codes-grid .ag-horizontal-left-spacer::-webkit-scrollbar,
  .entry-codes-grid .ag-horizontal-right-spacer::-webkit-scrollbar {
    width: 0;
    height: 0;
    display: none;
  }
`;
