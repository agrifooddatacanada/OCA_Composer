import { Box, Typography } from '@mui/material';
import React from 'react';

const AddEntryCodesHelp = () => {
  return (
    <Box sx={{ flex: 1, textAlign: 'left', padding: '1.5rem', paddingLeft: '3rem', paddingRight: '3rem' }}>
      <Typography variant="h2" component="h2" sx={{ fontWeight: 'normal' }}>
        Add Entry Codes
      </Typography>
      <br />
      <Typography variant="body1" component="p" sx={{ fontSize: 20 }}>
        For each attribute that you wanted to add entry codes for you will need to specificy the code and any language-specific labels.
      </Typography>
      <br />
      <Typography variant="body1" component="p" sx={{ fontSize: 20 }}>
        For example, in financial data entry systems there may be complex numerical codes that are recorded in the dataset. However, most people cannot remember the specific code numbers but they can remember the account name that is associated with the code. In this example the Entry Code is the numerical code that is expected in the dataset, but then you can give that numerical code an English (and other language) label to help users enter data.
      </Typography>
      <br />
      <Typography variant="body1" component="p" sx={{ fontSize: 20 }}>
        Another example would be a species name where the specific Entry Code may be the latin genus/species name while the English label may be the common name.
      </Typography>
      <br />
      <Typography variant="body1" component="p" sx={{ fontSize: 20 }}>
        If you don't need to have specific labels created for the Entry Codes (e.g. you create an Entry Code list of GO terms) you can copy the Entry Code into the language specific language columns.
      </Typography>
    </Box>
  );
};

export default AddEntryCodesHelp;