/**
 * Overlay utilities
 * - Selection state helpers
 * - Data clearing utilities
 */

import { useContext, useCallback } from "react";
import {
  FIELD_CHARACTER_ENCODING_OVERLAY,
  FIELD_FORMAT_OVERLAY,
  FIELD_FORM_INFORMATION_OVERLAY,
  FIELD_RANGE_OVERLAY,
  FIELD_CARDINALITY_OVERLAY,
  FIELD_UNIT_FRAMING_OVERLAY,
  FIELD_CONFORMANCE_OVERLAY,
  FIELD_DATA_STANDARDS_OVERLAY,
  FIELD_ATTRIBUTE_FRAMING_OVERLAY,
  FIELD_DATA_SEPARATOR_OVERLAY,
  FIELD_EXAMPLE_OVERLAY
} from "../constants/constants";
import { useMultiSchema } from "../schema/schemaContext";
import { Context } from "../App";

/**
 * Get the reset values for an overlay
 * @param {string} overlayType - The overlay type constant
 * @returns {Object} Object with reset values for updateCurrentSchema
 */
export const resetOverlayValues = (overlayType) => {
  // Overlay data field configuration
  const overlayConfig = {
    [FIELD_CHARACTER_ENCODING_OVERLAY]: { characterEncodingData: {} },
    [FIELD_FORMAT_OVERLAY]: {
      attributeFormats: {},
      attributeRanges: {},
      formatRuleData: [],
      rangeData: []
    },
    [FIELD_FORM_INFORMATION_OVERLAY]: { FormInformationRowData: [] },
    [FIELD_RANGE_OVERLAY]: { attributeRanges: {}, rangeData: [] },
    [FIELD_CARDINALITY_OVERLAY]: { attributeCardinality: {}, cardinalityData: undefined }, // undefined = uninitialized state
    [FIELD_UNIT_FRAMING_OVERLAY]: {
      unitFramedData: undefined,
      frameAllUnits: false,
      unframedUnitList: []
    },
    [FIELD_CONFORMANCE_OVERLAY]: {
      requiredEntries: undefined,
      conformanceRowData: [],
      // Special case: also clear Required flags from attributes
      _requiresAttributeUpdate: true
    },
    [FIELD_DATA_STANDARDS_OVERLAY]: { dataStandardsData: [] },
    [FIELD_ATTRIBUTE_FRAMING_OVERLAY]: {
      attributeFramingSources: []
    },
    [FIELD_DATA_SEPARATOR_OVERLAY]: {
      decimalSeparator: ".",
      fileDelimiterData: {
        fieldDelimiter: ",",
        // eslint-disable-next-line quotes -- Prettier formats a double-quote char as single-quoted
        quoteChar: '"',
        escapeChar: "\\",
        lineTerminator: "lf",
        dataStartRow: 1
      },
      arrayDelimiterData: {},
      enableDecimalSeparator: false,
      enableFileDelimiter: false,
      enableArrayDelimiter: false
    },
    [FIELD_EXAMPLE_OVERLAY]: { exampleData: {} }
  };

  const clearData = overlayConfig[overlayType];
  if (!clearData) {
    console.warn(`Unknown overlay type: ${overlayType}`);
    return {};
  }

  return clearData;
};

/**
 * Creates a complete overlay deletion handler
 * @param {string} overlayType - The overlay type constant
 * @returns {Function} Complete deletion handler that clears data and navigates to Overlays
 */
/**
 * Core deletion logic extracted for reuse
 * @param {string} overlayType - The overlay type constant
 * @param {Object} context - Required context methods
 */
export const deleteOverlayData = (
  overlayType,
  { updateSchema, updateOverlaySelection, getSchema }
) => {
  // Clear the overlay data
  const resetValues = resetOverlayValues(overlayType);

  // Handle special case for conformance overlay (Required Entries)
  if (overlayType === FIELD_CONFORMANCE_OVERLAY) {
    const schemaState = getSchema();

    // Clear Required flags from all attributes
    const updatedAttributes =
      schemaState?.attributes?.map((attr) => ({
        ...attr,
        Required: false
      })) || [];

    updateSchema({
      ...resetValues,
      attributes: updatedAttributes
    });
  } else if (Object.keys(resetValues).length > 0) {
    updateSchema(resetValues);
  }

  // Update selection state to deselected
  updateOverlaySelection(overlayType, false);

  // Special case: Format overlay also affects range overlay
  if (overlayType === FIELD_FORMAT_OVERLAY) {
    updateOverlaySelection(FIELD_RANGE_OVERLAY, false);
  }
};

/**
 * Hook for overlay deletion with optional navigation
 * @param {string} overlayType - The overlay type constant
 * @param {boolean} shouldNavigate - Whether to navigate back to Overlays page (default: true)
 * @returns {Function} Delete handler function
 */
export const useDeleteOverlayHandler = (overlayType, shouldNavigate = true) => {
  const { updateSchema, updateOverlaySelection, getSchema } = useMultiSchema();
  const { setCurrentPage } = useContext(Context);

  return useCallback(() => {
    // Execute core deletion logic
    deleteOverlayData(overlayType, { updateSchema, updateOverlaySelection, getSchema });

    // Navigate back to overlays page if requested
    if (shouldNavigate) {
      setCurrentPage("Overlays");
    }
  }, [
    overlayType,
    shouldNavigate,
    updateSchema,
    updateOverlaySelection,
    getSchema,
    setCurrentPage
  ]);
};

/**
 * Get lists of selected and unselected overlay keys
 * @param {Object} overlay - Overlay selection state object
 * @returns {Object} { selectedKeys: string[], unselectedKeys: string[] }
 */
export const getListOfSelectedOverlays = (overlay) => {
  const selectedKeys = [];
  const unselectedKeys = [];
  // Temporarily excluding these features
  const keysToExclude = [FIELD_DATA_STANDARDS_OVERLAY];

  Object.entries(overlay).forEach(([key, value]) => {
    if (keysToExclude.includes(key)) return;

    if (value) {
      selectedKeys.push(key);
    } else {
      unselectedKeys.push(key);
    }
  });

  return { selectedKeys, unselectedKeys };
};
