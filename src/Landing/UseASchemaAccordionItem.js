import { AccordionDetails, AccordionSummary, Box, Button, Typography } from '@mui/material';
import React from 'react';
import { CustomPalette } from '../constants/customPalette';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import AccordionItemWrapper from './AccordionItemWrapper';

const UseASchemaAccordionItem = () => {
  return (
    <AccordionItemWrapper>
      <AccordionSummary
        expandIcon={<ExpandMoreIcon sx={{ color: CustomPalette.PRIMARY, fontSize: 50 }} />}
        aria-controls="panel1a-content"
        id="panel1a-header"
      >
        <Typography sx={{ fontSize: '20px', fontWeight: '500' }}>Use a Schema</Typography>
      </AccordionSummary>

      <AccordionDetails sx={{ textAlign: 'start' }}>
        <Typography>
          When you have a .zip schema bundle you can upload and then:
        </Typography>
        <Typography>
          <strong>Validate</strong> the schema to ensure it is well-formed.
        </Typography>
        <Typography>
          <strong>View</strong> the schema and <strong>Edit</strong> the schema if needed.
        </Typography>
        <Typography>
          The .zip schema bundle is machine-readable; <strong>generate</strong> the Readme to create a human-readable simple text version.
        </Typography>

        <Box sx={{ border: 1, padding: '5px', height: '50px', margin: '10px', display: 'flex', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', backgroundColor: '#CDCDCD' }}>
          <Typography sx={{ fontSize: '18px', fontWeight: '700' }}>Upload schema bundle (.zip)
            Or drag and drop one
          </Typography>
        </Box>

        <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
          <Button
            variant="contained"
            color="navButton"
            onClick={() => {

            }}
            sx={{ backgroundColor: CustomPalette.PRIMARY, ":hover": { backgroundColor: CustomPalette.SECONDARY }, width: '100%', maxWidth: '300px', marginTop: '20px' }}
          >
            Validate Schema
          </Button>
          <Button
            variant="contained"
            color="navButton"
            onClick={() => {

            }}
            sx={{ backgroundColor: CustomPalette.PRIMARY, ":hover": { backgroundColor: CustomPalette.SECONDARY }, width: '100%', maxWidth: '300px', marginTop: '20px' }}
          >
            View Schema
          </Button>
          <Button
            variant="contained"
            color="navButton"
            onClick={() => {

            }}
            sx={{ backgroundColor: CustomPalette.PRIMARY, ":hover": { backgroundColor: CustomPalette.SECONDARY }, width: '100%', maxWidth: '300px', marginTop: '20px' }}
          >
            Edit Schema
          </Button>
          <Button
            variant="contained"
            color="navButton"
            onClick={() => {

            }}
            sx={{ backgroundColor: CustomPalette.PRIMARY, ":hover": { backgroundColor: CustomPalette.SECONDARY }, width: '100%', maxWidth: '300px', marginTop: '20px' }}
          >
            Generate Readme
          </Button>
        </Box>
      </AccordionDetails>
    </AccordionItemWrapper>
  );
};

export default UseASchemaAccordionItem;