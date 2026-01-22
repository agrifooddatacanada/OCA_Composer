import React from "react";
import { 
  Box, 
  TextField, 
  Radio, 
  RadioGroup, 
  FormControlLabel, 
  Checkbox, 
  FormGroup,
  MenuItem,
  Select,
  FormControl,
  Typography,
  InputLabel,
  Chip,
  ToggleButton,
  ToggleButtonGroup,
  Slider,
  InputAdornment
} from "@mui/material";
import { 
  CalendarToday as CalendarIcon, 
  AccessTime as ClockIcon,
  Event as EventIcon 
} from "@mui/icons-material";
import { CustomPalette } from "../../constants/customPalette";
import { getLangNameFromUICode } from "../../utils/languageUtils";
import i18next from "i18next";
import {
  formatCodeTextDescription,
  formatCodeDateDescription,
  formatCodeNumericDescription,
  formatCodeBinaryDescription
} from "../../constants/constants";
import { 
  disabledChipStyle, 
  disabledRadioCheckboxStyle, 
  textFieldStyle, 
  chipContainerStyle 
} from "../../constants/styles";
import { getDateTimePickerConfig } from "./utils/getDateTimePickerConfig";

const getDateTimeIcon = (pickerComponent) => {
  if (pickerComponent === 'datetime') {
    return <EventIcon sx={{ color: CustomPalette.GREY_500 }} />;
  } else if (pickerComponent === 'time') {
    return <ClockIcon sx={{ color: CustomPalette.GREY_500 }} />;
  } else {
    return <CalendarIcon sx={{ color: CustomPalette.GREY_500 }} />;
  }
};

const getFileTypeInfo = (formatDescription) => {
  let fileTypeHint = '';
  let fileIcon = '📎';
  
  if (!formatDescription) {
    return { fileTypeHint, fileIcon };
  }
  
  const typeMappings = [
    { keywords: ["PDF"], icon: '📄', hint: 'PDF documents' },
    { keywords: ["Excel", "spreadsheet"], icon: '📊', hint: 'Excel spreadsheets' },
    { keywords: ["Word"], icon: '📝', hint: 'Word documents' },
    { keywords: ["CSV"], icon: '📋', hint: 'CSV files' },
    { keywords: ["image", "JPEG", "PNG"], icon: '🖼️', hint: 'Image files' },
    { keywords: ["video", "MP4"], icon: '🎥', hint: 'Video files' },
    { keywords: ["audio", "mp3", "wav"], icon: '🎵', hint: 'Audio files' },
    { keywords: ["ZIP", "archive"], icon: '🗜️', hint: 'Archive files' },
    { keywords: ["JSON", "XML"], icon: '{ }', hint: 'Data files' }
  ];
  
  for (const mapping of typeMappings) {
    if (mapping.keywords.some(keyword => formatDescription.includes(keyword))) {
      fileIcon = mapping.icon;
      fileTypeHint = mapping.hint;
      return { fileTypeHint, fileIcon };
    }
  }
  
  fileTypeHint = formatDescription;
  return { fileTypeHint, fileIcon };
};

