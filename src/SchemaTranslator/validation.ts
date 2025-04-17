import { Slot, Enum } from "./types";
import { TYPE_MAPPING } from "./constants";

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validates a LinkML schema for OCA translation requirements.
 * Required OCA components that must be validated:
 * 1. Capture Base: attributes types and flagged attributes
 * 2. Format: pattern validation
 * 3. Meta: name and description
 * 4. Entry Codes: from LinkML enums
 * 
 * Note: Character Encoding is set to defaults, not validated from LinkML
 * 
 * @param schema The schema to validate
 * @returns Validation result with any errors or warnings
 */
export function validateForOCATranslation(schema: unknown): ValidationResult {
  const result: ValidationResult = {
    isValid: true,
    errors: [],
    warnings: []
  };

  try {
    // Type guard for basic object
    if (!schema || typeof schema !== "object") {
      result.errors.push("Schema must be a non-null object");
      result.isValid = false;
      return result;
    }

    const s = schema as Record<string, any>;

    // Required Meta Overlay validation
    if (!s.name || typeof s.name !== "string") {
      result.errors.push("Schema must have a 'name' field of type string");
    }
    if (s.description !== undefined && typeof s.description !== "string") {
      result.errors.push("Schema description must be a string if provided");
    }

    // Required class validation
    if (!s.classes || typeof s.classes !== "object") {
      result.errors.push("Schema must have a 'classes' object");
    } else if (Object.keys(s.classes).length === 0) {
      result.errors.push("Schema must have at least one class defined");
    } else {
      // Each class must have attributes for Capture Base
      Object.entries(s.classes).forEach(([className, classObj]: [string, any]) => {
        if (!classObj.attributes || typeof classObj.attributes !== "object") {
          result.errors.push(`Class '${className}' must have an 'attributes' object`);
        } else if (Object.keys(classObj.attributes).length === 0) {
          result.errors.push(`Class '${className}' must have at least one attribute`);
        }
      });
    }

    // Required slots validation (for Capture Base and Format overlays)
    if (!s.slots || typeof s.slots !== "object") {
      result.errors.push("Schema must have a 'slots' object defined");
    } else {
      const slotNames = new Set(Object.keys(s.slots));
      
      // Validate slot references
      Object.entries(s.classes || {}).forEach(([className, classObj]: [string, any]) => {
        Object.keys(classObj.attributes || {}).forEach(attrName => {
          if (!slotNames.has(attrName)) {
            result.errors.push(`Class '${className}' references undefined slot '${attrName}'`);
          }
        });
      });

      // Validate slot structure (types, patterns, flags)
      Object.entries(s.slots).forEach(([slotName, slot]: [string, any]) => {
        validateSlot(slotName, slot, result);
      });

      // Validate enum references
      Object.entries(s.slots).forEach(([slotName, slot]: [string, any]) => {
        if (slot.range && typeof slot.range === 'string' && slot.range.endsWith('Enum')) {
          const enumName = slot.range;
          if (!s.enums || !s.enums[enumName]) {
            result.errors.push(`Slot '${slotName}' references undefined enum '${enumName}'`);
          }
        }
      });
    }

    // Required Entry Code validation (from enums)
    if (s.enums) {
      if (typeof s.enums !== "object") {
        result.errors.push("Schema enums must be an object");
      } else {
        Object.entries(s.enums).forEach(([enumName, enumValue]: [string, any]) => {
          validateEnum(enumName, enumValue, result);
        });
      }
    }

    result.isValid = result.errors.length === 0;
  } catch (error) {
    result.isValid = false;
    result.errors.push(`Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  return result;
}

/**
 * Validates a single slot's structure and properties
 */
function validateSlot(slotName: string, slot: unknown, result: ValidationResult): void {
  if (!slot || typeof slot !== "object") {
    result.errors.push(`Slot '${slotName}' must be a non-null object`);
    return;
  }

  const s = slot as Partial<Slot>;

  // Check range property
  if (!s.range) {
    result.warnings.push(`Slot '${slotName}' has no range specified, will default to "Text"`);
  } else if (typeof s.range !== "string") {
    result.errors.push(`Slot '${slotName}' range must be a string`);
  } else if (!(s.range in TYPE_MAPPING) && !s.range.endsWith('Enum')) {
    result.warnings.push(`Slot '${slotName}' has range '${s.range}' which will be mapped to "Text"`);
  }

  // Validate optional properties if present
  if (s.description !== undefined && typeof s.description !== "string") {
    result.errors.push(`Slot '${slotName}' description must be a string`);
  }

  if (s.pattern !== undefined && typeof s.pattern !== "string") {
    result.errors.push(`Slot '${slotName}' pattern must be a string`);
  }

  if (s.annotations !== undefined) {
    if (typeof s.annotations !== "object" || s.annotations === null) {
      result.errors.push(`Slot '${slotName}' annotations must be an object`);
    } else if (s.annotations.flagged !== undefined && typeof s.annotations.flagged !== "boolean") {
      result.errors.push(`Slot '${slotName}' flagged annotation must be a boolean`);
    }
  }

  if (s.unit !== undefined) {
    if (typeof s.unit !== "object" || s.unit === null) {
      result.errors.push(`Slot '${slotName}' unit must be an object`);
    } else if (s.unit.ucum_code !== undefined && typeof s.unit.ucum_code !== "string") {
      result.errors.push(`Slot '${slotName}' ucum_code must be a string`);
    }
  }
}

/**
 * Validates an enum's structure and properties
 */
function validateEnum(enumName: string, enumValue: unknown, result: ValidationResult): void {
  if (!enumValue || typeof enumValue !== "object") {
    result.errors.push(`Enum '${enumName}' must be a non-null object`);
    return;
  }

  const e = enumValue as Partial<Enum>;

  // Check permissible values
  if (!e.permissible_values || typeof e.permissible_values !== "object") {
    result.errors.push(`Enum '${enumName}' must have a permissible_values object`);
    return;
  }

  // Validate each permissible value
  Object.entries(e.permissible_values).forEach(([valueKey, value]) => {
    if (typeof value !== "object" || value === null) {
      result.errors.push(`Enum '${enumName}' value '${valueKey}' must be an object`);
    } else if (value.description !== undefined && typeof value.description !== "string") {
      result.errors.push(`Enum '${enumName}' value '${valueKey}' description must be a string`);
    }
  });
} 