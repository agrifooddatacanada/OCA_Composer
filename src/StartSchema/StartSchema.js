import React, { useEffect } from "react";
import { Button, Box, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import Drop from "./Drop";
import { CustomPalette } from "../constants/customPalette";
import useHandleAllDrop from "./useHandleAllDrop";
import ExcelSheetSelection from "../components/ExcelSheetSelection";
import BackNextSkeleton from "../components/BackNextSkeleton";

export default function StartSchema({ pageForward }) {
  const { t } = useTranslation();
  const {
    setRawFile,
    attributesList,
    setLoading,
    loading,
    dropDisabled,
    dropMessage,
    setDropMessage,
    setDropDisabled,
    setFileData,
    setCurrentPage,
    switchToLastPage,
    excelSheetNames,
    setExcelSheetChoice,
    setExcelSheetNames,
    excelSheetChoice,
    handlePageForward
  } = useHandleAllDrop();

  useEffect(() => {
    if (switchToLastPage) {
      setCurrentPage("View");
    }
  }, [switchToLastPage]);

  return (
    <BackNextSkeleton
      isBack={attributesList.length > 0 || excelSheetNames.length > 0}
      pageBack={() => {
        setDropDisabled(false);
        setFileData([]);  // attributesList derived from fileData
        setExcelSheetChoice(-1);
        setExcelSheetNames([]);
      }}
      isForward={attributesList.length > 0 || excelSheetChoice !== -1}
      pageForward={handlePageForward}
    >
      <Box sx={{ mt: 5, mb: 3 }}>
        <Box
          display="flex"
          sx={{
            flexDirection: "column",
            alignItems: "center",
            width: 600,
            margin: "auto",
            marginBottom: 10
          }}
        >
          {!(attributesList.length > 0 || excelSheetNames.length > 0) && (
            <Box display="flex" flexDirection="column" alignItems="center" sx={{ width: "100%" }}>
              <Button
                variant="contained"
                color="button"
                sx={{ width: 250, mb: 6, mt: 1 }}
                onClick={() => { setCurrentPage("Create") }}
              >
                {t("WRITE NAMES MANUALLY")}
              </Button>
              <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                {t("OR")}
              </Typography>
            </Box>
          )}
          
          {excelSheetNames.length > 0 ? (
            <ExcelSheetSelection
              chosenValue={excelSheetChoice}
              choices={excelSheetNames}
              setChoice={setExcelSheetChoice}
            />
          ) : (
            <Drop
              setFile={setRawFile}
              setLoading={setLoading}
              loading={loading}
              dropDisabled={dropDisabled}
              dropMessage={dropMessage}
              setDropMessage={setDropMessage}
            />
          )}
        </Box>
      </Box>
    </BackNextSkeleton>
  );
}
