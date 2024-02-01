import { Box, FormControl, MenuItem, Select } from '@mui/material';
import React from 'react';
import { CustomPalette } from '../constants/customPalette';

const Languages = ({
  languages,
  type,
  handleChange,
  handleClick,
  isDropdownOpen,
  setIsDropdownOpen,
}) => {
  const typesDisplay = languages.map((value, index) => (
    <MenuItem
      key={index + "_" + value}
      value={value}
      sx={{ border: "none", height: "2rem", fontSize: "small" }}
    >
      {value}
    </MenuItem>
  ));
  return (
    <Box sx={{
      alignContent: 'start',
      display: 'flex',
    }}>
      <Box sx={{
        paddingTop: '5px',
        color: CustomPalette.PRIMARY,
        fontWeight: 'bold',
      }}>Language: &nbsp;&nbsp;</Box>
      {" "}
      <Box>
        <FormControl
          fullWidth
          variant="standard"
          sx={{
            height: "100%",
          }}
        >
          <Select
            id="select-drop"
            value={type || ""}
            label="Type"
            onChange={handleChange}
            sx={{
              height: "100%",
              // fontSize: "small",
            }}
            onClick={handleClick}
            open={isDropdownOpen}
            onClose={() => setIsDropdownOpen(false)}
            onOpen={() => setIsDropdownOpen(true)}
            renderValue={(value) => value}
            disableUnderline
          >
            {typesDisplay}
          </Select>
        </FormControl>
      </Box>
    </Box>
  );
};

export default Languages;