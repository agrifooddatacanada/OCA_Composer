import React from "react";
import { Box, Typography, TextField } from "@mui/material";
import { CustomPalette } from "../../../constants/customPalette";

const MultilingualFormField = ({ 
  languages, 
  formData, 
  fieldName, 
  label, 
  onChange, 
  maxLength,
  multiline = false,
  rows = 1,
  helperText,
  size = "small"
}) => {
  return (
    <>
      {languages.map(lang => (
        <Box key={lang} sx={{ pl: 2, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 500, color: CustomPalette.PRIMARY }}>
            {lang}
          </Typography>
          
          <TextField 
            label={label}
            value={formData[fieldName]?.[lang] || ''} 
            onChange={(e) => onChange(lang, fieldName, e.target.value)} 
            fullWidth 
            size={size}
            multiline={multiline}
            rows={multiline ? rows : undefined}
            inputProps={{ maxLength }}
            helperText={helperText}
          />
        </Box>
      ))}
    </>
  );
};

export default MultilingualFormField;
