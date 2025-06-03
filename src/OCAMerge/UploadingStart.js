import { Alert, Box, Button, Typography } from "@mui/material";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import BackNextSkeleton from "../components/BackNextSkeleton";
import useHandleOCAFileUpload from "./useHandleOCAFileUpload";
import Drop from "../StartSchema/Drop";
import {
  datasetUploadTooltip,
  jsonUploadTooltip,
  textUploadDescription
} from "../constants/constants";
import MergeDifferenceModal from "./MergeDifferenceModal";

const UploadingStart = () => {
  const { t } = useTranslation();
  const [showDifference, setShowDifference] = useState(false);

  const {
    setCurrentOCAMergePage,
    setOCAFile1Raw,
    setOCAFile2Raw,
    OCAFile1Loading,
    setOCAFile1Loading,
    OCAFile2Loading,
    setOCAFile2Loading,
    ocaFile1DropDisabled,
    setOcaFile1DropMessage,
    ocaFile1DropMessage,
    ocaFile2DropDisabled,
    setOcaFile2DropMessage,
    ocaFile2DropMessage,
    OCAFile1Raw,
    handleClearOCAFile1,
    OCAFile2Raw,
    handleClearOCAFile2,
    parsedOCAFile1,
    parsedOCAFile2
  } = useHandleOCAFileUpload();

  const filePath1 = OCAFile1Raw?.[0]?.path;
  const filePath2 = OCAFile2Raw?.[0]?.path;

  function createCaptureBaseDifferenceData() {
    const captureBase1 = parsedOCAFile1.capture_base;
    const captureBase2 = parsedOCAFile2.capture_base;

    let captureBase1AttrTypeStr = "";
    let captureBase2AttrTypeStr = "";

    Object.keys(captureBase1.attributes).forEach((attr, i, arr) => {
      captureBase1AttrTypeStr += `${attr} - ${captureBase1.attributes[attr]}`;
      if (i < arr.length - 1) {
        captureBase1AttrTypeStr += ", ";
      }
    });

    Object.keys(captureBase2.attributes).forEach((attr, i, arr) => {
      captureBase2AttrTypeStr += `${attr} - ${captureBase2.attributes[attr]}`;
      if (i < arr.length - 1) {
        captureBase2AttrTypeStr += ", ";
      }
    });

    return {
      title: "capture base",
      rowData: [
        {
          comparisonValue: "attributes",
          ocaFile1: captureBase1AttrTypeStr,
          ocaFile2: captureBase2AttrTypeStr
        },
        {
          comparisonValue: "classification",
          ocaFile1: captureBase1.classification,
          ocaFile2: captureBase2.classification
        },
        {
          comparisonValue: "sensitive",
          ocaFile1: captureBase1.flagged_attributes?.join(", "),
          ocaFile2: captureBase2.flagged_attributes?.join(", ")
        }
      ]
    };
  }

  const hasIncompatibleCaptureBase =
    parsedOCAFile1 !== "" &&
    parsedOCAFile2 !== "" &&
    parsedOCAFile1.capture_base.d !== parsedOCAFile2.capture_base.d;

  const canProceedToMerging =
    parsedOCAFile1 !== "" &&
    parsedOCAFile2 !== "" &&
    parsedOCAFile1.capture_base.d === parsedOCAFile2.capture_base.d;

  return (
    <Box sx={{ display: "flex", flexDirection: "column" }}>
      <BackNextSkeleton
        isForward={canProceedToMerging}
        pageForward={() => {
          setCurrentOCAMergePage("UserSelection");
        }}
      />
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          flex: 1
        }}
      >
        <Box sx={{ height: "3rem" }} />
        <Box>
          <Typography
            variant="h6"
            sx={{ textAlign: "start", color: "black", marginBottom: "-1rem" }}
          >
            {t("Required")}:{" "}
            {filePath1
              ? filePath1.substring(0, filePath1.lastIndexOf("."))
              : t("Schema Bundle 1")}
          </Typography>
          <Drop
            setFile={setOCAFile1Raw}
            setLoading={setOCAFile1Loading}
            loading={OCAFile1Loading}
            dropDisabled={ocaFile1DropDisabled}
            dropMessage={ocaFile1DropMessage}
            setDropMessage={setOcaFile1DropMessage}
            description={textUploadDescription}
            tipDescription={jsonUploadTooltip}
            version={1}
          />
        </Box>

        <Box display="flex">
          <Button
            variant="contained"
            color="button"
            onClick={handleClearOCAFile1}
            sx={{ width: 190, mr: 2 }}
            disabled={OCAFile1Raw.length === 0}
          >
            {t("Clear OCA File")}
          </Button>
        </Box>
        <Box sx={{ mt: "3rem" }}>
          {hasIncompatibleCaptureBase && (
            <Box sx={{ mb: "3rem" }}>
              <Alert severity="error" sx={{ mb: "0.5rem", maxWidth: "75ch" }}>
                {t(
                  "Capture base (attribute names and their datatypes, classification, and sensitive attributes) of the two schemas must be the same"
                )}
              </Alert>
              <Button
                variant="text"
                color="button"
                onClick={() => setShowDifference(true)}
              >
                {t("Show Difference")}
              </Button>
            </Box>
          )}
        </Box>
        <Box>
          <Typography
            variant="h6"
            sx={{ textAlign: "start", color: "black", marginBottom: "-1rem" }}
          >
            {t("Required")}:{" "}
            {filePath2
              ? filePath2.substring(0, filePath2.lastIndexOf("."))
              : t("Schema Bundle 2")}
          </Typography>
          <Drop
            setFile={setOCAFile2Raw}
            setLoading={setOCAFile2Loading}
            loading={OCAFile2Loading}
            dropDisabled={ocaFile2DropDisabled}
            dropMessage={ocaFile2DropMessage}
            setDropMessage={setOcaFile2DropMessage}
            description={textUploadDescription}
            tipDescription={datasetUploadTooltip}
            version={1}
          />
        </Box>

        <Box display="flex">
          <Button
            variant="contained"
            color="button"
            onClick={handleClearOCAFile2}
            sx={{ width: 190, mr: 2 }}
            disabled={OCAFile2Raw.length === 0}
          >
            {t("Clear OCA File")}
          </Button>
        </Box>

        <Box sx={{ height: "3rem" }} />

        {showDifference && (
          <MergeDifferenceModal
            file1Name={filePath1.substring(0, filePath1.lastIndexOf("."))}
            file2Name={filePath2.substring(0, filePath2.lastIndexOf("."))}
            setShowCard={setShowDifference}
            dataDifference={createCaptureBaseDifferenceData()}
          />
        )}
      </Box>
    </Box>
  );
};

export default UploadingStart;
