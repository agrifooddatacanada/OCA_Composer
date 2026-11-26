import {
  ALLOWED_BOOLEAN_VALUES,
  descriptionToFormatCodeDate,
  descriptionToFormatCodeNumeric,
  descriptionToFormatCodeText,
  matchRegex
} from "@oca-composer/oca-core";
import { ATTRIBUTE_NAME_PATTERN, checkSchemaSpec } from "./schemaSpec.js";

export const DEFAULT_MAX_ENTRY_CODES = 20;

const NUMBER = /^[-+]?(\d+(\.\d*)?|\.\d+)$/;
const COMMA_NUMBER = /^[-+]?(\d{1,3}(,\d{3})+(\.\d+)?|\d+,\d+)$/;
const DIGITS = /^\d+$/;
const LEADING_ZERO = /^[-+]?0\d/;
// eslint-disable-next-line no-control-regex
const CONTROL_CHARACTERS = /[\u0000-\u001f\u007f]/g;
const MISSING_TOKENS = new Set(["na", "n/a", "null", "none", "nan", "missing", "-", "?", "."]);
const BOOLEAN_VALUES = new Set(ALLOWED_BOOLEAN_VALUES);
const EMPTY_HEADER = /^header_empty_placeholder_\d+$/;

const INTEGER_RULE = "any integer";
const DECIMAL_RULE = "any integer or decimal number, may begin with + or -";
// Text rules specific enough to suggest on their own; the generic length and letter rules
// match almost any column.
const SPECIFIC_TEXT_RULES = [
  "Email address",
  "URL",
  "Phone number",
  "Canadian postal codes (A1A 1A1)"
];
// These two rules match anywhere in a value, so a sentence containing an address passes them.
const UNANCHORED_TEXT_RULES = new Set(["Email address", "URL"]);
const CONTACT_RULES = new Set(["Email address", "Phone number"]);

const DATE_RULES = Object.entries(descriptionToFormatCodeDate).filter(
  ([description, rule]) => description && rule
);
const AMBIGUOUS_DATE_ORDERS = [
  ["DD/MM/YYYY: day, month, year", "MM/DD/YYYY: month, day, year"],
  ["DDMMYYYY: day, month, year", "MMDDYYYY: month, day, year"]
];

// Header patterns for personal or confidential data, tested on the lowercased header with
// every run of other characters turned into "_".
const SENSITIVE_HEADERS = [
  [/(^|_)(first|last|given|family|full|middle|maiden)_?name($|_)|(^|_)surname($|_)|^name$/, "a person's name"],
  [/(^|_)(farmer|owner|person|patient|participant|respondent|contact|producer|investigator|student|employee|client|customer)_?name($|_)/, "a person's name"],
  [/e_?mail/, "an email address"],
  [/phone|mobile|(^|_)cell($|_)|(^|_)fax($|_)/, "a phone number"],
  [/address|street|postal|post_?code|(^|_)zip($|_)/, "an address"],
  [/birth|(^|_)dob($|_)/, "a date of birth"],
  [/(^|_)(ssn|sin)($|_)|social_insurance|social_security|health_card|passport|licen[cs]e_?(no|num|number)/, "a personal identifier"],
  [/^(lat|latitude|lon|lng|long|longitude)$|(^|_)gps($|_)|coordinates/, "an exact location"]
];

const normalizeHeader = (header) =>
  header
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

/** A valid, unique attribute name for each header. */
function attributeNames(headers) {
  const used = new Set();
  return headers.map((header, index) => {
    let base = EMPTY_HEADER.test(header)
      ? ""
      : header.trim().replace(/[^A-Za-z0-9_.-]+/g, "_").replace(/^_+|_+$/g, "");
    if (!base || !ATTRIBUTE_NAME_PATTERN.test(base)) base = `column_${index + 1}`;
    let name = base;
    for (let suffix = 2; used.has(name.toLowerCase()); suffix += 1) {
      name = `${base}_${suffix}`;
    }
    used.add(name.toLowerCase());
    return name;
  });
}

const allMatch = (values, rule) => values.every((value) => matchRegex(rule, value));

