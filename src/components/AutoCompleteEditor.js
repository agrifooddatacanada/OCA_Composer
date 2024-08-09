import React, { useState, forwardRef, useImperativeHandle, useEffect, useRef } from 'react';
import TextField from '@mui/material/TextField';
import Autocomplete from '@mui/material/Autocomplete';
import { styled } from '@mui/material/styles';
import Popper from '@mui/material/Popper';

const CustomPopper = styled(Popper)(({ theme }) => ({ width: '100%' }));

const AutoCompleteEditor = forwardRef((props, ref) => {
const [value, setValue] = useState(props.value || null);
const [inputValue, setInputValue] = useState();
const inputRef = useRef(null);

useEffect(() => {
    setValue(props.value);
}, [props.value]);

const onChangeHandler = (event, newValue) => {
    setValue(newValue);
};

const onInputChangeHandler = (event, newInputValue) => {
    setInputValue(newInputValue);
};

useImperativeHandle(ref, () => ({
    getValue: () => value,
    afterGuiAttached: () => {
    setValue(props.value);
    setTimeout(() => {
        inputRef.current.focus();
    }, 100);
    },
}));

return (
    <Autocomplete
        sx={{ width: '100%' }}
        freeSolo
        disableClearable
        clearOnEscape
        autoHighlight
        selectOnFocus
        clearOnBlur
        options={props.options}
        onChange={onChangeHandler}
        value={value}
        inputValue={inputValue}
        onInputChange={onInputChangeHandler}
        PopperComponent={CustomPopper}
        renderInput={(params) => (
        <TextField
            {...params}
            inputRef={inputRef}
            sx={{ 
            '& .MuiInputBase-input': { 
                fontSize: '0.80rem',
            },
            '& .MuiFormLabel-root': {
                fontSize: '0.8rem'
            }
            }}
            placeholder='Search...'
            InputProps={{
            ...params.InputProps,
            type: 'search',
            }}
        />
        )}
        getOptionLabel={(option) => option}
        renderOption={(props, option) => (
        <li {...props} style={{ fontSize: '0.8rem' }}>
            {option}
        </li>
        )}
    />
);
});

export default AutoCompleteEditor;