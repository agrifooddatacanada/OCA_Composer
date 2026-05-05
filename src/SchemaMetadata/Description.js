import { Box } from "@mui/material";
import React, { useContext } from "react";
import { Context } from "../App";
import SchemaInput from "./SchemaInput";

export default function Description({ setShowIsoInput, setEditingLanguage }) {
  const { languages } = useContext(Context);

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
