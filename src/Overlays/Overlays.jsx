import React, { useContext, useState } from "react";
import { useTranslation } from "react-i18next";
import AddCircleIcon from "@mui/icons-material/AddCircle";
import RemoveCircleIcon from "@mui/icons-material/RemoveCircle";
import { Box, Button, List, ListItemButton, ListItemText, Tooltip } from "@mui/material";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import { CustomPalette } from "../constants/customPalette";
import { Context } from "../App";
import { useMultiSchema } from "../schema/schemaContext";
import BackNextSkeleton from "../components/BackNextSkeleton";
import DeleteConfirmation from "./DeleteConfirmation";
import {
  isOverlayAddDisabled,
  getOverlayAddDisabledReason
} from "../utils/helpers";
import {
  BETWEEN_SECTION_SPACING,
  FIELD_CHARACTER_ENCODING_OVERLAY,
  FIELD_CONFORMANCE_OVERLAY,
  FIELD_CARDINALITY_OVERLAY,
  FIELD_FORM_INFORMATION_OVERLAY,
  FIELD_UNIT_FRAMING_OVERLAY,
  FIELD_DATA_STANDARDS_OVERLAY,
  FIELD_RANGE_OVERLAY,
  FIELD_ATTRIBUTE_FRAMING_OVERLAY,
  FIELD_FORMAT_OVERLAY,
  FIELD_DATA_SEPARATOR_OVERLAY,
  FIELD_EXAMPLE_OVERLAY
} from "../constants/constants";
import { deleteOverlayData, getListOfSelectedOverlays } from "../utils/overlayUtils";

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
  [FIELD_FORMAT_OVERLAY]: "FormatRules",
  [FIELD_DATA_SEPARATOR_OVERLAY]: "DataSeparator",
  [FIELD_EXAMPLE_OVERLAY]: "ExampleOverlay"
};

const Overlays = ({ pageBack, pageForward }) => {
  const { t } = useTranslation();
  
  // Global context (for non-schema-specific data)
  const {
    setCurrentPage
  } = useContext(Context);

  const {
    getOverlaySelections,
    updateOverlaySelection,
    updateSchema,
    setSelectedOverlay,
    getSchema,
    getRangeData,
    getFormatRuleData
  } = useMultiSchema();
  
  const schemaState = getSchema();
  const rangeRowData = getRangeData();
  const attributeRowData = schemaState?.attributes || []; // Full attribute objects with Type field
  const formatRuleData = getFormatRuleData();
  const overlay = getOverlaySelections();

  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [selectedItemToDelete, setSelectedItemToDelete] = useState("");

  // Convert overlay into a list of keys (constant identifiers)
  const { selectedKeys, unselectedKeys } = getListOfSelectedOverlays(overlay);

  const addToSelected = (overlayKey) => {
    if (isOverlayAddDisabled(overlayKey, selectedKeys, attributeRowData, rangeRowData, formatRuleData))
      return;

    // Get current overlay selections
    const currentSelections = getOverlaySelections();
    const updatedSelections = {
      ...currentSelections,
      [overlayKey]: true
    };
    
    // Combine both updates into a single updateSchema call to avoid race condition
    updateSchema({
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
      updateSchema, 
      updateOverlaySelection, 
      getSchema 
    });
    setShowDeleteConfirmation(false);
  };

  const handleEditOverlay = (overlayKey) => {
    setSelectedOverlay(overlayKey);
    
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
          marginBottom: BETWEEN_SECTION_SPACING,
          gap: "3rem",
          display: "flex",
          flexDirection: "row"
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
                .filter(
                  (overlayKey) =>
                    overlayKey &&
                    overlayKey.trim() !== "" &&
                    overlayKey !== FIELD_ATTRIBUTE_FRAMING_OVERLAY
                )
                .map((overlayKey) => {
                const displayName = overlayKey;
                const isDisabled = isOverlayAddDisabled(
                  overlayKey,
                  selectedKeys,
                  attributeRowData,
                  rangeRowData,
                  formatRuleData
                );
                const disabledReason = isDisabled
                  ? getOverlayAddDisabledReason(
                      overlayKey,
                      selectedKeys,
                      attributeRowData,
                      rangeRowData,
                      formatRuleData
                    )
                  : "";
                
                return (
                  <Tooltip key={overlayKey} title={isDisabled ? disabledReason : ""} placement="right" arrow>
                    <span>
                      <ListItemButton
                        onClick={() => addToSelected(overlayKey)}
                        disabled={isDisabled}
                      >
                        <AddCircleIcon sx={{ color: CustomPalette.PRIMARY }} />
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
                const displayName = overlayKey;
                return (
                  <ListItemButton
                    key={overlayKey}
                    onClick={() => handleEditOverlay(overlayKey)}
                    sx={{
                      display: "flex",
                      flexDirection: "row",
                      alignItems: "center",
                      paddingRight: 1
                    }}
                  >
                    <RemoveCircleIcon
                      sx={{ cursor: "pointer", color: CustomPalette.PRIMARY, marginRight: 2 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedItemToDelete(overlayKey);
                        setShowDeleteConfirmation(true);
                      }}
                    />
                    <ListItemText
                      primary={t(displayName)}
                      sx={{ marginLeft: 0, flex: 1, minWidth: 0 }}
                    />
                    <Button
                      sx={{ color: CustomPalette.PRIMARY, minWidth: "auto", padding: "2px 8px", marginLeft: 1, minHeight: 0, lineHeight: 1.5, marginTop: "0.5px" }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditOverlay(overlayKey);
                      }}
                    >
                      {t("Edit")}
                    </Button>
                  </ListItemButton>
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
