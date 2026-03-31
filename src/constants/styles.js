import { CustomPalette } from "./customPalette";

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

.ag-root-wrapper:has(.ag-overlay-no-rows-wrapper) {
  min-height: 100px !important;
}

.ag-root-wrapper:has(.ag-overlay-no-rows-wrapper) .ag-root-wrapper-body {
  min-height: 100px !important;
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
`;

export function formatRuleGridCss(useFixedViewport) {
  const fixedClipper = `
.format-rule-v2-grid.ag-theme-balham .ag-root-wrapper-body.ag-layout-normal .ag-center-cols-clipper,
.format-rule-v2-grid.ag-theme-balham .ag-root-wrapper-body.ag-layout-auto-height .ag-center-cols-clipper,
.format-rule-v2-grid.ag-theme-balham .ag-layout-auto-height .ag-center-cols-container {
  min-height: unset !important;
}
`;
  const compactAutoHeight = `
.format-rule-v2-grid.ag-grid-compact .ag-root-wrapper-body.ag-layout-auto-height {
  align-items: flex-start;
  min-height: 0 !important;
}
.format-rule-v2-grid.ag-grid-compact .ag-body-clipper.ag-layout-auto-height {
  flex: none !important;
  height: auto !important;
  min-height: 0 !important;
}
.format-rule-v2-grid.ag-grid-compact .ag-body.ag-layout-auto-height {
  flex: none !important;
  min-height: 0 !important;
}
.format-rule-v2-grid.ag-grid-compact .ag-body-viewport.ag-layout-auto-height {
  flex: none !important;
  height: auto !important;
  min-height: 0 !important;
}
.format-rule-v2-grid.ag-grid-compact .ag-body-viewport-wrapper {
  min-height: 0 !important;
}
.format-rule-v2-grid.ag-grid-compact .ag-layout-auto-height .ag-body-viewport-wrapper {
  flex: none !important;
  min-height: 0 !important;
}
.format-rule-v2-grid.ag-grid-compact .ag-root.ag-layout-auto-height {
  flex: 0 0 auto !important;
  min-height: 0 !important;
}
`;
  return `
.format-rule-v2-grid.ag-theme-balham {
  ${useFixedViewport ? "height: min(70vh, 560px);" : ""}
  min-height: ${useFixedViewport ? "120px" : "0"};
}
.format-rule-v2-grid .ag-root-wrapper {
  height: ${useFixedViewport ? "100%" : "auto"};
}
${useFixedViewport ? fixedClipper : compactAutoHeight}
.format-rule-v2-grid .ag-body-horizontal-scroll {
  display: none !important;
  height: 0 !important;
  min-height: 0 !important;
  overflow: hidden !important;
}
.format-rule-v2-grid .ag-body-viewport {
  scrollbar-gutter: auto !important;
}
`;
}
