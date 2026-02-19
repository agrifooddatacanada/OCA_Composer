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

.ag-center-cols-clipper {
  /* Ensure center columns fill the grid height so pinned columns stay aligned
     (fixes duplicate-looking sidebar appearing under the last row when dataset
     is short). */
  min-height: 100% !important;
}

.ag-root-wrapper:has(.ag-overlay-no-rows-wrapper) {
  min-height: 100px !important;
}

.ag-root-wrapper:has(.ag-overlay-no-rows-wrapper) .ag-root-wrapper-body {
  min-height: 100px !important;
}
`;
