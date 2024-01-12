import React, { useContext, useState, useEffect } from "react";
import { Context } from "../App";
import { Box } from "@mui/system";
import { Button, Typography, Tooltip } from "@mui/material";
import { CustomPalette } from "../constants/customPalette";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";

import SchemaDescription from "./SchemaDescription";
import ViewGrid from "./ViewGrid";
import ArrowBackIosIcon from "@mui/icons-material/ArrowBackIos";
import LinkCard from "./LinkCard";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import useExportLogic from "./useExportLogic";
import { useNavigate } from "react-router-dom";
import DepreciatedWarningCard from "../Landing/DepreciatedWarningCard";

export default function ViewSchema({ pageBack }) {
  const navigate = useNavigate();
  const { languages, attributeRowData, lanAttributeRowData, isZip, isZipEdited, setIsZipEdited, characterEncodingRowData, setCurrentPage, history, setHistory, formatRuleRowData, showDeprecationCard } = useContext(Context);

  const [currentLanguage, setCurrentLanguage] = useState(languages[0]);
  const [displayArray, setDisplayArray] = useState([]);
  const [showLink, setShowLink] = useState(false);
  const { handleExport, resetToDefaults, exportDisabled } = useExportLogic();

  //Formats language buttons in a way that can handle many languages cleanly
  //Minimizes language for cases where it's too long to fit in button size

  const displayLanguageArray = [];

  for (let i = 0; i < languages.length; i += 7) {
    const languageRow = languages.slice(i, i + 7).filter(Boolean);
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

      const borderRadius =
        curveLeftTop +
        " " +
        curveRightTop +
        " " +
        curveRightBottom +
        " " +
        curveLeftBottom;

      let minimizedLanguage = language.slice(0, 9);
      if (minimizedLanguage !== language) {
        minimizedLanguage = minimizedLanguage + "...";
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
            border: `0.5px solid ${CustomPalette.PRIMARY}`,
          }}
        >
          <Typography variant="button">{minimizedLanguage}</Typography>
        </Button>
      );
    });
    return languageRowDisplay;
  };

  const languageButtonDisplay = displayLanguageArray.map(
    (languageSegment, index) => {
      return <Box key={index}>{createLanguageRow(languageSegment, index)}</Box>;
    }
  );

  //Creates display array with all captured data

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

      const attrWithOverlay = characterEncodingRowData.find((row) => row.Attribute === attributeName);
      if (attrWithOverlay) {
        Object.assign(dataObject, attrWithOverlay);
      }

      const attrWithFormatRule = formatRuleRowData.find((row) => row.Attribute === attributeName);
      if (attrWithFormatRule?.['FormatText'] && attrWithFormatRule['FormatText'] !== '') {
        dataObject['Add format rule for data'] = attrWithFormatRule['FormatText'];
      }

      newDisplayArray.push(dataObject);
    });
    setDisplayArray(newDisplayArray);
  }, [attributeRowData, lanAttributeRowData]);

  const moveBackward = () => {
    if (history.length > 1 && history[history.length - 2] === "Landing") {
      setHistory(prev => prev.slice(0, prev.length - 1));
      setCurrentPage('Landing');
      navigate('/');
    } else {
      pageBack();
    }
  };

  return (
    <Box>
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          margin: "auto",
          pr: 5,
          pl: 10,
          marginTop: 2,
        }}
      >
        <Box sx={{
          display: "flex",
          justifyContent: "space-between",
        }}>
          <Button
            color="navButton"
            sx={{ textAlign: "left", alignSelf: "flex-start", color: CustomPalette.PRIMARY }}
            onClick={moveBackward}
          >
            <ArrowBackIosIcon /> Back
          </Button>
          <Box sx={{ display: 'flex', flexDirection: 'row', gap: 3 }}>
            <Box sx={{ display: 'flex', flexDirection: 'row', gap: 3 }}>
              {isZip && (
                <>
                  <Button
                    color="button"
                    variant='contained'
                    onClick={() => {
                      setCurrentPage("Metadata");
                      setIsZipEdited(true);
                    }}
                    sx={{
                      alignSelf: "flex-end",
                      display: "flex",
                      justifyContent: "space-around",
                      padding: "0.5rem 1rem",
                    }}
                  >
                    Edit Schema
                  </Button>
                  <Button
                    color="button"
                    variant='contained'
                    onClick={() => handleExport(true)}
                    sx={{
                      alignSelf: "flex-end",
                      display: "flex",
                      justifyContent: "space-around",
                      padding: "0.5rem 1rem",
                    }}
                    disabled={exportDisabled}
                  >
                    Download ReadMe
                  </Button>
                </>
              )}
              {!isZip || (isZip && isZipEdited) ? (
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    color: CustomPalette.GREY_600,
                  }}
                >
                  <Button
                    color="button"
                    variant="contained"
                    onClick={() => handleExport(false)}
                    sx={{
                      alignSelf: "flex-end",
                      width: "12rem",
                      display: "flex",
                      justifyContent: "space-around",
                      p: 1,
                    }}
                    disabled={exportDisabled}
                  >
                    Finish and Export <CheckCircleIcon />
                  </Button>
                  <Box sx={{ marginLeft: "1rem" }}>
                    <Tooltip
                      title="Export your schema in a .json machine-readable version and a txt human-readable format using all the information that has been provided here."
                      placement="left"
                      arrow
                    >
                      <HelpOutlineIcon sx={{ fontSize: 15 }} />
                    </Tooltip>
                  </Box>
                </Box>
              ) :
                <></>
              }
            </Box>

          </Box>

        </Box>
        {showLink && <LinkCard setShowLink={setShowLink} />}
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
            margin: "2rem 2rem 4rem 2rem",
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
            }}
          >
            <Typography
              sx={{
                fontSize: 22,
                fontWeight: "bold",
                color: CustomPalette.PRIMARY,
              }}
            >
              Schema Language
            </Typography>
            <Box sx={{ marginLeft: "1rem", color: CustomPalette.GREY_600 }}>
              <Tooltip
                title="Toggles between the one or more languages used in the schema."
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
                alignItems: "flex-start",
              }}
            >
              {languageButtonDisplay}
            </Box>
          </Box>
          <Typography
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
          </Typography>

          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              marginTop: 2,
            }}
          >
            <Typography
              sx={{
                fontSize: 22,
                fontWeight: "bold",
                color: CustomPalette.PRIMARY,
              }}
            >
              Schema Metadata
            </Typography>
            <Box sx={{ marginLeft: "1rem", color: CustomPalette.GREY_600 }}>
              <Tooltip
                title="Language specific information describing general schema information."
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
              marginBottom: 2,
            }}
          >
            <Typography
              sx={{
                fontSize: 22,
                fontWeight: "bold",
                color: CustomPalette.PRIMARY,
              }}
            >
              Schema Details
            </Typography>
            <Box sx={{ marginLeft: "1rem", color: CustomPalette.GREY_600 }}>
              <Tooltip
                title="The details of the schema including attribute names and their features as well as language specific information."
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
          />
        </Box>
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-end",
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
              mb: 5,
            }}
          >
            Clear All Data and Restart
          </Button>
        </Box>
        {showDeprecationCard && isZip && <DepreciatedWarningCard />}
      </Box>
    </Box >
  );
}
