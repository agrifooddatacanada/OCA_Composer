// Validation function for OCA JSON files
export const validateOCAJsonFile = (jsonString) => {
  const errors = [];
  const warnings = [];

  const formatMessages = (msgs, maxLength = 200) => {
    if (!msgs || msgs.length === 0) return "";
    const message = msgs.join('; ');
    return message.length > maxLength ? `${message.substring(0, maxLength)}...` : message;
  };

  try {
    // Step 1: Basic JSON parsing
    const rawParse = JSON.parse(jsonString);
    
    // Step 2: Check for required top-level structure
    if (!rawParse) {
      errors.push("JSON file is empty or null");
      return {
        isValid: false,
        errors,
        warnings,
        errorsMessage: formatMessages(errors),
        warningsMessage: formatMessages(warnings)
      };
    }

    // Step 3: Determine the file type and extract the bundle
    let jsonFile = null;
    let fileType = null;

    if (rawParse?.oca_bundle?.bundle) {
      fileType = "OCA_PACKAGE";
      jsonFile = rawParse.oca_bundle.bundle;
    } else if (rawParse?.bundle) {
      fileType = "BUNDLE";
      jsonFile = rawParse.bundle;
    } else if (rawParse?.schema?.[0]) {
      fileType = "SCHEMA_ARRAY";
      jsonFile = rawParse.schema[0];
    } else {
      fileType = "DIRECT_SCHEMA";
      jsonFile = rawParse;
    }

    if (!jsonFile) {
      errors.push("No valid schema bundle found in the JSON file");
      return {
        isValid: false,
        errors,
        warnings,
        errorsMessage: formatMessages(errors),
        warningsMessage: formatMessages(warnings)
      };
    }

    // Step 4: Validate capture_base (required)
    if (!jsonFile.capture_base) {
      errors.push("Missing required 'capture_base' section");
      return {
        isValid: false,
        errors,
        warnings,
        errorsMessage: formatMessages(errors),
        warningsMessage: formatMessages(warnings)
      };
    }

    if (!jsonFile.capture_base.attributes || typeof jsonFile.capture_base.attributes !== 'object') {
      errors.push("Missing or invalid 'attributes' in capture_base");
      return {
        isValid: false,
        errors,
        warnings,
        errorsMessage: formatMessages(errors),
        warningsMessage: formatMessages(warnings)
      };
    }

    if (!jsonFile.capture_base.type || !jsonFile.capture_base.type.includes('capture_base')) {
      errors.push("Invalid or missing 'type' in capture_base (should contain 'capture_base')");
      return {
        isValid: false,
        errors,
        warnings,
        errorsMessage: formatMessages(errors),
        warningsMessage: formatMessages(warnings)
      };
    }

    // Step 5: Validate overlays structure
    if (!jsonFile.overlays) {
      warnings.push("No overlays found - schema will have limited functionality");
    } else {
      // Step 6: Validate meta overlays (required for language support)
      if (!jsonFile.overlays.meta || !Array.isArray(jsonFile.overlays.meta) || jsonFile.overlays.meta.length === 0) {
        errors.push("Missing or empty 'meta' overlays - required for language support");
      } else {
        // Validate each meta overlay
        jsonFile.overlays.meta.forEach((meta, index) => {
          if (!meta.language) {
            errors.push(`Meta overlay ${index} missing 'language' field`);
          }
          if (!meta.name) {
            warnings.push(`Meta overlay ${index} missing 'name' field`);
          }
          if (!meta.description) {
            warnings.push(`Meta overlay ${index} missing 'description' field`);
          }
        });
      }

      // Step 7: Validate label overlays
      if (jsonFile.overlays.label) {
        if (!Array.isArray(jsonFile.overlays.label)) {
          errors.push("'label' overlays must be an array");
        } else {
          jsonFile.overlays.label.forEach((label, index) => {
            if (!label.language) {
              errors.push(`Label overlay ${index} missing 'language' field`);
            }
            if (!label.attribute_labels || typeof label.attribute_labels !== 'object') {
              errors.push(`Label overlay ${index} missing or invalid 'attribute_labels'`);
            }
          });
        }
      }

      // Step 8: Validate information overlays
      if (jsonFile.overlays.information) {
        if (!Array.isArray(jsonFile.overlays.information)) {
          errors.push("'information' overlays must be an array");
        } else {
          jsonFile.overlays.information.forEach((info, index) => {
            if (!info.language) {
              errors.push(`Information overlay ${index} missing 'language' field`);
            }
            if (!info.attribute_information || typeof info.attribute_information !== 'object') {
              errors.push(`Information overlay ${index} missing or invalid 'attribute_information'`);
            }
          });
        }
      }

      // Step 9: Validate entry overlays
      if (jsonFile.overlays.entry) {
        if (!Array.isArray(jsonFile.overlays.entry)) {
          errors.push("'entry' overlays must be an array");
        } else {
          jsonFile.overlays.entry.forEach((entry, index) => {
            if (!entry.language) {
              errors.push(`Entry overlay ${index} missing 'language' field`);
            }
            if (!entry.attribute_entries || typeof entry.attribute_entries !== 'object') {
              errors.push(`Entry overlay ${index} missing or invalid 'attribute_entries'`);
            }
          });
        }
      }

      // Step 10: Validate other overlay types
      const singleOverlays = ['unit', 'conformance', 'character_encoding', 'entry_code', 'format', 'cardinality', 'standard'];
      singleOverlays.forEach(overlayType => {
        if (jsonFile.overlays[overlayType] && typeof jsonFile.overlays[overlayType] !== 'object') {
          errors.push(`'${overlayType}' overlay must be an object`);
        }
      });
    }

    // Step 11: Check for flagged attributes
    if (jsonFile.capture_base.flagged_attributes && jsonFile.capture_base.flagged_attributes.length > 0) {
      warnings.push(`Found ${jsonFile.capture_base.flagged_attributes.length} flagged attributes that may need attention`);
    }

    // Step 12: Validate attribute types in capture_base
    const validTypes = ['Text', 'Numeric', 'DateTime', 'Boolean', 'Binary'];
    const attributes = jsonFile.capture_base.attributes;
    
    Object.entries(attributes).forEach(([attrName, attrType]) => {
      if (Array.isArray(attrType)) {
        // Handle array types
        if (attrType.length === 0) {
          errors.push(`Attribute '${attrName}' has empty array type`);
        } else if (attrType.length > 1) {
          errors.push(`Attribute '${attrName}' has multiple types in array - only single type supported`);
        } else if (!validTypes.includes(attrType[0])) {
          errors.push(`Attribute '${attrName}' has invalid type '${attrType[0]}' in array`);
        }
      } else if (!validTypes.includes(attrType)) {
        errors.push(`Attribute '${attrName}' has invalid type '${attrType}'`);
      }
    });

    // Step 13: Check for consistency between overlays and attributes
    if (jsonFile.overlays?.label) {
      const labelLanguages = new Set(jsonFile.overlays.label.map(l => l.language));
      const metaLanguages = new Set(jsonFile.overlays.meta?.map(m => m.language) || []);
      
      labelLanguages.forEach(lang => {
        if (!metaLanguages.has(lang)) {
          warnings.push(`Label overlay has language '${lang}' not found in meta overlays`);
        }
      });
    }

    const errorsMessage = formatMessages(errors);
    const warningsMessage = formatMessages(warnings);

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      errorsMessage,
      warningsMessage,
      fileType,
      attributeCount: Object.keys(attributes).length,
      overlayCount: jsonFile.overlays ? Object.keys(jsonFile.overlays).length : 0
    };

  } catch (parseError) {
    errors.push(`JSON parsing error: ${parseError.message}`);
    return {
      isValid: false,
      errors,
      warnings,
      errorsMessage: formatMessages(errors),
      warningsMessage: formatMessages(warnings)
    };
  }
};


