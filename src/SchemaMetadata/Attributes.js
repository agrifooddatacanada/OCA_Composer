import React, { useContext } from "react";
import { Box, Typography } from "@mui/material";
import { CustomPalette } from "../constants/customPalette";
import { Context } from "../App";

export default function Attributes() {
  const { attributesList } = useContext(Context);
  return (
    <Box sx={{ width: "100%", overflow: "auto", display: "flex" }}>
      {attributesList.map((value, index) => (
        <Box
          bgcolor={CustomPalette.BLUE_200}
          color={CustomPalette.BLUE_900}
          sx={{
            padding: "0.4rem 5rem 0.4rem 5rem",
            marginBottom: "1rem",
            marginRight: "0.2rem",
            boxShadow: `0px 0px 2px ${CustomPalette.BLUE_300} inset`,
            borderRadius: "0.1rem",
          }}
          key={index}
        >
          <Typography sx={{ fontWeight: "bold" }}>{value}</Typography>
        </Box>
      ))}
    </Box>
  );
}
