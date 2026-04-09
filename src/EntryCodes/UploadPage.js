import React from "react";
import BackNextSkeleton from "../components/BackNextSkeleton";
import {
  BETWEEN_SECTION_SPACING,
  ENTRY_CODE_UPLOAD_PREVIEW_MAX_WIDTH_PX
} from "../constants/constants";
import { Box, Button, FormControl, Select, Typography } from "@mui/material";
import Drop from "../StartSchema/Drop";
import useHandleEntryCodeDrop from "./useHandleEntryCodeDrop";
import { gridStyles, entryCodeUploadPreviewGridLayoutCss } from "../constants/styles";
import { AgGridReact } from "../components/AgGridReact";
import { CustomPalette } from "../constants/customPalette";
import csvFileExample from "../assets/csv_example.png";
import { useTranslation } from "react-i18next";

const UploadPage = () => {
  const { t } = useTranslation();
  const {
    rawFile,
    setRawFile,
    loading,
    setLoadingState,
    dropDisabled,
    dropMessage,
    setDropMessage,
    handleClearUpload,
    tempEntryCodeRowData,
    tableLength,
    columnDefs,
    handleSave,
    gridRef,
    setCurrentPage,
    setChosenEntryCodeIndex,
    fileType,
    selectionValue,
    setSelectionValue,
    userSelectionListDropdown,
    attributeListDropdown,
    selectedAttrToCopy,
    setSelectedAttrToCopy,
    hasActiveEntryCodeUpload,
    bundleHasEntryCodes,
    entryCodeUploadForwardEnabled,
    entryCodePreviewFixedViewport
  } = useHandleEntryCodeDrop();

  const previewGridWidthPx = Math.min(
    Math.max(tableLength + 2, 1),
    ENTRY_CODE_UPLOAD_PREVIEW_MAX_WIDTH_PX
  );

  return (
    <Box sx={{ display: "flex", flexDirection: "column", flex: 1 }}>
      <BackNextSkeleton
        isBack
        pageBack={() => {
          handleClearUpload();
          setCurrentPage("Codes");
          setChosenEntryCodeIndex(-1);
        }}
        isForward={
          (selectionValue === "Copy from other entry codes" &&
            selectedAttrToCopy !== "") ||
          (selectionValue === "Upload" && entryCodeUploadForwardEnabled)
        }
        pageForward={handleSave}
      />
      <Box sx={{ mb: BETWEEN_SECTION_SPACING, flex: 1 }}>
      <FormControl
        variant="standard"
        sx={{
          minWidth: 120,
          width: "100%",
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          pr: 10,
          pl: 11,
          marginTop: 2
        }}
      >
        <Typography>{t("Please choose the type:")} &nbsp;</Typography>
        <Select
          value={selectionValue}
          onChange={(e) => setSelectionValue(e.target.value)}
          displayEmpty
          MenuProps={{ disableScrollLock: true }}
          sx={{
            minWidth: "100px"
          }}
        >
          {userSelectionListDropdown}
        </Select>
      </FormControl>
      {selectionValue === "Upload" ? (
        <Box
          sx={{
            display: { xs: "flex", md: "grid" },
            flexDirection: { xs: "column" },
            gridTemplateColumns: { md: "auto minmax(0, 1fr)" },
            alignItems: { xs: "stretch", md: "start" },
            columnGap: { md: 5 },
            rowGap: { xs: 0.5, md: 0 },
            pl: 11,
            pr: 10,
            paddingBottom: "3rem",
            flex: 1,
            width: "100%",
            maxWidth: "100%",
            boxSizing: "border-box"
          }}
        >
          <Box
            sx={{
              minWidth: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              width: { xs: "100%", md: "max-content" },
              justifySelf: { md: "start" }
            }}
          >
            <Box
              sx={{
                width: "100%",
                maxWidth: { xs: 420, md: 400 },
                display: "flex",
                flexDirection: "column",
                alignItems: "center"
              }}
            >
              <Drop
                setFile={setRawFile}
                setLoading={setLoadingState}
                loading={loading}
                dropDisabled={dropDisabled}
                dropMessage={dropMessage}
                setDropMessage={setDropMessage}
                tipDescription={null}
                description={t(
                  "Click here to select a .csv file or schema bundle, or drag and drop one here."
                )}
                noteDescription={t(
                  "Note: Your .csv file contains a list of entry codes. You can also include language labels for each entry code in adjacent columns"
                )}
                version={5}
              />
              <Box
                display="flex"
                sx={{
                  mt: 1,
                  width: "100%",
                  justifyContent: "center"
                }}
              >
                <Button
                  variant="contained"
                  color="button"
                  onClick={handleClearUpload}
                  sx={{ width: 230 }}
                  disabled={!hasActiveEntryCodeUpload}
                >
                  {t("Clear Entry Code File")}
                </Button>
              </Box>
            </Box>
          </Box>
          <Box
            sx={{
              minWidth: 0,
              width: "100%",
              maxWidth: "100%",
              display: "flex",
              flexDirection: "column",
              alignItems: "center"
            }}
          >
            {hasActiveEntryCodeUpload && fileType === "csvORxls" ? (
              <Box
                sx={{
                  width: "100%",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center"
                }}
              >
                <Typography
                  variant="h4"
                  sx={{ color: CustomPalette.PRIMARY, width: "100%", textAlign: "center" }}
                >
                  {t("Data Preview")}
                </Typography>
                <Box
                  sx={{
                    width: "100%",
                    display: "flex",
                    justifyContent: "center",
                    mt: 2,
                    overflowX: "auto",
                    boxSizing: "border-box"
                  }}
                >
                  <div
                    className={`entry-code-upload-preview-grid ag-theme-balham${
                      entryCodePreviewFixedViewport ? "" : " ag-grid-compact"
                    }`}
                    style={{
                      maxWidth: "100%",
                      boxSizing: "border-box",
                      ...(entryCodePreviewFixedViewport ? {} : { height: "fit-content" })
                    }}
                  >
                    <style>{`${gridStyles}${entryCodeUploadPreviewGridLayoutCss(
                      entryCodePreviewFixedViewport
                    )}`}</style>
                    <div style={{ minWidth: Math.min(previewGridWidthPx, ENTRY_CODE_UPLOAD_PREVIEW_MAX_WIDTH_PX) }}>
                      <AgGridReact
                        key={entryCodePreviewFixedViewport ? "fx" : "ah"}
                        ref={gridRef}
                        rowData={tempEntryCodeRowData}
                        columnDefs={columnDefs}
                        domLayout={entryCodePreviewFixedViewport ? undefined : "autoHeight"}
                        style={{
                          width: "100%",
                          height: entryCodePreviewFixedViewport ? "100%" : "auto"
                        }}
                        suppressFieldDotNotation={true}
                      />
                    </div>
                  </div>
                </Box>
              </Box>
            ) : hasActiveEntryCodeUpload &&
              (fileType === "json" || fileType === "zip") &&
              !loading &&
              bundleHasEntryCodes ? (
              <Typography
                variant="h4"
                sx={{ color: "Gray", mb: "4rem", width: "100%", textAlign: "center" }}
              >
                {t("Please continue to the next page")}
              </Typography>
            ) : hasActiveEntryCodeUpload &&
              (fileType === "json" || fileType === "zip") &&
              !loading &&
              !bundleHasEntryCodes ? (
              <Typography
                variant="h4"
                sx={{ color: "Gray", mb: "4rem", width: "100%", textAlign: "center" }}
              >
                {t("No entry codes in this schema")}
              </Typography>
            ) : (
              <Box
                sx={{
                  width: "100%",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center"
                }}
              >
                <Typography variant="h5" sx={{ width: "100%", textAlign: "center" }}>
                  {t("CSV Example:")}
                </Typography>
                <Box
                  component="img"
                  src={csvFileExample}
                  alt="CSV example"
                  sx={{
                    mt: "10px",
                    mb: "30px",
                    maxWidth: "100%",
                    height: "auto",
                    maxHeight: "300px",
                    display: "block",
                    mx: "auto"
                  }}
                />
              </Box>
            )}
          </Box>
        </Box>
      ) : (
        <FormControl
          variant="standard"
          sx={{
            minWidth: 120,
            width: "100%",
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            pr: 10,
            pl: 11,
            marginTop: 2
          }}
        >
          <Typography>{t("Copy entry codes from:")} &nbsp;</Typography>
          <Select
            value={selectedAttrToCopy}
            onChange={(e) => setSelectedAttrToCopy(e.target.value)}
            displayEmpty
            sx={{
              minWidth: "100px"
            }}
          >
            {attributeListDropdown}
          </Select>
        </FormControl>
      )}
      </Box>
    </Box>
  );
};

export default UploadPage;
