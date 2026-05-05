import React, { useState, useContext } from "react";

import { Box, Button, TextField } from "@mui/material";
import RemoveCircleIcon from "@mui/icons-material/RemoveCircle";
import AddCircleIcon from "@mui/icons-material/AddCircle";
import AddIcon from "@mui/icons-material/Add";
import { useTranslation } from "react-i18next";
import { Context } from "../App";
import { removeSpacesFromString } from "../constants/removeSpaces";
import { CustomPalette } from "../constants/customPalette";

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
  typesObjectRef
}) {
  const { t } = useTranslation();
  const { setAttributesList, setAttributeRowData } = useContext(Context);
  const [newAttribute, setNewAttribute] = useState("");

  const handleLanguageField = (e) => {
    e.preventDefault();
    setNewAttribute(e.target.value);
  };

  const handleAddRow = () => {
    gridRef.current.api.stopEditing();
    const newAttributeRowData = JSON.parse(JSON.stringify(gridRef.current.props.rowData));

    newAttributeRowData.forEach((item) => {
      item.Type = typesObjectRef.current[item.Attribute] || "";
    });
    let attributeToAdd = removeSpacesFromString(newAttribute);
    const newAttributesList = []; // Data won't be handled properly if there are blank or duplicate attributes in the grid
    // Errors stop user from proceeding if there are entries that will cause issues

    let blanks = false;
    gridRef.current.props.rowData.forEach((row) => {
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
        setErrorMessage(t("All attribute names must be unique before proceeding"));
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
        setErrorMessage(t("All attribute names must be unique before proceeding"));
        setTimeout(() => {
          setErrorMessage("");
        }, [2000]);
        return;
      }
      setAttributesList([...newAttributesList, attributeToAdd]);
      setShowAddAttribute(false);
      setAttributeRowData([
        ...newAttributeRowData,
        {
          Attribute: attributeToAdd,
          Flagged: false,
          List: false,
          Type: "",
          Unit: ""
        }
      ]);
      setCanDelete(true);
      setNewAttribute("");
    } else if (blanks) {
      setErrorMessage(
        t("Attribute names cannot be blank. Please fill out all names before continuing")
      );
      setTimeout(() => {
        setErrorMessage("");
      }, [2000]);
    } else {
      setErrorMessage(t("Please enter a unique attribute name"));
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
            top: -20,
            display: "flex",
            left: "10%",
            width: "100%"
          }}
        >
          <TextField
            id="customLanguageField"
            type="text"
            onChange={handleLanguageField}
            placeholder={t("New Attribute")}
            size="small"
            variant="standard"
            inputProps={{
              style: {
                color: CustomPalette.PRIMARY,
                fontWeight: "bold",
                paddingLeft: "0.8rem"
              }
            }}
            sx={{
              width: "9rem",
              "& .MuiInput-underline:before": {
                borderBottomColor: CustomPalette.GREY_300
              },
              "& .MuiInput-underline:after": {
                borderBottomColor: CustomPalette.PRIMARY
              }
            }}
          />
          <Button onClick={handleAddRow} ref={addButton2}>
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
      )}
      <Button
        color="button"
        variant="contained"
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignSelf: "flex-end",
          m: 2
        }}
        onClick={handleToggle}
        ref={addButton1}
      >
        {t("Add Attribute")} &nbsp;
        {showAddAttribute === true ? <RemoveCircleIcon /> : <AddCircleIcon />}
      </Button>
    </Box>
  );
}
