import React, { useEffect, useState } from "react";
import { Box, Button, Typography } from "@mui/material";
import { CustomPalette } from "../constants/customPalette";
import { useTranslation } from "react-i18next";
import { AgGridReact } from "ag-grid-react";
import { preWrapWordBreak } from "../constants/styles";

const gridStyles = `
.ag-header-cell-label {
  display: flex;
  justify-content: center;
  align-items: center;
}
`;

function MergeDifferenceModal({
  setShowCard,
  dataDifference
}) {
  const { t } = useTranslation();
  const [columnDefs, setColumnDefs] = useState([]);
  console.log('dataDifference', dataDifference);

  const defaultColDef = {
    width: 200,
    editable: false,
  };

  useEffect(() => {
    const columnDefs = [
      { field: "comparisonValue", headerName: "", cellStyle: () => preWrapWordBreak, autoHeight: true, },
      { field: "ocaFile1", headerName: "Schema 1", cellStyle: () => preWrapWordBreak, autoHeight: true, },
      { field: "ocaFile2", headerName: "Schema 2", cellStyle: () => preWrapWordBreak, autoHeight: true, },
    ];
    setColumnDefs(columnDefs);
  }, []);

  return (
    <Box
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        zIndex: 50,
        backdropFilter: "blur(5px)",
        backgroundColor: "rgba(0, 0, 0, 0.3)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <Box
        sx={{
          position: "absolute",
          top: 150,
          zIndex: 100,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-around",
          alignItems: "center",
          width: "40rem",
          minHeight: "20rem",
          maxHeight: "80vh",
          p: 3,
          boxShadow: 20,
          borderRadius: "0.5rem",
          backgroundColor: CustomPalette.WHITE,
          border: "1px solid",
          borderColor: CustomPalette.RED_100,
          // animation: appearAnimation,
        }}
      >
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            width: "100%",
            backgroundColor: CustomPalette.PRIMARY,

          }}
        >
          <Typography variant="body1" sx={{ p: 1, fontSize: 20, color: "white" }}>
            {dataDifference?.title}
          </Typography>
        </Box>
        <div style={{ width: '100%', maxHeight: '70vh', overflow: 'auto', display: 'flex', justifyContent: 'center', marginTop: '2rem', marginBottom: "2rem" }}>
          <div className="ag-theme-balham" style={{ width: 600, height: '100%' }}>
            <style>{gridStyles}</style>
            <AgGridReact
              rowData={dataDifference?.rowData}
              columnDefs={columnDefs}
              defaultColDef={defaultColDef}
              domLayout="autoHeight"
            />
          </div>
        </div>


        <Box sx={{ alignSelf: "flex-end" }}>
          <Button
            variant="outlined"
            color="navButton"
            onClick={() => {
              setShowCard(false);
            }}
            sx={{ mr: 2, color: CustomPalette.PRIMARY, borderColor: CustomPalette.PRIMARY, ":hover": { borderColor: CustomPalette.SECONDARY, color: CustomPalette.SECONDARY } }}
          >
            {t('Close')}
          </Button>
        </Box>
      </Box>
    </Box>
  );
}


export default MergeDifferenceModal;