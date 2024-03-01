import React, { useContext } from "react";
import { Box, Button, Typography } from "@mui/material";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import CloseIcon from "@mui/icons-material/Close";
import { CustomPalette } from "../constants/customPalette";
import { Context } from "../App";

export default function DepreciatedWarningCard() {
  const { setShowDeprecationCard } = useContext(Context);
  const appearAnimation =
    "fade-in 0.5s ease forwards; @keyframes fade-in {0% {opacity: 0;transform: translate(-50%, 0%) scale(0.5);}100% {opacity: 1;transform: translate(-50%, 0%) scale(1);}}";
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
          height: "20rem",
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
          OCA bundles of type .zip are being deprecated starting Jan 2024
        </Typography>

        <Button
          variant="contained"
          color="navButton"
          onClick={() => setShowDeprecationCard(false)}
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
          close and don't show again
          <CloseIcon fontSize="small" />
        </Button>
      </Box>
    </Box>
  );
}
