/**
 * This file contains JSDoc type definitions for the LinkML to OCA translation
 */

/**
 * @typedef {Object} Slot
 * @property {string} [name] - Optional name of the slot
 * @property {string} range - Can be a primitive, enum name, or class name
 * @property {string} [description] - Optional description
 * @property {string} [pattern] - Optional regex pattern
 * @property {string} [title] - Optional display title
 * @property {string} [slot_uri] - Optional URI reference
 * @property {Object} [annotations] - Optional annotations
 * @property {boolean} [annotations.flagged] - Whether the slot is flagged as sensitive
 * @property {Object} [unit] - Optional unit information
 * @property {string} [unit.ucum_code] - UCUM code for the unit
 */

/**
 * @typedef {Object} Enum
 * @property {string} [name] - Optional name of the enum
 * @property {Object.<string, Object>} permissible_values - Map of enum values
 * @property {string} [permissible_values.*.description] - Optional description for each value
 */

/**
 * @typedef {Object} OCAObject
 * @property {string} type - The type of the OCA object
 * @property {string} language - The language of the OCA object
 */

/**
 * @typedef {Object} OCAOverlay
 * @property {string} capture_base - Reference to the capture base
 */

/**
 * @typedef {Object} CaptureBase
 * @property {Object.<string, string>} attributes - Map of attribute names to types
 * @property {string[]} flagged_attributes - List of sensitive attributes
 */

/**
 * @typedef {Object} CharacterEncoding
 * @property {string} default_character_encoding - Default encoding for all attributes
 * @property {Object.<string, string>} attribute_character_encoding - Per-attribute encodings
 */

/**
 * @typedef {Object} Format
 * @property {Object.<string, string>} attribute_formats - Map of attribute formats
 */

/**
 * @typedef {Object} Information
 * @property {Object.<string, string>} attribute_information - Map of attribute descriptions
 */

/**
 * @typedef {Object} Label
 * @property {Object.<string, string>} attribute_labels - Map of attribute labels
 */

/**
 * @typedef {Object} Meta
 * @property {string} name - Schema name
 * @property {string} description - Schema description
 */

/**
 * @typedef {Object} Standard
 * @property {Object.<string, string>} attr_standards - Map of attribute standards
 */

/**
 * @typedef {Object} EntryCode
 * @property {Object.<string, string[]>} attribute_entry_codes - Map of attribute entry codes
 */

/**
 * @typedef {Object} Entry
 * @property {Object.<string, Object.<string, string>>} attribute_entries - Map of attribute entries
 */

/**
 * @typedef {Object} Unit
 * @property {string} metric_system - The metric system used
 * @property {Object.<string, string>} attribute_unit - Map of attribute units (OCA spec)
 */

/**
 * @typedef {Object} LinkMLAttribute
 * @property {string} name - The name of the attribute
 * @property {string} [description] - Optional description
 * @property {string} [range] - Optional range
 * @property {boolean} [required] - Whether the attribute is required
 * @property {boolean} [multivalued] - Whether the attribute is multivalued
 * @property {string} [pattern] - Optional regex pattern
 */

/**
 * @typedef {Object} LinkMLClass
 * @property {string} name - The name of the class
 * @property {string} [description] - Optional description
 * @property {Object.<string, LinkMLAttribute>} attributes - Map of attribute definitions
 * @property {Object.<string, Slot>} [slot_usage] - Optional slot usage information
 */

/**
 * @typedef {Object} LinkMLSchema
 * @property {string} name - The name of the schema
 * @property {string} [description] - Optional description
 * @property {string} [id] - Optional identifier
 * @property {Object.<string, LinkMLClass>} classes - Map of class definitions
 * @property {Object.<string, Slot>} [slots] - Optional slot definitions
 * @property {Object.<string, Enum>} [enums] - Optional enum definitions
 */

/**
 * @typedef {Object} ConversionConfig
 * @property {string} semVer - Semantic version
 * @property {string} defaultLanguage - Default language
 * @property {string} defaultCharacterEncoding - Default character encoding
 * @property {('json'|'yaml')} outputFormat - Output format
 */

/**
 * @typedef {Object} OCABundle
 * @property {CaptureBase} capture_base - The capture base
 * @property {Object} overlays - The overlays
 * @property {Format[]} [overlays.format] - Format overlays
 * @property {Meta[]} [overlays.meta] - Meta overlays
 * @property {Information[]} [overlays.information] - Information overlays
 * @property {Label[]} [overlays.label] - Label overlays
 * @property {CharacterEncoding[]} [overlays.character_encoding] - Character encoding overlays
 * @property {Standard[]} [overlays.standard] - Standard overlays
 * @property {EntryCode[]} [overlays.entry_code] - Entry code overlays
 * @property {Entry[]} [overlays.entry] - Entry overlays
 * @property {Unit[]} [overlays.unit] - Unit overlays
 */

/**
 * @typedef {Object} OCAPackage
 * @property {string} type - The type of the package
 * @property {Object} oca_bundle - The OCA bundle
 * @property {OCABundle} oca_bundle.bundle - The bundle
 * @property {Array} dependencies - Dependencies
 * @property {Array} extensions - Extensions
 */
