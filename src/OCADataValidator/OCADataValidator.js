import { useContext, useEffect, useRef, useState } from "react";
import Footer from "../Footer/Footer";
import Header from "../Header/Header";
import AttributeMatch from "./AttributeMatch";
import DatasetView from "./DatasetView";
import OCADataValidatorCheck from "./OCADataValidatorCheck";
import OCADataValidatorMain from "./OCADataValidatorMain";
import { Context } from "../App";
import PreviewSchema from "./PreviewSchema";
import StepperProgressIndicator from "../StepperProgressIndicator/StepperProgressIndicator";

const steps = [
  { label: "Preview Schema", page: "SchemaViewDataValidator" },
  { label: "Enter Data", page: "StartDataValidator" },
  { label: "Preview Dataset", page: "DatasetViewDataValidator" },
  { label: "Match Attributes", page: "AttributeMatchDataValidator" },
  { label: "Verify Data", page: "OCADataValidatorCheck" },
];

const OCADataValidator = () => {
  const { currentDataValidatorPage } = useContext(Context);
  const [showWarningCard, setShowWarningCard] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const firstTimeDisplayWarning = useRef(true);

  // Sync stepper with the current page
  useEffect(() => {
    const stepIndex = steps.findIndex((step) => step.page === currentDataValidatorPage);
    if (stepIndex === -1) return;
    setActiveStep(stepIndex);
  }, [currentDataValidatorPage]);

  return (
    <>
      <Header currentPage={currentDataValidatorPage} />
      <StepperProgressIndicator steps={steps} activeStep={activeStep} />
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