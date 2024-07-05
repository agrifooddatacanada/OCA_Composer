import { Box, Button, Typography, useMediaQuery } from '@mui/material';
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
import { generateDataEntryV2 } from './generateDataEntryV2';
import { generateDataEntry } from './generateDataEntry';
import useGenerateReadMeV2 from '../ViewSchema/useGenerateReadMeV2';

const AccordionList = () => {
  const isMobile = useMediaQuery('(max-width: 736px)');
  const navigate = useNavigate();
  const { zipToReadme, jsonToReadme } = useContext(Context);
  const { toTextFile } = useGenerateReadMe();
  const { jsonToTextFile } = useGenerateReadMeV2();
  const {
    rawFile,
    setRawFile,
    setLoading,
    loading,
    dropDisabled,
    dropMessage,
    setDropMessage,
    setCurrentPage,
    setIsZip,
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

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 8,
        marginRight: 1,
        marginLeft: 1,
        marginBottom: 10,
      }}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'row',
          flexWrap: 'wrap',
          justifyContent: 'center',
        }}
      >
        {/* Accordion Items (Position may change based on screen size) */}
        <Box
          sx={{
            flex: '1',
            maxWidth: isMobile ? 'unset' : '500px',
            minWidth: isMobile ? 'unset' : '300px',
            width: '100%',
          }}
        >
          <SchemaAccordionItem />
          <WriteASchemaAccordionItem
            navigateToStartPage={navigateToStartPage}
          />
          <StoreASchemaAccordionItem />
          <UseASchemaAccordionItem />
          <UseASchemaWithDataAccordionItem
            disableButtonCheck={disableButtonCheck}
            handleExport={handleExport}
          />
        </Box>

        <Box
          sx={{
            flex: '1',
            backgroundColor: '#ffefea',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-start',
            marginTop: 5,
            marginRight: isMobile ? 'unset' : 10,
            marginLeft: isMobile ? 'unset' : 10,
          }}
        >
          <Typography
            sx={{
              fontSize: '23px',
              fontWeight: '400',
              textAlign: 'center',
              width: '100%',
              marginTop: 2,
            }}
          >
            Quick Links
          </Typography>
          <CustomAnchorLink
            text='Write a schema'
            overrideStyle={{
              fontSize: '20px',
              fontWeight: '500',
              color: CustomPalette.PRIMARY,
              marginLeft: 0,
              marginTop: 2,
            }}
            onClick={navigateToStartPage}
          />
          <hr style={{ width: '90%', margin: 'auto', marginTop: '25px', border: `1px solid ${CustomPalette.PRIMARY}` }} />
          {/* <CustomAnchorLink
            link='https://www.semanticengine.org/#/develop'
            text='Parse a schema'
            overrideStyle={{
              fontSize: '20px',
              fontWeight: '500',
              color: CustomPalette.PRIMARY,
              marginLeft: 0,
              marginTop: 2,
            }}
          /> */}
          <Drop
            setFile={setRawFile}
            setLoading={setLoading}
            loading={loading}
            dropDisabled={dropDisabled}
            dropMessage={dropMessage}
            setDropMessage={setDropMessage}
            version={1}
          />
          <Box
            sx={{
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <Button
              variant='contained'
              color='navButton'
              onClick={navigateToViewPage}
              sx={{
                backgroundColor: CustomPalette.PRIMARY,
                ':hover': { backgroundColor: CustomPalette.SECONDARY },
                width: '100%',
                maxWidth: '300px',
                marginTop: '30px',
              }}
              disabled={disableButtonCheck}
            >
              View Schema
            </Button>
            <Button
              variant='contained'
              color='navButton'
              onClick={navigateToMetadataPage}
              sx={{
                backgroundColor: CustomPalette.PRIMARY,
                ':hover': { backgroundColor: CustomPalette.SECONDARY },
                width: '100%',
                maxWidth: '300px',
                marginTop: '30px',
              }}
              disabled={disableButtonCheck}
            >
              Edit Schema
            </Button>
            <Button
              variant='contained'
              color='navButton'
              onClick={() => {
                if (zipToReadme.length > 0) {
                  toTextFile(zipToReadme);
                } else {
                  jsonToTextFile(jsonToReadme);
                }
              }}
              sx={{
                backgroundColor: CustomPalette.PRIMARY,
                ':hover': { backgroundColor: CustomPalette.SECONDARY },
                width: '100%',
                maxWidth: '300px',
                marginTop: '30px',
              }}
              disabled={disableButtonCheck}
            >
              Generate Readme
            </Button>
            <Button
              variant='contained'
              color='navButton'
              onClick={() => {
                if (rawFile?.[0]?.type?.includes('zip')) {
                  generateDataEntry(rawFile, setLoading);
                } else if (rawFile?.[0]?.type?.includes('json')) {
                  generateDataEntryV2(rawFile, setLoading);
                }
              }}
              sx={{
                backgroundColor: CustomPalette.PRIMARY,
                ':hover': { backgroundColor: CustomPalette.SECONDARY },
                width: '100%',
                maxWidth: '300px',
                marginTop: '30px',
                marginBottom: '20px',
              }}
              disabled={disableButtonCheck}
            >
              Generate Data Entry Excel
            </Button>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default AccordionList;