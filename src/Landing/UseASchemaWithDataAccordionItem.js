import {
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Typography,
} from '@mui/material';
import React, { useContext } from 'react';
import { CustomPalette } from '../constants/customPalette';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import AccordionItemWrapper from './AccordionItemWrapper';
import CustomAnchorLink from '../components/CustomAnchorLink';
import Drop from '../StartSchema/Drop';
import GenerateDataEntryExcel from './GenerateDataEntryExcel';
import { useTranslation } from 'react-i18next';
import { useHandleJsonDrop } from '../OCADataValidator/useHandleJsonDrop';
import { Context } from '../App';
import { useNavigate } from 'react-router-dom';
import useHandleAllDrop from '../StartSchema/useHandleAllDrop';

const UseASchemaWithDataAccordionItem = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { setCurrentDataValidatorPage } = useContext(Context);
  const {
    jsonRawFile,
    setJsonRawFile,
    jsonLoading,
    overallLoading,
    jsonDropDisabled,
    jsonDropMessage,
    setJsonDropMessage,
    setJsonLoading
  } = useHandleJsonDrop();

  const handleMoveToPreviewSchema = () => {
    navigate('/oca-data-validator');
    setCurrentDataValidatorPage('SchemaViewDataValidator');
  };

  const { setRawFile } = useHandleAllDrop();

  const setFile = (acceptedFiles) => {
    setRawFile(acceptedFiles);
    setJsonRawFile(acceptedFiles);
  }

  return (
    <AccordionItemWrapper>
      <AccordionSummary
        expandIcon={
          <ExpandMoreIcon sx={{ color: CustomPalette.PRIMARY, fontSize: 50 }} />
        }
        aria-controls='panel1a-content'
        id='panel1a-header'
      >
        <Typography sx={{ fontSize: '20px', fontWeight: '500' }}>
          {t('Use a Schema with Data')}
        </Typography>
      </AccordionSummary>

      <AccordionDetails sx={{ textAlign: 'start' }}>
        <Typography>
          {t('Use your machine-readable schema bundle to help you collect...')}
        </Typography>

        <Drop
          setFile={setFile}
          setLoading={overallLoading}
          loading={jsonLoading}
          dropDisabled={jsonDropDisabled}
          dropMessage={jsonDropMessage}
          setDropMessage={setJsonDropMessage}
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
            marginTop: 2,
          }}
        >
          <GenerateDataEntryExcel
            rawFile={jsonRawFile}
            setLoading={setJsonLoading}
            disableButtonCheck={jsonRawFile.length === 0 || jsonLoading}
          />
          <Button
            variant="contained"
            color="navButton"
            onClick={handleMoveToPreviewSchema}
            sx={{
              backgroundColor: CustomPalette.PRIMARY,
              ":hover": { backgroundColor: CustomPalette.SECONDARY },
              width: "100%",
              maxWidth: "300px",
              marginTop: "20px",
              marginBottom: "20px",
            }}
            disabled={jsonRawFile.length === 0 || jsonLoading}
          >
            {t('Enter/Verify Data in Webpage')}
          </Button>
        </Box>

        <div style={{
          marginTop: '20px',
          borderBottom: '3px solid #94002a',
        }} />

        <Typography variant='h6' sx={{ marginTop: '20px', color: CustomPalette.PRIMARY }}>
          {t('Verify data in your python code')}
        </Typography>
        <Typography>
          {t('Visit our')}
          {' '}
          <CustomAnchorLink link="https://github.com/agrifooddatacanada/OCA_data_set_validator" text={t('GitHub repository')} />
          {' '}
          {t('to find a python package that you can use to include data verification in your workflow')}
        </Typography>

      </AccordionDetails>
    </AccordionItemWrapper>
  );
};

export default UseASchemaWithDataAccordionItem;
