import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { findLanguage, SUPPORTED_LANGUAGES } from "../dist/lib/languages.js";
import { checkSchemaSpec, schemaSpecSchema } from "../dist/lib/schemaSpec.js";
import {
  cardinalityFromString,
  cardinalityToString,
  editorStateToSpec,
  specToEditorState
} from "../dist/lib/specConversion.js";
import { frenchOnlySpec, germanJapaneseSpec, richSpec } from "./fixtures/specs.js";

const minimal = (attributes, extra = {}) => ({
  name: { en: "Trial" },
  languages: ["en"],
  attributes,
  ...extra
});

const errorsOf = (spec) => checkSchemaSpec(schemaSpecSchema.parse(spec)).errors;
const warningsOf = (spec) => checkSchemaSpec(schemaSpecSchema.parse(spec)).warnings;

describe("supported languages", () => {
  test("only languages whose codes and name map onto each other", () => {
    assert.equal(SUPPORTED_LANGUAGES.length, 115);
    assert.deepEqual(findLanguage("fr"), { code: "fr", code3: "fra", name: "French" });
    assert.equal(findLanguage("FRA"), findLanguage("fr"));
    assert.equal(findLanguage("zh").name, "Chinese");
    assert.equal(findLanguage("mi"), undefined, "Maori has two spellings in the tables");
    assert.equal(findLanguage("en-CA"), undefined);
    assert.equal(new Set(SUPPORTED_LANGUAGES.map((l) => l.code)).size, 115);
  });
});

describe("schemaSpecSchema", () => {
  test("rejects unknown keys and types", () => {
    assert.equal(schemaSpecSchema.safeParse(richSpec).success, true);
    assert.equal(
      schemaSpecSchema.safeParse(minimal([{ name: "a", type: "Text", colour: "red" }])).success,
      false
    );
    assert.equal(
      schemaSpecSchema.safeParse(minimal([{ name: "a", type: "Child Schema" }])).success,
      false
    );
    assert.equal(schemaSpecSchema.safeParse(minimal([])).success, false);
  });
});

describe("checkSchemaSpec", () => {
  test("accepts the fixtures", () => {
    for (const spec of [richSpec, frenchOnlySpec, germanJapaneseSpec]) {
      assert.deepEqual(errorsOf(spec), []);
    }
  });

  const cases = [
    ["unsupported language", { languages: ["en", "xx"] }, "languages[1]", /not a supported/],
    ["duplicate language", { languages: ["en", "eng"] }, "languages[1]", /listed more than once/],
    ["no name", { name: { en: " " } }, "name", /at least one/],
    ["unknown classification", { classification: "Biology" }, "classification", /not a known/],
    [
      "text for an undeclared language",
      { name: { en: "Trial", fr: "Essai" } },
      "name.fr",
      /not one of the schema's languages/
    ],
    ["line break", { name: { en: "Two\nlines" } }, "name.en", /single line/],
    ["stripped backslash", { name: { en: "a\\-b" } }, "name.en", /drops the backslash/]
  ];
  for (const [label, override, path, message] of cases) {
    test(`schema: ${label}`, () => {
      const errors = errorsOf(minimal([{ name: "a", type: "Text" }], override));
      assert.equal(errors.length, 1, JSON.stringify(errors));
      assert.equal(errors[0].path, path);
      assert.match(errors[0].message, message);
    });
  }

  const attributeCases = [
    ["bad name", { name: "bird id" }, "name", /letters, digits/],
    ["unit on Text", { unit: "g" }, "unit", /Numeric and DateTime/],
    ["unknown unit", { type: "Numeric", unit: "grams" }, "unit", /search_ucum_units/],
    ["unit with wrong case", { type: "Numeric", unit: "KG" }, "unit", /did you mean "kg"/],
    ["format on Boolean", { type: "Boolean", format: "^x$" }, "format", /Boolean/],
    ["invalid regex", { format: "^(a$" }, "format", /valid regular expression/],
    ["unknown media type", { type: "Binary", format: "image/x-made-up" }, "format", /media type/],
    ["cardinality on scalar", { cardinality: { min: 1 } }, "cardinality", /Array types/],
    ["empty cardinality", { type: "Array[Text]", cardinality: {} }, "cardinality", /min, max/],
    [
      "inverted cardinality",
      { type: "Array[Text]", cardinality: { min: 3, max: 1 } },
      "cardinality",
      /greater than max/
    ],
    [
      "entry codes on Boolean",
      { type: "Boolean", entry_codes: [{ code: "Y", label: { en: "Yes" } }] },
      "entry_codes",
      /cannot have entry codes/
    ],
    [
      "duplicate entry code",
      {
        entry_codes: [
          { code: "A", label: { en: "A" } },
          { code: "A", label: { en: "A again" } }
        ]
      },
      "entry_codes[1].code",
      /more than once/
    ],
    [
      "entry code without a label",
      { entry_codes: [{ code: "A", label: {} }] },
      "entry_codes[0].label",
      /Missing a label in English/
    ],
    [
      "padded entry code",
      { entry_codes: [{ code: " A", label: { en: "A" } }] },
      "entry_codes[0].code",
      /start or end with spaces/
    ]
  ];
  for (const [label, override, field, message] of attributeCases) {
    test(`attribute: ${label}`, () => {
      const errors = errorsOf(minimal([{ name: "a", type: "Text", ...override }]));
      assert.equal(errors.length, 1, JSON.stringify(errors));
      assert.equal(errors[0].path, `attributes[0].${field}`);
      assert.match(errors[0].message, message);
    });
  }

  test("attribute names must be unique, ignoring case", () => {
    const errors = errorsOf(
      minimal([
        { name: "Weight", type: "Numeric" },
        { name: "weight", type: "Numeric" }
      ])
    );
    assert.deepEqual(errors, [
      { path: "attributes[1].name", message: "\"weight\" is already used by attributes[0]." }
    ]);
  });

  test("warns about missing labels, unused formats, published sensitive examples and bad examples", () => {
    const warnings = warningsOf({
      name: { en: "Trial", fr: "Essai" },
      languages: ["en", "fr"],
      attributes: [
        { name: "a", type: "Text", label: { en: "A" } },
        { name: "b", type: "Text", label: { en: "B" } },
        {
          name: "c",
          type: "Text",
          label: { en: "C", fr: "C" },
          format: "^[A-Z]$",
          entry_codes: [{ code: "X", label: { en: "X", fr: "X" } }],
          example: "Y"
        },
        {
          name: "d",
          type: "Numeric",
          label: { en: "D", fr: "D" },
          sensitive: true,
          format: "^[0-9]+$",
          example: { en: "12", fr: "douze" }
        }
      ]
    });
    assert.deepEqual(warnings, [
      {
        path: "attributes[2].format",
        message: "Ignored when validating data: values are checked against the entry codes instead."
      },
      { path: "attributes[2].example", message: "\"Y\" is not one of the entry codes." },
      {
        path: "attributes[3].example",
        message: "This attribute is sensitive; its example is published with the schema."
      },
      { path: "attributes[3].example.fr", message: "\"douze\" does not match the format rule." },
      { path: "attributes", message: "No French label for 2 attributes: a, b." }
    ]);
  });

  test("warns when a language has no schema name", () => {
    assert.deepEqual(warningsOf(germanJapaneseSpec), [
      { path: "name", message: "No name in Japanese; the first available name is used." }
    ]);
  });
});

