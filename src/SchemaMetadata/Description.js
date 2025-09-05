import { Box } from "@mui/material";
import React from "react";
import SchemaInput from "./SchemaInput";

export default function Description({ setShowIsoInput, setEditingLanguage, languages }) {
  return (
    <Box
      sx={{
        overflow: "auto",
        display: "flex",
        flexDirection: "column",
        width: "100%",
      }}
    >
      <Box sx={{ display: "flex", width: "max-content" }}>
        {languages.map((value, index) => (
          <SchemaInput
            language={value}
            key={value}
            setShowIsoInput={setShowIsoInput}
            setEditingLanguage={setEditingLanguage}
            index={index}
          />
        ))}
      </Box>
    </Box>
  );
}
