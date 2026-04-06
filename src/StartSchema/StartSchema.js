import React, { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Box, Typography, Stepper, Step, StepLabel, ButtonBase } from "@mui/material";
import { useTranslation } from "react-i18next";
import Drop from "./Drop";
import useHandleAllDrop from "./useHandleAllDrop";
import ExcelSheetSelection from "../components/ExcelSheetSelection";
import BackNextSkeleton from "../components/BackNextSkeleton";
import { Context } from "../App";
import { CustomPalette } from "../constants/customPalette";

export default function StartSchema() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { setHistory } = useContext(Context);
  const {
    setRawFile,
    attributesList,
    setLoading,
    loading,
    dropDisabled,
    dropMessage,
    setDropMessage,
    setCurrentPage,
    resetUploadState,
    excelSheetNames,
    setExcelSheetChoice,
    excelSheetChoice,
    handlePageForward
  } = useHandleAllDrop();

  return (
    <Box sx={{ width: "100%" }}>
      <Box sx={{ px: 10, py: 4, display: "flex", flexDirection: "column", alignItems: "center" }}>
        <Stepper activeStep={0} alternativeLabel sx={{ width: "100%" }}>
          <Step
            sx={{
              "& .MuiStepLabel-root": { alignItems: "center" },
              "& .MuiStepLabel-labelContainer": { display: "flex", justifyContent: "center" }
            }}
          >
            <StepLabel icon={<Box sx={{ width: 24, height: 24 }} />}>
              <Box sx={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center" }}>
                <ButtonBase
                  component="span"
                  sx={{
                    cursor: "default",
                    alignSelf: "center",
                    px: 2,
                    py: 0.5,
                    border: `1px solid ${CustomPalette.PRIMARY}`,
                    borderRadius: 1,
                    backgroundColor: CustomPalette.PRIMARY,
                    color: "white",
                    boxShadow: "none",
                    fontSize: "0.875rem",
                    fontWeight: 500,
                    lineHeight: 1.2,
                    maxWidth: "140px",
                    minHeight: "32px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    textAlign: "center",
                    whiteSpace: "normal",
                    wordBreak: "break-word",
                    visibility: "hidden",
                    pointerEvents: "none"
                  }}
                >
                  {t("Write Names")}
                </ButtonBase>
              </Box>
            </StepLabel>
          </Step>
        </Stepper>
      </Box>

      <BackNextSkeleton
        isBack
        pageBack={() => {
          resetUploadState();
          setHistory((prev) => {
            const i = prev.lastIndexOf("Start");
            if (i <= 0) return ["Landing"];
            return prev.slice(0, i);
          });
          setCurrentPage("Landing");
          navigate("/");
        }}
        isForward={attributesList.length > 0 || excelSheetChoice !== -1}
        pageForward={handlePageForward}
      >
        <Box sx={{ mt: 0, mb: 3 }}>
          <Box
            display="flex"
            sx={{
              flexDirection: "column",
              alignItems: "center",
              width: 600,
              maxWidth: "100%",
              margin: "auto",
              marginBottom: 5
            }}
          >
            <Box display="flex" flexDirection="column" alignItems="center" sx={{ width: "100%" }}>
              <Button
                variant="contained"
                color="button"
                sx={{ width: 250, mb: 6, mt: 0, textTransform: "none" }}
                onClick={() => {
                  setCurrentPage("Create");
                }}
              >
                {t("TYPE IN COLUMN NAMES")}
              </Button>
              <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                {t("OR")}
              </Typography>
            </Box>

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
    </Box>
  );
}
