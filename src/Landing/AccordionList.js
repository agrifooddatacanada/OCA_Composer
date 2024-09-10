import { Box, Button, Typography, useMediaQuery } from '@mui/material';
import React, { useContext } from 'react';
import UseASchemaAccordionItem from './UseASchemaAccordionItem';
import UseASchemaWithDataAccordionItem from './UseASchemaWithDataAccordionItem';
import SchemaAccordionItem from './SchemaAccordionItem';
import WriteASchemaAccordionItem from './WriteASchemaAccordionItem';
import StoreASchemaAccordionItem from './StoreASchemaAccordionItem';
import CustomAnchorLink from '../components/CustomAnchorLink';
import { CustomPalette } from '../constants/customPalette';
import { useNavigate } from 'react-router-dom';
import Drop from '../StartSchema/Drop';
import useHandleAllDrop from '../StartSchema/useHandleAllDrop';
import useGenerateReadMe from '../ViewSchema/useGenerateReadMe';
import { Context } from '../App';
import useExportLogic from '../ViewSchema/useExportLogic';
import useGenerateReadMeV2 from '../ViewSchema/useGenerateReadMeV2';
import GenerateDataEntryExcel from './GenerateDataEntryExcel';
import { useTranslation } from 'react-i18next';
import CollaborateOnASchema from './CollaborateOnASchema';
import { useHandleJsonDrop } from '../OCADataValidator/useHandleJsonDrop';

const buttonStyles = {
  backgroundColor: CustomPalette.PRIMARY,
  ":hover": { backgroundColor: CustomPalette.SECONDARY },
  width: "100%",
  maxWidth: "300px",
  marginTop: "30px",
}

const AccordionList = () => {
  const isMobile = useMediaQuery('(max-width: 736px)');
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { zipToReadme, jsonToReadme, setCurrentDataValidatorPage } = useContext(Context);
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
  const { setJsonRawFile } = useHandleJsonDrop();

  const { resetToDefaults } = useExportLogic();

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

  const navigateToPreviewSchema = () => {
    setIsZip(true);
    setCurrentDataValidatorPage('SchemaViewDataValidator');
    navigate('/oca-data-validator');
  };

  const setFile = (acceptedFiles) => {
    setRawFile(acceptedFiles);
    setJsonRawFile(acceptedFiles);
  }

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
          <CollaborateOnASchema
            navigateToStartPage={navigateToStartPage}
          />
          <StoreASchemaAccordionItem />
          <UseASchemaAccordionItem />
          <UseASchemaWithDataAccordionItem />
          {/* <OCADataValidatorItem /> */}
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
            height: 'fit-content',
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
            {t('Quick Links')}
          </Typography>
          <CustomAnchorLink
            text={t('Write a Schema')}
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
          <Drop
            setFile={setFile}
            setLoading={setLoading}
            loading={loading}
            dropDisabled={dropDisabled}
            dropMessage={dropMessage}
            setDropMessage={setDropMessage}
            version={1}
            interfaceType={1}
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
              sx={buttonStyles}
              disabled={disableButtonCheck}
            >
              {t('View Schema')}
            </Button>
            <Button
              variant='contained'
              color='navButton'
              onClick={navigateToMetadataPage}
              sx={buttonStyles}
              disabled={disableButtonCheck}
            >
              {t('Edit Schema')}
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
              sx={buttonStyles}
              disabled={disableButtonCheck}
            >
              {t('Generate Readme')}
            </Button>
            <GenerateDataEntryExcel rawFile={rawFile} setLoading={setLoading} disableButtonCheck={disableButtonCheck} />
            <Button
              variant="contained"
              color="navButton"
              onClick={navigateToPreviewSchema}
              sx={{
                ...buttonStyles,
                marginBottom: '30px'
              }}
              disabled={disableButtonCheck}
            >
              {t('Enter/Verify Data in Webpage')}
            </Button>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default AccordionList;