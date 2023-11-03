import { Typography } from '@mui/material';
import React from 'react';

const LandingPageH2Title = ({ text }) => {
  return (
    <Typography variant="h2" component="h2" sx={{ fontWeight: 'normal' }}>
      {text}
    </Typography>
  );
};

export default LandingPageH2Title;