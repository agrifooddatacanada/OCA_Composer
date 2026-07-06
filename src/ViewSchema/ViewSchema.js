import React, {
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  Suspense,
  useRef
} from "react";
import { useNavigate } from "react-router-dom";
import { Trans, useTranslation } from "react-i18next";
import i18next from "i18next";
import { Duration } from "luxon";
import {
  Box,
  Button,
  Typography,
  Tooltip,
  Alert
} from "@mui/material";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import { Context } from "../App";
import { useMultiSchema } from "../schema/schemaContext";
import { CustomPalette } from "../constants/customPalette";
import SchemaDescription from "./SchemaDescription";
import ViewGrid from "./ViewGrid";
import {
  getBestLangName,
  langCodeOCAFromName,
  LanguageConstants
} from "../utils/languageUtils";
import {
  TYPE_CHILD_SCHEMA,
  isChildSchemaType,
  MANUAL_CREATION_SCHEMA_ID,
  HEADER_TO_CONTENT_GAP_PX,
  BETWEEN_SECTION_SPACING
} from "../constants/constants";
import { searchUnits, isValidNumber, parseDateString, getFormatRuleDescription } from "../utils/helpers";
import { matchFormat } from "../OCADataValidator/utils/matchRules";
import { getFormatPatternForDecimalSeparator } from "../OCADataValidator/utils/decimalFormatPattern";
import {
  collectArrayDelimitersOutsideQuotes,
  formatDelimiterForMessage
} from "../OCADataValidator/utils/arrayDelimiterOverlay";
import Loading from "../components/Loading";
import Spinner from "../components/Spinner";
import BackNextSkeleton from "../components/BackNextSkeleton";
import useOCAExport from "../hooks/useOCAExport";
import usePrimaryColor from "../hooks/usePrimaryColor";
import useGenerateReadMe from "./useGenerateReadMe";
import useGenerateTextReadmeFromJson from "./useGenerateTextReadmeFromJson";
import {
  getPackageBundle,
  getPackageBundleId,
  getPackageDependencies
} from "../utils/packageUtils";
import { getMapValueForAttributeName } from "../utils/stringUtils";

import ErrorPopup from "./ErrorPopup";
import CustomRouterLink from "../components/CustomRouterLink";
import ConfirmResetCard from "./ConfirmResetCard";
import LinkCard from "./LinkCard";

// Lazy load the schema visualization component to avoid React hook issues
const SchemaVisualizationEmbed = React.lazy(
  () => import("../SchemaVisualization/SchemaVisualizationEmbed")
);

/**
 * Checks an example value against a range overlay's bounds.
 * Mirrors the numeric/DateTime logic used in OCADataValidator/validator.js.
 *
 * @returns {{ messageKey: string, params: object } | null} A translatable
 *   problem descriptor, or null when the value satisfies the range.
 */
function checkExampleAgainstRange(attrType, value, range) {
  const { lower, upper, lower_inclusive, upper_inclusive } = range || {};

  if (attrType.includes("Numeric")) {
    if (!isValidNumber(value)) return null;
    const num = Number.parseFloat(value);

    if (isValidNumber(lower)) {
      const lowerBound = Number.parseFloat(lower);
      if (num < lowerBound) {
        return { messageKey: "is below the lower bound {{bound}}", params: { bound: lowerBound } };
      }
      if (!lower_inclusive && num === lowerBound) {
        return { messageKey: "equals the exclusive lower bound {{bound}}", params: { bound: lowerBound } };
      }
    }

    if (isValidNumber(upper)) {
      const upperBound = Number.parseFloat(upper);
      if (num > upperBound) {
        return { messageKey: "is above the upper bound {{bound}}", params: { bound: upperBound } };
      }
      if (!upper_inclusive && num === upperBound) {
        return { messageKey: "equals the exclusive upper bound {{bound}}", params: { bound: upperBound } };
      }
    }
    return null;
  }

  if (attrType.includes("DateTime")) {
    const valueDate = parseDateString(value);
    if (!valueDate) return null;
    const lowerDate = lower ? parseDateString(lower) : null;
    const upperDate = upper ? parseDateString(upper) : null;
    const isDuration = Duration.isDuration(valueDate);
    const valueComparable = isDuration ? valueDate.as("milliseconds") : valueDate;

    if (lowerDate) {
      const lowerComparable = isDuration ? lowerDate.as("milliseconds") : lowerDate;
      if (valueComparable < lowerComparable) {
        return { messageKey: "is before the lower bound {{bound}}", params: { bound: lower } };
      }
      if (!lower_inclusive && valueDate.equals(lowerDate)) {
        return { messageKey: "equals the exclusive lower bound {{bound}}", params: { bound: lower } };
      }
    }

    if (upperDate) {
      const upperComparable = isDuration ? upperDate.as("milliseconds") : upperDate;
      if (valueComparable > upperComparable) {
        return { messageKey: "is after the upper bound {{bound}}", params: { bound: upper } };
      }
      if (!upper_inclusive && valueDate.equals(upperDate)) {
        return { messageKey: "equals the exclusive upper bound {{bound}}", params: { bound: upper } };
      }
    }
    return null;
  }

  return null;
}

/**
 * Checks an example value against the schema's decimal (Data Separator) overlay.
 * Only applies to Numeric attributes: a numeric example should use the schema's
 * configured decimal separator and not the alternative one.
 *
 * @returns {{ messageKey: string, params: object } | null} A translatable
 *   problem descriptor, or null when the value uses the expected separator.
 */
function checkExampleAgainstDecimal(attrType, value, decimalSeparator) {
  if (!attrType.includes("Numeric")) return null;

  const expected = decimalSeparator || ".";
  // The decimal-separator characters that would be wrong if present in the value.
  const wrongSeparators = [".", ","].filter((char) => char !== expected);
  const usedWrong = wrongSeparators.find((char) => value.includes(char));
  if (!usedWrong) return null;

  // Only flag values that are otherwise valid numbers once the wrong separator is
  // interpreted as the decimal point — free-text values are left to the format check.
  const normalized = value.split(usedWrong).join(".");
  if (!isValidNumber(normalized)) return null;

  return {
    messageKey: "uses \"{{found}}\" as the decimal separator but the schema expects \"{{separator}}\"",
    params: { found: usedWrong, separator: expected }
  };
}

