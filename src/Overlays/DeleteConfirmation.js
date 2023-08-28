import { Box, Button, Typography } from '@mui/material';
import React from 'react';
import { CustomPalette } from '../constants/customPalette';
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";

const DeleteConfirmation = ({ removeFromSelected, closeModal }) => {
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
          minHeight: "15rem",
          p: 3,
          boxShadow: 20,
          borderRadius: "0.5rem",
          backgroundColor: CustomPalette.WHITE,
          border: "1px solid",
          borderColor: CustomPalette.PRIMARY,
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
          <Typography variant="body1" sx={{ p: 1, fontSize: 20 }}>
            WARNING: this action is irreversible.
          </Typography>
        </Box>

        <Typography variant="h6">Are you sure you want to delete this item?</Typography>
        <Box sx={{ alignSelf: "flex-end" }}>
          <Button
            variant="outlined"
            color="navButton"
            onClick={() => closeModal()}
            sx={{ mr: 2, color: CustomPalette.PRIMARY, borderColor: CustomPalette.PRIMARY, ":hover": { borderColor: CustomPalette.SECONDARY, color: CustomPalette.SECONDARY } }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color="navButton"
            onClick={() => removeFromSelected()}
            sx={{ mr: 2, backgroundColor: CustomPalette.PRIMARY, ":hover": { backgroundColor: CustomPalette.SECONDARY } }}
          >
            Continue
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

export default DeleteConfirmation;