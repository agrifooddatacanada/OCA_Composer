import React, { useState, useEffect } from "react";

import { Alert, Box, Button, TextField } from "@mui/material";
import RemoveCircleIcon from "@mui/icons-material/RemoveCircle";
import AddCircleIcon from "@mui/icons-material/AddCircle";
import AddIcon from "@mui/icons-material/Add";
import { useTranslation } from "react-i18next";
import { useMultiSchema } from "../schema/schemaContext";
import { removeSpacesFromString } from "../utils/stringUtils";
import { CustomPalette } from "../constants/customPalette";
import { hasDisallowedChars } from "../utils/helpers";

export default function AddAttribute({
  addButton1,
  addButton2,
  gridRef,
  setErrorMessage,
  setCanDelete,
  showAddAttribute,
  setShowAddAttribute,
  addByTab,
  setAddByTab,
  typesObjectRef,
  attributeRowData,
  setAttributeRowData,
  errorMessage,
  triggerInvalidCharModal
}) {
  const { t, i18n } = useTranslation();
  const { updateSchema } = useMultiSchema();

  // Note: attributesList is now computed - no need to update it separately
  const [newAttribute, setNewAttribute] = useState("");
  const [textFieldWidth, setTextFieldWidth] = useState("10.75rem");
  const [popupReady, setPopupReady] = useState(false);
  useEffect(() => {
    if (!showAddAttribute || !addButton1?.current) {
      setPopupReady(false);
      return;
    }
    const el = addButton1.current;
    const measure = () => {
      setTextFieldWidth(`${el.offsetWidth}px`);
      setPopupReady(true);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => {
      ro.disconnect();
      setPopupReady(false);
    };
  }, [showAddAttribute, addButton1, i18n.language]);

  const handleLanguageField = (e) => {
    e.preventDefault();
    const newValue = e.target.value;
    if (hasDisallowedChars(newValue)) {
      if (triggerInvalidCharModal) triggerInvalidCharModal();
      return;
    }
    setNewAttribute(newValue);
  };

  const handleAddRow = () => {
    gridRef.current.api.stopEditing();

    // Use context data instead of trying to get it from the grid
    const currentRowData = attributeRowData || [];
    const newAttributeRowData = JSON.parse(JSON.stringify(currentRowData));

    newAttributeRowData.forEach((item) => {
      item.Type = typesObjectRef.current[item.Attribute] || "";
    });
    let attributeToAdd = removeSpacesFromString(newAttribute);
    const newAttributesList = []; // Data won't be handled properly if there are blank or duplicate attributes in the grid
    // Errors stop user from proceeding if there are entries that will cause issues

    let blanks = false;
    currentRowData.forEach((row) => {
      const attributeValue = removeSpacesFromString(row.Attribute);
      if (attributeValue) {
        newAttributesList.push(attributeValue);
      } else {
        blanks = true;
        newAttributesList.push(attributeValue);
      }
    });
    const attributeListCopy = [...newAttributesList];

    const duplicates = [];
    const attributesChecked = [];
    attributeListCopy.forEach((item) => {
      if (attributesChecked.includes(item)) {
        duplicates.push(item);
      }
      attributesChecked.push(item);
    }); // When added by tab, the new attribute can be "" - this is the only case where a blank Attribute doesn't raise an error
    // Attribute names can be blank until a function happens that reloads the grid (adding/deleting/navigating)

    if (addByTab) {
      attributeToAdd = "";
      if (duplicates.length > 0) {
        setErrorMessage(t("All attribute names must be unique before proceeding."));
        setTimeout(() => {
          setErrorMessage("");
        }, [2000]);
        return;
      }
    }
    const isNew =
      (!attributeListCopy.includes(attributeToAdd) && attributeToAdd && !blanks) ||
      (addByTab && !blanks);
    if (isNew) {
      if (duplicates.length > 0) {
        setErrorMessage(t("All attribute names must be unique before proceeding."));
        setTimeout(() => {
          setErrorMessage("");
        }, [2000]);
        return;
      }
      // attributesList is now computed from attributes - no need to set separately
      setShowAddAttribute(false);
      const newAttributeObj = {
        Attribute: attributeToAdd,
        Type: "",
        Description: "",
        Required: false,
        EntryCodes: [],
        List: false,
        Sensitive: false,
        Unit: ""
      };
      const updatedAttributeRowData = [...newAttributeRowData, newAttributeObj];
      setAttributeRowData(updatedAttributeRowData);

      // Also save to MultiSchemaContext to prevent data loss when List is toggled
      // MultiSchemaContext handles null schemaId internally
      // Preserve any existing _rid values when saving to schema state
      const attributesWithIds = updatedAttributeRowData.map((attr) => {
        const existingAttr = attributeRowData.find(
          (existing) => existing.Attribute === attr.Attribute
        );
        return existingAttr?._rid ? { ...attr, _rid: existingAttr._rid } : attr;
      });

      // Update only attributes - attributesList is computed automatically
      updateSchema({
        attributes: attributesWithIds
      });

      setCanDelete(true);
      setNewAttribute("");
    } else if (!attributeToAdd) {
      setErrorMessage(t("Please enter a name."));
      setTimeout(() => {
        setErrorMessage("");
      }, [2000]);
    } else if (blanks) {
      setErrorMessage(
        t("Attribute names cannot be blank. Please fill out all names before continuing.")
      );
      setTimeout(() => {
        setErrorMessage("");
      }, [2000]);
    } else {
      setErrorMessage(t("Please enter a unique name."));
      setTimeout(() => {
        setErrorMessage("");
      }, [2000]);
    }
    setAddByTab(false);
  };

  const handleToggle = () => {
    setShowAddAttribute(!showAddAttribute);
    gridRef.current.api.stopEditing();
  };

  return (
    <Box sx={{ position: "relative", alignSelf: "flex-end" }}>
      {showAddAttribute === true && (
        <Box
          sx={{
            position: "absolute",
            zIndex: "1000",
            top: "100%",
            mt: -1,
            left: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
            visibility: popupReady ? "visible" : "hidden"
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, minHeight: 48 }}>
            <Box sx={{ display: "flex", alignItems: "center", flexShrink: 0 }}>
              <TextField
                id="customLanguageField"
                type="text"
                onChange={handleLanguageField}
                value={newAttribute}
                placeholder={t("New Attribute")}
                size="small"
                variant="standard"
                autoComplete="off"
                inputProps={{
                  style: {
                    color: CustomPalette.PRIMARY,
                    fontWeight: "bold",
                    paddingLeft: "0.8rem"
                  }
                }}
                sx={{
                  width: textFieldWidth,
                  "& .MuiInput-underline:before": {
                    borderBottomColor: CustomPalette.GREY_300
                  },
                  "& .MuiInput-underline:after": {
                    borderBottomColor: CustomPalette.PRIMARY
                  }
                }}
              />
              <Button
                onClick={handleAddRow}
                ref={addButton2}
                sx={{ ml: -0.1, minWidth: 0, px: 0.5 }}
              >
                <AddIcon
                  sx={{
                    color: CustomPalette.SECONDARY,
                    "&:hover": {
                      color: CustomPalette.PRIMARY,
                      transform: "scale(1.1)"
                    }
                  }}
                />
              </Button>
            </Box>
            {errorMessage && (
              <Alert
                severity="error"
                sx={{
                  m: 0,
                  flexShrink: 0,
                  "& .MuiAlert-message": { whiteSpace: "nowrap" }
                }}
              >
                {errorMessage}
              </Alert>
            )}
          </Box>
        </Box>
      )}
      <Box sx={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
        <Button
          color="button"
          variant="contained"
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignSelf: "flex-end",
            m: 0,
            mb: 2
          }}
          onClick={handleToggle}
          ref={addButton1}
        >
          {t("Add Attribute")} &nbsp;
          {showAddAttribute === true ? <RemoveCircleIcon /> : <AddCircleIcon />}
        </Button>
        {!showAddAttribute && errorMessage && (
          <Alert severity="error" sx={{ mb: 2, width: "100%" }}>
            {errorMessage}
          </Alert>
        )}
      </Box>
    </Box>
  );
}
