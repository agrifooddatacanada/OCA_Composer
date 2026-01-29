import { Box } from "@mui/material";
import React, { useContext } from "react";
import { Context } from "../App";
import SchemaInput from "./SchemaInput";

export default function Description({ setShowIsoInput, setEditingLanguage, languages, setLanguages }) {
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
            languages={languages}
            setLanguages={setLanguages}
          />
        ))}
      </Box>
    </Box>
  );
}
