import React, { useContext } from 'react';
import ViewSchema from '../ViewSchema/ViewSchema';
import { Context } from '../App';

const PreviewSchema = () => {
  const { setCurrentDataValidatorPage, datasetRawFile } = useContext(Context);

  const handleForwardPage = () => {
    if (datasetRawFile && datasetRawFile.length > 0) {
      setCurrentDataValidatorPage('AttributeMatchDataValidator');
    } else {
      setCurrentDataValidatorPage('OCADataValidatorCheck');
    }
  };

  const handleBackPage = () => {
    setCurrentDataValidatorPage('StartDataValidator');
  };

  return (
    <ViewSchema isBack pageBack={handleBackPage} pageForward={handleForwardPage} isExport={false} />
  );
};

export default PreviewSchema;