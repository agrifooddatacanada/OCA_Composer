import { Typography } from '@mui/material';
import React from 'react';

const TypographyTag = ({ children, type = 'p', overrideStyle }) => {
  return (
    <Typography variant="body1" component={type} sx={{ fontSize: 20, ...overrideStyle }}>
      {children}
    </Typography>
  );
};

export default TypographyTag;