import { Box, Typography } from '@mui/material';
import React from 'react';

const CreatingOCASchemaHelp = () => {
  return (
    <Box sx={{ flex: 1, textAlign: 'left', padding: '1rem' }}>
      <Typography variant="h2" component="h2">
        Creating schema help with this page
      </Typography>
      <br />
      <Typography variant="body1">
        If you already have a dataset in an Excel or .csv file, you can drag and drop this file onto the main page box. You will not be uploading any data. Instead, the local version of this website will read the file and extract headers (assuming they are the first row). These headers become automatically added as attributes to the schema you are creating.
      </Typography>
      <br />
      <Typography variant="body1" component="p">
        Alternatively, you may create your schema manually, where you will need to write in each attribute name through the user interface.
      </Typography>
    </Box>
  );
};

export default CreatingOCASchemaHelp;