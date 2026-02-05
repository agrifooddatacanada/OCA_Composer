import {
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Typography
} from "@mui/material";
import React, { useContext } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { CustomPalette } from "../constants/customPalette";
import AccordionItemWrapper from "./AccordionItemWrapper";
import Drop from "../StartSchema/Drop";
import { Context } from "../App";
import { useMultiSchema } from "../schema/schemaContext";
import useGenerateReadMe from "../ViewSchema/useGenerateReadMe";
import useHandleAllDrop from "../StartSchema/useHandleAllDrop";
import useGenerateTextReadmeFromJson from "../ViewSchema/useGenerateTextReadmeFromJson";
import { useHandleJsonDrop } from "../OCADataValidator/useHandleJsonDrop";
import useGenerateMarkdownReadMe from "../ViewSchema/useGenerateMarkdownReadMe";
import useGenerateMarkdownReadMeFromJson from "../ViewSchema/useGenerateMarkdownReadMeFromJson";
import useLocalStorage from "../hooks/useLocalStorage";
import { CATALOGUE_INFO_KEY } from "../constants/catalogueInfo";
import InvalidOCAPackageMessage from "./InvalidOCAPackageMessage";
import { hasMultiSchemaStructure } from "../utils/schemaUtils";

const UseASchemaAccordionItem = ({ isInvalidOcaPackage }) => {
  const navigate = useNavigate();
  const { zipToReadme, jsonToReadme } = useContext(Context);
  const { packageUpload } = useMultiSchema();
  const { toTextFile } = useGenerateReadMe();
  const { jsonToTextFile } = useGenerateTextReadmeFromJson();
  const { generateMarkdownReadMe } = useGenerateMarkdownReadMe();
  const { generateMarkdownReadMeFromJson } = useGenerateMarkdownReadMeFromJson();
  const { t } = useTranslation();
  const {
    rawFile,
    setRawFile,
    setLoading,
    loading,
    dropDisabled,
    dropMessage,
    setDropMessage,
    setCurrentPage
  } = useHandleAllDrop();

  const { setJsonRawFile } = useHandleJsonDrop();

  const { getFromLocalStorage } = useLocalStorage(CATALOGUE_INFO_KEY);

  const navigateToEditSchema = () => {
    // Multi-schema: show visualization to let user choose which schema to edit
    // Single schema: go directly to editing
    const targetPage = hasMultiSchemaStructure(packageUpload) ? "View" : "Metadata";
    setCurrentPage(targetPage);
    navigate("/start");
  };

  const navigateToViewPage = () => {
    setCurrentPage("View");
    navigate("/start");
  };

  const setFile = (acceptedFiles) => {
    setRawFile(acceptedFiles);
    setJsonRawFile(acceptedFiles);
  };

  const disableButtonCheck = rawFile.length === 0 || loading === true;
  const disableAdditionalSchemaTools = disableButtonCheck || isInvalidOcaPackage;

  const handleClickMarkdownReadme = () => {
    const jsonSchemaIsUploaded = Object.keys(jsonToReadme).length > 0;
    const catalogueData = getFromLocalStorage();
    if (jsonSchemaIsUploaded) {
      generateMarkdownReadMeFromJson(jsonToReadme, catalogueData);
      return;
    }
    if (zipToReadme.length > 0) {
      generateMarkdownReadMe(zipToReadme, catalogueData);
    }
  };

  const buttonStyles = {
    backgroundColor: CustomPalette.PRIMARY,
    ":hover": { backgroundColor: CustomPalette.SECONDARY },
    width: "100%",
    maxWidth: "300px",
    marginTop: "30px"
  };

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
          {t("Use a Schema")}
        </Typography>
      </AccordionSummary>

      <AccordionDetails sx={{ textAlign: "start" }}>
        <Typography>
          {t("When you have a schema bundle you can upload and then")}
        </Typography>
        {/* <Typography>
          <strong>Validate</strong> the schema to ensure it is well-formed.
        </Typography> */}
        <Typography>
          <strong>{t("View")}</strong> {t("the schema and")} <strong>{t("Edit")}</strong>{" "}
          {t("the schema if needed")}
        </Typography>
        <Typography>
          {t("The schema bundle is machine-readable")} <strong>{t("generate")}</strong>{" "}
          {t("the Readme to create a human-readable simple text version")}
        </Typography>

        <Drop
          setFile={setFile}
          setLoading={setLoading}
          loading={loading}
          dropDisabled={dropDisabled}
          dropMessage={dropMessage}
          setDropMessage={setDropMessage}
          version={1}
          interfaceType={1}
        />

        <Box
          sx={{
            width: "100%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center"
          }}
        >
          {isInvalidOcaPackage && !disableButtonCheck && (
            <Box sx={{ maxWidth: "300px", marginTop: "30px" }}>
              <InvalidOCAPackageMessage textStyles={{ textAlign: "center" }} />
            </Box>
          )}
          <Button
            variant="contained"
            color="navButton"
            onClick={navigateToViewPage}
            sx={buttonStyles}
            disabled={disableAdditionalSchemaTools}
          >
            {t("View Schema")}
          </Button>
          <Button
            variant="contained"
            color="navButton"
            onClick={navigateToEditSchema}
            sx={buttonStyles}
            disabled={disableButtonCheck}
          >
            {t("Edit Schema")}
          </Button>
          <Button
            variant="contained"
            color="navButton"
            onClick={() => {
              if (Object.keys(jsonToReadme).length > 0) {
                // Schema name will be extracted from jsonToReadme automatically
                jsonToTextFile(jsonToReadme, packageUpload);
              } else if (zipToReadme.length > 0) {
                toTextFile(zipToReadme);
              }
            }}
            sx={buttonStyles}
            disabled={disableAdditionalSchemaTools}
          >
            {t("Generate Text Readme")}
          </Button>
          <Button
            variant="contained"
            color="navButton"
            onClick={handleClickMarkdownReadme}
            sx={buttonStyles}
            disabled={disableAdditionalSchemaTools}
          >
            {t("Generate Markdown Readme")}
          </Button>
        </Box>
      </AccordionDetails>
    </AccordionItemWrapper>
  );
};

export default UseASchemaAccordionItem;
