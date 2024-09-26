import './App.css';
import { Box } from '@mui/material';
import StartSchema from './StartSchema/StartSchema';
import SchemaMetadata from './SchemaMetadata/SchemaMetadata';
import AttributeDetails from './AttributeDetails/AttributeDetails';
import EntryCodes from './EntryCodes/EntryCodes';
import LanguageDetails from './LanguageDetails/LanguageDetails';
import ViewSchema from './ViewSchema/ViewSchema';
import CreateManually from './CreateManually/CreateManually';
import Overlays from './Overlays/Overlays';
import CharacterEncoding from './Overlays/CharacterEncoding';
import RequiredEntries from './Overlays/RequiredEntries';
import { pagesArray } from './App';
import { useEffect, useMemo, useState } from 'react';
import Cardinality from './Overlays/Cardinality';
import FormatRulesV2 from './Overlays/FormatRuleV2';
import Header from './Header/Header';
import Footer from './Footer/Footer';
import UploadPage from './EntryCodes/UploadPage';
import MatchingEntryCodeHeader from './EntryCodes/MatchingEntryCodeHeader';
import MatchingJSONEntryCodeHeader from './EntryCodes/MatchingJSONEntryCodeHeader';
import StepperProgressIndicator from './StepperProgressIndicator/StepperProgressIndicator';
import DataStandards from './Overlays/DataStandards';

const Home = ({
  currentPage,
  setCurrentPage,
  pageForward,
  pageBack,
  showIntroCard,
  setShowIntroCard,
}) => {
  const [activeStep, setActiveStep] = useState(0);
  const [steps, setSteps] = useState([
    { label: "Schema Metadata", page: "Metadata" },
    { label: "Attribute Details", page: "Details" },
    { label: "Language-dependent Attribute Details", page: "LanguageDetails" },
    { label: "Overlays", page: "Overlays" },
    { label: "View Schema", page: "View" },
  ]);

  /**
   * inserts a step at the specified position
   * @param {number} position - index at which the step is to be inserted
   * @param {{label: string, page: string}} step - object containing step label and the step's associated page
   * @returns 
   */
  const insertStep = (position, step) => {
    // No need to insert the step if it already exists
    const stepToInsert = steps.find(s => s.label === step.label);

    if (stepToInsert) return;
    
    setSteps((currentSteps) => [
      ...currentSteps.slice(0, position),
      step,
      ...currentSteps.slice(position),
    ]);
  };

  const removeStep = (stepLabel) => {
    setSteps((currentSteps) =>
      currentSteps.filter((step) => step.label !== stepLabel)
    );
  };

  // Add new page to this page -> add to this list
  const allowedPages = useMemo(() => {
    return [
      ...pagesArray,
      'Codes',
      'Create',
      'Overlays',
      'CharacterEncoding',
      'RequiredEntries',
      'FormatRules',
      'Cardinality',
      'UploadEntryCodes',
      'MatchingEntryCodes',
      'MatchingJSONEntryCodes',
      'DataStandards'
    ];
  }, []);

  if (!allowedPages.includes(currentPage)) {
    setCurrentPage('Start');
  }

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Sync stepper with the current page
  useEffect(() => {
    const stepIndex = steps.findIndex((step) => step.page === currentPage);
    if (stepIndex === -1) return;
    setActiveStep(stepIndex);
  }, [steps, currentPage]);

  return (
    <>
      <Header currentPage={currentPage} />
      <Box sx={{ flex: 1 }}>
        {currentPage !== "Start" && currentPage !== "Create" && (
          <StepperProgressIndicator steps={steps} activeStep={activeStep} />
        )}
        {currentPage === 'Start' && <StartSchema pageForward={pageForward} />}
        {currentPage === 'Metadata' && (
          <SchemaMetadata
            pageBack={pageBack}
            pageForward={pageForward}
            showIntroCard={showIntroCard}
            setShowIntroCard={setShowIntroCard}
          />
        )}
        {currentPage === 'Details' && (
          <AttributeDetails
            pageBack={pageBack}
            pageForward={pageForward}
            insertStep={insertStep}
            removeStep={removeStep}
          />
        )}
        {currentPage === 'Codes' && <EntryCodes />}

        {currentPage === 'LanguageDetails' && (
          <LanguageDetails pageBack={pageBack} pageForward={pageForward} />
        )}
        {currentPage === 'View' && <ViewSchema pageBack={pageBack} addClearButton />}
        {currentPage === 'Create' && <CreateManually />}
        {currentPage === 'Overlays' && (
          <Overlays pageBack={pageBack} pageForward={pageForward} />
        )}
        {currentPage === 'CharacterEncoding' && <CharacterEncoding />}
        {currentPage === 'RequiredEntries' && <RequiredEntries />}
        {currentPage === 'FormatRules' && <FormatRulesV2 />}
        {currentPage === "Cardinality" && <Cardinality />}
        {currentPage === "UploadEntryCodes" && <UploadPage />}
        {currentPage === "MatchingEntryCodes" && <MatchingEntryCodeHeader />}
        {currentPage === "MatchingJSONEntryCodes" && <MatchingJSONEntryCodeHeader />}
        {currentPage === "DataStandards" && <DataStandards />}
      </Box>
      <Footer currentPage={currentPage} />
    </>
  );
};

export default Home;
