import React, { useRef, useContext, useState, useEffect, useCallback, useMemo, forwardRef, useImperativeHandle } from "react";
import { Box, Button, Tooltip, Typography } from "@mui/material";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import { useTranslation } from "react-i18next";
import i18next from "i18next";
import { Context } from "../App";
import LanGrid from "./LanGrid";
import CustomPalette from "../constants/customPalette";
import { removeSpacesFromArrayOfObjects } from "../utils/stringUtils";
import BackNextSkeleton from "../components/BackNextSkeleton";
import Loading from "../components/Loading";
import { useMultiSchema } from "../schema/schemaContext";
import { 
  getPrioritizedLangNames, 
  getBestLangName, 
  getUICode, 
  getOCACodeFromLangName 
} from "../utils/languageUtils";

const LanguageDetails = forwardRef(function LanguageDetails({ pageBack, pageForward }, ref) {
  const { t } = useTranslation();
  
  // Use MultiSchemaContext
  const {
    getSchemaState,
    updateSchemaState
  } = useMultiSchema();

  // Global context
  const {
    languages,
    setCurrentPage
  } = useContext(Context);

  // Get schema state data
  const schemaState = getSchemaState();
  const lanAttributeRowData = schemaState?.lanAttributeRowData || {};
  const attributesWithLists = schemaState?.attributesWithLists || [];

  const filteredLanguages = useMemo(() => {
    return getPrioritizedLangNames(languages);
  }, [languages]);

  const [currentLanguage, setCurrentLanguage] = useState(filteredLanguages[0]);
  
  // Update currentLanguage when UI language changes
  useEffect(() => {
    const bestLanguage = getBestLangName(getUICode(), languages);
    setCurrentLanguage(bestLanguage);
  }, [t, languages]); // Use 't' to track language changes

  const [loading, setLoading] = useState(true);
  const setLoadingIfChanged = useCallback((next) => {
    setLoading((prev) => (prev === next ? prev : next));
  }, []);
  const gridRef = useRef();
  const refContainer = useRef();
  const entryCodesRef = useRef();

  // Note: lanAttributeRowData is now managed per-schema in MultiSchemaContext
  // No need to reset global state when switching schemas

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
    
    // Save to MultiSchemaContext for both manual and loaded schemas
    // Convert LDAD data to schema overlays
    const schemaState = getSchemaState();
    const currentSchema = schemaState?.completeSchema || {};
    const updatedOverlays = { ...currentSchema.overlays };

    // Create label overlays from LDAD data
    const labelOverlays = [];
    languages.forEach((language) => {
      const langData = noSpacesObject[language] || [];
      if (langData.length > 0) {
        // Convert language name to ISO 639-2 (3-letter) code for overlay
        // Use the existing languageNameToAlpha3Codes mapping
        const languageCode = getOCACodeFromLangName(language) || 
                             language.toLowerCase().slice(0, 3); // Fallback to first 3 chars
        
        const attributeLabels = {};
        langData.forEach((item) => {
          if (item.Attribute && item.Label && item.Label.trim() !== '') {
            attributeLabels[item.Attribute] = item.Label;
          }
        });

        if (Object.keys(attributeLabels).length > 0) {
          labelOverlays.push({
            language: languageCode,
            attribute_labels: attributeLabels
          });
        }
      }
    });

    // Update the overlays
    if (labelOverlays.length > 0) {
      updatedOverlays.label = labelOverlays;
    }

    updateSchemaState({
      lanAttributeRowData: noSpacesObject, // Keep for compatibility during transition
      overlays: updatedOverlays,  // Save overlays directly to schema state
      completeSchema: {
        ...currentSchema,
        overlays: updatedOverlays
      }
    });
    
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

  // Expose save method to parent (Home) so it can persist edits on navigation
  useImperativeHandle(ref, () => ({
    save: handleSave
  }));

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
                : CustomPalette.WHITE,
            color:
              currentLanguage === language
                ? "white"
                : CustomPalette.PRIMARY,
            borderRadius,
            width: languages.length < 5 ? "12rem" : "8.335rem",
            boxShadow: "none",
            border: `1px solid ${CustomPalette.PRIMARY}`,
            "&:hover": {
              backgroundColor:
                currentLanguage === language
                  ? CustomPalette.PRIMARY
                  : CustomPalette.WHITE,
              boxShadow:
                currentLanguage === language
                  ? "none"
                  : undefined
            }
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
    
    // Update schema state with the modified data
    updateSchemaState({
      lanAttributeRowData: newLanAttributeRowData
    });
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
});

export default LanguageDetails;
