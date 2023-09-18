import { Box, Button, Typography } from '@mui/material';
import React, { useContext } from 'react';
import UseASchemaAccordionItem from './UseASchemaAccordionItem';
import UseASchemaWithDataAccordionItem from './UseASchemaWithDataAccordionItem';
import SchemaAccordionItem from './SchemaAccordionItem';
import WriteASchemaAccordionItem from './WriteASchemaAccordionItem';
import FindASchemaAccordionItem from './FindASchemaAccordionItem';
import StoreASchemaAccordionItem from './StoreASchemaAccordionItem';
import CustomAnchorLink from '../components/CustomAnchorLink';
import { CustomPalette } from '../constants/customPalette';
import { useNavigate } from 'react-router-dom';
import { Context } from '../App';

const AccordionList = () => {
  const navigate = useNavigate();
  const { setCurrentPage } = useContext(Context);

  const navigateToStartPage = () => {
    setCurrentPage('Start');
    navigate('/start');
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-around', maxWidth: '1500px', gap: 8, marginRight: 2, marginLeft: 2, marginBottom: 10 }}>
      <Box sx={{ maxWidth: '500px', minWidth: '300px', width: "100%" }}>
        <SchemaAccordionItem />
        <WriteASchemaAccordionItem navigateToStartPage={navigateToStartPage} />
        <FindASchemaAccordionItem />
        <StoreASchemaAccordionItem />
        <UseASchemaAccordionItem navigateToStartPage={navigateToStartPage} />
        <UseASchemaWithDataAccordionItem />
      </Box>
      <Box sx={{ maxWidth: '500px', minWidth: '300px', width: "100%", display: 'flex', flexDirection: 'column', justifyContent: 'flex-start' }}>
        <Box sx={{ width: '100%', border: `1px solid ${CustomPalette.PRIMARY}`, display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', alignItems: 'flex-start', backgroundColor: '#ffefea' }}>
          <Typography sx={{ fontSize: '23px', fontWeight: '400', textAlign: 'center', width: '100%', marginTop: 2 }}>Quick Links</Typography>
          <CustomAnchorLink link='https://docs.kantarainitiative.org/Blinding-Identity-Taxonomy-Report-Version-1.0.html' text="Write a schema" overrideStyle={{ fontSize: '20px', fontWeight: '500', color: CustomPalette.PRIMARY, marginLeft: 5, marginTop: 2 }} />
          <CustomAnchorLink link='https://docs.kantarainitiative.org/Blinding-Identity-Taxonomy-Report-Version-1.0.html' text="Find a schema" overrideStyle={{ fontSize: '20px', fontWeight: '500', color: CustomPalette.PRIMARY, marginLeft: 5, marginTop: 2 }} />
          <Box sx={{ border: 1, padding: '5px', height: '60px', marginTop: 4, display: 'flex', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', backgroundColor: '#CDCDCD', alignSelf: 'center' }}>
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
              sx={{ backgroundColor: CustomPalette.PRIMARY, ":hover": { backgroundColor: CustomPalette.SECONDARY }, width: '100%', maxWidth: '300px', marginTop: '30px' }}
            >
              Validate Schema
            </Button>
            <Button
              variant="contained"
              color="navButton"
              onClick={navigateToStartPage}
              sx={{ backgroundColor: CustomPalette.PRIMARY, ":hover": { backgroundColor: CustomPalette.SECONDARY }, width: '100%', maxWidth: '300px', marginTop: '30px' }}
            >
              View Schema
            </Button>
            <Button
              variant="contained"
              color="navButton"
              onClick={navigateToStartPage}
              sx={{ backgroundColor: CustomPalette.PRIMARY, ":hover": { backgroundColor: CustomPalette.SECONDARY }, width: '100%', maxWidth: '300px', marginTop: '30px' }}
            >
              Edit Schema
            </Button>
            <Button
              variant="contained"
              color="navButton"
              onClick={() => {

              }}
              sx={{ backgroundColor: CustomPalette.PRIMARY, ":hover": { backgroundColor: CustomPalette.SECONDARY }, width: '100%', maxWidth: '300px', marginTop: '30px' }}
            >
              Generate Readme
            </Button>
            <Button
              variant="contained"
              color="navButton"
              onClick={() => {

              }}
              sx={{ backgroundColor: CustomPalette.PRIMARY, ":hover": { backgroundColor: CustomPalette.SECONDARY }, width: '100%', maxWidth: '300px', marginTop: '30px', marginBottom: '20px' }}
            >
              Generate Data Entry Excel
            </Button>
          </Box>
        </Box>
      </Box>
    </Box >
  );
};

export default AccordionList;