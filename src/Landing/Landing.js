import { Box } from '@mui/material';
import React from 'react';
import { CustomPalette } from '../constants/customPalette';
import QuickStart from './Quick_Start';
import Introduction from './Introduction';
import AccordionList from './AccordionList';


const Landing = () => {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
      <Box sx={{ backgroundColor: CustomPalette.PRIMARY, width: '100%', height: '100%', paddingTop: 10, paddingBottom: 12, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
        <Introduction />
      </Box>
      <Box sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'center', backgroundColor: '#ffefea', width: '100%' }}>
        <QuickStart />
      </Box>
      <Box sx={{ width: '100%', display: 'flex', flexDirection: 'row', justifyContent: 'center', marginTop: '30px' }}>
        <AccordionList />
      </Box>
    </Box >
  );
};


export default Landing;