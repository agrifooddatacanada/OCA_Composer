# Schema Translator Module

This module provides functionality to translate LinkML schemas to OCA (Overlays Capture Architecture) format.

## LinkML to OCA Mappings

### Required OCA Objects

#### Capture Base

| LinkML Feature                     | OCA Output                             | Notes                |
| ---------------------------------- | -------------------------------------- | -------------------- |
| `range: float`                   | `attributes: { "field": "Numeric" }` |  |
| Any other range                    | `attributes: { "field": "Text" }`    | Default type mapping |
| `annotations: { flagged: true }` | `flagged_attributes: ["field"]`      | For sensitive data   |

#### Character Encoding

| LinkML Feature | OCA Output                              | Notes                                |
| -------------- | --------------------------------------- | ------------------------------------ |
| N/A            | `default_character_encoding: "utf-8"` | Default for all attributes           |
| N/A            | `attribute_character_encoding: {}`    | Per-attribute encoding not supported |

#### Format

| LinkML Feature       | OCA Output                                  | Notes                      |
| -------------------- | ------------------------------------------- | -------------------------- |
| `pattern: "regex"` | `attribute_formats: { "field": "regex" }` |  |

### Optional OCA Overlays

#### Meta

| LinkML Feature         | OCA Output                           | Notes              |
| ---------------------- | ------------------------------------ | ------------------ |
| Schema `name`        | `meta: { "name": "value" }`        |   |
| Schema `description` | `meta: { "description": "value" }` |   |

#### Information & Labels

| LinkML Feature       | OCA Output                                            | Notes                 |
| -------------------- | ----------------------------------------------------- | --------------------- |
| Slot `description` | `attribute_information: { "field": "description" }` |  |
| Slot `title`       | `attribute_labels: { "field": "title" }`            |  |

#### Standards & Units

| LinkML Feature          | OCA Output                               | Notes               |
| ----------------------- | ---------------------------------------- | ------------------- |
| Slot `slot_uri`       | `attr_standards: { "field": "uri" }`   | Semantic references |
| Slot `unit.ucum_code` | `attribute_units: { "field": "code" }` | UCUM codes only     |

#### Enumerations

| LinkML Feature    | OCA Output                                                          | Notes              |
| ----------------- | ------------------------------------------------------------------- | ------------------ |
| Enum keys         | `entry_code.attribute_entry_codes: { "field": ["key1", "key2"] }` | Valid values       |
| Enum descriptions | `entry.attribute_entries: { "field": { "key": "description" } }`  | Value descriptions |

### Unsupported Features

| OCA Feature         | Potential LinkML Source     | Status           |
| ------------------- | --------------------------- | ---------------- |
| Cardinality Overlay | Array constraints           | Not implemented  |
| Conditional Overlay | No equivalent               | Gap              |
| Conformance Overlay | `required` property       | Could map to M/O |
| Mapping Overlay     | Slot aliases                | Not implemented  |
| Entry Code Mapping  | No equivalent               | Gap              |
| Subset Overlay      | No equivalent               | Gap              |
| Unit Mapping        | Redundant with Unit Overlay | Not needed       |
| Layout Overlay      | Under review                | Not implemented  |
| Sensitive Overlay   | Under review                | Not implemented  |

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

## LinkML Schema Validation

While initially considering the integration of `linkml-lint` for schema validation, we found that LinkML's JavaScript implementation is still experimental. The schema validation feature is currently being tracked in the linkml-runtime.js repository (Issue #13).

Since implementing the Python-based LinkML validator would introduce similar complexity as a Python-based conversion process, we've implemented a focused set of validation rules that check for these minimum requirements:

- Must have a `name` field
- Must have a `classes` object with at least one class
- Each class must have `attributes`
- Must have a `slots` object defined (where attribute types are defined)
- Each slot referenced in class attributes must exist in the `slots` object
- Each slot should have a valid `range` property that maps to OCA types (or defaults to "Text")

For comprehensive LinkML validation, we recommend users run `linkml-lint` on their schemas before uploading them to this tool.
