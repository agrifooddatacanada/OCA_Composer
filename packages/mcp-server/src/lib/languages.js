import {
  langCodeOCAFromName,
  langNameFromCodeOCA,
  langTwoLettersFromName,
  languageCodesObject,
  languageNameToAlpha3Codes
} from "@oca-composer/oca-core";

/**
 * Languages a schema spec may use: those whose name, ISO 639-1 code and ISO 639-2 code map
 * onto each other in OCA Composer's tables. The export writes two-letter codes into the DSL,
 * the bundle service stores three-letter codes, and the importer maps those back to names,
 * so any other language would silently turn into English along the way.
 */
export const SUPPORTED_LANGUAGES = (() => {
  const byCode3 = new Map();
  Object.values(languageNameToAlpha3Codes).forEach((code3) => {
    if (byCode3.has(code3)) return;
    const name = langNameFromCodeOCA(code3);
    const code = name ? languageCodesObject[name.toLowerCase()] : undefined;
    if (!code || langTwoLettersFromName(name) !== code || langCodeOCAFromName(name) !== code3) {
      return;
    }
    byCode3.set(code3, { code, code3, name });
  });
  return [...byCode3.values()].sort((a, b) => a.code.localeCompare(b.code));
})();

const byAnyCode = new Map(
  SUPPORTED_LANGUAGES.flatMap((language) => [
    [language.code, language],
    [language.code3, language]
  ])
);
const byName = new Map(SUPPORTED_LANGUAGES.map((language) => [language.name, language]));

/** Look up a supported language by ISO 639-1 ("fr") or ISO 639-2 ("fra") code. */
export function findLanguage(code) {
  return typeof code === "string" ? byAnyCode.get(code.trim().toLowerCase()) : undefined;
}

/** Look up a supported language by the name OCA Composer uses for it ("French"). */
export function findLanguageByName(name) {
  return byName.get(name);
}
