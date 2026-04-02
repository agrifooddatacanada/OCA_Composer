import React, {
  useRef,
  useContext,
  useState,
  useEffect,
  useLayoutEffect,
  forwardRef,
  useImperativeHandle,
  useCallback
} from "react";
import { useTranslation } from "react-i18next";
import { Box, Typography } from "@mui/material";
import Grid from "./Grid";
import Loading from "../components/Loading";
import AddAttribute from "./AddAttribute";
import { useMultiSchema } from "../schema/schemaContext";
import {
  removeSpacesFromString,
  removeSpacesFromArrayOfObjects
} from "../utils/stringUtils";
import BackNextSkeleton from "../components/BackNextSkeleton";
import { BETWEEN_SECTION_SPACING } from "../constants/constants";
import { hasDisallowedChars } from "../utils/helpers";
import { FIELD_RANGE_OVERLAY, TYPE_CHILD_SCHEMA, FIELD_UNIT_FRAMING_OVERLAY, TABLE_TO_BUTTON_GAP } from "../constants/constants";
import ErrorPopup from "../ViewSchema/ErrorPopup";
import { langNameFromTwoLetters, langCodeOCAFromName } from "../utils/languageUtils";

const AttributeDetails = forwardRef(({ pageBack, pageForward }, ref) => {
  const { t, i18n } = useTranslation();
  
  // Use only MultiSchemaContext - unified approach
  const {
    currentSchemaId,
    getSchema,
    updateSchema,
    getOverlaySelections,
    updateOverlaySelection
  } = useMultiSchema();
  

  const [attributeRowData, setAttributeRowData] = useState(() => {
    const schema = getSchema();
    return Array.isArray(schema?.attributes) ? schema.attributes : [];
  });

  const [errorMessage, setErrorMessage] = useState("");
  const [canDelete, setCanDelete] = useState(false);
  const [showAddAttribute, setShowAddAttribute] = useState(false);
  const [addByTab, setAddByTab] = useState(false);
  const [showCard, setShowCard] = useState(false);
  const [showInvalidCharModal, setShowInvalidCharModal] = useState(false);
  const [loading, setLoading] = useState(true);

  const navigationSafe = useRef();
  const gridRef = useRef();
  const refContainer = useRef();
  const entryCodesRef = useRef();
  const typeBlanksRef = useRef();
  const typesObjectRef = useRef({});
  const addButton1 = useRef();
  const addButton2 = useRef();

  // Track initialization to prevent unnecessary package parsing
  const initializedSchemaRef = useRef(null);

  useLayoutEffect(() => {
    setLoading(true);
  }, [currentSchemaId, i18n.language]);

  // Update types object when attribute data changes
  useEffect(() => {
    const newTypesObjetRef = {};
    attributeRowData.forEach((item) => {
      newTypesObjetRef[item.Attribute] = item.Type;
    });
    typesObjectRef.current = newTypesObjetRef;
  }, [attributeRowData]);

  // Note: Overlay selections are now managed per-schema in MultiSchemaContext
  // No need for separate overlay initialization as it's handled in the schema state

  // Initialize or refresh data when switching to edit a schema
  /**
   * Initialization and Data Synchronization Effect
   * 
   * This effect handles loading attribute data from MultiSchemaContext and displaying it in the grid.
   * It runs when the component mounts or when currentSchemaId/completeSchema changes.
   * 
   * DATA SOURCE PRIORITY (in order):
   * 1. schemaState.attributes (if non-empty) - User's working copy, preserves edits/deletions
   * 2. completeSchema.attributes (if no schemaState.attributes) - Original OCA data from file
   * 
   * CRITICAL SCENARIOS:
   * A. File Upload (OCAParser initialized):
   *    - OCAParser already created schemaState.attributes=[] (even if empty)
   *    - hasAttributesArray=true, so we SKIP completeSchema initialization
   *    - This preserves labels in lanAttributeRowData from OCAParser
   * 
   * B. Manual Creation:
   *    - User enters attributes in CreateManually
   *    - schemaState.attributes=[] initially, populated as user adds
   *    - hasAttributesArray=true, so we use schemaState.attributes
   * 
   * C. User Deleted All Attributes:
   *    - schemaState.attributes=[], schemaState.initialized=true
   *    - hasAttributesArray=true, so we don't re-populate from completeSchema
   *    - Empty state is intentional and should be preserved
   * 
   * D. Brand New Schema (never touched):
   *    - schemaState.attributes=undefined (not set)
   *    - hasAttributesArray=false, so we CAN initialize from completeSchema
   */
  useEffect(() => {
    // Get schema state (MultiSchemaContext handles the fallback internally)
    const schemaState = getSchema();
    
    // Get current language code for schema data
    const schemaLanguageName = langNameFromTwoLetters(i18n.language);
    const languageCode = langCodeOCAFromName(schemaLanguageName);
    // NEW UNIFIED APPROACH: Get complete schema data directly
    const completeSchema = getSchema();

    // Skip if already initialized for this schema AND data hasn't changed
    if (initializedSchemaRef.current === currentSchemaId && 
        schemaState?.attributes && 
        JSON.stringify(schemaState.attributes) === JSON.stringify(attributeRowData)) {
      return;
    }

    // PRIORITY 1: Use existing schemaState.attributes if present (non-empty)
    // This preserves user edits, additions, and deletions
    if (schemaState?.attributes && schemaState.attributes.length > 0) {
      // Use existing state (preserves user-added/deleted attributes and edits)
      // Avoid redundant updates to prevent flicker
      const sameAttrs =
        JSON.stringify(attributeRowData) === JSON.stringify(schemaState.attributes);
      
      // If attributes don't match, merge carefully to preserve _rid values
      if (!sameAttrs) {
        // If attributeRowData is empty, just use schemaState.attributes directly
        if (attributeRowData.length === 0) {
          setAttributeRowData(schemaState.attributes);
        } else {
          const mergedAttributes = schemaState.attributes.map((schemaAttr) => {
            const existingAttr = attributeRowData.find(existing => existing.Attribute === schemaAttr.Attribute);
            // Preserve _rid if it exists in current data
            return existingAttr?._rid ? { ...schemaAttr, _rid: existingAttr._rid } : schemaAttr;
          });
          setAttributeRowData(mergedAttributes);
        }
      }
      initializedSchemaRef.current = currentSchemaId;
      return;
    }

    // PRIORITY 2: Initialize from completeSchema ONLY if attributes array doesn't exist
    // CRITICAL: Check if schemaState.attributes is undefined (not just empty)
    // - If attributes=[] (defined but empty), don't re-initialize (might be OCAParser or user deletion)
    // - If attributes=undefined (never set), OK to initialize from completeSchema
    // - If initialized=true, never re-initialize (user intentionally deleted all)
    const hasAttributesArray = schemaState?.attributes !== undefined;
    if (completeSchema && !hasAttributesArray && !schemaState?.initialized) {
      const schemaAttributes = completeSchema.attributes || {};
      const newAttributeRowData = Object.entries(schemaAttributes).map(([key, value]) => {
        // Check if this attribute has entry codes (is a list)
        const hasEntryCodes =
          (completeSchema.overlays?.entry &&
            completeSchema.overlays.entry.some(
              (entryOverlay) =>
                entryOverlay.attribute_entries && entryOverlay.attribute_entries[key]
            )) ||
          (completeSchema.overlays?.entry_code &&
            (Array.isArray(completeSchema.overlays.entry_code)
              ? completeSchema.overlays.entry_code.some(
                  (entryOverlay) =>
                    entryOverlay.attribute_entry_codes && entryOverlay.attribute_entry_codes[key]
                )
              : completeSchema.overlays.entry_code.attribute_entry_codes &&
                completeSchema.overlays.entry_code.attribute_entry_codes[key]));

        // Handle schema references (refs/refn) - display as "Child Schema"
        let displayType = value;
        if (Array.isArray(value)) {
          const arrayType = value[0] || "Unknown";
          displayType = `Array[${arrayType}]`;
        }
        if (
          displayType &&
          (displayType.startsWith("refs:") || displayType.startsWith("refn:"))
        ) {
          displayType = TYPE_CHILD_SCHEMA;
        }
        return {
          Attribute: key,
          Type: displayType,
          Description: "",
          Required: false,
          EntryCodes: [],
          List: displayType === TYPE_CHILD_SCHEMA ? false : hasEntryCodes
        };
      });

      // Avoid redundant updates to prevent flicker
      const sameAttrs =
        JSON.stringify(attributeRowData) === JSON.stringify(newAttributeRowData);
      if (!sameAttrs) {
        setAttributeRowData(newAttributeRowData);
      }

      // Save to MultiSchemaContext (attributesList is computed automatically)
      updateSchema({
        attributes: newAttributeRowData
      });

      // Note: Overlay data is now managed per-schema in MultiSchemaContext

      initializedSchemaRef.current = currentSchemaId;
    } else if (!schemaState?.attributes || schemaState.attributes.length === 0) {
      // Handle manual schema creation case (no completeSchema but also no existing attributes)
      // Initialize with empty arrays to allow user to start adding attributes
      const emptyAttributeRowData = [];
      setAttributeRowData(emptyAttributeRowData);

      // Save empty state to MultiSchemaContext (attributesList is computed automatically)
      updateSchema({
        attributes: emptyAttributeRowData
      });
      initializedSchemaRef.current = currentSchemaId;
    } else {
      initializedSchemaRef.current = currentSchemaId;
    }
  }, [currentSchemaId, i18n.language]); // Removed function dependencies that cause infinite loops

  // Intentionally removed continuous auto-sync to prevent flicker.

  // Update canDelete when attributeRowData changes
  useEffect(() => {
    setCanDelete(attributeRowData.length > 0);
  }, [attributeRowData.length]);

/**
   * Helpers for unitFramedData merge and comparison
   * - buildMergedUnitFramedData: merge persisted rows with attributes, preserving manual edits
   * - unitFramedKey / areUnitFramedEqual: compare only the meaningful fields
   */
  const buildMergedUnitFramedData = (attributes = [], persisted = []) => {
    const deletedUnits = new Set(persisted.filter((r) => r.deleted).map((r) => r.Unit));
    const index = new Map(persisted.map((r) => [`${r.Attribute}|||${r.Unit}`, r]));

    return attributes
      .filter((a) => a.Unit && String(a.Unit).trim() !== "")
      .map((attr) => {
        const key = `${attr.Attribute}|||${attr.Unit}`;
        const existing = index.get(key);
        if (existing) return existing;

        // New unit - don't auto-populate UCUM, just create empty row
        return {
          Attribute: attr.Attribute,
          Unit: attr.Unit,
          "UCUM Code": "",
          "UCUM Label": "",
          Description: "",
          deleted: deletedUnits.has(attr.Unit)
        };
      });
  };

  const unitFramedKey = (r = {}) => `${r.Attribute || ""}|||${r.Unit || ""}|||${r["UCUM Code"] || ""}`;
  const areUnitFramedEqual = (a = [], b = []) => {
    if (a.length !== b.length) return false;
    const aKeys = a.map(unitFramedKey).sort();
    const bKeys = b.map(unitFramedKey).sort();
    return aKeys.every((k, i) => k === bKeys[i]);
  };

  // Keep schemaState.unitFramedData synchronized with attributeRowData so the
  // Unit Framing overlay UI reflects UCUM codes immediately (preserve manual edits).
  // Only sync if the unit framing overlay is selected.
  useEffect(() => {
    const schemaState = getSchema();
    const overlaySelections = getOverlaySelections(currentSchemaId);
    
    // Don't auto-sync if overlay is not selected (prevents repopulation after deletion)
    if (!overlaySelections || !overlaySelections[FIELD_UNIT_FRAMING_OVERLAY]) {
      return;
    }
    
    const persisted = schemaState?.unitFramedData || [];

    const merged = buildMergedUnitFramedData(attributeRowData, persisted);

    if (!areUnitFramedEqual(persisted, merged)) {
      updateSchema({ unitFramedData: merged });
    }
  }, [attributeRowData]);

  // Stops grid editing when clicking outside grid
  useEffect(() => {
    const handleClickOutsideGrid = (event) => {
      if (
        gridRef.current &&
        gridRef.current.api &&
        refContainer.current &&
        !refContainer.current.contains(event.target)
      ) {
        gridRef.current.api.stopEditing();
      }
    };

    // Only add the event listener if the grid is loaded (not loading)
    if (!loading) {
      document.addEventListener("click", handleClickOutsideGrid);
    }

    return () => {
      document.removeEventListener("click", handleClickOutsideGrid);
    };
  }, [gridRef, refContainer, loading]);

  const handleSave = () => {
    entryCodesRef.current = false;
    navigationSafe.current = false;
    typeBlanksRef.current = false;
    if (gridRef.current && gridRef.current.api) {
      gridRef.current.api.stopEditing();
    }

    // Get latest data from grid (includes Sensitive checkbox changes that don't trigger onCellValueChanged)
    let currentAttributeRowData = attributeRowData;
    if (gridRef.current?.api) {
      const rowData = [];
      gridRef.current.api.forEachNode((node) => rowData.push(node.data));
      currentAttributeRowData = rowData;
    }

    // Always save current attribute data to schema state first, so validation can check current data
    // attributesList is computed automatically from attributes
    updateSchema({
      attributes: currentAttributeRowData
    });

    const validateForward = () => {
      const allAttributes = [];
      const duplicateAttributes = [];
      let blankAttributes = false;

      const errorOptions = {
        duplicates: t("Please enter a unique name for each attribute."),
        blankAttribute: t("Attribute names cannot be blank."),
        codeInjection: t("Attribute names cannot include HTML."),
        blankType: t("Please enter a Type for all attributes.")
      };
      let codeInjection = false;
      let hasDisallowedCharacters = false;

      currentAttributeRowData.forEach((item) => {
        const attributeName = removeSpacesFromString(item.Attribute);

        if (hasDisallowedChars(attributeName)) {
          hasDisallowedCharacters = true;
        }

        if (
          attributeName.includes("/>") ||
          attributeName.includes("</") ||
          attributeName.includes("<svg") ||
          attributeName.includes("<script")
        ) {
          codeInjection = true;
        }

        if (!allAttributes.includes(attributeName)) {
          if (!attributeName) {
            blankAttributes = true;
          } else {
            allAttributes.push(attributeName);
          }
        } else {
          duplicateAttributes.push(attributeName);
        }
      });

      if (hasDisallowedCharacters) {
        return "disallowed";
      }

      if (duplicateAttributes.length > 0) {
        return errorOptions.duplicates;
      }

      if (blankAttributes) {
        return errorOptions.blankAttribute;
      }

      if (codeInjection) {
        return errorOptions.codeInjection;
      }

      const newAttributeRowData = currentAttributeRowData.map((item, index) => ({
        ...item,
        Attribute:
          item.Attribute !== allAttributes[index] ? allAttributes[index] : item.Attribute,
        Type:
          typesObjectRef.current && item.Type !== typesObjectRef.current[item.Attribute]
            ? typesObjectRef.current[item.Attribute]
            : item.Type
      }));

      newAttributeRowData.forEach((item) => {
        if (!item.Type) {
          typeBlanksRef.current = true;
        }
      });

      const noSpacesArray = removeSpacesFromArrayOfObjects(newAttributeRowData);
      setAttributeRowData(noSpacesArray);

      // Check range overlay selection using MultiSchemaContext
      const overlaySelections = getOverlaySelections(currentSchemaId);
      
      if (overlaySelections && overlaySelections[FIELD_RANGE_OVERLAY]) {
        const hasValidAttribute = noSpacesArray.some(
          (attribute) => attribute.Type === "Numeric" || attribute.Type === "DateTime"
        );

        if (!hasValidAttribute) {
          updateOverlaySelection(FIELD_RANGE_OVERLAY, false);
        }
      }

      return allAttributes;
    };

    const validationResult = validateForward();

    if (typeof validationResult === "string") {
      if (validationResult === "disallowed") {
        setShowInvalidCharModal(true);
      } else {
        setErrorMessage(validationResult);
        setTimeout(() => {
          setErrorMessage("");
        }, [2000]);
      }
    } else {
      const newAttributesWithLists = [];
      currentAttributeRowData.forEach((item) => {
        if (item.List === true) {
          newAttributesWithLists.push(item.Attribute);
        }
      });

      // Save attributesWithLists to schema state instead of global state
      // MultiSchemaContext handles null schemaId internally
      // attributesList is computed automatically from attributes
      updateSchema({
        attributes: currentAttributeRowData,
        attributesWithLists: newAttributesWithLists
      });
      
      if (newAttributesWithLists.length > 0) {
        entryCodesRef.current = true;
      } else {
        entryCodesRef.current = false;
      }

      // Persist attributes and list to MultiSchemaContext in one place to avoid flicker
      // Sync lanAttributeRowData: filter out deleted attributes while preserving existing labels
      const schemaState = getSchema();
      const currentLanAttributeRowData = schemaState?.lanAttributeRowData || {};
      
      // Create a set of current attribute names for fast lookup
      const currentAttributeNames = new Set(currentAttributeRowData.map(attr => attr.Attribute));
      
      // Filter each language's data to only include current attributes
      // This preserves the original labels/descriptions while removing deleted attributes
      // NOTE: lanAttributeRowData is keyed by language NAMES ("English", "French"), not OCA codes
      const updatedLanAttributeRowData = {};
      Object.keys(currentLanAttributeRowData).forEach(languageName => {
        const filteredData = currentLanAttributeRowData[languageName].filter(
          item => currentAttributeNames.has(item.Attribute)
        );
        
        // Only add new entries if an attribute doesn't already have label data
        attributeRowData.forEach(attr => {
          const existingEntry = filteredData.find(item => item.Attribute === attr.Attribute);
          if (!existingEntry) {
            // New attribute - add with default label
            filteredData.push({
              Attribute: attr.Attribute,
              Label: attr.Attribute, // Default label is attribute name
              Description: attr.Description || "",
              List: ""
            });
          }
        });
        
        updatedLanAttributeRowData[languageName] = filteredData;
      });
      
      // attributesList is computed automatically from attributes
      // Persist unit framing for attributes that have a Unit set.
      // Preserve any existing unitFramed rows when Attribute+Unit match and retain deleted flags.
      const existingUnitFramed = schemaState?.unitFramedData || [];
      const deletedRows = existingUnitFramed.filter((r) => r.deleted === true);
      const newUnitFramedData = attributeRowData
        .filter((a) => a.Unit && String(a.Unit).trim() !== "")
        .map((attr) => {
          const existingRow = existingUnitFramed.find(
            (r) => r.Attribute === attr.Attribute && r.Unit === attr.Unit
          );
          if (existingRow) return existingRow;
          
          // New unit - don't auto-populate UCUM, just create empty row
          return {
            Attribute: attr.Attribute,
            Unit: attr.Unit,
            "UCUM Code": "",
            "UCUM Label": "",
            Description: "",
            deleted: deletedRows.some((dr) => dr.Unit === attr.Unit)
          };
        });

      // If we have framed units, ensure the Unit Framing overlay is enabled for this schema
      if (newUnitFramedData.length > 0) {
        // Only enable if there's actual UCUM data, not just units
        const hasActualFraming = newUnitFramedData.some(row => row["UCUM Code"]);
        if (hasActualFraming) {
          updateOverlaySelection(FIELD_UNIT_FRAMING_OVERLAY, true);
        }
      }

      updateSchema({
        attributes: attributeRowData,
        attributesWithLists: newAttributesWithLists,
        lanAttributeRowData: updatedLanAttributeRowData,
        unitFramedData: newUnitFramedData,
        initialized: true
      });
      navigationSafe.current = true;
    }
  };

  // Validate without side effects - returns validation result
  const validate = useCallback(() => {
    // Check for blank types
    if (!attributeRowData || attributeRowData.length === 0) {
      return { isValid: true, errors: [] }; // No data to validate
    }
    
    const hasBlankTypes = attributeRowData.some(
      (attr) => !attr?.Type || attr.Type === ""
    );
    
    if (hasBlankTypes) {
      return {
        isValid: false,
        errors: [t("There are one or more blank entries in the Type column. Please provide valid data types for all attributes.")]
      };
    }
    
    return { isValid: true, errors: [] };
  }, [attributeRowData, t]);

  // Save without validation - used for backward navigation
  const saveWithoutValidation = () => {
    if (gridRef.current && gridRef.current.api) {
      gridRef.current.api.stopEditing();
    }

    // Get the latest data from the grid (not from state which might be stale)
    let currentData = attributeRowData;
    if (gridRef.current && gridRef.current.api) {
      const rowData = [];
      gridRef.current.api.forEachNode((node) => rowData.push(node.data));
      currentData = rowData;
    }

    // Calculate attributesWithLists from current grid data
    const newAttributesWithLists = [];
    currentData.forEach((item) => {
      if (item.List === true) {
        newAttributesWithLists.push(item.Attribute);
      }
    });

    // Persist unitFramedData as well so quick/back navigation doesn't lose framed units
    const schemaState = getSchema();
    const existingUnitFramed = schemaState?.unitFramedData || [];
    const deletedRows = existingUnitFramed.filter((r) => r.deleted === true);

    const newUnitFramedData = currentData
      .filter((a) => a.Unit && String(a.Unit).trim() !== "")
      .map((attr) => {
        const existingRow = existingUnitFramed.find(
          (r) => r.Attribute === attr.Attribute && r.Unit === attr.Unit
        );
        if (existingRow) return existingRow;
        
        // New unit - don't auto-populate UCUM, just create empty row
        return {
          Attribute: attr.Attribute,
          Unit: attr.Unit,
          "UCUM Code": "",
          "UCUM Label": "",
          Description: "",
          deleted: deletedRows.some((dr) => dr.Unit === attr.Unit)
        };
      });

    // If we have framed units, ensure the Unit Framing overlay is enabled for this schema
    if (newUnitFramedData.length > 0) {
      // Only enable if there's actual UCUM data, not just units
      const hasActualFraming = newUnitFramedData.some(row => row["UCUM Code"]);
      if (hasActualFraming) {
        updateOverlaySelection(FIELD_UNIT_FRAMING_OVERLAY, true);
      }
    }

    // Save current attribute data to schema state, including attributesWithLists and unit framing
    updateSchema({
      attributes: currentData,
      attributesWithLists: newAttributesWithLists,
      unitFramedData: newUnitFramedData
    });
  };

  // Expose methods to parent (Home) for navigation handling
  useImperativeHandle(ref, () => ({
    save: saveWithoutValidation, // Changed from handleSave to avoid validation on backward navigation
    getCurrentData: () => attributeRowData,
    validate: validate,
    showValidationPopup: () => {
      // Trigger the same popup as NEXT button
      const result = validate();
      if (!result.isValid) {
        setShowCard(true);
        return false;
      }
      return true;
    }
  }));

  const pageForwardSave = () => {
    handleSave();
    if (navigationSafe.current === true) {
      if (typeBlanksRef.current === true) {
        setShowCard(true);
      } else if (entryCodesRef.current) {
        // Navigate to Codes page - this should be handled by the normal page flow
        pageForward();
      } else {
        pageForward();
      }
    }
  };

  const pageBackSave = () => {
    // Save data without validation when going backwards
    if (gridRef.current && gridRef.current.api) {
      gridRef.current.api.stopEditing();
    }

    // Save current attribute data to schema state without validation
    // attributesList is computed automatically from attributes
    updateSchema({
      attributes: attributeRowData
    });
    
    // Always allow backward navigation
    pageBack();
  };

  return (
    <BackNextSkeleton
      isBack
      pageBack={pageBackSave}
      isForward
      pageForward={pageForwardSave}
    >
      {loading && <Loading spinner />}
      {showCard && (
        <ErrorPopup onClose={() => setShowCard(false)}>
          <Box>
            <Typography variant="h5" sx={{ mb: 1 }}>
              {t("There are one or more blank entries in the Type column.")}
            </Typography>
            <Typography variant="h6" fontWeight="semibold">
              {t("Please provide valid data types for all attributes.")}
            </Typography>
          </Box>
        </ErrorPopup>
      )}
      {showInvalidCharModal && (
        <ErrorPopup onClose={() => setShowInvalidCharModal(false)}>
          <Box sx={{ textAlign: "center", mb: 2 }}>
            <Typography variant="h6" fontWeight="semibold" sx={{ mb: 2 }}>
              {t("Attribute names are limited to the following characters:")}
            </Typography>
            <Box sx={{ display: "flex", justifyContent: "center" }}>
              <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", rowGap: 1, columnGap: 3, textAlign: "left" }}>
                {[
                  { label: "Numbers", value: "0-9" },
                  { label: "Letters", value: "a-z, A-Z" },
                  { label: "Underline", value: "_" },
                  { label: "Hyphen", value: "-" },
                  { label: "Period", value: "." }
                ].map((item, i) => (
                  <React.Fragment key={i}>
                    <Typography variant="body1">{t(item.label)}:</Typography>
                    <Typography variant="body1">{item.value}</Typography>
                  </React.Fragment>
                ))}
              </Box>
            </Box>
          </Box>
        </ErrorPopup>
      )}
      {/* We removed the generic errorMessage ErrorPopup to restore the inline error display for other general errors */}
      <Box
        sx={{
          width: "fit-content",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-end",
          visibility: loading ? "hidden" : "visible",
          pointerEvents: loading ? "none" : "auto"
        }}
      >
        <div ref={refContainer}>
          <Grid
            gridRef={gridRef}
            addButton1={addButton1}
            addButton2={addButton2}
            setErrorMessage={setErrorMessage}
            canDelete={canDelete}
            setCanDelete={setCanDelete}
            setAddByTab={setAddByTab}
            typesObjectRef={typesObjectRef}
            loading={loading}
            setLoading={setLoading}
            attributeRowData={attributeRowData}
            setAttributeRowData={setAttributeRowData}
            triggerInvalidCharModal={() => setShowInvalidCharModal(true)}
          />
        </div>
        <Box sx={{ mt: TABLE_TO_BUTTON_GAP, mb: BETWEEN_SECTION_SPACING, mr: "2rem" }}>
          <AddAttribute
            addButton1={addButton1}
            addButton2={addButton2}
            gridRef={gridRef}
            setErrorMessage={setErrorMessage}
            setCanDelete={setCanDelete}
            showAddAttribute={showAddAttribute}
            setShowAddAttribute={setShowAddAttribute}
            addByTab={addByTab}
            setAddByTab={setAddByTab}
            typesObjectRef={typesObjectRef}
            attributeRowData={attributeRowData}
            setAttributeRowData={setAttributeRowData}
            errorMessage={errorMessage}
            triggerInvalidCharModal={() => setShowInvalidCharModal(true)}
          />
        </Box>
      </Box>
    </BackNextSkeleton>
  );
});

export default AttributeDetails;