/**
 * Checks an example value against the attribute's array delimiter overlay.
 * Only applies to Array attributes: when the example lists multiple items it
 * should separate them with the schema's configured delimiter. Mirrors the
 * warning logic in OCADataValidator/utils/arrayDelimiterOverlay.js.
 *
 * @returns {{ messageKey: string, params: object } | null} A translatable
 *   problem descriptor, or null when the value uses the expected delimiter.
 */
function checkExampleAgainstArrayDelimiter(attrType, value, expectedDelim, decimalSeparator) {
  if (!attrType.includes("Array")) return null;
  if (!expectedDelim) return null;

  const expected = expectedDelim.length === 1 ? expectedDelim : expectedDelim[0];
  const found = collectArrayDelimitersOutsideQuotes(value);
  // For numeric arrays the decimal separator (e.g. ",") would otherwise be
  // mistaken for an array delimiter, so ignore it here (e.g. "10,6; 11,5").
  if (attrType.includes("Numeric") && decimalSeparator && decimalSeparator !== expected) {
    found.delete(decimalSeparator);
  }
  // No delimiters means a single-item value — nothing to compare against.
  if (found.size === 0) return null;
  if (found.size === 1 && found.has(expected)) return null;

  if (found.size === 1) {
    const [actual] = [...found];
    return {
      messageKey: "uses the array delimiter \"{{found}}\" but the schema expects \"{{separator}}\"",
      params: {
        found: formatDelimiterForMessage(actual),
        separator: formatDelimiterForMessage(expected)
      }
    };
  }

  return {
    messageKey: "uses multiple array delimiters but the schema expects \"{{separator}}\"",
    params: { separator: formatDelimiterForMessage(expected) }
  };
}

/**
 * Validates example overlay values against the range, format, and decimal
 * overlays when those overlays are present for an attribute. Empty examples and
 * child-schema references are skipped. Returns one issue per (attribute,
 * language) mismatch.
 *
 * @param {object} args
 * @param {Array}   args.attributes        Schema attributes ([{ Attribute, Type }, ...]).
 * @param {object}  args.attributeFormats  Map of attribute name -> format rule.
 * @param {object}  args.attributeRanges   Map of attribute name -> { lower, upper, lower_inclusive, upper_inclusive }.
 * @param {object}  args.exampleData       Map of attribute name -> { language -> example value }.
 * @param {Array}   args.languages         Languages to check (falls back to whatever examples exist).
 * @param {string}  args.decimalSeparator     Schema's configured decimal separator (Data Separator overlay).
 * @param {boolean} args.enableDecimal         Whether the decimal (Data Separator) overlay is active.
 * @param {object}  args.arrayDelimiterData    Map of attribute name -> array delimiter character.
 * @param {boolean} args.enableArrayDelimiter  Whether the array delimiter (Data Separator) overlay is active.
 * @returns {Array<{ attribute, language, value, type, messageKey, params }>}
 */
export function validateExampleValuesAgainstOverlays({
  attributes = [],
  attributeFormats = {},
  attributeRanges = {},
  exampleData = {},
  languages = [],
  decimalSeparator = ".",
  enableDecimal = false,
  arrayDelimiterData = {},
  enableArrayDelimiter = false
}) {
  const issues = [];

  attributes.forEach((attr) => {
    const attrName = attr?.Attribute;
    if (!attrName) return;

    const attrType = attr?.Type || "";
    // Skip references to child schemas — examples don't apply to them.
    if (attrType.startsWith("refs:") || attrType.startsWith("refn:")) return;

    const formatRule = getMapValueForAttributeName(attributeFormats, attrName);
    const hasFormatRule = !!formatRule && String(formatRule).trim() !== "";

    const range = getMapValueForAttributeName(attributeRanges, attrName) || {};
    const hasRange =
      (range.lower !== undefined && String(range.lower).trim() !== "") ||
      (range.upper !== undefined && String(range.upper).trim() !== "");

    const arrayDelim = enableArrayDelimiter
      ? getMapValueForAttributeName(arrayDelimiterData, attrName) || ""
      : "";
    const hasArrayDelim = String(arrayDelim).trim() !== "";

    if (!hasFormatRule && !hasRange && !enableDecimal && !hasArrayDelim) return;

    const attrExamples = exampleData[attrName] || {};
    const langKeys =
      languages.length > 0 ? languages : Object.keys(attrExamples);

    langKeys.forEach((lang) => {
      const rawValue = attrExamples[lang];
      if (rawValue === undefined || rawValue === null || String(rawValue).trim() === "") {
        return;
      }
      const value = String(rawValue);

      // Decimal (Data Separator) overlay agreement. Evaluated first because a
      // wrong decimal separator also breaks the numeric format check; when that's
      // the root cause we report only the (more specific) decimal issue below.
      const decimalProblem = enableDecimal
        ? checkExampleAgainstDecimal(attrType, value, decimalSeparator)
        : null;
      if (decimalProblem) {
        issues.push({
          attribute: attrName,
          language: lang,
          value,
          type: "decimal",
          messageKey: decimalProblem.messageKey,
          params: decimalProblem.params
        });
      }

      // Format overlay agreement. For Numeric attributes the format pattern's
      // decimal point is adapted to the schema's decimal separator so that values
      // like "10,6" validate against a comma-based schema (mirrors validator.js).
      // Skipped when the decimal check already flagged the value to avoid a
      // redundant second message for the same underlying problem.
      const isNumeric = attrType.includes("Numeric");
      const effectiveFormat = isNumeric
        ? getFormatPatternForDecimalSeparator(formatRule, decimalSeparator)
        : formatRule;
      if (!decimalProblem && hasFormatRule && !matchFormat(attrType, effectiveFormat, value, false)) {
        // Plain-English description of the rule (translation key) when available,
        // otherwise fall back to the raw rule so the user still sees the expectation.
        const formatDescription = getFormatRuleDescription(attrType, formatRule);
        const expectedFormat = formatDescription || formatRule;
        issues.push({
          attribute: attrName,
          language: lang,
          value,
          type: "format",
          messageKey: "does not match the expected format ({{format}})",
          params: { format: expectedFormat, formatIsDescription: !!formatDescription }
        });
      }

      // Range overlay agreement.
      if (hasRange) {
        const rangeProblem = checkExampleAgainstRange(attrType, value, range);
        if (rangeProblem) {
          issues.push({
            attribute: attrName,
            language: lang,
            value,
            type: "range",
            messageKey: rangeProblem.messageKey,
            params: rangeProblem.params
          });
        }
      }

      // Array delimiter (Data Separator) overlay agreement.
      if (hasArrayDelim) {
        const arrayProblem = checkExampleAgainstArrayDelimiter(attrType, value, arrayDelim, decimalSeparator);
        if (arrayProblem) {
          issues.push({
            attribute: attrName,
            language: lang,
            value,
            type: "array",
            messageKey: arrayProblem.messageKey,
            params: arrayProblem.params
          });
        }
      }
    });
  });

  return issues;
}

