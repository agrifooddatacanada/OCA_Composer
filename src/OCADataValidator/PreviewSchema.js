import React, { useContext } from 'react';
import ViewSchema from '../ViewSchema/ViewSchema';
import { Context } from '../App';
import { useNavigate } from 'react-router-dom';

const PreviewSchema = () => {
  const navigate = useNavigate();
  const { setCurrentDataValidatorPage, datasetRawFile, buttonChoiceInLandingPage } = useContext(Context);

  const handleForwardPage = () => {
    if (buttonChoiceInLandingPage === 'EnterDataInWebPage') {
      setCurrentDataValidatorPage('OCADataValidatorCheck');
    } else if (buttonChoiceInLandingPage === 'VerifyDataInWebPage') {
      setCurrentDataValidatorPage('StartDataValidator');
    } else if (datasetRawFile && datasetRawFile.length > 0) {
      setCurrentDataValidatorPage('AttributeMatchDataValidator');
    } else {
      setCurrentDataValidatorPage('OCADataValidatorCheck');
    }
  };

  const handleBackPage = () => {
    if (buttonChoiceInLandingPage === 'EnterDataInWebPage' || buttonChoiceInLandingPage === 'VerifyDataInWebPage') {
      navigate('/');
    } else {
      setCurrentDataValidatorPage('StartDataValidator');
    }
  };

  return (
    <ViewSchema isBack pageBack={handleBackPage} pageForward={handleForwardPage} isExport={false} />
  );
};

export default PreviewSchema;