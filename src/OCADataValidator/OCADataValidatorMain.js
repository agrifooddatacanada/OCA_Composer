import Drop from "../StartSchema/Drop";
import { useHandleJsonDrop } from "./useHandleJsonDrop";
import { useHandleDatasetDrop } from "./useHandleDatasetDrop";
import { Box, Button } from "@mui/material";
import { datasetUploadDescription, datasetUploadTooltip, jsonUploadDescription, jsonUploadTooltip } from "../constants/constants";
import BackNextSkeleton from "../components/BackNextSkeleton";

const OCADataValidatorMain = () => {
  const {
    jsonRawFile,
    setJsonRawFile,
    jsonLoading,
    overallLoading,
    jsonDropDisabled,
    setJsonDropDisabled,
    jsonDropMessage,
    setJsonDropMessage,
    setCurrentDataValidatorPage
  } = useHandleJsonDrop();

  const {
    datasetRawFile,
    setDatasetRawFile,
    datasetLoading,
    datasetLoadingState,
    datasetDropDisabled,
    setDatasetDropDisabled,
    datasetDropMessage,
    setDatasetDropMessage
  } = useHandleDatasetDrop();

  return (
    <>
      <BackNextSkeleton isForward={jsonRawFile.length > 0 && datasetRawFile.length > 0} pageForward={() => setCurrentDataValidatorPage('AttributeMatchDataValidator')} />
      <Box sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        flex: 1,
      }}>
        <Box sx={{ height: '3rem' }} />
        <Drop
          setFile={setJsonRawFile}
          setLoading={overallLoading}
          loading={jsonLoading}
          dropDisabled={jsonDropDisabled}
          dropMessage={jsonDropMessage}
          setDropMessage={setJsonDropMessage}
          description={jsonUploadDescription}
          tipDescription={jsonUploadTooltip}
        />
        <Box display="flex">
          <Button
            variant="contained"
            color="button"
            onClick={() => {
              setJsonDropDisabled(false);
              setJsonRawFile([]);
            }}
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
        <Box sx={{ height: '2rem' }} />
        <Drop
          setFile={setDatasetRawFile}
          setLoading={datasetLoadingState}
          loading={datasetLoading}
          dropDisabled={datasetDropDisabled}
          dropMessage={datasetDropMessage}
          setDropMessage={setDatasetDropMessage}
          description={datasetUploadDescription}
          tipDescription={datasetUploadTooltip}
        />
        <Box display="flex">
          <Button
            variant="contained"
            color="button"
            onClick={() => {
              setDatasetDropDisabled(false);
              setDatasetRawFile([]);
            }}
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
            View Schema
          </Button>
        </Box>

        <Box sx={{ height: '3rem' }} />
      </Box>
    </>
  );
};

export default OCADataValidatorMain;