import React, {
  useRef,
  useContext,
  useState,
  useEffect,
  forwardRef,
  useImperativeHandle
} from "react";
import { useTranslation } from "react-i18next";
import { Alert, Box, Typography } from "@mui/material";
import Grid from "./Grid";
import AddAttribute from "./AddAttribute";
import { useMultiSchema } from "../context/MultiSchemaContext";
import {
  removeSpacesFromString,
  removeSpacesFromArrayOfObjects
} from "../constants/removeSpaces";
import BackNextSkeleton from "../components/BackNextSkeleton";
import Loading from "../components/Loading";
import { hasDisallowedChars } from "../constants/utils";
import { FIELD_RANGE_OVERLAY } from "../constants/constants";
import ErrorPopup from "../ViewSchema/ErrorPopup";
import { getSchemaDataById } from "../SchemaVisualization/dataUtils";
import { LanguageUtils } from "../utils/languageUtils";

const AttributeDetails = forwardRef(({ pageBack, pageForward, insertStep, removeStep }, ref) => {
  const { t, i18n } = useTranslation();
  
  // Use only MultiSchemaContext - unified approach
  const {
    currentSchemaId,
    getSchemaState,
    updateSchemaState,
    getCompleteSchema,
    getOverlaySelections,
    updateOverlaySelection
  } = useMultiSchema();
  

  // Local state for the current editing session
  const [attributeRowData, setAttributeRowData] = useState([]);
  const [attributesList, setAttributesList] = useState([]);

  const [errorMessage, setErrorMessage] = useState("");
  const [canDelete, setCanDelete] = useState(false);
  const [showAddAttribute, setShowAddAttribute] = useState(false);
  const [addByTab, setAddByTab] = useState(false);
  const [showCard, setShowCard] = useState(false);
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
  useEffect(() => {
    setLoading(true);

    // Get schema state (MultiSchemaContext handles the fallback internally)
    const schemaState = getSchemaState(currentSchemaId);
    
    
    // Get current language code for schema data
    const schemaLanguageName = LanguageUtils.getSchemaLanguageFromUI(i18n.language);
    const languageCode = LanguageUtils.getOCALanguageCode(schemaLanguageName);
    // NEW UNIFIED APPROACH: Get complete schema data directly
    const completeSchema = getCompleteSchema(currentSchemaId);

    // Skip if already initialized for this schema AND data hasn't changed
    if (initializedSchemaRef.current === currentSchemaId && 
        schemaState?.attributes && 
        JSON.stringify(schemaState.attributes) === JSON.stringify(attributeRowData)) {
      setLoading(false);
      return;
    }

    // Check if existing state exists (should take precedence over complete schema)
    if (schemaState?.attributes && schemaState.attributes.length > 0) {
      // Use existing state (preserves user-added/deleted attributes and edits)
      // Avoid redundant updates to prevent flicker
      const sameAttrs =
        JSON.stringify(attributeRowData) === JSON.stringify(schemaState.attributes);
      const sameList =
        JSON.stringify(attributesList) ===
        JSON.stringify(schemaState.attributesList || []);
      
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
      
      if (!sameList) setAttributesList(schemaState.attributesList || []);
      setLoading(false);
      initializedSchemaRef.current = currentSchemaId;
      return;
    }

    // Initialize from complete schema if available and no existing state
    if (completeSchema && (!schemaState?.attributes || schemaState.attributes.length === 0)) {
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

        // Handle schema references (refs/refn) - these should be "Child Schema" not a type
        let displayType = value;
        if (Array.isArray(value)) {
          const arrayType = value[0] || "Unknown";
          displayType = `Array[${arrayType}]`;
        }
        if (
          displayType &&
          (displayType.startsWith("refs:") || displayType.startsWith("refn:"))
        ) {
          displayType = "Child Schema";
        }

        return {
          Attribute: key,
          Type: displayType,
          Description: "",
          Required: false,
          EntryCodes: [],
          List: hasEntryCodes
        };
      });

      // Avoid redundant updates to prevent flicker
      const nextList = Object.keys(schemaAttributes);
      const sameAttrs =
        JSON.stringify(attributeRowData) === JSON.stringify(newAttributeRowData);
      const sameList = JSON.stringify(attributesList) === JSON.stringify(nextList);
      if (!sameAttrs) setAttributeRowData(newAttributeRowData);
      if (!sameList) setAttributesList(nextList);

      // Save to MultiSchemaContext
      updateSchemaState(currentSchemaId, {
        attributes: newAttributeRowData,
        attributesList: Object.keys(schemaAttributes)
      });

      // Note: Overlay data is now managed per-schema in MultiSchemaContext

      setLoading(false);
      initializedSchemaRef.current = currentSchemaId;
    } else if (!schemaState?.attributes || schemaState.attributes.length === 0) {
      // Handle manual schema creation case (no completeSchema but also no existing attributes)
      // Initialize with empty arrays to allow user to start adding attributes
      const emptyAttributeRowData = [];
      const emptyAttributesList = [];
      
      setAttributeRowData(emptyAttributeRowData);
      setAttributesList(emptyAttributesList);

      // Save empty state to MultiSchemaContext
      updateSchemaState(currentSchemaId, {
        attributes: emptyAttributeRowData,
        attributesList: emptyAttributesList
      });

      setLoading(false);
      initializedSchemaRef.current = currentSchemaId;
    } else {
      // Some other case - just stop loading
      setLoading(false);
      initializedSchemaRef.current = currentSchemaId;
    }
  }, [currentSchemaId, i18n.language]); // Removed function dependencies that cause infinite loops

  // Intentionally removed continuous auto-sync to prevent flicker.

  // Update canDelete when attributeRowData changes
  useEffect(() => {
    setCanDelete(attributeRowData.length > 0);
  }, [attributeRowData.length]);

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

    // Always save current attribute data to schema state first, so validation can check current data
    updateSchemaState(currentSchemaId, {
      attributes: attributeRowData,
      attributesList: attributesList
    });

    const validateForward = () => {
      const allAttributes = [];
      const duplicateAttributes = [];
      let blankAttributes = false;

      const errorOptions = {
        duplicates: t("Please enter a unique attribute name for each attribute"),
        blankAttribute: t("Attribute names cannot be blank"),
        codeInjection: t("Attribute names cannot include HTML"),
        blankType: t("Please enter a Type for all attributes"),
        disallowedCharacters: t("AttributeDisallowedCharErrorMessage")
      };
      let codeInjection = false;
      let hasDisallowedCharacters = false;

      attributeRowData.forEach((item) => {
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
        return errorOptions.disallowedCharacters;
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

      const newAttributeRowData = attributeRowData.map((item, index) => ({
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
      
      if (overlaySelections && overlaySelections[FIELD_RANGE_OVERLAY]?.selected) {
        const hasValidAttribute = noSpacesArray.some(
          (attribute) => attribute.Type === "Numeric" || attribute.Type === "DateTime"
        );

        if (!hasValidAttribute) {
          updateOverlaySelection(currentSchemaId, FIELD_RANGE_OVERLAY, { selected: false });
        }
      }

      return allAttributes;
    };

    const validationResult = validateForward();

    if (typeof validationResult === "string") {
      setErrorMessage(validateForward());
      setTimeout(() => {
        setErrorMessage("");
      }, [2000]);
    } else {
      setAttributesList(validationResult);

      const newAttributesWithLists = [];
      attributeRowData.forEach((item) => {
        if (item.List === true) {
          newAttributesWithLists.push(item.Attribute);
        }
      });

      // Save attributesWithLists to schema state instead of global state
      // MultiSchemaContext handles null schemaId internally
      updateSchemaState(currentSchemaId, {
        attributes: attributeRowData,
        attributesList: validationResult,
        attributesWithLists: newAttributesWithLists
      });
      
      if (newAttributesWithLists.length > 0) {
        entryCodesRef.current = true;
        // Insert Entry Codes step synchronously to ensure it's available for navigation
        insertStep(2, { label: "Entry Codes", page: "Codes" });
      } else {
        removeStep("Entry Codes");
      }

      // Persist attributes and list to MultiSchemaContext in one place to avoid flicker
      // Initialize lanAttributeRowData for all attributes if not already present
      const schemaState = getSchemaState(currentSchemaId);
      const currentLanAttributeRowData = schemaState?.lanAttributeRowData || {};
      
      // Get available languages (fallback to default if none set)
      const availableLanguages = schemaState?.metadata?.languages || ['English'];
      
      // Initialize rows for each language and attribute
      const updatedLanAttributeRowData = { ...currentLanAttributeRowData };
      availableLanguages.forEach(language => {
        if (!updatedLanAttributeRowData[language]) {
          updatedLanAttributeRowData[language] = [];
        }
        
        // Ensure all attributes have entries in lanAttributeRowData
        const languageData = updatedLanAttributeRowData[language];
        attributeRowData.forEach(attr => {
          const existingEntry = languageData.find(item => item.Attribute === attr.Attribute);
          if (!existingEntry) {
            languageData.push({
              Attribute: attr.Attribute,
              Label: attr.Attribute, // Default label is attribute name
              Description: attr.Description || "",
              List: "Not a List" // Default list value
            });
          }
        });
      });
      
      updateSchemaState(currentSchemaId, {
        attributes: attributeRowData,
        attributesList: validationResult,
        attributesWithLists: newAttributesWithLists,
        lanAttributeRowData: updatedLanAttributeRowData,
        initialized: true
      });
      navigationSafe.current = true;
    }
  };

  // Expose save and getCurrentData to parent (Home) so stepper click can persist before navigation
  useImperativeHandle(ref, () => ({
    save: handleSave,
    getCurrentData: () => attributeRowData
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
    handleSave();
    if (navigationSafe.current === true) {
      pageBack();
    }
  };

  return (
    <BackNextSkeleton
      isBack
      pageBack={pageBackSave}
      isForward
      pageForward={pageForwardSave}
    >
      {loading && <Loading />}
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
      {errorMessage.length > 0 && (
        <Alert
          severity="error"
          style={{
            position: "fixed",
            top: 10,
            left: 100,
            right: 100,
            zIndex: 9999
          }}
        >
          {errorMessage}
        </Alert>
      )}
      <div ref={refContainer}>
        {!loading && (
          <Grid
            gridRef={gridRef}
            addButton1={addButton1}
            addButton2={addButton2}
            setErrorMessage={setErrorMessage}
            canDelete={canDelete}
            setCanDelete={setCanDelete}
            setAddByTab={setAddByTab}
            typesObjectRef={typesObjectRef}
            setLoading={setLoading}
            attributeRowData={attributeRowData}
            setAttributeRowData={setAttributeRowData}
          />
        )}
      </div>
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
      />
    </BackNextSkeleton>
  );
});

export default AttributeDetails;
