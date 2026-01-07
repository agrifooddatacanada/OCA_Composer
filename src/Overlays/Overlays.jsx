import React, { useContext, useState } from "react";
import { useTranslation } from "react-i18next";
import AddCircleIcon from "@mui/icons-material/AddCircle";
import DeleteForeverIcon from "@mui/icons-material/DeleteForever";
import { Box, Button, List, ListItemButton, ListItemText, Tooltip } from "@mui/material";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import { CustomPalette } from "../constants/customPalette";
import { Context } from "../App";
import { useMultiSchema } from "../context/MultiSchemaContext";
import { getListOfSelectedOverlays } from "../utils/overlayUtils";
import BackNextSkeleton from "../components/BackNextSkeleton";
import DeleteConfirmation from "./DeleteConfirmation";
import { shouldDisableRangeOverlay, getRangeOverlayDisabledReason, shouldDisableFormInformationOverlay, getFormInformationDisabledReason } from "../utils/helpers";
import { FIELD_FORMAT_OVERLAY, FIELD_RANGE_OVERLAY, FIELD_FORM_INFORMATION_OVERLAY } from "../constants/constants";
import { deleteOverlayData } from "../utils/overlayUtils";

const Overlays = ({ pageBack, pageForward }) => {
  const { t } = useTranslation();
  
  // Global context (for non-schema-specific data)
  const {
    setCurrentPage
  } = useContext(Context);

  // Schema-specific overlay state from MultiSchemaContext
  const {
    currentSchemaId,
    getOverlaySelections,
    updateOverlaySelection,
    updateSchemaState,
    setSelectedOverlay,
    getSelectedOverlay,
    getSchemaState
  } = useMultiSchema();
  
  // Get schema-specific data from MultiSchemaContext
  const schemaState = getSchemaState(currentSchemaId);
  const rangeRowData = schemaState?.rangeData || [];
  const attributeRowData = schemaState?.attributes || [];

  const overlay = getOverlaySelections(currentSchemaId);
  const selectedOverlay = getSelectedOverlay(currentSchemaId);
  
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [selectedItemToDelete, setSelectedItemToDelete] = useState("");

  // Convert overlay into a list of features
  const { selectedFeatures, unselectedFeatures } = getListOfSelectedOverlays(overlay);

  const getDisabledReason = (featureName) => {
    return (
      getFormInformationDisabledReason(featureName, selectedFeatures) ||
      getRangeOverlayDisabledReason(
        featureName,
        selectedFeatures,
        attributeRowData,
        rangeRowData
      ) ||
      ""
    );
  };

  const addToSelected = (item) => {
    // Range overlay can be selected only if format overlay is selected
    if (shouldDisableRangeOverlay(item, selectedFeatures, attributeRowData, rangeRowData))
      return;

    // Form Information overlay can be selected only if format overlay is selected
    if (shouldDisableFormInformationOverlay(item, selectedFeatures)) return;

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
    } else if (item === "Add Form Information") {
      setCurrentPage("FormInformation");
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
    // Use centralized deletion logic (no navigation since we're already on Overlays page)
    deleteOverlayData(selectedItemToDelete, { 
      updateSchemaState, 
      updateOverlaySelection, 
      currentSchemaId, 
      getSchemaState 
    });
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
    } else if (overlayName === "Add Form Information") {
      setCurrentPage("FormInformation");
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
                .map((text) => {
                const isDisabled =
                  shouldDisableRangeOverlay(
                    text,
                    selectedFeatures,
                    attributeRowData,
                    rangeRowData
                  ) || shouldDisableFormInformationOverlay(text, selectedFeatures);
                const disabledReason = isDisabled ? getDisabledReason(text) : "";
                
                return (
                  <Tooltip key={text} title={isDisabled ? disabledReason : ""} placement="right" arrow>
                    <span>
                      <ListItemButton
                        onClick={() => addToSelected(text)}
                        disabled={isDisabled}
                      >
                        <AddCircleIcon sx={{ color: CustomPalette.PRIMARY}} />
                        <ListItemText primary={t(text)} sx={{ marginLeft: 2 }} />
                        {isDisabled && (
                          <HelpOutlineIcon sx={{ fontSize: 18, marginLeft: "6px", color: "#6b7280" }} />
                        )}
                      </ListItemButton>
                    </span>
                  </Tooltip>
                );
              })}
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
