import { Typography } from '@mui/material';
import React from 'react';
import { CustomPalette } from '../constants/customPalette';


const HelpPageH2Title = ({ text }) => {
  return (
    <Typography    variant="h2" component="h2" sx={{ fontFamily:'roboto', fontSize: '3.25rem' , color: CustomPalette.SECONDARY, fontWeight: '700', textAlign: 'center', marginBottom: '1.5rem'  }}>
      {text}
    </Typography>
  );
};

export default HelpPageH2Title;