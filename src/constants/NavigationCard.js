import React from "react";
import { Box, Button, Typography } from "@mui/material";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import { CustomPalette } from "../constants/customPalette";

export default function NavigationCard({
  fieldArray,
  setShowCard,
  handleForward,
}) {
  const arrayDisplay = fieldArray.join(", ");

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
          borderColor: CustomPalette.BLUE_200,
        }}
      >
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            width: "100%",
            backgroundColor: CustomPalette.BLUE_100,
            mb: 2,
          }}
        >
          <ErrorOutlineIcon
            sx={{
              color: CustomPalette.BLUE_300,
              p: 1,
              pl: 0,
              fontSize: 35,
            }}
          />
          <Typography variant="body1" sx={{ p: 1, fontSize: 20 }}>
            There are one or more blank entries in the following field(s):
          </Typography>
        </Box>

        <Typography
          variant="h5"
          sx={{ width: "80%", fontSize: 19, wordBreak: "break-word" }}
        >
          <em>{arrayDisplay}</em>
        </Typography>
        <Typography variant="h6">Do you wish to continue?</Typography>
        <Box sx={{ alignSelf: "flex-end" }}>
          <Button
            variant="outlined"
            color="navButton"
            onClick={() => {
              setShowCard(false);
            }}
            sx={{ mr: 2 }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color="navButton"
            onClick={() => {
              handleForward();
            }}
            sx={{ mr: 2 }}
          >
            Continue
          </Button>
        </Box>
      </Box>
    </Box>
  );
}
