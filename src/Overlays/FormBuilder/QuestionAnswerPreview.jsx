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
  Button,
  ButtonGroup,
  ToggleButton,
  ToggleButtonGroup,
  Slider
} from "@mui/material";
import { CustomPalette } from "../../constants/customPalette";
import { codesToLanguages } from "../../constants/isoCodes";
import i18next from "i18next";
import {
  formatCodeTextDescription,
  formatCodeDateDescription,
  formatCodeNumericDescription,
  formatCodeBinaryDescription,
  ALLOWED_BOOLEAN_VALUES
} from "../../constants/constants";


const QuestionAnswerPreview = ({ question, currentLanguage, compact = false }) => {
  const { attributeType, formatText, options = [], placeholder, title, inputType } = question;
  
  const getFormatDescription = (formatRegex, type) => {
    if (!formatRegex) return '';
    
    if (type?.includes('DateTime')) {
      return formatCodeDateDescription[formatRegex] || '';
    } else if (type?.includes('Numeric')) {
      return formatCodeNumericDescription[formatRegex] || '';
    } else if (type?.includes('Binary')) {
      return formatCodeBinaryDescription[formatRegex] || '';
    } else if (type?.includes('Text')) {
      return formatCodeTextDescription[formatRegex] || '';
    }
    return '';
  };
  
  const formatDescription = getFormatDescription(formatText, attributeType);
  
  // Get placeholder text for current language
  const getPlaceholder = () => {
    if (typeof placeholder === 'object' && placeholder !== null) {
      const userLanguage = codesToLanguages?.[i18next.language];
      return placeholder[currentLanguage] || placeholder[userLanguage] || placeholder[Object.keys(placeholder)[0]] || '';
    }
    return placeholder || '';
  };

  const placeholderText = getPlaceholder();
  const hasOptions = options && options.length > 0;
  const isArray = attributeType?.startsWith('Array[');
  
  // Get option label for current language
  const getOptionLabel = (option) => {
    if (typeof option.labels === 'object' && option.labels !== null) {
      const userLanguage = codesToLanguages?.[i18next.language];
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
        // Checkboxes (can be single or multi-select)
        return (
          <FormGroup>
            {displayOptions.map((option, index) => (
              <FormControlLabel
                key={option.id || index}
                control={
                  <Checkbox 
                    disabled 
                    size="small"
                    sx={{ 
                      color: CustomPalette.GREY_400,
                      '&.Mui-disabled': { color: CustomPalette.GREY_400 }
                    }}
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
        // Radio buttons (can be single or multi-select)
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
                    sx={{ 
                      color: CustomPalette.GREY_400,
                      '&.Mui-disabled': { color: CustomPalette.GREY_400 }
                    }}
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
        // Dropdown select
        return (
          <FormControl fullWidth size="small" disabled>
            <InputLabel sx={{ fontSize: '0.875rem' }}>Select an option</InputLabel>
            <Select
              value=""
              label="Select an option"
              sx={{ 
                backgroundColor: CustomPalette.GREY_100,
                fontSize: '0.875rem'
              }}
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
        // Datalist input
        return (
          <Box>
            <TextField
              fullWidth
              size="small"
              disabled
              placeholder="Type or select from list..."
              inputProps={{ list: 'datalist-options' }}
              sx={{ 
                backgroundColor: CustomPalette.GREY_100,
                fontSize: '0.875rem'
              }}
            />
            <Typography variant="caption" sx={{ color: CustomPalette.GREY_500, mt: 0.5, display: 'block' }}>
              Searchable dropdown with {options.length} options
            </Typography>
          </Box>
        );
      
      case 'button-group':
      case 'toggle':
        // Toggle Button Group
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
        return renderListInput(); // Fallback to default
      
      default:
        // Fallback to checkbox for multi-select, radio for single-select
        if (isMultiSelect) {
          // Render as checkboxes
          return (
            <FormGroup>
              {displayOptions.map((option, index) => (
                <FormControlLabel
                  key={option.id || index}
                  control={
                    <Checkbox 
                      disabled 
                      size="small"
                      sx={{ 
                        color: CustomPalette.GREY_400,
                        '&.Mui-disabled': { color: CustomPalette.GREY_400 }
                      }}
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
          // Render as radio buttons
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
                      sx={{ 
                        color: CustomPalette.GREY_400,
                        '&.Mui-disabled': { color: CustomPalette.GREY_400 }
                      }}
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

  // Determine the input type based on attribute type and options
  const renderAnswerArea = () => {
    // List-type attributes (have entry codes/options)
    if (hasOptions) {
      return renderListInput();
    }
    
    // Non-list attributes - render based on type
    switch (attributeType) {
      case 'Boolean':
        // Get user-selected boolean values or use defaults
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
                    sx={{ 
                      color: CustomPalette.GREY_400,
                      '&.Mui-disabled': { color: CustomPalette.GREY_400 }
                    }}
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
              sx={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 0.5,
                mb: 1
              }}
            >
              <Chip 
                label="True" 
                size="small" 
                onDelete={() => {}}
                disabled
                sx={{ 
                  backgroundColor: CustomPalette.GREY_200,
                  '& .MuiChip-deleteIcon': {
                    color: CustomPalette.GREY_500
                  }
                }}
              />
              <Chip 
                label="False" 
                size="small" 
                onDelete={() => {}}
                disabled
                sx={{ 
                  backgroundColor: CustomPalette.GREY_200,
                  '& .MuiChip-deleteIcon': {
                    color: CustomPalette.GREY_500
                  }
                }}
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
                      sx={{ 
                        color: CustomPalette.GREY_400,
                        '&.Mui-disabled': { color: CustomPalette.GREY_400 }
                      }}
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
        let dateInputType = "date";
        let helperText = '';

        if (formatDescription) {
          switch (formatDescription) {
            // Full date formats
            case "ISO: YYYY-MM-DD: year month day":
              dateInputType = "date";
              helperText = "Year, month, day (YYYY-MM-DD)";
              break;
            case "ISO: YYYYMMDD: year month day":
              dateInputType = "text";
              helperText = "Year, month, day (YYYYMMDD)";
              break;
            case "DD/MM/YYYY: day, month, year":
              dateInputType = "text";
              helperText = "Day, month, year (DD/MM/YYYY)";
              break;
            case "DD/MM/YY: day, month, year":
              dateInputType = "text";
              helperText = "Day, month, year (DD/MM/YY)";
              break;
            case "MM/DD/YYYY: month, day, year":
              dateInputType = "text";
              helperText = "Month, day, year (MM/DD/YYYY)";
              break;
            case "DDMMYYYY: day, month, year":
              dateInputType = "text";
              helperText = "Day, month, year (DDMMYYYY)";
              break;
            case "MMDDYYYY: month, day, year":
              dateInputType = "text";
              helperText = "Month, day, year (MMDDYYYY)";
              break;
            case "YYYYMMDD: year, month, day":
              dateInputType = "text";
              helperText = "Year, month, day (YYYYMMDD)";
              break;
            
            // Year-month formats
            case "ISO: YYYY-MM: year month":
              dateInputType = "month";
              helperText = "Year and month (YYYY-MM)";
              break;
            
            // Week formats
            case "ISO: YYYY-Www: year week (e.g. W01)":
              dateInputType = "week";
              helperText = "Year and week number (e.g., 2023-W04)";
              break;
            case "ISO: YYYYWww: year week (e.g. W01)":
              dateInputType = "text";
              helperText = "Year and week number (e.g., 2023W04)";
              break;
            
            // Ordinal date formats
            case "ISO: YYYY-DDD: Ordinal date (day number from the year)":
              dateInputType = "text";
              helperText = "Ordinal date - day number from the year (YYYY-DDD, 2023-120)";
              break;
            case "ISO: YYYYDDD: Ordinal date (day number from the year)":
              dateInputType = "text";
              helperText = "Ordinal date - day number from the year (YYYYDDD, 2023120)";
              break;
            
            // Individual components
            case "ISO: YYYY: year":
              dateInputType = "number";
              helperText = "Year only (YYYY)";
              break;
            case "ISO: MM: month":
              dateInputType = "number";
              helperText = "Month only (MM)";
              break;
            case "ISO: DD: day":
              dateInputType = "number";
              helperText = "Day only (DD)";
              break;
            
            // Date and time combined
            case "ISO: YYYY-MM-DDTHH:MM:SSZ: Date and Time Combined (UTC)":
              dateInputType = "datetime-local";
              helperText = "Date and time combined in UTC (YYYY-MM-DDTHH:MM:SSZ)";
              break;
            case "ISO: YYYY-MM-DDTHH:MM:SS±hh:mm: Date and Time Combined (with Timezone Offset)":
              dateInputType = "text";
              helperText = "Date and time with timezone offset (YYYY-MM-DDTHH:MM:SS±hh:mm)";
              break;
            
            // Duration formats
            case "ISO: PnD: accumulated days (n days)":
              dateInputType = "text";
              helperText = "Accumulated days (e.g., P5D for 5 days)";
              break;
            case "ISO: PnYnMnDTnHnMnS :durations e.g. P3Y6M4DT12H30M5S":
              dateInputType = "text";
              helperText = "ISO 8601 duration (e.g., P3Y6M4DT12H30M5S)";
              break;
            
            // Time formats (24-hour)
            case "ISO: HH:MM: hour, minutes in 24 hour notation":
              dateInputType = "time";
              helperText = "Hour and minutes in 24-hour notation (HH:MM)";
              break;
            case "ISO: HH:MM:SS: hour, minutes, seconds in 24 hour notation":
              dateInputType = "time";
              helperText = "Hour, minutes, seconds in 24-hour notation (HH:MM:SS)";
              break;
            
            // Time formats (12-hour with AM/PM)
            case "HH:MM:SS: hour, minutes, seconds 12 hour notation AM/PM":
              dateInputType = "text";
              helperText = "Hour, minutes, seconds in 12-hour notation with AM/PM (HH:MM:SS AM/PM)";
              break;
            case "H:MM or HH:MM: hour, minutes AM/PM":
              dateInputType = "text";
              helperText = "Hour and minutes with AM/PM (H:MM AM/PM or HH:MM AM/PM)";
              break;
            
            // Default fallback
            default:
              dateInputType = "date";
              helperText = formatDescription || "Select a date";
              break;
          }
        } else {
          helperText = "Select a date";
        }
        
        return (
          <Box>
            <TextField
              type={dateInputType}
              fullWidth
              size="small"
              disabled
              placeholder={helperText}
              InputLabelProps={{ shrink: true }}
              sx={{ 
                backgroundColor: CustomPalette.GREY_100,
                fontSize: '0.875rem'
              }}
            />
          </Box>
        );
      
      case 'Array[DateTime]':
        // Chip input for multiple dates/times
        let arrayDateInputType = "date";
        let arrayDateHelper = '';
        
        if (formatDescription) {
          switch (formatDescription) {
            // Full date formats
            case "ISO: YYYY-MM-DD: year month day":
              arrayDateInputType = "date";
              arrayDateHelper = "Year, month, day (YYYY-MM-DD)";
              break;
            case "ISO: YYYYMMDD: year month day":
              arrayDateInputType = "text";
              arrayDateHelper = "Year, month, day (YYYYMMDD)";
              break;
            case "DD/MM/YYYY: day, month, year":
              arrayDateInputType = "text";
              arrayDateHelper = "Day, month, year (DD/MM/YYYY)";
              break;
            case "DD/MM/YY: day, month, year":
              arrayDateInputType = "text";
              arrayDateHelper = "Day, month, year (DD/MM/YY)";
              break;
            case "MM/DD/YYYY: month, day, year":
              arrayDateInputType = "text";
              arrayDateHelper = "Month, day, year (MM/DD/YYYY)";
              break;
            case "DDMMYYYY: day, month, year":
              arrayDateInputType = "text";
              arrayDateHelper = "Day, month, year (DDMMYYYY)";
              break;
            case "MMDDYYYY: month, day, year":
              arrayDateInputType = "text";
              arrayDateHelper = "Month, day, year (MMDDYYYY)";
              break;
            case "YYYYMMDD: year, month, day":
              arrayDateInputType = "text";
              arrayDateHelper = "Year, month, day (YYYYMMDD)";
              break;
            
            // Year-month formats
            case "ISO: YYYY-MM: year month":
              arrayDateInputType = "month";
              arrayDateHelper = "Year and month (YYYY-MM)";
              break;
            
            // Week formats
            case "ISO: YYYY-Www: year week (e.g. W01)":
              arrayDateInputType = "week";
              arrayDateHelper = "Year and week number (e.g., 2023-W04)";
              break;
            case "ISO: YYYYWww: year week (e.g. W01)":
              arrayDateInputType = "text";
              arrayDateHelper = "Year and week number (e.g., 2023W04)";
              break;
            
            // Ordinal date formats
            case "ISO: YYYY-DDD: Ordinal date (day number from the year)":
              arrayDateInputType = "text";
              arrayDateHelper = "Ordinal date - day number from the year (YYYY-DDD, 2023-120)";
              break;
            case "ISO: YYYYDDD: Ordinal date (day number from the year)":
              arrayDateInputType = "text";
              arrayDateHelper = "Ordinal date - day number from the year (YYYYDDD, 2023120)";
              break;
            
            // Individual components
            case "ISO: YYYY: year":
              arrayDateInputType = "number";
              arrayDateHelper = "Year only (YYYY)";
              break;
            case "ISO: MM: month":
              arrayDateInputType = "number";
              arrayDateHelper = "Month only (MM)";
              break;
            case "ISO: DD: day":
              arrayDateInputType = "number";
              arrayDateHelper = "Day only (DD)";
              break;
            
            // Date and time combined
            case "ISO: YYYY-MM-DDTHH:MM:SSZ: Date and Time Combined (UTC)":
              arrayDateInputType = "datetime-local";
              arrayDateHelper = "Date and time combined in UTC (YYYY-MM-DDTHH:MM:SSZ)";
              break;
            case "ISO: YYYY-MM-DDTHH:MM:SS±hh:mm: Date and Time Combined (with Timezone Offset)":
              arrayDateInputType = "text";
              arrayDateHelper = "Date and time with timezone offset (YYYY-MM-DDTHH:MM:SS±hh:mm)";
              break;
            
            // Duration formats
            case "ISO: PnD: accumulated days (n days)":
              arrayDateInputType = "text";
              arrayDateHelper = "Accumulated days (e.g., P5D for 5 days)";
              break;
            case "ISO: PnYnMnDTnHnMnS :durations e.g. P3Y6M4DT12H30M5S":
              arrayDateInputType = "text";
              arrayDateHelper = "ISO 8601 duration (e.g., P3Y6M4DT12H30M5S)";
              break;
            
            // Time formats (24-hour)
            case "ISO: HH:MM: hour, minutes in 24 hour notation":
              arrayDateInputType = "time";
              arrayDateHelper = "Hour and minutes in 24-hour notation (HH:MM)";
              break;
            case "ISO: HH:MM:SS: hour, minutes, seconds in 24 hour notation":
              arrayDateInputType = "time";
              arrayDateHelper = "Hour, minutes, seconds in 24-hour notation (HH:MM:SS)";
              break;
            
            // Time formats (12-hour with AM/PM)
            case "HH:MM:SS: hour, minutes, seconds 12 hour notation AM/PM":
              arrayDateInputType = "text";
              arrayDateHelper = "Hour, minutes, seconds in 12-hour notation with AM/PM (HH:MM:SS AM/PM)";
              break;
            case "H:MM or HH:MM: hour, minutes AM/PM":
              arrayDateInputType = "text";
              arrayDateHelper = "Hour and minutes with AM/PM (H:MM AM/PM or HH:MM AM/PM)";
              break;
            
            // Default fallback
            default:
              arrayDateInputType = "date";
              arrayDateHelper = formatDescription || "Select a date";
              break;
          }
        } else {
          arrayDateHelper = "Type and press Enter to add...";
        }
        
        return (
          <Box>
            {/* Sample chips to show the concept */}
            <Box
              sx={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 0.5,
                mb: 1
              }}
            >
              <Chip 
                label="DateTime1" 
                size="small" 
                onDelete={() => {}}
                disabled
                sx={{ 
                  backgroundColor: CustomPalette.GREY_200,
                  '& .MuiChip-deleteIcon': {
                    color: CustomPalette.GREY_500
                  }
                }}
              />
              <Chip 
                label="DateTime2" 
                size="small" 
                onDelete={() => {}}
                disabled
                sx={{ 
                  backgroundColor: CustomPalette.GREY_200,
                  '& .MuiChip-deleteIcon': {
                    color: CustomPalette.GREY_500
                  }
                }}
              />
            </Box>
            {/* Text input area */}
            <TextField
              type={arrayDateInputType}
              fullWidth
              size="small"
              disabled
              placeholder={arrayDateHelper}
              InputLabelProps={{ shrink: true }}
              sx={{ 
                backgroundColor: CustomPalette.GREY_100,
                fontSize: '0.875rem'
              }}
            />
          </Box>
        );
      
      case 'Numeric':
        // Determine step based on format
        let numericStep = "any";
        let numericHelper = '';
        
        if (formatDescription) {
          switch (formatDescription) {
            case "any integer or decimal number, may begin with + or -":
              numericStep = "any";
              numericHelper = "Any integer or decimal number (may begin with + or -)";
              break;
            case "any integer":
              numericStep = "1";
              numericHelper = "Any integer";
              break;
            default:
              numericStep = "any";
              numericHelper = formatDescription || "Enter a number";
              break;
          }
        } else {
          numericHelper = "Enter a number";
        }
        
        return (
          <TextField
            type="number"
            fullWidth
            size="small"
            disabled
            placeholder={numericHelper}
            inputProps={{ step: numericStep }}
            sx={{ 
              backgroundColor: CustomPalette.GREY_100,
              fontSize: '0.875rem'
            }}
          />
        );
      
      case 'Array[Numeric]':
        // Chip input for multiple numbers
        let arrayNumericHelper = "Type and press Enter to add...";
        let arrayNumericExample1 = "number1";
        let arrayNumericExample2 = "number2";
        
        return (
          <Box>
            {/* Sample chips to show the concept */}
            <Box
              sx={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 0.5,
                mb: 1
              }}
            >
              <Chip 
                label={arrayNumericExample1}
                size="small" 
                onDelete={() => {}}
                disabled
                sx={{ 
                  backgroundColor: CustomPalette.GREY_200,
                  '& .MuiChip-deleteIcon': {
                    color: CustomPalette.GREY_500
                  }
                }}
              />
              <Chip 
                label={arrayNumericExample2}
                size="small" 
                onDelete={() => {}}
                disabled
                sx={{ 
                  backgroundColor: CustomPalette.GREY_200,
                  '& .MuiChip-deleteIcon': {
                    color: CustomPalette.GREY_500
                  }
                }}
              />
            </Box>
            {/* Text input area */}
            <TextField
              type="number"
              fullWidth
              size="small"
              disabled
              placeholder={arrayNumericHelper}
              sx={{ 
                backgroundColor: CustomPalette.GREY_100,
                fontSize: '0.875rem'
              }}
            />
          </Box>
        );
      
      case 'Binary':
        // Determine file type hint based on format description
        let fileTypeHint = '';
        let fileIcon = '📎';
        
        if (formatDescription) {
          if (formatDescription.includes("PDF")) {
            fileIcon = '📄';
            fileTypeHint = 'PDF documents';
          } else if (formatDescription.includes("Excel") || formatDescription.includes("spreadsheet")) {
            fileIcon = '📊';
            fileTypeHint = 'Excel spreadsheets';
          } else if (formatDescription.includes("Word")) {
            fileIcon = '📝';
            fileTypeHint = 'Word documents';
          } else if (formatDescription.includes("CSV")) {
            fileIcon = '📋';
            fileTypeHint = 'CSV files';
          } else if (formatDescription.includes("image") || formatDescription.includes("JPEG") || formatDescription.includes("PNG")) {
            fileIcon = '🖼️';
            fileTypeHint = 'Image files';
          } else if (formatDescription.includes("video") || formatDescription.includes("MP4")) {
            fileIcon = '🎥';
            fileTypeHint = 'Video files';
          } else if (formatDescription.includes("audio") || formatDescription.includes("mp3") || formatDescription.includes("wav")) {
            fileIcon = '🎵';
            fileTypeHint = 'Audio files';
          } else if (formatDescription.includes("ZIP") || formatDescription.includes("archive")) {
            fileIcon = '🗜️';
            fileTypeHint = 'Archive files';
          } else if (formatDescription.includes("JSON") || formatDescription.includes("XML")) {
            fileIcon = '{ }';
            fileTypeHint = 'Data files';
          } else {
            fileTypeHint = formatDescription;
          }
        }
        
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
        let arrayFileTypeHint = '';
        let arrayFileIcon = '📎';
        
        if (formatDescription) {
          if (formatDescription.includes("PDF")) {
            arrayFileIcon = '📄';
            arrayFileTypeHint = 'PDF documents';
          } else if (formatDescription.includes("Excel") || formatDescription.includes("spreadsheet")) {
            arrayFileIcon = '📊';
            arrayFileTypeHint = 'Excel spreadsheets';
          } else if (formatDescription.includes("Word")) {
            arrayFileIcon = '📝';
            arrayFileTypeHint = 'Word documents';
          } else if (formatDescription.includes("CSV")) {
            arrayFileIcon = '📋';
            arrayFileTypeHint = 'CSV files';
          } else if (formatDescription.includes("image") || formatDescription.includes("JPEG") || formatDescription.includes("PNG")) {
            arrayFileIcon = '🖼️';
            arrayFileTypeHint = 'Image files';
          } else if (formatDescription.includes("video") || formatDescription.includes("MP4")) {
            arrayFileIcon = '🎥';
            arrayFileTypeHint = 'Video files';
          } else if (formatDescription.includes("audio") || formatDescription.includes("mp3") || formatDescription.includes("wav")) {
            arrayFileIcon = '🎵';
            arrayFileTypeHint = 'Audio files';
          } else if (formatDescription.includes("ZIP") || formatDescription.includes("archive")) {
            arrayFileIcon = '🗜️';
            arrayFileTypeHint = 'Archive files';
          } else if (formatDescription.includes("JSON") || formatDescription.includes("XML")) {
            arrayFileIcon = '{ }';
            arrayFileTypeHint = 'Data files';
          } else {
            arrayFileTypeHint = formatDescription;
          }
        }
        
        return (
          <Box>
            {/* Sample chips to show uploaded files */}
            <Box
              sx={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 0.5,
                mb: 1
              }}
            >
              <Chip 
                label="file1.pdf" 
                size="small" 
                onDelete={() => {}}
                disabled
                sx={{ 
                  backgroundColor: CustomPalette.GREY_200,
                  '& .MuiChip-deleteIcon': {
                    color: CustomPalette.GREY_500
                  }
                }}
              />
              <Chip 
                label="file2.pdf" 
                size="small" 
                onDelete={() => {}}
                disabled
                sx={{ 
                  backgroundColor: CustomPalette.GREY_200,
                  '& .MuiChip-deleteIcon': {
                    color: CustomPalette.GREY_500
                  }
                }}
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
              sx={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 0.5,
                mb: 1
              }}
            >
              <Chip 
                label="Example item 1" 
                size="small" 
                onDelete={() => {}}
                disabled
                sx={{ 
                  backgroundColor: CustomPalette.GREY_200,
                  '& .MuiChip-deleteIcon': {
                    color: CustomPalette.GREY_500
                  }
                }}
              />
              <Chip 
                label="Example item 2" 
                size="small" 
                onDelete={() => {}}
                disabled
                sx={{ 
                  backgroundColor: CustomPalette.GREY_200,
                  '& .MuiChip-deleteIcon': {
                    color: CustomPalette.GREY_500
                  }
                }}
              />
            </Box>
            {/* Text input area */}
            <TextField
              fullWidth
              size="small"
              disabled
              placeholder={placeholderText || "Type and press Enter to add..."}
              sx={{ 
                backgroundColor: CustomPalette.GREY_100,
                fontSize: '0.875rem'
              }}
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
            placeholder={placeholderText || "Enter text"}
            sx={{ 
              backgroundColor: CustomPalette.GREY_100,
              fontSize: '0.875rem'
            }}
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

