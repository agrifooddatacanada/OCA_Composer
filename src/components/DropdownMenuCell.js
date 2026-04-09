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
  isDisabled = false,
  renderDisplayValue,
  stretchInCell = false,
  selectChevronPaddingPx = 28
}) => (
  <Box
    sx={{
      height: "105%",
      display: "flex",
      alignItems: "center",
      width: "100%",
      minWidth: 0,
      ...(stretchInCell
        ? { flex: 1, alignSelf: "stretch", maxWidth: "100%" }
        : {})
    }}
  >
    <FormControl
      fullWidth
      variant="standard"
      sx={{
        height: "100%",
        minWidth: 0,
        ...(stretchInCell
          ? { width: "100%", maxWidth: "100%", flex: 1 }
          : {})
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
          fontSize: "small",
          ...(stretchInCell
            ? {
                width: "100%",
                maxWidth: "100%",
                boxSizing: "border-box",
                "& .MuiInput-root, & .MuiInputBase-root": {
                  width: "100%",
                  maxWidth: "100%"
                },
                "& .MuiSelect-select": {
                  width: "100% !important",
                  minWidth: "0 !important",
                  maxWidth: "100% !important",
                  boxSizing: "border-box",
                  paddingRight: `${selectChevronPaddingPx}px !important`
                },
                "& .MuiSelect-icon": {
                  right: 0
                }
              }
            : {})
        }}
        onClick={handleClick}
        open={isDropdownOpen}
        onClose={() => setIsDropdownOpen(false)}
        onOpen={() => setIsDropdownOpen(true)}
        renderValue={renderDisplayValue || ((value) => value || "\u200B")}
        MenuProps={{
          disableScrollLock: true
        }}
      >
        {typesDisplay}
      </Select>
    </FormControl>
  </Box>
);
