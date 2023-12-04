import { AccordionDetails, AccordionSummary, Box, Button, Typography } from '@mui/material';
import React from 'react';
import { CustomPalette } from '../constants/customPalette';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import AccordionItemWrapper from './AccordionItemWrapper';
import CustomAnchorLink from '../components/CustomAnchorLink';

const StoreASchemaAccordionItem = () => {
  return (
    <AccordionItemWrapper>
      <AccordionSummary
        expandIcon={<ExpandMoreIcon sx={{ color: CustomPalette.PRIMARY, fontSize: 50 }} />}
        aria-controls="panel1a-content"
        id="panel1a-header"
      >
        <Typography sx={{ fontSize: '20px', fontWeight: '500' }}>Store a Schema</Typography>
      </AccordionSummary>

      <AccordionDetails sx={{ textAlign: 'start' }}>
        <Typography>
          Store your schema multiple ways.
        </Typography>
        <Typography>
          1. Store a schema with your dataset and share it when you share your data.
        </Typography>
        <Typography>
          2. Share a schema with your lab or collaborators by storing it in a shared lab drive.
        </Typography>
        <Typography>
          3. Store your schema as an independent object in a repository such as Borealis or Zenodo.
        </Typography>
        <Typography sx={{ marginTop: '20px', marginBottom: '20px' }}>
          Store the .json machine-readable version and the .txt human-readable version together for best usability.
        </Typography>
        <CustomAnchorLink link='https://agrifooddatacanada.github.io/OCA_training_pathway/deposit_schema.html' text="Read more about storage" overrideStyle={{ fontSize: '20px', fontWeight: '500', color: CustomPalette.PRIMARY }} />
      </AccordionDetails>
    </AccordionItemWrapper>
  );
};

export default StoreASchemaAccordionItem;