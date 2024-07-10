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
  file1Name,
  file2Name,
  setShowCard,
  dataDifference
}) {
  const { t } = useTranslation();
  const [columnDefs, setColumnDefs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const defaultColDef = {
    width: 200,
    editable: false,
  };

  const checkedType = dataDifference?.rowData?.[0]?.ocaFile1;
  let displayValues = [];
  const isEntryTable = typeof checkedType === "object" && !(checkedType instanceof Array);
  if (isEntryTable) {
    const newRowData = [];
    dataDifference?.rowData?.forEach((item) => {
      let setComparisonValue = false;
      const ocaFile1Keys = Object.keys(item.ocaFile1);
      const ocaFile2Keys = Object.keys(item.ocaFile2);
      const uniqueKeys = [...new Set([...ocaFile1Keys, ...ocaFile2Keys])];
      for (const key of uniqueKeys) {
        const newObj = {
          comparisonValue: !setComparisonValue ? item.comparisonValue : "",
          ocaFile1: item.ocaFile1?.[key] || "",
          ocaFile2: item.ocaFile2?.[key] || "",
          code: key,
        };
        setComparisonValue = true;
        newRowData.push(newObj);
      }
    });

    displayValues = newRowData;
  } else {
    displayValues = dataDifference?.rowData;
  }


  useEffect(() => {
    const columnDefs = [
      { field: "comparisonValue", headerName: "", cellStyle: () => preWrapWordBreak, autoHeight: true, },
    ];
    if (isEntryTable) {
      columnDefs.push({ field: "code", headerName: "Code", cellStyle: () => preWrapWordBreak, autoHeight: true, });
    }
    columnDefs.push({ field: "ocaFile1", headerName: file1Name, cellStyle: () => preWrapWordBreak, autoHeight: true, });
    columnDefs.push({ field: "ocaFile2", headerName: file2Name, cellStyle: () => preWrapWordBreak, autoHeight: true, });
    setIsLoading(false);
    setColumnDefs(columnDefs);
  }, [isEntryTable]);

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
          maxHeight: "70vh",
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
        {isLoading ? <>Loading...</> :
          (<div style={{ width: '100%', maxHeight: '70vh', overflow: 'auto', display: 'flex', justifyContent: 'center', marginTop: '2rem', marginBottom: "2rem" }}>
            <div className="ag-theme-balham" style={{ width: 600, height: '100%' }}>
              <style>{gridStyles}</style>
              <AgGridReact
                rowData={displayValues}
                columnDefs={columnDefs}
                defaultColDef={defaultColDef}
                domLayout="autoHeight"
              />
            </div>
          </div>)}


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