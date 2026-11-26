/** Schema specs shared by the spec and build tests. */

/** Two languages and every v1 field, plus text that stresses DSL escaping. */
export const richSpec = {
  name: { en: "Poultry trial", fr: "Essai avicole" },
  description: {
    en: "Broiler feeding trial, \"phase 2\"",
    fr: "Essai d'alimentation des poulets"
  },
  languages: ["en", "fr"],
  classification: "RDF401",
  attributes: [
    {
      name: "bird_id",
      type: "Text",
      label: { en: "Bird", fr: "Oiseau" },
      description: { en: "Leg band identifier", fr: "Identifiant de la bague" },
      required: true,
      sensitive: true,
      format: "^[A-Z]{2}[0-9]{3}$",
      character_encoding: "utf-8"
    },
    {
      name: "live_weight",
      type: "Numeric",
      label: { en: "Live weight", fr: "Poids vif" },
      description: { en: "Weight at day 42" },
      required: true,
      unit: "g",
      format: "^-?[0-9]+(\\.[0-9]+)?$",
      example: "2450"
    },
    {
      name: "hatch_date",
      type: "DateTime",
      label: { en: "Hatch date", fr: "Date d'éclosion" },
      format: "^(\\d{4})-(0[1-9]|1[0-2])-(0[1-9]|[12]\\d|3[01])$",
      example: { en: "2024-05-01", fr: "2024-05-02" }
    },
    {
      name: "treatment",
      type: "Text",
      label: { en: "Treatment", fr: "Traitement" },
      required: true,
      entry_codes: [
        { code: "CTRL", label: { en: "Control diet", fr: "Régime témoin" } },
        { code: "HIGH", label: { en: "High-protein diet", fr: "Régime riche en protéines" } }
      ],
      example: "CTRL"
    },
    {
      name: "visits",
      type: "Array[Text]",
      label: { en: "Vet visits", fr: "Visites vétérinaires" },
      cardinality: { min: 1, max: 3 }
    },
    {
      name: "scores",
      type: "Array[Numeric]",
      label: { en: "Scores", fr: "Notes" },
      cardinality: { min: 2 }
    },
    {
      name: "tags",
      type: "Array[Text]",
      label: { en: "Tags", fr: "Étiquettes" },
      cardinality: { max: 5 }
    },
    {
      name: "temperatures",
      type: "Array[Numeric]",
      label: { en: "Temperatures", fr: "Températures" },
      unit: "Cel",
      cardinality: { min: 3, max: 3 }
    },
    {
      name: "pen.no",
      type: "Numeric",
      label: { en: "Pen #", fr: "Enclos n°" }
    },
    {
      name: "photo",
      type: "Binary",
      label: { en: "Photo", fr: "Photo" },
      format: "image/png",
      character_encoding: "base64"
    },
    {
      name: "healthy",
      type: "Boolean",
      label: { en: "Healthy?", fr: "En bonne santé ?" }
    },
    {
      name: "notes-free",
      type: "Text",
      label: { en: "Notes \"free text\", a=b; c\\d", fr: "Remarques {libres} [texte]" },
      description: { en: "It's free-form: 50% of birds, 'quoted'" }
    }
  ]
};

/** A single non-English language, to catch English being added along the way. */
export const frenchOnlySpec = {
  name: { fr: "Inventaire des ruches" },
  languages: ["fr"],
  attributes: [
    { name: "ruche", type: "Text", label: { fr: "Ruche" }, required: true },
    {
      name: "etat",
      type: "Text",
      label: { fr: "État" },
      entry_codes: [
        { code: "B", label: { fr: "Bon" } },
        { code: "M", label: { fr: "Mauvais" } }
      ]
    }
  ]
};

/** Non-Latin text, three-letter language codes and a language without a schema name. */
export const germanJapaneseSpec = {
  name: { deu: "Bodenproben" },
  languages: ["deu", "jpn"],
  attributes: [
    {
      name: "probe",
      type: "Text",
      label: { deu: "Probe", jpn: "試料" },
      description: { jpn: "土壌試料の識別子" }
    },
    { name: "ph", type: "Numeric", label: { deu: "pH-Wert", jpn: "pH値" } }
  ]
};
