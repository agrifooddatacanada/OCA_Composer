/**
 * Example value validation
 *
 * Validates example overlay values against the range, format, decimal, and array
 * delimiter overlays. Shared by the View Schema page and the Example overlay page
 * so both surface identical warnings.
 */

import { Duration } from "luxon";
import {
  isValidNumber,
  parseDateString,
  getFormatRuleDescription
} from "./helpers";
import { matchFormat } from "../OCADataValidator/utils/matchRules";
import { getFormatPatternForDecimalSeparator } from "../OCADataValidator/utils/decimalFormatPattern";
import {
  collectArrayDelimitersOutsideQuotes,
  formatDelimiterForMessage
} from "../OCADataValidator/utils/arrayDelimiterOverlay";
import { getMapValueForAttributeName } from "./stringUtils";

/**
 * Checks an example value against a range overlay's bounds.
 * Mirrors the numeric/DateTime logic used in OCADataValidator/validator.js.
 *
 * @returns {{ messageKey: string, params: object } | null} A translatable
 *   problem descriptor, or null when the value satisfies the range.
 */
function checkExampleAgainstRange(attrType, value, range) {
  const { lower, upper, lower_inclusive, upper_inclusive } = range || {};

  if (attrType.includes("Numeric")) {
    if (!isValidNumber(value)) return null;
    const num = Number.parseFloat(value);

    if (isValidNumber(lower)) {
      const lowerBound = Number.parseFloat(lower);
      if (num < lowerBound) {
        return { messageKey: "is below the lower bound {{bound}}", params: { bound: lowerBound } };
      }
      if (!lower_inclusive && num === lowerBound) {
        return { messageKey: "equals the exclusive lower bound {{bound}}", params: { bound: lowerBound } };
      }
    }

    if (isValidNumber(upper)) {
      const upperBound = Number.parseFloat(upper);
      if (num > upperBound) {
        return { messageKey: "is above the upper bound {{bound}}", params: { bound: upperBound } };
      }
      if (!upper_inclusive && num === upperBound) {
        return { messageKey: "equals the exclusive upper bound {{bound}}", params: { bound: upperBound } };
      }
    }
    return null;
  }

  if (attrType.includes("DateTime")) {
    const valueDate = parseDateString(value);
    if (!valueDate) return null;
    const lowerDate = lower ? parseDateString(lower) : null;
    const upperDate = upper ? parseDateString(upper) : null;
    const isDuration = Duration.isDuration(valueDate);
    const valueComparable = isDuration ? valueDate.as("milliseconds") : valueDate;

    if (lowerDate) {
      const lowerComparable = isDuration ? lowerDate.as("milliseconds") : lowerDate;
      if (valueComparable < lowerComparable) {
        return { messageKey: "is before the lower bound {{bound}}", params: { bound: lower } };
      }
      if (!lower_inclusive && valueDate.equals(lowerDate)) {
        return { messageKey: "equals the exclusive lower bound {{bound}}", params: { bound: lower } };
      }
    }

    if (upperDate) {
      const upperComparable = isDuration ? upperDate.as("milliseconds") : upperDate;
      if (valueComparable > upperComparable) {
        return { messageKey: "is after the upper bound {{bound}}", params: { bound: upper } };
      }
      if (!upper_inclusive && valueDate.equals(upperDate)) {
        return { messageKey: "equals the exclusive upper bound {{bound}}", params: { bound: upper } };
      }
    }
    return null;
  }

  return null;
}

/**
 * Checks an example value against the schema's decimal (Data Separator) overlay.
 * Only applies to Numeric attributes: a numeric example should use the schema's
 * configured decimal separator and not the alternative one.
 *
 * @returns {{ messageKey: string, params: object } | null} A translatable
 *   problem descriptor, or null when the value uses the expected separator.
 */
