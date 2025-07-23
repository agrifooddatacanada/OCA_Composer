import React, { useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Trans, useTranslation } from "react-i18next";
import i18next from "i18next";
import { Box, Button, Typography, Tooltip } from "@mui/material";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import ArrowBackIosIcon from "@mui/icons-material/ArrowBackIos";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { Context } from "../App";
import { CustomPalette } from "../constants/customPalette";
import SchemaDescription from "./SchemaDescription";
import ViewGrid from "./ViewGrid";
import LinkCard from "./LinkCard";
import useExportLogic from "./useExportLogic";
import Loading from "../components/Loading";
import useExportLogicV2 from "./useExportLogicV2";
import { CUSTOM_FORMAT_RULE } from "../constants/constants";
import { codesToLanguages } from "../constants/isoCodes";
import useGenerateReadMe from "./useGenerateReadMe";
import useGenerateReadMeV2 from "./useGenerateReadMeV2";
import {
  getFormatRuleDescription,
  updatedUnitFramingRowDataForViewSchema
} from "../constants/utils";
import ErrorPopup from "./ErrorPopup";
import CustomRouterLink from "../components/CustomRouterLink";

// const currentEnv = process.env.REACT_APP_ENV;

export default function ViewSchema({
  pageBack,
  isExport = true,
  addClearButton,
  pageForward,
  isPageForward = true,
  isBack = false
}) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const {
    languages,
    attributeRowData,
    lanAttributeRowData,
    isZip,
    isZipEdited,
    setIsZipEdited,
    characterEncodingRowData,
    setCurrentPage,
    history,
    setHistory,
    formatRuleRowData,
    currentUnitFramedRowData,
    dataStandardsRowData,
    zipToReadme,
    jsonToReadme,
    OCAPackage,
    rangeRowData,
    attributeFramingRowData
  } = useContext(Context);
  const languageIndex = languages.findIndex(
    (item) => codesToLanguages?.[i18next.language] === item
  );
  const filteredLanguages = [...languages];
  if (languageIndex !== -1 && languageIndex !== 0) {
    const removedLanguage = filteredLanguages.splice(languageIndex, 1);
    filteredLanguages.unshift(removedLanguage[0]);
  }
  const [currentLanguage, setCurrentLanguage] = useState(filteredLanguages[0]);
  const [displayArray, setDisplayArray] = useState([]);
  const [showLink, setShowLink] = useState(false);
  const { resetToDefaults, exportDisabled } = useExportLogic();
  const { exportData, error: exportError, clearError } = useExportLogicV2();
  const [loading, setLoading] = useState(true);
  const { toTextFile } = useGenerateReadMe();
  const { jsonToTextFile } = useGenerateReadMeV2();

  // Formats language buttons in a way that can handle many languages cleanly
  // Minimizes language for cases where it's too long to fit in button size

  const displayLanguageArray = [];

  for (let i = 0; i < filteredLanguages.length; i += 7) {
    const languageRow = filteredLanguages.slice(i, i + 7).filter(Boolean);
    displayLanguageArray.push(languageRow);
  }

  const createLanguageRow = (languageArray, rowIndex) => {
    const languageRowDisplay = languageArray.map((language, index) => {
      let curveLeftTop = "0";
      let curveRightTop = "0";
      let curveRightBottom = "0";
      let curveLeftBottom = "0";

      if (languages.length > 7) {
        if (rowIndex === 0 && index === 0) {
          curveLeftBottom = "8px";
        }
        if (rowIndex === displayLanguageArray.length - 1 && index === 0) {
          curveLeftTop = "8px";
        }
        if (rowIndex === 0 && index === 6) {
          curveRightBottom = "8px";
        }
        if (
          rowIndex === displayLanguageArray.length - 1 &&
          index === languageArray.length - 1
        ) {
          curveRightTop = "8px";
        }
        if (
          rowIndex === displayLanguageArray.length - 2 &&
          displayLanguageArray[displayLanguageArray.length - 1].length < 7 &&
          index === 6
        ) {
          curveRightTop = "8px";
        }
      } else {
        if (index === 0) {
          curveLeftBottom = "8px";
          curveLeftTop = "8px";
        }
        if (index === languages.length - 1) {
          curveRightBottom = "8px";
          curveRightTop = "8px";
        }
      }

      const borderRadius = `${curveLeftTop} ${curveRightTop} ${curveRightBottom} ${curveLeftBottom}`;

      let minimizedLanguage = language.slice(0, 9);
      if (minimizedLanguage !== language) {
        minimizedLanguage += "...";
      }
      return (
        <Button
          onClick={() => {
            setCurrentLanguage(language);
          }}
          key={language}
          color="button"
          variant="contained"
          sx={{
            backgroundColor:
              currentLanguage === language
                ? CustomPalette.PRIMARY
                : CustomPalette.SECONDARY,
            borderRadius,
            minWidth: languages.length < 5 ? "12rem" : "10rem",
            boxShadow: "none",
            border: `0.5px solid ${CustomPalette.PRIMARY}`
          }}
        >
          <Typography variant="button">{minimizedLanguage}</Typography>
        </Button>
      );
    });
    return languageRowDisplay;
  };

  const languageButtonDisplay = displayLanguageArray.map((languageSegment, index) => (
    <Box key={languageSegment.join(",")}>{createLanguageRow(languageSegment, index)}</Box>
  ));

  // updating attributeRowData to include unit framing data
  const updatedFramedRowData = updatedUnitFramingRowDataForViewSchema(
    attributeRowData,
    currentUnitFramedRowData
  );
  // Creates display array with all captured data
  useEffect(() => {
    const newDisplayArray = [];
    attributeRowData.forEach((item, index) => {
      const dataObject = {};
      const attributeName = item.Attribute;
      const labelObject = {};
      const lanAttributeKeys = Object.keys(lanAttributeRowData);
      lanAttributeKeys.forEach((item) => {
        labelObject[item] = lanAttributeRowData[item].find(
          (i) => i.Attribute === attributeName
        ).Label;
      });

      const descriptionObject = {};
      lanAttributeKeys.forEach((item) => {
        descriptionObject[item] = lanAttributeRowData[item].find(
          (i) => i.Attribute === attributeName
        ).Description;
      });

      const codesObject = {};

      lanAttributeKeys.forEach((item) => {
        const list = lanAttributeRowData[item].find(
          (i) => i.Attribute === attributeName
        ).List;
        if (Array.isArray(list)) {
          codesObject[item] = list.join(" | ");
        } else {
          codesObject[item] = list;
        }
      });

      dataObject.Attribute = attributeName;
      dataObject.Flagged = attributeRowData[index].Flagged;
      dataObject.Unit = attributeRowData[index].Unit;
      dataObject.Type = attributeRowData[index].Type;
      dataObject.Label = labelObject;
      dataObject.Description = descriptionObject;
      dataObject.List = codesObject;

      const attrWithOverlay = characterEncodingRowData.find(
        (row) => row.Attribute === attributeName
      );
      // Contains information about conformance overlay (whether or not the attribute is required)
      if (attrWithOverlay) {
        Object.assign(dataObject, attrWithOverlay);
      }

      const attrWithFormatRule = formatRuleRowData.find(
        (row) => row.Attribute === attributeName
      );
      const formatRule =
        attrWithFormatRule?.[CUSTOM_FORMAT_RULE] || attrWithFormatRule?.FormatText;
      if (formatRule) {
        const attributeType = attrWithFormatRule?.Type;
        const desc = getFormatRuleDescription(attributeType, formatRule);
        if (desc) {
          dataObject["Add format rule for data"] = desc;
        } else {
          dataObject["Add format rule for data"] = formatRule;
        }
      }

      // Add data standard information
      const attrWithDataStandard = dataStandardsRowData.find(
        (row) => row.Attribute === attributeName
      );
      if (attrWithDataStandard?.DataStandard) {
        dataObject["Data Standards"] = attrWithDataStandard.DataStandard;
      }

      // Add unit framing information
      const unitFramingData = updatedFramedRowData.find(
        (row) => row.Attribute === attributeName
      );

      if (unitFramingData) {
        dataObject["Unit Framing"] = unitFramingData["UCUM Code"];
      }

      // Add range overlay information
      const attrWithRange = rangeRowData.find((row) => row.Attribute === attributeName);

      if (attrWithRange) {
        if (Object.prototype.hasOwnProperty.call(attrWithRange, "LowerBound")) {
          dataObject.LowerBound = attrWithRange.LowerBound;
        }

        if (Object.prototype.hasOwnProperty.call(attrWithRange, "LowerInclusive")) {
          dataObject.LowerInclusive = attrWithRange.LowerInclusive;
        }

        if (Object.prototype.hasOwnProperty.call(attrWithRange, "UpperBound")) {
          dataObject.UpperBound = attrWithRange.UpperBound;
        }

        if (Object.prototype.hasOwnProperty.call(attrWithRange, "UpperInclusive")) {
          dataObject.UpperInclusive = attrWithRange.UpperInclusive;
        }
      }

      // Add attribute framing information
      const attrWithAttributeFraming = attributeFramingRowData.find(
        (row) => row.Attribute === attributeName
      );

      if (attrWithAttributeFraming) {
        dataObject["Attribute Framing"] = attrWithAttributeFraming.objectId;
      }

      newDisplayArray.push(dataObject);
    });

    setDisplayArray(newDisplayArray);
  }, [attributeRowData, lanAttributeRowData]);

  const moveBackward = () => {
    if (history.length > 1 && history[history.length - 2] === "Landing") {
      setHistory((prev) => prev.slice(0, prev.length - 1));
      setCurrentPage("Landing");
      navigate("/");
    } else {
      pageBack();
    }
  };

  const downloadReadMe = () => {
    if (Object.keys(jsonToReadme).length > 0) {
      jsonToTextFile(jsonToReadme, OCAPackage);
    } else if (zipToReadme.length > 0) {
      toTextFile(zipToReadme);
    }
  };

  const handleClickDownload = () => {
    // Download OCA package and related files
    exportData();
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        margin: "auto",
        pr: 5,
        pl: 10,
        marginTop: 2
      }}
    >
      {loading && attributeRowData?.length > 40 && <Loading />}

      <Box
        sx={{
          display: "flex",
          justifyContent: isBack || !pageForward ? "space-between" : "flex-end"
        }}
      >
        {isBack && (
          <Button
            color="navButton"
            sx={{
              textAlign: "left",
              alignSelf: "flex-start",
              color: CustomPalette.PRIMARY
            }}
            onClick={pageBack}
          >
            <ArrowBackIosIcon /> {t("Back")}
          </Button>
        )}
        {isPageForward && pageForward ? (
          <Button
            color="navButton"
            onClick={pageForward}
            sx={{ color: CustomPalette.PRIMARY }}
          >
            {t("Next")} <ArrowForwardIosIcon />
          </Button>
        ) : isPageForward ? (
          <>
            <Button
              color="navButton"
              sx={{
                textAlign: "left",
                alignSelf: "flex-start",
                color: CustomPalette.PRIMARY
              }}
              onClick={moveBackward}
            >
              <ArrowBackIosIcon /> {t("Back")}
            </Button>
            <Box sx={{ display: "flex", flexDirection: "row", gap: 3 }}>
              <Box sx={{ display: "flex", flexDirection: "row", gap: 3 }}>
                {isZip && (
                  <>
                    <Button
                      color="button"
                      variant="contained"
                      onClick={() => {
                        setCurrentPage("Metadata");
                        setIsZipEdited(true);
                      }}
                      sx={{
                        alignSelf: "flex-end",
                        display: "flex",
                        justifyContent: "space-around",
                        padding: "0.5rem 1rem"
                      }}
                    >
                      {t("Edit Schema")}
                    </Button>
                    <Button
                      color="button"
                      variant="contained"
                      onClick={downloadReadMe}
                      sx={{
                        alignSelf: "flex-end",
                        display: "flex",
                        justifyContent: "space-around",
                        padding: "0.5rem 1rem"
                      }}
                      disabled={exportDisabled}
                    >
                      {t("Download ReadMe")}
                    </Button>
                  </>
                )}
                {isExport && (!isZip || (isZip && isZipEdited)) ? (
                  <Box>
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        color: CustomPalette.GREY_600
                      }}
                    >
                      <Button
                        color="button"
                        variant="contained"
                        onClick={handleClickDownload}
                        sx={{
                          alignSelf: "flex-end",
                          width: "13rem",
                          display: "flex",
                          justifyContent: "space-around",
                          p: 1
                        }}
                        disabled={exportDisabled}
                      >
                        {t("Finish and Download")} <CheckCircleIcon />
                      </Button>
                      <Box sx={{ marginLeft: "1rem" }}>
                        <Tooltip
                          title={t(
                            "Export your schema in a .json machine-readable version and..."
                          )}
                          placement="left"
                          arrow
                        >
                          <HelpOutlineIcon sx={{ fontSize: 15 }} />
                        </Tooltip>
                      </Box>
                    </Box>
                  </Box>
                ) : (
                  <></>
                )}
              </Box>
            </Box>
          </>
        ) : (
          <></>
        )}
      </Box>
      {showLink && <LinkCard setShowLink={setShowLink} />}
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          margin: "2rem 2rem 4rem 2rem"
        }}
      >
        <Box
          sx={{
            display: "flex",
            width: "100%"
          }}
        >
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-start",
              width: "100%"
            }}
          >
            <Box
              sx={{
                display: "flex",
                alignItems: "center"
              }}
            >
              <Typography
                sx={{
                  fontSize: 22,
                  fontWeight: "bold",
                  color: CustomPalette.PRIMARY
                }}
              >
                {t("Schema Language")}
              </Typography>
              <Box sx={{ marginLeft: "1rem", color: CustomPalette.GREY_600 }}>
                <Tooltip
                  title={t(
                    "Toggles between the one or more languages used in the schema"
                  )}
                  placement="right"
                  arrow
                >
                  <HelpOutlineIcon sx={{ fontSize: 15 }} />
                </Tooltip>
              </Box>
            </Box>
            <Box sx={{ mb: 4, width: "70rem" }}>
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column-reverse",
                  alignItems: "flex-start"
                }}
              >
                {languageButtonDisplay}
              </Box>
            </Box>
          </Box>
          {isPageForward && isExport && (
            <Box
              sx={{
                padding: 2,
                border: "1px solid #ccc",
                borderRadius: "4px",
                backgroundColor: "#f9f9f9",
                width: "300px",
                textAlign: "left",
                position: "absolute",
                right: 0,
                marginRight: "4rem"
              }}
            >
              <Typography
                sx={{
                  fontSize: 16,
                  color: "#333"
                }}
              >
                {t("Note: Downloading two files")}
              </Typography>
              <Typography
                sx={{
                  fontSize: 14,
                  marginTop: 1
                }}
              >
                {t("1) Schema in .txt format, readable and archivable.")}
              </Typography>
              <Typography
                sx={{
                  fontSize: 14,
                  marginTop: 1
                }}
              >
                {t(
                  "2) Schema in .json format. Can be used by computers including tools on the Semantic Engine."
                )}
              </Typography>
            </Box>
          )}
        </Box>
        {/* <Typography
          sx={{
            fontSize: 28,
            fontWeight: "bold",
            color: CustomPalette.PRIMARY,
            mb: 2,
            wordWrap: "break-word",
            textAlign: "left",
            maxWidth: "35rem",
          }}
        >
          {currentLanguage.replace(/\b\w/g, (match) => match.toUpperCase())}
        </Typography> */}

        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            marginTop: 2
          }}
        >
          <Typography
            sx={{
              fontSize: 22,
              fontWeight: "bold",
              color: CustomPalette.PRIMARY
            }}
          >
            {t("Schema Metadata")}
          </Typography>
          <Box sx={{ marginLeft: "1rem", color: CustomPalette.GREY_600 }}>
            <Tooltip
              title={t(
                "Language specific information describing general schema information"
              )}
              placement="right"
              arrow
            >
              <HelpOutlineIcon sx={{ fontSize: 15 }} />
            </Tooltip>
          </Box>
        </Box>
        <SchemaDescription currentLanguage={currentLanguage} />

        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            marginTop: 4,
            marginBottom: 2
          }}
        >
          <Typography
            sx={{
              fontSize: 22,
              fontWeight: "bold",
              color: CustomPalette.PRIMARY
            }}
          >
            {t("Schema Details")}
          </Typography>
          <Box sx={{ marginLeft: "1rem", color: CustomPalette.GREY_600 }}>
            <Tooltip
              title={t(
                "The details of the schema including attribute names and their features as well as language specific information"
              )}
              placement="right"
              arrow
            >
              <HelpOutlineIcon sx={{ fontSize: 15 }} />
            </Tooltip>
          </Box>
        </Box>
        <ViewGrid
          displayArray={displayArray}
          currentLanguage={currentLanguage}
          setLoading={setLoading}
        />
      </Box>
      {isPageForward && isExport && (!isZip || (isZip && isZipEdited)) ? (
        <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
          <Box>
            <Button
              color="button"
              variant="contained"
              onClick={handleClickDownload}
              sx={{
                width: "13rem",
                display: "flex",
                justifyContent: "space-around",
                p: 1
              }}
              disabled={exportDisabled}
            >
              {t("Finish and Download")} <CheckCircleIcon />
            </Button>
          </Box>
        </Box>
      ) : (
        <></>
      )}
      {addClearButton && (
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-end",
            marginTop: "2rem"
          }}
        >
          <Button
            color="warning"
            variant="outlined"
            onClick={resetToDefaults}
            sx={{
              alignSelf: "flex-end",
              width: "20rem",
              display: "flex",
              justifyContent: "space-around",
              p: 1,
              mb: 5
            }}
          >
            {t("Clear All Data and Restart")}
          </Button>
        </Box>
      )}
      {exportError && (
        <ErrorPopup onClose={clearError}>
          <Typography variant="h5" sx={{ p: 1 }}>
            <Trans
              i18nKey="SchemaExportError"
              components={[
                <CustomRouterLink
                  to="mailto:adc@uoguelph.ca"
                  text="adc@uoguelph.ca"
                  overrideStyle={{ fontWeight: "500", color: CustomPalette.PRIMARY }}
                />
              ]}
            />
          </Typography>
        </ErrorPopup>
      )}
    </Box>
  );
}
