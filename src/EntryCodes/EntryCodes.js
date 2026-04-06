import React, {
  useContext,
  useEffect,
  useState,
  useRef,
  forwardRef,
  useImperativeHandle,
  useMemo,
  useLayoutEffect,
  useCallback
} from "react";
import { useTranslation } from "react-i18next";
import { Box, Typography } from "@mui/material";
import { Context } from "../App";
import SingleTable from "./SingleTable";
import { removeSpacesAndColonFromArrayOfObjects } from "../utils/stringUtils";
import BackNextSkeleton from "../components/BackNextSkeleton";
import Loading from "../components/Loading";
import { BETWEEN_SECTION_SPACING } from "../constants/constants";
import WarningEntryCodeDelete from "./WarningEntryCodeDelete";
import { useMultiSchema } from "../schema/schemaContext";
import { langCodeOCAFromName, langNameFromCodeOCA } from "../utils/languageUtils";
import { getPackageBundle } from "../utils/packageUtils";

const errorMessages = {
  fieldEmpty: "Please fill in entry codes.",
  quoteMisuse: "Fields cannot contain quotes or commas"
};
const EntryCodes = forwardRef(({ pageBack, pageForward, onValidationError }, ref) => {
  const { t, i18n } = useTranslation();
  const [selectedAttributes, setSelectedAttributes] = useState({});
  const [selectedAttributesList, setSelectedAttributesList] = useState([]);
  const [errorMessage, setErrorMessage] = useState("");
  const { currentSchemaId, getSchema, updateSchema, getLanguages } = useMultiSchema();
  const schemaState = getSchema();
  
  // Get languages from schema state (per-schema)
  const languages = getLanguages();
  
  // Global context
  const { setCurrentPage } = useContext(Context);
  
  // Use schema state data directly - no fallback needed
  const attributeRowData = useMemo(
    () => schemaState?.attributes || [],
    [schemaState?.attributes]
  );
  const entryCodeRowData = useMemo(
    () => schemaState?.entryCodes || {},
    [schemaState?.entryCodes]
  );
  const attributesWithLists = useMemo(
    () => schemaState?.attributesWithLists || [],
    [schemaState?.attributesWithLists]
  );
  const [chosenTable, setChosenTable] = useState(0);
  const codeRefs = useRef();
  const pageForwardDisabledRef = useRef(false);
  const [showWarning, setShowWarning] = useState(false);
  const [loading, setLoading] = useState(true);
  const gridReadyRef = useRef(new Set());
  const hasInitializedFromOverlays = useRef({});
  
  // Local state for entry code grid data (schema-specific)
  const [localEntryCodeRowData, setLocalEntryCodeRowData] = useState([]);

  const attributeListKey = selectedAttributesList.join("|");

  useLayoutEffect(() => {
    setLoading(true);
    gridReadyRef.current = new Set();
  }, [currentSchemaId, attributeListKey, i18n.language]);

  useEffect(() => {
    if (selectedAttributesList.length === 0) {
      setLoading(false);
    }
  }, [selectedAttributesList.length]);

  const handleEntryCodeGridFirstDataRendered = useCallback(
    (gridIndex) => {
      gridReadyRef.current.add(gridIndex);
      const n = selectedAttributesList.length;
      if (n > 0 && gridReadyRef.current.size >= n) {
        setLoading(false);
      }
    },
    [selectedAttributesList.length]
  );
  
  // Memoize the complete schema to avoid triggering useEffect unnecessarily
  const completeSchema = useMemo(() => schemaState?.completeSchema, [schemaState?.completeSchema]);

  // Prefill entry codes from overlays on first load if schema state is empty
  // Use a ref object keyed by currentSchemaId to track per-schema initialization
  useEffect(() => {
    // Only run once per schema - prevent repopulation when user edits data
    if (hasInitializedFromOverlays.current[currentSchemaId]) return;
    
    try {
      const attrList = attributeRowData
        .filter((a) => a.List === true)
        .map((a) => a.Attribute);
      if (!attrList || attrList.length === 0) {
        hasInitializedFromOverlays.current[currentSchemaId] = true;
        return;
      }

      // Check if schema state already has entry codes with actual data
      // If so, don't overwrite - the user or parser already set them
      const hasExistingData = attrList.some((attr) => {
        const rows = entryCodeRowData?.[attr];
        return Array.isArray(rows) && rows.length > 0 && rows.some(row => 
          row.Code || Object.keys(row).some(k => k !== 'Code' && row[k])
        );
      });
      if (hasExistingData) {
        return;
      }

      // Get overlays from the complete schema (works for both bundles and packages)
      // Use memoized completeSchema from below to avoid schemaState dependency
      if (!completeSchema) return;
      
      // Navigate to the bundle overlays (handles both bundle and oca_bundle wrapper)
      const bundleData = getPackageBundle(completeSchema) || completeSchema;
      const overlays = bundleData?.overlays;
      if (!overlays) return;

      const overlayCodes = overlays?.entry_code?.attribute_entry_codes || {};
      
      // Convert entry overlay array to object keyed by language code
      const overlayEntries = {};
      if (Array.isArray(overlays?.entry)) {
        overlays.entry.forEach((entryOverlay) => {
          const langCodeOCA = entryOverlay.language;
          if (langCodeOCA && entryOverlay.attribute_entries) {
            overlayEntries[langCodeOCA] = entryOverlay.attribute_entries;
          }
        });
      }

      // Convert schema language name (e.g., "English") to OCA code (e.g., "eng")
      const resolveAlpha3 = (lang) => {
        return langCodeOCAFromName(lang);
      };

      const initialized = {};
      attrList.forEach((attr) => {
        const codes = Array.isArray(overlayCodes?.[attr]) ? overlayCodes[attr] : [];
        if (codes.length === 0) return;
        const rows = codes.map((code) => {
          const row = { Code: code };
          
          // Add translations using full language names (normalize OCA codes to names)
          Object.keys(overlayEntries).forEach((langCodeOCA) => {
            const label = overlayEntries[langCodeOCA]?.[attr]?.[code];
            if (label) {
              // Convert OCA code (eng, fra) to language name (English, French)
              const lang = langNameFromCodeOCA(langCodeOCA) || langCodeOCA;
              row[lang] = label;
            }
          });
          
          // Ensure all schema languages have properties (even if empty)
          languages.forEach((languageName) => {
            if (!row[languageName]) {
              row[languageName] = "";
            }
          });
          return row;
        });
        initialized[attr] = rows;
      });

      if (Object.keys(initialized).length === 0) return;

      // Update schema state
      updateSchema({
        entryCodes: { ...entryCodeRowData, ...initialized }
      });

      // Always update the visible grid rows too for immediate UI feedback
      const attributeArray = attrList;
      const alignedEntryCodesArray = attributeArray.map((attr) => {
        const rowsForAttr = Array.isArray(initialized[attr])
          ? initialized[attr]
          : [{ Code: "" }];
        return rowsForAttr.map((r) => ({ ...r }));
      });
      // Use local state instead of global
      setLocalEntryCodeRowData(alignedEntryCodesArray);
    } catch (_) {
      // silent
    }
    // Mark as initialized after first run to prevent re-running
    hasInitializedFromOverlays.current[currentSchemaId] = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    attributeRowData,
    entryCodeRowData,
    languages,
    completeSchema,
    // updateCurrentSchema and schemaState intentionally omitted to prevent infinite loop
  ]);

  useEffect(() => {
    if (!codeRefs.current) {
      codeRefs.current = attributesWithLists.map(() => React.createRef());
    }
  }, [attributesWithLists]);

  // Create data object and array for only attributes that have lists
  useEffect(() => {
    const filteredAttributes = attributeRowData.filter((item) => item.List === true);
    const attributeArray = filteredAttributes.map((item) => item.Attribute);
    setSelectedAttributes(filteredAttributes);
    setSelectedAttributesList(attributeArray);

    // Align entry code row arrays to the exact order of selected attributes to avoid index drift
    // Source of truth for existing codes is the schema state's entryCodeRowData (object keyed by attribute)
    const emptyRow = (() => {
      const row = { Code: "" };
      // Use OCA codes as field keys
      languages.forEach((languageName) => {
        const langCodeOCA = langCodeOCAFromName(languageName);
        row[langCodeOCA] = "";
      });
      return row;
    })();
    // Get overlays from the complete schema (works for both bundles and packages)
    const bundleData = getPackageBundle(completeSchema) || completeSchema || {};
    const overlays = bundleData?.overlays || {};
    
    const overlayCodes = overlays?.entry_code?.attribute_entry_codes || {};
    
    // Convert entry overlay array to object keyed by OCA language code
    const overlayEntries = {};
    if (Array.isArray(overlays?.entry)) {
      overlays.entry.forEach((entryOverlay) => {
        const langCodeOCA = entryOverlay.language;
        if (langCodeOCA && entryOverlay.attribute_entries) {
          overlayEntries[langCodeOCA] = entryOverlay.attribute_entries;
        }
      });
    }

    const alignedEntryCodesArray = attributeArray.map((attr) => {
      let rowsForAttr = Array.isArray(entryCodeRowData[attr])
        ? entryCodeRowData[attr]
        : null;
      // If current rows exist, use them as-is (don't backfill from overlays to preserve user edits)
      if (Array.isArray(rowsForAttr) && rowsForAttr.length > 0) {
        rowsForAttr = rowsForAttr.map((r) => ({ ...r }));
      }
      // If still no rows, try to build from overlays entirely
      if (!rowsForAttr) {
        const codes = Array.isArray(overlayCodes?.[attr]) ? overlayCodes[attr] : [];
        if (codes.length > 0) {
          rowsForAttr = codes.map((code) => {
            const row = { Code: code };
            
            // Add labels for all available overlay translations (using OCA codes as keys)
            Object.keys(overlayEntries).forEach((langCodeOCA) => {
              const label = overlayEntries[langCodeOCA]?.[attr]?.[code];
              if (label) {
                row[langCodeOCA] = label;
              }
            });
            
            // Ensure all current languages have properties (even if empty)
            languages.forEach((languageName) => {
              const langCodeOCA = langCodeOCAFromName(languageName);
              if (!row[langCodeOCA]) {
                row[langCodeOCA] = overlayEntries?.[langCodeOCA]?.[attr]?.[code] || "";
              }
            });
            return row;
          });
        }
      }
      if (!rowsForAttr || rowsForAttr.length === 0) rowsForAttr = [emptyRow];
      return rowsForAttr.map((r) => ({ ...r }));
    });
    
    // Only update if the data has actually changed or if local state is empty/wrong structure
    const shouldUpdate = !localEntryCodeRowData || 
                        !Array.isArray(localEntryCodeRowData) ||
                        localEntryCodeRowData.length !== attributeArray.length ||
                        JSON.stringify(alignedEntryCodesArray) !== JSON.stringify(localEntryCodeRowData);
    
    if (shouldUpdate) {
      setLocalEntryCodeRowData(alignedEntryCodesArray);
    }

    if (filteredAttributes.length === 0) {
      setCurrentPage("LanguageDetails");
    }
  }, [
    attributeRowData,
    languages,
    entryCodeRowData,
    completeSchema,
    currentSchemaId,
    setCurrentPage
  ]);

  const handleSave = () => {
    codeRefs.current.forEach((grid) => {
      grid.current.api.stopEditing();
    });

    // Build object keyed by attribute from the grid's visible array state
    // The visible array is stored in local state (aligned to selectedAttributesList order)
    const rowsArray = Array.isArray(localEntryCodeRowData) ? localEntryCodeRowData : [];
    
    const newEntryCodeObject = {};
    selectedAttributesList.forEach((attrName, index) => {
      const sourceRows = Array.isArray(rowsArray[index]) ? rowsArray[index] : [];
      const normalizedRows = sourceRows.map((obj) => {
        // Preserve all properties from the source object, not just the current languages
        const normalized = { ...obj };
        // Ensure all current languages have properties (even if empty)
        languages.forEach((language) => {
          if (!(language in normalized)) {
            normalized[language] = "";
          }
        });
        return normalized;
      });
      newEntryCodeObject[attrName] = normalizedRows;
    });

    // setSavedEntryCodes(newEntryCodeObject);
    // Validate only the "Code" field and the languages currently in the schema
    const msg = t(errorMessages.fieldEmpty);
    if (onValidationError) onValidationError("");
    const values = Object.values(newEntryCodeObject);
    for (const item of values) {
      if (!item || item.length === 0) {
        pageForwardDisabledRef.current = true;
        setErrorMessage(msg);
        onValidationError?.(msg);
        setTimeout(() => {
          setErrorMessage("");
          onValidationError?.("");
        }, 2000);
        return;
      }
      for (const obj of item) {
        if (!obj.Code) {
          pageForwardDisabledRef.current = true;
          setErrorMessage(msg);
          onValidationError?.(msg);
          setTimeout(() => {
            setErrorMessage("");
            onValidationError?.("");
          }, 2000);
          return;
        }
        for (const languageName of languages) {
          if (!obj[languageName]) {
            pageForwardDisabledRef.current = true;
            setErrorMessage(msg);
            onValidationError?.(msg);
            setTimeout(() => {
              setErrorMessage("");
              onValidationError?.("");
            }, 2000);
            return;
          }
        }
      }
    }

    const keys = Object.keys(newEntryCodeObject);
    const newEntryCodesObject = {};
    keys.forEach((item) => {
      newEntryCodesObject[item] = removeSpacesAndColonFromArrayOfObjects(
        newEntryCodeObject[item]
      );
    });

    onValidationError?.("");
    // Save to schema state
    updateSchema({
      entryCodes: newEntryCodesObject
    });
  };

  const saveWithoutValidation = () => {
    codeRefs.current.forEach((grid) => {
      grid.current.api.stopEditing();
    });

    const rowsArray = Array.isArray(localEntryCodeRowData) ? localEntryCodeRowData : [];
    const newEntryCodeObject = {};
    selectedAttributesList.forEach((attrName, index) => {
      const sourceRows = Array.isArray(rowsArray[index]) ? rowsArray[index] : [];
      const normalizedRows = sourceRows.map((obj) => {
        const normalized = { ...obj };
        languages.forEach((language) => {
          if (!(language in normalized)) {
            normalized[language] = "";
          }
        });
        return normalized;
      });
      newEntryCodeObject[attrName] = normalizedRows;
    });

    const keys = Object.keys(newEntryCodeObject);
    const newEntryCodesObject = {};
    keys.forEach((item) => {
      newEntryCodesObject[item] = removeSpacesAndColonFromArrayOfObjects(
        newEntryCodeObject[item]
      );
    });

    updateSchema({
      entryCodes: newEntryCodesObject
    });
  };

  const pageBackSave = () => {
    saveWithoutValidation();
    pageBack();
  };

  // Quotes, commas and blanks in these fields cause issues with the excel export (they interfere with the drop-down menu formatting)
  const pageForwardSave = () => {
    pageForwardDisabledRef.current = false;
    handleSave();
    if (!pageForwardDisabledRef.current) {
      pageForward();
    }
  };

  // Validation method that can be called by parent - reuses handleSave validation
  const validate = () => {
    pageForwardDisabledRef.current = false;
    handleSave();
    return !pageForwardDisabledRef.current;
  };

  // expose save and validate methods to parent (Home) so it can persist edits and validate on navigation
  useImperativeHandle(ref, () => ({
    save: saveWithoutValidation, // Changed from handleSave to avoid validation on backward navigation
    validate: validate
  }));

  const allCodesDisplay = selectedAttributesList.map((item, index) => (
    <SingleTable
      attribute={selectedAttributes[index]}
      key={selectedAttributes[index].Attribute}
      index={index}
      codeRefs={codeRefs}
      chosenTable={chosenTable}
      setChosenTable={setChosenTable}
      setShowCard={setShowWarning}
      onFirstDataRendered={handleEntryCodeGridFirstDataRendered}
      entryCodeData={Array.isArray(localEntryCodeRowData[index]) ? localEntryCodeRowData[index] : []}
      setEntryCodeData={(newData) => {
        setLocalEntryCodeRowData(prev => {
          const updated = [...prev];
          updated[index] = newData;
          return updated;
        });
      }}
    />
  ));

  return (
    <BackNextSkeleton
      isBack
      pageBack={pageBackSave}
      isForward
      pageForward={pageForwardSave}
      errorMessage={onValidationError ? "" : errorMessage}
    >
      {loading && <Loading spinner />}
      {showWarning && (
        <WarningEntryCodeDelete
          title={t("Warning")}
          fieldArray={[
            t("Your current entry codes for this attribute will be overwritten")
          ]}
          setShowCard={setShowWarning}
          handleForward={() => {
            setCurrentPage("UploadEntryCodes");
            window.scrollTo(0, 0);
          }}
        />
      )}
      <Box sx={{ width: "90%", margin: "auto", mb: BETWEEN_SECTION_SPACING, minHeight: 400 }}>
        <Typography
          sx={{
            fontSize: 15,
            textAlign: "left",
            margin: "1rem 0 1rem 0",
            width: 500
          }}
        >
          {t(
            "You indicated in the previous step that one or more attributes is a list. Please add or upload entry codes:"
          )}
        </Typography>
        {selectedAttributes.length > 0 && allCodesDisplay}
      </Box>
    </BackNextSkeleton>
  );
});

export default EntryCodes;
