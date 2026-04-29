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
import { BETWEEN_SECTION_SPACING } from "../constants/constants";
import Loading from "../components/Loading";
import { useMultiSchema } from "../schema/schemaContext";
import { 
  langCodeOCAFromName,
  LanguageConstants
} from "../utils/languageUtils";

const LanguageDetails = forwardRef(function LanguageDetails({ pageBack, pageForward }, ref) {
  const { t } = useTranslation();
  
  // Use MultiSchemaContext
  const {
    getSchema,
    updateSchema,
    getLanguages
  } = useMultiSchema();

  // Global context
  const {
    setCurrentPage
  } = useContext(Context);

  // Get schema-specific languages
  const languages = getLanguages();

  // Get schema state data
  const schemaState = getSchema();
  const lanAttributeRowData = schemaState?.lanAttributeRowData || {};
  const attributesWithLists = schemaState?.attributesWithLists || [];

  const filteredLanguages = useMemo(() => [...languages], [languages]);

  const [currentLanguage, setCurrentLanguage] = useState(filteredLanguages[0] || LanguageConstants.DEFAULT_LANG_NAME);
  
  // Update currentLanguage when languages array changes
  // NOTE: We do NOT auto-sync with UI language to preserve user's schema language selection
  useEffect(() => {
    // If current language is no longer in the list, switch to first available
    if (!languages.includes(currentLanguage)) {
      setCurrentLanguage(filteredLanguages[0] || LanguageConstants.DEFAULT_LANG_NAME);
    }
    // Don't auto-switch based on UI language - let user control schema language independently
  }, [languages, filteredLanguages, currentLanguage]);

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
    const storedLan = getSchema()?.lanAttributeRowData || {};
    const noSpacesObject = {};
    languages.forEach((language) => {
      const rows = lanAttributeRowData[language] ?? storedLan[language];
      if (rows && Array.isArray(rows)) {
        noSpacesObject[language] = removeSpacesFromArrayOfObjects(
          JSON.parse(JSON.stringify(rows))
        );
      } else {
        noSpacesObject[language] = [];
      }
    });
    
    // Save to MultiSchemaContext for both manual and loaded schemas
    // Convert LDAD data to schema overlays
    const schemaState = getSchema();
    const currentSchema = schemaState?.completeSchema || {};
    const updatedOverlays = { ...currentSchema.overlays };

    // Create label overlays from LDAD data
    const labelOverlays = [];
    languages.forEach((language) => {
      const langData = noSpacesObject[language] || [];
      if (langData.length > 0) {
        // Convert language name to ISO 639-2 (3-letter) code for overlay
        // Use the existing languageNameToAlpha3Codes mapping
        const languageCode = langCodeOCAFromName(language) || 
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

    updateSchema({
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

  const LDAD_LANGUAGE_STRIP_WIDTH = 885;

  const ldadLanguageTabWidth = languages.length < 5 ? "12rem" : "8.335rem";
  const ldadLanguageChunks = useMemo(() => {
    const rows = [];
    for (let i = 0; i < filteredLanguages.length; i += 6) {
      rows.push(filteredLanguages.slice(i, i + 6).filter(Boolean));
    }
    return rows;
  }, [filteredLanguages]);

  const languageStrip = (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        gap: 1,
        width: LDAD_LANGUAGE_STRIP_WIDTH,
        maxWidth: "100%",
        boxSizing: "border-box"
      }}
    >
      {ldadLanguageChunks.map((segment) => (
        <Box
          key={segment.join("-")}
          sx={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "flex-end",
            alignSelf: "flex-start",
            borderBottom: `1px solid ${CustomPalette.GREY_300}`,
            boxSizing: "border-box"
          }}
        >
          {segment.map((language) => {
            const selected = currentLanguage === language;
            return (
              <Button
                key={language}
                onClick={() => {
                  handleSave();
                  setCurrentLanguage(language);
                }}
                variant="text"
                color="inherit"
                sx={{
                  textTransform: "none",
                  fontWeight: 400,
                  borderRadius: 0,
                  px: 2,
                  py: 1.25,
                  width: ldadLanguageTabWidth,
                  minWidth: ldadLanguageTabWidth,
                  maxWidth: { xs: "100%", sm: "none" },
                  color: selected ? CustomPalette.BLACK : CustomPalette.GREY_600,
                  bgcolor: "transparent",
                  boxShadow: "none",
                  borderBottom: "2px solid",
                  borderBottomColor: selected ? CustomPalette.BLACK : "transparent",
                  mb: "-1px",
                  "&:hover": {
                    bgcolor: "rgba(0, 0, 0, 0.04)",
                    color: CustomPalette.BLACK
                  }
                }}
              >
                <Typography noWrap variant="body2" sx={{ fontWeight: 400 }}>
                  {t(language, { defaultValue: language })}
                </Typography>
              </Button>
            );
          })}
        </Box>
      ))}
    </Box>
  );

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
    updateSchema({
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
      {loading && lanAttributeRowData[languages[0] || LanguageConstants.DEFAULT_LANG_NAME]?.length > 40 && <Loading />}
      <Box
        sx={{
          margin: "2rem",
          marginBottom: BETWEEN_SECTION_SPACING
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
            {t("Copy Attribute -> Label", { defaultValue: "Copy Attribute -> Label" })}
          </Button>
        </Box>
        <Box
          sx={{
            position: "relative",
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
            mb: 2,
            gap: 1
          }}
        >
          {languageStrip}
          <Box
            sx={{
              position: "absolute",
              right: "100%",
              top: "50%",
              transform: "translateY(-50%)",
              marginRight: 1,
              color: CustomPalette.GREY_600
            }}
          >
            <Tooltip
              title={t("Toggles between the one or more languages used in the schema")}
              placement="left"
              arrow
              PopperProps={{
                sx: { "& .MuiTooltip-tooltip": { width: 100 } }
              }}
            >
              <HelpOutlineIcon sx={{ fontSize: 15 }} />
            </Tooltip>
          </Box>
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
