import React, {
  forwardRef,
  useImperativeHandle,
  useEffect,
  useRef,
  useState
} from "react";
import TextField from "@mui/material/TextField";
import Autocomplete from "@mui/material/Autocomplete";
import { styled } from "@mui/material/styles";
import Popper from "@mui/material/Popper";

const CustomPopper = styled(Popper)(({ theme }) => ({ width: "100%" }));

const AutoCompleteEditor = forwardRef((props, ref) => {
  const [options, setOptions] = useState(props.options || []);
  // const inputRef = useRef(props.value);
  const inputRef = useRef();
  // const [value, setValue] = useState(props.value || "");

  const onInputChangeHandler = (event, newInputValue) => {
    inputRef.current.value = newInputValue;

    // Call the search function if provided
    if (props.search) {
      props.search(newInputValue, setOptions);
    }
  };

  useEffect(() => {
    inputRef.current.focus();
  }, []);

  // useEffect(() => {
  //   if (!options.includes(value)) {
  //     setValue(""); // Reset value if it doesn't exist in options
  //   }
  // }, [options, value]);

  useImperativeHandle(ref, () => ({
    getValue: () => inputRef.current.value
  }));

  return (
    <Autocomplete
      sx={{ width: "100%" }}
      disableClearable
      clearOnEscape
      autoHighlight
      selectOnFocus
      clearOnBlur
      options={options}
      value={props.value}
      onInputChange={onInputChangeHandler}
      PopperComponent={CustomPopper}
      renderInput={(params) => (
        <TextField
          {...params}
          inputRef={inputRef}
          sx={{
            "& .MuiInputBase-input": {
              fontSize: "0.80rem"
            },
            "& .MuiFormLabel-root": {
              fontSize: "0.8rem"
            }
          }}
          placeholder="Search..."
          InputProps={{
            ...params.InputProps,
            type: "search"
          }}
        />
      )}
      getOptionLabel={(option) => option}
      renderOption={(props, option) => (
        <li {...props} style={{ fontSize: "0.8rem" }}>
          {option}
        </li>
      )}
    />
  );
});

export default AutoCompleteEditor;
