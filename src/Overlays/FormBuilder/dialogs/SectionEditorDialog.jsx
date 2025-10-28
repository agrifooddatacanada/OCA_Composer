import React, { useEffect, useState } from "react";
import { Box, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import { MAX_ATTR_LABEL_CHARS, MAX_ATTR_DESCRIPTION_CHARS } from "../../../constants/constants";
import BaseEditorDialog from "./BaseEditorDialog";
import MultilingualFieldGroup from "./MultilingualFieldGroup";

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
  
  const handleFieldChange = (lang, field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: { ...prev[field], [lang]: value }
    }));
  };
  
  return (
    <BaseEditorDialog
      open={open}
      onClose={onClose}
      title={t("Edit Section")}
      onSave={handleSave}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
          {t("Section Labels")}
        </Typography>
        
        <MultilingualFieldGroup
          languages={languages}
          formData={formData}
          fields={[
            { 
              name: 'labels', 
              label: t("Section Label"), 
              maxLength: MAX_ATTR_LABEL_CHARS 
            },
            { 
              name: 'descriptions', 
              label: t("Description"), 
              maxLength: MAX_ATTR_DESCRIPTION_CHARS,
              multiline: true,
              rows: 2
            }
          ]}
          onChange={handleFieldChange}
        />
      </Box>
    </BaseEditorDialog>
  );
};

export default SectionEditorDialog;


