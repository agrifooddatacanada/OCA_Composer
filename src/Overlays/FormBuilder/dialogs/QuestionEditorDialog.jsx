import React, { useEffect, useState } from "react";
import { Dialog, DialogTitle, DialogContent, DialogActions, Box, Button, TextField, Typography, IconButton, Divider } from "@mui/material";
import { v4 as uuidv4 } from 'uuid';
import { Add as AddIcon, Delete as DeleteIcon } from "@mui/icons-material";
import { CustomPalette } from "../../../constants/customPalette";
import { useTranslation } from "react-i18next";
import {
  formatCodeBinaryDescription,
  formatCodeDateDescription,
  formatCodeNumericDescription,
  formatCodeTextDescription
} from "../../../constants/constants";

const findDescription = (formatText, attributeType) => {
  if (!formatText) return "";
  if (attributeType.includes("Date")) return formatCodeDateDescription[formatText] || "";
  if (attributeType.includes("Numeric"))
    return formatCodeNumericDescription[formatText] || "";
  if (attributeType.includes("Binary"))
    return formatCodeBinaryDescription[formatText] || "";
  if (attributeType.includes("Text")) return formatCodeTextDescription[formatText] || "";
  return formatText;
};

const QUESTION_TYPES = { TEXT: 'text', MULTIPLE_CHOICE: 'multiple_choice', CHECKBOX: 'checkbox', RADIO: 'radio', DROPDOWN: 'dropdown', NUMBER: 'number', EMAIL: 'email', DATE: 'date', TEXTAREA: 'textarea' };

const QuestionEditorDialog = ({ open, onClose, question, onSave, languages = ['English'] }) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({ 
    title: {}, 
    placeholder: {}, 
    formatText: '', 
    attributeType: '', 
    attribute: '',
    required: false, 
    options: [], 
    ...question 
  });
  
  useEffect(() => { 
    if (question) {
      const defaultTitle = {};
      const defaultPlaceholder = {};
      languages.forEach(lang => {
        defaultTitle[lang] = question.title?.[lang] || '';
        defaultPlaceholder[lang] = question.placeholder?.[lang] || '';
      });
      setFormData({ 
        title: defaultTitle,
        placeholder: defaultPlaceholder,
        formatText: question.formatText || '', 
        attributeType: question.attributeType || '', 
        attribute: question.attribute || '',
        required: question.required || false, 
        options: question.options || [], 
        ...question 
      }); 
    }
  }, [question, languages]);
  
  const handleSave = () => { onSave(formData); onClose(); };
  
  const handleFieldChange = (lang, field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: { ...prev[field], [lang]: value }
    }));
  };
  
  const handleAddOption = () => setFormData(prev => ({ ...prev, options: [...prev.options, { id: uuidv4(), label: '', value: '' }] }));
  const handleRemoveOption = (index) => setFormData(prev => ({ ...prev, options: prev.options.filter((_, i) => i !== index) }));
  const handleOptionChange = (index, field, value) => setFormData(prev => ({ ...prev, options: prev.options.map((o, i) => i === index ? { ...o, [field]: value } : o) }));
  const needsOptions = [QUESTION_TYPES.MULTIPLE_CHOICE, QUESTION_TYPES.CHECKBOX, QUESTION_TYPES.RADIO, QUESTION_TYPES.DROPDOWN].includes(formData.type);
  
  // Get format rule description
  const formatRuleDescription = findDescription(formData.formatText, formData.attributeType);
  
  // Check if placeholder is available for this attribute type (only Text and Array[Text])
  const isPlaceholderAvailable = formData.attributeType === "Text" || formData.attributeType === "Array[Text]";
  
  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ backgroundColor: CustomPalette.GREY_200, color: CustomPalette.GREY_800 }}>
        {t("Edit Question")}
      </DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          {/* Read-only fields */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 2 }}>
            <TextField 
              label={t("Attribute Name")}
              value={formData.attribute || 'N/A'} 
              fullWidth 
              disabled
              size="small"
              helperText={t("The underlying attribute identifier (read-only)")}
            />
            
            <TextField 
              label={t("Format Rule (from Format Rules)")}
              value={formatRuleDescription || formData.formatText || t("No format rule")} 
              fullWidth 
              disabled
              multiline
              size="small"
              helperText={t("This format rule was set in the Format Rules step (read-only)")}
            />
          </Box>

          <Divider />
          
          {/* Editable multilingual fields */}
          <Typography variant="subtitle1" sx={{ fontWeight: 600, color: CustomPalette.GREY_800 }}>{t("Question Labels (Multilingual)")}</Typography>
          
          {languages.map(lang => (
            <Box key={lang} sx={{ pl: 2, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 500, color: CustomPalette.PRIMARY }}>{lang}</Typography>
              
              <TextField 
                label={`${t("Question Label")} (${lang})`}
                value={formData.title?.[lang] || ''} 
                onChange={(e) => handleFieldChange(lang, 'title', e.target.value)} 
                fullWidth 
                size="small"
                helperText={t("Question label for this language")}
              />
              
              {isPlaceholderAvailable && (
                <TextField 
                  label={`${t("Placeholder")} (${lang})`}
                  value={formData.placeholder?.[lang] || ''} 
                  onChange={(e) => handleFieldChange(lang, 'placeholder', e.target.value)} 
                  fullWidth 
                  size="small"
                  helperText={t("Placeholder text for this language (only for Text and Array[Text] types)")}
                />
              )}
            </Box>
          ))}
          
          {needsOptions && formData.options && formData.options.length > 0 && (
            <>
              <Divider />
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>{t("Options (Read-only)")}</Typography>
                {formData.options.map((option, index) => (
                  <Box key={option.id || index} sx={{ display: 'flex', gap: 1, mb: 1 }}>
                    <TextField label={t("Label")} value={option.label} size="small" sx={{ flexGrow: 1 }} disabled />
                    <TextField label={t("Value")} value={option.value} size="small" sx={{ flexGrow: 1 }} disabled />
                  </Box>
                ))}
              </Box>
            </>
          )}
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

export default QuestionEditorDialog;


