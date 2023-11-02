<<<<<<< HEAD
import { Box, Button, Typography, useMediaQuery } from '@mui/material';
=======

import { Box, Button, Typography, isMuiElement, useMediaQuery} from '@mui/material';

>>>>>>> c15ddb73cbc5de7d5471720940df3ddf8be5ccd3
import React, { useContext } from 'react';
import UseASchemaAccordionItem from './UseASchemaAccordionItem';
import UseASchemaWithDataAccordionItem from './UseASchemaWithDataAccordionItem';
import SchemaAccordionItem from './SchemaAccordionItem';
import WriteASchemaAccordionItem from './WriteASchemaAccordionItem';
// import FindASchemaAccordionItem from './FindASchemaAccordionItem';
import StoreASchemaAccordionItem from './StoreASchemaAccordionItem';
import CustomAnchorLink from '../components/CustomAnchorLink';
import { CustomPalette } from '../constants/customPalette';
import { useNavigate } from 'react-router-dom';
import Drop from '../StartSchema/Drop';
import useHandleAllDrop from '../StartSchema/useHandleAllDrop';
import useGenerateReadMe from '../ViewSchema/useGenerateReadMe';
import { Context } from '../App';
import useExportLogic from '../ViewSchema/useExportLogic';
import { generateDataEntry } from './generateDataEntry';




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

