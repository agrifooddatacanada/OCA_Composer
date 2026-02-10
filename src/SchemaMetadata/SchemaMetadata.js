import { Box, Button, Typography, Tooltip } from "@mui/material";
import React, { useState, useContext, useEffect, useRef, useCallback, forwardRef, useImperativeHandle } from "react";

import RemoveCircleIcon from "@mui/icons-material/RemoveCircle";
import AddCircleIcon from "@mui/icons-material/AddCircle";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";

import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Description from "./Description";
import LanguageSelection from "./LanguageSelection";
import NavigationCard from "../components/NavigationCard";
import { CustomPalette } from "../constants/customPalette";
import { Context } from "../App";
import { useMultiSchema } from "../schema/schemaContext";
import { langCodeOCAFromName } from "../utils/languageUtils";
import { removeSpacesFromObjectOfObjects } from "../utils/stringUtils";
import IntroCard from "./IntroCard";
import IsoCard from "./IsoCard";
import BackNextSkeleton from "../components/BackNextSkeleton";

const SchemaMetadata = forwardRef(({
  pageBack,
  pageForward,
  showIntroCard,
  setShowIntroCard
}, ref) => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  // Schema data hook
  // Use MultiSchema context with standard pattern
  const { getSchema, updateSchema } = useMultiSchema();
  const schemaState = getSchema();

  // Local component state
  const [showLanguages, setShowLanguages] = useState(false);
  const [showCard, setShowCard] = useState(false);
  const [fieldArray, setFieldArray] = useState([]);
  const [showIsoInput, setShowIsoInput] = useState(false);
  const [editingLanguage, setEditingLanguage] = useState("");

  // Global context for app-level state
  const {
    schemaDescription: globalSchemaDescription,
    languages: globalLanguages,
    history,
    setHistory,
    setCurrentPage
  } = useContext(Context);

  // Use schema-specific languages (each schema has its own independent language list)
  const languages = schemaState?.metadata?.languages || [];
  
  // Build schemaDescription from MultiSchemaContext metadata
  // Structure: { English: { name: "...", description: "..." }, French: { ... } }
  const schemaDescription = (() => {
    const result = {};
    const metadata = schemaState?.metadata || {};
    
    languages.forEach(lang => {
      // Use OCA language code for storage lookup
      const langCode = langCodeOCAFromName(lang);
      const localized = metadata.localized?.[langCode] || {};
      
      // Use English root metadata as fallback for English language
      const isEnglish = langCode === 'eng';
      result[lang] = { 
        name: localized.name || (isEnglish ? metadata.name : "") || "", 
        description: localized.description || (isEnglish ? metadata.description : "") || ""
      };
    });
    
    // Fallback to global context if metadata is empty
    if (!metadata.name && !metadata.description && !metadata.localized) {
      return globalSchemaDescription || result;
    }
    
    return result;
  })();

  const setSchemaDescription = (newDescription) => {
    // Convert the language object format to proper localized structure
    if (typeof newDescription === 'object' && !Array.isArray(newDescription)) {
      // Start with existing localized data to preserve all languages
      const currentLocalized = schemaState?.metadata?.localized || {};
      const localized = { ...currentLocalized };
      let rootName = schemaState?.metadata?.name || "";
      let rootDescription = schemaState?.metadata?.description || "";
      
      Object.entries(newDescription).forEach(([langName, data]) => {
        // Use OCA language code for storage
        const langCode = langCodeOCAFromName(langName);
        
        localized[langCode] = {
          name: data.name || "",
          description: data.description || ""
        };
        
        // Use English as the root name/description if available
        if (langCode === 'eng') {
          rootName = data.name || "";
          rootDescription = data.description || "";
        }
      });
      
      updateSchema({
        metadata: {
          name: rootName,
          description: rootDescription,
          localized: localized
        }
      });
    } else {
      // Handle string or other formats
      updateSchema({
        metadata: {
          ...schemaState?.metadata,
          description: newDescription
        }
      });
    }
  };

  const setLanguages = (newLanguages) => {
    // Initialize localized entries for any new languages that don't have them yet
    const currentLocalized = schemaState?.metadata?.localized || {};
    const updatedLocalized = { ...currentLocalized };
    
    newLanguages.forEach(langName => {
      // Use OCA language code for storage
      const langCode = langCodeOCAFromName(langName);
      
      // Only initialize if this language doesn't have an entry yet
      if (!updatedLocalized[langCode]) {
        updatedLocalized[langCode] = {
          name: "",
          description: ""
        };
      }
    });
    
    const metadataUpdate = {
      metadata: {
        languages: newLanguages,
        localized: updatedLocalized
      }
    };
    
    updateSchema(metadataUpdate);
  
  };

  const toTitleCase = (str) =>
    str.toLowerCase().replace(/^(.)|\s(.)/g, (match) => match.toUpperCase());

  // Reusable validation function
  const validateSchemaMetadata = useCallback(() => {
    const spacesArray = [];

    // MultiSchemaContext handles both manual (null schemaId) and imported schemas
    // via MANUAL_CREATION_SCHEMA_ID fallback
    const metadata = schemaState?.metadata || {};
    const localized = metadata.localized || {};
    
    // If no localized data exists yet, both name and description are missing
    if (Object.keys(localized).length === 0) {
      spacesArray.push('Name of Schema');
      spacesArray.push('Description');
      return spacesArray;
    }
    
    // Validate that at least one language has both name and description filled
    let hasValidLanguage = false;
    
    Object.entries(localized).forEach(([langCode, langData]) => {
      if (langData && typeof langData === 'object') {
        const name = typeof langData.name === 'string' ? langData.name.trim() : langData.name;
        const description = typeof langData.description === 'string' ? langData.description.trim() : langData.description;
        
        // If this language has both fields filled, mark as valid
        if (name && name !== '' && description && description !== '') {
          hasValidLanguage = true;
        }
      }
    });
    
    // Only report errors if NO language has complete data
    if (!hasValidLanguage) {
      // Check what's specifically missing
      let missingName = true;
      let missingDescription = true;
      
      Object.entries(localized).forEach(([langCode, langData]) => {
        if (langData && typeof langData === 'object') {
          const name = typeof langData.name === 'string' ? langData.name.trim() : langData.name;
          const description = typeof langData.description === 'string' ? langData.description.trim() : langData.description;
          
          if (name && name !== '') missingName = false;
          if (description && description !== '') missingDescription = false;
        }
      });
      
      if (missingName) spacesArray.push('Name of Schema');
      if (missingDescription) spacesArray.push('Description');
    }
    
    return spacesArray;
  }, [schemaDescription, languages, schemaState, setSchemaDescription]);

  const [pendingNavigationTarget, setPendingNavigationTarget] = useState(null);

  // Expose validation function to parent component
  useImperativeHandle(ref, () => ({
    validateSchemaMetadata: () => {
      return validateSchemaMetadata();
    },
    showValidationPopup: (targetPage) => {
      // Trigger the same popup as NEXT button
      const validationErrors = validateSchemaMetadata();
      if (validationErrors.length >= 1) {
        setFieldArray(validationErrors);
        setShowCard(true);
        setPendingNavigationTarget(targetPage || null);
        return false;
      }
      return true;
    }
  }));

  const handleForward = () => {
    const validationErrors = validateSchemaMetadata();
    if (validationErrors.length >= 1) {
      setFieldArray(validationErrors);
      setShowCard(true);
    } else {
      pageForward();
    }
  };

  // When showIsoInput component is visible, prevents user from clicking other buttons on the screen
  const defaultButton = useRef();
  const addCustomButton = useRef();

  useEffect(() => {
    const handleDisableClick = (event) => {
      if (showIsoInput) {
        const { target } = event;
        if (target !== defaultButton.current && target !== addCustomButton.current) {
          event.stopPropagation();
        }
      }
    };

    if (showIsoInput) {
      document.addEventListener("click", handleDisableClick, true);
    }

    return () => {
      document.removeEventListener("click", handleDisableClick, true);
    };
  }, [showIsoInput]);

  const moveBackward = () => {
    if (history.length > 1 && history[history.length - 2] === "Landing") {
      setHistory((prev) => prev.slice(0, prev.length - 1));
      setCurrentPage("Landing");
      navigate("/");
    } else if (history.length > 1 && history[history.length - 2] === "Create") {
      // User came from CREATE MANUALLY flow
      setHistory((prev) => prev.slice(0, prev.length - 1));
      setCurrentPage("Create");
    } else {
      pageBack();
    }
  };

  return (
    <BackNextSkeleton
      isBack
      pageBack={moveBackward}
      isForward
      pageForward={handleForward}
    >
      {showCard && (
        <NavigationCard
          fieldArray={fieldArray}
          setShowCard={(show) => {
            setShowCard(show);
            if (!show) {
              setPendingNavigationTarget(null);
            }
          }}
          handleForward={() => {
            setShowCard(false);
            if (pendingNavigationTarget) {
              setCurrentPage(pendingNavigationTarget);
              setPendingNavigationTarget(null);
            } else {
              pageForward();
            }
          }}
        />
      )}
      {showIntroCard && <IntroCard setShowIntroCard={setShowIntroCard} />}
      {showIsoInput && (
        <IsoCard
          setShowIsoInput={setShowIsoInput}
          language={editingLanguage}
          defaultButton={defaultButton}
          addCustomButton={addCustomButton}
        />
      )}
      <Box
        sx={{
          mt: 2,
          width: "100%"
        }}
      >
        <Box sx={{ display: "flex", justifyContent: "space-between" }}>
          <Typography
            sx={{
              fontSize: 20,
              fontWeight: "bold",
              textAlign: "left",
              margin: "1rem 0 1rem 0",
              color: CustomPalette.PRIMARY
            }}
          >
            {t("Schema Description")}
          </Typography>
          <Box sx={{ position: "relative", alignSelf: "flex-end" }}>
            <Box
              sx={{
                alignSelf: "flex-end",
                position: "absolute",
                zIndex: "1000",
                top: 70,
                width: "100%"
              }}
            >
              {showLanguages && (
                <LanguageSelection
                  setShowLanguages={setShowLanguages}
                  setEditingLanguage={setEditingLanguage}
                  setShowIsoInput={setShowIsoInput}
                  languages={languages}
                  setLanguages={setLanguages}
                  schemaDescription={schemaDescription}
                  setSchemaDescription={setSchemaDescription}
                />
              )}
            </Box>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                color: CustomPalette.GREY_600
              }}
            >
              <Tooltip
                title={t(
                  "Add another language to your schema. Without changing the basic structure of your schema..."
                )}
                placement="left"
                arrow
              >
                <HelpOutlineIcon sx={{ fontSize: 15 }} />
              </Tooltip>
              <Button
                color="button"
                onClick={() => setShowLanguages(!showLanguages)}
                variant="contained"
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  width: "11rem",
                  m: 2
                }}
              >
                {t("Add Language")}
                {showLanguages === true ? <RemoveCircleIcon /> : <AddCircleIcon />}
              </Button>
            </Box>
          </Box>
        </Box>
        <Description
          setShowIsoInput={setShowIsoInput}
          setEditingLanguage={setEditingLanguage}
          languages={languages}
          setLanguages={setLanguages}
        />
      </Box>
    </BackNextSkeleton>
  );
});

SchemaMetadata.displayName = 'SchemaMetadata';

export default SchemaMetadata;
