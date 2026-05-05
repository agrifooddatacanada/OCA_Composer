import React from "react";
import { Box, Typography, TextField } from "@mui/material";
import { CustomPalette } from "../../../constants/customPalette";

const MultilingualFieldGroup = ({ 
  languages, 
  formData, 
  fields, // Array of field configurations: [{ name: 'labels', label: 'Label', maxLength: 100, multiline: false, rows: 1 }]
  onChange
}) => {
  return (
    <>
      {languages.map(lang => (
        <Box key={lang} sx={{ pl: 2, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 500, color: CustomPalette.PRIMARY }}>
            {lang}
          </Typography>
          
          {fields.map(field => (
            <TextField 
              key={field.name}
              label={field.label}
              value={formData[field.name]?.[lang] ?? ''} 
              onChange={(e) => onChange(lang, field.name, e.target.value)} 
              fullWidth 
              size="small"
              multiline={field.multiline || false}
              rows={field.multiline ? (field.rows || 1) : undefined}
              inputProps={{ maxLength: field.maxLength }}
              helperText={field.helperText}
            />
          ))}
        </Box>
      ))}
    </>
  );
};

export default MultilingualFieldGroup;
