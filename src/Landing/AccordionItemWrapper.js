import { Accordion } from '@mui/material';
import React from 'react';
import { CustomPalette } from '../constants/customPalette';

const AccordionItemWrapper = ({ children }) => {
  return (
    <Accordion elevation={0} sx={AccordionStyle}>
      {children}
    </Accordion>
  );
};

const AccordionStyle = {
  // borderBottom: `3px solid ${CustomPalette.PRIMARY}`,
  marginTop: 5,
  "&.MuiAccordion-root:before": {
    backgroundColor: "white"
  },
  "& .MuiButtonBase-root": {
    display: '',
  },
  "& .MuiButtonBase-root": {
    borderBottom: `3px solid ${CustomPalette.PRIMARY}`,
  }
};

export default AccordionItemWrapper;