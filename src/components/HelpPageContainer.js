import { Box } from '@mui/system';
import React from 'react';
import Header from '../Header/Header';
import Footer from '../Footer/Footer';

const HelpPageContainer = ({ children }) => {
  return (
    <>
      <Header currentPage="Landing" />
      <Box sx={{ fontFamily: 'roboto', fontWeight: ' 400', fontSize: '1rem', textAlign: 'left', padding: '1.5rem', paddingLeft: '3rem', paddingRight: '3rem' }}>
        {children}
      </Box>
      <Footer currentPage="Landing" />
    </>
  );
};

export default HelpPageContainer;