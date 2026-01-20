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
import {
  FIELD_CHARACTER_ENCODING_OVERLAY,
  FIELD_CONFORMANCE_OVERLAY,
  FIELD_CARDINALITY_OVERLAY,
  FIELD_FORM_INFORMATION_OVERLAY,
  FIELD_UNIT_FRAMING_OVERLAY,
  FIELD_DATA_STANDARDS_OVERLAY,
  FIELD_RANGE_OVERLAY,
  FIELD_ATTRIBUTE_FRAMING_OVERLAY,
  FIELD_FORMAT_OVERLAY
} from "../constants/constants";
import { deleteOverlayData } from "../utils/overlayUtils";

// Centralized overlay key to page mapping
// Uses constant keys (FIELD_*_OVERLAY) instead of display strings
const OVERLAY_TO_PAGE = {
  [FIELD_CHARACTER_ENCODING_OVERLAY]: "CharacterEncoding",
  [FIELD_CONFORMANCE_OVERLAY]: "RequiredEntries",
  [FIELD_CARDINALITY_OVERLAY]: "Cardinality",
  [FIELD_FORM_INFORMATION_OVERLAY]: "FormInformation",
  [FIELD_UNIT_FRAMING_OVERLAY]: "UnitFraming",
  [FIELD_DATA_STANDARDS_OVERLAY]: "DataStandards",
  [FIELD_RANGE_OVERLAY]: "Range",
  [FIELD_ATTRIBUTE_FRAMING_OVERLAY]: "AttributeFraming",
  [FIELD_FORMAT_OVERLAY]: "FormatRules"
};

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
    getSchemaState,
    getRangeData,
    getAttributesList,
    getFormatRuleData
  } = useMultiSchema();
  
  // Get schema-specific data from MultiSchemaContext using getter functions
  const schemaState = getSchemaState(currentSchemaId);
  const rangeRowData = getRangeData();
  const attributeRowData = schemaState?.attributes || []; // Full attribute objects with Type field
  const formatRuleData = getFormatRuleData();

  const overlay = getOverlaySelections(currentSchemaId);
  const selectedOverlay = getSelectedOverlay(currentSchemaId);
  
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [selectedItemToDelete, setSelectedItemToDelete] = useState("");

  // Convert overlay into a list of keys (constant identifiers)
  const { selectedKeys, unselectedKeys } = getListOfSelectedOverlays(overlay);

  const getDisabledReason = (overlayKey) => {
    return (
      getFormInformationDisabledReason(overlayKey, selectedKeys) ||
      getRangeOverlayDisabledReason(
        overlayKey,
        selectedKeys,
        attributeRowData,
        rangeRowData,
        formatRuleData
      ) ||
      ""
    );
  };

  const addToSelected = (overlayKey) => {
    // Range overlay can be selected only if format overlay is selected
    if (shouldDisableRangeOverlay(overlayKey, selectedKeys, attributeRowData, rangeRowData, formatRuleData))
      return;

    // Form Information overlay can be selected only if format overlay is selected
    if (shouldDisableFormInformationOverlay(overlayKey, selectedKeys)) return;

    // Get current overlay selections
    const currentSelections = getOverlaySelections(currentSchemaId);
    const updatedSelections = {
      ...currentSelections,
      [overlayKey]: {
        ...currentSelections[overlayKey],
        selected: true
      }
    };
    
    // Combine both updates into a single updateSchemaState call to avoid race condition
    updateSchemaState(currentSchemaId, {
      overlaySelections: updatedSelections,
      selectedOverlay: overlayKey
    });
    
    // Route to the appropriate page using centralized mapping
    const page = OVERLAY_TO_PAGE[overlayKey] || "FormatRules"; // Default to FormatRules
    setCurrentPage(page);
  };

  const removeFromSelected = () => {
    // selectedItemToDelete is already a constant key (from selectedKeys array)
    deleteOverlayData(selectedItemToDelete, { 
      updateSchemaState, 
      updateOverlaySelection, 
      currentSchemaId, 
      getSchemaState 
    });
    setShowDeleteConfirmation(false);
  };

  const handleEditOverlay = (overlayKey) => {
    setSelectedOverlay(currentSchemaId, overlayKey);
    
    // Route to the appropriate page using centralized mapping
    const page = OVERLAY_TO_PAGE[overlayKey] || "FormatRules"; // Default to FormatRules
    setCurrentPage(page);
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
              {unselectedKeys
                .filter((overlayKey) => overlayKey && overlayKey.trim() !== "") // Filter out empty/null keys
                .map((overlayKey) => {
                const displayName = overlay[overlayKey]?.feature || overlayKey;
                const isDisabled =
                  shouldDisableRangeOverlay(
                    overlayKey,
                    selectedKeys,
                    attributeRowData,
                    rangeRowData,
                    formatRuleData
                  ) || shouldDisableFormInformationOverlay(overlayKey, selectedKeys);
                const disabledReason = isDisabled ? getDisabledReason(overlayKey) : "";
                
                return (
                  <Tooltip key={overlayKey} title={isDisabled ? disabledReason : ""} placement="right" arrow>
                    <span>
                      <ListItemButton
                        onClick={() => addToSelected(overlayKey)}
                        disabled={isDisabled}
                      >
                        <AddCircleIcon sx={{ color: CustomPalette.PRIMARY}} />
                        <ListItemText primary={t(displayName)} sx={{ marginLeft: 2 }} />
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
              {selectedKeys.map((overlayKey) => {
                const displayName = overlay[overlayKey]?.feature || overlayKey;
                return (
                  <Box
                    key={overlayKey}
                    sx={{
                      display: "flex",
                      flexDirection: "row",
                      alignItems: "center"
                    }}
                  >
                    <ListItemText
                      primary={t(displayName)}
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
                        setSelectedItemToDelete(overlayKey);
                        setShowDeleteConfirmation(true);
                      }}
                    />
                    <Button
                      sx={{ color: CustomPalette.PRIMARY }}
                      onClick={() => handleEditOverlay(overlayKey)}
                    >
                      {t("Edit")}
                    </Button>
                  </Box>
                );
              })}
            </List>
          </Box>
        </Box>
      </Box>
    </BackNextSkeleton>
  );
};

export default Overlays;
