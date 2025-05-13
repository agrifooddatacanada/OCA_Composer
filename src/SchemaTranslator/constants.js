/**
 * Default configuration settings for OCA conversion
 */
export const DEFAULT_CONFIG = {
  semVer: "1.0",
  defaultLanguage: "en",
  defaultCharacterEncoding: "utf-8",
  outputFormat: "json"
};

/**
 * OCA specification types
 */
export const OCA_TYPES = {
  CAPTURE_BASE: "spec/capture_base",
  CHARACTER_ENCODING: "spec/character_encoding",
  FORMAT: "spec/format",
  INFORMATION: "spec/information",
  LABEL: "spec/label",
  META: "spec/meta",
  STANDARD: "spec/standard",
  ENTRY_CODE: "spec/entry_code",
  ENTRY: "spec/entry",
  UNIT: "spec/unit"
};

/**
 * Overlays that do not require language specification
 */
export const NON_LANGUAGE_OVERLAYS = [
  "entry_code",
  "unit",
  "capture_base",
  "character_encoding"
];

/**
 * Keys to prioritize in output
 */
export const PRIORITY_KEYS = ["capture_base", "digest", "type", "language"];

/**
 * Mapping from LinkML data types to OCA types
 */
export const TYPE_MAPPING = {
  string: "Text",
  float: "Numeric",
  integer: "Numeric"
};
