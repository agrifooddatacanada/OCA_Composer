import { AccordionDetails, AccordionSummary, Box, Typography } from '@mui/material';
import React from 'react';
import { CustomPalette } from '../constants/customPalette';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import AccordionItemWrapper from './AccordionItemWrapper';
import CustomAnchorLink from '../components/CustomAnchorLink';
import GuidanceForDesigningDataSets from './help_designing_datasets';

const WriteASchemaAccordionItem = ({ navigateToStartPage }) => {
  return (
    <AccordionItemWrapper>
      <AccordionSummary
        expandIcon={<ExpandMoreIcon sx={{ color: CustomPalette.PRIMARY, fontSize: 50 }} />}
        aria-controls="panel1a-content"
        id="panel1a-header"
      >
        <Typography sx={{ fontSize: '20px', fontWeight: '500' }}>Write a Schema</Typography>
      </AccordionSummary>

      <AccordionDetails sx={{ textAlign: 'start' }}>
        <Typography>
          Using our <CustomAnchorLink text="schema writer" onClick={navigateToStartPage} /> you can easily create human- and machine-readable versions of your schema.
        </Typography>
        <Typography sx={{ marginTop: '20px', marginBottom: '20px' }}>
          You will either be documenting an existing dataset or you will start with an idea of what columns or variables you will be collecting for your dataset.

          <CustomAnchorLink link='help_designing_datasets' text="Learn more about how to design a dataset" />.
        </Typography>

        <Box sx={{ width: "100%", display: 'flex', flexDirection: 'row', justifyContent: 'center' }}>
          <CustomAnchorLink text="Write a schema" overrideStyle={{ fontSize: '20px', fontWeight: '500', color: CustomPalette.PRIMARY }} onClick={navigateToStartPage} />
        </Box>

      </AccordionDetails>
    </AccordionItemWrapper>
  );
};

export default WriteASchemaAccordionItem;