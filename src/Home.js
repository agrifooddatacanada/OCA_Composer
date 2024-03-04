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
import { useEffect, useMemo } from 'react';
import Cardinality from './Overlays/Cardinality';
import FormatRulesV2 from './Overlays/FormatRuleV2';
import UploadPage from './EntryCodes/UploadPage';
import MatchingEntryCodeHeader from './EntryCodes/MatchingEntryCodeHeader';
import MatchingJSONEntryCodeHeader from './EntryCodes/MatchingJSONEntryCodeHeader';

const Home = ({
  currentPage,
  setCurrentPage,
  pageForward,
  pageBack,
  showIntroCard,
  setShowIntroCard,
}) => {

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
      'MatchingJSONEntryCodes'
    ];
  }, []);

  if (!allowedPages.includes(currentPage)) {
    setCurrentPage('Start');
  }

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <Box sx={{ flex: 1 }}>
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
        <AttributeDetails pageBack={pageBack} pageForward={pageForward} />
      )}
      {currentPage === 'Codes' && <EntryCodes />}

      {currentPage === 'LanguageDetails' && (
        <LanguageDetails pageBack={pageBack} pageForward={pageForward} />
      )}
      {currentPage === 'View' && <ViewSchema pageBack={pageBack} />}
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
    </Box>
  );
};

export default Home;
