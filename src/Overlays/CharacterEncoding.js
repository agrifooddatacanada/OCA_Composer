import { Box } from "@mui/material";
import React, { useContext, useEffect, useRef, useState } from "react";
import { Context } from "../App";
import { AgGridReact } from "ag-grid-react";
import "ag-grid-community/styles/ag-theme-balham.css";
import useCharacterEncodingType from "./useCharacterEncodingType";
import BackNextSkeleton from "../components/BackNextSkeleton";
import CellHeader from "../components/CellHeader";
import { gridStyles, preWrapWordBreak } from "../constants/styles";

const CharacterEncoding = () => {
  const { characterEncodingRowData, setCurrentPage, setSelectedOverlay } = useContext(Context);
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
        cellStyle: () => preWrapWordBreak,
        headerComponent: () => <CellHeader headerText='Attribute' helpText='This is the name for the attribute and, for example, will be the column header in every tabular data set no matter what language.' />,
      },
      {
        field: "CharacterEncoding",
        headerComponent: () => <CellHeader headerText='Character Encoding' helpText='This is the character encoding table.' />,
        cellRenderer: CharacterEncodingTypeRenderer,
        cellRendererParams: (params) => ({
          attr: params.data.Attribute,
        }),
        width: 200,
      },
    ]);
  }, []);

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