function inferType(candidates) {
  if (candidates.length === 0) {
    return { type: "Text", notes: ["The column has no values; Text is a placeholder."] };
  }
  if (
    candidates.every((value) => BOOLEAN_VALUES.has(value)) &&
    candidates.some((value) => !NUMBER.test(value))
  ) {
    return { type: "Boolean", notes: [] };
  }
  if (candidates.every((value) => NUMBER.test(value))) {
    if (candidates.some((value) => LEADING_ZERO.test(value))) {
      return {
        type: "Text",
        notes: ["Numbers with leading zeros (e.g. codes or identifiers) are kept as Text."]
      };
    }
    const notes = [];
    if (candidates.every((value) => /^(19|20)\d{2}$/.test(value))) {
      notes.push("All values look like years; DateTime with the \"ISO: YYYY: year\" rule may fit better.");
    } else if (
      candidates.every((value) => matchRegex(descriptionToFormatCodeDate["YYYYMMDD: year, month, day"], value))
    ) {
      notes.push("All values look like YYYYMMDD dates; consider DateTime.");
    }
    return { type: "Numeric", notes };
  }
  if (candidates.every((value) => NUMBER.test(value) || COMMA_NUMBER.test(value))) {
    return {
      type: "Numeric",
      notes: [
        "Values use commas, either as decimal or thousands separators. build_oca_package " +
          "cannot set a decimal separator yet; set it in OCA Composer, or remove the commas."
      ]
    };
  }
  if (!candidates.every((value) => DIGITS.test(value))) {
    const matching = DATE_RULES.filter(([, rule]) => allMatch(candidates, rule)).map(
      ([description]) => description
    );
    if (matching.length > 0) return { type: "DateTime", notes: [], dateRules: matching };
    const dateLike = candidates.filter((value) =>
      DATE_RULES.some(([, rule]) => matchRegex(rule, value))
    );
    if (dateLike.length * 2 >= candidates.length) {
      return {
        type: "Text",
        notes: [
          "Some values look like dates or times, but no single predefined format fits all of " +
            "them. Make the values consistent to use DateTime."
        ]
      };
    }
  }
  return { type: "Text", notes: [] };
}

function chooseFormat(type, nonEmpty, dateRules = []) {
  if (type === "Numeric") {
    const rule = [INTEGER_RULE, DECIMAL_RULE].find((description) =>
      allMatch(nonEmpty, descriptionToFormatCodeNumeric[description])
    );
    return rule ? { description: rule, rule: descriptionToFormatCodeNumeric[rule] } : null;
  }
  if (type === "DateTime") {
    const description = dateRules.find((candidate) =>
      allMatch(nonEmpty, descriptionToFormatCodeDate[candidate])
    );
    return description
      ? { description, rule: descriptionToFormatCodeDate[description], alternatives: dateRules.filter((d) => d !== description) }
      : null;
  }
  if (type === "Text") {
    const description = SPECIFIC_TEXT_RULES.find(
      (candidate) =>
        allMatch(nonEmpty, descriptionToFormatCodeText[candidate]) &&
        (!UNANCHORED_TEXT_RULES.has(candidate) || nonEmpty.every((value) => !/\s/.test(value)))
    );
    return description ? { description, rule: descriptionToFormatCodeText[description] } : null;
  }
  return null;
}

function sensitiveReason(header, format) {
  const normalized = normalizeHeader(header);
  const match = SENSITIVE_HEADERS.find(([pattern]) => pattern.test(normalized));
  if (match) return `The column name suggests ${match[1]}.`;
  if (format && CONTACT_RULES.has(format.description)) {
    return `Every value is ${format.description === "Email address" ? "an email address" : "a phone number"}.`;
  }
  return null;
}

