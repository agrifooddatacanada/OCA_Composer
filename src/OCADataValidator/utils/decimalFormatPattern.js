/**
 * Escapes a character for use as a literal in a regex pattern.
 * @param {string} char - Single character to escape.
 * @returns {string} Escaped string for regex.
 */
export function escapeForRegex(char) {
  return char.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Adapts the format regex to the schema's decimal separator (strict validation).
 * When schema decimal is not '.', escaped dots (\\.) in the pattern are replaced.
 * @param {string} pattern - Format regex pattern (e.g. "^\d+\.\d+$").
 * @param {string} decimalSeparator - Schema decimal separator (e.g. '.' or ',').
 * @returns {string|null|undefined} Pattern with decimal part updated, or original if dot or no pattern.
 */
export function getFormatPatternForDecimalSeparator(pattern, decimalSeparator) {
  if (!pattern || decimalSeparator === ".") return pattern;
  return pattern.replace(/\\\./g, escapeForRegex(decimalSeparator));
}
