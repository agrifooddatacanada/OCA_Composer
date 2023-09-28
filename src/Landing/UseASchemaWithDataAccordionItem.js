import { AccordionDetails, AccordionSummary, Box, Button, Typography } from '@mui/material';
import React from 'react';
import { CustomPalette } from '../constants/customPalette';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import AccordionItemWrapper from './AccordionItemWrapper';
import CustomAnchorLink from '../components/CustomAnchorLink';

const UseASchemaWithDataAccordionItem = ({ disableButtonCheck, handleExport }) => {
  return (
    <AccordionItemWrapper>
      <AccordionSummary
        expandIcon={<ExpandMoreIcon sx={{ color: CustomPalette.PRIMARY, fontSize: 50 }} />}
        aria-controls="panel1a-content"
        id="panel1a-header"
      >
        <Typography sx={{ fontSize: '20px', fontWeight: '500' }}>Use a Schema with Data</Typography>
      </AccordionSummary>

      <AccordionDetails sx={{ textAlign: 'start' }}>
        <Typography>
          With your machine-readable .zip schema bundle you can begin to use it in your workflows.
        </Typography>
        <Typography sx={{ marginTop: '20px' }}>
          For example, using a schema as a template, generate an Excel sheet prepared for data entry. Or if you have a  python workflow you can incorporate data validation using data rules of the schema.
        </Typography>

        <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
          <Button
            variant="contained"
            color="navButton"
            onClick={handleExport}
            sx={{ backgroundColor: CustomPalette.PRIMARY, ":hover": { backgroundColor: CustomPalette.SECONDARY }, width: '100%', maxWidth: '300px', marginTop: '20px', marginBottom: '20px' }}
            disabled={disableButtonCheck}
          >
            Generate Data Entry Excel
          </Button>
          <CustomAnchorLink link='' text="Validate data against a schema" />
        </Box>
      </AccordionDetails>
    </AccordionItemWrapper>
  );
};

export default UseASchemaWithDataAccordionItem;