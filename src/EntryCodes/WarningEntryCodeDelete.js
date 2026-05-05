import React from "react";
import { Box, Button, Typography } from "@mui/material";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import { CustomPalette } from "../constants/customPalette";
import { useTranslation } from "react-i18next";

function WarningEntryCodeDelete({
  title,
  fieldArray,
  setShowCard,
  handleForward,
}) {
  const { t } = useTranslation();
  const arrayDisplay = fieldArray.join(", ");

  return (
    <Box
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        zIndex: 50,
        backdropFilter: "blur(5px)",
        backgroundColor: "rgba(0, 0, 0, 0.3)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <Box
        sx={{
          position: "absolute",
          top: 150,
          zIndex: 100,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-around",
          alignItems: "center",
          width: "40rem",
          height: "20rem",
          p: 3,
          boxShadow: 20,
          borderRadius: "0.5rem",
          backgroundColor: CustomPalette.WHITE,
          border: "1px solid",
          borderColor: CustomPalette.RED_100,
          // animation: appearAnimation,
        }}
      >
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            width: "100%",
            backgroundColor: CustomPalette.RED_100,

          }}
        >
          <ErrorOutlineIcon
            sx={{
              color: CustomPalette.SECONDARY,
              p: 1,
              pl: 0,
              fontSize: 35,
            }}
          />
          <Typography variant="body1" sx={{ p: 1, fontSize: 20 }}>
            {title}
          </Typography>
        </Box>

        <Typography
          variant="h5"
          sx={{ width: "80%", fontSize: 19, wordBreak: "break-word" }}
        >
          <em>{arrayDisplay}</em>
        </Typography>
        <Typography variant="h6">{t('Do you wish to continue?')}</Typography>
        <Box sx={{ alignSelf: "flex-end" }}>
          <Button
            variant="outlined"
            color="navButton"
            onClick={() => {
              setShowCard(false);
            }}
            sx={{ mr: 2, color: CustomPalette.PRIMARY, borderColor: CustomPalette.PRIMARY, ":hover": { borderColor: CustomPalette.SECONDARY, color: CustomPalette.SECONDARY } }}
          >
            {t('Cancel')}
          </Button>
          <Button
            variant="contained"
            color="navButton"
            onClick={() => {
              handleForward();
            }}
            sx={{ mr: 2, backgroundColor: CustomPalette.PRIMARY, ":hover": { backgroundColor: CustomPalette.SECONDARY } }}
          >
            {t('Continue')}
          </Button>
        </Box>
      </Box>
    </Box>
  );
}


export default WarningEntryCodeDelete;