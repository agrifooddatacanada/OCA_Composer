import React, { useEffect, useState, useContext, useRef } from "react";
import "./App.css";
import { Box, Typography } from "@mui/material";
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
import Cardinality from "./Overlays/Cardinality";
import UnitFraming from "./Overlays/UnitFraming";
import DataStandards from "./Overlays/DataStandards";
import Range from "./Overlays/Range";
import AttributeFraming from "./Overlays/AttributeFraming";
import FormatRuleV2 from "./Overlays/FormatRuleV2";
import { Context } from "./App";
import Header from "./Header/Header";
import Footer from "./Footer/Footer";
import { useMultiSchema } from "./context/MultiSchemaContext";
import ClickableStepperProgressIndicator from "./StepperProgressIndicator/ClickableStepperProgressIndicator";
import NavigationCard from "./constants/NavigationCard";

const Home = ({
  currentPage,
  setCurrentPage,
  pageForward: appPageForward,
  pageBack: appPageBack,
  showIntroCard,
  setShowIntroCard
}) => {
  // Get context to check if we're editing a specific schema
  const { 
    currentSchemaId, 
    getSchemaState, 
    schemaStates, 
    updateSchemaState,
    loadFromLocalStorage,
    switchToSchema
  } = useMultiSchema();
  const { OCAPackage, overlay, setOverlay } = useContext(Context);

  // Try to load saved state when package is loaded
  useEffect(() => {
    if (OCAPackage) {
      loadFromLocalStorage();
    }
  }, [OCAPackage, loadFromLocalStorage]);

  // Ensure schema is initialized when entering via EDIT SCHEMA (old flow)
  useEffect(() => {
    if (OCAPackage && !currentSchemaId) {
      const rootSchemaId = OCAPackage.bundle?.d;
      if (rootSchemaId) {
        switchToSchema(rootSchemaId, OCAPackage);
      }
    }
  }, [OCAPackage, currentSchemaId, switchToSchema]);

  // Normalize and load overlay data from OCAPackage so LanguageDetails has labels/lists
  useEffect(() => {
    if (!OCAPackage?.bundle?.overlays) return;
    const pkgOverlays = OCAPackage.bundle.overlays;
    const newOverlay = {};

    // Labels: array to { lang3: { attr: label } }
    if (Array.isArray(pkgOverlays.label)) {
      const labelOverlays = {};
      pkgOverlays.label.forEach((labelOverlay) => {
        const lang = labelOverlay?.language;
        if (lang) {
          labelOverlays[lang] = labelOverlay.attribute_labels || {};
        }
      });
      newOverlay.label = labelOverlays;
    }

    // Entry overlays: array to { lang3: { attr: { code: text } } }
    if (Array.isArray(pkgOverlays.entry)) {
      const entryOverlays = {};
      pkgOverlays.entry.forEach((entryOverlay) => {
        const lang = entryOverlay?.language;
        if (lang) {
          entryOverlays[lang] = entryOverlay.attribute_entries || {};
        }
      });
      newOverlay.entry = entryOverlays;
    }

    // Entry codes: object kept as-is
    if (pkgOverlays.entry_code) {
      newOverlay.entry_code = pkgOverlays.entry_code;
    }

    // Pass through other overlays if present
    if (pkgOverlays.unit) newOverlay.unit = pkgOverlays.unit;
    if (pkgOverlays.cardinality) newOverlay.cardinality = pkgOverlays.cardinality;
    if (pkgOverlays.format) newOverlay.format = pkgOverlays.format;
    if (pkgOverlays.character_encoding)
      newOverlay.character_encoding = pkgOverlays.character_encoding;
    if (pkgOverlays.conformance) newOverlay.conformance = pkgOverlays.conformance;

    // Only update if the normalized overlay actually changed to prevent render loops
    try {
      const prev = JSON.stringify(overlay || {});
      const next = JSON.stringify(newOverlay);
      if (prev !== next) {
        setOverlay(newOverlay);
      }
    } catch (_e) {
      setOverlay(newOverlay);
    }
  }, [OCAPackage, overlay, setOverlay]);

  // Determine if we should use schema-aware components

  const [activeStep, setActiveStep] = useState(0);
  const [steps, setSteps] = useState([
    { label: "Schema Metadata", page: "Metadata" },
    { label: "Attribute Details", page: "Details" },
    { label: "Language-dependent Attribute Details", page: "LanguageDetails" },
    { label: "Overlays", page: "Overlays" },
    { label: "View Schema", page: "View" }
  ]);

  /**
   * inserts a step at the specified position
   * @param {number} position - index at which the step is to be inserted
   * @param {{label: string, page: string}} step - object containing step label and the step's associated page
   * @returns
   */
  const insertStep = (position, step) => {
    setSteps((currentSteps) => {
      // Prevent duplicates even if called multiple times rapidly
      const exists = currentSteps.some((s) => s.label === step.label);
      if (exists) return currentSteps;
      return [...currentSteps.slice(0, position), step, ...currentSteps.slice(position)];
    });
  };

  const removeStep = (stepLabel) => {
    setSteps((currentSteps) => currentSteps.filter((step) => step.label !== stepLabel));
  };

  // Custom navigation functions that use dynamic steps array instead of static pagesArray
  const pageForward = () => {
    const currentIndex = steps.findIndex((step) => step.page === currentPage);
    if (currentIndex >= 0 && currentIndex < steps.length - 1) {
      const nextStep = steps[currentIndex + 1];
      setCurrentPage(nextStep.page);
    }
  };

  const pageBack = () => {
    const currentIndex = steps.findIndex((step) => step.page === currentPage);
    if (currentIndex > 0) {
      const prevStep = steps[currentIndex - 1];
      setCurrentPage(prevStep.page);
    }
  };

  const [showValidationPopup, setShowValidationPopup] = useState(false);
  const [validationErrors, setValidationErrors] = useState([]);
  const [pendingTargetPage, setPendingTargetPage] = useState(null);
  const entryCodesRef = useRef(null);
  const attributeDetailsRef = useRef(null);
  const languageDetailsRef = useRef(null);
  const schemaMetadataRef = useRef(null);

  // Validation function to check if navigation should be allowed
  const validateNavigation = () => {
    if (currentPage === "Metadata") {
      // Validate schema metadata before allowing navigation
      if (schemaMetadataRef.current && typeof schemaMetadataRef.current.validateSchemaMetadata === "function") {
        const errors = schemaMetadataRef.current.validateSchemaMetadata();
        if (errors.length > 0) {
          setValidationErrors(errors);
          return false; // Validation failed
        }
        return true; // Validation passed
      }
      return true; // Allow navigation if validation method not available
    }
    
    if (currentPage === "Details") {
      // Get current data directly from AttributeDetails component if available
      if (attributeDetailsRef.current && typeof attributeDetailsRef.current.getCurrentData === "function") {
        const currentData = attributeDetailsRef.current.getCurrentData();
        if (!currentData || currentData.length === 0) {
          return true; // Allow navigation if no data
        }
        const hasBlankTypes = currentData.some(
          (attr) => !attr?.Type || attr.Type === ""
        );
        if (hasBlankTypes) {
          setValidationErrors(["There are one or more blank entries in the Type column. Please provide valid data types for all attributes before proceeding."]);
          return false;
        }
        return true;
      }
      
      // Fallback to schema state if component method not available
      const currentSchemaState = getSchemaState(currentSchemaId);
      if (!currentSchemaState || !currentSchemaState.attributes) {
        return true; // Allow navigation if no schema state
      }
      const hasBlankTypes = currentSchemaState.attributes.some(
        (attr) => !attr?.Type || attr.Type === ""
      );
      if (hasBlankTypes) {
        setValidationErrors(["There are one or more blank entries in the Type column. Please provide valid data types for all attributes before proceeding."]);
        return false;
      }
      return true;
    }
    return true; // Allow navigation for other steps
  };

  const handleStepClick = (index) => {
    const target = steps[index];
    if (target?.page) {
      // If we're currently on the Metadata step, validate before allowing navigation
      if (currentPage === "Metadata") {
        if (!validateNavigation()) {
          setPendingTargetPage(target.page);
          setShowValidationPopup(true);
          return; // Prevent navigation
        }
      }

      // If we're currently on the Details step, validate before allowing navigation
      if (currentPage === "Details") {
        // Persist edits before validating/navigation
        if (
          attributeDetailsRef.current &&
          typeof attributeDetailsRef.current.save === "function"
        ) {
          attributeDetailsRef.current.save();
        }
        if (!validateNavigation()) {
          setPendingTargetPage(target.page);
          setShowValidationPopup(true);
          return; // Prevent navigation
        }
      }

      // If leaving Entry Codes step, persist any edits before navigation
      if (
        currentPage === "Codes" &&
        entryCodesRef.current &&
        typeof entryCodesRef.current.save === "function"
      ) {
        entryCodesRef.current.save();
      }

      // If leaving Language Details step, persist any edits before navigation
      if (
        currentPage === "LanguageDetails" &&
        languageDetailsRef.current &&
        typeof languageDetailsRef.current.save === "function"
      ) {
        languageDetailsRef.current.save();
      }

      setCurrentPage(target.page);
    }
  };

  // Show Entry Codes step immediately if schema contains list attributes or entry overlays
  useEffect(() => {
    if (!OCAPackage) return;

    const hasArrayAttributes = (() => {
      const attrs = OCAPackage?.bundle?.capture_base?.attributes || {};
      return Object.values(attrs).some((v) => Array.isArray(v));
    })();

    const hasEntryOverlay = (() => {
      const entry = OCAPackage?.bundle?.overlays?.entry;
      if (Array.isArray(entry)) {
        return entry.some((e) => {
          const ae = e?.attribute_entries || {};
          return Object.keys(ae).length > 0;
        });
      }
      return false;
    })();

    const hasEntryCodeOverlay = (() => {
      const ec = OCAPackage?.bundle?.overlays?.entry_code?.attribute_entry_codes;
      if (ec && typeof ec === "object") {
        return Object.keys(ec).length > 0;
      }
      return false;
    })();

    if (hasArrayAttributes || hasEntryOverlay || hasEntryCodeOverlay) {
      insertStep(2, { label: "Entry Codes", page: "Codes" });
    }
  }, [OCAPackage]);

  // Add new page to this list

  // Update active step based on current page
  useEffect(() => {
    const stepIndex = steps.findIndex((step) => step.page === currentPage);
    if (stepIndex !== -1) {
      setActiveStep(stepIndex);
    }
  }, [currentPage, steps]);

  // Ensure Entry Codes step reflects the currently active schema (root or dependency)
  const prevShouldShowRef = React.useRef(false);
  useEffect(() => {
    if (!currentSchemaId) return;
    const state = getSchemaState(currentSchemaId);
    const attributesArray = Array.isArray(state.attributes) ? state.attributes : [];
    const hasExplicitListFlags = attributesArray.some(
      (a) => a && (a.List === true || a.List === false)
    );
    const hasList = attributesArray.some((a) => a && a.List === true);
    const hasEntryCodes = state?.entryCodes && Object.keys(state.entryCodes).length > 0;
    const hasArrayTypes = attributesArray.some(
      (a) => typeof a?.Type === "string" && a.Type.startsWith("Array[")
    );

    // Rule:
    // - If explicit List flags exist, rely ONLY on (hasList || hasEntryCodes)
    // - If no explicit flags yet (fresh import), fall back to array type heuristic
    const shouldShow = hasExplicitListFlags
      ? hasList || hasEntryCodes
      : hasList || hasEntryCodes || hasArrayTypes;

    if (shouldShow) {
      insertStep(2, { label: "Entry Codes", page: "Codes" });
    } else {
      removeStep("Entry Codes");
      if (currentPage === "Codes") {
        setCurrentPage("LanguageDetails");
      }
    }

    prevShouldShowRef.current = shouldShow;
  }, [currentSchemaId, schemaStates, getSchemaState, currentPage, setCurrentPage]);

  // DRY handler for NEXT from SchemaMetadata (and can be reused for BACK if needed)
  function handleNextFromMetadata() {
    if (schemaMetadataRef.current && typeof schemaMetadataRef.current.validateSchemaMetadata === "function") {
      const errors = schemaMetadataRef.current.validateSchemaMetadata();
      if (errors.length > 0) {
        setValidationErrors(errors);
        setShowValidationPopup(true);
        setPendingTargetPage(null); // Don't navigate, just show error
        return;
      }
    }
    // If validation passes, go to next step
    pageForward();
  }

  return (
    <>
      <Header currentPage={currentPage} />

      {/* Validation Popup for stepper navigation */}
      {showValidationPopup && (
        <NavigationCard
          fieldArray={validationErrors}
          setShowCard={(show) => {
            setShowValidationPopup(show);
            if (!show) {
              setValidationErrors([]);
              setPendingTargetPage(null);
            }
          }}
          handleForward={() => {
            setShowValidationPopup(false);
            setValidationErrors([]);
            if (pendingTargetPage) {
              setCurrentPage(pendingTargetPage);
              setPendingTargetPage(null);
            }
          }}
        />
      )}

      <Box sx={{ flex: 1 }}>
        {/* debug logs removed to prevent noisy renders */}
        {currentPage !== "Start" && currentPage !== "Create" && (
          <ClickableStepperProgressIndicator
            activeStep={activeStep}
            steps={steps}
            onStepClick={handleStepClick}
          />
        )}
        {currentPage === "Start" && <StartSchema pageForward={pageForward} />}
        {currentPage === "Metadata" && (
          <SchemaMetadata
            ref={schemaMetadataRef}
            pageBack={pageBack}
            pageForward={handleNextFromMetadata}
            showIntroCard={showIntroCard}
            setShowIntroCard={setShowIntroCard}
          />
        )}
  // DRY handler for NEXT from SchemaMetadata (and can be reused for BACK if needed)
  function handleNextFromMetadata() {
    if (schemaMetadataRef.current && typeof schemaMetadataRef.current.validateSchemaMetadata === "function") {
      const errors = schemaMetadataRef.current.validateSchemaMetadata();
      if (errors.length > 0) {
        setValidationErrors(errors);
        setShowValidationPopup(true);
        setPendingTargetPage(null); // Don't navigate, just show error
        return;
      }
    }
    // If validation passes, go to next step
    pageForward();
  }
        {currentPage === "Details" && (
          <AttributeDetails
            ref={attributeDetailsRef}
            pageBack={pageBack}
            pageForward={pageForward}
            insertStep={insertStep}
            removeStep={removeStep}
          />
        )}
        {currentPage === "Codes" && (
          <EntryCodes 
            ref={entryCodesRef}
            pageBack={pageBack}
            pageForward={pageForward}
          />
        )}

        {currentPage === "LanguageDetails" && (
          <LanguageDetails 
            ref={languageDetailsRef}
            pageBack={pageBack} 
            pageForward={pageForward} 
          />
        )}
        {currentPage === "View" && <ViewSchema pageBack={pageBack} addClearButton />}
        {currentPage === "Create" && <CreateManually />}
        {currentPage === "Overlays" && (
          <Overlays pageBack={pageBack} pageForward={pageForward} />
        )}
        {currentPage === "CharacterEncoding" && <CharacterEncoding />}
        {currentPage === "RequiredEntries" && <RequiredEntries />}
        {currentPage === "Cardinality" && <Cardinality />}
        {currentPage === "UnitFraming" && <UnitFraming />}
        {currentPage === "DataStandards" && <DataStandards />}
        {currentPage === "Range" && <Range />}
        {currentPage === "AttributeFraming" && <AttributeFraming />}
        {currentPage === "FormatRules" && <FormatRuleV2 />}
      </Box>
      <Footer />
    </>
  );
};

export default Home;
