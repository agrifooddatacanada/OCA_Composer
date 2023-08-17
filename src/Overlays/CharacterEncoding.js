import { Box, Tooltip } from "@mui/material";
import { CustomPalette } from "../constants/customPalette";
import React, { useContext, useEffect, useRef, useState } from "react";
import { Context } from "../App";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import { AgGridReact } from "ag-grid-react";
import "ag-grid-community/styles/ag-theme-balham.css";
import useCharacterEncodingType from "./useCharacterEncodingType";
import BackNextSkeleton from "../components/BackNextSkeleton";

const AttributeHeader = () => {
  return (
    <>
      <span style={{ margin: "auto" }}>Attribute</span>
      <Tooltip
        title="This is the name for the attribute and, for example, will be the column header in every tabular data set no matter what language."
        placement="top"
        PopperProps={{
          sx: {
            "& .MuiTooltip-tooltip": {
              backgroundColor: CustomPalette.GREY_200,
              color: CustomPalette.GREY_800,
              boxShadow: 3,
            },
          },
        }}
      >
        <HelpOutlineIcon sx={{ fontSize: 15 }} />
      </Tooltip>
    </>
  );
};

const CharacterEncodingTypeHeader = () => {
  return (
    <>
      <span style={{ margin: "auto" }}>Character Encoding</span>
      <Tooltip
        title="This is the character encoding table."
        placement="top"
        PopperProps={{
          sx: {
            "& .MuiTooltip-tooltip": {
              backgroundColor: CustomPalette.GREY_200,
              color: CustomPalette.GREY_800,
              boxShadow: 3,
            },
          },
        }}
      >
        <HelpOutlineIcon sx={{ fontSize: 15 }} />
      </Tooltip>
    </>
  );
};

const gridStyles = `
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
  .ag-cell-wrapper > *:not(.ag-cell-value):not(.ag-group-value) {
    height: 100%;
  }
`;

const CharacterEncoding = () => {
  const { attributesList, characterEncodingRowData, setCurrentPage, setSelectedOverlay } = useContext(Context);
  const [columnDefs, setColumnDefs] = useState([]);
  const gridRef = useRef();
  const { handleSave, CharacterEncodingTypeRenderer } = useCharacterEncodingType(gridRef);

  useEffect(() => {
    setColumnDefs([
      {
        field: "Attribute",
        editable: false,
        width: 180,
        autoHeight: true,
        cellStyle: () => ({
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
        }),
        headerComponent: AttributeHeader,
      },
      {
        field: "CharacterEncoding",
        headerComponent: CharacterEncodingTypeHeader,
        cellRenderer: CharacterEncodingTypeRenderer,
        cellRendererParams: (params) => ({
          attr: params.data.Attribute,
        }),
        width: 200,
      },
    ]);
  }, [attributesList]);

  const handleBackward = () => {
    handleSave();
    setSelectedOverlay('');
    setCurrentPage('Overlays');
  };

  return (
    <BackNextSkeleton isBack pageBack={handleBackward}>
      <Box
        sx={{
          margin: "2rem",
          gap: "3rem",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div className="ag-theme-balham" style={{ width: 380 }}>
          <style>{gridStyles}</style>
          <AgGridReact
            ref={gridRef}
            rowData={characterEncodingRowData}
            columnDefs={columnDefs}
            domLayout="autoHeight"
          />
        </div>
      </Box>
    </BackNextSkeleton>
  );
};

export default CharacterEncoding;