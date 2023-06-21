import "./App.css";
import { Box } from "@mui/material";
import StartSchema from "./StartSchema/StartSchema";
import SchemaMetadata from "./SchemaMetadata/SchemaMetadata";
import AttributeDetails from "./AttributeDetails/AttributeDetails";
import EntryCodes from "./EntryCodes/EntryCodes";
import LanguageDetails from "./LanguageDetails/LanguageDetails";
import ViewSchema from "./ViewSchema/ViewSchema";
import CreateManually from "./CreateManually/CreateManually";

const Home = ({ currentPage, pageForward, pageBack, showIntroCard, setShowIntroCard }) => {
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
    </Box>
  );
};

export default Home;