const QuestionAnswerPreview = ({ question, currentLanguage, compact = false }) => {
  const { attributeType, formatText, options = [], placeholder, title, inputType } = question;
  
  const getFormatDescription = (formatRegex, type) => {
    if (!formatRegex) return '';
    const normalized = String(formatRegex).replace(/\\"/g, '"');
    if (type?.includes('DateTime')) {
      return formatCodeDateDescription[normalized] || '';
    } else if (type?.includes('Numeric')) {
      return formatCodeNumericDescription[normalized] || '';
    } else if (type?.includes('Binary')) {
      return formatCodeBinaryDescription[normalized] || '';
    } else if (type?.includes('Text')) {
      return formatCodeTextDescription[normalized] || '';
    }
    return '';
  };
  
  const formatDescription = getFormatDescription(formatText, attributeType);
  
  // Get placeholder text for current language
  const getPlaceholder = () => {
    if (typeof placeholder === 'object' && placeholder !== null) {
      const userLanguage = getLangNameFromUICode(i18next.language);
      const langPlaceholder = placeholder[currentLanguage] !== undefined 
        ? placeholder[currentLanguage]
        : (placeholder[userLanguage] !== undefined ? placeholder[userLanguage] : placeholder[Object.keys(placeholder)[0]]);
      return langPlaceholder !== undefined ? langPlaceholder : null;
    }
    return placeholder !== undefined ? placeholder : null;
  };

  const placeholderText = getPlaceholder();
  const hasOptions = options && options.length > 0;
  const isArray = attributeType?.startsWith('Array[');
  
  // Get option label for current language
  const getOptionLabel = (option) => {
    if (typeof option.labels === 'object' && option.labels !== null) {
      const userLanguage = getLangNameFromUICode(i18next.language);
      return option.labels[currentLanguage] || option.labels[userLanguage] || option.labels[Object.keys(option.labels)[0]];
    }
    return option.label || option.value || option.code || 'Option';
  };
  
  // Render list-type inputs (with entry codes)
  const renderListInput = () => {
    const displayOptions = compact ? options.slice(0, 3) : options;
    const effectiveInputType = inputType || (isArray ? 'checkbox-multi' : (options.length <= 5 ? 'radio-single' : 'dropdown-single'));
    
    const baseInputType = effectiveInputType.replace(/-single|-multi$/, '');
    const isMultiSelect = effectiveInputType.includes('-multi');
    
    switch (baseInputType) {
      case 'checkbox':
        return (
          <FormGroup>
            {displayOptions.map((option, index) => (
              <FormControlLabel
                key={option.id || index}
                control={
                  <Checkbox 
                    disabled 
                    size="small"
                    sx={disabledRadioCheckboxStyle}
                  />
                }
                label={
                  <Typography variant="body2" sx={{ color: CustomPalette.GREY_600 }}>
                    {getOptionLabel(option)}
                  </Typography>
                }
              />
            ))}
            {compact && options.length > 3 && (
              <Typography variant="caption" sx={{ color: CustomPalette.GREY_500, ml: 4 }}>
                +{options.length - 3} more options
              </Typography>
            )}
          </FormGroup>
        );
      
      case 'radio':
        return (
          <RadioGroup>
            {displayOptions.map((option, index) => (
              <FormControlLabel
                key={option.id || index}
                value={option.value || option.code || index}
                control={
                  <Radio 
                    disabled 
                    size="small"
                    sx={disabledRadioCheckboxStyle}
                  />
                }
                label={
                  <Typography variant="body2" sx={{ color: CustomPalette.GREY_600 }}>
                    {getOptionLabel(option)}
                  </Typography>
                }
              />
            ))}
          </RadioGroup>
        );
      
      case 'dropdown':
      case 'select':
        return (
          <FormControl fullWidth size="small" disabled>
            <InputLabel sx={{ fontSize: '0.875rem' }}>Select an option</InputLabel>
            <Select
              value=""
              label="Select an option"
              sx={textFieldStyle}
            >
              {displayOptions.map((option, index) => (
                <MenuItem key={option.id || index} value={option.value || option.code || index}>
                  {getOptionLabel(option)}
                </MenuItem>
              ))}
            </Select>
            {compact && options.length > 3 && (
              <Typography variant="caption" sx={{ color: CustomPalette.GREY_500, mt: 0.5 }}>
                +{options.length - 3} more options
              </Typography>
            )}
          </FormControl>
        );
      
      case 'datalist':
        return (
          <Box>
            <TextField
              fullWidth
              size="small"
              disabled
              placeholder="Type or select from list..."
              inputProps={{ list: 'datalist-options' }}
              sx={textFieldStyle}
            />
            <Typography variant="caption" sx={{ color: CustomPalette.GREY_500, mt: 0.5, display: 'block' }}>
              Searchable dropdown with {options.length} options
            </Typography>
          </Box>
        );
      
      case 'button-group':
      case 'toggle':
        return (
          <ToggleButtonGroup
            exclusive={!isMultiSelect}
            size="small"
            disabled
            sx={{ flexWrap: 'wrap', gap: 0.5 }}
          >
            {displayOptions.map((option, index) => (
              <ToggleButton 
                key={option.id || index} 
                value={option.value || option.code || index}
                sx={{ 
                  textTransform: 'none',
                  fontSize: '0.875rem',
                  color: CustomPalette.GREY_600,
                  borderColor: CustomPalette.GREY_400
                }}
              >
                {getOptionLabel(option)}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        );
      
      case 'slider':
      case 'range':
        // Range slider (for numeric options)
        if (options.length >= 2) {
          return (
            <Box sx={{ px: 2, py: 1 }}>
              <Slider
                disabled
                marks
                min={0}
                max={options.length - 1}
                step={1}
                valueLabelDisplay="auto"
                valueLabelFormat={(value) => getOptionLabel(options[value] || options[0])}
                sx={{
                  color: CustomPalette.PRIMARY,
                  '& .MuiSlider-markLabel': {
                    fontSize: '0.75rem',
                    color: CustomPalette.GREY_600
                  }
                }}
              />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                <Typography variant="caption" sx={{ color: CustomPalette.GREY_600 }}>
                  {getOptionLabel(options[0])}
                </Typography>
                <Typography variant="caption" sx={{ color: CustomPalette.GREY_600 }}>
                  {getOptionLabel(options[options.length - 1])}
                </Typography>
              </Box>
            </Box>
          );
        }
        return renderListInput(); 
      
      default:
        // Fallback to checkbox for multi-select, radio for single-select
        if (isMultiSelect) {
          return (
            <FormGroup>
              {displayOptions.map((option, index) => (
                <FormControlLabel
                  key={option.id || index}
                  control={
                    <Checkbox 
                      disabled 
                      size="small"
                      sx={disabledRadioCheckboxStyle}
                    />
                  }
                  label={
                    <Typography variant="body2" sx={{ color: CustomPalette.GREY_600 }}>
                      {getOptionLabel(option)}
                    </Typography>
                  }
                />
              ))}
            </FormGroup>
          );
        } else {
          return (
            <RadioGroup>
              {displayOptions.map((option, index) => (
                <FormControlLabel
                  key={option.id || index}
                  value={option.value || option.code || index}
                  control={
                    <Radio 
                      disabled 
                      size="small"
                      sx={disabledRadioCheckboxStyle}
                    />
                  }
                  label={
                    <Typography variant="body2" sx={{ color: CustomPalette.GREY_600 }}>
                      {getOptionLabel(option)}
                    </Typography>
                  }
                />
              ))}
            </RadioGroup>
          );
        }
    }
  };

  const renderAnswerArea = () => {
    if (hasOptions) {
      return renderListInput();
    }
    
    switch (attributeType) {
      case 'Boolean':
        const booleanOptions = question.booleanValues || ['True', 'False'];
        
        return (
          <RadioGroup row>
            {booleanOptions.map((value, index) => (
              <FormControlLabel
                key={index}
                value={value.toLowerCase()}
                control={
                  <Radio 
                    disabled 
                    size="small"
                    sx={disabledRadioCheckboxStyle}
                  />
                }
                label={<Typography variant="body2" sx={{ color: CustomPalette.GREY_600 }}>{value}</Typography>}
              />
            ))}
          </RadioGroup>
        );
      
      case 'Array[Boolean]':
        // Multiple boolean selections (checkboxes)
        // Get user-selected boolean values or use defaults
        const arrayBooleanOptions = question.booleanValues || ['True', 'False', 'Yes', 'No', '1', '0'];
        
        return (
          <Box>
            {/* Sample chips to show the concept */}
            <Box
              sx={chipContainerStyle}
            >
              <Chip 
                label="True" 
                size="small" 
                onDelete={() => {}}
                disabled
                sx={disabledChipStyle}
              />
              <Chip 
                label="False" 
                size="small" 
                onDelete={() => {}}
                disabled
                sx={disabledChipStyle}
              />
            </Box>
            {/* Checkboxes for selection */}
            <FormGroup>
              {arrayBooleanOptions.map((value, index) => (
                <FormControlLabel
                  key={index}
                  control={
                    <Checkbox 
                      disabled 
                      size="small"
                      sx={disabledRadioCheckboxStyle}
                    />
                  }
                  label={<Typography variant="body2" sx={{ color: CustomPalette.GREY_600 }}>{value}</Typography>}
                />
              ))}
              <Typography variant="caption" sx={{ color: CustomPalette.GREY_500, mt: 0.5, fontStyle: 'italic' }}>
                Multiple selections allowed ({arrayBooleanOptions.length} options)
              </Typography>
            </FormGroup>
          </Box>
        );
      
      case 'DateTime':
        const { pickerComponent, displayFormat } = getDateTimePickerConfig(formatDescription);
        const customPlaceholder = (placeholderText !== null && placeholderText !== "") ? placeholderText : displayFormat;
        
        return (
          <TextField
            fullWidth
            size="small"
            placeholder={customPlaceholder}
            disabled
            sx={textFieldStyle}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  {getDateTimeIcon(pickerComponent)}
                </InputAdornment>
              )
            }}
          />
        );
      
      case 'Array[DateTime]':
        const arrayConfig = getDateTimePickerConfig(formatDescription);
        const arrayCustomPlaceholder = (placeholderText !== null && placeholderText !== "") ? placeholderText : arrayConfig.displayFormat;
        
        return (
          <Box>
            {/* Sample chips to show the concept */}
            <Box
              sx={chipContainerStyle}
            >
              <Chip 
                label="DateTime1" 
                size="small" 
                onDelete={() => {}}
                disabled
                sx={disabledChipStyle}
              />
              <Chip 
                label="DateTime2" 
                size="small" 
                onDelete={() => {}}
                disabled
                sx={disabledChipStyle}
              />
            </Box>
            
            {/* Input area - Show only placeholder and icon */}
            <TextField
              fullWidth
              size="small"
              placeholder={arrayCustomPlaceholder}
              disabled
              sx={textFieldStyle}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    {getDateTimeIcon(arrayConfig.pickerComponent)}
                  </InputAdornment>
                )
              }}
            />
            
            <Typography variant="caption" sx={{ color: CustomPalette.GREY_500, display: 'block', mt: 0.5 }}>
              Multiple dates can be selected and added
            </Typography>
          </Box>
        );
      
      case 'Numeric':
        let numericStep = "any";
        let numericDefaultPlaceholder = "";
        
        if (formatDescription) {
          if (formatDescription === "any integer") {
            numericStep = "1";
            numericDefaultPlaceholder = "Any integer";
          } else if (formatDescription === "any integer or decimal number, may begin with + or -") {
            numericDefaultPlaceholder = "Any integer or decimal number";
          } else {
            numericDefaultPlaceholder = formatDescription;
          }
        }
        
        const numericPlaceholder = (placeholderText !== null && placeholderText !== "") ? placeholderText : numericDefaultPlaceholder;
        
        return (
          <TextField
            type="number"
            fullWidth
            size="small"
            disabled
            placeholder={numericPlaceholder}
            inputProps={{ step: numericStep }}
            sx={textFieldStyle}
          />
        );
      
      case 'Array[Numeric]':
        // Chip input for multiple numbers
        let arrayNumericDefaultPlaceholder = "";
        
        if (formatDescription) {
          if (formatDescription === "any integer") {
            arrayNumericDefaultPlaceholder = "Any integer";
          } else if (formatDescription === "any integer or decimal number, may begin with + or -") {
            arrayNumericDefaultPlaceholder = "Any integer or decimal number";
          } else {
            arrayNumericDefaultPlaceholder = formatDescription;
          }
        }
        
        const arrayNumericPlaceholder = (placeholderText !== null && placeholderText !== "") ? placeholderText : arrayNumericDefaultPlaceholder;
        
        return (
          <Box>
            {/* Sample chips to show the concept */}
            <Box
              sx={chipContainerStyle}
            >
              <Chip 
                label="number1"
                size="small" 
                onDelete={() => {}}
                disabled
                sx={disabledChipStyle}
              />
              <Chip 
                label="number2"
                size="small" 
                onDelete={() => {}}
                disabled
                sx={disabledChipStyle}
              />
            </Box>
            {/* Text input area */}
            <TextField
              type="number"
              fullWidth
              size="small"
              disabled
              placeholder={arrayNumericPlaceholder}
              sx={textFieldStyle}
            />
          </Box>
        );
      
      case 'Binary':
        // Determine file type hint based on format description
        const { fileTypeHint, fileIcon } = getFileTypeInfo(formatDescription);
        
        return (
          <Box
            sx={{
              border: `2px dashed ${CustomPalette.GREY_400}`,
              borderRadius: 1,
              p: 2,
              textAlign: 'center',
              backgroundColor: CustomPalette.GREY_100
            }}
          >
            <Typography variant="body2" sx={{ color: CustomPalette.GREY_600 }}>
              {fileIcon} File upload area
            </Typography>
            <Typography variant="caption" sx={{ color: CustomPalette.GREY_500, display: 'block' }}>
              Click or drag file to upload
            </Typography>
            {fileTypeHint && (
              <Typography variant="caption" sx={{ color: CustomPalette.PRIMARY, display: 'block', mt: 0.5, fontWeight: 600 }}>
                Accepts: {fileTypeHint}
              </Typography>
            )}
          </Box>
        );
      
      case 'Array[Binary]':
        // Multiple file upload area
        const { arrayFileTypeHint, arrayFileIcon } = getFileTypeInfo(formatDescription);
        
        return (
          <Box>
            {/* Sample chips to show uploaded files */}
            <Box
              sx={chipContainerStyle}
            >
              <Chip 
                label="file1.pdf" 
                size="small" 
                onDelete={() => {}}
                disabled
                sx={disabledChipStyle}
              />
              <Chip 
                label="file2.pdf" 
                size="small" 
                onDelete={() => {}}
                disabled
                sx={disabledChipStyle}
              />
            </Box>
            {/* File upload area */}
            <Box
              sx={{
                border: `2px dashed ${CustomPalette.GREY_400}`,
                borderRadius: 1,
                p: 2,
                textAlign: 'center',
                backgroundColor: CustomPalette.GREY_100
              }}
            >
              <Typography variant="body2" sx={{ color: CustomPalette.GREY_600 }}>
                {arrayFileIcon} File upload area
              </Typography>
              <Typography variant="caption" sx={{ color: CustomPalette.GREY_500, display: 'block' }}>
                Multiple files allowed - Click or drag files to upload
              </Typography>
              {arrayFileTypeHint && (
                <Typography variant="caption" sx={{ color: CustomPalette.PRIMARY, display: 'block', mt: 0.5, fontWeight: 600 }}>
                  Accepts: {arrayFileTypeHint}
                </Typography>
              )}
            </Box>
          </Box>
        );
      
      case 'Array[Text]':
        // Chip input for Array[Text] without list
        return (
          <Box>
            {/* Sample chips to show the concept */}
            <Box
              sx={chipContainerStyle}
            >
              <Chip 
                label="Example item 1" 
                size="small" 
                onDelete={() => {}}
                disabled
                sx={disabledChipStyle}
              />
              <Chip 
                label="Example item 2" 
                size="small" 
                onDelete={() => {}}
                disabled
                sx={disabledChipStyle}
              />
            </Box>
            {/* Text input area */}
            <TextField
              fullWidth
              size="small"
              disabled
              placeholder={placeholderText}
              sx={textFieldStyle}
            />
          </Box>
        );
      
      case 'Text':
      default:
        // Standard text input
        return (
          <TextField
            fullWidth
            size="small"
            disabled
            placeholder={placeholderText}
            sx={textFieldStyle}
          />
        );
    }
  };

  return (
    <Box sx={{ mt: 1, mb: 1 }}>
      {question.required && (
        <Typography 
          variant="caption" 
          sx={{ 
            color: CustomPalette.SECONDARY, 
            fontWeight: 600,
            display: 'block',
            mb: 0.5
          }}
        >
          * Required field
        </Typography>
      )}
      {renderAnswerArea()}
      {hasOptions && (
        <Typography 
          variant="caption" 
          sx={{ 
            color: CustomPalette.GREY_500, 
            display: 'block',
            mt: 0.5,
            fontStyle: 'italic'
          }}
        >
          {(() => {
            const isMulti = inputType?.includes('-multi') || (!inputType && isArray);
            return `${options.length} options (${isMulti ? 'multi-select' : 'single-select'})`;
          })()}
        </Typography>
      )}
    </Box>
  );
};

export default QuestionAnswerPreview;

