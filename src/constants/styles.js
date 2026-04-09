import { CustomPalette } from "./customPalette";
import { BETWEEN_SECTION_SPACING } from "./constants";

export const preWrapWordBreak = {
  whiteSpace: "pre-wrap",
  wordBreak: "break-word"
};

export const greyCellStyle = {
  ...preWrapWordBreak,
  backgroundColor: CustomPalette.GREY_200
};

export const flexCenter = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center"
};

// Form Builder styles
export const disabledChipStyle = {
  backgroundColor: CustomPalette.GREY_200,
  "& .MuiChip-deleteIcon": {
    color: CustomPalette.GREY_500
  }
};

export const disabledRadioCheckboxStyle = {
  color: CustomPalette.GREY_400,
  "&.Mui-disabled": { color: CustomPalette.GREY_400 }
};

export const textFieldStyle = {
  backgroundColor: CustomPalette.GREY_100,
  fontSize: "0.875rem"
};

export const chipContainerStyle = {
  display: "flex",
  flexWrap: "wrap",
  gap: 0.5,
  mb: 1
};

export const textWrapStyle = {
  wordBreak: "break-word",
  overflowWrap: "break-word",
  whiteSpace: "normal",
  lineHeight: 1.4
};

// Dialog styles
export const dialogTitleStyle = {
  backgroundColor: CustomPalette.GREY_200,
  color: CustomPalette.GREY_800
};

export const dialogActionsStyle = {
  backgroundColor: CustomPalette.GREY_200,
  px: 3,
  py: 2
};

export const dialogCancelButtonStyle = {
  color: CustomPalette.GREY_600
};

export const dialogSaveButtonStyle = {
  backgroundColor: CustomPalette.PRIMARY,
  "&:hover": {
    backgroundColor: CustomPalette.DARK
  }
};

export const multilingualFieldContainerStyle = {
  pl: 2,
  display: "flex",
  flexDirection: "column",
  gap: 1.5
};

export const languageLabelStyle = {
  fontWeight: 500,
  color: CustomPalette.PRIMARY
};

