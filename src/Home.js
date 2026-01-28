import React, { useEffect, useState, useContext, useRef, useCallback } from "react";
import "./App.css";
import { Box, Typography } from "@mui/material";
import { getPackageBundle, getPackageBundleId } from "./utils/packageUtils";
import StartSchema from "./StartSchema/StartSchema";
import SchemaMetadata from "./SchemaMetadata/SchemaMetadata";
import AttributeDetails from "./AttributeDetails/AttributeDetails";
import EntryCodes from "./EntryCodes/EntryCodes";
import UploadEntryCodesPage from "./EntryCodes/UploadPage";
import MatchingEntryCodeHeader from "./EntryCodes/MatchingEntryCodeHeader";
import MatchingJSONEntryCodeHeader from "./EntryCodes/MatchingJSONEntryCodeHeader";
import LanguageDetails from "./LanguageDetails/LanguageDetails";
import ViewSchema from "./ViewSchema/ViewSchema";
import CreateManually from "./CreateManually/CreateManually";
import Overlays from "./Overlays/Overlays";
import CharacterEncoding from "./Overlays/CharacterEncoding";
import RequiredEntries from "./Overlays/RequiredEntries";
import Cardinality from "./Overlays/Cardinality";
import UnitFraming from "./Overlays/UnitFraming";
import FormInformation from "./Overlays/FormInformation";
import FormBuilder from "./Overlays/FormBuilder";
import DataStandards from "./Overlays/DataStandards";
import Range from "./Overlays/Range";
import AttributeFraming from "./Overlays/AttributeFraming";
import FormatRuleV2 from "./Overlays/FormatRuleV2";
import { Context } from "./App";
import Header from "./Header/Header";
import Footer from "./Footer/Footer";
import { useMultiSchema } from "./context/MultiSchemaContext";
import ClickableStepperProgressIndicator from "./StepperProgressIndicator/ClickableStepperProgressIndicator";

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
  const { OCAPackage, overlay, setOverlay, isZip, setIsZipEdited } = useContext(Context);

  // REMOVED: Auto-loading from localStorage on OCAPackage change
  // This was causing newly uploaded schemas to be overwritten with old localStorage data
  // The MultiSchemaContext now handles persistence automatically via auto-save/restore on mount

  // Ensure schema is initialized when entering via EDIT SCHEMA (old flow)
  useEffect(() => {
    if (OCAPackage && !currentSchemaId) {
      const rootSchemaId = getPackageBundleId(OCAPackage);
      if (rootSchemaId) {
        switchToSchema(rootSchemaId, OCAPackage);
      }
    }
  }, [OCAPackage, currentSchemaId, switchToSchema]);

  // Normalize and load overlay data from OCAPackage so LanguageDetails has labels/lists
  useEffect(() => {
    const bundle = getPackageBundle(OCAPackage);
    if (!bundle?.overlays) return;
    const pkgOverlays = bundle.overlays;
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
  const insertStep = useCallback((position, step) => {
    setSteps((currentSteps) => {
      // Prevent duplicates even if called multiple times rapidly
      const exists = currentSteps.some((s) => s.label === step.label);
      if (exists) return currentSteps;
      return [...currentSteps.slice(0, position), step, ...currentSteps.slice(position)];
    });
  }, []);

  const removeStep = useCallback((stepLabel) => {
    setSteps((currentSteps) => currentSteps.filter((step) => step.label !== stepLabel));
  }, []);

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

  const entryCodesRef = useRef(null);
  const attributeDetailsRef = useRef(null);
  const languageDetailsRef = useRef(null);
  const schemaMetadataRef = useRef(null);
  const formatRulesRef = useRef(null);

  // List of overlay pages that use AG Grid and need their data saved on navigation
  const overlayPagesWithGrids = [
    "FormatRules",
    "Cardinality", 
    "Range",
    "UnitFraming",
    "DataStandards",
    "AttributeFraming",
    "CharacterEncoding",
    "RequiredEntries"
  ];

  const handleStepClick = (index) => {
    const target = steps[index];
    if (target?.page) {
      // If navigating from View page via stepper to make edits, mark zip as edited
      if (currentPage === "View" && target.page !== "View" && isZip) {
        setIsZipEdited(true);
      }

      // Determine if we're navigating forward or backward
      const currentIndex = steps.findIndex((step) => step.page === currentPage);
      const isForwardNavigation = index > currentIndex;

      // Only validate when navigating FORWARD
      if (isForwardNavigation) {
        // If we're currently on the Metadata step, validate and show popup if needed
        if (currentPage === "Metadata") {
          if (schemaMetadataRef.current && typeof schemaMetadataRef.current.showValidationPopup === "function") {
            const isValid = schemaMetadataRef.current.showValidationPopup(target.page);
            if (!isValid) {
              return; // Validation failed, component will show its popup with target page
            }
          }
        }

        // If we're currently on the Details step, save and validate before navigation
        if (currentPage === "Details") {
          // Persist edits before validating/navigation
          if (attributeDetailsRef.current && typeof attributeDetailsRef.current.save === "function") {
            attributeDetailsRef.current.save();
          }
          // Show validation popup if validation fails
          if (attributeDetailsRef.current && typeof attributeDetailsRef.current.showValidationPopup === "function") {
            const isValid = attributeDetailsRef.current.showValidationPopup();
            if (!isValid) {
              return; // Validation failed, component will show its popup
            }
          }
        }

        // If leaving Entry Codes step, validate and persist any edits before navigation
        if (currentPage === "Codes") {
          if (entryCodesRef.current && typeof entryCodesRef.current.validate === "function") {
            const isValid = entryCodesRef.current.validate();
            if (!isValid) {
              return; // Validation failed, stay on current page
            }
          }
          if (entryCodesRef.current && typeof entryCodesRef.current.save === "function") {
            entryCodesRef.current.save();
          }
        }
      } else {
        // When navigating BACKWARD, save without validation
        if (currentPage === "Details") {
          if (attributeDetailsRef.current && typeof attributeDetailsRef.current.save === "function") {
            attributeDetailsRef.current.save();
          }
        }
        if (currentPage === "Codes") {
          if (entryCodesRef.current && typeof entryCodesRef.current.save === "function") {
            entryCodesRef.current.save();
          }
        }
      }

      // If leaving Language Details step, persist any edits before navigation
      if (
        currentPage === "LanguageDetails" &&
        languageDetailsRef.current &&
        typeof languageDetailsRef.current.save === "function"
      ) {
        languageDetailsRef.current.save();
      }

      // Save overlay data when navigating away from overlay pages with grids
      // All overlays use unmount effects for saving, so they auto-save on navigation
      // FormatRules has an exposed save method for immediate save if needed
      if (currentPage === "FormatRules" && formatRulesRef.current && typeof formatRulesRef.current.save === "function") {
        formatRulesRef.current.save();
      }

      setCurrentPage(target.page);
    }
  };

  // Show Entry Codes step immediately if schema contains list attributes or entry overlays
  useEffect(() => {
    if (!OCAPackage) return;

    const hasArrayAttributes = (() => {
      const bundle = getPackageBundle(OCAPackage);
      const attrs = bundle?.capture_base?.attributes || {};
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
  const prevShouldShowRef = React.useRef(null); // null = uninitialized
  useEffect(() => {
    // Use fallback schema ID when currentSchemaId is null (manual creation flow)
    const targetSchemaId = currentSchemaId || "manual-creation-schema";
    
    // Read directly from schemaStates to avoid memoization issues
    const state = schemaStates[targetSchemaId] || {};
    const attributesArray = Array.isArray(state.attributes) ? state.attributes : [];
    const attributesWithLists = state?.attributesWithLists || [];
    
    // Check if any attributes are marked as lists
    const hasList = Array.isArray(attributesWithLists) && attributesWithLists.length > 0;
    
    const hasEntryCodes = state?.entryCodes && Object.keys(state.entryCodes).length > 0;
    const hasArrayTypes = attributesArray.some(
      (a) => typeof a?.Type === "string" && a.Type.startsWith("Array[")
    );

    // Show Entry Codes step if:
    // - Any attributes are marked as lists (attributesWithLists has items)
    // - Entry codes exist
    // - Array types exist (fallback for imports) BUT only if attributesWithLists is uninitialized
    //   (once user starts toggling List checkboxes, trust attributesWithLists over Type field)
    const isAttributesWithListsInitialized = state?.attributesWithLists !== undefined;
    const shouldShow = hasList || hasEntryCodes || (!isAttributesWithListsInitialized && hasArrayTypes);

    // Initialize on first run or update if visibility changed
    if (prevShouldShowRef.current === null || shouldShow !== prevShouldShowRef.current) {
      
      if (shouldShow) {
        insertStep(2, { label: "Entry Codes", page: "Codes" });
      } else {
        removeStep("Entry Codes");
        if (currentPage === "Codes") {
          setCurrentPage("LanguageDetails");
        }
      }

      prevShouldShowRef.current = shouldShow;
    }
  }, [currentSchemaId, schemaStates, currentPage, setCurrentPage, insertStep, removeStep]);

  return (
    <>
      <Header currentPage={currentPage} />

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
            pageForward={pageForward}
            showIntroCard={showIntroCard}
            setShowIntroCard={setShowIntroCard}
          />
        )}
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
        {currentPage === "UploadEntryCodes" && <UploadEntryCodesPage />}
        {currentPage === "MatchingEntryCodes" && <MatchingEntryCodeHeader />}
        {currentPage === "MatchingJSONEntryCodes" && <MatchingJSONEntryCodeHeader />}

        {currentPage === "LanguageDetails" && (
          <LanguageDetails 
            ref={languageDetailsRef}
            pageBack={pageBack} 
            pageForward={pageForward} 
          />
        )}
        {currentPage === "View" && (
          <ViewSchema 
            pageBack={pageBack} 
            addClearButton 
            isExport 
            isPageForward 
          />
        )}
        {currentPage === "Create" && <CreateManually />}
        {currentPage === "Overlays" && (
          <Overlays pageBack={pageBack} pageForward={pageForward} />
        )}
        {currentPage === "CharacterEncoding" && <CharacterEncoding />}
        {currentPage === "RequiredEntries" && <RequiredEntries />}
        {currentPage === "Cardinality" && <Cardinality />}
        {currentPage === "UnitFraming" && <UnitFraming />}
        {currentPage === "FormInformation" && <FormInformation />}
        {currentPage === "FormBuilder" && <FormBuilder />}
        {currentPage === "DataStandards" && <DataStandards />}
        {currentPage === "Range" && <Range />}
        {currentPage === "AttributeFraming" && <AttributeFraming />}
        {currentPage === "FormatRules" && <FormatRuleV2 ref={formatRulesRef} />}
      </Box>
      <Footer />
    </>
  );
};

export default Home;
