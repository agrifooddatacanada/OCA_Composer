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

const UseASchemaWithDataAccordionItem = ({
  disableButtonCheck,
  handleExport,
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { setCurrentDataValidatorPage, setButtonChoiceInLandingPage } = useContext(Context);
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

  const handleVerifyDataInWebPage = () => {
    setButtonChoiceInLandingPage('VerifyDataInWebPage');
    handleMoveToPreviewSchema();
  };

  const handleEnterDataInWebPage = () => {
    setButtonChoiceInLandingPage('EnterDataInWebPage');
    handleMoveToPreviewSchema();
  };

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
        <Typography variant='h6' sx={{ marginTop: '20px', color: CustomPalette.PRIMARY }}>
          {t('Enter data with Excel')}
        </Typography>

        <Drop
          setFile={setJsonRawFile}
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
            onClick={handleEnterDataInWebPage}
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
            ENTER DATA IN WEBPAGE
          </Button>
          <Button
            variant="contained"
            color="navButton"
            onClick={handleVerifyDataInWebPage}
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
            VERIFY DATA IN WEBPAGE
          </Button>
        </Box>

        <Typography variant='h6' sx={{ marginTop: '20px', color: CustomPalette.PRIMARY }}>
          {t('Enter data in your browser')}
        </Typography>
        <Typography>
          {t('Go to our')}
          {' '}
          <CustomAnchorLink link="/oca-data-validator" text={t('Data Entry tool')} />
          {' '}
          {t('to enter data via a web-browser based table...')}
        </Typography>

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

        <Typography variant='h6' sx={{ marginTop: '20px', color: CustomPalette.PRIMARY }}>
          {t('Verify data in your browser')}
        </Typography>
        <Typography>
          {t('Our')} {' '}
          <CustomAnchorLink link="/oca-data-validator" text={t('Data Entry tool')} />
          {' '}
          {t('also supports data verification. Upload a schema and a dataset and you can verify your dataset against the data rules in the schema')}
        </Typography>
      </AccordionDetails>
    </AccordionItemWrapper>
  );
};

export default UseASchemaWithDataAccordionItem;
