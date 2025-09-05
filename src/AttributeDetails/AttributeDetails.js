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
import { Context } from "../App";
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
import { toThreeLetterCode } from "../constants/isoCodes";

const AttributeDetails = forwardRef(({ pageBack, pageForward, removeStep }, ref) => {
  const { t, i18n } = useTranslation();
  
  // Get overlay from App context (still needed for UI state)
  const {
    overlay,
    setOverlay
  } = useContext(Context);
  
  // Use only MultiSchemaContext - unified approach
  const {
    activeSchemaId,
    editingSchemaId,
    getSchemaState,
    updateSchemaState,
    getCompleteSchema
  } = useMultiSchema();

  const currentSchemaId = activeSchemaId || editingSchemaId;

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

  // Ensure overlay state has all required keys
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (currentSchemaId && overlay) {
      // Ensure all required overlay keys are present
      const requiredOverlayKeys = [
        FIELD_RANGE_OVERLAY,
        "Unit Framing",
        "Attribute Framing",
        "Character Encoding",
        "Format Rules",
        "Cardinality",
        "Data Standards",
        "Make selected entries required"
      ];

      const missingKeys = requiredOverlayKeys.filter((key) => !overlay[key]);
      if (missingKeys.length > 0) {
        setOverlay((prev) => {
          const updated = { ...prev };
          missingKeys.forEach((key) => {
            updated[key] = { feature: key, selected: false };
          });
          return updated;
        });
      }
    }
  }, [currentSchemaId, overlay, setOverlay]);

  // Initialize or refresh data when switching to edit a schema
  useEffect(() => {
    if (!currentSchemaId) return;
    setLoading(true);

    const schemaState = getSchemaState(currentSchemaId);
    
    // Get current language code for schema data
    const languageCode = toThreeLetterCode(i18n.language.split("-")[0]) || "eng";
    // NEW UNIFIED APPROACH: Get complete schema data directly
    const completeSchema = getCompleteSchema(currentSchemaId);

    // Skip if already initialized for this schema
    if (initializedSchemaRef.current === currentSchemaId) {
      setLoading(false);
      return;
    }

    // Check if existing state exists (should take precedence over complete schema)
    if (schemaState?.attributes && schemaState.attributes.length >= 0) {
      // Use existing state (preserves user-added/deleted attributes and edits)
      // Avoid redundant updates to prevent flicker
      const sameAttrs =
        JSON.stringify(attributeRowData) === JSON.stringify(schemaState.attributes);
      const sameList =
        JSON.stringify(attributesList) ===
        JSON.stringify(schemaState.attributesList || []);
      
      // If attributes don't match, merge carefully to preserve _rid values
      if (!sameAttrs) {
        const mergedAttributes = schemaState.attributes.map((schemaAttr) => {
          const existingAttr = attributeRowData.find(existing => existing.Attribute === schemaAttr.Attribute);
          // Preserve _rid if it exists in current data
          return existingAttr?._rid ? { ...schemaAttr, _rid: existingAttr._rid } : schemaAttr;
        });
        setAttributeRowData(mergedAttributes);
      }
      
      if (!sameList) setAttributesList(schemaState.attributesList || []);
      setLoading(false);
      initializedSchemaRef.current = currentSchemaId;
      return;
    }

    // Only initialize from complete schema if no existing state at all
    if (completeSchema && !schemaState?.attributes) {
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

      // Update overlay context with schema's overlay data (if needed)
      if (completeSchema.overlays) {
        const newOverlay = { ...overlay };
        // Handle overlay updates if needed - simplified for unified approach
        setOverlay(newOverlay);
      }

      setLoading(false);
      initializedSchemaRef.current = currentSchemaId;
    } else {
      setLoading(false);
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

      if (overlay && overlay[FIELD_RANGE_OVERLAY]?.selected) {
        const hasValidAttribute = noSpacesArray.some(
          (attribute) => attribute.Type === "Numeric" || attribute.Type === "DateTime"
        );

        if (!hasValidAttribute) {
          setOverlay((prev) => ({
            ...prev,
            [FIELD_RANGE_OVERLAY]: {
              ...(prev[FIELD_RANGE_OVERLAY] || {}),
              selected: false
            }
          }));
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
      if (currentSchemaId) {
        updateSchemaState(currentSchemaId, {
          attributes: attributeRowData,
          attributesList: validationResult,
          attributesWithLists: newAttributesWithLists
        });
      }
      
      if (newAttributesWithLists.length > 0) {
        entryCodesRef.current = true;
        // Entry Codes step already inserted centrally
      } else {
        removeStep("Entry Codes");
      }

      // Persist attributes and list to MultiSchemaContext in one place to avoid flicker
      if (currentSchemaId) {
        updateSchemaState(currentSchemaId, {
          attributes: attributeRowData,
          attributesList: validationResult,
          attributesWithLists: newAttributesWithLists
        });
      }
      navigationSafe.current = true;
    }
  };

  // Expose save to parent (Home) so stepper click can persist before navigation
  useImperativeHandle(ref, () => ({
    save: handleSave
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
