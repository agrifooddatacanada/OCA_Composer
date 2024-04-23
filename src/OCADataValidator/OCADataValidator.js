import { useRef, useState } from "react";
import Footer from "../Footer/Footer";
import Header from "../Header/Header";
import ViewSchema from "../ViewSchema/ViewSchema";
import AttributeMatch from "./AttributeMatch";
import DatasetView from "./DatasetView";
import OCADataValidatorCheck from "./OCADataValidatorCheck";
import OCADataValidatorMain from "./OCADataValidatorMain";

const OCADataValidator = ({ currentDataValidatorPage, backToOCADataValidatorUploadPage }) => {
  const [showWarningCard, setShowWarningCard] = useState(false);
  const firstTimeDisplayWarning = useRef(true);
  return (
    <>
      <Header currentPage={currentDataValidatorPage} />
      {
        currentDataValidatorPage === 'StartDataValidator' && <OCADataValidatorMain setShowWarningCard={setShowWarningCard} firstTimeDisplayWarning={firstTimeDisplayWarning} />
      }
      {currentDataValidatorPage === 'SchemaViewDataValidator' && <ViewSchema pageForward={backToOCADataValidatorUploadPage} isExport={false} />}
      {currentDataValidatorPage === 'DatasetViewDataValidator' && <DatasetView />}
      {/* {currentDataValidatorPage === 'CreateANewDatasetDataValidator' && <CreateANewDataset />} */}
      {currentDataValidatorPage === 'AttributeMatchDataValidator' && <AttributeMatch />}
      {currentDataValidatorPage === 'OCADataValidatorCheck' && <OCADataValidatorCheck showWarningCard={showWarningCard} setShowWarningCard={setShowWarningCard} firstTimeDisplayWarning={firstTimeDisplayWarning} />}
      <Footer currentPage={currentDataValidatorPage} />
    </>
  );
};

export default OCADataValidator;