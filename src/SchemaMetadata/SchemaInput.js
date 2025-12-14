import React, { useContext, useState } from "react";
import { TextField, Typography, Box, Tooltip, Button } from "@mui/material";
import DeleteForeverIcon from "@mui/icons-material/DeleteForever";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import { useTranslation } from "react-i18next";
import { CustomPalette } from "../constants/customPalette";
import { Context } from "../App";
import { LanguageUtils } from "../utils/languageUtils";
import Classification from "./Classification";
import { getSchemaDataById } from "../SchemaVisualization/dataUtils";
import { useMultiSchema } from "../context/MultiSchemaContext";

export default function SchemaInput({
  language,
  setShowIsoInput,
  setEditingLanguage,
  index
}) {
  const { t } = useTranslation();
  const {
    languages,
    setLanguages,
    customIsos,
    OCAPackage
  } = useContext(Context);
  const [deleteHover, setDeleteHover] = useState(false);
  const nameFieldId = `schema-name${language}`;
  const descriptionFieldId = `schema-description${language}`;
  const { currentSchemaId, getSchemaState, updateSchemaState } = useMultiSchema();

  // Define language key first
  const langKey =
    language?.toLowerCase() === "english"
      ? "eng"
      : language?.toLowerCase() === "french"
        ? "fra"
        : language?.toLowerCase();

  // Get the schema state metadata - this is the source of truth for edits
  const metaState = currentSchemaId ? getSchemaState(currentSchemaId)?.metadata : null;
  const metaLocalized = metaState?.localized || {};

  // Get the schema name and description for the current language
  // Use metadata.localized as the primary source, only fall back to OCA package on initial load
  const hasLocalizedData = metaLocalized && Object.keys(metaLocalized).length > 0;
  
  let schemaName = "";
  let currentSchemaDescription = "";
  
  if (hasLocalizedData) {
    // If we have localized metadata, use it (this includes user edits, even if empty string)
    schemaName = metaLocalized[langKey]?.name !== undefined ? metaLocalized[langKey].name : "";
    currentSchemaDescription = metaLocalized[langKey]?.description !== undefined ? metaLocalized[langKey].description : "";
  } else if (currentSchemaId) {
    // Only on initial load, fall back to OCA package data
    const currentSchemaData = getSchemaDataById(OCAPackage, currentSchemaId, langKey);
    schemaName = currentSchemaData?.schemaName || currentSchemaId;
    currentSchemaDescription = currentSchemaData?.schemaDescription || "";
  }

  // Debug logs removed to reduce console noise during schema-aware editing

  const handleNameField = (e) => {
    e.preventDefault();

    const newText = e.target.value;

    // Always update multi-schema context
    const targetId = currentSchemaId;
    if (targetId) {
      const st = getSchemaState(targetId) || {};
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
      updateSchemaState(targetId, { metadata: nextMeta });
    }
  };

  const handleDescriptionField = (e) => {
    e.preventDefault();

    const newText = e.target.value;

    // Always update multi-schema context
    const targetId = currentSchemaId;
    if (targetId) {
      const st = getSchemaState(targetId) || {};
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
      updateSchemaState(targetId, { metadata: nextMeta });
    }
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
              {LanguageUtils.getUILanguageCode(language) ||
                customIsos[language.toLowerCase()]}
            </Typography>
          </Box>
          {!LanguageUtils.getUILanguageCode(language) && (
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
