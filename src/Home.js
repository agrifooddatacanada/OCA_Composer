import "./App.css";
import { Box } from "@mui/material";
import StartSchema from "./StartSchema/StartSchema";
import SchemaMetadata from "./SchemaMetadata/SchemaMetadata";
import AttributeDetails from "./AttributeDetails/AttributeDetails";
import EntryCodes from "./EntryCodes/EntryCodes";
import LanguageDetails from "./LanguageDetails/LanguageDetails";
import ViewSchema from "./ViewSchema/ViewSchema";
import CreateManually from "./CreateManually/CreateManually";
import Overlays from "./Overlays/Overlays";
import CharacterEncoding from "./Overlays/CharacterEncoding";
import RequiredEntries from "./Overlays/RequiredEntries";
import { pagesArray } from "./App";
import { useEffect, useMemo } from "react";

const Home = ({ currentPage, setCurrentPage, pageForward, pageBack, showIntroCard, setShowIntroCard }) => {
  const allowedPages = useMemo(() => {
    return [...pagesArray, "Codes", "Create", "Overlays", "CharacterEncoding", "RequiredEntries"];
  }, []);

  if (!allowedPages.includes(currentPage)) {
    setCurrentPage("Start");
  }

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <Box sx={{ flex: 1 }}>
      {currentPage === "Start" && (
        <StartSchema pageForward={pageForward} />
      )}
      {currentPage === "Metadata" && (
        <SchemaMetadata
          pageBack={pageBack}
          pageForward={pageForward}
          showIntroCard={showIntroCard}
          setShowIntroCard={setShowIntroCard}
        />
      )}
      {currentPage === "Details" && (
        <AttributeDetails pageBack={pageBack} pageForward={pageForward} />
      )}
      {currentPage === "Codes" && <EntryCodes />}

      {currentPage === "LanguageDetails" && (
        <LanguageDetails pageBack={pageBack} pageForward={pageForward} />
      )}
      {currentPage === "View" && <ViewSchema pageBack={pageBack} />}
      {currentPage === "Create" && <CreateManually />}
      {currentPage === "Overlays" && <Overlays pageBack={pageBack} pageForward={pageForward} />}
      {currentPage === "CharacterEncoding" && <CharacterEncoding />}
      {currentPage === "RequiredEntries" && <RequiredEntries />}
    </Box>
  );
};

export default Home;