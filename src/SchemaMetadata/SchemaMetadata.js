import { Box, Button, Typography, Tooltip } from "@mui/material";
import React, {
  useState,
  useContext,
  useEffect,
  useRef,
  useCallback,
  forwardRef,
  useImperativeHandle
} from "react";

import RemoveCircleIcon from "@mui/icons-material/RemoveCircle";
import AddCircleIcon from "@mui/icons-material/AddCircle";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";

import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Description from "./Description";
import LanguageSelection from "./LanguageSelection";
import ErrorPopup from "../ViewSchema/ErrorPopup";
import { CustomPalette } from "../constants/customPalette";
import { Context } from "../App";
import { useMultiSchema } from "../schema/schemaContext";
import { langCodeOCAFromName } from "../utils/languageUtils";
import IsoCard from "./IsoCard";
import BackNextSkeleton from "../components/BackNextSkeleton";
import { BETWEEN_SECTION_SPACING } from "../constants/constants";

const SchemaMetadata = forwardRef(
  ({ pageBack, pageForward, onContinueNavigation }, ref) => {
    const navigate = useNavigate();
    const { t } = useTranslation();

    // Schema data hook
    // Use MultiSchema context with standard pattern
    const { getSchema, updateSchema } = useMultiSchema();
    const schemaState = getSchema();

    // Local component state
    const [showLanguages, setShowLanguages] = useState(false);
    const [showCard, setShowCard] = useState(false);
    const [showBlockingCard, setShowBlockingCard] = useState(false);
    const [showIsoInput, setShowIsoInput] = useState(false);
    const [editingLanguage, setEditingLanguage] = useState("");

    // Global context for app-level state
    const {
      schemaDescription: globalSchemaDescription,
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

      languages.forEach((lang) => {
        // Use OCA language code for storage lookup
        const langCode = langCodeOCAFromName(lang);
        const localized = metadata.localized?.[langCode] || {};

        // Use English root metadata as fallback for English language
        const isEnglish = langCode === "eng";
        result[lang] = {
          name: localized.name || (isEnglish ? metadata.name : "") || "",
          description:
            localized.description || (isEnglish ? metadata.description : "") || ""
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
      if (typeof newDescription === "object" && !Array.isArray(newDescription)) {
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
          if (langCode === "eng") {
            rootName = data.name || "";
            rootDescription = data.description || "";
          }
        });

        updateSchema({
          metadata: {
            name: rootName,
            description: rootDescription,
            localized
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

      newLanguages.forEach((langName) => {
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

    const validateSchemaMetadata = useCallback(() => {
      const spacesArray = [];
      const metadata = schemaState?.metadata || {};
      const localized = metadata.localized || {};

      const hasDescription = Object.values(localized).some((langData) => {
        if (!langData || typeof langData !== "object") return false;
        const desc =
          typeof langData.description === "string" ? langData.description.trim() : "";
        return desc !== "";
      });

      if (!hasDescription) {
        spacesArray.push(t("Description"));
      }

      return spacesArray;
    }, [schemaState, t]);

    const [pendingNavigationTarget, setPendingNavigationTarget] = useState(null);

    const isMissingName = useCallback(() => {
      const metadata = schemaState?.metadata || {};
      const localized = metadata.localized || {};
      if (Object.keys(localized).length === 0) return true;
      return !Object.values(localized).some((langData) => {
        if (!langData || typeof langData !== "object") return false;
        const name = typeof langData.name === "string" ? langData.name.trim() : "";
        return name !== "";
      });
    }, [schemaState]);

    // Expose validation function to parent component
    useImperativeHandle(ref, () => ({
      validateSchemaMetadata: () => validateSchemaMetadata(),
      showValidationPopup: (targetPage) => {
        if (isMissingName()) {
          setShowBlockingCard(true);
          return false;
        }
        const validationErrors = validateSchemaMetadata();
        if (validationErrors.length >= 1) {
          setShowCard(true);
          setPendingNavigationTarget(targetPage || null);
          return false;
        }
        return true;
      }
    }));

    const handleForward = () => {
      if (isMissingName()) {
        setShowBlockingCard(true);
        return;
      }
      const validationErrors = validateSchemaMetadata();
      if (validationErrors.length >= 1) {
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
      let originPage = null;
      let targetIndex = -1;

      // Look backward in history to find the first pre-stepper page
      for (let i = history.length - 2; i >= 0; i--) {
        if (
          history[i] === "Landing" ||
          history[i] === "Start" ||
          history[i] === "Create"
        ) {
          originPage = history[i];
          targetIndex = i;
          break;
        }
      }

      if (originPage === "Landing") {
        setHistory((prev) => prev.slice(0, targetIndex + 1));
        setCurrentPage("Landing");
        navigate("/");
      } else if (originPage === "Create") {
        setHistory((prev) => prev.slice(0, targetIndex + 1));
        setCurrentPage("Create");
      } else if (originPage === "Start") {
        setHistory((prev) => prev.slice(0, targetIndex + 1));
        setCurrentPage("Start");
      } else {
        // Fallback if none found
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
        {showBlockingCard && (
          <ErrorPopup onClose={() => setShowBlockingCard(false)}>
            <Box>
              <Typography variant="h5" sx={{ mb: 1 }}>
                {t("A schema name is required to continue.")}
              </Typography>
            </Box>
          </ErrorPopup>
        )}
        {showCard && (
          <ErrorPopup
            onClose={() => {
              setShowCard(false);
              setPendingNavigationTarget(null);
            }}
          >
            <Box>
              <Typography variant="h5" sx={{ mb: 1 }}>
                {t("Schema description is empty. Continue without it?")}
              </Typography>
            </Box>
            <Button
              variant="contained"
              color="navButton"
              onClick={() => {
                setShowCard(false);
                if (pendingNavigationTarget) {
                  if (typeof onContinueNavigation === "function") {
                    onContinueNavigation(pendingNavigationTarget);
                  } else {
                    setCurrentPage(pendingNavigationTarget);
                  }
                  setPendingNavigationTarget(null);
                } else {
                  pageForward();
                }
              }}
              sx={{
                mt: 1,
                backgroundColor: CustomPalette.PRIMARY,
                ":hover": { backgroundColor: CustomPalette.SECONDARY }
              }}
            >
              {t("Continue")}
            </Button>
          </ErrorPopup>
        )}
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
            mb: BETWEEN_SECTION_SPACING,
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
                    "Add another language to your schema. Without changing the basic structure of your schema, you can ensure it can be shared and used in different languages."
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
  }
);

SchemaMetadata.displayName = "SchemaMetadata";

export default SchemaMetadata;
