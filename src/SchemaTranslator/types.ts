// types.ts

export interface Slot {
  name?: string;
  range: string; // can be a primitive, enum name, or class name
  description?: string;
  pattern?: string;
  title?: string;
  slot_uri?: string;
  annotations?: {
    flagged?: boolean;
  };
  unit?: {
    ucum_code?: string;
  };
}

export interface Enum {
  name?: string;
  permissible_values: Record<
    string, // the enum value
    {
      description?: string;
    }
  >;
}

// Base interfaces
export interface OCAObject {
  type: string;
  // digest: string;
  // capture_base: string;
  language: string;
}

export interface OCAOverlay extends OCAObject {
  capture_base: string;
}

// Specific overlay types
export interface CaptureBase extends OCAObject {
  attributes: Record<string, string>;
  flagged_attributes: string[];
}

export interface CharacterEncoding extends OCAOverlay {
  default_character_encoding: string;
  attribute_character_encoding: Record<string, string>;
}

export interface Format extends OCAOverlay {
  attribute_formats: Record<string, string>;
}

export interface Information extends OCAOverlay {
  attribute_information: Record<string, string>;
}

export interface Label extends OCAOverlay {
  attribute_labels: Record<string, string>;
}

export interface Meta extends OCAOverlay {
  name: string;
  description: string;
}

export interface Standard extends OCAOverlay {
  attr_standards: Record<string, string>;
}

export interface EntryCode extends OCAOverlay {
  attribute_entry_codes: Record<string, string[]>;
}

export interface Entry extends OCAOverlay {
  attribute_entries: Record<string, Record<string, string>>;
}

export interface Unit extends OCAOverlay {
  metric_system: string;
  attribute_units: Record<string, string>;
}

// Main data structures
export interface OCAData {
  capture_base: CaptureBase;
  character_encoding: CharacterEncoding[];
  format: Format[];
  information: Information[];
  label: Label[];
  meta: Meta[];
  standard: Standard[];
  entry_code: EntryCode[];
}

export interface LinkMLAttribute {
  name: string;
  description?: string;
  range?: string;
  required?: boolean;
  multivalued?: boolean;
  pattern?: string;
}

export interface LinkMLClass {
  name: string;
  description?: string;
  attributes: Record<string, LinkMLAttribute>;
  slot_usage?: Record<string, Slot>;
}


// Not using LinkML spec for required pieces (not in doc's)
export interface LinkMLSchema {
  name: string;
  description?: string;
  id?: string;
  classes: Record<string, LinkMLClass>;
  slots?: Record<string, Slot>;
  enums?: Record<string, Enum>;
}

// Configuration types
export interface ConversionConfig {
  semVer: string;
  defaultLanguage: string;
  defaultCharacterEncoding: string;
  outputFormat: "json" | "yaml";
}

export interface OCABundle {
  capture_base: CaptureBase;
  overlays: Partial<{
    format: Format[];
    meta: Meta[];
    information: Information[];
    label: Label[];
    character_encoding: CharacterEncoding[];
    standard: Standard[];
    entry_code: EntryCode[];
    entry: Entry[];
    unit: Unit[];
  }>;
}

export interface OCAPackage {
  type: string;
  oca_bundle: {
    bundle: OCABundle;
  };
  dependencies: Array<any>;
  extensions: Array<any>;
}
  