import Drop from "../StartSchema/Drop";
import { useHandleJsonDrop } from "./useHandleJsonDrop";
import { useHandleDatasetDrop } from "./useHandleDatasetDrop";
import { Box, Button, Link, Typography, useMediaQuery } from "@mui/material";
import { datasetUploadDescription, datasetUploadTooltip, jsonUploadDescription, jsonUploadTooltip } from "../constants/constants";
import BackNextSkeleton from "../components/BackNextSkeleton";
import { CustomPalette } from "../constants/customPalette";
import placeholderExample from '../assets/placeholder.png';

const OCADataValidatorMain = ({ setShowWarningCard, firstTimeDisplayWarning }) => {
  const isMobile = useMediaQuery('(max-width: 936px)');

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
    handleClearDataset
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
              <Typography variant="h6" sx={{ textAlign: 'left', color: "white", fontSize: isMobile ? '2rem' : '2.2rem', }}>Improve your data</Typography>
              <Typography sx={{ textAlign: 'left', color: "white" }}>Enter data according to rules in a schema.</Typography>
              <Typography sx={{ textAlign: 'left', color: "white" }}>Check your existing data against rules in a schema.</Typography>
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
              Learn about schemas and schema rules -{">"}
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
              Learn about data verification -{">"}
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
          <Typography variant="h6" sx={{ textAlign: 'start', color: "black", marginBottom: "-1rem" }}>Add schema</Typography>
          <Drop
            setFile={setJsonRawFile}
            setLoading={overallLoading}
            loading={jsonLoading}
            dropDisabled={jsonDropDisabled}
            dropMessage={jsonDropMessage}
            setDropMessage={setJsonDropMessage}
            description={jsonUploadDescription}
            tipDescription={jsonUploadTooltip}
            version={1}
          />
        </Box>

        <Box display="flex">
          <Button
            variant="contained"
            color="button"
            onClick={handleClearJSON}
            sx={{ width: 170, mr: 2 }}
            disabled={jsonRawFile.length === 0}
          >
            Clear Schema File
          </Button>
          <Button
            variant="contained"
            color="button"
            sx={{ width: 170, ml: 2 }}
            onClick={() => setCurrentDataValidatorPage("SchemaViewDataValidator")}
            disabled={jsonRawFile.length === 0}
          >
            View Schema
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
          <Typography variant="h6" sx={{ textAlign: 'start', color: "black", marginBottom: "-1rem" }}>Optional: Add Data</Typography>
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

        <Box display="flex">
          <Button
            variant="contained"
            color="button"
            onClick={handleClearDataset}
            sx={{ width: 170, mr: 2 }}
            disabled={datasetRawFile.length === 0}
          >
            Clear Dataset File
          </Button>
          <Button
            variant="contained"
            color="button"
            sx={{ width: 170, ml: 2 }}
            onClick={() => setCurrentDataValidatorPage("DatasetViewDataValidator")}
            disabled={datasetRawFile.length === 0}
          >
            View Data
          </Button>
        </Box>

        <Box sx={{ height: '3rem' }} />
      </Box>
    </Box>
  );
};

export default OCADataValidatorMain;