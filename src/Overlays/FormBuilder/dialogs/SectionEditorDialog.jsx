import React, { useEffect, useState } from "react";
import { Dialog, DialogTitle, DialogContent, DialogActions, Box, Button, TextField, Typography, Divider } from "@mui/material";
import { CustomPalette } from "../../../constants/customPalette";
import { useTranslation } from "react-i18next";

const SectionEditorDialog = ({ open, onClose, section, onSave, languages = ['English'] }) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({ 
    labels: {},
    descriptions: {},
    ...section 
  });
  
  useEffect(() => { 
    if (section) {
      const defaultLabels = {};
      const defaultDescriptions = {};
      languages.forEach(lang => {
        defaultLabels[lang] = section.labels?.[lang] || '';
        defaultDescriptions[lang] = section.descriptions?.[lang] || '';
      });
      setFormData({ 
        labels: defaultLabels,
        descriptions: defaultDescriptions,
        ...section 
      }); 
    }
  }, [section, languages]);
  
  const handleSave = () => { onSave(formData); onClose(); };
  
  const handleLabelChange = (lang, field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: { ...prev[field], [lang]: value }
    }));
  };
  
  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ backgroundColor: CustomPalette.GREY_200, color: CustomPalette.GREY_800 }}>
        {t("Edit Section")}
      </DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, color: CustomPalette.GREY_800 }}>{t("Section Labels")}</Typography>
          
          {languages.map(lang => (
            <Box key={lang} sx={{ pl: 2, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 500, color: CustomPalette.PRIMARY }}>{lang}</Typography>
              
              <TextField 
                label={`${t("Section Label")}`}
                value={formData.labels?.[lang] || ''} 
                onChange={(e) => handleLabelChange(lang, 'labels', e.target.value)} 
                fullWidth 
                size="small"
                // helperText={t("Section label for this language")}
              />
              
              <TextField 
                label={`${t("Description")}`}
                value={formData.descriptions?.[lang] || ''} 
                onChange={(e) => handleLabelChange(lang, 'descriptions', e.target.value)} 
                fullWidth 
                size="small"
                multiline
                rows={2}
                // helperText={t("Descriptive description text")}
              />
            </Box>
          ))}
        </Box>
      </DialogContent>
      <DialogActions sx={{ backgroundColor: CustomPalette.GREY_200, px: 3, py: 2 }}>
        <Button 
          onClick={onClose}
          sx={{ color: CustomPalette.GREY_600 }}
        >
          {t("Cancel")}
        </Button>
        <Button 
          onClick={handleSave} 
          variant="contained" 
          color="button"
          sx={{ 
            backgroundColor: CustomPalette.PRIMARY,
            '&:hover': {
              backgroundColor: CustomPalette.DARK
            }
          }}
        >
          {t("Save")}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SectionEditorDialog;


