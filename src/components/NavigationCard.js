import React from "react";
import { Box, Button, Typography } from "@mui/material";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import { useTranslation } from "react-i18next";
import { CustomPalette } from "../constants/customPalette";

export default function NavigationCard({ setShowCard, handleForward }) {
  const { t } = useTranslation();

  return (
    <Box style={{ position: "relative" }}>
      <Box
        sx={{
          position: "absolute",
          left: "50%",
          top: "50%",
          zIndex: 100,
          transform: "translate(-50%, 0%)",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-around",
          alignItems: "center",
          width: "40rem",
          minHeight: "12rem",
          p: 3,
          boxShadow: 20,
          borderRadius: "0.5rem",
          backgroundColor: CustomPalette.WHITE,
          border: "1px solid",
          borderColor: CustomPalette.PRIMARY
        }}
      >
        <Box
          sx={{
            display: "flex",
            flexDirection: "row",
            justifyContent: "flex-start",
            alignItems: "center",
            gap: 1.5,
            width: "100%",
            backgroundColor: CustomPalette.RED_100,
            mb: 2,
            px: 2,
            py: 1.5
          }}
        >
          <ErrorOutlineIcon
            sx={{
              color: CustomPalette.SECONDARY,
              flexShrink: 0,
              fontSize: 35
            }}
          />
          <Typography variant="body1" sx={{ fontSize: 20, flex: 1, minWidth: 0 }}>
            {t("Schema description is empty. Continue without it?")}
          </Typography>
        </Box>
        <Box sx={{ alignSelf: "flex-end" }}>
          <Button
            variant="outlined"
            color="navButton"
            onClick={() => {
              setShowCard(false);
            }}
            sx={{
              mr: 2,
              color: CustomPalette.PRIMARY,
              borderColor: CustomPalette.PRIMARY,
              ":hover": {
                borderColor: CustomPalette.SECONDARY,
                color: CustomPalette.SECONDARY
              }
            }}
          >
            {t("Cancel")}
          </Button>
          <Button
            variant="contained"
            color="navButton"
            onClick={() => {
              handleForward();
            }}
            sx={{
              mr: 2,
              backgroundColor: CustomPalette.PRIMARY,
              ":hover": { backgroundColor: CustomPalette.SECONDARY }
            }}
          >
            {t("Continue")}
          </Button>
        </Box>
      </Box>
    </Box>
  );
}