export const gridStyles = `
.ag-cell {
  line-height: 1.5;
}

.ag-theme-balham .ag-cell {
  border-right: 1px solid ${CustomPalette.GREY_300};
  display: flex;
  justify-content: center;
  align-items: center;
}

.ag-header-cell-label {
  display: flex;
  justify-content: center;
  align-items: center;
}

.ag-header-group-cell-label{
  display: flex;
  justify-content: center;
  align-items: center;
}

.ag-cell-wrapper > *:not(.ag-cell-value):not(.ag-group-value) {
  height: 100%;
}

.ag-theme-balham .ag-body-viewport {
  scrollbar-gutter: stable;
}

.ag-theme-balham:not(.ag-grid-compact) .ag-root-wrapper-body.ag-layout-normal .ag-center-cols-clipper {
  min-height: 100% !important;
}

.ag-theme-balham.ag-grid-compact .ag-root-wrapper {
  height: auto !important;
}
.ag-theme-balham.ag-grid-compact .ag-center-cols-clipper,
.ag-theme-balham.ag-grid-compact .ag-center-cols-container {
  min-height: 0 !important;
}

/* Visible overlay only: hidden overlay still keeps .ag-overlay-no-rows-wrapper on a child. */
.ag-root-wrapper:has(.ag-overlay:not(.ag-hidden) .ag-overlay-no-rows-wrapper) {
  min-height: 100px !important;
}

.ag-root-wrapper:has(.ag-overlay:not(.ag-hidden) .ag-overlay-no-rows-wrapper)
  .ag-root-wrapper-body {
  min-height: 100px !important;
}

/* Labels, Attributes, Summary: half the default no-rows overlay floor */
.view-schema-grid.ag-theme-balham .ag-root-wrapper:has(.ag-overlay:not(.ag-hidden) .ag-overlay-no-rows-wrapper),
.lan-grid.ag-theme-balham .ag-root-wrapper:has(.ag-overlay:not(.ag-hidden) .ag-overlay-no-rows-wrapper),
.attribute-details-grid.ag-theme-balham .ag-root-wrapper:has(.ag-overlay:not(.ag-hidden) .ag-overlay-no-rows-wrapper) {
  min-height: 50px !important;
}
.view-schema-grid.ag-theme-balham
  .ag-root-wrapper:has(.ag-overlay:not(.ag-hidden) .ag-overlay-no-rows-wrapper)
  .ag-root-wrapper-body,
.lan-grid.ag-theme-balham
  .ag-root-wrapper:has(.ag-overlay:not(.ag-hidden) .ag-overlay-no-rows-wrapper)
  .ag-root-wrapper-body,
.attribute-details-grid.ag-theme-balham
  .ag-root-wrapper:has(.ag-overlay:not(.ag-hidden) .ag-overlay-no-rows-wrapper)
  .ag-root-wrapper-body {
  min-height: 50px !important;
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

.ag-row .delete-icon-solid {
  display: none;
}
.delete-icon-wrapper:hover .delete-icon-outline {
  display: none;
}
.delete-icon-wrapper:hover .delete-icon-solid {
  display: inline-flex;
}

/* Overlay tables use fixed column widths; stable scrollbar gutter reads as ~15px empty space on the right */
.character-encoding-grid.ag-theme-balham .ag-body-viewport,
.format-rule-v2-grid.ag-theme-balham .ag-body-viewport,
.range-overlay-grid.ag-theme-balham .ag-body-viewport,
.unit-framing-grid.ag-theme-balham .ag-body-viewport,
.form-information-grid.ag-theme-balham .ag-body-viewport,
.required-entries-grid.ag-theme-balham .ag-body-viewport,
.cardinality-overlay-grid.ag-theme-balham .ag-body-viewport,
.attribute-details-grid.ag-theme-balham .ag-body-viewport,
.lan-grid.ag-theme-balham .ag-body-viewport,
.entry-code-upload-preview-grid.ag-theme-balham .ag-body-viewport {
  scrollbar-gutter: auto;
}

.overlay-grid-suppress-hscroll.ag-theme-balham .ag-body-horizontal-scroll {
  display: none !important;
}
.overlay-grid-suppress-hscroll.ag-theme-balham .ag-header-viewport,
.overlay-grid-suppress-hscroll.ag-theme-balham .ag-body-viewport,
.overlay-grid-suppress-hscroll.ag-theme-balham .ag-center-cols-viewport {
  padding-right: 0 !important;
  overflow-x: hidden !important;
}
.overlay-grid-suppress-hscroll.ag-theme-balham .ag-root-wrapper,
.overlay-grid-suppress-hscroll.ag-theme-balham .ag-body-viewport-wrapper {
  overflow-x: hidden !important;
}

.character-encoding-grid.ag-theme-balham,
.form-information-grid.ag-theme-balham,
.required-entries-grid.ag-theme-balham,
.cardinality-overlay-grid.ag-theme-balham {
  min-height: 120px;
}
.overlay-grid-fixed-viewport.ag-theme-balham:not(.ag-grid-compact) {
  height: min(70vh, 560px);
}
.overlay-grid-fixed-viewport.ag-theme-balham:not(.ag-grid-compact) .ag-root-wrapper {
  height: 100%;
}

.required-entries-grid .ag-cell[col-id="Attribute"] .ag-cell-value {
  text-align: center;
  width: 100%;
}
.required-entries-grid .ag-header-cell[col-id="Required Entry"] input[type="checkbox"],
.required-entries-grid .ag-cell[col-id="Required Entry"] input[type="checkbox"] {
  width: 13px;
  height: 13px;
  margin: 0;
}
`;

