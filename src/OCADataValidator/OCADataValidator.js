import Footer from "../Footer/Footer";
import Header from "../Header/Header";
import ViewSchema from "../ViewSchema/ViewSchema";
import DatasetView from "./DatasetView";
import OCADataValidatorMain from "./OCADataValidatorMain";


const OCADataValidator = ({ currentDataValidatorPage, backToOCADataValidatorUploadPage }) => {
  return (
    <>
      <Header currentPage={currentDataValidatorPage} />
      {
        currentDataValidatorPage === 'StartDataValidator' && <OCADataValidatorMain />
      }
      {currentDataValidatorPage === 'SchemaViewDataValidator' && <ViewSchema pageBack={backToOCADataValidatorUploadPage} isExport={false} />}
      {currentDataValidatorPage === 'DatasetViewDataValidator' && <DatasetView />}
      <Footer currentPage={currentDataValidatorPage} />
    </>
  );
};

export default OCADataValidator;