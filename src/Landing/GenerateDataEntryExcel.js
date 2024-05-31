import React, { useState } from 'react';
import {
  Button, Dialog, DialogActions, DialogContent,
  DialogTitle, MenuItem, Select, FormControl, InputLabel, Box,
} from '@mui/material';
import { generateDataEntry } from './generateDataEntry';
import { generateDataEntryV2 } from './generateDataEntryV2';
import { CustomPalette } from '../constants/customPalette';

// Todo: Function that gets the languages.
const languages = ['eng', 'fr'];

const GenerateDataEntryExcel = ({ rawFile, setLoading, disableButtonCheck }) => {
  const [open, setOpen] = useState(false);
  const [selectedLang, setSelectedLang] = useState('');

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = (confirm) => {
    setOpen(false);
    if (confirm && selectedLang) {
      generateDataEntryV2(rawFile, setLoading, selectedLang);
      if (rawFile?.[0]?.type?.includes('zip')) {
        generateDataEntry(rawFile, setLoading, selectedLang);
      } else if (rawFile?.[0]?.type?.includes('json')) {
        generateDataEntryV2(rawFile, setLoading, selectedLang);
      }
    }
    setSelectedLang('');
  };

  const handleLangChange = (event) => {
    setSelectedLang(event.target.value);
  }

  return (
    <>
      <Button
        variant='contained'
        color='navButton'
        onClick={handleClickOpen}
        sx={{
          backgroundColor: CustomPalette.PRIMARY,
          ':hover': { backgroundColor: CustomPalette.SECONDARY },
          width: '100%',
          maxWidth: '300px',
          marginTop: '30px',
          marginBottom: '20px',
        }}
        disabled={disableButtonCheck}
      >
        Generate Data Entry Excel
      </Button>
      <Dialog open={open} onClose={() => handleClose(false)}>
        <DialogTitle
          sx={{
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center'
          }}
        > Select a language
        </DialogTitle>
        <DialogContent
          sx={{
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center'
          }}
        >
          <Box>Choose a language for the generated data entry excel file.</Box>
          <Box
            sx={{ marginTop: 2 }}
          >
            <FormControl
              sx={{
                '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderColor: CustomPalette.PRIMARY,
                },
                '& .MuiInputLabel-root.Mui-focused': {
                  color: CustomPalette.PRIMARY,
                },
              }}
            >
              <InputLabel id="language-label"
                sx={{ color: 'black',
                  '&.MuiInputLabel-shrink': {
                    color: 'black',
                  },
                }}
              >Language</InputLabel>
              <Select
                value={selectedLang}
                onChange={handleLangChange}
                label="Language"
                  sx={{
                    width: '120px',
                    '& .MuiSelect-select': {
                      textAlign: 'center',
                      justifyContent: 'center',
                      flexDirection: 'column',
                      alignItems: 'center',
                    },
                  }}
              >
                {languages.map((lang) => (
                  <MenuItem key={lang} value={lang}
                    sx={{justifyContent: 'center', flexDirection: 'column', alignItems: 'center'}}
                  >{lang}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => handleClose(false)} sx={{ color: CustomPalette.PRIMARY}} >Cancel</Button>
          <Button onClick={() => handleClose(true)} sx={{ color: CustomPalette.PRIMARY}} >Confirm</Button>
        </DialogActions>

      </Dialog>
    </>
  );
};

export default GenerateDataEntryExcel;