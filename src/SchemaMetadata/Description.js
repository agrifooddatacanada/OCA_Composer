import { Box } from "@mui/material";
import React from "react";
import SchemaInput from "./SchemaInput";
import Classification from "./Classification";

export default function Description({ setShowIsoInput, setEditingLanguage, languages, setLanguages }) {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", width: "100%" }}>
      <Classification />
      <Box
        sx={{
          overflowX: "auto",
          overflowY: "visible",
          width: "100%",
        }}
      >
        <Box sx={{ display: "flex", width: "max-content" }}>
          {languages.map((value) => (
            <SchemaInput
              language={value}
              key={value}
              setShowIsoInput={setShowIsoInput}
              setEditingLanguage={setEditingLanguage}
              languages={languages}
              setLanguages={setLanguages}
            />
          ))}
        </Box>
      </Box>
    </Box>
  );
}
