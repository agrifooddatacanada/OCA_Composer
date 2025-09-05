import React, { useContext, useState } from "react";
import { useTranslation } from "react-i18next";
import AddCircleIcon from "@mui/icons-material/AddCircle";
import DeleteForeverIcon from "@mui/icons-material/DeleteForever";
import { Box, Button, List, ListItemButton, ListItemText } from "@mui/material";
import CustomPalette from "../constants/customPalette";
import { Context } from "../App";
import { useMultiSchema } from "../context/MultiSchemaContext";
import getListOfSelectedOverlays from "../constants/getListOfSelectedOverlays";
import BackNextSkeleton from "../components/BackNextSkeleton";
import DeleteConfirmation from "./DeleteConfirmation";
import { shouldDisableRangeOverlay } from "../constants/utils";
import { FIELD_FORMAT_OVERLAY, FIELD_RANGE_OVERLAY } from "../constants/constants";

const Overlays = ({ pageBack, pageForward }) => {
  const { t } = useTranslation();
  
  // Global context (for non-schema-specific data)
  const {
    setCurrentPage,
    characterEncodingRowData,
    setCharacterEncodingRowData,
    rangeRowData,
    attributeRowData
  } = useContext(Context);

  // Schema-specific overlay state from MultiSchemaContext
  const {
    activeSchemaId,
    editingSchemaId,
    getOverlaySelections,
    updateOverlaySelection,
    updateSchemaState,
    setSelectedOverlay,
    getSelectedOverlay
  } = useMultiSchema();

  const currentSchemaId = activeSchemaId || editingSchemaId;
  const overlay = getOverlaySelections(currentSchemaId);
  const selectedOverlay = getSelectedOverlay(currentSchemaId);
  
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [selectedItemToDelete, setSelectedItemToDelete] = useState("");

  // Convert overlay into a list of features
  const { selectedFeatures, unselectedFeatures } = getListOfSelectedOverlays(overlay);

  const addToSelected = (item) => {
    // Range overlay can be selected only if format overlay is selected
    if (shouldDisableRangeOverlay(item, selectedFeatures, attributeRowData, rangeRowData))
      return;

    // Get current overlay selections
    const currentSelections = getOverlaySelections(currentSchemaId);
    const updatedSelections = {
      ...currentSelections,
      [item]: {
        ...currentSelections[item],
        selected: true
      }
    };
    
    // Combine both updates into a single updateSchemaState call to avoid race condition
    updateSchemaState(currentSchemaId, {
      overlaySelections: updatedSelections,
      selectedOverlay: item
    });
    
    if (item === "Character Encoding") {
      setCurrentPage("CharacterEncoding");
    } else if (item === "Make selected entries required") {
      setCurrentPage("RequiredEntries");
    } else if (item === "Cardinality") {
      setCurrentPage("Cardinality");
    } else if (item === "Unit Framing") {
      setCurrentPage("UnitFraming");
    } else if (item === "Data Standards") {
      setCurrentPage("DataStandards");
    } else if (item === "Add range rule for data") {
      setCurrentPage("Range");
    } else if (item === "Attribute Framing") {
      setCurrentPage("AttributeFraming");
    } else {
      setCurrentPage("FormatRules");
    }
  };

  const removeFromSelected = () => {
    // Get current overlay selections
    const currentSelections = getOverlaySelections(currentSchemaId);
    const updatedSelections = {
      ...currentSelections,
      [selectedItemToDelete]: {
        ...currentSelections[selectedItemToDelete],
        selected: false
      }
    };

    // Also remove range overlay if format overlay is being removed
    if (selectedItemToDelete === FIELD_FORMAT_OVERLAY) {
      updatedSelections[FIELD_RANGE_OVERLAY] = {
        ...currentSelections[FIELD_RANGE_OVERLAY],
        selected: false
      };
    }

    // Update overlay selections in a single call to avoid race condition
    updateSchemaState(currentSchemaId, {
      overlaySelections: updatedSelections
    });

    // Delete attribute from characterEncodingRowData
    const newCharacterEncodingRowData = characterEncodingRowData.map((row) => {
      delete row[selectedItemToDelete];
      return row;
    });
    setCharacterEncodingRowData(newCharacterEncodingRowData);
    setShowDeleteConfirmation(false);
  };

  const handleEditOverlay = (overlayName) => {
    setSelectedOverlay(currentSchemaId, overlayName);
    if (overlayName === "Character Encoding") {
      setCurrentPage("CharacterEncoding");
    } else if (overlayName === "Make selected entries required") {
      setCurrentPage("RequiredEntries");
    } else if (overlayName === "Cardinality") {
      setCurrentPage("Cardinality");
    } else if (overlayName === "Data Standards") {
      setCurrentPage("DataStandards");
    } else if (overlayName === "Unit Framing") {
      setCurrentPage("UnitFraming");
    } else if (overlayName === "Add range rule for data") {
      setCurrentPage("Range");
    } else if (overlayName === "Attribute Framing") {
      setCurrentPage("AttributeFraming");
    } else {
      setCurrentPage("FormatRules");
    }
  };

  return (
    <BackNextSkeleton isBack pageBack={pageBack} isForward pageForward={pageForward}>
      {showDeleteConfirmation && (
        <DeleteConfirmation
          removeFromSelected={removeFromSelected}
          closeModal={() => setShowDeleteConfirmation(false)}
        />
      )}
      <Box
        sx={{
          margin: "2rem",
          gap: "3rem",
          display: "flex",
          flexDirection: "column"
        }}
      >
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
            gap: 1
          }}
        >
          {t("Add schema feature")}
          <Box
            sx={{
              width: "350px",
              height: "300px",
              border: "1px solid #ccc",
              borderRadius: "4px",
              overflow: "hidden"
            }}
          >
            <List
              sx={{
                height: "100%",
                overflowY: "auto",
                padding: 0,
                "&::-webkit-scrollbar": {
                  width: "8px"
                },
                "&::-webkit-scrollbar-track": {
                  backgroundColor: "#f1f1f1"
                },
                "&::-webkit-scrollbar-thumb": {
                  backgroundColor: "#c1c1c1",
                  borderRadius: "4px"
                },
                "&::-webkit-scrollbar-thumb:hover": {
                  backgroundColor: "#a8a8a8"
                }
              }}
            >
              {unselectedFeatures
                .filter((text) => text && text.trim() !== "") // Filter out empty/null features
                .map((text) => (
                <ListItemButton
                  key={text}
                  onClick={() => addToSelected(text)}
                  disabled={shouldDisableRangeOverlay(
                    text,
                    selectedFeatures,
                    attributeRowData,
                    rangeRowData
                  )}
                >
                  <AddCircleIcon sx={{ color: CustomPalette.PRIMARY }} />
                  <ListItemText primary={t(text)} sx={{ marginLeft: 2 }} />
                </ListItemButton>
              ))}
            </List>
          </Box>
        </Box>
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
            gap: 1
          }}
        >
          {t("Added schema feature")}
          <Box
            sx={{
              width: "350px",
              height: "300px",
              border: "1px solid #ccc",
              borderRadius: "4px",
              overflow: "hidden"
            }}
          >
            <List
              sx={{
                height: "100%",
                overflowY: "auto",
                padding: 0,
                "&::-webkit-scrollbar": {
                  width: "8px"
                },
                "&::-webkit-scrollbar-track": {
                  backgroundColor: "#f1f1f1"
                },
                "&::-webkit-scrollbar-thumb": {
                  backgroundColor: "#c1c1c1",
                  borderRadius: "4px"
                },
                "&::-webkit-scrollbar-thumb:hover": {
                  backgroundColor: "#a8a8a8"
                }
              }}
            >
              {selectedFeatures.map((text) => (
                <Box
                  key={text}
                  sx={{
                    display: "flex",
                    flexDirection: "row",
                    alignItems: "center"
                  }}
                >
                  <ListItemText
                    primary={t(text)}
                    sx={{
                      display: "flex",
                      paddingLeft: "1rem",
                      textAlign: "left",
                      width: "240px",
                      paddingRight: "1rem"
                    }}
                  />
                  <DeleteForeverIcon
                    sx={{ cursor: "pointer", color: CustomPalette.PRIMARY }}
                    onClick={() => {
                      setSelectedItemToDelete(text);
                      setShowDeleteConfirmation(true);
                    }}
                  />
                  <Button
                    sx={{ color: CustomPalette.PRIMARY }}
                    onClick={() => handleEditOverlay(text)}
                  >
                    {t("Edit")}
                  </Button>
                </Box>
              ))}
            </List>
          </Box>
        </Box>
      </Box>
    </BackNextSkeleton>
  );
};

export default Overlays;
