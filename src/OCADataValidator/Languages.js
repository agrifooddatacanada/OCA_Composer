import { Box, FormControl, MenuItem, Select } from '@mui/material';
import React from 'react';
import { CustomPalette } from '../constants/customPalette';
import { useTranslation } from 'react-i18next';

const Languages = ({
  languages,
  type,
  handleChange,
  handleClick,
  isDropdownOpen,
  setIsDropdownOpen,
}) => {
  const { t } = useTranslation();
  const typesDisplay = languages.map((value, index) => (
    <MenuItem
      key={index + "_" + value}
      value={value}
      sx={{ border: "none", height: "2rem" }}
    >
      {value}
    </MenuItem>
  ));
  return (
    <Box sx={{
      alignContent: 'start',
      display: 'flex',
      height: "wrap-content",
    }}>
      <Box sx={{
        color: CustomPalette.PRIMARY,
        fontWeight: 'bold',
        alignSelf: 'center',
        textAlign: 'center',
      }}>{t('Language')}: &nbsp;&nbsp;</Box>
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