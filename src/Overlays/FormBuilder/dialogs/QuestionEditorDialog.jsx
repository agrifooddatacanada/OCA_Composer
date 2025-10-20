import React, { useEffect, useState } from "react";
import { 
  Dialog, DialogTitle, DialogContent, DialogActions, Box, Button, TextField, 
  Typography, IconButton, Divider, FormControl, InputLabel, Select, MenuItem,
  FormControlLabel, Checkbox
} from "@mui/material";
import { v4 as uuidv4 } from 'uuid';
import { Add as AddIcon, Delete as DeleteIcon } from "@mui/icons-material";
import { CustomPalette } from "../../../constants/customPalette";
import { useTranslation } from "react-i18next";
import {
  formatCodeBinaryDescription,
  formatCodeDateDescription,
  formatCodeNumericDescription,
  formatCodeTextDescription,
  ALLOWED_BOOLEAN_VALUES,
  MAX_ATTR_LABEL_CHARS
} from "../../../constants/constants";
import { getDateTimePickerConfig } from "../utils/getDateTimePickerConfig";

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
    booleanValues: null, // For custom boolean value selection
    ...question 
  });
  
  useEffect(() => { 
    if (question) {
      const defaultTitle = {};
      const defaultPlaceholder = {};
      
      // For DateTime types, get default placeholder from format rule
      const isDateTimeType = question.attributeType === 'DateTime' || question.attributeType === 'Array[DateTime]';
      let dateTimeDefaultPlaceholder = '';
      
      if (isDateTimeType && question.formatText) {
        const formatDescription = findDescription(question.formatText, question.attributeType);
        if (formatDescription) {
          const config = getDateTimePickerConfig(formatDescription);
          dateTimeDefaultPlaceholder = config.displayFormat;
        }
      }
      
      languages.forEach(lang => {
        defaultTitle[lang] = question.title?.[lang] || '';
        // Use existing placeholder or DateTime default
        defaultPlaceholder[lang] = question.placeholder?.[lang] || (isDateTimeType ? dateTimeDefaultPlaceholder : '');
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
  
  const formatRuleDescription = findDescription(formData.formatText, formData.attributeType);
  
  const isPlaceholderAvailable = ["Text", "Array[Text]", "DateTime", "Array[DateTime]", "Numeric", "Array[Numeric]"].includes(formData.attributeType);
  
  const hasOptions = formData.options && formData.options.length > 0;
  const isArray = formData.attributeType?.startsWith('Array[');
  
  const getAllInputTypeOptions = () => {
    return [
      { 
        category: 'Single-select Options', 
        options: [
          { value: 'radio-single', label: 'Radio Buttons (Single-select)' },
          { value: 'checkbox-single', label: 'Checkboxes (Single-select)' },
          { value: 'dropdown-single', label: 'Dropdown Select (Single-select)' },
          { value: 'datalist-single', label: 'Datalist - Searchable (Single-select)' },
          { value: 'toggle-single', label: 'Toggle Buttons (Single-select)' },
          { value: 'slider', label: 'Range Slider' }
        ]
      },
      { 
        category: 'Multi-select Options', 
        options: [
          { value: 'checkbox-multi', label: 'Checkboxes (Multi-select)' },
          { value: 'radio-multi', label: 'Radio Buttons (Multi-select)' },
          { value: 'dropdown-multi', label: 'Dropdown with Multi-select' },
          { value: 'toggle-multi', label: 'Toggle Buttons (Multi-select)' },
          { value: 'datalist-multi', label: 'Datalist - Searchable (Multi-select)' }
        ]
      }
    ];
  };
  
  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ backgroundColor: CustomPalette.GREY_200, color: CustomPalette.GREY_800 }}>
        {t("Edit Question")}
      </DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          {/* Read-only fields */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 2 }}>
            {/* <TextField 
              label={t("Attribute Name")}
              value={formData.attribute || 'N/A'} 
              fullWidth 
              disabled
              size="small"
              // helperText={t("The underlying attribute identifier (read-only)")}
            /> */}
            
            <TextField 
              label={t("Format Rule")}
              value={formatRuleDescription || formData.formatText || t("No format rule")} 
              fullWidth 
              disabled
              multiline
              size="small"
              // helperText={t("This format rule was set in the Format Rules step (read-only)")}
            />
          </Box>
          
          {/* Input Type Selection for List-type Questions */}
          {hasOptions && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, color: CustomPalette.GREY_800, mb: 2 }}>
                {t("Input Type")}
              </Typography>
              <FormControl fullWidth size="small">
                <InputLabel>{t("Select Input Type")}</InputLabel>
                <Select
                  value={formData.inputType || (isArray ? 'checkbox-multi' : 'radio-single')}
                  label={t("Select Input Type")}
                  onChange={(e) => setFormData(prev => ({ ...prev, inputType: e.target.value }))}
                >
                  {getAllInputTypeOptions().map((group) => [
                    <MenuItem 
                      key={group.category} 
                      disabled 
                      sx={{ 
                        fontWeight: 600, 
                        backgroundColor: CustomPalette.GREY_100,
                        '&.Mui-disabled': {
                          opacity: 1
                        }
                      }}
                    >
                      {t(group.category)}
                    </MenuItem>,
                    ...group.options.map(option => (
                      <MenuItem key={option.value} value={option.value} sx={{ pl: 4 }}>
                        {t(option.label)}
                      </MenuItem>
                    ))
                  ])}
                </Select>
              </FormControl>
              <Typography variant="caption" sx={{ color: CustomPalette.GREY_600, display: 'block', mt: 1 }}>
                {t("Choose how users will interact with the entry code options. You can select single-select (one choice) or multi-select (multiple choices).")}
              </Typography>
            </Box>
          )}
          
          {/* Boolean Value Selection */}
          {(formData.attributeType === 'Boolean' || formData.attributeType === 'Array[Boolean]') && !hasOptions && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, color: CustomPalette.GREY_800, mb: 1 }}>
                {t("Boolean Value Options")}
              </Typography>
              <Typography variant="caption" sx={{ color: CustomPalette.GREY_600, display: 'block', mb: 2 }}>
                {formData.attributeType === 'Boolean' 
                  ? t("Select any two values from the allowed boolean values") 
                  : t("Select which boolean values to show as options")}
              </Typography>
              
              {formData.attributeType === 'Boolean' ? (
                // For Boolean: Select exactly 2 values
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <FormControl fullWidth size="small">
                    <InputLabel>{t("First Option")}</InputLabel>
                    <Select
                      value={formData.booleanValues?.[0] || 'True'}
                      label={t("First Option")}
                      onChange={(e) => {
                        const newValues = formData.booleanValues ? [...formData.booleanValues] : ['True', 'False'];
                        newValues[0] = e.target.value;
                        setFormData(prev => ({ ...prev, booleanValues: newValues }));
                      }}
                    >
                      {ALLOWED_BOOLEAN_VALUES.map((value) => (
                        <MenuItem 
                          key={value} 
                          value={value}
                          disabled={formData.booleanValues?.[1] === value}
                        >
                          {value}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  
                  <FormControl fullWidth size="small">
                    <InputLabel>{t("Second Option")}</InputLabel>
                    <Select
                      value={formData.booleanValues?.[1] || 'False'}
                      label={t("Second Option")}
                      onChange={(e) => {
                        const newValues = formData.booleanValues ? [...formData.booleanValues] : ['True', 'False'];
                        newValues[1] = e.target.value;
                        setFormData(prev => ({ ...prev, booleanValues: newValues }));
                      }}
                    >
                      {ALLOWED_BOOLEAN_VALUES.map((value) => (
                        <MenuItem 
                          key={value} 
                          value={value}
                          disabled={formData.booleanValues?.[0] === value}
                        >
                          {value}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>
              ) : (
                // For Array[Boolean]: Select multiple values
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {ALLOWED_BOOLEAN_VALUES.map((value) => (
                    <FormControlLabel
                      key={value}
                      control={
                        <Checkbox
                          checked={formData.booleanValues ? formData.booleanValues.includes(value) : ['True', 'False', 'Yes', 'No', '1', '0'].includes(value)}
                          onChange={(e) => {
                            const currentValues = formData.booleanValues || ['True', 'False', 'Yes', 'No', '1', '0'];
                            const newValues = e.target.checked 
                              ? [...currentValues, value]
                              : currentValues.filter(v => v !== value);
                            setFormData(prev => ({ ...prev, booleanValues: newValues }));
                          }}
                          sx={{
                            color: CustomPalette.PRIMARY,
                            '&.Mui-checked': {
                              color: CustomPalette.PRIMARY
                            }
                          }}
                        />
                      }
                      label={
                        <Typography variant="body2">
                          {value}
                        </Typography>
                      }
                    />
                  ))}
                </Box>
              )}
            </Box>
          )}
          
          {(formData.attributeType === 'Boolean' || formData.attributeType === 'Array[Boolean]') && !hasOptions && <Divider />}
          
          
          <Divider />
          
          {/* Editable multilingual fields */}
          <Typography variant="subtitle1" sx={{ fontWeight: 600, color: CustomPalette.GREY_800 }}>{t("Question Labels")}</Typography>
          
          {languages.map(lang => (
            <Box key={lang} sx={{ pl: 2, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 500, color: CustomPalette.PRIMARY }}>{lang}</Typography>
              
              <TextField 
                label={`${t("Question Label")}`}
                value={formData.title?.[lang] || ''} 
                onChange={(e) => handleFieldChange(lang, 'title', e.target.value)} 
                fullWidth 
                size="small"
                inputProps={{ maxLength: MAX_ATTR_LABEL_CHARS }}
                // helperText={t("Question label for this language")}
              />
              
              {isPlaceholderAvailable && (
                <TextField 
                  label={`${t("Placeholder")}`}
                  value={formData.placeholder?.[lang] || ''} 
                  onChange={(e) => handleFieldChange(lang, 'placeholder', e.target.value)} 
                  fullWidth 
                  size="small"
                  inputProps={{ maxLength: MAX_ATTR_LABEL_CHARS }}
                  helperText={
                    (formData.attributeType === "DateTime" || formData.attributeType === "Array[DateTime]")
                      ? t("Example format to show in the date field")
                      : (formData.attributeType === "Numeric" || formData.attributeType === "Array[Numeric]")
                      ? t("Example value or hint to show in the number field")
                      : t("Placeholder text to display when field is empty")
                  }
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


