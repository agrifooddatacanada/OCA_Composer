import Drop from "../StartSchema/Drop";
import { useHandleJsonDrop } from "./useHandleJsonDrop";
import { useHandleDatasetDrop } from "./useHandleDatasetDrop";

const OCADataValidatorMain = () => {
  const {
    jsonRawFile,
    setJsonRawFile,
    jsonLoading,
    setJsonLoading,
    jsonDropDisabled,
    setJsonDropDisabled,
    jsonDropMessage,
    setJsonDropMessage
  } = useHandleJsonDrop();

  const {
    datasetRawFile,
    setDatasetRawFile,
    datasetLoading,
    setDatasetLoading,
    datasetDropDisabled,
    setDatasetDropDisabled,
    datasetDropMessage,
    setDatasetDropMessage
  } = useHandleDatasetDrop();

  return (
    <>
      <Drop
        setFile={setJsonRawFile}
        setLoading={setJsonLoading}
        loading={jsonLoading}
        dropDisabled={jsonDropDisabled}
        dropMessage={jsonDropMessage}
        setDropMessage={setJsonDropMessage}
        description="Click here to select an OCA schema or drag and drop one here"
      />
      <Drop
        setFile={setDatasetRawFile}
        setLoading={setDatasetLoading}
        loading={datasetLoading}
        dropDisabled={datasetDropDisabled}
        dropMessage={datasetDropMessage}
        setDropMessage={setDatasetDropMessage}
        description="Click here to select an Excel or CSV dataset or drag and drop one here"
      />
    </>
  );
};

export default OCADataValidatorMain;