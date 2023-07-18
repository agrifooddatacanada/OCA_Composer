import React from "react";
import { Box, Typography } from "@mui/material";
import { CustomPalette } from "../constants/customPalette";
import CodeGrid from "./CodeGrid";

export default function SingleTable({ attribute, index, codeRefs, chosenTable, setChosenTable }) {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
      }}
    >
      <Typography
        sx={{
          fontSize: 20,
          fontWeight: "bold",
          textAlign: "left",
          margin: "1rem 0 1rem 0",
          color: CustomPalette.PRIMARY,
        }}
      >
        {attribute.Attribute}
      </Typography>
      <CodeGrid index={index} codeRefs={codeRefs} chosenTable={chosenTable} setChosenTable={setChosenTable} />
    </Box>
  );
}
