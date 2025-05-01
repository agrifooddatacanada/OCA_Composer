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

  // Check if the page is rendered inside an iframe
  const isInIframe = () => {
    try {
      return window.self !== window.parent;
    } catch (e) {
      return true; // If there's an error, assume it's in an iframe
    }
  };

  const inIframe = isInIframe();

  return (
    <ViewSchema isBack={!inIframe} pageBack={handleBackPage} pageForward={handleForwardPage} isExport={false} />
  );
};

export default PreviewSchema;