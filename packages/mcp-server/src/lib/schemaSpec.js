import { z } from "zod";
import {
  dataTypes,
  descriptionToFormatCodeBinary,
  displayValues,
  divisionCodes,
  groupCodes,
  isUnitEligibleAttributeType,
  matchFormat,
  matchRegex,
  ucumUnits
} from "@oca-composer/oca-core";
import { findLanguage, SUPPORTED_LANGUAGES } from "./languages.js";

export const ATTRIBUTE_TYPES = dataTypes.filter((type) => type !== "Child Schema");
export const CHARACTER_ENCODINGS = displayValues.filter(Boolean);
export const ATTRIBUTE_NAME_PATTERN = /^[A-Za-z0-9_.-]+$/;

const BINARY_FORMATS = new Set(Object.values(descriptionToFormatCodeBinary).filter(Boolean));
const CLASSIFICATION_CODES = new Set(
  [...Object.values(divisionCodes), ...Object.values(groupCodes)].filter(Boolean)
);
const UCUM_CODES = new Set(ucumUnits.map((unit) => unit.code));
// eslint-disable-next-line no-control-regex
const CONTROL_CHARACTERS = /[\u0000-\u001f\u007f]/;
// Names, labels and descriptions pass through normalizeEscapedQuotes on export and import.
const UNESCAPED_SEQUENCES = /\\[-'"\\]/;
const MAX_LISTED = 10;

const localizedText = (what) =>
  z
    .record(z.string(), z.string())
    .describe(`${what}, keyed by language code, e.g. {"en": "...", "fr": "..."}.`);

const entryCodeSpec = z.strictObject({
  code: z.string().describe("The value stored in the data, e.g. \"CTRL\"."),
  label: localizedText("What the code means, in every schema language")
});

const attributeSpec = z.strictObject({
  name: z
    .string()
    .describe(
      "Attribute name, matching the dataset column header. Letters, digits, _ - and . only."
    ),
  type: z.enum(ATTRIBUTE_TYPES),
  label: localizedText("Human-readable label").optional(),
  description: localizedText("What the attribute records").optional(),
  required: z.boolean().optional().describe("Every row must have a value."),
  sensitive: z
    .boolean()
    .optional()
    .describe("Personal or confidential data, e.g. names, emails, exact locations."),
  unit: z
    .string()
    .optional()
    .describe("UCUM unit code from search_ucum_units. Numeric and DateTime types only."),
  format: z
    .string()
    .optional()
    .describe(
      "Format rule: a regular expression for Text, Numeric and DateTime, or a media type " +
        "for Binary. Prefer rules from search_format_rules."
    ),
  character_encoding: z.enum(CHARACTER_ENCODINGS).optional(),
  cardinality: z
    .strictObject({
      min: z.number().int().min(0).optional(),
      max: z.number().int().min(1).optional()
    })
    .optional()
    .describe("How many entries an Array attribute holds. Omit max for no upper limit."),
  entry_codes: z
    .array(entryCodeSpec)
    .min(1)
    .optional()
    .describe("The only values allowed, with a label for each in every language."),
  example: z
    .union([z.string(), localizedText("Example value")])
    .optional()
    .describe("An example value; a plain string applies to every language.")
});

export const schemaSpecShape = {
  name: localizedText("Schema name"),
  description: localizedText("Schema description").optional(),
  languages: z
    .array(z.string())
    .min(1)
    .describe("Language codes, primary language first, e.g. [\"en\", \"fr\"]."),
  classification: z
    .string()
    .optional()
    .describe("Research classification code, e.g. \"RDF401\" (see oca://reference/schema-spec)."),
  attributes: z.array(attributeSpec).min(1)
};

export const schemaSpecSchema = z.strictObject(schemaSpecShape);

const baseTypeOf = (type) => type.replace(/^Array\[(.+)\]$/, "$1");
const isArrayType = (type) => /^Array\[.+\]$/.test(type);

const listNames = (names) =>
  names.length > MAX_LISTED
    ? `${names.slice(0, MAX_LISTED).join(", ")} and ${names.length - MAX_LISTED} more`
    : names.join(", ");

/**
 * Checks a structurally valid spec (see schemaSpecSchema) for problems zod cannot express:
 * unknown languages, units and classifications, invalid format rules, rules that do not
 * apply to an attribute's type, and anything the OCA DSL cannot carry.
 *
 * @returns {{ errors: {path: string, message: string}[], warnings: {path: string, message: string}[] }}
 */
export function checkSchemaSpec(spec) {
  const errors = [];
  const warnings = [];
  const error = (path, message) => errors.push({ path, message });
  const warn = (path, message) => warnings.push({ path, message });

  const declared = new Map();
  spec.languages.forEach((code, index) => {
    const language = findLanguage(code);
    if (!language) {
      error(
        `languages[${index}]`,
        `"${code}" is not a supported language code. Use an ISO 639-1 code such as "en" or ` +
          "\"fr\"; oca://reference/schema-spec lists them all."
      );
    } else if (declared.has(language.code3)) {
      error(`languages[${index}]`, `${language.name} is listed more than once.`);
    } else {
      declared.set(language.code3, language);
    }
  });
  const declaredList = spec.languages.map((code) => `"${code}"`).join(", ");

  const checkText = (text, path, { display = false } = {}) => {
    if (CONTROL_CHARACTERS.test(text)) {
      error(path, "Must be a single line without tabs or other control characters.");
    }
    if (display && UNESCAPED_SEQUENCES.test(text)) {
      error(
        path,
        "OCA Composer drops the backslash in \\-, \\', \\\" and \\\\; remove it or the text changes."
      );
    }
  };

  // Returns the declared languages that have no non-blank text.
  const checkLocalized = (value, path, { display = true } = {}) => {
    const present = new Set();
    Object.entries(value || {}).forEach(([key, text]) => {
      const language = findLanguage(key);
      if (!language || !declared.has(language.code3)) {
        error(`${path}.${key}`, `"${key}" is not one of the schema's languages (${declaredList}).`);
        return;
      }
      if (present.has(language.code3)) {
        error(`${path}.${key}`, `${language.name} is given more than once.`);
        return;
      }
      checkText(text, `${path}.${key}`, { display });
      if (text.trim() !== "") present.add(language.code3);
    });
    return [...declared.values()].filter((language) => !present.has(language.code3));
  };

  const missingName = checkLocalized(spec.name, "name");
  if (declared.size > 0 && missingName.length === declared.size) {
    error("name", "Give the schema a name in at least one of its languages.");
  } else if (missingName.length > 0) {
    warn(
      "name",
      `No name in ${listNames(missingName.map((l) => l.name))}; the first available name is used.`
    );
  }
  checkLocalized(spec.description, "description");

  if (spec.classification !== undefined && !CLASSIFICATION_CODES.has(spec.classification)) {
    error(
      "classification",
      `"${spec.classification}" is not a known classification code. Use a code such as ` +
        "\"RDF401\" from oca://reference/schema-spec, or leave it out."
    );
  }

  const seenNames = new Map();
  const missingLabels = new Map();
  spec.attributes.forEach((attribute, index) => {
    const path = `attributes[${index}]`;
    const { name, type } = attribute;
    const baseType = baseTypeOf(type);

    if (!ATTRIBUTE_NAME_PATTERN.test(name)) {
      error(
        `${path}.name`,
        `"${name}" may only contain letters, digits, underscores, hyphens and periods.`
      );
    }
    const lower = name.toLowerCase();
    if (seenNames.has(lower)) {
      error(`${path}.name`, `"${name}" is already used by attributes[${seenNames.get(lower)}].`);
    } else {
      seenNames.set(lower, index);
    }

    checkLocalized(attribute.label, `${path}.label`).forEach((language) => {
      if (!missingLabels.has(language.name)) missingLabels.set(language.name, []);
      missingLabels.get(language.name).push(name);
    });
    checkLocalized(attribute.description, `${path}.description`);

    if (attribute.unit !== undefined) {
      if (!isUnitEligibleAttributeType(type)) {
        error(`${path}.unit`, `Units apply to Numeric and DateTime attributes, not ${type}.`);
      } else if (!UCUM_CODES.has(attribute.unit)) {
        const caseMatch = ucumUnits.find(
          (unit) => unit.code.toLowerCase() === attribute.unit.toLowerCase()
        );
        const hint = caseMatch
          ? ` (did you mean "${caseMatch.code}"?).`
          : ". Find one with search_ucum_units.";
        error(`${path}.unit`, `"${attribute.unit}" is not a UCUM unit code${hint}`);
      }
    }

    if (attribute.format !== undefined) {
      if (baseType === "Boolean") {
        error(`${path}.format`, "Boolean attributes cannot have a format rule.");
      } else if (baseType === "Binary") {
        if (!BINARY_FORMATS.has(attribute.format)) {
          error(
            `${path}.format`,
            `"${attribute.format}" is not a supported media type. Find one with ` +
              "search_format_rules (type Binary)."
          );
        }
      } else {
        try {
          matchRegex(attribute.format, "");
        } catch (regexError) {
          error(`${path}.format`, `Not a valid regular expression: ${regexError.message}`);
        }
      }
      checkText(attribute.format, `${path}.format`);
    }

    if (attribute.cardinality !== undefined) {
      const { min, max } = attribute.cardinality;
      if (!isArrayType(type)) {
        error(`${path}.cardinality`, `Cardinality applies to Array types, not ${type}.`);
      } else if (min === undefined && max === undefined) {
        error(`${path}.cardinality`, "Give min, max or both.");
      } else if (min !== undefined && max !== undefined && min > max) {
        error(`${path}.cardinality`, `min (${min}) is greater than max (${max}).`);
      }
    }

    if (attribute.entry_codes !== undefined) {
      if (baseType === "Boolean" || baseType === "Binary") {
        error(`${path}.entry_codes`, `${type} attributes cannot have entry codes.`);
      }
      const seenCodes = new Set();
      attribute.entry_codes.forEach((entry, codeIndex) => {
        const codePath = `${path}.entry_codes[${codeIndex}]`;
        const code = entry.code.trim();
        if (code === "") {
          error(`${codePath}.code`, "Entry codes cannot be blank.");
        } else if (seenCodes.has(code)) {
          error(`${codePath}.code`, `"${code}" is listed more than once.`);
        } else {
          seenCodes.add(code);
        }
        if (code !== entry.code) {
          error(`${codePath}.code`, "Entry codes cannot start or end with spaces.");
        }
        checkText(entry.code, `${codePath}.code`);
        const missing = checkLocalized(entry.label, `${codePath}.label`);
        if (missing.length > 0) {
          error(
            `${codePath}.label`,
            `Missing a label in ${listNames(missing.map((l) => l.name))}. Use the code itself ` +
              "if there is nothing better."
          );
        }
      });
      if (attribute.format !== undefined) {
        warn(
          `${path}.format`,
          "Ignored when validating data: values are checked against the entry codes instead."
        );
      }
    }

    if (attribute.example !== undefined) {
      const examples =
        typeof attribute.example === "string"
          ? [[`${path}.example`, attribute.example]]
          : Object.entries(attribute.example).map(([key, value]) => [
              `${path}.example.${key}`,
              value
            ]);
      if (typeof attribute.example === "string") {
        checkText(attribute.example, `${path}.example`);
      } else {
        checkLocalized(attribute.example, `${path}.example`, { display: false });
      }
      if (attribute.sensitive) {
        warn(`${path}.example`, "This attribute is sensitive; its example is published with the schema.");
      }
      if (!isArrayType(type)) {
        const codes = attribute.entry_codes?.map((entry) => entry.code);
        examples.forEach(([examplePath, value]) => {
          if (value.trim() === "") return;
          if (codes) {
            if (!codes.includes(value)) {
              warn(examplePath, `"${value}" is not one of the entry codes.`);
            }
            return;
          }
          if (attribute.format === undefined || baseType === "Binary") return;
          let matches = true;
          try {
            matches = matchFormat(type, attribute.format, value, false);
          } catch {
            // An invalid format rule is reported above.
          }
          if (!matches) warn(examplePath, `"${value}" does not match the format rule.`);
        });
      }
    }
  });

  missingLabels.forEach((names, languageName) => {
    warn(
      "attributes",
      `No ${languageName} label for ${names.length} attribute${
        names.length === 1 ? "" : "s"
      }: ${listNames(names)}.`
    );
  });

  return { errors, warnings };
}

export { SUPPORTED_LANGUAGES };
