import React, { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Box, Button, Typography, useMediaQuery } from "@mui/material";
import { VerifyOcaPackage } from "oca_package";
import UseASchemaAccordionItem from "./UseASchemaAccordionItem";
import UseASchemaWithDataAccordionItem from "./UseASchemaWithDataAccordionItem";
import SchemaAccordionItem from "./SchemaAccordionItem";
import WriteASchemaAccordionItem from "./WriteASchemaAccordionItem";
import StoreASchemaAccordionItem from "./StoreASchemaAccordionItem";
import CustomAnchorLink from "../components/CustomAnchorLink";
import CustomPalette from "../constants/customPalette";
import Drop from "../StartSchema/Drop";
import useHandleAllDrop from "../StartSchema/useHandleAllDrop";
import useGenerateReadMe from "../ViewSchema/useGenerateReadMe";
import { Context } from "../App";
import useExportLogic from "../ViewSchema/useExportLogic";
import useGenerateReadMeV2 from "../ViewSchema/useGenerateReadMeV2";
import GenerateDataEntryExcel from "./GenerateDataEntryExcel";
import CollaborateOnASchema from "./CollaborateOnASchema";
import { useHandleJsonDrop } from "../OCADataValidator/useHandleJsonDrop";
import useGenerateMarkdownReadMe from "../ViewSchema/useGenerateMarkdownReadMe";
import useGenerateMarkdownReadMeFromJson from "../ViewSchema/useGenerateMarkdownReadMeFromJson";
import CatalogueInfo from "../CatalogueInfo/CatalogueInfo";
import useLocalStorage from "../hooks/useLocalStorage";
import { CATALOGUE_INFO_KEY } from "../constants/catalogueInfo";
import InvalidOCAPackageMessage from "./InvalidOCAPackageMessage";

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
  const { zipToReadme, jsonToReadme, setCurrentDataValidatorPage, OCAPackage } =
    useContext(Context);
  const { toTextFile } = useGenerateReadMe();
  const { jsonToTextFile } = useGenerateReadMeV2();
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

  const { setJsonRawFile } = useHandleJsonDrop();
  const { resetToDefaults } = useExportLogic();
  const { getFromLocalStorage } = useLocalStorage(CATALOGUE_INFO_KEY);

  const navigateToStartPage = () => {
    resetToDefaults();
    setCurrentPage("Start");
    navigate("/start");
  };

  const navigateToMetadataPage = () => {
    setIsZip(false);
    setCurrentPage("Metadata");
    navigate("/start");
  };

  const navigateToViewPage = () => {
    // Always go to the View step in the editor instead of separate page
    // Keep the separate page code commented out in case we change our mind later
    /*
    // Navigate to visualization if we have any file uploaded
    if (rawFile && rawFile.length > 0) {
      // Pass the file object so the visualization page can read it
      navigate("/schema-visualization", { state: { rawFile: rawFile[0] } });
    } else {
      setIsZip(true);
      setCurrentPage("View");
      navigate("/start");
    }
    */

    // Go directly to View step in editor
    setIsZip(true);
    setCurrentPage("View");
    navigate("/start");
  };

  const navigateToPreviewSchema = () => {
    setIsZip(true);
    setCurrentDataValidatorPage("SchemaViewDataValidator");
    navigate("/oca-data-verifier");
  };

  const setFile = (acceptedFiles) => {
    setRawFile(acceptedFiles);
    setJsonRawFile(acceptedFiles);
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
  let isInvalidOcaPackage = false;

  if (OCAPackage) {
    // Only verify if this is actually an OCA package with proper structure
    const hasOcaStructure = OCAPackage.bundle || OCAPackage.oca_bundle;
    const digest = OCAPackage.d || OCAPackage?.bundle?.d || OCAPackage?.oca_bundle?.d;

    if (hasOcaStructure && digest) {
      try {
        isInvalidOcaPackage = !VerifyOcaPackage(OCAPackage, digest);
      } catch (e) {
        isInvalidOcaPackage = false; // Don't block UI on verification errors
      }
    } else {
      // Not a verifiable OCA package, treat as valid
      isInvalidOcaPackage = false;
    }
  }
  const disableAdditionalSchemaTools = disableButtonCheck || isInvalidOcaPackage;

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
          <UseASchemaAccordionItem isInvalidOcaPackage={isInvalidOcaPackage} />
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
              onClick={navigateToMetadataPage}
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
                  jsonToTextFile(jsonToReadme, OCAPackage);
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
              <CatalogueInfo isDisabled={disableAdditionalSchemaTools} />
              <Button
                variant="contained"
                color="navButton"
                onClick={handleClickMarkdownReadme}
                sx={{ ...buttonStyles, marginTop: "12px" }}
                disabled={disableAdditionalSchemaTools}
              >
                {t("Generate Markdown Readme")}
              </Button>
            </Box>
            <GenerateDataEntryExcel
              rawFile={rawFile}
              setLoading={setLoading}
              disableButtonCheck={disableAdditionalSchemaTools}
            />
            <Button
              variant="contained"
              color="navButton"
              onClick={navigateToPreviewSchema}
              sx={{
                ...buttonStyles,
                marginBottom: "30px"
              }}
              disabled={disableAdditionalSchemaTools}
            >
              {t("Enter/Verify Data in Webpage")}
            </Button>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default AccordionList;
