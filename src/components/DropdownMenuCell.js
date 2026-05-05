import React from "react";
import { Box, FormControl, Select } from "@mui/material";

// eslint-disable-next-line import/prefer-default-export
export const DropdownMenuList = ({
  handleKeyDown,
  type,
  handleChange,
  handleClick,
  isDropdownOpen,
  setIsDropdownOpen,
  typesDisplay,
  isDisabled = false
}) => (
  <Box
    sx={{
      height: "105%",
      display: "flex",
      alignItems: "center",
      width: "100%"
    }}
  >
    <FormControl
      fullWidth
      variant="standard"
      sx={{
        height: "100%"
      }}
      onKeyDown={handleKeyDown}
      disabled={isDisabled}
    >
      <Select
        id="select-drop"
        value={type || ""}
        label="Type"
        onChange={handleChange}
        sx={{
          height: "100%",
          fontSize: "small"
        }}
        onClick={handleClick}
        open={isDropdownOpen}
        onClose={() => setIsDropdownOpen(false)}
        onOpen={() => setIsDropdownOpen(true)}
        renderValue={(value) => value}
      >
        {typesDisplay}
      </Select>
    </FormControl>
  </Box>
);
