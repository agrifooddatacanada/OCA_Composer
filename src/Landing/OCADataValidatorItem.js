import { AccordionDetails, AccordionSummary, Link, Typography } from '@mui/material';
import React from 'react';
import { CustomPalette } from '../constants/customPalette';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import AccordionItemWrapper from './AccordionItemWrapper';

const OCADataValidatorItem = () => {
  return (
    <AccordionItemWrapper>
      <AccordionSummary
        expandIcon={<ExpandMoreIcon sx={{ color: CustomPalette.PRIMARY, fontSize: 50 }} />}
        aria-controls="panel1a-content"
        id="panel1a-header"
      >
        <Typography sx={{ fontSize: '20px', fontWeight: '500' }}>Improve your data</Typography>
      </AccordionSummary>

      <AccordionDetails sx={{ textAlign: 'start' }}>
        <Typography>
          Validate your data against the rules in a data schema
        </Typography>
        <Link href="/oca-data-validator" sx={{ color: CustomPalette.PRIMARY, fontWeight: '700', cursor: 'pointer', textDecoration: 'none' }}>Learn about data validation</Link>
      </AccordionDetails>
    </AccordionItemWrapper>
  );
};

export default OCADataValidatorItem;