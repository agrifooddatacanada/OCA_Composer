import { Box } from '@mui/material';
import React from 'react';
import UseASchemaAccordionItem from './UseASchemaAccordionItem';
import UseASchemaWithDataAccordionItem from './UseASchemaWithDataAccordionItem';
import SchemaAccordionItem from './SchemaAccordionItem';
import WriteASchemaAccordionItem from './WriteASchemaAccordionItem';
import FindASchemaAccordionItem from './FindASchemaAccordionItem';
import StoreASchemaAccordionItem from './StoreASchemaAccordionItem';

const AccordionList = () => {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-around', maxWidth: '1500px', gap: 10, marginRight: 2, marginLeft: 2 }}>
      <Box sx={{ maxWidth: '500px' }}>
        <SchemaAccordionItem />
        <WriteASchemaAccordionItem />
        <FindASchemaAccordionItem />
        <StoreASchemaAccordionItem />
      </Box>
      <Box sx={{ maxWidth: '500px' }}>
        <UseASchemaAccordionItem />
        <UseASchemaWithDataAccordionItem />
      </Box>
    </Box>
  );
};

export default AccordionList;