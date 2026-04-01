import { ADC, DECIMAL_SEPARATOR } from "../../constants/constants";

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

/**
 * Reads decimal separator from the OCA package's decimal_separator overlay (ADC extension).
 * @param {object|null|undefined} OCAPackage
 * @returns {string}
 */
export function getDecimalSeparatorFromOCAPackage(OCAPackage) {
  const captureBaseSaid = OCAPackage?.oca_bundle?.bundle?.capture_base?.d;
  const decimalSeparatorOverlay =
    OCAPackage?.extensions?.[ADC]?.[captureBaseSaid]?.overlays?.[DECIMAL_SEPARATOR];
  return decimalSeparatorOverlay?.decimal_separator ?? ".";
}
