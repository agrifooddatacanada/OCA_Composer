# Schema Translator Module

This module provides functionality to translate [LinkML](https://linkml.io/linkml/) schemas to [OCA (Overlays Capture Architecture)](https://oca.colossi.network/) format.

## Overview

While there's significant overlap between LinkML and OCA, there are some key differences:

## Comprehensive Translation Overview

Our team is using the [OCA Package standard](https://github.com/agrifooddatacanada/OCA_package_standard) which significantly extends OCA's capabilities. Here's the development-focused translation overview:

## LinkML to OCA Translation Status

| Feature | LinkML Source | OCA Target | Details | |
|---------|---------------|------------|---------|--|
|         |               |            | **LinkML** | **OCA** |
| **✅ Implemented** |  |  |  |  |
| Data types | `range: float/string/integer` | Capture Base attributes | `slots: {field: {range: "float"}}` | `attributes: {"field": "Numeric"}` |
| Field descriptions | `slot.description` | Information Overlay | `slots: {field: {description: "Patient age"}}` | `attribute_information: {"field": "Patient age"}` |
| Field labels | `slot.title` | Label Overlay | `slots: {field: {title: "Full Name"}}` | `attribute_labels: {"field": "Full Name"}` |
| Schema metadata | `name`, `description` | Meta Overlay | `name: "PatientSchema", description: "Clinical data"` | `name: "PatientSchema", description: "Clinical data"` |
| Format validation | `slot.pattern` | Format Overlay | `slots: {ssn: {pattern: "^\\d{3}-\\d{2}"}}` | `attribute_formats: {"ssn": "^\\d{3}-\\d{2}"}` |
| Enumerations | `enums.permissible_values` | Entry/Entry Code Overlays | `enums: {GenderEnum: {M: {description: "Male"}}}` | `attribute_entries: {"gender": {"M": "Male"}}` |
| Units | `slot.unit.ucum_code` | Unit Overlay | `slots: {height: {unit: {ucum_code: "cm"}}}` | `attribute_units: {"height": "cm"}` |
| Semantic references | `slot.slot_uri` | Standard Overlay | `slots: {name: {slot_uri: "schema:name"}}` | `attr_standards: {"name": "schema:name"}` |
| Flagged attributes | `annotations.flagged` | `flagged_attributes` | `slots: {ssn: {annotations: {flagged: true}}}` | `flagged_attributes: ["ssn"]` |
| **⚠️ To Do** |  |  |  |  |
| Required fields | `slot.required` | Conformance Overlay | `required: true` | `attribute_conformance: {"field": "M"}` |
| Cardinality constraints | `multivalued`, array limits | Cardinality Overlay | `multivalued: true` | `attr_cardinality: {"tags": "1-5"}` |
| Aliases/mappings | `aliases`, `structured_aliases` | Attribute Mapping Overlay | `aliases: ["alt_name"]` | `attribute_mapping: {"name": "full_name"}` |
| **🔧 Possible Through OCA Package Extensions** |  |  |  |  |
| Schema imports | `imports` | OCA Package dependencies | `imports: ["base_schema"]` | `dependencies: [{"bundle": "base_said"}]` |
| Class inheritance | `is_a`, `mixins` | ADC Inheritance Overlay | `is_a: Person` | `inheritance: {"Patient": {"parent": "Person"}}` |
| Object relationships | Object `range` values | ADC Relationship Overlay | `range: Organization` | `relationships: {"employer": {"type": "Organization"}}` |
| Unique keys | `unique_keys` | ADC Validation Overlay | `unique_keys: ["ssn"]` | `validation: {"unique": ["ssn"]}` |
| Complex validation | `rules`, `conditions` | ADC Validation Overlay | `rules: [{if: age > 18}]` | `validation: {"rules": [...]}` |
| Advanced types | `any_of`, `exactly_one_of` | ADC Type Overlay | `any_of: [string, integer]` | `types: {"union": ["string", "integer"]}` |
| Custom annotations | `annotations` | ADC Community Overlays | `annotations: {custom: "value"}` | `extensions: {"adc": {...}}` |
| **🎯 OCA-Specific (No LinkML Equivalent)** |  |  |  |  |
| Character encoding | N/A | Character Encoding Overlay | (assumes UTF-8) | `attribute_character_encoding: {"field": "utf-8"}` |
| Sensitive data overlay | N/A | Sensitive Overlay | (uses general `flagged`) | `attributes: ["ssn", "dob"]` |
| Cross-enum mappings | N/A | Entry Code Mapping Overlay | (no equivalent) | `attr_entry_codes_mapping: {"country": ["US:USA"]}` |

## Development Priorities

1. **✅ Implemented Features**: Ready for production use
2. **⚠️ Next Sprint**: Low-hanging fruit, easy to add to core translator
3. **🔧 OCA Package**: Requires community overlay development
4. **🎯 OCA-Specific**: Generate with sensible defaults

### Example Mapping

```yaml
# LinkML Input
slots:
  length:
    description: "Observed length in cm"
    range: float
    unit:
      ucum_code: cm
    pattern: "^\\d+(\\.\\d{1,2})?$"
    annotations:
      flagged: true

# Generated OCA Output
{
  "capture_base": {
    "attributes": {
      "length": "Numeric"
    },
    "flagged_attributes": ["length"]
  },
  "format": {
    "attribute_formats": {
      "length": "^\\d+(\\.\\d{1,2})?$"
    }
  },
  "information": {
    "attribute_information": {
      "length": "Observed length in cm"
    }
  },
  "unit": {
    "attribute_units": {
      "length": "cm"
    }
  }
}
```

## TODO

- Keep insertion order of attributes in LinkML schema

## Examples

The `examples/` directory contains sample LinkML schemas that demonstrate various features:

### Trout Research Schema (`schema.yaml`)

A comprehensive schema for trout-related biological and environmental data, demonstrating:

- Complex class definitions with multiple slots
- Enumerated types (e.g., GenderEnum, SiteEnum)
- Various data types (string, float, integer)
- Unit specifications using UCUM codes
- Flagged attributes for sensitive data
- Required vs optional fields
- Rich descriptions and titles
- Geographical and temporal data
- Environmental measurements
- Biological measurements

Features demonstrated:

```yaml
# Class definition with slots
classes:
  Trout:
    annotations:
      flagged: For slots that contain personally identifiable information
    slots:
      - site
      - latitude
      - longitude
      # ... more slots

# Enumeration example
enums:
  GenderEnum:
    permissible_values:
      M: { description: Male }
      F: { description: Female }
      # ... more values

# Slot with units and validation
slots:
  length:
    description: Observed length in cm.
    range: float
    unit:
      ucum_code: cm
```

## Directory Structure

```
SchemaTranslator/
├── components/          # React components for the translator UI
├── processors/         # Core processing logic for schema translation
│   ├── index.ts              # Processor exports
│   ├── mapLinkMLToOCABundle.ts    # Main LinkML to OCA mapping
├── constants.ts       # Shared constants and configuration
├── linkMLToOCA.ts     # Main translation logic
├── linkmlLint.ts      # LinkML schema linting
├── types.ts          # TypeScript type definitions
├── utils.ts          # Utility functions
└── validation.ts     # Schema validation functions
```

## Core Files

- `linkMLToOCA.ts`: Main entry point for schema translation
- `types.ts`: TypeScript interfaces and types for LinkML and OCA schemas
- `validation.ts`: Schema validation and error checking
- `constants.ts`: Shared constants and configuration values
- `utils.ts`: Helper functions and utilities

## Components

The `components/` directory contains React components for the translator UI interface.

## LinkML Schema Validation

While initially considering the integration of [`linkml-lint`](https://linkml.io/linkml/schemas/linter.html) for schema validation, we found that LinkML's JavaScript implementation is still experimental. The schema validation feature is currently being tracked in the [linkml-runtime.js repository (Issue #13)](https://github.com/linkml/linkml-runtime.js/issues/13).

Since implementing the Python-based LinkML validator would introduce similar complexity as a Python-based conversion process, we've implemented a focused set of validation rules that check for these minimum requirements:

- Must have a `name` field
- Must have a `classes` object with at least one class
- Each class must have `attributes`
- Must have a `slots` object defined (where attribute types are defined)
- Each slot referenced in class attributes must exist in the `slots` object
- Each slot should have a valid `range` property that maps to OCA types (or defaults to "Text")

For comprehensive LinkML validation, we recommend users run [`linkml-lint`](https://linkml.io/linkml/cli/lint.html) on their schemas before uploading them to this tool.
