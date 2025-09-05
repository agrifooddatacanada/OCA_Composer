import React, { useRef, useContext, useState, useEffect, useCallback, useMemo } from "react";
import { Box, Button, Tooltip, Typography } from "@mui/material";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import { useTranslation } from "react-i18next";
import i18next from "i18next";
import { Context } from "../App";
import LanGrid from "./LanGrid";
import CustomPalette from "../constants/customPalette";
import { removeSpacesFromArrayOfObjects } from "../constants/removeSpaces";
import BackNextSkeleton from "../components/BackNextSkeleton";
import Loading from "../components/Loading";
import { codesToLanguages } from "../constants/isoCodes";
import { useMultiSchema } from "../context/MultiSchemaContext";

export default function LanguageDetails({ pageBack, pageForward }) {
  const { t } = useTranslation();
  
  // Use MultiSchemaContext
  const {
    activeSchemaId,
    editingSchemaId,
    getSchemaState,
    updateSchemaState
  } = useMultiSchema();

  const currentSchemaId = activeSchemaId || editingSchemaId;

  // Global context
  const {
    languages,
    setLanAttributeRowData,
    setCurrentPage
  } = useContext(Context);

  // Get schema state data
  const schemaState = getSchemaState(currentSchemaId);
  const lanAttributeRowData = schemaState?.lanAttributeRowData || {};
  const attributesWithLists = schemaState?.attributesWithLists || [];

  const languageIndex = languages.findIndex(
    (item) => codesToLanguages?.[i18next.language] === item
  );
  const filteredLanguages = useMemo(() => {
    const arr = [...languages];
    if (languageIndex !== -1 && languageIndex !== 0) {
      const removedLanguage = arr.splice(languageIndex, 1);
      arr.unshift(removedLanguage[0]);
    }
    return arr;
  }, [languages, languageIndex]);

  const [currentLanguage, setCurrentLanguage] = useState(filteredLanguages[0]);
  
  // Update currentLanguage when UI language changes
  useEffect(() => {
    const uiLanguageName = codesToLanguages?.[i18next.language];
    if (uiLanguageName && languages.includes(uiLanguageName)) {
      setCurrentLanguage(uiLanguageName);
    } else {
      setCurrentLanguage(filteredLanguages[0]);
    }
  }, [t, languages, filteredLanguages]); // Use 't' to track language changes

  const [loading, setLoading] = useState(true);
  const setLoadingIfChanged = useCallback((next) => {
    setLoading((prev) => (prev === next ? prev : next));
  }, []);
  const gridRef = useRef();
  const refContainer = useRef();
  const entryCodesRef = useRef();

  // Reset global language-dependent data when switching schemas to avoid stale rows from previous schema
  useEffect(() => {
    if (currentSchemaId) {
      setLanAttributeRowData({});
    }
  }, [currentSchemaId, setLanAttributeRowData]);

  // Stops grid editing when clicking outside grid
  useEffect(() => {
    const handleClickOutsideGrid = (event) => {
      if (
        gridRef.current &&
        gridRef.current.api &&
        refContainer.current &&
        !refContainer.current.contains(event.target)
      ) {
        gridRef.current.api.stopEditing();
      }
    };

    // Only add the event listener if the grid is loaded (not loading)
    if (!loading) {
      document.addEventListener("click", handleClickOutsideGrid);
    }

    return () => {
      document.removeEventListener("click", handleClickOutsideGrid);
    };
  }, [gridRef, refContainer, loading]);

  const handleSave = () => {
    entryCodesRef.current = false;
    if (gridRef.current && gridRef.current.api) {
      gridRef.current.api.stopEditing();
    }
    const newLanAttributeRowData = JSON.parse(JSON.stringify(lanAttributeRowData));
    const noSpacesObject = {};
    languages.forEach((language) => {
      // Check if lanAttributeRowData exists for this language
      if (newLanAttributeRowData[language] && Array.isArray(newLanAttributeRowData[language])) {
        noSpacesObject[language] = removeSpacesFromArrayOfObjects(
          newLanAttributeRowData[language]
        );
      } else {
        noSpacesObject[language] = [];
      }
    });
    
    // Save to MultiSchemaContext if editing a specific schema
    if (currentSchemaId) {
      updateSchemaState(currentSchemaId, {
        lanAttributeRowData: noSpacesObject
      });
    }
    
    // Also save to global context for compatibility
    setLanAttributeRowData(noSpacesObject);
    entryCodesRef.current = attributesWithLists.length > 0;
  };
  const handlePageBack = () => {
    handleSave();
    if (entryCodesRef.current && attributesWithLists.length > 0) {
      setCurrentPage("Codes");
    } else {
      pageBack();
    }
  };

  const pageForwardSave = () => {
    handleSave();
    pageForward();
  };

  // Formats language button display in a way that is displayed cleanly

  const displayLanguageArray = [];

  for (let i = 0; i < filteredLanguages.length; i += 6) {
    const languageRow = filteredLanguages.slice(i, i + 6).filter(Boolean);
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
            language === displayLanguageArray[displayLanguageArray.length - 1][0];
        } else {
          isFirstButton = index === 0;
        }
      } else {
        isFirstButton = index === 0;
      }
      const isLastButton = language === filteredLanguages[languages.length - 1];

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
            border: `0.5px solid ${CustomPalette.PRIMARY}`
          }}
        >
          {" "}
          <Typography noWrap variant="button">
            {language}
          </Typography>
        </Button>
      );
    });
    return languageRowDisplay;
  };
  const languageButtonDisplay = displayLanguageArray.map((languageSegment, index) => (
    <Box key={`language-segment-${languageSegment.join("-")}`}>
      {createLanguageRow(languageSegment, index)}
    </Box>
  ));

  const handleCopy = () => {
    // In lanAttributeRowData, I want to iteratively go through each language and copy the Atrribute value to the Label value
    const languages = Object.keys(lanAttributeRowData);
    const newLanAttributeRowData = JSON.parse(JSON.stringify(lanAttributeRowData));
    for (const lang of languages) {
      newLanAttributeRowData[lang].forEach((item) => {
        item.Label = item.Attribute;
      });
    }
    setLanAttributeRowData(newLanAttributeRowData);
  };

  return (
    <BackNextSkeleton
      isBack
      pageBack={handlePageBack}
      isForward
      pageForward={pageForwardSave}
    >
      {loading && lanAttributeRowData[languages[0]]?.length > 40 && <Loading />}
      <Box
        sx={{
          margin: "2rem"
        }}
      >
        <Box
          sx={{
            display: "flex",
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "1rem"
          }}
        >
          <Button
            color="button"
            variant="contained"
            onClick={handleCopy}
            sx={{
              alignSelf: "flex-end",
              width: "14rem",
              display: "flex",
              justifyContent: "space-around",
              p: 1
            }}
          >
            Copy Attribute -{">"} Label
          </Button>
        </Box>
        <Box
          sx={{
            display: "flex",
            flexDirection: "column-reverse",
            alignItems: languages.length < 6 ? "flex-start" : "flex-end"
          }}
        >
          {languageButtonDisplay}
        </Box>
        <Box
          sx={{
            textAlign: "left",
            transform: "translate(-25px, -25px)",
            color: CustomPalette.GREY_600,
            height: "0rem"
          }}
        >
          <Tooltip
            title={t("Toggles between the one or more languages used in the schema")}
            placement="left"
            arrow
            PopperProps={{
              sx: {
                "& .MuiTooltip-tooltip": {
                  width: 100
                }
              }
            }}
          >
            <HelpOutlineIcon sx={{ fontSize: 15 }} />
          </Tooltip>
        </Box>
        <div ref={refContainer}>
          <LanGrid
            gridRef={gridRef}
            currentLanguage={currentLanguage}
            setLoading={setLoadingIfChanged}
          />
        </div>
      </Box>
    </BackNextSkeleton>
  );
}
