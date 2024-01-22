import { useState } from 'react';

export const useHandleDatasetDrop = () => {
  const [datasetRawFile, setDatasetRawFile] = useState(null);
  const [datasetLoading, setDatasetLoading] = useState(false);
  const [datasetDropDisabled, setDatasetDropDisabled] = useState(false);
  const [datasetDropMessage, setDatasetDropMessage] = useState({ message: "", type: "" });

  return {
    datasetRawFile,
    setDatasetRawFile,
    datasetLoading,
    setDatasetLoading,
    datasetDropDisabled,
    setDatasetDropDisabled,
    datasetDropMessage,
    setDatasetDropMessage
  };
};
