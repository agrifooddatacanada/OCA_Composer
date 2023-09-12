import { Box } from '@mui/material';
import React from 'react';
import { CustomPalette } from '../constants/customPalette';
import QuickStart from './Quick_Start';
import Introduction from './Introduction';
import AccordionList from './AccordionList';


const Landing = () => {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
      <Box sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-around', maxWidth: '1500px', paddingRight: 5, paddingLeft: 5, gap: 10, marginTop: '10px' }}>
        <Introduction />
      </Box>
      <Box sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'center', backgroundColor: CustomPalette.PRIMARY, marginTop: '30px', width: '100%' }}>
        <QuickStart />
      </Box>
      <Box sx={{ width: '100%', display: 'flex', flexDirection: 'row', justifyContent: 'center', marginTop: '30px' }}>
        <AccordionList />
      </Box>
    </Box >
  );
};


export default Landing;