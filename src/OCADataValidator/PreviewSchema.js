import React, { useContext } from 'react';
import ViewSchema from '../ViewSchema/ViewSchema';
import { Context } from '../App';
import { useNavigate } from 'react-router-dom';

const PreviewSchema = () => {
  const navigate = useNavigate();
  const { setCurrentDataValidatorPage, datasetRawFile } = useContext(Context);

  const handleForwardPage = () => {
    if (datasetRawFile && datasetRawFile.length > 0) {
      setCurrentDataValidatorPage('AttributeMatchDataValidator');
      return;
    }

    // Go to Upload Data page
    setCurrentDataValidatorPage('StartDataValidator');
  }

  const handleBackPage = () => {
    navigate('/');
  };

  return (
    <ViewSchema isBack pageBack={handleBackPage} pageForward={handleForwardPage} isExport={false} />
  );
};

export default PreviewSchema;