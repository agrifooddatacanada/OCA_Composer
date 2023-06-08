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
      <TextField
        InputProps={{
          readOnly: true,
          style: {
            height: "2rem",
            width: "30rem",
          },
        }}
        value={schemaDescription[currentLanguage].name}
      />
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
      <TextField
        InputProps={{
          readOnly: true,
          style: {
            height: "8rem",
            width: "30rem",
          },
        }}
        multiline={true}
        rows="5"
        value={schemaDescription[currentLanguage].description}
      />
    </Box>
  );
}
