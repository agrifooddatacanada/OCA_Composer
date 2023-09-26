import { AccordionDetails, AccordionSummary, Box, Button, Typography } from '@mui/material';
import React from 'react';
import { CustomPalette } from '../constants/customPalette';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import AccordionItemWrapper from './AccordionItemWrapper';
import CustomAnchorLink from '../components/CustomAnchorLink';

const FindASchemaAccordionItem = () => {
  return (
    <AccordionItemWrapper>
      <AccordionSummary
        expandIcon={<ExpandMoreIcon sx={{ color: CustomPalette.PRIMARY, fontSize: 50 }} />}
        aria-controls="panel1a-content"
        id="panel1a-header"
      >
        <Typography sx={{ fontSize: '20px', fontWeight: '500' }}>Find a Schema</Typography>
      </AccordionSummary>

      <AccordionDetails sx={{ textAlign: 'start' }}>
        <Typography>
          Search the open schema repository to find if a schema exists that already meets your needs.
        </Typography>
        <Typography sx={{ marginTop: '20px', marginBottom: '20px' }}>
          You can always edit an existing schema  you find to make it suitable for your work.
        </Typography>

        <Box sx={{ width: "100%", display: 'flex', flexDirection: 'row', justifyContent: 'center' }}>
          <CustomAnchorLink link='' text="Find a schema" overrideStyle={{ fontSize: '20px', fontWeight: '500', color: CustomPalette.PRIMARY }} />
        </Box>

      </AccordionDetails>
    </AccordionItemWrapper>
  );
};

export default FindASchemaAccordionItem;