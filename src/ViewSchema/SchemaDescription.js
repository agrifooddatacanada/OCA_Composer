import React, { useContext } from "react";
import { Box, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import { CustomPalette } from "../constants/customPalette";
import { Context } from "../App";
import { useMultiSchema } from "../context/MultiSchemaContext";
import { getOCALanguageCode } from "../utils/languageUtils";

export default function SchemaDescription({ currentLanguage }) {
  const { t, i18n } = useTranslation();
  const { divisionGroup, currentTheme } = useContext(Context);
  // Use MultiSchema context with standard pattern
  const { currentSchemaId, getSchemaState } = useMultiSchema();
  const schemaState = getSchemaState(currentSchemaId);

  // Use current schema state's metadata
  const currentMeta = schemaState?.metadata || {};
  
  // Convert display language name to 3-letter OCA code
  const langKey = getOCALanguageCode(currentLanguage);
  
  // Get the current UI language to determine fallback behavior
  const uiLanguage = i18n.language; // "en" or "fr"
  
  // Get metadata for the current display language from localized structure
  const localizedMeta = currentMeta.localized?.[langKey];
  
  const schemaName =
    localizedMeta?.name || 
    (uiLanguage === "en" ? currentMeta?.name : null) || 
    t("Unknown");
  const schemaDescriptionText =
    localizedMeta?.description ||
    (uiLanguage === "en" ? currentMeta?.description : null) ||
    t("No description available");
  const classification =
    divisionGroup?.group || divisionGroup?.division || t("Not classified");

  return (
    <Box>
      <Typography
        sx={{
          fontSize: 15,
          fontWeight: "bold",
          textAlign: "left",
          margin: "1rem 0 0.5rem 0",
          color: currentTheme?.secondaryColor ?? CustomPalette.BLACK,
          fontFamily: currentTheme?.typography?.fontFamily ?? "Roboto, sans-serif"
        }}
      >
        {t("Name of Schema")}
      </Typography>
      <Box
        sx={{
          textAlign: "left",
          width: "30rem",
          overflowY: "auto"
        }}
      >
        {schemaName}
      </Box>
      <Typography
        sx={{
          fontSize: 15,
          fontWeight: "bold",
          textAlign: "left",
          margin: "1rem 0 0.5rem 0",
          color: currentTheme?.secondaryColor ?? CustomPalette.BLACK,
          fontFamily: currentTheme?.typography?.fontFamily ?? "Roboto, sans-serif"
        }}
      >
        {t("Description")}
      </Typography>
      <Box
        sx={{
          textAlign: "left",
          width: "30rem"
        }}
      >
        {schemaDescriptionText}
      </Box>
      <Typography
        sx={{
          fontSize: 15,
          fontWeight: "bold",
          textAlign: "left",
          margin: "1rem 0 0.5rem 0",
          color: currentTheme?.secondaryColor ?? CustomPalette.BLACK,
          fontFamily: currentTheme?.typography?.fontFamily ?? "Roboto, sans-serif"
        }}
      >
        {t("Classification")}
      </Typography>
      <Box
        sx={{
          textAlign: "left",
          width: "30rem",
          overflowY: "auto"
        }}
      >
        {classification}
      </Box>
    </Box>
  );
}
