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
import ErrorPopup from "./ViewSchema/ErrorPopup";

const Home = ({
  currentPage,
  setCurrentPage,
  pageForward,
  pageBack,
  showIntroCard,
  setShowIntroCard
}) => {
  // Get context to check if we're editing a specific schema
  const { editingSchemaId, OCAPackage, setEditingSchemaId, overlay, setOverlay } =
    useContext(Context);
  const {
    setCurrentPackageId,
    loadFromLocalStorage,
    switchToSchema,
    activeSchemaId,
    schemaStates,
    getSchemaState
  } = useMultiSchema();

  // Register current package fingerprint for persistence namespace
  useEffect(() => {
    const computePackageId = (pkg) => {
      if (!pkg) return null;
      const root = pkg.bundle?.d || "root";
      const deps = (pkg.dependencies || [])
        .map((d) => d?.d)
        .filter(Boolean)
        .sort()
        .join("|");
      return `${root}::${deps}`;
    };
    const id = computePackageId(OCAPackage);
    setCurrentPackageId(id);

    // Try to load saved state for this package
    if (id) {
      loadFromLocalStorage(id);
    }
  }, [OCAPackage, setCurrentPackageId, loadFromLocalStorage]);

  // Ensure schema is initialized when entering via EDIT SCHEMA (old flow)
  useEffect(() => {
    if (OCAPackage && !editingSchemaId) {
      const rootSchemaId = OCAPackage.bundle?.d;
      if (rootSchemaId) {
        switchToSchema(rootSchemaId, OCAPackage);
        setEditingSchemaId(rootSchemaId);
      }
    }
  }, [OCAPackage, editingSchemaId, switchToSchema, setEditingSchemaId]);

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
  }, [OCAPackage, setOverlay]);

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

  const [showValidationPopup, setShowValidationPopup] = useState(false);
  const entryCodesRef = useRef(null);
  const attributeDetailsRef = useRef(null);

  // Validation function to check if navigation should be allowed
  const validateNavigation = () => {
    if (currentPage === "Details") {
      const currentSchemaState = getSchemaState(activeSchemaId);
      if (!currentSchemaState || !currentSchemaState.attributes) {
        return true; // Allow navigation if no schema state
      }
      const hasBlankTypes = currentSchemaState.attributes.some(
        (attr) => !attr?.Type || attr.Type === ""
      );
      return !hasBlankTypes;
    }
    return true; // Allow navigation for other steps
  };

  const handleStepClick = (index) => {
    const target = steps[index];
    if (target?.page) {
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
          // Show validation popup
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
    if (!activeSchemaId) return;
    const state = getSchemaState(activeSchemaId);
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
  }, [activeSchemaId, schemaStates, getSchemaState, currentPage, setCurrentPage]);

  return (
    <>
      <Header currentPage={currentPage} />

      {/* Validation Popup for stepper navigation */}
      {showValidationPopup && (
        <ErrorPopup onClose={() => setShowValidationPopup(false)}>
          <Box>
            <Typography variant="h5" sx={{ mb: 1 }}>
              Cannot Navigate - Validation Required
            </Typography>
            <Typography variant="h6" fontWeight="semibold">
              There are one or more blank entries in the Type column. Please provide valid
              data types for all attributes before proceeding.
            </Typography>
          </Box>
        </ErrorPopup>
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
        {currentPage === "Codes" && <EntryCodes ref={entryCodesRef} />}

        {currentPage === "LanguageDetails" && (
          <LanguageDetails pageBack={pageBack} pageForward={pageForward} />
        )}
        {currentPage === "View" && <ViewSchema pageBack={pageBack} addClearButton />}
        {currentPage === "Create" && <CreateManually />}
        {currentPage === "Overlays" && (
          <Overlays pageBack={pageBack} pageForward={pageForward} />
        )}
        {currentPage === "CharacterEncoding" && (
          <CharacterEncoding />
        )}
        {currentPage === "RequiredEntries" && (
          <RequiredEntries />
        )}
        {currentPage === "Cardinality" && (
          <Cardinality />
        )}
        {currentPage === "UnitFraming" && (
          <UnitFraming />
        )}
        {currentPage === "DataStandards" && (
          <DataStandards />
        )}
        {currentPage === "Range" && (
          <Range />
        )}
        {currentPage === "AttributeFraming" && (
          <AttributeFraming />
        )}
        {currentPage === "FormatRules" && (
          <FormatRuleV2 />
        )}
      </Box>
      <Footer />
    </>
  );
};

export default Home;
