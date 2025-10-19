import React, {
  useContext,
  useEffect,
  useState,
  useRef,
  forwardRef,
  useImperativeHandle,
  useMemo,
  useCallback
} from "react";
import { useTranslation } from "react-i18next";
import { Box, Typography } from "@mui/material";
import { Context } from "../App";
import SingleTable from "./SingleTable";
import { removeSpacesAndColonFromArrayOfObjects } from "../constants/removeSpaces";
import BackNextSkeleton from "../components/BackNextSkeleton";
import WarningEntryCodeDelete from "./WarningEntryCodeDelete";
import { useMultiSchema } from "../context/MultiSchemaContext";
import {
  languageNameToAlpha3Codes,
  alpha3CodesToTwoLetterCodes
} from "../constants/isoCodes";

const errorMessages = {
  fieldEmpty: "Please fill out all fields",
  quoteMisuse: "Fields cannot contain quotes or commas"
};
const EntryCodes = forwardRef(({ pageBack, pageForward }, ref) => {
  const { t } = useTranslation();
  const [selectedAttributes, setSelectedAttributes] = useState({});
  const [selectedAttributesList, setSelectedAttributesList] = useState([]);
  const [errorMessage, setErrorMessage] = useState("");
  // Use MultiSchema context with standard pattern
  const { currentSchemaId, getSchemaState, updateSchemaState } = useMultiSchema();
  const schemaState = getSchemaState(currentSchemaId);
  
  const updateCurrentSchema = useCallback((updates) => {
    // MultiSchemaContext handles null schemaId internally
    updateSchemaState(currentSchemaId, updates);
  }, [currentSchemaId, updateSchemaState]);

  // Global context
  const {
    setSavedEntryCodes,
    setCurrentPage,
    languages,
    OCAPackage
  } = useContext(Context);
  


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
  const { overlay } = useContext(Context);
  
  // Local state for entry code grid data (schema-specific)
  const [localEntryCodeRowData, setLocalEntryCodeRowData] = useState([]);

  // Prefill entry codes from overlays on first load if schema state is empty
  useEffect(() => {
    try {
      const attrList = attributeRowData
        .filter((a) => a.List === true)
        .map((a) => a.Attribute);
      if (!attrList || attrList.length === 0) return;

      const overlayCodes = overlay?.entry_code?.attribute_entry_codes || {};
      const overlayEntries = overlay?.entry || {};

      // Debug info removed

      // Determine if we already have an entryCodes array allocated for any list attributes
      // Treat an existing empty array as intentional (user toggled list -> start empty)
      const hasExisting = attrList.some((attr) =>
        Array.isArray(entryCodeRowData?.[attr])
      );
      if (hasExisting) return;

      const resolveAlpha3 = (lang) => {
        if (!lang) return undefined;
        const lower = String(lang).toLowerCase();
        if (lower.length === 3) return lower;
        if (lower.length === 2) {
          // map 2-letter to 3-letter via reverse table
          const match = Object.entries(alpha3CodesToTwoLetterCodes).find(
            ([, two]) => two === lower
          );
          return match ? match[0] : undefined;
        }
        return languageNameToAlpha3Codes[lower];
      };

      const initialized = {};
      attrList.forEach((attr) => {
        const codes = Array.isArray(overlayCodes?.[attr]) ? overlayCodes[attr] : [];
        if (codes.length === 0) return;
        const rows = codes.map((code) => {
          const row = { Code: code };
          
          // Add all available overlay translations (preserve ISO codes like fra, eng, etc.)
          Object.keys(overlayEntries).forEach((langCode) => {
            const label = overlayEntries[langCode]?.[attr]?.[code];
            if (label) {
              row[langCode] = label;
            }
          });
          
          // Also ensure current language names have properties (even if empty)
          languages.forEach((languageName) => {
            const alpha3 = resolveAlpha3(languageName);
            const label = (alpha3 && overlayEntries?.[alpha3]?.[attr]?.[code]) || "";
            row[languageName] = label || "";
          });
          return row;
        });
        initialized[attr] = rows;
      });

      if (Object.keys(initialized).length === 0) return;

      // Update schema state
      updateCurrentSchema({
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
  }, [
    attributeRowData,
    entryCodeRowData,
    languages,
    overlay,
    updateCurrentSchema
  ]);

  // Create codeRefs so there can be multiple grids on the page
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
      languages.forEach((lang) => {
        row[lang] = "";
      });
      return row;
    })();
    const overlayCodes = overlay?.entry_code?.attribute_entry_codes || {};
    const overlayEntries = overlay?.entry || {};
    const resolveAlpha3 = (lang) => {
      if (!lang) return undefined;
      const lower = String(lang).toLowerCase();
      if (lower.length === 3) return lower;
      if (lower.length === 2) {
        const match = Object.entries(alpha3CodesToTwoLetterCodes).find(
          ([, two]) => two === lower
        );
        return match ? match[0] : undefined;
      }
      return languageNameToAlpha3Codes[lower];
    };

    const alignedEntryCodesArray = attributeArray.map((attr) => {
      let rowsForAttr = Array.isArray(entryCodeRowData[attr])
        ? entryCodeRowData[attr]
        : null;
      // If current rows exist but labels are missing, backfill labels from overlays
      if (Array.isArray(rowsForAttr) && rowsForAttr.length > 0) {
        rowsForAttr = rowsForAttr.map((r) => {
          const result = { ...r };
          languages.forEach((languageName) => {
            if (!result[languageName]) {
              const alpha3 = resolveAlpha3(languageName);
              const label = (alpha3 && overlayEntries?.[alpha3]?.[attr]?.[r.Code]) || "";
              result[languageName] = label;
            }
          });
          return result;
        });
      }
      // If still no rows, try to build from overlays entirely
      if (!rowsForAttr) {
        const codes = Array.isArray(overlayCodes?.[attr]) ? overlayCodes[attr] : [];
        if (codes.length > 0) {
          rowsForAttr = codes.map((code) => {
            const row = { Code: code };
            
            // Add all available overlay translations (preserve ISO codes like fra, eng, etc.)
            Object.keys(overlayEntries).forEach((langCode) => {
              const label = overlayEntries[langCode]?.[attr]?.[code];
              if (label) {
                row[langCode] = label;
              }
            });
            
            // Also ensure current language names have properties (even if empty)
            languages.forEach((languageName) => {
              const alpha3 = resolveAlpha3(languageName);
              const label = (alpha3 && overlayEntries?.[alpha3]?.[attr]?.[code]) || "";
              row[languageName] = label || "";
            });
            return row;
          });
        }
      }
      if (!rowsForAttr) rowsForAttr = [emptyRow];
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

    // If no attributes are marked as lists, redirect to LanguageDetails
    if (filteredAttributes.length === 0) {
      setCurrentPage("LanguageDetails");
    }
  }, [
    attributeRowData,
    languages,
    entryCodeRowData,
    overlay,
    currentSchemaId
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
    const values = Object.values(newEntryCodeObject);
    values.forEach((item) => {
      item.forEach((obj) => {
        const values = Object.values(obj);
        values.forEach((value) => {
          if (!value) {
            pageForwardDisabledRef.current = true;
            setErrorMessage(t(errorMessages.fieldEmpty));
            setTimeout(() => {
              setErrorMessage("");
            }, [2000]);
          }
        });
      });
    });

    const keys = Object.keys(newEntryCodeObject);
    const newEntryCodesObject = {};
    keys.forEach((item) => {
      newEntryCodesObject[item] = removeSpacesAndColonFromArrayOfObjects(
        newEntryCodeObject[item]
      );
    });

    // Save to schema state
    updateCurrentSchema({
      entryCodes: newEntryCodesObject
    });

    // Also save to global context for compatibility
    setSavedEntryCodes(newEntryCodesObject);
  };

  const pageBackSave = () => {
    handleSave();
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

  // expose save method to parent (Home) so it can persist edits on navigation
  useImperativeHandle(ref, () => ({
    save: handleSave
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
      errorMessage={errorMessage}
    >
      {showWarning && (
        <WarningEntryCodeDelete
          title={t("Warning")}
          fieldArray={[
            t("Your current entry codes for this attribute will be overwritten")
          ]}
          setShowCard={setShowWarning}
          handleForward={() => setCurrentPage("UploadEntryCodes")}
        />
      )}
      <Box sx={{ width: "90%", margin: "auto" }}>
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
