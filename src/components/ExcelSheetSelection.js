import { FormControl, InputLabel, Select } from '@mui/material';
import React from 'react';

const ExcelSheetSelection = ({ chosenValue, choices, setChoice }) => {
  return (
    <FormControl sx={{ m: 1, width: '100%', minWidth: 300, maxWidth: 400, maxHeight: "16rem", marginBottom: '2rem' }}>
      <InputLabel shrink>
        Excel Sheets
      </InputLabel>
      <Select
        multiple
        native
        value={[chosenValue]}
        onChange={(e) => setChoice(e.target.value)}
        label="Excel Sheets"
        sx={{ paddingTop: '0.5rem' }}
      >
        {choices.map((name) => (
          <option key={name} value={name}>
            {name}
          </option>
        ))}
      </Select>
    </FormControl>
  );
};

export default ExcelSheetSelection;