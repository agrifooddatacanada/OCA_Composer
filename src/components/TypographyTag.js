import { Typography } from '@mui/material';
import React from 'react';

const TypographyTag = ({ children, type = 'p' }) => {
  return (
    <Typography variant="body1" component={type} sx={{ fontSize: 20 }}>
      {children}
    </Typography>
  );
};

export default TypographyTag;