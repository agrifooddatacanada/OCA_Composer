# Schema Translator Module

Th mode provides functionality to translate [LinkML](https://linkml.io/linkml/) schemas to [OCA (Overlays Capture Architecture)](https://oca.colossi.network/) format.

## Overview

While there's significant overlap between LinkML and OCA, there are some key differences:

## Comprehensive Translation Overview

Our team is using the [OCA Package standard](https://github.com/agrifooddatacanada/OCA_package_standard) which significantly extends OCA's capabilities. Here's the development-focused translation overview:

## LinkML to OCA Translation Status

| Feature | LinkML Source | OCA Target | Details | |
|---------|---------------|------------|---------|--|
|         |               |            | **LinkML** | **OCA** |
| **🎯 OCA-Specific (No LinkML Equivalent)** |  |  |  |  |
| Character encoding | N/A | Character Encoding Overlay | (assumes UTF-8) | `attribute_character_encoding: {"field": "utf-8"}` |
| Cross-enum mappings | N/A | Entry Code Mapping Overlay | (no equivalent) | `attr_entry_codes_mapping: {"country": ["US:USA"]}` |
| **⚠️ Not Yet Implemented** |  |  |  |  |
| Sensitive data overlay | N/A | Sensitive Overlay | (uses general `flagged`) | `attributes: ["ssn", "dob"]` |
| Required fields | `slot.required` | Conformance Overlay | `required: true` | `attribute_conformance: {"field": "M"}` |
| Cardinality constraints | `multivalued`, array limits | Cardinality Overlay | `multivalued: true` | `attr_cardinality: {"tags": "1-5"}` |
| Aliases/mappings | `aliases`, `structured_aliases` | Attribute Mapping Overlay | `aliases: ["alt_name"]` | `attribute_mapping: {"name": "full_name"}` |
| **📦 Only Possible with Extensions** |  |  |  |  |
| Range constraints | `minimum_value`, `maximum_value` | ADC Range Overlay | `minimum_value: 0, maximum_value: 100` | `attribute_ranges: {"score": {"min": 0, "max": 100}}` |
| Unit framing | `slot.unit.ucum_code` | ADC Unit Framing Overlay | `slots: {temp: {unit: {ucum_code: "Cel"}}}` | `units: {"Cel": {"term_id": "Cel", "predicate_id": "skos:exactMatch"}}` |
| Schema imports | `imports` | OCA Package Dependencies | `imports: ["base_schema"]` | `dependencies: [{"bundle": "base_said"}]` |
| Class inheritance | `is_a`, `mixins` | Community Overlay | `is_a: Person` | `inheritance: {"Patient": {"parent": "Person"}}` |
| Object relationships | Object `range` values | Community Overlay | `range: Organization` | `relationships: {"employer": {"type": "Organization"}}` |
| Unique keys | `unique_keys` | Community Overlay | `unique_keys: ["ssn"]` | `validation: {"unique": ["ssn"]}` |
| Complex validation | `rules`, `conditions` | Community Overlay | `rules: [{if: age > 18}]` | `validation: {"rules": [...]}` |
| Advanced types | `any_of`, `exactly_one_of` | Community Overlay | `any_of: [string, integer]` | `types: {"union": ["string", "integer"]}` |
| Custom annotations | `annotations` | Community Overlay | `annotations: {custom: "value"}` | `extensions: {"community": {...}}` |
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

- **Keep insertion order of attributes in LinkML schema** - Currently attribute order may not be preserved during translation
- Implement the features listed in the "⚠️ To Do" section of the translation table above
- Add validation for LinkML schema structure before translation

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

## LinkML Schema Processing

Currently, the translator processes LinkML schemas **without validation**. While initially considering the integration of [`linkml-lint`](https://linkml.io/linkml/schemas/linter.html) for schema validation, we found that LinkML's JavaScript implementation is still experimental. The schema validation feature is currently being tracked in the [linkml-runtime.js repository (Issue #13)](https://github.com/linkml/linkml-runtime.js/issues/13).

### Current Implementation

The translator currently:
- Parses YAML content using `js-yaml` 
- Processes `slots` and `enums` objects if present (defaults to empty objects if missing)
- Maps available slots to OCA attributes with basic type conversion
- Generates overlays based on available LinkML properties

### Validation Limitations

⚠️ **Important**: No schema validation is currently implemented. The translator will attempt to process any YAML input, which may result in:
- Empty OCA bundles from malformed LinkML schemas
- Missing overlays if expected LinkML properties are absent
- Unexpected behavior with invalid schema structures

### Recommendations

For reliable results, ensure your LinkML schemas include:
- Valid `slots` definitions with `range` properties
- Proper `enums` with `permissible_values` where needed  
- Schema metadata (`name`, `description`)

For comprehensive LinkML validation, we **strongly recommend** users run [`linkml-lint`](https://linkml.io/linkml/cli/lint.html) on their schemas before uploading them to this tool.