function checkExampleAgainstDecimal(attrType, value, decimalSeparator) {
  if (!attrType.includes("Numeric")) return null;

  const expected = decimalSeparator || ".";
  // The decimal-separator characters that would be wrong if present in the value.
  const wrongSeparators = [".", ","].filter((char) => char !== expected);
  const usedWrong = wrongSeparators.find((char) => value.includes(char));
  if (!usedWrong) return null;

  // Only flag values that are otherwise valid numbers once the wrong separator is
  // interpreted as the decimal point — free-text values are left to the format check.
  const normalized = value.split(usedWrong).join(".");
  if (!isValidNumber(normalized)) return null;

  return {
    messageKey: "uses \"{{found}}\" as the decimal separator but the schema expects \"{{separator}}\"",
    params: { found: usedWrong, separator: expected }
  };
}

/**
 * Checks an example value against the attribute's array delimiter overlay.
 * Only applies to Array attributes: when the example lists multiple items it
 * should separate them with the schema's configured delimiter. Mirrors the
 * warning logic in OCADataValidator/utils/arrayDelimiterOverlay.js.
 *
 * @returns {{ messageKey: string, params: object } | null} A translatable
 *   problem descriptor, or null when the value uses the expected delimiter.
 */
function checkExampleAgainstArrayDelimiter(attrType, value, expectedDelim, decimalSeparator) {
  if (!attrType.includes("Array")) return null;
  if (!expectedDelim) return null;

  const expected = expectedDelim.length === 1 ? expectedDelim : expectedDelim[0];
  const found = collectArrayDelimitersOutsideQuotes(value);
  // For numeric arrays the decimal separator (e.g. ",") would otherwise be
  // mistaken for an array delimiter, so ignore it here (e.g. "10,6; 11,5").
  if (attrType.includes("Numeric") && decimalSeparator && decimalSeparator !== expected) {
    found.delete(decimalSeparator);
  }
  // No delimiters means a single-item value — nothing to compare against.
  if (found.size === 0) return null;
  if (found.size === 1 && found.has(expected)) return null;

  if (found.size === 1) {
    const [actual] = [...found];
    return {
      messageKey: "uses the array delimiter \"{{found}}\" but the schema expects \"{{separator}}\"",
      params: {
        found: formatDelimiterForMessage(actual),
        separator: formatDelimiterForMessage(expected)
      }
    };
  }

  return {
    messageKey: "uses multiple array delimiters but the schema expects \"{{separator}}\"",
    params: { separator: formatDelimiterForMessage(expected) }
  };
}

/**
 * Validates example overlay values against the range, format, and decimal
 * overlays when those overlays are present for an attribute. Empty examples and
 * child-schema references are skipped. Returns one issue per (attribute,
 * language) mismatch.
 *
 * @param {object} args
 * @param {Array}   args.attributes        Schema attributes ([{ Attribute, Type }, ...]).
 * @param {object}  args.attributeFormats  Map of attribute name -> format rule.
 * @param {object}  args.attributeRanges   Map of attribute name -> { lower, upper, lower_inclusive, upper_inclusive }.
 * @param {object}  args.exampleData       Map of attribute name -> { language -> example value }.
 * @param {Array}   args.languages         Languages to check (falls back to whatever examples exist).
 * @param {string}  args.decimalSeparator     Schema's configured decimal separator (Data Separator overlay).
 * @param {boolean} args.enableDecimal         Whether the decimal (Data Separator) overlay is active.
 * @param {object}  args.arrayDelimiterData    Map of attribute name -> array delimiter character.
 * @param {boolean} args.enableArrayDelimiter  Whether the array delimiter (Data Separator) overlay is active.
 * @returns {Array<{ attribute, language, value, type, messageKey, params }>}
 */
