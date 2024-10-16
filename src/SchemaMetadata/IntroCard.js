import React from "react";
import { Box, Button, ListItem, Typography, List } from "@mui/material";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import CloseIcon from "@mui/icons-material/Close";
import { CustomPalette } from "../constants/customPalette";
import { useTranslation } from "react-i18next";

export default function IntroCard({ setShowIntroCard }) {
  const { t } = useTranslation();
  const appearAnimation =
    "fade-in 0.5s ease forwards; @keyframes fade-in {0% {opacity: 0;transform: translate(-50%, 0%) scale(0.5);}100% {opacity: 1;transform: translate(-50%, 0%) scale(1);}}";
  return (
    <Box
      style={{
        position: "absolute",
        top: 0,
        width: "100vw",
        height: "100vh",
        zIndex: 50,
        backdropFilter: "blur(5px)",
        backgroundColor: "rgba(0, 0, 0, 0.3)",
      }}
    >
      <Box
        sx={{
          position: "absolute",
          left: "50%",
          top: 150,
          zIndex: 100,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-around",
          alignItems: "center",
          width: "40rem",
          height: "25rem",
          p: 3,
          boxShadow: 20,
          borderRadius: "0.5rem",
          backgroundColor: CustomPalette.WHITE,
          border: "1px solid",
          borderColor: CustomPalette.RED_100,
          animation: appearAnimation,
        }}
      >
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            width: "100%",
            backgroundColor: CustomPalette.RED_100,
            mb: 2,
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
        </Box>
        <Typography variant="h5" sx={{ p: 1 }}>
          {t('This program lets you create OCA schema templates')}
        </Typography>
        <Typography variant="h6" sx={{ p: 1 }}>
          <strong>{t('A well formed template MUST include')}</strong>
        </Typography>
        <List
          sx={{
            listStyleType: "disc",
            pl: 2,
            mb: 2,
            "& .MuiListItem-root": {
              display: "list-item",
            },
          }}
        >
          <ListItem variant="body1" sx={{ p: 1, fontSize: 18 }}>
            {t('a complete')} <strong>{t('schema description')}</strong> {t('in at least one language')}
          </ListItem>
          <ListItem variant="body1" sx={{ p: 1, fontSize: 18 }}>
            <strong>{t('data types')}</strong> {t('for every attribute')}
          </ListItem>
        </List>
        <Button
          variant="contained"
          color="navButton"
          onClick={() => {
            setShowIntroCard(false);
          }}
          sx={{
            width: "18rem",
            display: "flex",
            justifyContent: "space-around",
            backgroundColor: CustomPalette.PRIMARY,
            ":hover": {
              backgroundColor: CustomPalette.SECONDARY,
            }
          }}
        >
          {t("close and don't show again")}
          <CloseIcon fontSize="small" />
        </Button>
      </Box>
    </Box>
  );
}
