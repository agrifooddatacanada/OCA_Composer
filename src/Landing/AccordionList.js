import { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Box, Button, Typography, useMediaQuery, Tooltip } from "@mui/material";
import {
  isOcaPackageIntegrityValid,
  shouldVerifyOcaPackageCryptographically
} from "../utils/verifyOcaIntegrity";
import UseASchemaAccordionItem from "./UseASchemaAccordionItem";
import UseASchemaWithDataAccordionItem from "./UseASchemaWithDataAccordionItem";
import SchemaAccordionItem from "./SchemaAccordionItem";
import WriteASchemaAccordionItem from "./WriteASchemaAccordionItem";
import StoreASchemaAccordionItem from "./StoreASchemaAccordionItem";
import CustomAnchorLink from "../components/CustomAnchorLink";
import { CustomPalette } from "../constants/customPalette";
import Drop from "../StartSchema/Drop";
import useHandleAllDrop from "../StartSchema/useHandleAllDrop";
import useGenerateReadMe from "../ViewSchema/useGenerateReadMe";
import { Context } from "../App";
import { useMultiSchema } from "../schema/schemaContext";
import useOCAExport from "../hooks/useOCAExport";
import useGenerateTextReadmeFromJson from "../ViewSchema/useGenerateTextReadmeFromJson";
import GenerateDataEntryExcel from "./GenerateDataEntryExcel";
import CollaborateOnASchema from "./CollaborateOnASchema";
import { useHandleSchemaFileDrop } from "../OCADataValidator/useHandleSchemaFileDrop";
import useGenerateMarkdownReadMe from "../ViewSchema/useGenerateMarkdownReadMe";
import useGenerateMarkdownReadMeFromJson from "../ViewSchema/useGenerateMarkdownReadMeFromJson";
import CatalogueInfo from "../CatalogueInfo/CatalogueInfo";
import useLocalStorage from "../hooks/useLocalStorage";
import { CATALOGUE_INFO_KEY } from "../constants/catalogueInfo";
import InvalidOCAPackageMessage from "./InvalidOCAPackageMessage";
import { hasMultipleSchemas } from "../utils/schemaUtils";
import { syncLandingSchemaDrop } from "../utils/landingSchemaUpload";

const buttonStyles = {
  backgroundColor: CustomPalette.PRIMARY,
  ":hover": { backgroundColor: CustomPalette.SECONDARY },
  width: "100%",
  maxWidth: "300px",
  marginTop: "30px"
};

