import React, { useCallback, useLayoutEffect, useState } from "react";
import { Box, Button, FormControl, Select, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import BackNextSkeleton from "../components/BackNextSkeleton";
import { BETWEEN_SECTION_SPACING, LAN_GRID_SHELL_WIDTH_PX } from "../constants/constants";
import Drop from "../StartSchema/Drop";
import useHandleEntryCodeDrop from "./useHandleEntryCodeDrop";
import EntryCodeUploadPreviewGrid from "./EntryCodeUploadPreviewGrid";
import { CustomPalette } from "../constants/customPalette";
import csvFileExample from "../assets/csv_example.png";
import Spinner from "../components/Spinner";

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
    entryCodePreviewFixedViewport,
    entryCodePreviewShellWidthPx,
    onEntryCodePreviewCellValueChanged
  } = useHandleEntryCodeDrop();

  const [previewGridReady, setPreviewGridReady] = useState(false);

  const previewCsvCanMount = columnDefs.length > 0 && entryCodePreviewShellWidthPx > 0;

  const previewGridMountKey = `ec-${entryCodePreviewFixedViewport}-${String(rawFile?.[0]?.lastModified ?? "")}-${String(rawFile?.[0]?.name ?? "")}-${columnDefs.map((c) => c.field).join(",")}`;

  useLayoutEffect(() => {
    if (!hasActiveEntryCodeUpload || fileType !== "csvORxls") return;
    setPreviewGridReady(false);
  }, [hasActiveEntryCodeUpload, fileType, previewGridMountKey]);

  const handlePreviewStable = useCallback(() => {
    setPreviewGridReady(true);
  }, []);

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
              gridTemplateColumns: { md: "400px minmax(0, 1fr)" },
              alignItems: { xs: "stretch", md: "start" },
              columnGap: { md: 5 },
              rowGap: { xs: 0.5, md: 0 },
              pl: 11,
              pr: 10,
              paddingBottom: "3rem",
              flex: 1,
              width: "100%",
              maxWidth: "100%",
              boxSizing: "border-box",
              scrollbarGutter: "stable"
            }}
          >
            <Box
              sx={{
                minWidth: 0,
                display: "flex",
                flexDirection: "column",
                alignItems: "stretch",
                width: { xs: "100%", md: "100%" },
                justifySelf: { md: "stretch" }
              }}
            >
              <Box
                sx={{
                  width: "100%",
                  maxWidth: { xs: 420, md: "100%" },
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "stretch"
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
                  fullWidthCard
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
                    sx={{
                      color: CustomPalette.PRIMARY,
                      width: "100%",
                      textAlign: "center"
                    }}
                  >
                    {t("Data Preview")}
                  </Typography>
                  <Box
                    sx={{
                      position: "relative",
                      width: "100%",
                      maxWidth: previewCsvCanMount
                        ? Math.min(LAN_GRID_SHELL_WIDTH_PX, entryCodePreviewShellWidthPx)
                        : LAN_GRID_SHELL_WIDTH_PX,
                      alignSelf: "center",
                      mt: 2,
                      minWidth: 0,
                      display: "flex",
                      justifyContent: "center",
                      boxSizing: "border-box"
                    }}
                  >
                    {hasActiveEntryCodeUpload &&
                      fileType === "csvORxls" &&
                      (!previewCsvCanMount || !previewGridReady) && (
                        <Box
                          sx={{
                            position: "absolute",
                            inset: 0,
                            zIndex: 2,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            backgroundColor: "rgba(255,255,255,0.92)",
                            minHeight: entryCodePreviewFixedViewport
                              ? { xs: 280, sm: "min(70vh, 560px)" }
                              : 200
                          }}
                        >
                          <Spinner text={t("Loading...")} size={36} />
                        </Box>
                      )}
                    {previewCsvCanMount && (
                      <EntryCodeUploadPreviewGrid
                        gridRef={gridRef}
                        rowData={tempEntryCodeRowData}
                        columnDefs={columnDefs}
                        fixedViewport={entryCodePreviewFixedViewport}
                        shellWidthPx={entryCodePreviewShellWidthPx}
                        onPreviewStable={handlePreviewStable}
                        onCellValueChanged={onEntryCodePreviewCellValueChanged}
                        gridMountKey={previewGridMountKey}
                      />
                    )}
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
