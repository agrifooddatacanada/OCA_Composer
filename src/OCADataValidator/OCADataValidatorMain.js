import Drop from "../StartSchema/Drop";
import { useHandleJsonDrop } from "./useHandleJsonDrop";
import { useHandleDatasetDrop } from "./useHandleDatasetDrop";
import { Box, Button, Typography } from "@mui/material";
import { datasetUploadDescription, datasetUploadTooltip } from "../constants/constants";
import BackNextSkeleton from "../components/BackNextSkeleton";
import { useTranslation } from "react-i18next";
import ExcelSheetSelection from "../components/ExcelSheetSelection";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";

const OCADataValidatorMain = ({ setShowWarningCard, firstTimeDisplayWarning }) => {
  const { t } = useTranslation();
  const { jsonRawFile, setCurrentDataValidatorPage } = useHandleJsonDrop(setShowWarningCard, firstTimeDisplayWarning);

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

  const handleClickBack = () => {
    setCurrentDataValidatorPage('SchemaViewDataValidator')
  }

  const handleClickNext = () => {
    if (datasetRawFile.length > 0) {
      // If En excel file is uploaded, it needs to be processed before moving to the next page
      if (!firstNavigationToDataset && excelSheetChoice !== -1) {
        handleDataSheetForwards();
      } else {
        setCurrentDataValidatorPage('AttributeMatchDataValidator');
      }
    } else {
      setCurrentDataValidatorPage('OCADataValidatorCheck');
    }
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
      <BackNextSkeleton
       isBack 
       isForward={jsonRawFile.length > 0} 
       pageForward={handleClickNext} 
       pageBack={handleClickBack} 
       nextText={datasetRawFile.length === 0 ? 'Skip Upload Data' : 'Next'}
      />

      <Box sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        flex: 1,
      }}>
        <Box sx={{ height: '3rem' }} />
        <Box>
          <Box sx={{
            display: 'flex',
            justifyContent: 'space-between',
            width: '100%',
          }}>
            <Typography variant="h6" sx={{ textAlign: 'start', color: "black" }}>{t('Optional: Upload Data')}</Typography>
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
    </Box>
  );
};

export default OCADataValidatorMain;