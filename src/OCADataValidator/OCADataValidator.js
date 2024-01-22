import Footer from "../Footer/Footer";
import Header from "../Header/Header";
import OCADataValidatorMain from "./OCADataValidatorMain";
import SchemaView from "./SchemaView";

const OCADataValidator = ({ currentDataValidatorPage }) => {
  return (
    <>
      <Header currentPage={currentDataValidatorPage} />
      {
        currentDataValidatorPage === 'StartDataValidator' && <OCADataValidatorMain />
      }
      {currentDataValidatorPage === 'SchemaViewDataValidator' && <SchemaView />}
      <Footer currentPage={currentDataValidatorPage} />
    </>
  );
};

export default OCADataValidator;