<<<<<<< HEAD
=======

 

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, marginRight: 1, marginLeft: 1, marginBottom: 10 }}>
      <Box sx={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center' }}>
        {/* Accordion Items (Position may change based on screen size) */}
        <Box sx={{ flex: '1', maxWidth: '500px', minWidth: '300px', width: "100%" }}>
          <SchemaAccordionItem />
          <WriteASchemaAccordionItem navigateToStartPage={navigateToStartPage} />
          <StoreASchemaAccordionItem />
          <UseASchemaAccordionItem />
          <UseASchemaWithDataAccordionItem disableButtonCheck={disableButtonCheck} handleExport={handleExport} />
        </Box>
        
        <Box sx={{ flex: '1', backgroundColor: '#ffefea', width: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', marginTop: 5, marginRight: 10 , marginLeft: 10}}>
          <Typography sx={{ fontSize: '23px', fontWeight: '400', textAlign: 'center', width: '100%', marginTop: 2 }}>Quick Links</Typography>
          <CustomAnchorLink text="Write a schema" overrideStyle={{ fontSize: '20px', fontWeight: '500', color: CustomPalette.PRIMARY, marginLeft: 0, marginTop: 2 }} onClick={navigateToStartPage} />
          <CustomAnchorLink text="Find a schema" overrideStyle={{ fontSize: '20px', fontWeight: '500', color: CustomPalette.PRIMARY, marginLeft: 0, marginTop: 2 }} onClick={navigateToStartPage} />
          <CustomAnchorLink link="https://www.semanticengine.org/#/develop" text="Parse a schema" overrideStyle={{ fontSize: '20px', fontWeight: '500', color: CustomPalette.PRIMARY, marginLeft: 0, marginTop: 2 }} />

>>>>>>> c15ddb73cbc5de7d5471720940df3ddf8be5ccd3
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
<<<<<<< HEAD
          <CustomAnchorLink text="Write a schema" overrideStyle={{ fontSize: '20px', fontWeight: '500', color: CustomPalette.PRIMARY, marginTop: 2 }} onClick={navigateToStartPage} />
          {/* <CustomAnchorLink text="Find a schema" overrideStyle={{ fontSize: '20px', fontWeight: '500', color: CustomPalette.PRIMARY, marginTop: 2 }} onClick={navigateToStartPage} />
          <CustomAnchorLink link="https://www.semanticengine.org/#/develop" text="Parse a schema" overrideStyle={{ fontSize: '20px', fontWeight: '500', color: CustomPalette.PRIMARY, marginTop: 2 }} /> */}
=======
          <CustomAnchorLink text="Write a schema" overrideStyle={{ fontSize: '20px', fontWeight: '500', color: CustomPalette.PRIMARY, marginLeft: 5, marginTop: 2 }} onClick={navigateToStartPage} />
          <CustomAnchorLink text="Find a schema" overrideStyle={{ fontSize: '20px', fontWeight: '500', color: CustomPalette.PRIMARY, marginLeft: 5, marginTop: 2 }} onClick={navigateToStartPage} />
          <CustomAnchorLink link="https://www.semanticengine.org/#/develop" text="Parse a schema" overrideStyle={{ fontSize: '20px', fontWeight: '500', color: CustomPalette.PRIMARY, marginLeft: 5, marginTop: 2 }} />



  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, marginRight: 1, marginLeft: 1, marginBottom: 10 }}>
      <Box sx={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center' }}>
        {/* Accordion Items (Position may change based on screen size) */}
        <Box sx={{ flex: '1', maxWidth: '500px', minWidth: '300px', width: "100%" }}>
          <SchemaAccordionItem />
          <WriteASchemaAccordionItem navigateToStartPage={navigateToStartPage} />
          <StoreASchemaAccordionItem />
          <UseASchemaAccordionItem />
          <UseASchemaWithDataAccordionItem disableButtonCheck={disableButtonCheck} handleExport={handleExport} />
        </Box>

        <Box sx={{ flex: '1', backgroundColor: '#ffefea', width: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', marginTop: 5, marginRight: 10, marginLeft: 10 }}>
          <Typography sx={{ fontSize: '23px', fontWeight: '400', textAlign: 'center', width: '100%', marginTop: 2 }}>Quick Links</Typography>
          <CustomAnchorLink text="Write a schema" overrideStyle={{ fontSize: '20px', fontWeight: '500', color: CustomPalette.PRIMARY, marginLeft: 0, marginTop: 2 }} onClick={navigateToStartPage} />
          <CustomAnchorLink text="Find a schema" overrideStyle={{ fontSize: '20px', fontWeight: '500', color: CustomPalette.PRIMARY, marginLeft: 0, marginTop: 2 }} onClick={navigateToStartPage} />
          <CustomAnchorLink link="https://www.semanticengine.org/#/develop" text="Parse a schema" overrideStyle={{ fontSize: '20px', fontWeight: '500', color: CustomPalette.PRIMARY, marginLeft: 0, marginTop: 2 }} />

>>>>>>> c15ddb73cbc5de7d5471720940df3ddf8be5ccd3
          <Drop
            setFile={setRawFile}
            setLoading={setLoading}
            loading={loading}
            dropDisabled={dropDisabled}
            dropMessage={dropMessage}
            setDropMessage={setDropMessage}
            version={1}
          />
<<<<<<< HEAD
          <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
=======

          <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
>>>>>>> c15ddb73cbc5de7d5471720940df3ddf8be5ccd3
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
              sx={{ backgroundColor: CustomPalette.PRIMARY, ":hover": { backgroundColor: CustomPalette.SECONDARY }, width: '100%', maxWidth: '300px', marginTop: '30px' }}
              disabled={disableButtonCheck}
            >
              Generate Readme
            </Button>

            <Button
              variant="contained"
              color="navButton"
              onClick={() => generateDataEntry(rawFile, setLoading)}
              sx={{ backgroundColor: CustomPalette.PRIMARY, ":hover": { backgroundColor: CustomPalette.SECONDARY }, width: '100%', maxWidth: '300px', marginTop: '30px', marginBottom: '20px' }}
              disabled={disableButtonCheck}
            >
              Generate Data Entry Excel
            </Button>

          </Box>
<<<<<<< HEAD
=======

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

>>>>>>> c15ddb73cbc5de7d5471720940df3ddf8be5ccd3
        </Box>

      )}
<<<<<<< HEAD
      
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



=======

      </Box>

>>>>>>> c15ddb73cbc5de7d5471720940df3ddf8be5ccd3
    </Box>
  );
};

export default AccordionList;
<<<<<<< HEAD
=======






>>>>>>> c15ddb73cbc5de7d5471720940df3ddf8be5ccd3
