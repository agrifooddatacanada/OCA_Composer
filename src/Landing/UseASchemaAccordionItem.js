import { AccordionDetails, AccordionSummary, Box, Button, Typography } from '@mui/material';
import React, { useContext } from 'react';
import { CustomPalette } from '../constants/customPalette';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import AccordionItemWrapper from './AccordionItemWrapper';
import Drop from '../StartSchema/Drop';
import { Context } from '../App';
import { useNavigate } from 'react-router-dom';
import useGenerateReadMe from '../ViewSchema/useGenerateReadMe';
import useHandleAllDrop from '../StartSchema/useHandleAllDrop';
import useGenerateReadMeV2 from '../ViewSchema/useGenerateReadMeV2';
import { useTranslation } from 'react-i18next';
import { useHandleJsonDrop } from '../OCADataValidator/useHandleJsonDrop';

const UseASchemaAccordionItem = () => {
  const navigate = useNavigate();
  const { zipToReadme, jsonToReadme } = useContext(Context);
  const { toTextFile } = useGenerateReadMe();
  const { jsonToTextFile } = useGenerateReadMeV2();
  const { t } = useTranslation();
  const {
    rawFile,
    setRawFile,
    setLoading,
    loading,
    dropDisabled,
    dropMessage,
    setDropMessage,
    setCurrentPage,
  } = useHandleAllDrop();

  const { setJsonRawFile } = useHandleJsonDrop();

  const navigateToMetadataPage = () => {
    setCurrentPage('Metadata');
    navigate('/start');
  };

  const navigateToViewPage = () => {
    setCurrentPage('View');
    navigate('/start');
  };

  const setFile = (acceptedFiles) => {
    setRawFile(acceptedFiles);
    setJsonRawFile(acceptedFiles);
  }

  const disableButtonCheck = rawFile.length === 0 || loading === true;

  return (
    <AccordionItemWrapper>
      <AccordionSummary
        expandIcon={<ExpandMoreIcon sx={{ color: CustomPalette.PRIMARY, fontSize: 50 }} />}
        aria-controls="panel1a-content"
        id="panel1a-header"
      >
        <Typography sx={{ fontSize: '20px', fontWeight: '500' }}>{t('Use a Schema')}</Typography>
      </AccordionSummary>

      <AccordionDetails sx={{ textAlign: 'start' }}>
        <Typography>
          {t('When you have a schema bundle you can upload and then')}
        </Typography>
        <Typography>
          <strong>{t('View')}</strong> {t('the schema and')} <strong>{t('Edit')}</strong> {t('the schema if needed')}
        </Typography>
        <Typography>
          {t('The schema bundle is machine-readable')} <strong>{t('generate')}</strong> {t('the Readme to create a human-readable simple text version')}
        </Typography>

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

        <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
          <Button
            variant="contained"
            color="navButton"
            onClick={navigateToViewPage}
            sx={{ backgroundColor: CustomPalette.PRIMARY, ":hover": { backgroundColor: CustomPalette.SECONDARY }, width: '100%', maxWidth: '300px', marginTop: '30px' }}
            disabled={disableButtonCheck}
          >
            {t('View Schema')}
          </Button>
          <Button
            variant="contained"
            color="navButton"
            onClick={navigateToMetadataPage}
            sx={{ backgroundColor: CustomPalette.PRIMARY, ":hover": { backgroundColor: CustomPalette.SECONDARY }, width: '100%', maxWidth: '300px', marginTop: '30px' }}
            disabled={disableButtonCheck}
          >
            {t('Edit Schema')}
          </Button>
          <Button
            variant="contained"
            color="navButton"
            onClick={() => {
              if (zipToReadme.length > 0) {
                toTextFile(zipToReadme);
              } else {
                jsonToTextFile(jsonToReadme);
              }
            }}
            sx={{ backgroundColor: CustomPalette.PRIMARY, ":hover": { backgroundColor: CustomPalette.SECONDARY }, width: '100%', maxWidth: '300px', marginTop: '30px' }}
            disabled={disableButtonCheck}
          >
            {t('Generate Readme')}
          </Button>
        </Box>
      </AccordionDetails>
    </AccordionItemWrapper>
  );
};

export default UseASchemaAccordionItem;