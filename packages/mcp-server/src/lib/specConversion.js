import {
  FIELD_CARDINALITY_OVERLAY,
  FIELD_CHARACTER_ENCODING_OVERLAY,
  FIELD_CONFORMANCE_OVERLAY,
  FIELD_EXAMPLE_OVERLAY,
  FIELD_FORMAT_OVERLAY,
  overlayItems
} from "@oca-composer/oca-core";
import { findLanguage, findLanguageByName } from "./languages.js";

const textIn = (localized, language) => {
  const entry = Object.entries(localized || {}).find(
    ([key]) => findLanguage(key)?.code3 === language.code3
  );
  return entry ? entry[1] : "";
};

/** Cardinality as the Composer stores it: "n", "min-max", "min-" or "-max". */
export function cardinalityToString({ min, max }) {
  if (min !== undefined && min === max) return String(min);
  if (max === undefined) return `${min}-`;
  if (!min) return `-${max}`;
  return `${min}-${max}`;
}

export function cardinalityFromString(value) {
  const text = String(value ?? "").trim();
  if (!text) return undefined;
  if (!text.includes("-")) return { min: Number(text), max: Number(text) };
  const [min, max] = text.split("-").map((part) => part.trim());
  return {
    ...(min !== "" ? { min: Number(min) } : {}),
    ...(max !== "" ? { max: Number(max) } : {})
  };
}

/**
 * Converts a checked schema spec (see checkSchemaSpec) into the editor state the Composer
 * keeps per schema, which is what buildSchemaExport consumes.
 */
export function specToEditorState(spec) {
  const languages = spec.languages.map(findLanguage);
  const languageNames = languages.map((language) => language.name);
  const primaryName =
    languages.map((language) => textIn(spec.name, language)).find((name) => name.trim()) || "";

  const localized = {};
  languages.forEach((language) => {
    localized[language.code3] = {
      name: textIn(spec.name, language).trim() ? textIn(spec.name, language) : primaryName,
      description: textIn(spec.description, language)
    };
  });

  const lanAttributeRowData = {};
  languages.forEach((language) => {
    lanAttributeRowData[language.name] = spec.attributes.map((attribute) => ({
      Attribute: attribute.name,
      Label: textIn(attribute.label, language),
      Description: textIn(attribute.description, language),
      List: Boolean(attribute.entry_codes)
    }));
  });

  const entryCodes = {};
  const attributeFormats = {};
  const characterEncodingData = {};
  const attributeCardinality = {};
  const exampleData = {};
  spec.attributes.forEach((attribute) => {
    const { name } = attribute;
    if (attribute.entry_codes) {
      entryCodes[name] = attribute.entry_codes.map((entry) => ({
        Code: entry.code,
        ...Object.fromEntries(
          languages.map((language) => [language.name, textIn(entry.label, language)])
        )
      }));
    }
    if (attribute.format !== undefined) attributeFormats[name] = attribute.format;
    if (attribute.character_encoding !== undefined) {
      characterEncodingData[name] = attribute.character_encoding;
    }
    if (attribute.cardinality !== undefined) {
      attributeCardinality[name] = cardinalityToString(attribute.cardinality);
    }
    if (attribute.example !== undefined) {
      exampleData[name] = Object.fromEntries(
        languages.map((language) => [
          language.name,
          typeof attribute.example === "string"
            ? attribute.example
            : textIn(attribute.example, language)
        ])
      );
    }
  });

  const has = (map) => Object.keys(map).length > 0;
  return {
    metadata: {
      name: primaryName,
      description: "",
      languages: languageNames,
      localized,
      ...(spec.classification ? { classification: spec.classification } : {})
    },
    attributes: spec.attributes.map((attribute) => ({
      Attribute: attribute.name,
      Type: attribute.type,
      Required: Boolean(attribute.required),
      Sensitive: Boolean(attribute.sensitive),
      Unit: attribute.unit || "",
      List: Boolean(attribute.entry_codes)
    })),
    lanAttributeRowData,
    entryCodes,
    attributeFormats,
    characterEncodingData,
    attributeCardinality,
    exampleData,
    overlaySelections: {
      ...overlayItems,
      [FIELD_FORMAT_OVERLAY]: has(attributeFormats),
      [FIELD_CONFORMANCE_OVERLAY]: spec.attributes.some((attribute) => attribute.required),
      [FIELD_CARDINALITY_OVERLAY]: has(attributeCardinality),
      [FIELD_CHARACTER_ENCODING_OVERLAY]: has(characterEncodingData),
      [FIELD_EXAMPLE_OVERLAY]: has(exampleData)
    }
  };
}

const localizedFrom = (languages, textFor) => {
  const result = {};
  languages.forEach((language) => {
    const text = textFor(language);
    if (typeof text === "string" && text.trim() !== "") result[language.code] = text;
  });
  return Object.keys(result).length > 0 ? result : undefined;
};

/**
 * Reads editor state (as built by specToEditorState or parsed by OCAParser.parseSchemaData)
 * back into a schema spec in canonical form: two-letter language codes, no blank texts,
 * no false flags, and one example string when every language has the same example.
 */
export function editorStateToSpec(state) {
  const metadata = state.metadata || {};
  const languages = (metadata.languages || []).map((name) => {
    const language = findLanguageByName(name);
    if (!language) throw new Error(`The schema uses a language the spec does not support: ${name}.`);
    return language;
  });
  const rowsByLanguage = new Map(
    languages.map((language) => [
      language.code3,
      new Map(
        (state.lanAttributeRowData?.[language.name] || []).map((row) => [row.Attribute, row])
      )
    ])
  );

  const attributes = (state.attributes || []).map((row) => {
    const name = row.Attribute;
    const attribute = { name, type: row.Type };
    const label = localizedFrom(
      languages,
      (language) => rowsByLanguage.get(language.code3).get(name)?.Label
    );
    if (label) attribute.label = label;
    const description = localizedFrom(
      languages,
      (language) => rowsByLanguage.get(language.code3).get(name)?.Description
    );
    if (description) attribute.description = description;
    if (row.Required) attribute.required = true;
    if (row.Sensitive) attribute.sensitive = true;
    if (row.Unit) attribute.unit = row.Unit;
    const format = state.attributeFormats?.[name];
    if (format) attribute.format = format;
    const encoding = state.characterEncodingData?.[name];
    if (encoding) attribute.character_encoding = encoding;
    const cardinality = cardinalityFromString(state.attributeCardinality?.[name]);
    if (cardinality) attribute.cardinality = cardinality;
    const codes = row.List ? state.entryCodes?.[name] : undefined;
    if (codes?.length) {
      attribute.entry_codes = codes.map((entry) => ({
        code: entry.Code,
        label: localizedFrom(languages, (language) => entry[language.name]) || {}
      }));
    }
    const examples = state.exampleData?.[name];
    if (examples && typeof examples === "object") {
      const values = languages.map((language) => examples[language.name]);
      const example = localizedFrom(languages, (language) => examples[language.name]);
      if (example) {
        attribute.example =
          values.every((value) => value === values[0]) ? values[0] : example;
      }
    }
    return attribute;
  });

  const spec = {
    name: localizedFrom(languages, (language) => metadata.localized?.[language.code3]?.name) || {},
    languages: languages.map((language) => language.code),
    attributes
  };
  const description = localizedFrom(
    languages,
    (language) => metadata.localized?.[language.code3]?.description
  );
  if (description) spec.description = description;
  if (metadata.classification) spec.classification = metadata.classification;
  return spec;
}
