import {
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Typography,
  Tooltip
} from "@mui/material";
import React, { useContext } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { CustomPalette } from "../constants/customPalette";
import AccordionItemWrapper from "./AccordionItemWrapper";
import CustomAnchorLink from "../components/CustomAnchorLink";
import Drop from "../StartSchema/Drop";
import GenerateDataEntryExcel from "./GenerateDataEntryExcel";
import { useHandleJsonDrop } from "../OCADataValidator/useHandleJsonDrop";
import { Context } from "../App";
import { useMultiSchema } from "../schema/schemaContext";
import useHandleAllDrop from "../StartSchema/useHandleAllDrop";
import InvalidOCAPackageMessage from "./InvalidOCAPackageMessage";
import { hasMultipleSchemas } from "../utils/schemaUtils";
import { syncLandingSchemaDrop } from "../utils/landingSchemaUpload";

const UseASchemaWithDataAccordionItem = ({ isInvalidOcaPackage }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { setCurrentDataValidatorPage } = useContext(Context);
  const { pkgUpload } = useMultiSchema();
  const isMultiSchema = hasMultipleSchemas(pkgUpload);
  const {
    jsonRawFile,
    setJsonRawFile,
    jsonLoading,
    overallLoading,
    jsonDropDisabled,
    jsonDropMessage,
    setJsonDropMessage,
    setJsonLoading
  } = useHandleJsonDrop();

  const handleMoveToPreviewSchema = () => {
    navigate("/oca-data-verifier");
    setCurrentDataValidatorPage("SchemaViewDataValidator");
  };

  const { setRawFile, rawFile, loading: startLoading } = useHandleAllDrop();

  const setFile = (acceptedFiles) => {
    syncLandingSchemaDrop(setRawFile, setJsonRawFile, acceptedFiles);
  };

  const disableButtonCheck =
    (rawFile.length === 0 && jsonRawFile.length === 0) ||
    jsonLoading ||
    startLoading;
  const disableAdditionalSchemaTools = disableButtonCheck || isInvalidOcaPackage;

  return (
    <AccordionItemWrapper>
      <AccordionSummary
        expandIcon={
          <ExpandMoreIcon sx={{ color: CustomPalette.PRIMARY, fontSize: 50 }} />
        }
        aria-controls="panel1a-content"
        id="panel1a-header"
      >
        <Typography sx={{ fontSize: "20px", fontWeight: "500" }}>
          {t("Use a Schema with Data")}
        </Typography>
      </AccordionSummary>

      <AccordionDetails sx={{ textAlign: "start" }}>
        <Typography>
          {t("Use your machine-readable schema bundle to help you collect...")}
        </Typography>

        <Drop
          setFile={setFile}
          setLoading={overallLoading}
          loading={jsonLoading || startLoading}
          dropDisabled={jsonDropDisabled}
          dropMessage={jsonDropMessage}
          setDropMessage={setJsonDropMessage}
          version={1}
          interfaceType={1}
        />

        <Box
          sx={{
            width: "100%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            marginTop: 2
          }}
        >
          {isInvalidOcaPackage && !disableButtonCheck && (
            <Box sx={{ maxWidth: "300px", marginTop: "30px" }}>
              <InvalidOCAPackageMessage textStyles={{ textAlign: "center" }} />
            </Box>
          )}
          <GenerateDataEntryExcel
            rawFile={rawFile.length > 0 ? rawFile : jsonRawFile}
            setLoading={setJsonLoading}
            disableButtonCheck={disableAdditionalSchemaTools || isMultiSchema}
            isMultiSchema={isMultiSchema}
          />
          <Tooltip
            title={isMultiSchema ? t("Not available for multi-level schemas") : ""}
            arrow
          >
            <span style={{ width: "100%", maxWidth: "300px", display: "inline-block", marginTop: "20px", marginBottom: "20px" }}>
              <Button
                variant="contained"
                color="navButton"
                onClick={handleMoveToPreviewSchema}
                sx={{
                  backgroundColor: CustomPalette.PRIMARY,
                  ":hover": { backgroundColor: CustomPalette.SECONDARY },
                  width: "100%"
                }}
                disabled={disableAdditionalSchemaTools || isMultiSchema}
              >
                {t("Enter/Verify Data in Webpage")}
              </Button>
            </span>
          </Tooltip>
        </Box>

        <div
          style={{
            marginTop: "20px",
            borderBottom: "3px solid #94002a"
          }}
        />

        <Typography variant="h6" sx={{ marginTop: "20px", color: CustomPalette.PRIMARY }}>
          {t("Verify data in your python code")}
        </Typography>
        <Typography>
          {t("Visit our")}{" "}
          <CustomAnchorLink
            link="https://github.com/agrifooddatacanada/OCA_data_set_validator"
            text={t("GitHub repository")}
          />{" "}
          {t(
            "to find a python package that you can use to include data verification in your workflow"
          )}
        </Typography>
      </AccordionDetails>
    </AccordionItemWrapper>
  );
};

export default UseASchemaWithDataAccordionItem;
