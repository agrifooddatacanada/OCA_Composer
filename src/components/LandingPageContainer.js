import { Box } from '@mui/system';
import React from 'react';

const LandingPageContainter = ({ children }) => {
  return (
    <Box sx={{ flex: 1, textAlign: 'left', padding: '1.5rem', paddingLeft: '3rem', paddingRight: '3rem' }}>
      {children}
    </Box>
  );
};

export default LandingPageContainter;