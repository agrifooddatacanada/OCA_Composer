import { Box, Button, Typography, Tooltip } from "@mui/material";
import React, { useState, useContext, useEffect, useRef, useCallback, forwardRef, useImperativeHandle } from "react";

import RemoveCircleIcon from "@mui/icons-material/RemoveCircle";
import AddCircleIcon from "@mui/icons-material/AddCircle";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";

import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Description from "./Description";
import LanguageSelection from "./LanguageSelection";
import NavigationCard from "../constants/NavigationCard";
import { CustomPalette } from "../constants/customPalette";
import { Context } from "../App";
import { useMultiSchema } from "../context/MultiSchemaContext";
import { removeSpacesFromObjectOfObjects } from "../constants/removeSpaces";
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
  const { currentSchemaId, getSchemaState, updateSchemaState } = useMultiSchema();
  const schemaState = getSchemaState(currentSchemaId);

  const updateCurrentSchema = useCallback(
    (updates) => {
      updateSchemaState(currentSchemaId, updates);
    },
    [currentSchemaId, updateSchemaState]
  );

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

  // Use schema state directly - no fallback needed
  const rawSchemaDescription = schemaState?.metadata?.description || globalSchemaDescription;
  const languages = schemaState?.metadata?.languages || globalLanguages;
  
  // Ensure schemaDescription is always in the correct format (object with language keys)
  const schemaDescription = typeof rawSchemaDescription === 'string' 
    ? (() => {
        const result = {};
        languages.forEach(lang => {
          result[lang] = { 
            name: schemaState?.metadata?.name || "", 
            description: rawSchemaDescription 
          };
        });
        return result;
      })()
    : rawSchemaDescription;

  const setSchemaDescription = (newDescription) => {
    // Convert the language object format to proper localized structure
    if (typeof newDescription === 'object' && !Array.isArray(newDescription)) {
      const localized = {};
      let rootName = "";
      let rootDescription = "";
      
      Object.entries(newDescription).forEach(([langName, data]) => {
        const langCode = langName.toLowerCase() === 'english' ? 'eng' : 
                        langName.toLowerCase() === 'french' ? 'fra' : langName;
        localized[langCode] = {
          name: data.name || "",
          description: data.description || ""
        };
        
        // Use English as the root name/description if available
        if (langName.toLowerCase() === 'english') {
          rootName = data.name || "";
          rootDescription = data.description || "";
        }
      });
      
      updateCurrentSchema({
        metadata: {
          ...schemaState?.metadata,
          name: rootName,
          description: rootDescription,
          localized: localized
        }
      });
    } else {
      // Handle string or other formats
      updateCurrentSchema({
        metadata: {
          ...schemaState?.metadata,
          description: newDescription
        }
      });
    }
  };

  const setLanguages = (newLanguages) => {
    updateCurrentSchema({
      metadata: {
        ...schemaState?.metadata,
        languages: newLanguages
      }
    });
  };

  const toTitleCase = (str) =>
    str.toLowerCase().replace(/^(.)|\s(.)/g, (match) => match.toUpperCase());

  // Reusable validation function
  const validateSchemaMetadata = useCallback(() => {
    const noSpacesObject = removeSpacesFromObjectOfObjects(schemaDescription);
    setSchemaDescription(noSpacesObject);
    const spacesArray = [];

    languages.forEach((language) => {
      // Check if noSpacesObject[language] exists and is an object before calling Object.values
      const languageData = noSpacesObject[language];
      if (languageData && typeof languageData === 'object') {
        // Check each field individually and report which field is blank
        Object.entries(languageData).forEach(([fieldName, value]) => {
          if (!value) {
            const fieldDisplayName = fieldName === 'name' ? 'Name of Schema' : 
                                   fieldName === 'description' ? 'Description' : 
                                   toTitleCase(fieldName);
            if (!spacesArray.includes(fieldDisplayName)) {
              spacesArray.push(fieldDisplayName);
            }
          }
        });
      }
    });
    
    return spacesArray;
  }, [schemaDescription, languages]);

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
        />
      </Box>
    </BackNextSkeleton>
  );
});

SchemaMetadata.displayName = 'SchemaMetadata';

export default SchemaMetadata;
