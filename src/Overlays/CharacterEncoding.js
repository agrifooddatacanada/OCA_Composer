import { Box, Button } from "@mui/material";
import React, { useContext, useEffect, useRef, useState } from "react";
import { Context } from "../App";
import { AgGridReact } from "ag-grid-react";
import "ag-grid-community/styles/ag-theme-balham.css";
import useCharacterEncodingType from "./useCharacterEncodingType";
import BackNextSkeleton from "../components/BackNextSkeleton";
import CellHeader from "../components/CellHeader";
import { gridStyles, preWrapWordBreak } from "../constants/styles";
import { CustomPalette } from "../constants/customPalette";

const CharacterEncoding = () => {
  const { characterEncodingRowData, setCurrentPage, setSelectedOverlay } = useContext(Context);
  const [columnDefs, setColumnDefs] = useState([]);
  const gridRef = useRef();
  const { handleSave, applyAllFunc, CharacterEncodingTypeRenderer } = useCharacterEncodingType(gridRef);

  useEffect(() => {
    setColumnDefs([
      {
        field: "Attribute",
        editable: false,
        width: 180,
        autoHeight: true,
        cellStyle: () => preWrapWordBreak,
        headerComponent: () => <CellHeader headerText='Attribute' helpText='This is the name for the attribute and, for example, will be the column header in every tabular data set no matter what language.' />,
      },
      {
        field: "CharacterEncoding",
        headerComponent: () => <CellHeader headerText='Character Encoding' helpText='Character encoding for the attribute. Recommend utf-8 unless you know it must be something else.' />,
        cellRenderer: CharacterEncodingTypeRenderer,
        cellRendererParams: (params) => ({
          attr: params.data.Attribute,
        }),
        width: 200,
      },
    ]);
  }, []);

  const handleForward = () => {
    handleSave();
    setSelectedOverlay('');
    setCurrentPage('Overlays');
  };

  return (
    <BackNextSkeleton isForward pageForward={handleForward}>
      <Box
        sx={{
          margin: "2rem",
          gap: "3rem",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Box style={{ display: "flex" }}>
          <Box className="ag-theme-balham" sx={{ width: 380 }}>
            <style>{gridStyles}</style>
            <AgGridReact
              ref={gridRef}
              rowData={characterEncodingRowData}
              columnDefs={columnDefs}
              domLayout="autoHeight"
            />
          </Box>
          <Box
            sx={{
              width: 70,
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-start",
            }}
          >
            <Box sx={{ height: "2.2rem" }} key={0}></Box>
            <Button
              color="navButton"
              sx={{
                ml: 1,
                width: 100,
                height: "1.7rem",
                color: CustomPalette.PRIMARY,
              }}
              onClick={applyAllFunc}
            >
              Apply All
            </Button>
          </Box>
        </Box>
      </Box>
    </BackNextSkeleton>
  );
};

export default CharacterEncoding;