import { Typography } from '@mui/material';
import React from 'react';

const HelpPageH3Title = ({ text }) => {
  return (
    <Typography variant="h3" component="h3">
      {text}
    </Typography>
  );
};

export default HelpPageH3Title;