export function validateExampleValuesAgainstOverlays({
  attributes = [],
  attributeFormats = {},
  attributeRanges = {},
  exampleData = {},
  languages = [],
  decimalSeparator = ".",
  enableDecimal = false,
  arrayDelimiterData = {},
  enableArrayDelimiter = false
}) {
  const issues = [];

  attributes.forEach((attr) => {
    const attrName = attr?.Attribute;
    if (!attrName) return;

    const attrType = attr?.Type || "";
    // Skip references to child schemas — examples don't apply to them.
    if (attrType.startsWith("refs:") || attrType.startsWith("refn:")) return;

    const formatRule = getMapValueForAttributeName(attributeFormats, attrName);
    const hasFormatRule = !!formatRule && String(formatRule).trim() !== "";

    const range = getMapValueForAttributeName(attributeRanges, attrName) || {};
    const hasRange =
      (range.lower !== undefined && String(range.lower).trim() !== "") ||
      (range.upper !== undefined && String(range.upper).trim() !== "");

    const arrayDelim = enableArrayDelimiter
      ? getMapValueForAttributeName(arrayDelimiterData, attrName) || ""
      : "";
    const hasArrayDelim = String(arrayDelim).trim() !== "";

    if (!hasFormatRule && !hasRange && !enableDecimal && !hasArrayDelim) return;

    const attrExamples = exampleData[attrName] || {};
    const langKeys =
      languages.length > 0 ? languages : Object.keys(attrExamples);

    langKeys.forEach((lang) => {
      const rawValue = attrExamples[lang];
      if (rawValue === undefined || rawValue === null || String(rawValue).trim() === "") {
        return;
      }
      const value = String(rawValue);

      // Decimal (Data Separator) overlay agreement. Evaluated first because a
      // wrong decimal separator also breaks the numeric format check; when that's
      // the root cause we report only the (more specific) decimal issue below.
      const decimalProblem = enableDecimal
        ? checkExampleAgainstDecimal(attrType, value, decimalSeparator)
        : null;
      if (decimalProblem) {
        issues.push({
          attribute: attrName,
          language: lang,
          value,
          type: "decimal",
          messageKey: decimalProblem.messageKey,
          params: decimalProblem.params
        });
      }

      // Format overlay agreement. For Numeric attributes the format pattern's
      // decimal point is adapted to the schema's decimal separator so that values
      // like "10,6" validate against a comma-based schema (mirrors validator.js).
      // Skipped when the decimal check already flagged the value to avoid a
      // redundant second message for the same underlying problem.
      const isNumeric = attrType.includes("Numeric");
      const effectiveFormat = isNumeric
        ? getFormatPatternForDecimalSeparator(formatRule, decimalSeparator)
        : formatRule;
      if (!decimalProblem && hasFormatRule && !matchFormat(attrType, effectiveFormat, value, false)) {
        // Plain-English description of the rule (translation key) when available,
        // otherwise fall back to the raw rule so the user still sees the expectation.
        const formatDescription = getFormatRuleDescription(attrType, formatRule);
        const expectedFormat = formatDescription || formatRule;
        issues.push({
          attribute: attrName,
          language: lang,
          value,
          type: "format",
          messageKey: "does not match the expected format ({{format}})",
          params: { format: expectedFormat, formatIsDescription: !!formatDescription }
        });
      }

      // Range overlay agreement.
      if (hasRange) {
        const rangeProblem = checkExampleAgainstRange(attrType, value, range);
        if (rangeProblem) {
          issues.push({
            attribute: attrName,
            language: lang,
            value,
            type: "range",
            messageKey: rangeProblem.messageKey,
            params: rangeProblem.params
          });
        }
      }

      // Array delimiter (Data Separator) overlay agreement.
      if (hasArrayDelim) {
        const arrayProblem = checkExampleAgainstArrayDelimiter(attrType, value, arrayDelim, decimalSeparator);
        if (arrayProblem) {
          issues.push({
            attribute: attrName,
            language: lang,
            value,
            type: "array",
            messageKey: arrayProblem.messageKey,
            params: arrayProblem.params
          });
        }
      }
    });
  });

  return issues;
}
