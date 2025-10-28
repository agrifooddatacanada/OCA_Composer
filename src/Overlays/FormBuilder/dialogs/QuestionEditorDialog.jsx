import React, { useEffect, useState } from "react";
import { 
  Box, TextField, Typography, Divider, FormControl, InputLabel, 
  Select, MenuItem, FormControlLabel, Checkbox
} from "@mui/material";
import { useTranslation } from "react-i18next";
import BaseEditorDialog from "./BaseEditorDialog";
import MultilingualFieldGroup from "./MultilingualFieldGroup";
import {
  formatCodeBinaryDescription,
  formatCodeDateDescription,
  formatCodeNumericDescription,
  formatCodeTextDescription,
  MAX_ATTR_LABEL_CHARS
} from "../../../constants/constants";
import { CustomPalette } from "../../../constants/customPalette";
import { getDateTimePickerConfig } from "../utils/getDateTimePickerConfig";

// Boolean value pairs for form inputs
const BOOLEAN_VALUE_PAIRS = [
  { id: "true-false", label: "True / False", trueValue: "True", falseValue: "False" },
  { id: "true-false-lower", label: "true / false", trueValue: "true", falseValue: "false" },
  { id: "true-false-upper", label: "TRUE / FALSE", trueValue: "TRUE", falseValue: "FALSE" },
  { id: "t-f", label: "T / F", trueValue: "T", falseValue: "F" },
  { id: "yes-no", label: "Yes / No", trueValue: "Yes", falseValue: "No" },
  { id: "yes-no-lower", label: "yes / no", trueValue: "yes", falseValue: "no" },
  { id: "yes-no-upper", label: "YES / NO", trueValue: "YES", falseValue: "NO" },
  { id: "y-n", label: "Y / N", trueValue: "Y", falseValue: "N" },
  { id: "1-0", label: "1 / 0", trueValue: "1", falseValue: "0" },
  { id: "1.0-0.0", label: "1.0 / 0.0", trueValue: "1.0", falseValue: "0.0" },
  { id: "oui-non", label: "Oui / Non (French)", trueValue: "Oui", falseValue: "Non" },
  { id: "oui-non-lower", label: "oui / non (French)", trueValue: "oui", falseValue: "non" }
];

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
    booleanValues: null, 
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
      
      let booleanPairId = question.booleanPairId || 'true-false';
      let booleanPairIds = question.booleanPairIds || ['true-false'];
      
      if (question.booleanValues && question.booleanValues.length === 2 && !question.booleanPairId) {
        const [val1, val2] = question.booleanValues;
        const matchingPair = BOOLEAN_VALUE_PAIRS.find(
          pair => (pair.trueValue === val1 && pair.falseValue === val2) || 
                  (pair.falseValue === val1 && pair.trueValue === val2)
        );
        if (matchingPair) {
          booleanPairId = matchingPair.id;
        }
      }
      
      setFormData({ 
        title: defaultTitle,
        placeholder: defaultPlaceholder,
        formatText: question.formatText || '', 
        attributeType: question.attributeType || '', 
        attribute: question.attribute || '',
        required: question.required || false, 
        options: question.options || [],
        booleanPairId,
        booleanPairIds,
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
    <BaseEditorDialog
      open={open}
      onClose={onClose}
      title={t("Edit Question")}
      onSave={handleSave}
    >
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
                        backgroundColor: '#f5f5f5',
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
                  ? t("Select a pair of boolean values for true/false options") 
                  : t("Select which boolean value pairs to show as options")}
              </Typography>
              
              {formData.attributeType === 'Boolean' ? (
                // For Boolean: Select one pair
                <FormControl fullWidth size="small">
                  <InputLabel>{t("Select Boolean Pair")}</InputLabel>
                  <Select
                    value={formData.booleanPairId || 'true-false'}
                    label={t("Select Boolean Pair")}
                    onChange={(e) => {
                      const selectedPair = BOOLEAN_VALUE_PAIRS.find(pair => pair.id === e.target.value);
                      setFormData(prev => ({ 
                        ...prev, 
                        booleanPairId: e.target.value,
                        booleanValues: [selectedPair.trueValue, selectedPair.falseValue]
                      }));
                    }}
                  >
                    {BOOLEAN_VALUE_PAIRS.map((pair) => (
                      <MenuItem key={pair.id} value={pair.id}>
                        {pair.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              ) : (
                // For Array[Boolean]: Select multiple pairs
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {BOOLEAN_VALUE_PAIRS.map((pair) => {
                    const isChecked = formData.booleanPairIds ? formData.booleanPairIds.includes(pair.id) : pair.id === 'true-false';
                    return (
                      <FormControlLabel
                        key={pair.id}
                        control={
                          <Checkbox
                            checked={isChecked}
                            onChange={(e) => {
                              const currentPairIds = formData.booleanPairIds || ['true-false'];
                              let newPairIds;
                              if (e.target.checked) {
                                newPairIds = [...currentPairIds, pair.id];
                              } else {
                                newPairIds = currentPairIds.filter(id => id !== pair.id);
                                if (newPairIds.length === 0) {
                                  newPairIds = ['true-false'];
                                }
                              }
                              
                              const allValues = newPairIds.flatMap(pairId => {
                                const p = BOOLEAN_VALUE_PAIRS.find(bp => bp.id === pairId);
                                return [p.trueValue, p.falseValue];
                              });
                              
                              setFormData(prev => ({ 
                                ...prev, 
                                booleanPairIds: newPairIds,
                                booleanValues: allValues
                              }));
                            }}
                            color="primary"
                          />
                        }
                        label={
                          <Typography variant="body2">
                            {pair.label}
                          </Typography>
                        }
                      />
                    );
                  })}
                </Box>
              )}
            </Box>
          )}
          
          {(formData.attributeType === 'Boolean' || formData.attributeType === 'Array[Boolean]') && !hasOptions && <Divider />}
          
          
          <Divider />
          
          {/* Editable multilingual fields */}
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>{t("Question Labels")}</Typography>
          
          <MultilingualFieldGroup
            languages={languages}
            formData={formData}
            fields={[
              { 
                name: 'title', 
                label: t("Question Label"), 
                maxLength: MAX_ATTR_LABEL_CHARS 
              },
              ...(isPlaceholderAvailable ? [{
                name: 'placeholder', 
                label: t("Placeholder"), 
                maxLength: MAX_ATTR_LABEL_CHARS,
                helperText: (formData.attributeType === "DateTime" || formData.attributeType === "Array[DateTime]")
                  ? t("Example format to show in the date field")
                  : (formData.attributeType === "Numeric" || formData.attributeType === "Array[Numeric]")
                  ? t("Example value or hint to show in the number field")
                  : t("Placeholder text to display when field is empty")
              }] : [])
            ]}
            onChange={handleFieldChange}
          />
          
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
    </BaseEditorDialog>
  );
};

export default QuestionEditorDialog;


