import React from "react";
import { useTranslation } from "react-i18next";
import { useTheme } from "@mui/material/styles";
import OutlinedInput from "@mui/material/OutlinedInput";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import Select from "@mui/material/Select";
import { Box, Checkbox } from "@mui/material";
import CustomPalette from "../constants/customPalette";
import { SHOW_ALL_DATA, SHOW_ONLY_ROWS_WITH_ERRORS } from "../constants/constants";

const ITEM_HEIGHT = 30;
const ITEM_PADDING_TOP = 0;
const MenuProps = {
  PaperProps: {
    style: {
      maxHeight: ITEM_HEIGHT * 6.5 + ITEM_PADDING_TOP,
      width: 200
    }
  }
};

const ERROR_GROUP = ["Format", "Entry Codes", "Character Encoding", "Data Type"];

function getStyles(name, errorName, theme) {
  return {
    fontWeight:
      errorName.indexOf(name) === -1
        ? theme.typography.fontWeightRegular
        : theme.typography.fontWeightMedium
  };
}

function ErrorFilterSelect({ errorName, setErrorNameList, disabled }) {
  const theme = useTheme();
  const { t } = useTranslation();

  // Add these helper functions at component level
  const handleShowAllData = () => setErrorNameList([SHOW_ALL_DATA]);

  const handleShowOnlyErrors = () => {
    if (errorName.includes(SHOW_ONLY_ROWS_WITH_ERRORS)) {
      setErrorNameList([SHOW_ALL_DATA]);
    } else {
      setErrorNameList([SHOW_ONLY_ROWS_WITH_ERRORS, ...ERROR_GROUP]);
    }
  };

  const handleErrorTypeChange = (name, checked) => {
    let newSelection = errorName.filter((item) => item !== SHOW_ALL_DATA);

    if (checked) {
      newSelection.push(name);
      if (!newSelection.includes(SHOW_ONLY_ROWS_WITH_ERRORS)) {
        newSelection.push(SHOW_ONLY_ROWS_WITH_ERRORS);
      }
    } else {
      newSelection = newSelection.filter((item) => item !== name);
      if (!newSelection.some((item) => ERROR_GROUP.includes(item))) {
        newSelection = [SHOW_ALL_DATA];
      }
    }

    setErrorNameList(newSelection);
  };

  const handleChange = (event) => {
    const { value: selectedValues } = event.target;
    const newValue =
      selectedValues.find((value) => !errorName.includes(value)) ||
      errorName.find((value) => !selectedValues.includes(value));

    if (newValue === SHOW_ALL_DATA) {
      handleShowAllData();
    } else if (newValue === SHOW_ONLY_ROWS_WITH_ERRORS) {
      handleShowOnlyErrors();
    } else if (ERROR_GROUP.includes(newValue)) {
      handleErrorTypeChange(newValue, !errorName.includes(newValue));
    }
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "row"
      }}
    >
      <Box
        sx={{
          color: CustomPalette.PRIMARY,
          fontWeight: "bold",
          alignSelf: "center",
          textAlign: "center"
        }}
      >
        {t("Filter rows:")} &nbsp;&nbsp;
      </Box>
      <FormControl sx={{ width: 280 }} size="small" disabled={disabled}>
        <Select
          multiple
          displayEmpty
          value={errorName}
          onChange={handleChange}
          input={<OutlinedInput />}
          renderValue={(selected) => {
            if (selected.length === 0) {
              return <em>{t("Select Errors")}</em>;
            }
            if (selected.includes(SHOW_ALL_DATA)) {
              return t("Show all data");
            }
            if (selected.includes(SHOW_ONLY_ROWS_WITH_ERRORS)) {
              return t("Show only rows with errors");
            }
            return selected.join(", ");
          }}
          MenuProps={MenuProps}
        >
          <MenuItem value={SHOW_ALL_DATA}>
            <Checkbox
              checked={errorName.includes(SHOW_ALL_DATA)}
              onChange={handleShowAllData}
            />
            {t("Show all data")}
          </MenuItem>

          <MenuItem value={SHOW_ONLY_ROWS_WITH_ERRORS}>
            <Checkbox
              checked={errorName.includes(SHOW_ONLY_ROWS_WITH_ERRORS)}
              onChange={handleShowOnlyErrors}
            />
            {t("Show only rows with errors")}
          </MenuItem>

          {ERROR_GROUP.map((name) => (
            <MenuItem
              key={name}
              value={name}
              style={getStyles(name, errorName, theme)}
              sx={{ pl: 4, fontSize: "14px" }}
            >
              <Checkbox
                checked={errorName.includes(name)}
                onChange={(event) => handleErrorTypeChange(name, event.target.checked)}
              />
              {t(name)}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Box>
  );
}

export default ErrorFilterSelect;