export default function ViewSchema({
  pageBack,
  isExport = true,
  addClearButton,
  pageForward,
  isPageForward = true,
  isBack = false
}) {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const {
    summaryExportMode,
    setCurrentPage,
    history,
    setHistory,
    zipToReadme,
    jsonToReadme
  } = useContext(Context);

  const {
    currentSchemaId,
    switchToSchema,
    rebuildOcaPackageFromEditorState,
    getSchema,
    updateSchema,
    schemaStates,
    ocaPackage
  } = useMultiSchema();

  const primaryColor = usePrimaryColor();

  // Get languages from current schema's metadata (per-schema languages)
  const schemaState = getSchema();
  const languages = schemaState?.metadata?.languages || [
    LanguageConstants.DEFAULT_LANG_NAME
  ];

  const filteredLanguages = React.useMemo(() => [...languages], [languages]);

  // Check example overlay values against the range and format overlays (when present).
  const exampleValueIssues = useMemo(() => {
    if (!schemaState) return [];
    return validateExampleValuesAgainstOverlays({
      attributes: schemaState.attributes || [],
      attributeFormats: schemaState.attributeFormats || {},
      attributeRanges: schemaState.attributeRanges || {},
      exampleData: schemaState.exampleData || {},
      languages: filteredLanguages,
      decimalSeparator: schemaState.decimalSeparator || ".",
      enableDecimal: !!schemaState.enableDecimalSeparator,
      arrayDelimiterData: schemaState.arrayDelimiterData || {},
      enableArrayDelimiter: !!schemaState.enableArrayDelimiter
    });
  }, [schemaState, filteredLanguages]);

  // Schema language state - defaults to null (use i18n), can be overridden by schema buttons
  const [schemaLanguageOverride, setSchemaLanguageOverride] = useState(null);
  const [vizVersion, setVizVersion] = useState(0);

  // Helper to get current effective language (standardized approach)
  const getCurrentLanguage = () =>
    schemaLanguageOverride || getBestLangName({ languages: filteredLanguages });

  // Reset schema language override when app language changes (i18n primary approach)
  useEffect(() => {
    setSchemaLanguageOverride(null); // Reset to use i18n language
    setVizVersion((v) => v + 1); // Force visualization update
  }, [t]); // Track i18n language changes

  const VIEW_SCHEMA_LANGUAGE_STRIP_WIDTH = "70rem";

  const viewSchemaLanguageTabWidth = filteredLanguages.length < 5 ? "12rem" : "8.335rem";
  const viewSchemaLanguageChunks = useMemo(() => {
    const rows = [];
    for (let i = 0; i < filteredLanguages.length; i += 6) {
      rows.push(filteredLanguages.slice(i, i + 6).filter(Boolean));
    }
    return rows;
  }, [filteredLanguages]);

  const languageStrip = (
    <Box
      sx={{
        width: VIEW_SCHEMA_LANGUAGE_STRIP_WIDTH,
        maxWidth: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        gap: 1,
        boxSizing: "border-box"
      }}
    >
      {viewSchemaLanguageChunks.map((segment) => (
        <Box
          key={segment.join("-")}
          sx={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "flex-end",
            alignSelf: "flex-start",
            borderBottom: `1px solid ${CustomPalette.GREY_300}`,
            boxSizing: "border-box"
          }}
        >
          {segment.map((language) => {
            const selected = getCurrentLanguage() === language;
            let minimizedLanguage = language.slice(0, 9);
            if (minimizedLanguage !== language) {
              minimizedLanguage += "...";
            }
            return (
              <Button
                key={language}
                onClick={() => {
                  setSchemaLanguageOverride(language);
                  setVizVersion((v) => v + 1);
                }}
                variant="text"
                color="inherit"
                sx={{
                  textTransform: "none",
                  fontWeight: 400,
                  borderRadius: 0,
                  px: 2,
                  py: 1.25,
                  width: viewSchemaLanguageTabWidth,
                  minWidth: viewSchemaLanguageTabWidth,
                  maxWidth: { xs: "100%", sm: "none" },
                  color: selected ? CustomPalette.BLACK : CustomPalette.GREY_600,
                  bgcolor: "transparent",
                  boxShadow: "none",
                  borderBottom: "2px solid",
                  borderBottomColor: selected ? CustomPalette.BLACK : "transparent",
                  mb: "-1px",
                  "&:hover": {
                    bgcolor: "rgba(0, 0, 0, 0.04)",
                    color: CustomPalette.BLACK
                  }
                }}
              >
                <Typography noWrap variant="body2" sx={{ fontWeight: 400 }}>
                  {t(minimizedLanguage, { defaultValue: minimizedLanguage })}
                </Typography>
              </Button>
            );
          })}
        </Box>
      ))}
    </Box>
  );

  const [showLink, setShowLink] = useState(false);
  const [showConfirmReset, setShowConfirmReset] = useState(false);
  const [displayArray, setDisplayArray] = useState([]);
  const { exportData, error: exportError, clearError, resetToDefaults } = useOCAExport();

  // Package representation built from current editor state — kept early so
  // helper functions (display name lookup, package-level validation) can use it.
  const [pkgFromState, setPkgWithChanges] = useState(ocaPackage);

  // PACKAGE-LEVEL VALIDATION: scan all schemas in the workspace and report problems
  // Helper: return the same display name used by the visualization (meta overlay, then
  // attribute label from the parent, then schema metadata or id).
  const getSchemaDisplayName = (schemaId) => {
    const state = schemaStates[schemaId];

    // 1) Use explicit metadata name if available and not equal to the raw id
    const metaName = state?.metadata?.localized?.eng?.name || state?.metadata?.name;
    if (metaName && metaName !== schemaId) return metaName;

    // 2) Try to find a parent attribute that references this schema and use its label
    const pkg =
      pkgFromState ||
      ocaPackage ||
      (rebuildOcaPackageFromEditorState
        ? rebuildOcaPackageFromEditorState(ocaPackage)
        : null);
    if (pkg) {
      const bundle = getPackageBundle(pkg);
      const deps = getPackageDependencies(pkg) || [];
      const all = [bundle, ...deps].filter(Boolean);

      for (const s of all) {
        const attrs = s?.capture_base?.attributes || {};
        for (const [attrName, attrVal] of Object.entries(attrs)) {
          // Match refn:/refs: references or attribute-name-based placeholders
          const isRefMatch =
            (typeof attrVal === "string" &&
              (attrVal === `refn:${schemaId}` || attrVal === `refs:${schemaId}`)) ||
            (Array.isArray(attrVal) &&
              (attrVal[0] === `refn:${schemaId}` || attrVal[0] === `refs:${schemaId}`)) ||
            attrName === schemaId;
          if (!isRefMatch) continue;

          // Try to read the attribute label from the parent schema's localized label overlays
          const parentSchemaId = s.d;
          const parentState = schemaStates[parentSchemaId];
          const lan = parentState?.lanAttributeRowData || {};
          const engRows = lan.English || lan.eng || lan[Object.keys(lan)[0]] || [];
          const row = engRows.find((r) => r.Attribute === attrName);
          if (row?.Label) return row.Label;

          // Fallback to the attribute key
          return attrName;
        }
      }
    }

    // 3) Fallback to metadata name or raw id
    return metaName || schemaId;
  };

  const packageLevelMissingTypes = useMemo(
    () =>
      Object.entries(schemaStates).reduce((acc, [schemaId, state]) => {
        if (!state || !state.attributes) return acc;
        const missing = state.attributes.find((attr) => !attr.Type || attr.Type === "");
        if (missing) {
          const displayName = getSchemaDisplayName(schemaId);
          acc.push({ schemaId, name: displayName });
        }
        return acc;
      }, []),
    [schemaStates, pkgFromState, ocaPackage]
  );

  const packageLevelMissingEntryCodes = useMemo(
    () =>
      Object.entries(schemaStates).reduce((acc, [schemaId, state]) => {
        if (!state || !state.attributes) return acc;
        const attributesWithLists = state.attributesWithLists || [];
        const entryCodes = state.entryCodes || {};
        const hasProblem = state.attributes.some((attr) => {
          const isList = Array.isArray(attributesWithLists)
            ? attributesWithLists.includes(attr.Attribute)
            : attributesWithLists[attr.Attribute];
          const codes = entryCodes[attr.Attribute];
          return isList && (!codes || codes.length === 0);
        });
        if (hasProblem) {
          const displayName = getSchemaDisplayName(schemaId);
          acc.push({ schemaId, name: displayName });
        }
        return acc;
      }, []),
    [schemaStates, pkgFromState, ocaPackage]
  );

  const hasInvalidAttributesInPackage = packageLevelMissingTypes.length > 0;
  const hasMissingEntryCodesInPackage = packageLevelMissingEntryCodes.length > 0;
  // Export is disabled only when the package contains invalid schemas (download is package-wide)
  // Empty schemas are allowed - they become refn: placeholders in the export
  const exportDisabled = hasInvalidAttributesInPackage || hasMissingEntryCodesInPackage;
  const { toTextFile } = useGenerateReadMe();
  const { jsonToTextFile } = useGenerateTextReadmeFromJson();
  const [loading, setLoading] = useState(true);
  /** Full-screen loader only after this delay so sub-250ms loads never flash the overlay. */
  const LOADING_OVERLAY_DELAY_MS = 250;
  const [showLoadingOverlay, setShowLoadingOverlay] = useState(false);
  const [visualizationMode, setVisualizationMode] = useState("detailed"); // "detailed" for left-right, "tree" for top-down

  useEffect(() => {
    if (!loading) {
      setShowLoadingOverlay(false);
      return;
    }
    const id = setTimeout(() => setShowLoadingOverlay(true), LOADING_OVERLAY_DELAY_MS);
    return () => clearTimeout(id);
  }, [loading]);

  // Track the last known root digest to detect when package structure actually changes
  const lastRootDigestRef = useRef(null);

  // Sync currentSchemaId ONLY when package structure changes (e.g., adding first child schema)
  // Don't interfere with normal navigation to child schemas
  useEffect(() => {
    const pkg = pkgFromState || ocaPackage;
    const rootDigest = getPackageBundleId(pkg);

    // Only sync if the root digest has changed (package structure modified)
    if (
      rootDigest &&
      lastRootDigestRef.current &&
      rootDigest !== lastRootDigestRef.current
    ) {
      switchToSchema(rootDigest, pkg);
    }

    // Update the ref for next comparison
    lastRootDigestRef.current = rootDigest;
  }, [pkgFromState, ocaPackage, switchToSchema]);

  // Enhanced schema switching with proper navigation
  const handleSchemaSwitch = useCallback(
    (schemaId) => {
      if (!schemaId) return;

      // Canonicalize the incoming schemaId to match how it's stored in the context
      // "root" should map to bundle.d
      const pkg = pkgFromState || ocaPackage;
      const rootDigest = getPackageBundleId(pkg);
      const canonicalSchemaId = schemaId === "root" && rootDigest ? rootDigest : schemaId;

      // Switch only if different, but always navigate to the editor
      // Use pkgFromState which includes the latest changes and placeholder dependencies
      if (canonicalSchemaId !== currentSchemaId) {
        switchToSchema(schemaId, pkgFromState || ocaPackage);
      }
      setCurrentPage("Details");
      navigate("/start");
      window.scrollTo(0, 0);
    },
    [currentSchemaId, switchToSchema, pkgFromState, ocaPackage, setCurrentPage, navigate]
  );

  const downloadReadMe = () => {
    if (Object.keys(jsonToReadme).length > 0) {
      // Schema name will be extracted from jsonToReadme automatically
      jsonToTextFile(jsonToReadme, pkgFromState);
    } else if (zipToReadme.length > 0) {
      toTextFile(zipToReadme);
    }
  };

  const moveBackward = () => {
    if (history.length > 1 && history[history.length - 2] === "Landing") {
      setHistory((prev) => prev.slice(0, prev.length - 1));
      setCurrentPage("Landing");
      navigate("/");
    } else {
      pageBack();
    }
  };

  // readme hooks not used on this page
  // Show multi-schema visualization if:
  // 1. ANY schema in the hierarchy has Child Schema types (check schemaStates)
  // 2. Package has any dependencies (including empty placeholder schemas)
  const hasHierarchy = useMemo(() => {
    // Check if ANY schema in schemaStates has Child Schema types
    const anySchemaHasChildren = Object.values(schemaStates).some((state) =>
      state?.attributes?.some((attr) => {
        const type = attr?.Type;
        return isChildSchemaType(type);
      })
    );

    // Check if package has any dependencies (even empty ones)
    const dependencies = getPackageDependencies(pkgFromState);
    const hasDependencies = dependencies.length > 0;

    return anySchemaHasChildren || hasDependencies;
  }, [schemaStates, pkgFromState]);

  // Update the package data when schemas are modified
  useEffect(() => {
    // For manual creation, ocaPackage is null - rebuildOcaPackageFromEditorState will create the structure
    // For uploaded packages, ocaPackage contains the original structure
    // If manual creation, ensure root schema is initialized before building
    if (!ocaPackage) {
      const rootSchemaId = MANUAL_CREATION_SCHEMA_ID;
      const rootState = schemaStates[rootSchemaId];

      if (!rootState) {
        setPkgWithChanges(null);
        return;
      }

      // Mark schema as initialized so rebuildOcaPackageFromEditorState will process it
      if (!rootState.initialized) {
        updateSchema(rootSchemaId, { initialized: true });
        // Since state update is async, also update the local ref for immediate use
        schemaStates[rootSchemaId] = { ...rootState, initialized: true };
      }
    }

    // UNIFIED CODE PATH: rebuildOcaPackageFromEditorState handles both imported and manual schemas
    // - For uploads: clones ocaPackage and applies edits
    // - For manual creation: creates fresh package structure from schemaStates
    // - Converts "Child Schema" -> refn:name and builds dependencies automatically
    const pkgFromState = rebuildOcaPackageFromEditorState(ocaPackage);
    setPkgWithChanges(pkgFromState);
    setVizVersion((v) => v + 1);
  }, [ocaPackage, schemaStates, rebuildOcaPackageFromEditorState]);

  // Removed in favor of global language toggle (EN/FR)

  const handleClickDownload = async () => {
    try {
      setLoading(true);

      // Unified export hook handles all scenarios:
      // - Imported packages (flat or nested) via rebuildOcaPackageFromEditorState()
      // - Manual flat schemas via text DSL generation
      // - Manual nested schemas (throws helpful error - not yet supported)
      await exportData();

      // Clear any export errors since we successfully downloaded
      clearError();
    } catch (error) {
      console.error("Export failed:", error);
    } finally {
      setLoading(false);
    }
  };

  // Load schema data when component mounts or when active schema changes
  useEffect(() => {
    const loadSchemaData = async () => {
      try {
        // Wait for schema initialization if OCA package exists but no currentSchemaId yet
        if (ocaPackage && !currentSchemaId) {
          setLoading(true);
          return;
        }

        // CRITICAL FIX: Wait for schemaStates to contain the currentSchemaId
        // When OCA package is uploaded, schemaStates updates asynchronously
        // Use direct lookup to avoid stale getSchema closure
        const currentSchema = schemaStates[currentSchemaId];

        if (ocaPackage && currentSchemaId && !currentSchema) {
          setLoading(true);
          return;
        }

        setLoading(true);

        // Use direct lookup instead of getSchema to avoid stale closures
        const schemaState = currentSchema || getSchema();

        if (
          (ocaPackage && currentSchemaId) ||
          (!ocaPackage && schemaState && schemaState.attributes)
        ) {
          // Convert schema state back to the format expected by ViewGrid
          const schemaAttributes = schemaState.attributes || [];
          const attributeFormats = schemaState.attributeFormats || {};
          const attributeRanges = schemaState.attributeRanges || {};

          // Create the display array in the format expected by ViewGrid
          const newDisplayArray = schemaAttributes.map((attr) => {
            // Get language-specific data from schema state
            const lanAttributeData = schemaState.lanAttributeRowData || {};

            // Initialize language-specific fields for all available languages
            const descriptionObj = {};
            const labelObj = {};
            const listObj = {};

            // Build a map of attribute -> entryCodes array once
            const entryCodesMap = schemaState.entryCodes || {};
            const codesForAttr = Array.isArray(entryCodesMap[attr.Attribute])
              ? entryCodesMap[attr.Attribute]
              : [];

            // Initialize for all languages with proper data (accept either display name or 3-letter code)
            filteredLanguages.forEach((lang) => {
              const langCodeOCA = langCodeOCAFromName(lang);
              // Try to find language data using both full name and 3-letter code
              const rowsByName = lanAttributeData[lang] || [];
              const rowsByCode = lanAttributeData[langCodeOCA] || [];
              const langDataRows = rowsByName.length > 0 ? rowsByName : rowsByCode;
              const langData = langDataRows.find(
                (item) => item.Attribute === attr.Attribute
              );

              descriptionObj[lang] = langData?.Description || "";
              labelObj[lang] = langData?.Label || "";

              if (codesForAttr.length > 0) {
                const items = codesForAttr
                  .map(
                    (row) =>
                      // Entry codes are normalized at source to use language names
                      row[lang] || row.Code
                  )
                  .filter(Boolean);
                listObj[lang] = items.length > 0 ? items.join(" | ") : "";
              } else {
                listObj[lang] = "";
              }
            });

            // Handle schema references (refs/refn) - display as "Child Schema"
            let displayType = attr.Type || "";
            if (displayType.startsWith("refs:") || displayType.startsWith("refn:")) {
              displayType = TYPE_CHILD_SCHEMA;
            }

            const charEncoding =
              (schemaState.characterEncodingData || {})[attr.Attribute] || "";

            // Get range data for this attribute from object
            const range =
              getMapValueForAttributeName(attributeRanges, attr.Attribute) || {};

            // Find unit framing data for this attribute
            const unitFramingData = (schemaState.unitFramedData || []).find(
              (u) => u.Attribute === attr.Attribute
            );

            // Build per-language example values map
            const exampleDataMap = schemaState.exampleData || {};
            const examplesObj = {};
            filteredLanguages.forEach((lang) => {
              examplesObj[lang] = exampleDataMap[attr.Attribute]?.[lang] || "";
            });
            
            return {
              Attribute: attr.Attribute,
              Type: displayType,
              Description: descriptionObj,
              Label: labelObj,
              Required: !!attr.Required,
              "Format Rule":
                getMapValueForAttributeName(attributeFormats, attr.Attribute) || "",
              "Character Encoding": charEncoding,
              List: listObj,
              Unit: attr.Unit || "",
              Sensitive: attr.Sensitive || false,
              // Add range overlay fields from object
              LowerBound: range.lower || "",
              UpperBound: range.upper || "",
              LowerInclusive: range.lower_inclusive ?? false,
              UpperInclusive: range.upper_inclusive ?? false,
              // Add unit framing field (UCUM code). If no unitFramedData exists, try to derive a UCUM code from the attribute Unit.
              "Unit Framing":
                unitFramingData?.["UCUM Code"] || (attr.Unit ? (searchUnits(attr.Unit).firstMatch?.code || "") : ""),
              Examples: examplesObj
            };
          });

          setDisplayArray(newDisplayArray);
        } else {
          // No valid schema - show empty array
          setDisplayArray([]);
        }

        setLoading(false);
      } catch (error) {
        // console.error("Error loading schema data:", error);
        setLoading(false);
      }
    };

    // Run immediately - no setTimeout
    // The dependency array will cause re-runs when schemaStates updates
    loadSchemaData();
  }, [
    currentSchemaId,
    ocaPackage,
    schemaLanguageOverride,
    i18next.language,
    getSchema,
    filteredLanguages,
    schemaStates, // Ensure updates when schema state changes
    getSchema()?.attributeFormats, // Explicitly watch attributeFormats changes
    getSchema()?.attributeRanges // Explicitly watch attributeRanges changes
  ]);

  const viewSchemaRightContent = (
    <>
      {isExport && !summaryExportMode && (
        <>
          <Button
            color="button"
            variant="contained"
            onClick={() => {
              setCurrentPage("Metadata");
            }}
            sx={{
              alignSelf: "flex-end",
              display: "flex",
              justifyContent: "space-around",
              padding: "0.5rem 1rem"
            }}
          >
            {t("Edit Schema")}
          </Button>
          <Button
            color="button"
            variant="contained"
            onClick={downloadReadMe}
            sx={{
              alignSelf: "flex-end",
              display: "flex",
              justifyContent: "space-around",
              padding: "0.5rem 1rem"
            }}
            disabled={exportDisabled}
          >
            {t("Download ReadMe")}
          </Button>
        </>
      )}

      {/* Validation Alerts */}

      {/* Package-level validation: warn if ANY schema in the package has missing attribute types or missing entry codes */}
      {(hasInvalidAttributesInPackage || hasMissingEntryCodesInPackage) &&
        isPageForward &&
        isExport &&
        summaryExportMode && (
          <Alert
            severity="warning"
            sx={{
              alignItems: "center",
              mb: 0,
              "& .MuiAlert-icon": { alignSelf: "center" }
            }}
          >
            {hasInvalidAttributesInPackage && (
              <div>
                {packageLevelMissingTypes.length === 1 ? (
                  <span>
                    {t("Schema")}{" "}
                    <Button
                      color="inherit"
                      variant="text"
                      sx={{ px: 0.5, py: 0, minWidth: "unset" }}
                      onClick={() =>
                        handleSchemaSwitch(packageLevelMissingTypes[0].schemaId)
                      }
                    >
                      {packageLevelMissingTypes[0].name}
                    </Button>{" "}
                    {t(
                      "has attributes missing types. Complete the schema before exporting."
                    )}
                  </span>
                ) : (
                  <span>
                    {t(
                      "{{count}} schemas have attributes missing types. Open each schema to complete them before exporting.",
                      { count: packageLevelMissingTypes.length }
                    )}
                  </span>
                )}
              </div>
            )}

            {hasMissingEntryCodesInPackage && (
              <div style={{ marginTop: hasInvalidAttributesInPackage ? "0.5rem" : 0 }}>
                {packageLevelMissingEntryCodes.length === 1 ? (
                  <span>
                    {t("Schema")}{" "}
                    <Button
                      color="inherit"
                      variant="text"
                      sx={{ px: 0.5, py: 0, minWidth: "unset" }}
                      onClick={() =>
                        handleSchemaSwitch(packageLevelMissingEntryCodes[0].schemaId)
                      }
                    >
                      {packageLevelMissingEntryCodes[0].name}
                    </Button>{" "}
                    {t(
                      "has List attributes with no entry codes. Add entry codes before exporting."
                    )}
                  </span>
                ) : (
                  <span>
                    {t(
                      "{{count}} schemas have List attributes with no entry codes. Open each schema to add entry codes before exporting.",
                      { count: packageLevelMissingEntryCodes.length }
                    )}
                  </span>
                )}
              </div>
            )}
          </Alert>
        )}

      {isPageForward && isExport && summaryExportMode && (
        <Box sx={{ position: "relative" }}>
          <Button
            color="button"
            variant="contained"
            onClick={handleClickDownload}
            sx={{
              width: "8rem",
              display: "flex",
              justifyContent: "space-around",
              p: 1,
              whiteSpace: "normal",
              textAlign: "center"
            }}
            disabled={exportDisabled}
          >
            {t("Download", { defaultValue: "Download" })}
          </Button>
          <Tooltip
            title={
              <span>
                {t(
                  "For future editing, download your schema as-is and later upload it to the Semantic Engine."
                )}
              </span>
            }
            placement="bottom"
            arrow
          >
            <Box
              sx={{
                position: "absolute",
                right: -20,
                top: "50%",
                transform: "translateY(-50%)",
                cursor: "help"
              }}
            >
              <HelpOutlineIcon sx={{ fontSize: 15, color: CustomPalette.GREY_600 }} />
            </Box>
          </Tooltip>
          <Box
            sx={{
              position: "absolute",
              top: "100%",
              right: 0,
              mt: 0.5,
              fontSize: "0.7rem",
              color: CustomPalette.GREY_600,
              lineHeight: 1.4,
              whiteSpace: "nowrap"
            }}
          >
            <Box sx={{ textAlign: "right" }}>
              {t("1) Schema in", { defaultValue: "1) Schema in" })} .txt{" "}
              {t("format, readable and archivable.", {
                defaultValue: "format, readable and archivable."
              })}
              <br />
              {t("2) Schema in", { defaultValue: "2) Schema in" })} .json{" "}
              {t("format. Can be used by computers including", {
                defaultValue: "format. Can be used by computers including"
              })}
              <br />
              {t("tools on the Semantic Engine.", {
                defaultValue: "tools on the Semantic Engine."
              })}
            </Box>
          </Box>
        </Box>
      )}
    </>
  );

  return (
    <BackNextSkeleton
      isBack={isBack || (isPageForward && !pageForward)}
      pageBack={isBack ? pageBack : moveBackward}
      isForward={isPageForward && !!pageForward}
      pageForward={pageForward}
      rightContent={viewSchemaRightContent}
    >
      {loading && (
        <>
          {showLoadingOverlay && <Loading spinner />}
          <Box
            aria-hidden
            sx={{
              width: "100%",
              minHeight: "calc(100vh - 21rem)",
              pointerEvents: "none",
              bgcolor: "background.default"
            }}
          />
        </>
      )}
      {!loading && (
        <Box
          sx={{ mt: 2, mb: BETWEEN_SECTION_SPACING, width: "100%", position: "relative" }}
        >
          <Box sx={{ display: "flex", justifyContent: "space-between" }}>
            <Typography
              sx={{
                fontSize: 20,
                fontWeight: "bold",
                textAlign: "left",
                margin: `1rem 0 ${HEADER_TO_CONTENT_GAP_PX}px 0`,
                color: primaryColor
              }}
            >
              {t("Schema Language")}
            </Typography>
          </Box>
          <Box
            sx={{
              position: "relative",
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-start",
              mb: `${HEADER_TO_CONTENT_GAP_PX}px`,
              width: "70rem"
            }}
          >
            {languageStrip}
            <Box
              sx={{
                position: "absolute",
                right: "100%",
                top: "50%",
                transform: "translateY(-50%)",
                marginRight: 1,
                color: CustomPalette.GREY_600
              }}
            >
              <Tooltip
                title={t("Toggles between the one or more languages used in the schema")}
                placement="left"
                arrow
                PopperProps={{
                  sx: { "& .MuiTooltip-tooltip": { width: 100 } }
                }}
              >
                <HelpOutlineIcon sx={{ fontSize: 15 }} />
              </Tooltip>
            </Box>
          </Box>
          {showLink && <LinkCard setShowLink={setShowLink} />}
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-start"
            }}
          >
            {/* <Typography
          sx={{
            fontSize: 28,
            fontWeight: "bold",
            color: CustomPalette.PRIMARY,
            mb: 2,
            wordWrap: "break-word",
            textAlign: "left",
            maxWidth: "35rem",
          }}
        >
          {currentLanguage.replace(/\b\w/g, (match) => match.toUpperCase())}
        </Typography> */}

            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                marginTop: BETWEEN_SECTION_SPACING,
                marginBottom: `${HEADER_TO_CONTENT_GAP_PX}px`
              }}
            >
              <Typography
                sx={{
                  fontSize: 20,
                  fontWeight: "bold",
                  textAlign: "left",
                  margin: 0,
                  lineHeight: 1.5,
                  color: primaryColor
                }}
              >
                {t("Schema Metadata")}
              </Typography>
              <Box
                sx={{
                  marginLeft: "1rem",
                  color: CustomPalette.GREY_600,
                  display: "flex",
                  alignItems: "center"
                }}
              >
                <Tooltip
                  title={t(
                    "Language-specific information describing general schema information"
                  )}
                  placement="right"
                  arrow
                >
                  <HelpOutlineIcon sx={{ fontSize: 15 }} />
                </Tooltip>
              </Box>
            </Box>
            <SchemaDescription currentLanguage={getCurrentLanguage()} />

            {/* Multi-Schema Visualization */}
            {hasHierarchy && (
              <>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    marginTop: BETWEEN_SECTION_SPACING,
                    marginBottom: `${HEADER_TO_CONTENT_GAP_PX}px`
                  }}
                >
                  <Typography
                    sx={{
                      fontSize: 20,
                      fontWeight: "bold",
                      textAlign: "left",
                      margin: 0,
                      lineHeight: 1.5,
                      color: primaryColor
                    }}
                  >
                    {t("Multi-Schema Visualization", {
                      defaultValue: "Multi-Schema Visualization"
                    })}
                  </Typography>
                  <Box
                    sx={{
                      marginLeft: "1rem",
                      color: CustomPalette.GREY_600,
                      display: "flex",
                      alignItems: "center"
                    }}
                  >
                    <Tooltip
                      title={t("Visual representation of references between schemas")}
                      placement="right"
                      arrow
                    >
                      <HelpOutlineIcon sx={{ fontSize: 15 }} />
                    </Tooltip>
                  </Box>
                </Box>

                <Box sx={{ display: "flex", justifyContent: "flex-start", mb: 2 }}>
                  <Box
                    sx={{
                      display: "flex",
                      flexWrap: "wrap",
                      alignItems: "flex-end",
                      borderBottom: `1px solid ${CustomPalette.GREY_300}`
                    }}
                  >
                    {[
                      {
                        value: "detailed",
                        label: t("Left-Right", { defaultValue: "Left-Right" })
                      },
                      {
                        value: "tree",
                        label: t("Top-Down", { defaultValue: "Top-Down" })
                      }
                    ].map(({ value, label }) => {
                      const selected = visualizationMode === value;
                      return (
                        <Button
                          key={value}
                          variant="text"
                          color="inherit"
                          onClick={() => setVisualizationMode(value)}
                          sx={{
                            textTransform: "none",
                            fontWeight: 400,
                            borderRadius: 0,
                            px: 2,
                            py: 1.25,
                            minWidth: languages.length < 5 ? "12rem" : "10rem",
                            color: selected
                              ? CustomPalette.BLACK
                              : CustomPalette.GREY_600,
                            bgcolor: "transparent",
                            boxShadow: "none",
                            borderBottom: "2px solid",
                            borderBottomColor: selected
                              ? CustomPalette.BLACK
                              : "transparent",
                            mb: "-1px",
                            "&:hover": {
                              bgcolor: "rgba(0, 0, 0, 0.04)",
                              color: CustomPalette.BLACK
                            }
                          }}
                        >
                          <Typography variant="body2" sx={{ fontWeight: 400 }}>
                            {label}
                          </Typography>
                        </Button>
                      );
                    })}
                  </Box>
                </Box>

                {/* Visualization embed */}
                <Box sx={{ marginBottom: 0, width: "100%", minHeight: 500 }}>
                  <Suspense
                    fallback={
                      <Box
                        sx={{
                          width: "100%",
                          height: 500,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          border: `1px solid ${CustomPalette.GREY_300}`,
                          borderRadius: 2,
                          backgroundColor: "#f8f9fa"
                        }}
                      >
                        <Spinner size={40} text="" />
                      </Box>
                    }
                  >
                    <SchemaVisualizationEmbed
                      key={`viz-${vizVersion}-${getPackageBundleId(pkgFromState)}-${currentSchemaId}-${schemaLanguageOverride || i18next.language}`}
                      schemaLanguageOverride={getCurrentLanguage()}
                      pkg={pkgFromState}
                      viewMode={visualizationMode}
                      currentSchemaId={currentSchemaId}
                      setCurrentSchemaId={handleSchemaSwitch}
                    />
                  </Suspense>
                </Box>
              </>
            )}

        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            marginTop: BETWEEN_SECTION_SPACING,
            marginBottom: `${HEADER_TO_CONTENT_GAP_PX}px`
          }}
        >
          <Typography
            sx={{
              fontSize: 20,
              fontWeight: "bold",
              textAlign: "left",
              margin: 0,
              lineHeight: 1.5,
              color: primaryColor
            }}
          >
            {t("Schema Details")}
          </Typography>
          <Box sx={{ marginLeft: "1rem", color: CustomPalette.GREY_600, display: "flex", alignItems: "center" }}>
            <Tooltip
              title={t(
                "Attributes and all details relevant to them"
              )}
              placement="right"
              arrow
            >
              <HelpOutlineIcon sx={{ fontSize: 15 }} />
            </Tooltip>
          </Box>
        </Box>
        {exampleValueIssues.length > 0 && (
          <Alert
            severity="warning"
            sx={{ width: "100%", mb: `${HEADER_TO_CONTENT_GAP_PX}px` }}
          >
            <Typography sx={{ fontWeight: 600, mb: 0.5 }}>
              {t("Some example values do not agree with the range, format, decimal, or array delimiter overlays:")}
            </Typography>
            <Box component="ul" sx={{ m: 0, pl: 3, textAlign: "left" }}>
              {exampleValueIssues.map((issue) => {
                const problemParams = { ...issue.params };
                // The format description is itself a translation key — translate it
                // before it's interpolated into the problem sentence.
                if (problemParams.formatIsDescription && problemParams.format) {
                  problemParams.format = t(problemParams.format, {
                    defaultValue: problemParams.format
                  });
                }
                return (
                  <li key={`${issue.attribute}-${issue.language}-${issue.type}`}>
                    {t("{{attribute}} (example \"{{value}}\") {{problem}}.", {
                      attribute: issue.attribute,
                      value: issue.value,
                      problem: t(issue.messageKey, { ...problemParams, defaultValue: issue.messageKey })
                    })}
                    {filteredLanguages.length > 1 ? ` [${issue.language}]` : ""}
                  </li>
                );
              })}
            </Box>
          </Alert>
        )}
        <ViewGrid
          displayArray={displayArray}
          currentLanguage={getCurrentLanguage()}
          setLoading={setLoading}
          packageWithEdits={pkgFromState}
        />
            {addClearButton && isPageForward && isExport && summaryExportMode && (
              <Box
                sx={{ display: "flex", justifyContent: "flex-end", mt: 4, width: "100%" }}
              >
                <Button
                  color="warning"
                  variant="outlined"
                  onClick={() => setShowConfirmReset(true)}
                  sx={{
                    width: "16rem",
                    display: "flex",
                    justifyContent: "space-around",
                    p: 1
                  }}
                >
                  {t("Clear All Data and Restart", {
                    defaultValue: "Clear All Data and Restart"
                  })}
                </Button>
              </Box>
            )}
          </Box>

          {/* Confirm Reset Dialog */}
          {showConfirmReset && (
            <ConfirmResetCard
              onConfirm={() => {
                setShowConfirmReset(false);
                resetToDefaults();
              }}
              onCancel={() => setShowConfirmReset(false)}
            />
          )}

          {/* Error Popup */}
          {exportError && (
            <ErrorPopup
              onClose={() => {
                clearError();
              }}
            >
              <Typography variant="h5" sx={{ p: 1 }}>
                <Trans
                  i18nKey="SchemaExportError"
                  components={[
                    <CustomRouterLink
                      to="mailto:adc@uoguelph.ca"
                      text="adc@uoguelph.ca"
                      overrideStyle={{ fontWeight: "500", color: primaryColor }}
                    />
                  ]}
                />
              </Typography>
            </ErrorPopup>
          )}
        </Box>
      )}
    </BackNextSkeleton>
  );
}
