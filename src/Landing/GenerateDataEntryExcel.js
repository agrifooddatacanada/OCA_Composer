import React, { useState} from 'react';
import {
  Button, Dialog, DialogActions, DialogContent,
  DialogTitle, MenuItem, Select, FormControl, InputLabel, Box, Typography,
} from '@mui/material';
import { generateDataEntry } from './generateDataEntry';
import { generateDataEntryV2 } from './generateDataEntryV2';
import { CustomPalette } from '../constants/customPalette';
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";

const GenerateDataEntryExcel = ({ rawFile, setLoading, disableButtonCheck }) => {
  // Todo: Function that gets the languages the raw file.
  // Todo: Adjust the dialog to small screen sizes.
  const languages = ['eng', 'fra'];

  const [open, setOpen] = useState(false);
  const [selectedLang, setSelectedLang] = useState('');

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = (confirm) => {
    setOpen(false);
    if (confirm && selectedLang) {
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
      <Dialog open={open} onClose={() => handleClose(false)}
        sx={{
          '& .MuiDialog-paper': {
            width: '50%',
            maxWidth: '40%',
            height: '30%',
            maxHeight: '50%',
          }
      }}
      >
        <DialogTitle
          sx={{
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center'
          }}
        >
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              width: "100%",
              backgroundColor: CustomPalette.RED_100,
              mb: 2,
            }}
          >
            <ErrorOutlineIcon
                sx={{
                color: CustomPalette.SECONDARY,
                p: 1,
                pl: 0,
                fontSize: 35,
              }}
            />
            <Typography variant="h5" sx={{ p: 1 }}>
              Select a language
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent
          sx={{
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center'
          }}
        >
          <Box sx={{ fontSize: 20, justifyContent: 'center' }}>
            Labels and Entry overlays will be in the language selected.
          </Box>
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
                    width: '130px',
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