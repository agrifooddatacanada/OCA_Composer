import React, { useContext } from "react";
import { Box } from "@mui/system";
import { TextField, Typography } from "@mui/material";
import { Context } from "../App";

export default function SchemaDescription({ currentLanguage }) {
  const { schemaDescription } = useContext(Context);
  return (
    <Box>
      <Typography
        sx={{
          fontSize: 15,
          fontWeight: "bold",
          textAlign: "left",
          margin: "1rem 0 0.5rem 0",
        }}
      >
        Name of Schema
      </Typography>
      <Box sx={{
        textAlign: 'left',
        width: "30rem",
        overflowY: 'auto'
      }}>
        {schemaDescription[currentLanguage].name}
      </Box>
      <Typography
        sx={{
          fontSize: 15,
          fontWeight: "bold",
          textAlign: "left",
          margin: "1rem 0 0.5rem 0",
        }}
      >
        Description
      </Typography>
      <Box sx={{
        textAlign: 'left',
        height: "8rem",
        width: "30rem",
        overflowY: 'auto'
      }}>
        {schemaDescription[currentLanguage].description}
      </Box>
    </Box>
  );
}
