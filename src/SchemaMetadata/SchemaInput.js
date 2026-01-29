import React, { useContext, useState } from "react";
import { TextField, Typography, Box, Tooltip, Button } from "@mui/material";
import DeleteForeverIcon from "@mui/icons-material/DeleteForever";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import { useTranslation } from "react-i18next";
import { CustomPalette } from "../constants/customPalette";
import { Context } from "../App";
import { getOCACodeFromLangName, getUICodeFromLangName } from "../utils/languageUtils";
import Classification from "./Classification";
import { getSchemaDataById } from "../SchemaVisualization/dataUtils";
import { useMultiSchema } from "../context/MultiSchemaContext";

export default function SchemaInput({
  language,
  setShowIsoInput,
  setEditingLanguage,
  index,
  languages,
  setLanguages
}) {
  const { t } = useTranslation();
  const {
    customIsos,
    OCAPackage
  } = useContext(Context);
  const [deleteHover, setDeleteHover] = useState(false);
  const nameFieldId = `schema-name${language}`;
  const descriptionFieldId = `schema-description${language}`;
  const { currentSchemaId, getSchemaState, updateSchemaState } = useMultiSchema();

  // Define language key - use proper OCA language code for all languages
  // No fallback - if getOCACodeFromLangName returns "eng" default, that's intentional
  const langKey = getOCACodeFromLangName(language);

  // Get schema data from MultiSchemaContext (works for both manual and imported schemas)
  // MultiSchemaContext handles null schemaId via MANUAL_CREATION_SCHEMA_ID fallback
  const schemaState = getSchemaState(currentSchemaId) || {};
  const metaState = schemaState.metadata || {};
  const metaLocalized = metaState.localized || {};
  
  // Priority: localized metadata > OCA package data (on initial load) > empty string
  let schemaName = "";
  let currentSchemaDescription = "";
  
  if (metaLocalized[langKey]) {
    // Use localized data for this language from schema state
    schemaName = metaLocalized[langKey]?.name ?? "";
    currentSchemaDescription = metaLocalized[langKey]?.description ?? "";
  } else if (OCAPackage && currentSchemaId) {
    // Fall back to OCA package data on initial load (imported schemas only)
    const currentSchemaData = getSchemaDataById(OCAPackage, currentSchemaId, langKey);
    schemaName = currentSchemaData?.schemaName || "";
    currentSchemaDescription = currentSchemaData?.schemaDescription || "";
  }
  // else: both remain empty strings (brand new, no data yet)

  // Debug logs removed to reduce console noise during schema-aware editing

  const handleNameField = (e) => {
    const newText = e.target.value;
    
    // Trust MultiSchemaContext to handle null schemaId via MANUAL_CREATION_SCHEMA_ID fallback
    const st = getSchemaState(currentSchemaId) || {};
    const prevMeta = st.metadata || {};
    const prevLoc = prevMeta.localized || {};
    const nextLocalized = {
      ...prevLoc,
      [langKey]: { ...(prevLoc[langKey] || {}), name: newText }
    };
    // Ensure we always have localized structure, initialize English if missing
    if (!nextLocalized.eng) {
      nextLocalized.eng = {
        name: prevMeta.name || newText,
        description: prevMeta.description || ""
      };
    }
    // Only update the global name field if editing English (primary language)
    const nextMeta =
      langKey === "eng"
        ? { ...prevMeta, name: newText, localized: nextLocalized }
        : { ...prevMeta, localized: nextLocalized };
    
    updateSchemaState(currentSchemaId, { metadata: nextMeta });
  };

  const handleDescriptionField = (e) => {
    const newText = e.target.value;
    
    // Trust MultiSchemaContext to handle null schemaId via MANUAL_CREATION_SCHEMA_ID fallback
    const st = getSchemaState(currentSchemaId) || {};
    const prevMeta = st.metadata || {};
    const prevLoc = prevMeta.localized || {};
    const nextLocalized = {
      ...prevLoc,
      [langKey]: { ...(prevLoc[langKey] || {}), description: newText }
    };
    // Ensure we always have localized structure, initialize English if missing
    if (!nextLocalized.eng) {
      nextLocalized.eng = {
        name: prevMeta.name || "",
        description: prevMeta.description || newText
      };
    }
    // Only update the global description field if editing English (primary language)
    const nextMeta =
      langKey === "eng"
        ? { ...prevMeta, description: newText, localized: nextLocalized }
        : { ...prevMeta, localized: nextLocalized };
    
    updateSchemaState(currentSchemaId, { metadata: nextMeta });
  };

  const handleDelete = () => {
    const languageIndex = languages.indexOf(language);
    const newLanguageArray = [...languages];
    newLanguageArray.splice(languageIndex, 1);
    setLanguages(newLanguageArray);
    
    // Also remove from schema metadata
    if (currentSchemaId) {
      const st = getSchemaState(currentSchemaId) || {};
      const prevMeta = st.metadata || {};
      const prevLoc = prevMeta.localized || {};
      const nextLocalized = { ...prevLoc };
      delete nextLocalized[langKey];
      
      updateSchemaState(currentSchemaId, {
        metadata: {
          ...prevMeta,
          localized: nextLocalized,
          languages: newLanguageArray
        }
      });
    }
  };

  return (
    <Box sx={{ mr: 4, width: "22rem" }}>
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          mt: 1,
          height: "10.5rem"
        }}
      >
        {index === 0 ? (
          <Classification />
        ) : (
          <Box sx={{ marginBottom: "1rem", height: "5rem" }} />
        )}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start"
          }}
        >
          <Typography
            sx={{
              fontSize: 18,
              fontWeight: "bold",
              textAlign: "left",
              textTransform: "capitalize",
              maxWidth: "20rem",
              wordBreak: "break-word"
            }}
          >
            {language}
          </Typography>
          {languages.length > 1 && (
            <Box
              onMouseEnter={() => setDeleteHover(true)}
              onMouseLeave={() => setDeleteHover(false)}
            >
              {deleteHover === true ? (
                <DeleteForeverIcon
                  onClick={handleDelete}
                  sx={{
                    pr: 1,
                    color: CustomPalette.PRIMARY,
                    transform: "scale(1.2)",
                    transition: "all 0.2s ease-in-out"
                  }}
                />
              ) : (
                <DeleteOutlineIcon
                  sx={{
                    pr: 1,
                    color: CustomPalette.GREY_600,
                    transition: "all 0.2s ease-in-out"
                  }}
                />
              )}
            </Box>
          )}
        </Box>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between"
          }}
        >
          <Box>
            <Typography variant="body2" sx={{ fontStyle: "italic" }}>
              ISO Code:{" "}
              {getUICodeFromLangName(language) ||
                customIsos[language.toLowerCase()]}
            </Typography>
          </Box>
          {!getUICodeFromLangName(language) && (
            <Button
              variant="contained"
              color="button"
              sx={{ fontSize: 11, p: 0.5, width: "5rem" }}
              onClick={() => {
                setShowIsoInput(true);
                setEditingLanguage(language);
              }}
            >
              Update ISO
            </Button>
          )}
        </Box>
      </Box>

      <Box sx={{ display: "flex", flexDirection: "column" }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            color: CustomPalette.GREY_600
          }}
        >
          <Typography
            sx={{
              fontSize: 15,
              fontWeight: "bold",
              textAlign: "left",
              margin: "0.5rem 0 0.5rem 0",
              width: "8rem",
              color: CustomPalette.BLACK
            }}
          >
            {t("Name of Schema")}
          </Typography>
          {language === languages[0] && (
            <Tooltip
              title={t(
                "The name of the schema. It is recommended to use a more general..."
              )}
              placement="right"
              arrow
            >
              <HelpOutlineIcon sx={{ fontSize: 15 }} />
            </Tooltip>
          )}
        </Box>
        <TextField
          id={nameFieldId}
          type="text"
          onChange={handleNameField}
          inputProps={{
            style: {
              height: "0.2rem"
            }
          }}
          value={schemaName || ""}
        />
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            margin: "2rem 0 0.5rem 0",
            color: CustomPalette.GREY_600
          }}
        >
          <Typography
            sx={{
              fontSize: 15,
              fontWeight: "bold",
              textAlign: "left",
              color: CustomPalette.BLACK,
              width: "6rem"
            }}
          >
            {t("Description")}
          </Typography>
          {language === languages[0] && (
            <Tooltip
              title={t("The description of the schema that will help yourself...")}
              placement="right"
              arrow
            >
              <HelpOutlineIcon sx={{ fontSize: 15 }} />
            </Tooltip>
          )}
        </Box>
        <TextField
          multiline
          rows="5"
          id={descriptionFieldId}
          type="text"
          onChange={handleDescriptionField}
          value={currentSchemaDescription || ""}
        />
      </Box>
    </Box>
  );
}
