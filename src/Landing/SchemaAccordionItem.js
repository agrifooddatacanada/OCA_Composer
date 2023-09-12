import { AccordionDetails, AccordionSummary, Box, Button, Typography } from '@mui/material';
import React from 'react';
import { CustomPalette } from '../constants/customPalette';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import AccordionItemWrapper from './AccordionItemWrapper';
import CustomAnchorLink from '../components/CustomAnchorLink';

const SchemaAccordionItem = () => {
  return (
    <AccordionItemWrapper>
      <AccordionSummary
        expandIcon={<ExpandMoreIcon sx={{ color: CustomPalette.PRIMARY, fontSize: 50 }} />}
        aria-controls="panel1a-content"
        id="panel1a-header"
      >
        <Typography sx={{ fontSize: '20px', fontWeight: '500' }}>What is a Schema</Typography>
      </AccordionSummary>

      <AccordionDetails sx={{ textAlign: 'start' }}>
        <Typography>
          Schemas are an important piece of data documentation. Schemas work together with a dataset and describe data features such as column names, units, and descriptions etc.
        </Typography>
        <Typography sx={{ marginTop: '20px' }}>
          Using the tools of the Semantic Engine you can write human- and machine-readable schemas.
        </Typography>
        <Typography onClick={() => console.log('Learn more')} sx={{ color: CustomPalette.PRIMARY, fontWeight: '700', cursor: 'pointer' }}>Learn more-{'>'}</Typography>
        <Typography sx={{ marginTop: '20px', fontSize: '20px', fontWeight: '700' }}>
          Example schema
        </Typography>
        <Typography>
          Download an <CustomAnchorLink link='https://docs.kantarainitiative.org/Blinding-Identity-Taxonomy-Report-Version-1.0.html' text="Example schema" /> and use it to test schema tools such as viewing, editing, and creating a Data Entry Excel.
        </Typography>

      </AccordionDetails>
    </AccordionItemWrapper>
  );
};

export default SchemaAccordionItem;