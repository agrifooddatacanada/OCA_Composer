import React from "react";
import { Box } from "@mui/material";
import { CustomPalette } from "../constants/customPalette";

const Spinner = ({ text = "Loading...", size = 32 }) => (
  <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", py: 4 }}>
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 3
      }}
    >
      <Box
        sx={{
          width: size,
          height: size,
          border: `3px solid ${CustomPalette.GREY_300}`,
          borderTop: `3px solid ${CustomPalette.PRIMARY}`,
          borderRadius: "50%",
          animation: "spin 1s linear infinite",
          "@keyframes spin": {
            "0%": { transform: "rotate(0deg)" },
            "100%": { transform: "rotate(360deg)" }
          }
        }}
      />
      <Box sx={{ color: CustomPalette.PRIMARY, fontWeight: 500, fontSize: "1.1rem" }}>
        {text}
      </Box>
    </Box>
  </Box>
);

export default Spinner;
