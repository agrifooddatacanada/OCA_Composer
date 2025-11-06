export const getDateTimePickerConfig = (formatDesc) => {
  if (!formatDesc) {
    return {
      pickerComponent: 'date',
      displayFormat: 'YYYY-MM-DD',
      helperText: 'Select a date'
    };
  }

  switch (formatDesc) {
    // Full date formats
    case "ISO: YYYY-MM-DD: year month day":
      return { pickerComponent: 'date', displayFormat: 'YYYY-MM-DD', helperText: formatDesc };
    case "ISO: YYYYMMDD: year month day":
      return { pickerComponent: 'date', displayFormat: 'YYYYMMDD', helperText: formatDesc };
    case "DD/MM/YYYY: day, month, year":
      return { pickerComponent: 'date', displayFormat: 'DD/MM/YYYY', helperText: formatDesc };
    case "DD/MM/YY: day, month, year":
      return { pickerComponent: 'date', displayFormat: 'DD/MM/YY', helperText: formatDesc };
    case "MM/DD/YYYY: month, day, year":
      return { pickerComponent: 'date', displayFormat: 'MM/DD/YYYY', helperText: formatDesc };
    case "DDMMYYYY: day, month, year":
      return { pickerComponent: 'date', displayFormat: 'DDMMYYYY', helperText: formatDesc };
    case "MMDDYYYY: month, day, year":
      return { pickerComponent: 'date', displayFormat: 'MMDDYYYY', helperText: formatDesc };
    case "YYYYMMDD: year, month, day":
      return { pickerComponent: 'date', displayFormat: 'YYYYMMDD', helperText: formatDesc };
    
    // Year-month formats
    case "ISO: YYYY-MM: year month":
      return { pickerComponent: 'date', displayFormat: 'YYYY-MM', helperText: formatDesc, views: ['year', 'month'] };
    
    // Week formats (use text input since DatePicker doesn't support week format well)
    case "ISO: YYYY-Www: year week (e.g. W01)":
      return { pickerComponent: 'text', displayFormat: 'YYYY-[W]ww', helperText: formatDesc, placeholder: '2024-W42' };
    case "ISO: YYYYWww: year week (e.g. W01)":
      return { pickerComponent: 'text', displayFormat: 'YYYY[W]ww', helperText: formatDesc, placeholder: '2024W42' };
    
    // Ordinal date formats (use text input)
    case "ISO: YYYY-DDD: Ordinal date (day number from the year)":
      return { pickerComponent: 'text', displayFormat: 'YYYY-DDD', helperText: formatDesc, placeholder: '2024-295' };
    case "ISO: YYYYDDD: Ordinal date (day number from the year)":
      return { pickerComponent: 'text', displayFormat: 'YYYYDDD', helperText: formatDesc, placeholder: '2024295' };
    
    // Duration formats (use text input)
    case "ISO: PnD: accumulated days (n days)":
      return { pickerComponent: 'text', displayFormat: 'P[n]D', helperText: formatDesc, placeholder: 'P5D' };
    case "ISO: PnYnMnDTnHnMnS :durations e.g. P3Y6M4DT12H30M5S":
      return { pickerComponent: 'text', displayFormat: 'ISO 8601 Duration', helperText: formatDesc, placeholder: 'P3Y6M4DT12H30M5S' };
    
    // Individual components (use DatePicker with specific views)
    case "ISO: YYYY: year":
      return { pickerComponent: 'date', displayFormat: 'YYYY', helperText: formatDesc, views: ['year'] };
    case "ISO: MM: month":
      return { pickerComponent: 'date', displayFormat: 'MM', helperText: formatDesc, views: ['month'] };
    case "ISO: DD: day":
      return { pickerComponent: 'date', displayFormat: 'DD', helperText: formatDesc, views: ['day'] };
    
    // Date and time combined
    case "ISO: YYYY-MM-DDTHH:MM:SSZ: Date and Time Combined (UTC)":
      return { pickerComponent: 'datetime', displayFormat: 'YYYY-MM-DD[T]HH:mm:ss[Z]', helperText: formatDesc };
    case "ISO: YYYY-MM-DDTHH:MM:SS±hh:mm: Date and Time Combined (with Timezone Offset)":
      return { pickerComponent: 'datetime', displayFormat: 'YYYY-MM-DD[T]HH:mm:ssZ', helperText: formatDesc };
    
    // Time formats (24-hour)
    case "ISO: HH:MM: hour, minutes in 24 hour notation":
      return { pickerComponent: 'time', displayFormat: 'HH:mm', helperText: formatDesc };
    case "ISO: HH:MM:SS: hour, minutes, seconds in 24 hour notation":
      return { pickerComponent: 'time', displayFormat: 'HH:mm:ss', helperText: formatDesc };
    
    // Time formats (12-hour with AM/PM)
    case "HH:MM:SS: hour, minutes, seconds 12 hour notation AM/PM":
      return { pickerComponent: 'time', displayFormat: 'hh:mm:ss A', helperText: formatDesc };
    case "H:MM or HH:MM: hour, minutes AM/PM":
      return { pickerComponent: 'time', displayFormat: 'h:mm A', helperText: formatDesc };
    
    // Default fallback
    default:
      return { pickerComponent: 'date', displayFormat: 'YYYY-MM-DD', helperText: formatDesc };
  }
};

