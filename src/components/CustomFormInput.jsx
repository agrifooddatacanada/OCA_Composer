import React from "react";
import { TextField, Typography, Box } from "@mui/material";
import { Controller } from "react-hook-form";

function CustomFormInput({
  control,
  name,
  label,
  placeholder,
  type = "text",
  fullWidth = true,
  labelStyles = {},
  defaultValue = "",
  ...rest
}) {
  return (
    <Box sx={{ ":not(:last-child)": { marginBottom: "16px" } }}>
      {label && (
        <Typography
          variant="h6"
          component="label"
          htmlFor={name}
          sx={{ fontSize: 15, display: "block", marginBottom: "0.35em", ...labelStyles }}
        >
          {label}
        </Typography>
      )}
      <Controller
        name={name}
        control={control}
        defaultValue={defaultValue}
        render={({ field, fieldState: { error } }) => (
          <TextField
            {...field}
            id={name}
            type={type}
            placeholder={placeholder}
            fullWidth={fullWidth}
            error={!!error}
            helperText={error ? error.message : null}
            color="navButton"
            {...rest}
          />
        )}
      />
    </Box>
  );
}

export default CustomFormInput;