function analyzeColumn(header, name, values, { maxEntryCodes }) {
  const nonEmpty = values.filter((value) => value.trim() !== "");
  const counts = new Map();
  nonEmpty.forEach((value) => counts.set(value, (counts.get(value) || 0) + 1));
  const missingTokens = [...counts.keys()].filter((value) =>
    MISSING_TOKENS.has(value.trim().toLowerCase())
  );
  const candidates = nonEmpty.filter((value) => !missingTokens.includes(value));
  const padded = nonEmpty.some((value) => value !== value.trim());
  const multiline = nonEmpty.some((value) => /[\r\n\t]/.test(value));

  const { type, notes, dateRules } = inferType(candidates.map((value) => value.trim()));
  const format = padded ? null : chooseFormat(type, nonEmpty, dateRules);
  if (padded) notes.push("Some values have leading or trailing spaces, so no format rule was set.");
  if (missingTokens.length > 0) {
    notes.push(
      `Missing values are written as ${missingTokens.map((token) => `"${token}"`).join(", ")}. ` +
        "Leave cells empty instead, or validation will report them."
    );
  }
  if (type === "DateTime" && format) {
    const ambiguous = AMBIGUOUS_DATE_ORDERS.find((pair) =>
      pair.every((description) => dateRules.includes(description))
    );
    if (ambiguous) {
      notes.push(
        `Both "${ambiguous[0]}" and "${ambiguous[1]}" fit every value; ask which one the data uses.`
      );
    }
  }

  const distinct = [...counts.keys()].filter((value) => !missingTokens.includes(value));
  const entryCodes =
    type === "Text" &&
    !format &&
    maxEntryCodes > 0 &&
    distinct.length > 0 &&
    distinct.length <= maxEntryCodes &&
    candidates.length >= 2 * distinct.length &&
    !padded &&
    !multiline
      ? distinct
      : null;

  const reason = sensitiveReason(header, format);
  return {
    report: {
      column: header,
      attribute: name,
      type,
      required: nonEmpty.length > 0 && nonEmpty.length === values.length,
      ...(reason ? { sensitive_reason: reason } : {}),
      ...(format ? { format: format.description } : {}),
      ...(format?.alternatives?.length ? { format_alternatives: format.alternatives } : {}),
      ...(entryCodes ? { entry_codes: entryCodes } : {}),
      ...(!entryCodes && distinct.length <= maxEntryCodes ? { distinct_values: distinct } : {}),
      values: nonEmpty.length,
      empty: values.length - nonEmpty.length,
      ...(notes.length ? { notes } : {})
    },
    format,
    entryCodes,
    sensitive: Boolean(reason)
  };
}

/**
 * Drafts a schema spec from a dataset without any model: types, format rules, entry codes,
 * required and sensitive flags from the values and headers. Labels are the column headers in
 * the first language; descriptions and units are left for the assistant to add.
 *
 * @param {{source: string, headers: string[], rows: Object[]}} dataset - From loadDataset
 * @param {Object} options
 * @param {Object[]} options.languages - Supported languages (findLanguage results), primary first
 * @param {string} options.schemaName
 * @param {number} [options.maxEntryCodes]
 */
export function inferSchemaFromDataset(
  dataset,
  { languages, schemaName, maxEntryCodes = DEFAULT_MAX_ENTRY_CODES }
) {
  const [primary] = languages;
  const names = attributeNames(dataset.headers);
  const columns = dataset.headers.map((header, index) =>
    analyzeColumn(
      header,
      names[index],
      dataset.rows.map((row) => String(row[header] ?? "")),
      { maxEntryCodes }
    )
  );

  const attributes = columns.map(({ report, format, entryCodes, sensitive }) => {
    const label = EMPTY_HEADER.test(report.column)
      ? report.attribute
      : report.column.replace(CONTROL_CHARACTERS, " ").trim();
    return {
      name: report.attribute,
      type: report.type,
      label: { [primary.code]: label },
      ...(report.required ? { required: true } : {}),
      ...(sensitive ? { sensitive: true } : {}),
      ...(format ? { format: format.rule } : {}),
      ...(entryCodes
        ? {
            entry_codes: entryCodes.map((code) => ({
              code,
              label: Object.fromEntries(languages.map((language) => [language.code, code]))
            }))
          }
        : {})
    };
  });

  const draft = {
    name: { [primary.code]: schemaName },
    languages: languages.map((language) => language.code),
    attributes
  };
  const columnMapping = Object.fromEntries(
    columns
      .filter(({ report }) => report.column !== report.attribute)
      .map(({ report }) => [report.column, report.attribute])
  );

  return {
    dataset: dataset.source,
    rows_analyzed: dataset.rows.length,
    draft_spec: draft,
    ...(Object.keys(columnMapping).length ? { column_mapping: columnMapping } : {}),
    columns: columns.map(({ report }) => report),
    check: checkSchemaSpec(draft)
  };
}
