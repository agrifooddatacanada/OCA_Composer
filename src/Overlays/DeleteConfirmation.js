import { Box, Button, Typography } from "@mui/material";
import React from "react";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import { CustomPalette } from "../constants/customPalette";

const panelSx = (variant) => ({
  display: "flex",
  flexDirection: "column",
  justifyContent: "space-around",
  alignItems: "center",
  width: "40rem",
  minHeight: "15rem",
  p: 3,
  boxShadow: 20,
  borderRadius: "0.5rem",
  backgroundColor: CustomPalette.WHITE,
  border: "1px solid",
  borderColor: CustomPalette.PRIMARY,
  ...(variant === "overlay"
    ? {
        position: "absolute",
        left: "50%",
        top: "50%",
        zIndex: 100,
        transform: "translate(-50%, 0%)"
      }
    : {})
});

const DeleteConfirmation = ({
  removeFromSelected,
  closeModal,
  confirmationMessage = "Are you sure you want to remove this single feature?",
  variant = "overlay"
}) => {
  const inner = (
    <Box sx={panelSx(variant)}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          width: "100%",
          backgroundColor: CustomPalette.RED_100,
          mb: 2
        }}
      >
        <ErrorOutlineIcon
          sx={{
            color: CustomPalette.SECONDARY,
            p: 1,
            pl: 0,
            fontSize: 35
          }}
        />
        <Typography variant="body1" sx={{ p: 1, fontSize: 20 }}>
          WARNING: this action is irreversible.
        </Typography>
      </Box>

      <Typography variant="body1" sx={{ textAlign: "center", px: 1 }}>
        {confirmationMessage}
      </Typography>
      <Box sx={{ alignSelf: "flex-end" }}>
        <Button
          variant="outlined"
          color="navButton"
          onClick={() => closeModal()}
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
          Cancel
        </Button>
        <Button
          variant="contained"
          color="navButton"
          onClick={() => removeFromSelected()}
          sx={{
            mr: 2,
            backgroundColor: CustomPalette.PRIMARY,
            ":hover": { backgroundColor: CustomPalette.SECONDARY }
          }}
        >
          Continue
        </Button>
      </Box>
    </Box>
  );

  if (variant === "contained") return inner;
  return <Box style={{ position: "relative" }}>{inner}</Box>;
};

export default DeleteConfirmation;
