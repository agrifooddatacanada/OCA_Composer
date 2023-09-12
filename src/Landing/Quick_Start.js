import { Box, Typography } from '@mui/material';
import React from 'react';

const QuickStart = () => {
  return (
    <Box sx={{ maxWidth: '1500px', padding: 10, color: 'white', textAlign: 'left' }}>
      <Typography sx={{ fontWeight: '800' }}>
        Quick-start:
      </Typography>
      <Typography sx={{ fontWeight: '600' }}>
        1. Write your schema and generate the schema .zip bundle and a simple .txt Readme.
      </Typography>
      <Typography sx={{ fontWeight: '600' }}>
        2. Use your .zip schema here to view, validate, and generate an Excel sheet for data input aligned with your schema.
      </Typography>
      <Typography sx={{ fontWeight: '600' }}>
        3. Store your schema files with your data, put them in a repository, or collaborate by sharing them with others.
      </Typography>
    </Box>
  );
};

export default QuickStart;