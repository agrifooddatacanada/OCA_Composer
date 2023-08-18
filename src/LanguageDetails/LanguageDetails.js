import React, { useRef, useContext, useState, useEffect } from "react";
import { Context } from "../App";
import { Box } from "@mui/system";
import { Button, Tooltip, Typography } from "@mui/material";
import LanGrid from "./LanGrid";
import { CustomPalette } from "../constants/customPalette";
import { removeSpacesFromArrayOfObjects } from "../constants/removeSpaces";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import BackNextSkeleton from "../components/BackNextSkeleton";

export default function LanguageDetails({ pageBack, pageForward }) {
  const {
    languages,
    lanAttributeRowData,
    setLanAttributeRowData,
    attributesWithLists,
    setCurrentPage,
  } = useContext(Context);

  const [currentLanguage, setCurrentLanguage] = useState(languages[0]);

  const gridRef = useRef();
  const refContainer = useRef();
  const entryCodesRef = useRef();

  // Stops grid editing when clicking outside grid
  useEffect(() => {
    const handleClickOutsideGrid = (event) => {
      if (gridRef.current.api && refContainer.current && !refContainer.current.contains(event.target)) {
        gridRef.current.api.stopEditing();
      }
    };

    document.addEventListener("click", handleClickOutsideGrid);

    return () => {
      document.removeEventListener("click", handleClickOutsideGrid);
    };
  }, [gridRef, refContainer]);

  const handleSave = () => {
    entryCodesRef.current = false;
    gridRef.current.api.stopEditing();
    const newLanAttributeRowData = JSON.parse(
      JSON.stringify(lanAttributeRowData)
    );
    const noSpacesObject = {};
    languages.forEach((language) => {
      noSpacesObject[language] = removeSpacesFromArrayOfObjects(
        newLanAttributeRowData[language]
      );
    });
    setLanAttributeRowData(noSpacesObject);
    if (attributesWithLists.length > 0) {
      entryCodesRef.current = true;
    }
  };

  const handlePageBack = () => {
    handleSave();
    entryCodesRef.current ? setCurrentPage("Codes") : pageBack();
  };

  const pageForwardSave = () => {
    handleSave();
    pageForward();
  };

  //Formats language button display in a way that is displayed cleanly

  const displayLanguageArray = [];

  for (let i = 0; i < languages.length; i += 6) {
    const languageRow = languages.slice(i, i + 6).filter(Boolean);
    displayLanguageArray.push(languageRow);
  }

  const createLanguageRow = (languageArray, rowIndex) => {
    const languageRowDisplay = languageArray.map((language, index) => {
      let isFirstButton;
      if (languages.length > 6) {
        if (
          displayLanguageArray[rowIndex + 1] &&
          displayLanguageArray[rowIndex + 1].length === 6
        ) {
          isFirstButton =
            language ===
            displayLanguageArray[displayLanguageArray.length - 1][0];
        } else {
          isFirstButton = index === 0;
        }
      } else {
        isFirstButton = index === 0;
      }
      const isLastButton = language === languages[languages.length - 1];

      let borderRadius = "";

      if (isFirstButton && isLastButton) {
        borderRadius = "8px 8px 0 0";
      } else if (isFirstButton) {
        borderRadius = "8px 0 0 0";
      } else if (isLastButton) {
        borderRadius = "0 8px 0 0";
      } else {
        borderRadius = "0";
      }
      return (
        <Button
          key={language}
          onClick={() => {
            handleSave();
            setCurrentLanguage(language);
          }}
          color="button"
          variant="contained"
          sx={{
            backgroundColor:
              currentLanguage === language
                ? CustomPalette.PRIMARY
                : CustomPalette.SECONDARY,
            borderRadius,
            width: languages.length < 5 ? "12rem" : "8.335rem",
            boxShadow: "none",
            border: `0.5px solid ${CustomPalette.PRIMARY}`,
          }}
        >
          <Typography noWrap={true} variant="button">
            {language}
          </Typography>
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

  return (
    <BackNextSkeleton isBack pageBack={handlePageBack} isForward pageForward={pageForwardSave}>
      <Box
        sx={{
          margin: "2rem",
        }}
      >
        <Box
          sx={{
            display: "flex",
            flexDirection: "column-reverse",
            alignItems: languages.length < 6 ? "flex-start" : "flex-end",
          }}
        >
          {languageButtonDisplay}
        </Box>
        <Box
          sx={{
            textAlign: "left",
            transform: "translate(-25px, -25px)",
            color: CustomPalette.GREY_600,
            height: "0rem",
          }}
        >
          <Tooltip
            title="Toggles between the one or more languages used in the schema."
            placement="left"
            arrow
            PopperProps={{
              sx: {
                "& .MuiTooltip-tooltip": {
                  width: 100,
                },
              },
            }}
          >
            <HelpOutlineIcon sx={{ fontSize: 15 }} />
          </Tooltip>
        </Box>
        <div ref={refContainer}>
          <LanGrid gridRef={gridRef} currentLanguage={currentLanguage} />
        </div>
      </Box>
    </BackNextSkeleton>
  );
}
