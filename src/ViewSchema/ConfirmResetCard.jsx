import React from "react";
import { Box, Button, Typography } from "@mui/material";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import { useTranslation } from "react-i18next";
import { CustomPalette } from "../constants/customPalette";

export default function ConfirmResetCard({ onConfirm, onCancel }) {
  const { t } = useTranslation();
  // Inline keyframes string used by MUI's sx/style to animate the card's appearance
  const appearAnimation =
    "fade-in 0.3s ease forwards; @keyframes fade-in {0% {opacity: 0; transform: scale(0.95);} 100% {opacity: 1; transform: scale(1);} }";
  return (
    // Full-screen backdrop overlay that centers the confirmation card
    <Box style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, zIndex: 50, backdropFilter: "blur(5px)", backgroundColor: "rgba(0, 0, 0, 0.3)" }} sx={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
      {/* Centered card container with subtle entrance animation */}
      <Box sx={{ zIndex: 100, display: "flex", flexDirection: "column", justifyContent: "space-around", alignItems: "center", width: "40rem", maxWidth: "90vw", minHeight: "20rem", p: 3, boxShadow: 20, borderRadius: "0.5rem", backgroundColor: CustomPalette.WHITE, border: "1px solid", borderColor: CustomPalette.RED_100, animation: appearAnimation }}>
        {/* Warning header strip with icon to emphasize destructive action */}
        <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", width: "100%", backgroundColor: CustomPalette.RED_100, mb: 2 }}>
          <ErrorOutlineIcon sx={{ color: CustomPalette.SECONDARY, p: 1, pl: 0, fontSize: 35 }} />
        </Box>
        {/* Title and supporting message (localized via i18n) */}
        <Typography variant="h5" sx={{ p: 1, textAlign: "center" }}>
          {t("Are you sure you want to clear all data?")}
        </Typography>
        <Typography variant="body1" sx={{ p: 1, textAlign: "center", color: CustomPalette.GREY_700 }}>
          {t("This action cannot be undone.")}
        </Typography>
        {/* Action buttons: confirm (primary) and cancel */}
        <Box sx={{ display: "flex", gap: 2, mt: 2 }}>
          <Button variant="contained" color="navButton" onClick={onConfirm} sx={{ width: "12rem", display: "flex", justifyContent: "center", backgroundColor: CustomPalette.PRIMARY, ":hover": { backgroundColor: CustomPalette.SECONDARY } }}>
            {t("Confirm")}
          </Button>
          <Button variant="outlined" color="warning" onClick={onCancel} sx={{ width: "12rem", display: "flex", justifyContent: "center" }}>
            {t("Cancel")}
          </Button>
        </Box>
      </Box>
    </Box>
  );
}