describe("spec conversion", () => {
  test("cardinality strings use the Composer's notation", () => {
    const pairs = [
      [{ min: 1, max: 3 }, "1-3"],
      [{ min: 2 }, "2-"],
      [{ max: 5 }, "-5"],
      [{ min: 3, max: 3 }, "3"]
    ];
    for (const [cardinality, text] of pairs) {
      assert.equal(cardinalityToString(cardinality), text);
      assert.deepEqual(cardinalityFromString(text), cardinality);
    }
    assert.equal(cardinalityToString({ min: 0, max: 4 }), "-4");
  });

  test("builds the editor state the export reads", () => {
    const state = specToEditorState(frenchOnlySpec);
    assert.deepEqual(state.metadata, {
      name: "Inventaire des ruches",
      description: "",
      languages: ["French"],
      localized: { fra: { name: "Inventaire des ruches", description: "" } }
    });
    assert.deepEqual(state.attributes, [
      { Attribute: "ruche", Type: "Text", Required: true, Sensitive: false, Unit: "", List: false },
      { Attribute: "etat", Type: "Text", Required: false, Sensitive: false, Unit: "", List: true }
    ]);
    assert.deepEqual(state.lanAttributeRowData, {
      French: [
        { Attribute: "ruche", Label: "Ruche", Description: "", List: false },
        { Attribute: "etat", Label: "État", Description: "", List: true }
      ]
    });
    assert.deepEqual(state.entryCodes, {
      etat: [
        { Code: "B", French: "Bon" },
        { Code: "M", French: "Mauvais" }
      ]
    });
    assert.equal(state.overlaySelections["Required Entry"], true);
    assert.equal(state.overlaySelections.Format, false);
  });

  test("canonical specs read back unchanged", () => {
    assert.deepEqual(editorStateToSpec(specToEditorState(richSpec)), richSpec);
    assert.deepEqual(editorStateToSpec(specToEditorState(frenchOnlySpec)), frenchOnlySpec);
  });

  test("canonical form uses two-letter codes and fills in missing schema names", () => {
    assert.deepEqual(editorStateToSpec(specToEditorState(germanJapaneseSpec)), {
      ...germanJapaneseSpec,
      name: { de: "Bodenproben", ja: "Bodenproben" },
      languages: ["de", "ja"],
      attributes: [
        {
          name: "probe",
          type: "Text",
          label: { de: "Probe", ja: "試料" },
          description: { ja: "土壌試料の識別子" }
        },
        { name: "ph", type: "Numeric", label: { de: "pH-Wert", ja: "pH値" } }
      ]
    });
  });
});
