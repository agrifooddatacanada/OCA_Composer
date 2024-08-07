import { useContext, useRef, useState } from "react";
import Footer from "../Footer/Footer";
import Header from "../Header/Header";
import AttributeMatch from "./AttributeMatch";
import DatasetView from "./DatasetView";
import OCADataValidatorCheck from "./OCADataValidatorCheck";
import OCADataValidatorMain from "./OCADataValidatorMain";
import { Context } from "../App";
import PreviewSchema from "./PreviewSchema";

const OCADataValidator = () => {
  const { currentDataValidatorPage } = useContext(Context);
  const [showWarningCard, setShowWarningCard] = useState(false);
  const firstTimeDisplayWarning = useRef(true);

  return (
    <>
      <Header currentPage={currentDataValidatorPage} />
      {
        currentDataValidatorPage === 'StartDataValidator' && <OCADataValidatorMain setShowWarningCard={setShowWarningCard} firstTimeDisplayWarning={firstTimeDisplayWarning} />
      }
      {currentDataValidatorPage === 'SchemaViewDataValidator' && <PreviewSchema />}
      {currentDataValidatorPage === 'DatasetViewDataValidator' && <DatasetView />}
      {/* {currentDataValidatorPage === 'CreateANewDatasetDataValidator' && <CreateANewDataset />} */}
      {currentDataValidatorPage === 'AttributeMatchDataValidator' && <AttributeMatch />}
      {currentDataValidatorPage === 'OCADataValidatorCheck' && <OCADataValidatorCheck showWarningCard={showWarningCard} setShowWarningCard={setShowWarningCard} firstTimeDisplayWarning={firstTimeDisplayWarning} />}
      <Footer currentPage={currentDataValidatorPage} />
    </>
  );
};

export default OCADataValidator;