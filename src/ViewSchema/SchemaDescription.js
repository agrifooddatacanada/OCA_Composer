import React, { useContext } from "react";
import { Box } from "@mui/system";
import { Typography } from "@mui/material";
import { Context } from "../App";
import { useTranslation } from "react-i18next";
import { CustomPalette } from "../constants/customPalette";

export default function SchemaDescription({ currentLanguage }) {
  const { t } = useTranslation();
  const { schemaDescription, divisionGroup, currentTheme } = useContext(Context);
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
        {t('Name of Schema')}
      </Typography>
      <Box sx={{
        textAlign: 'left',
        width: "30rem",
        overflowY: 'auto'
      }}>
        {schemaDescription[currentLanguage].name}
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
        {t('Description')}
      </Typography>
      <Box sx={{
        textAlign: 'left',
        width: "30rem",
      }}>
        {schemaDescription[currentLanguage].description}
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
        {t('Classification')}
      </Typography>
      <Box sx={{
        textAlign: 'left',
        width: "30rem",
        overflowY: 'auto'
      }}>
        {divisionGroup.group || divisionGroup.division}
      </Box>
    </Box>
  );
}
