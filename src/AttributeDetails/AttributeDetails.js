import React, { useRef, useContext, useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Alert, Box, Typography } from "@mui/material";
import Grid from "./Grid";
import AddAttribute from "./AddAttribute";
import { Context } from "../App";
import {
  removeSpacesFromString,
  removeSpacesFromArrayOfObjects
} from "../constants/removeSpaces";
import BackNextSkeleton from "../components/BackNextSkeleton";
import Loading from "../components/Loading";
import { hasDisallowedChars } from "../constants/utils";
import { FIELD_RANGE_OVERLAY } from "../constants/constants";
import ErrorPopup from "../ViewSchema/ErrorPopup";

export default function AttributeDetails({
  pageBack,
  pageForward,
  insertStep,
  removeStep
}) {
  const { t } = useTranslation();
  const {
    setAttributesWithLists,
    setCurrentPage,
    attributeRowData,
    setAttributesList,
    setAttributeRowData,
    overlay,
    setOverlay
  } = useContext(Context);
  const [errorMessage, setErrorMessage] = useState("");
  const [canDelete, setCanDelete] = useState(attributeRowData.length !== 1);
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

  useEffect(() => {
    const newTypesObjetRef = {};
    attributeRowData.forEach((item) => {
      newTypesObjetRef[item.Attribute] = item.Type;
    });
    typesObjectRef.current = newTypesObjetRef;
  }, [attributeRowData]);

  // Stops grid editing when clicking outside grid
  useEffect(() => {
    const handleClickOutsideGrid = (event) => {
      if (
        gridRef.current.api &&
        refContainer.current &&
        !refContainer.current.contains(event.target)
      ) {
        gridRef.current.api.stopEditing();
      }
    };

    document.addEventListener("click", handleClickOutsideGrid);

    return () => {
      document.removeEventListener("click", handleClickOutsideGrid);
    };
  }, [gridRef, refContainer]);

  const handleSave = () => {
    entryCodesRef.current = false;
    navigationSafe.current = false;
    typeBlanksRef.current = false;
    gridRef.current.api.stopEditing();

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

        // REVISIT
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

      if (overlay[FIELD_RANGE_OVERLAY].selected) {
        const hasValidAttribute = noSpacesArray.some(
          (attribute) => attribute.Type === "Numeric" || attribute.Type === "DateTime"
        );

        if (!hasValidAttribute) {
          setOverlay((prev) => ({
            ...prev,
            [FIELD_RANGE_OVERLAY]: { ...prev[FIELD_RANGE_OVERLAY], selected: false }
          }));
        }
      }

      return allAttributes;
    };

    // validateForward either returns an error message (string) or it removes blanks from (and sets) Attribute Row Data and returns the current array of attributes
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

      setAttributesWithLists(newAttributesWithLists);
      if (newAttributesWithLists.length > 0) {
        entryCodesRef.current = true;
        insertStep(2, { label: "Entry Codes", page: "Codes" });
      } else {
        removeStep("Entry Codes");
      }
      navigationSafe.current = true;
    }
  };

  const pageForwardSave = () => {
    handleSave();
    if (navigationSafe.current === true) {
      if (typeBlanksRef.current === true) {
        setShowCard(true);
      } else if (entryCodesRef.current) {
        setCurrentPage("Codes");
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
      {loading && attributeRowData?.length > 40 && <Loading />}
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
        />
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
      />
    </BackNextSkeleton>
  );
}
