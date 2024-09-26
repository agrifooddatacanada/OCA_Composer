import { Autocomplete, styled, TextField } from "@mui/material";
import { useState } from "react";
import { dataStandardOptions } from "../../constants/constants";



const DataStandardAutocompleteEditor = ({ value, api, node, column }) => {
  const [inputValue, setInputValue] = useState(value || '');

  const handleValueChange = (_event, newValue) => {
    setInputValue(newValue);
  };

  const handleBlur = () => {
    api.stopEditing();
    node.setDataValue(column.colId, inputValue);
  };

  return (
    <StyledAutocomplete
      sx={{}}
      freeSolo
      id="data-standards-overlay"
      fullWidth
      options={dataStandardOptions}
      value={inputValue}
      onInputChange={handleValueChange}
      ListboxProps={{
        sx: {
          '& .MuiAutocomplete-option': {
            fontSize: 'small'
          }
        }
      }}
      renderInput={(params) => (
        <TextField
          {...params}
          onBlur={handleBlur}
          label="Select Option"
        />
      )}
    />
  );
};

export default DataStandardAutocompleteEditor;

const StyledAutocomplete = styled(Autocomplete)(({ theme }) => ({
  '& .MuiInputBase-input, & .MuiFormLabel-root': {
    fontSize: 'small',
  },
  '& .MuiOutlinedInput-root fieldset': {
    border: 'none'
  }
}));