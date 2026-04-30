import { languageCodesObject } from "../constants/isoCodes";

export function getPicklistCodeColumnOptions(picklist) {
  if (!picklist) return [];
  if (Array.isArray(picklist.headers) && picklist.headers.length > 0) {
    return [...new Set(picklist.headers.filter(Boolean))];
  }
  const keys = new Set();
  (picklist.rows || []).forEach((row) => {
    if (row && typeof row === "object") {
      Object.keys(row).forEach((k) => keys.add(k));
    }
  });
  return [...keys];
}

export function matchingFunction(pool, attr) {
  for (let i = 0; i < pool.length; i += 1) {
    if (pool[i].toLowerCase() === attr.toLowerCase()) {
      return i;
    }
  }
  for (let i = 0; i < pool.length; i += 1) {
    if (pool[i].toLowerCase().includes(attr.toLowerCase())) {
      return i;
    }
  }
  return -1;
}

export function defaultPicklistColumnForField(fieldName, options, languageTo2Letter) {
  if (!options.length) return "";
  if (fieldName === "Code") {
    return options.includes("Code") ? "Code" : options[0];
  }
  const iso = languageTo2Letter[fieldName];
  if (iso && options.includes(iso)) return iso;
  const idx = matchingFunction(options, fieldName);
  return idx !== -1 ? options[idx] : "";
}

export function buildLanguageTo2Letter(languages) {
  const map = {};
  (languages || []).forEach((langName) => {
    const code = languageCodesObject?.[langName.toLowerCase()];
    if (code) map[langName] = code;
  });
  return map;
}

export function shouldSkipPicklistMatching(picklist, languages) {
  const opts = getPicklistCodeColumnOptions(picklist).filter(Boolean);
  if (opts.length === 0) return false;

  const normalizedLanguages = (languages || []).map((lang) => String(lang).toLowerCase());
  if (normalizedLanguages.some((lang) => lang !== "english" && lang !== "french")) {
    return false;
  }

  const allowedColumns = new Set(["code", "english", "french", "en", "fr"]);
  const normalizedColumns = opts.map((col) => String(col).toLowerCase());
  if (normalizedColumns.some((col) => !allowedColumns.has(col))) {
    return false;
  }

  if (!normalizedColumns.includes("code")) return false;

  if (
    normalizedLanguages.includes("english") &&
    !normalizedColumns.includes("english") &&
    !normalizedColumns.includes("en")
  ) {
    return false;
  }

  if (
    normalizedLanguages.includes("french") &&
    !normalizedColumns.includes("french") &&
    !normalizedColumns.includes("fr")
  ) {
    return false;
  }

  return true;
}
