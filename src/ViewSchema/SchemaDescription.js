import React, { useContext } from "react";
import { Box, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import { Context } from "../App";
import { useMultiSchema } from "../context/MultiSchemaContext";

export default function SchemaDescription({ currentLanguage }) {
  const { t, i18n } = useTranslation();
  const { divisionGroup } = useContext(Context);
  // Use MultiSchema context with standard pattern
  const { activeSchemaId, getSchemaState } = useMultiSchema();
  
  const currentSchemaId = activeSchemaId;
  const schemaState = getSchemaState(currentSchemaId);

  // Use current schema state's metadata
  const currentMeta = schemaState?.metadata || {};
  
  // Convert display language to ISO language code
  const langKey =
    currentLanguage?.toLowerCase() === "english"
      ? "eng"
      : currentLanguage?.toLowerCase() === "french"
        ? "fra"
        : currentLanguage?.toLowerCase();
  
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
          margin: "1rem 0 0.5rem 0"
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
          margin: "1rem 0 0.5rem 0"
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
          margin: "1rem 0 0.5rem 0"
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
