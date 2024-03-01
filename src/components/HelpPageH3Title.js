import { Typography } from '@mui/material';
import React from 'react';


const HelpPageH3Title = ({ text }) => {
  return (
    <Typography variant="h3" component="h3"   sx={{ textAlign: 'left' , fontFamily:'roboto', fontSize: '2rem' , color: 'black', fontWeight: 'bold' }}>
      {text}
    </Typography>
  );
};

export default HelpPageH3Title;