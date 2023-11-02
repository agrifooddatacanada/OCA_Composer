import { Box, Button, Typography, useMediaQuery } from '@mui/material';
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
import Drop from '../StartSchema/Drop';
import useHandleAllDrop from '../StartSchema/useHandleAllDrop';
import useGenerateReadMe from '../ViewSchema/useGenerateReadMe';
import { Context } from '../App';
import useExportLogic from '../ViewSchema/useExportLogic';

const AccordionList = () => {
  const navigate = useNavigate();
  const { zipToReadme } = useContext(Context);
  const { toTextFile } = useGenerateReadMe();
  const {
    rawFile,
    setRawFile,
    setLoading,
    loading,
    dropDisabled,
    dropMessage,
    setDropMessage,
    setCurrentPage,
    setIsZip
  } = useHandleAllDrop();
  const { handleExport, resetToDefaults } = useExportLogic();

  const navigateToStartPage = () => {
    resetToDefaults();
    setCurrentPage('Start');
    navigate('/start');
  };

  const navigateToMetadataPage = () => {
    setIsZip(false);
    setCurrentPage('Metadata');
    navigate('/start');
  };

  const navigateToViewPage = () => {
    setIsZip(true);
    setCurrentPage('View');
    navigate('/start');
  };

  const disableButtonCheck = rawFile.length === 0 || loading === true;

  const isMobile = useMediaQuery('(max-width: 767px)'); // Adjust the screen width as needed

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center', // Center both on mobile and desktop
        flexDirection: isMobile ? 'column' : 'row', //Correct formatting depending on screen size
        alignItems: 'center',
        maxWidth: '1500px',
        gap: 8,
        marginX: 2,
        marginBottom: 10,
        paddingX: 4,
      }}
    >
      {isMobile && (
        // Display "Quick Links" as column on mobile devices
        <Box sx={{ display:'flex', backgroundColor: '#ffefea', width: '100%', paddingX: 3 , flexDirection: 'column'}}>
          <Typography sx={{ fontSize: '23px', fontWeight: '400', textAlign: 'center', width: '100%', marginTop: 2 }}>Quick Links</Typography>
          <CustomAnchorLink text="Write a schema" overrideStyle={{ fontSize: '20px', fontWeight: '500', color: CustomPalette.PRIMARY, marginTop: 2 }} onClick={navigateToStartPage} />
          {/* <CustomAnchorLink text="Find a schema" overrideStyle={{ fontSize: '20px', fontWeight: '500', color: CustomPalette.PRIMARY, marginTop: 2 }} onClick={navigateToStartPage} />
          <CustomAnchorLink link="https://www.semanticengine.org/#/develop" text="Parse a schema" overrideStyle={{ fontSize: '20px', fontWeight: '500', color: CustomPalette.PRIMARY, marginTop: 2 }} /> */}
          <Drop
            setFile={setRawFile}
            setLoading={setLoading}
            loading={loading}
            dropDisabled={dropDisabled}
            dropMessage={dropMessage}
            setDropMessage={setDropMessage}
            version={1}
          />
          <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
            <Button
              variant="contained"
              color="navButton"
              onClick={navigateToViewPage}
              sx={{ backgroundColor: CustomPalette.PRIMARY, ":hover": { backgroundColor: CustomPalette.SECONDARY }, width: '100%', maxWidth: '300px', marginTop: '30px' }}
              disabled={disableButtonCheck}
            >
              View Schema
            </Button>
            <Button
              variant="contained"
              color="navButton"
              onClick={navigateToMetadataPage}
              sx={{ backgroundColor: CustomPalette.PRIMARY, ":hover": { backgroundColor: CustomPalette.SECONDARY }, width: '100%', maxWidth: '300px', marginTop: '30px' }}
              disabled={disableButtonCheck}
            >
              Edit Schema
            </Button>
            <Button
              variant="contained"
              color="navButton"
              onClick={() => toTextFile(zipToReadme)}
              sx={{ backgroundColor: CustomPalette.PRIMARY, ":hover": { backgroundColor: CustomPalette.SECONDARY }, width: '100%', maxWidth: '300px', marginTop: '30px', marginBottom: '20px' }}
              disabled={disableButtonCheck}
            >
              Generate Readme
            </Button>
          </Box>
        </Box>
      )}
      
      <Box sx={{ maxWidth: '500px', minWidth: '300px', width: "100%" }}>
        <SchemaAccordionItem />
        <WriteASchemaAccordionItem navigateToStartPage={navigateToStartPage} />
        {/* <FindASchemaAccordionItem /> */}
        <StoreASchemaAccordionItem />
        <UseASchemaAccordionItem />
        <UseASchemaWithDataAccordionItem disableButtonCheck={disableButtonCheck} handleExport={handleExport} />
      </Box>

      {!isMobile && (
        // Display "Quick Links" as row on desktop
        <Box sx={{ display: 'flex', backgroundColor: '#ffefea', width: '100%', paddingX: 3, flexDirection: 'column' }}>
          <Typography sx={{ fontSize: '23px', fontWeight: '400', textAlign: 'center', width: '100%', marginTop: 2 }}>Quick Links</Typography>
          <CustomAnchorLink text="Write a schema" overrideStyle={{ fontSize: '20px', fontWeight: '500', color: CustomPalette.PRIMARY, marginTop: 2 }} onClick={navigateToStartPage} />
          {/* <CustomAnchorLink text="Find a schema" overrideStyle={{ fontSize: '20px', fontWeight: '500', color: CustomPalette.PRIMARY, marginTop: 2 }} onClick={navigateToStartPage} />
          <CustomAnchorLink link="https://www.semanticengine.org/#/develop" text="Parse a schema" overrideStyle={{ fontSize: '20px', fontWeight: '500', color: CustomPalette.PRIMARY, marginTop: 2 }} /> */}
          <Drop
            setFile={setRawFile}
            setLoading={setLoading}
            loading={loading}
            dropDisabled={dropDisabled}
            dropMessage={dropMessage}
            setDropMessage={setDropMessage}
            version={1}
          />
          <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
            <Button
              variant="contained"
              color="navButton"
              onClick={navigateToViewPage}
              sx={{ backgroundColor: CustomPalette.PRIMARY, ":hover": { backgroundColor: CustomPalette.SECONDARY }, width: '100%', maxWidth: '300px', marginTop: '30px' }}
              disabled={disableButtonCheck}
            >
              View Schema
            </Button>
            <Button
              variant="contained"
              color="navButton"
              onClick={navigateToMetadataPage}
              sx={{ backgroundColor: CustomPalette.PRIMARY, ":hover": { backgroundColor: CustomPalette.SECONDARY }, width: '100%', maxWidth: '300px', marginTop: '30px' }}
              disabled={disableButtonCheck}
            >
              Edit Schema
            </Button>
            <Button
              variant="contained"
              color="navButton"
              onClick={() => toTextFile(zipToReadme)}
              sx={{ backgroundColor: CustomPalette.PRIMARY, ":hover": { backgroundColor: CustomPalette.SECONDARY }, width: '100%', maxWidth: '300px', marginTop: '30px', marginBottom: '20px' }}
              disabled={disableButtonCheck}
            >
              Generate Readme
            </Button>
          </Box>
        </Box>
      )}



    </Box>
  );
};

export default AccordionList;
