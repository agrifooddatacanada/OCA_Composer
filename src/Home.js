import React, { useEffect, useLayoutEffect, useState, useContext, useRef, useCallback, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import "./App.css";
import { Box } from "@mui/material";
import { getPackageBundleId } from "./utils/packageUtils";
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
import { useMultiSchema } from "./schema/schemaContext";
import ClickableStepperProgressIndicator from "./StepperProgressIndicator/ClickableStepperProgressIndicator";

const validateEntryCodesFromSchema = (state, languages, t) => {
  const messageKey = "Please click above and add codes.";
  const attributesWithLists = state?.attributesWithLists || [];
  const entryCodes = state?.entryCodes || {};
  for (const attrName of attributesWithLists) {
    const rows = entryCodes[attrName];
    if (!Array.isArray(rows) || rows.length === 0) return t(messageKey);
    for (const row of rows) {
      if (!row?.Code || !String(row.Code).trim()) return t(messageKey);
      for (const lang of languages) {
        const val = row[lang];
        if (val === undefined || val === null || !String(val).trim()) return t(messageKey);
      }
    }
  }
  return null;
};

const OVERLAY_SUB_PAGES = new Set([
  "CharacterEncoding",
  "RequiredEntries",
  "Cardinality",
  "UnitFraming",
  "FormInformation",
  "FormBuilder",
  "DataStandards",
  "Range",
  "AttributeFraming",
  "FormatRules"
]);

const EMPTY_STEP_ERRORS = {};

const STEPS_BASE = [
  { label: "Metadata", page: "Metadata" },
  { label: "Attributes", page: "Details" },
  { label: "Labels", page: "LanguageDetails" },
  { label: "Overlays", page: "Overlays" },
  { label: "Summary", page: "View" }
];

const ENTRY_CODES_STEP = { label: "Entry Codes", page: "Codes" };

const computeShowEntryCodes = (state) => {
  const attributesWithLists = state?.attributesWithLists || [];
  return Array.isArray(attributesWithLists) && attributesWithLists.length > 0;
};

const isSchemaMetadataComplete = (state) => {
  const localized = state?.metadata?.localized;
  if (!localized || typeof localized !== "object") return false;
  const values = Object.values(localized);
  if (values.length === 0) return false;

  return values.some((langData) => {
    if (!langData || typeof langData !== "object") return false;
    const name = typeof langData.name === "string" ? langData.name.trim() : "";
    const description = typeof langData.description === "string" ? langData.description.trim() : "";
    return name !== "" && description !== "";
  });
};

const Home = ({
  currentPage,
  setCurrentPage,
  pageForward: appPageForward,
  pageBack: appPageBack
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { setSummaryExportMode } = useContext(Context);

  useLayoutEffect(() => {
    if (location.state?.openView) {
      setSummaryExportMode(false);
      setCurrentPage("View");
      navigate(location.pathname, { replace: true, state: null });
      window.scrollTo(0, 0);
    }
  }, [location.pathname, location.state, setCurrentPage, navigate, setSummaryExportMode]);
  const { 
    currentSchemaId,
    schemaStates, 
    switchToSchema,
    ocaPackage,
    getSchema,
    getLanguages
  } = useMultiSchema();

  // Ensure schema is initialized when entering via EDIT SCHEMA (old flow)
  useEffect(() => {
    if (ocaPackage && !currentSchemaId) {
      const rootSchemaId = getPackageBundleId(ocaPackage);
      if (rootSchemaId) {
        switchToSchema(rootSchemaId, ocaPackage);
      }
    }
  }, [ocaPackage, currentSchemaId, switchToSchema]);

  const showEntryCodes = useMemo(() => {
    const state = getSchema() || {};
    return computeShowEntryCodes(state);
  }, [ocaPackage, schemaStates, currentSchemaId, getSchema]);

  const steps = useMemo(() => {
    if (!showEntryCodes) return STEPS_BASE;
    return [...STEPS_BASE.slice(0, 2), ENTRY_CODES_STEP, ...STEPS_BASE.slice(2)];
  }, [showEntryCodes]);

  const pageForNav = OVERLAY_SUB_PAGES.has(currentPage) ? "Overlays" : currentPage;

  const pageForward = () => {
    const currentIndex = steps.findIndex((step) => step.page === pageForNav);
    if (currentIndex >= 0 && currentIndex < steps.length - 1) {
      const nextStep = steps[currentIndex + 1];
      if (nextStep.page === "View") {
        setSummaryExportMode(true);
      }
      setCurrentPage(nextStep.page);
    }
  };

  const pageBack = () => {
    const currentIndex = steps.findIndex((step) => step.page === pageForNav);
    if (currentIndex > 0) {
      const prevStep = steps[currentIndex - 1];
      setCurrentPage(prevStep.page);
    }
  };

  const entryCodesRef = useRef(null);
  const [entryCodesError, setEntryCodesError] = useState("");
  const [attributesTypeError, setAttributesTypeError] = useState("");
  const entryCodesErrorTimerRef = useRef(null);
  const attributesTypeErrorTimerRef = useRef(null);
  const bypassMetadataModalRef = useRef(false);
  const forceInlineStepperErrorsRef = useRef(false);
  const attributeDetailsRef = useRef(null);
  const languageDetailsRef = useRef(null);
  const schemaMetadataRef = useRef(null);
  const formatRulesRef = useRef(null);
  const rangeRef = useRef(null);

  useEffect(() => {
    if (!entryCodesError) return;
    if (entryCodesErrorTimerRef.current) clearTimeout(entryCodesErrorTimerRef.current);
    entryCodesErrorTimerRef.current = setTimeout(() => setEntryCodesError(""), 5000);
    return () => {
      if (entryCodesErrorTimerRef.current) clearTimeout(entryCodesErrorTimerRef.current);
    };
  }, [entryCodesError]);

  useEffect(() => {
    if (!attributesTypeError) return;
    if (attributesTypeErrorTimerRef.current) clearTimeout(attributesTypeErrorTimerRef.current);
    attributesTypeErrorTimerRef.current = setTimeout(() => setAttributesTypeError(""), 5000);
    return () => {
      if (attributesTypeErrorTimerRef.current) clearTimeout(attributesTypeErrorTimerRef.current);
    };
  }, [attributesTypeError]);

  const handleStepClick = useCallback(
    (index) => {
    const target = steps[index];
    if (target?.page) {
      const resetBypassFlags = () => {
        bypassMetadataModalRef.current = false;
        forceInlineStepperErrorsRef.current = false;
      };

      try {
      const pageForStepIndex = OVERLAY_SUB_PAGES.has(currentPage) ? "Overlays" : currentPage;
      const currentIndex = steps.findIndex((step) => step.page === pageForStepIndex);
      const isForwardNavigation = index > currentIndex;

      // Only validate when navigating FORWARD
      if (isForwardNavigation) {
        // Run page-level modal validations first (take priority over stepper inline errors)
        if (currentPage === "Metadata") {
          if (!bypassMetadataModalRef.current) {
            if (schemaMetadataRef.current && typeof schemaMetadataRef.current.showValidationPopup === "function") {
              const isValid = schemaMetadataRef.current.showValidationPopup(target.page);
              if (!isValid) {
                return;
              }
            }
          }
        }

        if (currentPage === "Details") {
          if (attributeDetailsRef.current && typeof attributeDetailsRef.current.save === "function") {
            attributeDetailsRef.current.save();
          }
          if (attributeDetailsRef.current && typeof attributeDetailsRef.current.showValidationPopup === "function") {
            const isValid = attributeDetailsRef.current.showValidationPopup();
            if (!isValid) {
              return;
            }
          }
        }

        const state = getSchema() || {};
        const metadataComplete = isSchemaMetadataComplete(state);
        const attributesArray = Array.isArray(state.attributes) ? state.attributes : [];
        const hasMissingType = attributesArray.some(
          (attr) => !attr?.Type || String(attr.Type).trim() === ""
        );

        const attributesStepIndex = steps.findIndex((s) => s.label === "Attributes");
        const isSkippingAttributes =
          attributesStepIndex >= 0 &&
          index > attributesStepIndex &&
          currentIndex < attributesStepIndex;

        if (isSkippingAttributes) {
          if (hasMissingType && (metadataComplete || forceInlineStepperErrorsRef.current)) {
            setAttributesTypeError(t("Please click above and select types."));
            if (entryCodesError) setEntryCodesError("");
            return;
          }
          if (attributesTypeError) setAttributesTypeError("");
        } else if (attributesTypeError) {
          setAttributesTypeError("");
        }

        const entryCodesStepIndex = steps.findIndex((s) => s.label === "Entry Codes");
        const isSkippingEntryCodes = entryCodesStepIndex >= 0 && index > entryCodesStepIndex && currentIndex < entryCodesStepIndex;

        if (isSkippingEntryCodes) {
          // Entry Codes stepper inline error only applies if all attribute types are selected
          if (hasMissingType) {
            if (metadataComplete || forceInlineStepperErrorsRef.current) {
              setAttributesTypeError(t("Please click above and select types."));
            }
            if (entryCodesError) setEntryCodesError("");
            return;
          }

          const languages = getLanguages?.() || state?.metadata?.languages || [];
          const err = validateEntryCodesFromSchema(state, languages, t);
          if (err) {
            setEntryCodesError(err);
            if (attributesTypeError) setAttributesTypeError("");
            return;
          }
          if (entryCodesError) setEntryCodesError("");
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
      // FormatRules and Range expose save methods for immediate save if needed
      if (currentPage === "FormatRules" && formatRulesRef.current && typeof formatRulesRef.current.save === "function") {
        formatRulesRef.current.save();
      }
      if (currentPage === "Range" && rangeRef.current && typeof rangeRef.current.save === "function") {
        rangeRef.current.save();
      }

      if (target.page === "View") {
        setSummaryExportMode(true);
      }
      setCurrentPage(target.page);
      } finally {
        resetBypassFlags();
      }
    }
  },
  [
    steps,
    currentPage,
    getSchema,
    getLanguages,
    t,
    setCurrentPage,
    setSummaryExportMode,
    attributesTypeError,
    entryCodesError
  ]
);

  const handleContinueNavigationFromMetadataModal = useCallback(
    (targetPage) => {
      const targetIndex = steps.findIndex((s) => s.page === targetPage);
      if (targetIndex < 0) return;

      bypassMetadataModalRef.current = true;
      forceInlineStepperErrorsRef.current = true;
      handleStepClick(targetIndex);
    },
    [steps, handleStepClick]
  );

  useEffect(() => {
    if (currentPage === "Details") {
      setAttributesTypeError("");
    }
  }, [currentPage]);

  const activeStep = useMemo(() => {
    const pageForStep = OVERLAY_SUB_PAGES.has(currentPage) ? "Overlays" : currentPage;
    let idx = steps.findIndex((s) => s.page === pageForStep);
    if (idx === -1) idx = steps.findIndex((s) => s.page === currentPage);
    return idx >= 0 ? idx : 0;
  }, [currentPage, steps]);

  const stepErrors = useMemo(() => {
    if (!attributesTypeError && !entryCodesError) return EMPTY_STEP_ERRORS;
    return {
      ...(attributesTypeError ? { Attributes: attributesTypeError } : {}),
      ...(entryCodesError ? { "Entry Codes": entryCodesError } : {})
    };
  }, [attributesTypeError, entryCodesError]);

  // Clear Entry Codes error when navigating away
  useEffect(() => {
    if (currentPage !== "Codes") {
      setEntryCodesError("");
    }
  }, [currentPage]);

  useEffect(() => {
    if (!showEntryCodes && currentPage === "Codes") {
      setCurrentPage("LanguageDetails");
    }
  }, [showEntryCodes, currentPage, setCurrentPage]);

  const prevPageForSummaryRef = useRef(null);
  useEffect(() => {
    if (prevPageForSummaryRef.current === "View" && currentPage !== "View") {
      setSummaryExportMode(true);
    }
    prevPageForSummaryRef.current = currentPage;
  }, [currentPage, setSummaryExportMode]);

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
            stepErrors={stepErrors}
          />
        )}
        {currentPage === "Start" && <StartSchema pageForward={pageForward} />}
        {currentPage === "Metadata" && (
          <SchemaMetadata
            ref={schemaMetadataRef}
            pageBack={pageBack}
            pageForward={pageForward}
            onContinueNavigation={handleContinueNavigationFromMetadataModal}
          />
        )}
        {currentPage === "Details" && (
          <AttributeDetails
            ref={attributeDetailsRef}
            pageBack={pageBack}
            pageForward={pageForward}
          />
        )}
        {currentPage === "Codes" && (
          <EntryCodes 
            ref={entryCodesRef}
            pageBack={pageBack}
            pageForward={pageForward}
            onValidationError={setEntryCodesError}
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
        {currentPage === "Range" && <Range ref={rangeRef} />}
        {currentPage === "AttributeFraming" && <AttributeFraming />}
        {currentPage === "FormatRules" && <FormatRuleV2 ref={formatRulesRef} />}
      </Box>
      <Footer />
    </>
  );
};

export default Home;
