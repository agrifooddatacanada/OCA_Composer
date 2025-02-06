import { ALLOWED_BOOLEAN_VALUES } from "../../constants/constants";

/**
 * Parses a regex pattern string to extract the main pattern and its modifiers (flags).
 *
 * This function takes into account that some regex pattern strings may contain
 * modifiers (e.g., "/gm"). It captures the main regex pattern and any associated
 * flags, while also handling an optional trailing slash at the end of the string.
 *
 * @param {string} patternString - The regex pattern string to be parsed. This string can include flags at the end.
 *
 * @returns {Object} An object containing:
 *    - {string} pattern: The extracted regex pattern.
 *    - {string} flags: The extracted modifiers (flags) for the regex.
 *
 * @example
 * const result = parseRegexPattern("^([01][0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/gm");
 * // Output: { pattern: "^([01][0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$", flags: "gm" }
 *
 * @example
 * const result = parseRegexPattern("invalid pattern");
 * // Output: { pattern: "", flags: "" }
 */
function parseRegexPattern(patternString) {
  const regex = /^(.*?)(\/)?([gmiuy]*)$/;
  const match = patternString.match(regex);

  if (match) {
    const pattern = match[1].trim();
    const flags = match[3] || "";

    return { pattern, flags };
  }

  return { pattern: "", flags: "" };
}

export function matchRegex(pattern, dataStr) {
  if (!pattern) {
    return true;
  }

  const parsedRegex = parseRegexPattern(pattern);

  return new RegExp(parsedRegex.pattern, parsedRegex.flags).test(dataStr);
}

export function matchDatetime(pattern, dataStr) {
  return matchRegex(pattern, dataStr);
}

export function matchNumeric(pattern, dataStr) {
  return matchRegex(pattern, dataStr);
}

export function matchText(pattern, dataStr) {
  return matchRegex(pattern, dataStr);
}

function matchBoolean(dataStr) {
  // Idealy only "true" and "false" would pass.
  return ALLOWED_BOOLEAN_VALUES.includes(dataStr);
}

export function matchFormat(attrType, pattern, dataStr, hasEntryCodes) {
  if (attrType.includes("DateTime")) {
    return matchDatetime(pattern, dataStr);
  }
  if (attrType.includes("Numeric")) {
    return matchNumeric(pattern, dataStr);
  }
  if (attrType.includes("Text")) {
    return matchText(pattern, dataStr);
  }
  // Disable boolean check for entry codes.
  if (!hasEntryCodes && attrType.includes("Boolean")) {
    return matchBoolean(dataStr);
  }
  return true;
}

function isValidUTF8(dataStr) {
  const decoder = new TextDecoder("utf-8");
  try {
    const uint8Array = new TextEncoder().encode(dataStr);
    decoder.decode(uint8Array);
    return true;
  } catch (error) {
    return false;
  }
}

function isValidUTF16LE(dataStr) {
  const decoder = new TextDecoder("utf-16le");
  try {
    const uint8Array = new TextEncoder().encode(dataStr);
    decoder.decode(uint8Array);
    return true;
  } catch (error) {
    return false;
  }
}

function isValidISO88591(dataStr) {
  const decoder = new TextDecoder("iso-8859-1");
  try {
    const buffer = new ArrayBuffer(dataStr.length);
    const uint8Array = new Uint8Array(buffer);
    for (let i = 0; i < dataStr.length; i++) {
      uint8Array[i] = dataStr.charCodeAt(i);
    }
    decoder.decode(buffer);
    return true;
  } catch (error) {
    return false;
  }
}

export function matchCharacterEncoding(dataStr, attrCharEncode) {
  if (attrCharEncode === "utf-8") {
    return isValidUTF8(dataStr);
  }
  if (attrCharEncode === "utf-16le") {
    return isValidUTF16LE(dataStr);
  }
  if (attrCharEncode === "iso-8859-1") {
    return isValidISO88591(dataStr);
  }
  return false;
}
