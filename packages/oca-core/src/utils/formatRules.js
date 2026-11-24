import {
  formatCodeBinaryDescription,
  formatCodeDateDescription,
  formatCodeNumericDescription,
  formatCodeTextDescription
} from "../constants/constants";

export const getFormatRuleDescription = (attributeType, formatRule, t = null) => {
  if (!formatRule) return "";
  // Unescape backslash-escaped quotes to match against our clear-text dictionary keys.
  // We don't use 'normalizeEscapedQuotes' here to avoid destructive removal of regex metadata like \-.
  // eslint-disable-next-line quotes
  const normalizedRule = formatRule.replace(/\\"/g, '"');

  // Extract the underlying data type, stripping away "Array[]" wrappers if present.
  // e.g. "Array[Text]" becomes "Text".
  const baseType = attributeType?.includes("Array")
    ? attributeType.replace(/Array\[|\]/g, "")
    : attributeType || "";

  const description = baseType.includes("Date")
    ? formatCodeDateDescription[normalizedRule]
    : baseType.includes("Numeric")
      ? formatCodeNumericDescription[normalizedRule]
      : baseType.includes("Binary")
        ? formatCodeBinaryDescription[normalizedRule]
        : baseType.includes("Text") || baseType === "Text"
          ? formatCodeTextDescription[normalizedRule]
          : "";

  if (description && t) {
    return t(description, { defaultValue: description });
  }
  return description;
};
