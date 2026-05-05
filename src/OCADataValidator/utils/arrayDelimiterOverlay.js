/**
 * Collects which array delimiter characters appear outside quotes (comma, semicolon, pipe, tab).
 * @param {string} raw
 * @returns {Set<string>}
 */
export function collectArrayDelimitersOutsideQuotes(raw) {
  const found = new Set();
  if (raw == null || raw === "") return found;
  let insideQuotes = false;
  const str = String(raw);
  for (let i = 0; i < str.length; i++) {
    const c = str[i];
    if (c === "\"") {
      insideQuotes = !insideQuotes;
    } else if (!insideQuotes && (c === "\t" || c === "," || c === ";" || c === "|")) {
      found.add(c);
    }
  }
  return found;
}

/**
 * @param {string} d - delimiter character
 * @returns {string} Human-readable delimiter for messages
 */
export function formatDelimiterForMessage(d) {
  if (d === "\t") return "\\t";
  if (d === " ") return "space";
  return d;
}

/**
 * @param {string} raw - Cell value
 * @param {string} expectedDelim - Schema array delimiter (single character, may be tab)
 * @returns {string|null} Warning message, or null if no mismatch
 */
export function getArrayDelimiterMismatchMessage(raw, expectedDelim) {
  if (!expectedDelim) return null;
  const expected = expectedDelim.length === 1 ? expectedDelim : expectedDelim[0];
  const found = collectArrayDelimitersOutsideQuotes(raw);
  if (found.size === 0) return null;
  if (found.size === 1 && found.has(expected)) return null;
  if (found.size === 1 && !found.has(expected)) {
    const [actual] = [...found];
    return `Warning: Array delimiter in data is "${formatDelimiterForMessage(actual)}" but the schema specifies "${formatDelimiterForMessage(expected)}".`;
  }
  return `Warning: Multiple array delimiters found in the value; the schema expects "${formatDelimiterForMessage(expected)}".`;
}