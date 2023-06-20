import { Box, Typography } from '@mui/material';
import React from 'react';

const StartSchemaHelp = () => {
  return (
    <Box sx={{ flex: 1, textAlign: 'left', padding: '1rem' }}>
      <Typography variant="h2" component="h2">
        Start Schema - Add attributes
      </Typography>
      <br />
      <Typography variant="body1">
        Add your unique list of attribute names, also known as variable names or your data column labels within your dataset. Because this field may be used by many different computer systems we recommend to not include spaces and use under_scores or CamelCase instead. Other recommendations for good attribute names include:
      </Typography>
      <br />
      <Typography variant="body1" component="li">
        Set Maximum length to 32 characters
      </Typography>
      <Typography variant="body1" component="li">
        Always start variable names with a letter
      </Typography>
      <Typography variant="body1" component="li">
        Numbers can be used anywhere in the variable name AFTER the first character
      </Typography>
      <Typography variant="body1" component="li">
        Do not use blanks or spaces
      </Typography>
      <br />
      <Typography variant="body1">
        Attribute names are recognized by different programs (machine readable) and so a good attribute name is one that won't cause problems downstream.
      </Typography>
    </Box>
  );
};

export default StartSchemaHelp;