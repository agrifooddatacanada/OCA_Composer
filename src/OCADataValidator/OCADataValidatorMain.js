import Drop from "../StartSchema/Drop";
import { useHandleJsonDrop } from "./useHandleJsonDrop";
import { useHandleDatasetDrop } from "./useHandleDatasetDrop";
import { Box, Button, Link, Typography, useMediaQuery } from "@mui/material";
import { datasetUploadDescription, datasetUploadTooltip, dewcSchemaUploadTooltip, dewvSchemaUploadDescription, jsonUploadDescription } from "../constants/constants";
import BackNextSkeleton from "../components/BackNextSkeleton";
import { CustomPalette } from "../constants/customPalette";
import placeholderExample from '../assets/placeholder.png';
import { useTranslation } from "react-i18next";
import ExcelSheetSelection from "../components/ExcelSheetSelection";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";

const OCADataValidatorMain = ({ setShowWarningCard, firstTimeDisplayWarning }) => {
  const isMobile = useMediaQuery('(max-width: 936px)');
  const { t } = useTranslation();
  const {
    jsonRawFile,
    setJsonRawFile,
    jsonLoading,
    overallLoading,
    jsonDropDisabled,
    jsonDropMessage,
    setJsonDropMessage,
    setCurrentDataValidatorPage,
    handleClearJSON
  } = useHandleJsonDrop(setShowWarningCard, firstTimeDisplayWarning);

  const {
    datasetRawFile,
    setDatasetRawFile,
    datasetLoading,
    datasetLoadingState,
    datasetDropDisabled,
    datasetDropMessage,
    setDatasetDropMessage,
    handleClearDataset,
    excelSheetNames,
    excelSheetChoice,
    setExcelSheetChoice,
    handleDataSheetForwards,
    firstNavigationToDataset
  } = useHandleDatasetDrop();

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ backgroundColor: CustomPalette.PRIMARY, width: '100%', paddingTop: 4, paddingBottom: 6, paddingLeft: 4, paddingRight: 4, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Box
          sx={{
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            justifyContent: 'space-around',
            maxWidth: '1500px',
            paddingRight: 2,
            paddingLeft: 2,
            gap: 10,
            color: 'white',
          }}
        >
          <Box sx={{ width: isMobile ? '100%' : '50%', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{
              marginBottom: 5,
            }}>
              <Typography variant="h6" sx={{ textAlign: 'left', color: "white", fontSize: isMobile ? '2rem' : '2.2rem', }}>{t('Improve your data')}</Typography>
              <Typography sx={{ textAlign: 'left', color: "white" }}>{t('Enter data according to rules in a schema')}</Typography>
              <Typography sx={{ textAlign: 'left', color: "white" }}>{t('Check your existing data against rules in a schema')}</Typography>
            </Box>
            <Link
              href='/learn_schema_rule'
              sx={{
                fontSize: '1.1rem',
                fontWeight: '700',
                cursor: 'pointer',
                color: 'white',
                textDecoration: 'none',
                textAlign: 'left',
              }}
            >
              {t('Learn about schemas and schema rules')} -{">"}
            </Link>
            <Link
              href='/learn_data_verification'
              sx={{
                fontSize: '1.1rem',
                fontWeight: '700',
                cursor: 'pointer',
                color: 'white',
                textDecoration: 'none',
                textAlign: 'left',
                marginTop: 1,
              }}
            >
              {t('Learn about data verification')} -{">"}
            </Link>
          </Box>
          <img
            src={placeholderExample}
            style={{
              width: isMobile ? '450px' : '500px',
            }}
            alt='Placeholder'
          />
        </Box>
      </Box>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'end',
          width: '100%',
          marginTop: '1.5rem',

        }}
      >
        <Button
          color='button'
          variant='contained'
          target='_blank'
          sx={{
            mr: 2,
            p: 1,
            width: '15rem',
            marginRight: 10,
          }}
          onClick={() =>
            window.open(
              "https://agrifooddatacanada.github.io/OCA_DEW_v_Help_Pages/en/DataEntryVerificationStart",
              '_blank',
              'rel=noopener noreferrer'
            )
          }
        >
          {t('Help with this page')}
        </Button>
      </Box>
      <BackNextSkeleton isForward={jsonRawFile.length > 0} pageForward={() => {
        if (datasetRawFile.length > 0) {
          setCurrentDataValidatorPage('AttributeMatchDataValidator');
        } else {
          setCurrentDataValidatorPage('OCADataValidatorCheck');
        }
      }} />

      <Box sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        flex: 1,
      }}>
        <Box sx={{ height: '3rem' }} />
        <Box>
          <Typography variant="h6" sx={{ textAlign: 'start', color: "black", marginBottom: "-1rem" }}>{t('Required')}: {t('Add schema')}</Typography>
          <Drop
            setFile={setJsonRawFile}
            setLoading={overallLoading}
            loading={jsonLoading}
            dropDisabled={jsonDropDisabled}
            dropMessage={jsonDropMessage}
            setDropMessage={setJsonDropMessage}
            description={dewvSchemaUploadDescription}
            tipDescription={dewcSchemaUploadTooltip}
            version={1}
          />
        </Box>

        <Box display="flex">
          <Button
            variant="contained"
            color="button"
            onClick={handleClearJSON}
            sx={{ width: 190, mr: 2 }}
            disabled={jsonRawFile.length === 0}
          >
            {t('Clear Schema File')}
          </Button>
          <Button
            variant="contained"
            color="button"
            sx={{ width: 190, ml: 2 }}
            onClick={() => setCurrentDataValidatorPage("SchemaViewDataValidator")}
            disabled={jsonRawFile.length === 0}
          >
            {t('View Schema')}
          </Button>
        </Box>
        {/* <Box sx={{
          marginTop: '1.5rem',
        }}>
          Or search the {' '}
          <Link
            sx={{ color: CustomPalette.PRIMARY, cursor: 'pointer', textDecoration: 'none' }}
            to='#'
            onClick={(e) => {
              window.location.href = ``;
              e.preventDefault();
            }}
          >
            ADC schema repository
          </Link>{' '}
          for a schema.
        </Box> */}
        <Box sx={{ height: '4rem' }} />
        <Box>
          <Box sx={{
            display: 'flex',
            justifyContent: 'space-between',
            width: '100%',
          }}>
            <Typography variant="h6" sx={{ textAlign: 'start', color: "black" }}>{t('Optional: Add Data')}</Typography>
            {!firstNavigationToDataset && excelSheetChoice !== -1 &&
              <Button color="button" onClick={handleDataSheetForwards}>
                {t('Next')}
                <ArrowForwardIosIcon />
              </Button>}
          </Box>
          {excelSheetNames.length > 0 ? (
            <Box sx={{
              marginTop: '1rem',
              width: '575px',
            }}>
              <ExcelSheetSelection chosenValue={excelSheetChoice} choices={excelSheetNames} setChoice={setExcelSheetChoice} />
            </Box>
          ) : (
            <Box sx={{
              marginTop: '-1rem',
            }}>
              <Drop
                setFile={setDatasetRawFile}
                setLoading={datasetLoadingState}
                loading={datasetLoading}
                dropDisabled={datasetDropDisabled}
                dropMessage={datasetDropMessage}
                setDropMessage={setDatasetDropMessage}
                description={datasetUploadDescription}
                tipDescription={datasetUploadTooltip}
                version={2}
              />
            </Box>

          )}

        </Box>

        <Box display="flex">
          <Button
            variant="contained"
            color="button"
            onClick={handleClearDataset}
            sx={{ width: 190, mr: 2 }}
            disabled={datasetRawFile.length === 0}
          >
            {t('Clear Dataset File')}
          </Button>
          <Button
            variant="contained"
            color="button"
            sx={{ width: 200, ml: 2 }}
            onClick={() => setCurrentDataValidatorPage("DatasetViewDataValidator")}
            disabled={datasetRawFile.length === 0}
          >
            {t('View Data')}
          </Button>
        </Box>

        <Box sx={{ height: '3rem' }} />
      </Box>
    </Box >
  );
};

export default OCADataValidatorMain;