import { divisionCodes, groupCodes } from "@oca-composer/oca-core";
import { DEFAULT_BUNDLE_SERVICE_URL } from "../lib/config.js";
import { SUPPORTED_LANGUAGES } from "../lib/languages.js";
import { ATTRIBUTE_TYPES, CHARACTER_ENCODINGS } from "../lib/schemaSpec.js";

const EXAMPLE = {
  name: { en: "Poultry trial", fr: "Essai avicole" },
  description: { en: "Broiler feeding trial" },
  languages: ["en", "fr"],
  classification: "RDF401",
  attributes: [
    {
      name: "bird_id",
      type: "Text",
      label: { en: "Bird", fr: "Oiseau" },
      description: { en: "Leg band identifier", fr: "Identifiant de la bague" },
      required: true,
      format: "^[A-Z]{2}[0-9]{3}$"
    },
    {
      name: "live_weight",
      type: "Numeric",
      label: { en: "Live weight", fr: "Poids vif" },
      unit: "g",
      example: "2450"
    },
    {
      name: "treatment",
      type: "Text",
      label: { en: "Treatment", fr: "Traitement" },
      entry_codes: [
        { code: "CTRL", label: { en: "Control diet", fr: "Régime témoin" } },
        { code: "HIGH", label: { en: "High-protein diet", fr: "Régime riche en protéines" } }
      ]
    },
    {
      name: "visits",
      type: "Array[Text]",
      label: { en: "Vet visits", fr: "Visites vétérinaires" },
      cardinality: { min: 1, max: 3 }
    }
  ]
};

const table = (headers, rows) =>
  [
    `| ${headers.join(" | ")} |`,
    `| ${headers.map(() => "---").join(" | ")} |`,
    ...rows.map((row) => `| ${row.join(" | ")} |`)
  ].join("\n");

const classificationRows = () => {
  const divisions = Object.entries(divisionCodes).filter(([name, code]) => name && code);
  const groups = Object.entries(groupCodes).filter(([name, code]) => name && code);
  return [
    ...divisions.map(([name, code]) => [`\`${code}\``, name, "division"]),
    ...groups.map(([name, code]) => [`\`${code}\``, name, "group"])
  ].sort((a, b) => a[0].localeCompare(b[0]));
};

export const SCHEMA_SPEC_REFERENCE_MARKDOWN = `# Schema spec

A schema spec describes one OCA schema as JSON. Check it with \`validate_schema_spec\`, then
turn it into an OCA package with \`build_oca_package\`. Afterwards, \`validate_dataset\` with the
new package and the original data confirms the schema fits the data.

Every human-readable text is an object keyed by language code, for example
\`{"en": "Weight", "fr": "Poids"}\`. Use only the codes listed in \`languages\`.

## Example

\`\`\`json
${JSON.stringify(EXAMPLE, null, 2)}
\`\`\`

## Schema fields

${table(
  ["Field", "Required", "Meaning"],
  [
    ["`name`", "yes", "Schema name per language. Languages without a name use the first one."],
    ["`description`", "no", "Schema description per language."],
    ["`languages`", "yes", "Language codes, primary language first. See the list below."],
    ["`classification`", "no", "Research classification code. See the list below."],
    ["`attributes`", "yes", "The attributes, in column order."]
  ]
)}

## Attribute fields

${table(
  ["Field", "Applies to", "Meaning"],
  [
    ["`name`", "all", "Column header in the data. Letters, digits, `_`, `-` and `.` only; unique, ignoring case."],
    ["`type`", "all", ATTRIBUTE_TYPES.map((type) => `\`${type}\``).join(", ")],
    ["`label`", "all", "Human-readable label per language."],
    ["`description`", "all", "What the attribute records, per language."],
    ["`required`", "all", "`true` when every row must have a value."],
    ["`sensitive`", "all", "`true` for personal or confidential data: names, contact details, exact locations, identifiers of people."],
    ["`unit`", "Numeric, DateTime and their arrays", "UCUM code, exactly as returned by `search_ucum_units` (case matters)."],
    ["`format`", "all but Boolean", "Regular expression for Text, Numeric and DateTime; media type for Binary. Prefer rules from `search_format_rules`."],
    ["`character_encoding`", "all", CHARACTER_ENCODINGS.map((encoding) => `\`${encoding}\``).join(", ")],
    ["`cardinality`", "Array types", "`{\"min\": 1, \"max\": 3}`; omit `max` for no upper limit, use the same value for an exact count."],
    ["`entry_codes`", "all but Boolean and Binary", "The only allowed values: `[{\"code\": \"CTRL\", \"label\": {\"en\": \"Control\"}}]`. Every code needs a label in every language; use the code itself if nothing better fits."],
    ["`example`", "all", "An example value: a string for every language, or one per language."]
  ]
)}

## Text rules

- Names, labels, descriptions, codes and examples must be single lines without tabs.
- Names, labels and descriptions cannot contain \`\\-\`, \`\\'\`, \`\\"\` or \`\\\\\`: OCA Composer
  drops the backslash.
- Format rules are regular expressions: backslashes are kept as written.

## What the build sends where

\`validate_schema_spec\` runs locally. \`build_oca_package\` sends the schema (not any data) to
the OCA bundle service to compute its digests: names, labels, descriptions, entry codes, format
rules and examples. Examples of sensitive attributes are sent and published with the schema, so
use made-up values. The service is \`${DEFAULT_BUNDLE_SERVICE_URL}\` unless the server is
started with \`OCA_REPOSITORY_API_URL\`; \`OCA_BUNDLE_TIMEOUT_MS\` sets the timeout.

## Not supported yet

Child schemas, framing overlays, form information, ranges and data separators. Build the base
schema here, then add those in OCA Composer.

## Languages

${table(
  ["Code", "Also accepted", "Language"],
  SUPPORTED_LANGUAGES.map(({ code, code3, name }) => [`\`${code}\``, `\`${code3}\``, name])
)}

## Classification codes

${table(["Code", "Name", "Level"], classificationRows())}
`;
