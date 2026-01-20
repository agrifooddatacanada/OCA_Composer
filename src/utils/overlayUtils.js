/**
 * Overlay utilities
 * - Selection state helpers
 * - Data clearing utilities
 */

import {
  FIELD_CHARACTER_ENCODING_OVERLAY,
  FIELD_FORMAT_OVERLAY,
  FIELD_FORM_INFORMATION_OVERLAY,
  FIELD_RANGE_OVERLAY,
  FIELD_CARDINALITY_OVERLAY,
  FIELD_UNIT_FRAMING_OVERLAY,
  FIELD_CONFORMANCE_OVERLAY,
  FIELD_DATA_STANDARDS_OVERLAY,
  FIELD_ATTRIBUTE_FRAMING_OVERLAY
} from '../constants/constants';
import { useMultiSchema } from '../context/MultiSchemaContext';
import { useContext, useCallback } from 'react';
import { Context } from '../App';

/**
 * Get the reset values for an overlay
 * @param {string} overlayType - The overlay type constant
 * @returns {Object} Object with reset values for updateCurrentSchema
 */
export const resetOverlayValues = (overlayType) => {
  // Overlay data field configuration
  const overlayConfig = {
    [FIELD_CHARACTER_ENCODING_OVERLAY]: { characterEncodingData: {} },
    [FIELD_FORMAT_OVERLAY]: { formatRuleData: [], rangeData: [] },
    [FIELD_FORM_INFORMATION_OVERLAY]: { FormInformationRowData: [] },
    [FIELD_RANGE_OVERLAY]: { rangeData: [] },
    [FIELD_CARDINALITY_OVERLAY]: { cardinalityData: undefined }, // undefined = uninitialized state
    [FIELD_UNIT_FRAMING_OVERLAY]: { unitFramedRowData: undefined, frameAllUnits: false, unframedUnitList: [] },
    [FIELD_CONFORMANCE_OVERLAY]: { 
      requiredEntries: undefined, 
      conformanceRowData: [],
      // Special case: also clear Required flags from attributes
      _requiresAttributeUpdate: true
    },
    [FIELD_DATA_STANDARDS_OVERLAY]: { dataStandardsData: [] },
    [FIELD_ATTRIBUTE_FRAMING_OVERLAY]: { attributeFramingData: [] }
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
export const deleteOverlayData = (overlayType, { updateSchemaState, updateOverlaySelection, currentSchemaId, getSchemaState }) => {
  // Clear the overlay data
  const resetValues = resetOverlayValues(overlayType);
  
  // Handle special case for conformance overlay (Required Entries)
  if (overlayType === FIELD_CONFORMANCE_OVERLAY) {
    const schemaState = getSchemaState(currentSchemaId);
    
    // Clear Required flags from all attributes
    const updatedAttributes = schemaState?.attributes?.map((attr) => ({
      ...attr,
      Required: false
    })) || [];
    
    updateSchemaState(currentSchemaId, {
      ...resetValues,
      attributes: updatedAttributes
    });
  } else if (Object.keys(resetValues).length > 0) {
    updateSchemaState(currentSchemaId, resetValues);
  }
  
  // Update selection state to deselected
  updateOverlaySelection(currentSchemaId, overlayType, { selected: false });
  
  // Special case: Format overlay also affects range overlay
  if (overlayType === FIELD_FORMAT_OVERLAY) {
    updateOverlaySelection(currentSchemaId, FIELD_RANGE_OVERLAY, { selected: false });
  }
};

/**
 * Hook for overlay deletion with optional navigation
 * @param {string} overlayType - The overlay type constant  
 * @param {boolean} shouldNavigate - Whether to navigate back to Overlays page (default: true)
 * @returns {Function} Delete handler function
 */
export const useDeleteOverlayHandler = (overlayType, shouldNavigate = true) => {
  const { updateSchemaState, updateOverlaySelection, currentSchemaId, getSchemaState } = useMultiSchema();
  const { setCurrentPage } = useContext(Context);
  
  return useCallback(() => {
    // Execute core deletion logic
    deleteOverlayData(overlayType, { updateSchemaState, updateOverlaySelection, currentSchemaId, getSchemaState });
    
    // Navigate back to overlays page if requested
    if (shouldNavigate) {
      setCurrentPage("Overlays");
    }
  }, [overlayType, shouldNavigate, updateSchemaState, updateOverlaySelection, currentSchemaId, getSchemaState, setCurrentPage]);
};

/**
 * Get lists of selected and unselected overlay features
 * @param {Object} overlay - Overlay selection state object
 * @returns {Object} { selectedFeatures: string[], unselectedFeatures: string[] }
 */
export const getListOfSelectedOverlays = (overlay) => {
  const selectedFeatures = [];
  const unselectedFeatures = [];
  // Temporarily excluding these features
  const featuresToExclude = ["Data Standards"];

  Object.values(overlay).forEach((item) => {
    if (featuresToExclude.includes(item.feature)) return;
    if (item.selected) {
      selectedFeatures.push(item.feature);
    } else {
      unselectedFeatures.push(item.feature);
    }
  });

  return { selectedFeatures, unselectedFeatures };
};