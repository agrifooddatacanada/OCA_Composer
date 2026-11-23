/**
 * Editor-state fixtures for the useOCAExport baseline snapshots.
 *
 * Each fixture has the exact shape the Composer keeps in `schemaStates[schemaId]`
 * (see src/schema/schemaStore.js). They are hand-authored so every overlay the
 * export logic knows about is exercised by at least one fixture.
 */
import { createDefaultSchemaState } from "../../../src/schema/schemaStore";
import { langCodeOCAFromName } from "../../../src/utils/languageUtils";
import {
  overlayItems,
  FIELD_FORMAT_OVERLAY,
  FIELD_CONFORMANCE_OVERLAY,
  FIELD_CARDINALITY_OVERLAY,
  FIELD_RANGE_OVERLAY,
  FIELD_CHARACTER_ENCODING_OVERLAY,
  FIELD_EXAMPLE_OVERLAY,
  FIELD_DATA_SEPARATOR_OVERLAY
} from "../../../src/constants/constants";

/**
 * Mirrors LanguageDetails.handleSave: after the Language step the real app stores
 * `overlays` as the array-shaped defaults from completeSchema, with `label` replaced
 * by one overlay per language that has at least one non-empty label.
 */
const overlaysAfterLanguageStep = (base, lanAttributeRowData = {}) => {
  const overlays = { ...base.completeSchema.overlays };
  const labelOverlays = [];
  Object.entries(lanAttributeRowData).forEach(([language, rows]) => {
    const attributeLabels = {};
    rows.forEach((row) => {
      if (row.Attribute && row.Label && row.Label.trim() !== "") {
        attributeLabels[row.Attribute] = row.Label;
      }
    });
    if (Object.keys(attributeLabels).length > 0) {
      labelOverlays.push({
        language: langCodeOCAFromName(language) || language.toLowerCase().slice(0, 3),
        attribute_labels: attributeLabels
      });
    }
  });
  if (labelOverlays.length > 0) overlays.label = labelOverlays;
  return overlays;
};

const build = (schemaId, overrides) => {
  const base = createDefaultSchemaState();
  const overlays = overlaysAfterLanguageStep(base, overrides.lanAttributeRowData);
  return {
    schemaId,
    state: {
      ...base,
      initialized: true,
      ...overrides,
      overlays,
      completeSchema: { ...base.completeSchema, overlays },
      metadata: { ...base.metadata, ...overrides.metadata }
    }
  };
};

/** One language, two attributes, no optional overlays selected. */
export const minimalFixture = () =>
  build("manual-creation-schema", {
    metadata: { name: "Minimal", description: "Smallest useful schema", languages: ["English"] },
    attributes: [
      { Attribute: "sample_id", Type: "Text", Required: true },
      { Attribute: "weight", Type: "Numeric" }
    ],
    lanAttributeRowData: {
      English: [
        { Attribute: "sample_id", Label: "Sample", Description: "Unique sample id" },
        { Attribute: "weight", Label: "Weight", Description: "" }
      ]
    },
    overlaySelections: { ...overlayItems }
  });

/** Two languages and every overlay the manual-creation flow can select. */
export const richBilingualFixture = () =>
  build("manual-creation-schema", {
    metadata: {
      name: "Poultry trial",
      description: "Broiler feeding trial",
      languages: ["English", "French"],
      classification: "Biological sciences"
    },
    attributes: [
      { Attribute: "bird_id", Type: "Text", Required: true, Sensitive: true },
      { Attribute: "live_weight", Type: "Numeric", Unit: "g" },
      { Attribute: "hatch_date", Type: "DateTime" },
      { Attribute: "treatment", Type: "Text", Required: true, List: true },
      { Attribute: "visits", Type: "Array[Text]" }
    ],
    lanAttributeRowData: {
      English: [
        { Attribute: "bird_id", Label: "Bird", Description: "Bird identifier" },
        { Attribute: "live_weight", Label: "Live weight", Description: "Weight at day 42" },
        { Attribute: "hatch_date", Label: "Hatch date", Description: "" },
        { Attribute: "treatment", Label: "Treatment", Description: "Diet group" },
        { Attribute: "visits", Label: "Visits", Description: "Vet visits" }
      ],
      French: [
        { Attribute: "bird_id", Label: "Oiseau", Description: "Identifiant de l'oiseau" },
        { Attribute: "live_weight", Label: "Poids vif", Description: "Poids au jour 42" },
        { Attribute: "hatch_date", Label: "Date d'éclosion", Description: "" },
        { Attribute: "treatment", Label: "Traitement", Description: "Groupe alimentaire" },
        { Attribute: "visits", Label: "Visites", Description: "Visites vétérinaires" }
      ]
    },
    entryCodes: {
      treatment: [
        { Code: "CTRL", English: "Control diet", French: "Régime témoin" },
        { Code: "HIGH", English: "High-protein diet", French: "Régime riche en protéines" }
      ]
    },
    attributeFormats: {
      bird_id: "^[A-Z]{2}[0-9]{3}$",
      live_weight: "^-?[0-9]+(\\.[0-9]+)?$",
      hatch_date: "YYYY-MM-DD"
    },
    attributeCardinality: { visits: "1-3" },
    attributeRanges: {
      live_weight: { lower: "0", upper: "5000", lower_inclusive: true, upper_inclusive: false }
    },
    characterEncodingData: { bird_id: "utf-8" },
    exampleData: {
      bird_id: { English: "AB123", French: "AB123" },
      live_weight: { English: "2450", French: "2450" }
    },
    decimalSeparator: ",",
    enableDecimalSeparator: true,
    overlaySelections: {
      ...overlayItems,
      [FIELD_FORMAT_OVERLAY]: true,
      [FIELD_CONFORMANCE_OVERLAY]: true,
      [FIELD_CARDINALITY_OVERLAY]: true,
      [FIELD_RANGE_OVERLAY]: true,
      [FIELD_CHARACTER_ENCODING_OVERLAY]: true,
      [FIELD_EXAMPLE_OVERLAY]: true,
      [FIELD_DATA_SEPARATOR_OVERLAY]: true
    }
  });

/** Quotes, backslashes, commas, and blank rows: stresses DSL escaping. */
export const adversarialEscapingFixture = () =>
  build("manual-creation-schema", {
    metadata: {
      name: 'He said "hello"',
      description: 'Backslash \\ and "quotes" and, commas',
      languages: ["English"]
    },
    attributes: [
      { Attribute: "q1", Type: "Text", List: true },
      { Attribute: "", Type: "Text" },
      { Attribute: "q2", Type: "Text" }
    ],
    lanAttributeRowData: {
      English: [
        { Attribute: "q1", Label: 'Label with "quotes"', Description: "Line one\nLine two" },
        { Attribute: "", Label: "", Description: "" },
        { Attribute: "q2", Label: "Back\\slash", Description: "Tab\tseparated, and = signs" }
      ]
    },
    entryCodes: {
      q1: [
        { Code: 'a"b', English: 'Label "A"' },
        { Code: "c,d", English: "Comma, label" },
        { Code: "  ", English: "blank code is skipped" }
      ]
    },
    attributeFormats: { q2: '^"quoted"\\d+$' },
    overlaySelections: { ...overlayItems, [FIELD_FORMAT_OVERLAY]: true }
  });

export const allFixtures = {
  minimal: minimalFixture,
  richBilingual: richBilingualFixture,
  adversarialEscaping: adversarialEscapingFixture
};
