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
`;
