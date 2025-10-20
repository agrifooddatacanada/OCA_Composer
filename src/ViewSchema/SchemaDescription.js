import React, { useContext } from "react";
import { Box, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import { CustomPalette } from "../constants/customPalette";
import { Context } from "../App";

export default function SchemaDescription({ currentLanguage }) {
  const { t } = useTranslation();
  const { schemaDescription, divisionGroup } = useContext(Context);
  const { currentTheme } = useContext(Context);
  const schemaName = schemaDescription?.[currentLanguage]?.name || t("Unknown");
  const schemaDescriptionText =
    schemaDescription?.[currentLanguage]?.description || t("No description available");
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
