import { Box } from '@mui/system';
import React from 'react';

const HelpPageContainer = ({ children }) => {
  return (
    <Box sx={{ fontFamily: 'roboto', fontWeight: ' 400', fontSize: '1rem', textAlign: 'left', padding: '1.5rem', paddingLeft: '3rem', paddingRight: '3rem' }}>
      {children}
    </Box>
  );
};

export default HelpPageContainer;