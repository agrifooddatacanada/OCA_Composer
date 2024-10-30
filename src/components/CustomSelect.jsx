import { FormControl, FormHelperText, MenuItem, Select, Typography } from "@mui/material";
import React from "react";
import { Controller } from "react-hook-form";

function CustomSelect({
  control,
  name,
  label,
  placeholder,
  fullWidth = true,
  labelStyles = {},
  options,
  errorMessage,
  defaultValue = "",
  ...rest
}) {
  return (
    <FormControl
      fullWidth={fullWidth}
      error={!!errorMessage}
      color="navButton"
      sx={{ ":not(:last-child)": { marginBottom: "16px" } }}
    >
      <Typography
        variant="h6"
        component="label"
        htmlFor={name}
        sx={{ fontSize: 15, ...labelStyles }}
        gutterBottom
      >
        {label}
      </Typography>
      <Controller
        name={name}
        control={control}
        defaultValue={defaultValue}
        render={({ field }) => (
          <Select {...field} id={name} {...rest} displayEmpty>
            <MenuItem value="" disabled>
              {placeholder}
            </MenuItem>
            {options.map((option) => (
              <MenuItem value={option} key={option}>
                {option}
              </MenuItem>
            ))}
          </Select>
        )}
      />
      {errorMessage && <FormHelperText>{errorMessage}</FormHelperText>}
    </FormControl>
  );
}

export default CustomSelect;
