import Footer from "../Footer/Footer";
import Header from "../Header/Header";
import ViewSchema from "../ViewSchema/ViewSchema";
import AttributeMatch from "./AttributeMatch";
import DatasetView from "./DatasetView";
import OCADataValidatorCheck from "./OCADataValidatorCheck";
import OCADataValidatorMain from "./OCADataValidatorMain";

const OCADataValidator = ({ currentDataValidatorPage, backToOCADataValidatorUploadPage }) => {
  return (
    <>
      <Header currentPage={currentDataValidatorPage} />
      {
        currentDataValidatorPage === 'StartDataValidator' && <OCADataValidatorMain />
      }
      {currentDataValidatorPage === 'SchemaViewDataValidator' && <ViewSchema pageForward={backToOCADataValidatorUploadPage} isExport={false} />}
      {currentDataValidatorPage === 'DatasetViewDataValidator' && <DatasetView />}
      {/* {currentDataValidatorPage === 'CreateANewDatasetDataValidator' && <CreateANewDataset />} */}
      {currentDataValidatorPage === 'AttributeMatchDataValidator' && <AttributeMatch />}
      {currentDataValidatorPage === 'OCADataValidatorCheck' && <OCADataValidatorCheck />}
      <Footer currentPage={currentDataValidatorPage} />
    </>
  );
};

export default OCADataValidator;