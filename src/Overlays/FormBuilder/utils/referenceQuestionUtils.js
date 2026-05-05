import { isChildSchemaType } from "../../../constants/constants";

const parseArrayTypeString = (type) => {
  if (typeof type !== "string") return "";
  const trimmed = type.trim();
  const arrayMatch = trimmed.match(/^Array\[(.+)\]$/i);
  return arrayMatch ? arrayMatch[1].trim() : trimmed;
};

/**
 * Normalizes a schema or overlay `type` token, including `Array[inner]` and array DSL forms.
 */
export const getNormalizedTypeToken = (type) => {
  if (Array.isArray(type)) {
    if (type.length === 0) return "";
    return getNormalizedTypeToken(type[0]);
  }
  if (typeof type !== "string") return "";
  return parseArrayTypeString(type);
};

/**
 * True when the Form Builder question should be treated as a child/reference field for overlay args and UI.
 */
export const isReferenceQuestionType = (type) => {
  const normalized = getNormalizedTypeToken(type);
  if (!normalized) return false;

  const lowered = normalized.toLowerCase();
  if (
    lowered === "reference" ||
    lowered === "childschema" ||
    lowered === "placeholderchildschema"
  ) {
    return true;
  }
  return isChildSchemaType(normalized);
};

/**
 * True when any relevant question type token should be treated as reference/child schema.
 */
export const isReferenceQuestion = (question = {}) =>
  isReferenceQuestionType(question.attributeType) ||
  isReferenceQuestionType(question.type) ||
  isReferenceQuestionType(question.interactionType);

/**
 * Sanitize `showing_attribute` for export/import: non-empty trimmed strings, deduped in order.
 */
export const normalizeShowingAttribute = (showingAttribute) => {
  if (!showingAttribute) return [];

  const values = Array.isArray(showingAttribute)
    ? showingAttribute
    : String(showingAttribute).split(",");

  const result = [];
  const seen = new Set();

  values.forEach((value) => {
    const trimmed = String(value || "").trim();
    if (!trimmed || seen.has(trimmed)) return;
    seen.add(trimmed);
    result.push(trimmed);
  });

  return result;
};

/**
 * Normalize reference button labels from UI state or legacy overlay forms into a language-keyed map.
 */
export const normalizeReferenceButtonTextMap = (referenceButtonText, languages = []) => {
  if (!referenceButtonText) return {};

  const normalized = {};

  if (typeof referenceButtonText === "string") {
    const trimmed = referenceButtonText.trim();
    if (!trimmed) return {};

    if (languages.length > 0) {
      languages.forEach((lang) => {
        normalized[lang] = trimmed;
      });
    } else {
      normalized.default = trimmed;
    }
    return normalized;
  }

  if (typeof referenceButtonText !== "object") return {};

  Object.entries(referenceButtonText).forEach(([key, value]) => {
    if (typeof value !== "string") return;
    const trimmed = value.trim();
    if (trimmed) {
      normalized[key] = trimmed;
    }
  });

  return normalized;
};