export const matchingEntryCodeGridStyles = `
.matching-entry-code-grid.matching-entry-code-grid-root {
  width: 480px;
  max-width: 100%;
  box-sizing: border-box;
}
.matching-entry-code-grid.matching-entry-code-grid-root .ag-root-wrapper {
  width: 100%;
}
.matching-entry-code-grid.matching-entry-code-grid--inner {
  width: 100%;
}
.matching-entry-code-grid--inner.matching-entry-code-grid--pending {
  visibility: hidden;
  pointer-events: none;
}
.matching-entry-code-grid.overlay-grid-suppress-hscroll.ag-theme-balham .ag-body-viewport {
  scrollbar-gutter: stable !important;
}
.matching-entry-code-grid .matching-entry-code-data-header-cell {
  justify-content: stretch !important;
  padding-left: 2px !important;
  padding-right: 0 !important;
}
.matching-entry-code-grid .matching-entry-code-data-header-cell .ag-cell-wrapper {
  width: 100% !important;
  max-width: 100% !important;
  padding-right: 0 !important;
}
.matching-entry-code-grid .matching-entry-code-data-header-cell .ag-cell-value {
  width: 100% !important;
  max-width: 100% !important;
  display: flex !important;
  justify-content: stretch !important;
  padding-right: 0 !important;
  margin-right: 0 !important;
}
.matching-entry-code-grid .matching-entry-code-data-header-cell .ag-cell-value > * {
  flex: 1 1 0 !important;
  min-width: 0 !important;
  max-width: 100% !important;
}
.matching-entry-code-grid .matching-entry-code-assigned-cell {
  background-color: ${CustomPalette.GREY_200} !important;
}
.matching-entry-code-grid .matching-entry-code-data-header-cell .MuiSelect-select {
  padding-right: 6px !important;
}
.matching-entry-code-grid .matching-entry-code-data-header-cell .MuiSelect-icon {
  right: 0 !important;
}
`;

export const matchingEntryCodePageBoxSx = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  marginTop: 2,
  flex: 1,
  mb: BETWEEN_SECTION_SPACING
};

export const matchingEntryCodeMenuItemSx = {
  border: "none",
  height: "2rem",
  fontSize: "small"
};

export const matchingEntryCodeSelectHostBoxSx = {
  width: "100%",
  minWidth: 0,
  flex: 1,
  alignSelf: "stretch"
};

export function rangeOverlayViewportCss(fixedViewport) {
  if (fixedViewport) {
    return `.range-overlay-grid.ag-theme-balham{height:min(70vh,560px);min-height:120px}.range-overlay-grid .ag-root-wrapper{height:100%}`;
  }
  return `.range-overlay-grid.ag-theme-balham{min-height:80px}.range-overlay-grid .ag-root-wrapper{height:auto}.range-overlay-grid .ag-root-wrapper-body.ag-layout-auto-height{min-height:unset!important}.range-overlay-grid .ag-layout-auto-height .ag-center-cols-clipper{min-height:unset!important}.range-overlay-grid .ag-layout-auto-height .ag-body-viewport{flex:none!important;min-height:unset!important}.range-overlay-grid .ag-body-viewport-wrapper{min-height:unset!important}.range-overlay-grid .ag-layout-auto-height .ag-body-viewport-wrapper{flex:none!important;min-height:unset!important}`;
}

export function entryCodeUploadPreviewGridLayoutCss(fixedViewport) {
  if (fixedViewport) {
    return `.entry-code-upload-preview-grid.ag-theme-balham{height:min(70vh,560px);min-height:120px}.entry-code-upload-preview-grid .ag-root-wrapper{height:100%}`;
  }
  return `.entry-code-upload-preview-grid.ag-theme-balham{min-height:0}.entry-code-upload-preview-grid .ag-root-wrapper{height:auto}.entry-code-upload-preview-grid .ag-root-wrapper-body.ag-layout-auto-height{min-height:unset!important}.entry-code-upload-preview-grid .ag-layout-auto-height .ag-center-cols-clipper{min-height:unset!important}.entry-code-upload-preview-grid .ag-layout-auto-height .ag-body-viewport{flex:none!important;min-height:unset!important}.entry-code-upload-preview-grid .ag-body-viewport-wrapper{min-height:unset!important}.entry-code-upload-preview-grid .ag-layout-auto-height .ag-body-viewport-wrapper{flex:none!important;min-height:unset!important}`;
}