const AccordionList = () => {
  const isMobile = useMediaQuery("(max-width: 736px)");
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { zipToReadme, jsonToReadme, setCurrentDataValidatorPage, schemaDescription } =
    useContext(Context);
  const { pkgOCA } = useMultiSchema();
  const { toTextFile } = useGenerateReadMe();
  const { jsonToTextFile } = useGenerateTextReadmeFromJson();
  const { generateMarkdownReadMe } = useGenerateMarkdownReadMe();
  const { generateMarkdownReadMeFromJson } = useGenerateMarkdownReadMeFromJson();
  const {
    rawFile,
    setRawFile,
    setLoading,
    loading,
    dropDisabled,
    dropMessage,
    setDropMessage,
    setCurrentPage,
    setIsZip
  } = useHandleAllDrop();

  const { setSchemaRawFile } = useHandleSchemaFileDrop();
  const { resetToDefaults } = useOCAExport();
  const { getFromLocalStorage } = useLocalStorage(CATALOGUE_INFO_KEY);

  const navigateToStartPage = () => {
    resetToDefaults();
    setCurrentPage("Start");
    navigate("/start");
    window.scrollTo(0, 0);
  };

  const navigateToEditSchema = () => {
    setIsZip(false);
    // Always go to Schema Metadata page for editing
    setCurrentPage("Metadata");
    navigate("/start");
  };

  const navigateToViewPage = () => {
    setIsZip(true);
    navigate("/start", { state: { openView: true } });
  };

  const navigateToPreviewSchema = () => {
    setIsZip(true);
    setCurrentDataValidatorPage("SchemaViewDataValidator");
    navigate("/oca-data-verifier");
  };

  const setFile = (acceptedFiles) => {
    syncLandingSchemaDrop(setRawFile, setSchemaRawFile, acceptedFiles);
  };

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

  const disableButtonCheck = rawFile.length === 0 || loading === true;
  const isMultiSchema = hasMultipleSchemas(pkgOCA);
  let isInvalidOcaPackage = false;

  if (pkgOCA && shouldVerifyOcaPackageCryptographically(pkgOCA)) {
    isInvalidOcaPackage = !isOcaPackageIntegrityValid(pkgOCA);
  }
  const disableAdditionalSchemaTools = disableButtonCheck || isInvalidOcaPackage;
  const disableMultiSchemaTools = disableAdditionalSchemaTools || isMultiSchema;

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 8,
        marginRight: 1,
        marginLeft: 1,
        marginBottom: 10
      }}
    >
      <Box
        sx={{
          display: "flex",
          flexDirection: "row",
          flexWrap: "wrap",
          justifyContent: "center"
        }}
      >
        {/* Accordion Items (Position may change based on screen size) */}
        <Box
          sx={{
            flex: "1",
            maxWidth: isMobile ? "unset" : "500px",
            minWidth: isMobile ? "unset" : "300px",
            width: "100%"
          }}
        >
          <SchemaAccordionItem />
          <WriteASchemaAccordionItem navigateToStartPage={navigateToStartPage} />
          <CollaborateOnASchema navigateToStartPage={navigateToStartPage} />
          <StoreASchemaAccordionItem />
          <UseASchemaAccordionItem />
          <UseASchemaWithDataAccordionItem isInvalidOcaPackage={isInvalidOcaPackage} />
          {/* <OCADataValidatorItem /> */}
        </Box>
        <Box
          sx={{
            flex: "1",
            backgroundColor: "#ffefea",
            width: "100%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-start",
            marginTop: 5,
            marginRight: isMobile ? "unset" : 10,
            marginLeft: isMobile ? "unset" : 10,
            height: "fit-content"
          }}
        >
          <Typography
            sx={{
              fontSize: "23px",
              fontWeight: "400",
              textAlign: "center",
              width: "100%",
              marginTop: 2
            }}
          >
            {t("Quick Links")}
          </Typography>
          <CustomAnchorLink
            text={t("Write a Schema")}
            overrideStyle={{
              fontSize: "20px",
              fontWeight: "500",
              color: CustomPalette.PRIMARY,
              marginLeft: 0,
              marginTop: 2
            }}
            onClick={navigateToStartPage}
          />
          <hr
            style={{
              width: "90%",
              margin: "auto",
              marginTop: "25px",
              border: `1px solid ${CustomPalette.PRIMARY}`
            }}
          />
          {/* <CustomAnchorLink
            link='https://www.semanticengine.org/#/develop'
            text='Parse a schema'
            overrideStyle={{
              fontSize: '20px',
              fontWeight: '500',
              color: CustomPalette.PRIMARY,
              marginLeft: 0,
              marginTop: 2,
            }}
          /> */}
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
                <InvalidOCAPackageMessage />
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
                  jsonToTextFile(jsonToReadme, pkgOCA, schemaDescription);
                } else if (zipToReadme.length > 0) {
                  toTextFile(zipToReadme);
                }
              }}
              sx={buttonStyles}
              disabled={disableAdditionalSchemaTools}
            >
              {t("Generate Text Readme")}
            </Button>
            <Box
              sx={{
                padding: "12px",
                marginTop: "30px",
                width: "100%",
                maxWidth: "276px",
                borderRadius: "4px",
                border: `1px solid ${CustomPalette.PRIMARY}`
              }}
            >
              <CatalogueInfo isDisabled={disableMultiSchemaTools} />
              <Button
                variant="contained"
                color="navButton"
                onClick={handleClickMarkdownReadme}
                sx={{ ...buttonStyles, marginTop: "12px" }}
                disabled={disableMultiSchemaTools}
              >
                {t("Generate Markdown Readme")}
              </Button>
            </Box>
            <GenerateDataEntryExcel
              rawFile={rawFile}
              setLoading={setLoading}
              disableButtonCheck={disableMultiSchemaTools}
              isMultiSchema={isMultiSchema}
            />
            <Tooltip
              title={isMultiSchema ? t("Not available for multi-level schemas") : ""}
              arrow
            >
              <span style={{ width: "100%", maxWidth: "300px", display: "inline-block", marginTop: "30px", marginBottom: "30px" }}>
                <Button
                  variant="contained"
                  color="navButton"
                  onClick={navigateToPreviewSchema}
                  sx={{
                    backgroundColor: CustomPalette.PRIMARY,
                    ":hover": { backgroundColor: CustomPalette.SECONDARY },
                    width: "100%"
                  }}
                  disabled={disableMultiSchemaTools}
                >
                  {t("Enter/Verify Data in Webpage")}
                </Button>
              </span>
            </Tooltip>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default AccordionList;
