import JSZip from "jszip";
import {
  OCABundle,
  OCAParser,
  collectInvalidAttributeNames,
  findMissingLinkMLEnums,
  getPackageBundle,
  getPackageBundleId,
  getPackageLanguages,
  isOcaPackageIntegrityValid,
  mapLinkMLToOCABundle,
  parseOcaZipArrayBuffer,
  replaceAttributeCharsInParsedJson,
  searchUnits,
  shouldVerifyOcaPackageCryptographically,
  transformToPackage,
  validateExampleValuesAgainstOverlays
} from "@oca-composer/oca-core";
import examplePackage from "./fixtures/Package_example.json";

let mockUuidCounter = 0;
jest.mock("uuid", () => ({
  v4: () => {
    mockUuidCounter += 1;
    return `uuid-${mockUuidCounter}`;
  }
}));

jest.mock("oca_package", () => ({
  VerifyOcaPackage: jest.fn((pkg, digest) => digest === "valid-digest"),
  OcaPackage: jest.fn()
}));

const linkmlSchema = {
  name: "poultry_trial",
  description: "Broiler feeding trial",
  slots: {
    bird_id: {
      range: "string",
      required: true,
      pattern: "^[A-Z]{2}[0-9]{3}$",
      description: "Bird identifier",
      title: "Bird ID",
      slot_uri: "http://purl.obolibrary.org/obo/FOODON_00000001"
    },
    live_weight: {
      range: "decimal",
      minimum_value: 0,
      maximum_value: 5000,
      unit: { ucum_code: "g" },
      description: "Live weight at slaughter"
    },
    treatment: {
      range: "TreatmentEnum",
      required: true,
      description: "Feed treatment group",
      annotations: { flagged: true }
    },
    sample_dates: {
      range: "datetime",
      multivalued: true,
      minimum_cardinality: 1,
      maximum_cardinality: 3
    }
  },
  enums: {
    TreatmentEnum: {
      permissible_values: {
        CTRL: { description: "Control diet" },
        HIGH: { description: "High-protein diet" }
      }
    }
  },
  classes: {
    Bird: { slots: ["bird_id", "live_weight", "treatment", "sample_dates", "missing"] }
  }
};

const validatorBundle = {
  capture_base: {
    attributes: {
      bird_id: "Text",
      live_weight: "Numeric",
      treatment: "Text",
      tags: "Array[Text]",
      hatch_date: "DateTime"
    },
    flagged_attributes: ["bird_id"]
  },
  overlays: {
    format: {
      type: "spec/overlays/format/1.0",
      attribute_formats: {
        bird_id: "^[A-Z]{2}[0-9]{3}$",
        live_weight: "^-?[0-9]+(\\.[0-9]+)?$",
        hatch_date: "YYYY-MM-DD"
      }
    },
    conformance: {
      type: "spec/overlays/conformance/1.0",
      attribute_conformance: { bird_id: "M", live_weight: "M", treatment: "O" }
    },
    entry_code: {
      type: "spec/overlays/entry_code/1.0",
      attribute_entry_codes: { treatment: ["CTRL", "HIGH"], tags: ["a", "b"] }
    },
    character_encoding: {
      type: "spec/overlays/character_encoding/1.0",
      default_character_encoding: "utf-8",
      attribute_character_encoding: {}
    }
  }
};

const validatorPackage = {
  oca_bundle: { bundle: { d: "root-bundle", capture_base: { d: "root-cb" } } },
  extensions: {
    adc: {
      "root-cb": {
        overlays: {
          range: {
            attributes: {
              live_weight: {
                lower: "100",
                lower_inclusive: true,
                upper: "4000",
                upper_inclusive: false
              }
            }
          }
        }
      }
    }
  }
};

const validatorDataset = {
  bird_id: ["AB123", "ab123", "", "CD456"],
  live_weight: ["2500", "4000", "abc", "50"],
  treatment: ["CTRL", "LOW", "HIGH", ""],
  tags: ["[\"a\",\"b\"]", "a;c", "b", "[\"z\"]"],
  hatch_date: ["2024-01-15", "15/01/2024", "2024-02-30", ""],
  unexpected_column: ["x", "y", "z", "w"]
};

beforeEach(() => {
  mockUuidCounter = 0;
  jest.spyOn(Date, "now").mockReturnValue(1700000000000);
  jest.spyOn(console, "error").mockImplementation(() => {});
  jest.spyOn(console, "warn").mockImplementation(() => {});
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe("package utilities", () => {
  test("read bundle, id and languages from the example package", () => {
    expect({
      bundleId: getPackageBundleId(examplePackage),
      captureBase: getPackageBundle(examplePackage).capture_base,
      languages: getPackageLanguages(examplePackage)
    }).toMatchSnapshot();
  });
});

describe("OCAParser", () => {
  test("parses the example package into editor state", () => {
    const schemaId = getPackageBundleId(examplePackage);
    expect(OCAParser.parseSchemaData(schemaId, examplePackage)).toMatchSnapshot();
  });

  test("parses a LinkML-imported package into editor state", () => {
    const pkg = transformToPackage(mapLinkMLToOCABundle(linkmlSchema));
    const schemaId = getPackageBundleId(pkg);
    expect(OCAParser.parseSchemaData(schemaId, pkg)).toMatchSnapshot();
  });
});

describe("LinkML translation", () => {
  test("maps a LinkML schema to an OCA bundle and package", () => {
    const bundle = mapLinkMLToOCABundle(linkmlSchema);
    expect(bundle).toMatchSnapshot("bundle");
    expect(transformToPackage(bundle)).toMatchSnapshot("package");
  });

  test("reports enums referenced but not defined", () => {
    expect(
      findMissingLinkMLEnums({
        ...linkmlSchema,
        slots: { ...linkmlSchema.slots, colour: { range: "ColourEnum" } }
      })
    ).toMatchSnapshot();
  });
});

describe("OCABundle validator", () => {
  test("validates a dataset against format, entry code, conformance and range rules", async () => {
    const bundle = new OCABundle();
    await bundle.loadedBundle(validatorBundle, validatorPackage);
    const result = bundle.validate(validatorDataset, ".", { tags: "," });
    expect(result).toMatchSnapshot("result");
    expect(bundle.flaggedAlarm()).toMatchSnapshot("flagged");
  });

  test("honours a comma decimal separator", async () => {
    const bundle = new OCABundle();
    await bundle.loadedBundle(validatorBundle, validatorPackage);
    const result = bundle.validate(
      { ...validatorDataset, live_weight: ["2500,5", "3999,9", "4000", "99,9"] },
      ","
    );
    expect(result).toMatchSnapshot();
  });
});

describe("example validation", () => {
  test("flags example values that break format, range and delimiter rules", () => {
    expect(
      validateExampleValuesAgainstOverlays({
        attributes: [
          { Attribute: "live_weight", Type: "Numeric" },
          { Attribute: "hatch_date", Type: "DateTime" },
          { Attribute: "tags", Type: "Array[Text]" },
          { Attribute: "child", Type: "refn:child" }
        ],
        attributeFormats: {
          live_weight: "^-?[0-9]+(\\.[0-9]+)?$",
          hatch_date: "YYYY-MM-DD"
        },
        attributeRanges: {
          live_weight: { lower: "100", upper: "4000", lower_inclusive: true }
        },
        exampleData: {
          live_weight: { English: "50", French: "2500" },
          hatch_date: { English: "2024-13-01" },
          tags: { English: "a;b" },
          child: { English: "anything" }
        },
        languages: ["English", "French"],
        arrayDelimiterData: { tags: "," },
        enableArrayDelimiter: true
      })
    ).toMatchSnapshot();
  });
});

describe("legacy zip import", () => {
  test("reads meta.json, capture base and overlays from a zip archive", async () => {
    const zip = new JSZip();
    zip.file(
      "meta.json",
      JSON.stringify({
        root: "cb1",
        files: { cb1: { "meta (en)": "m1", "label (en)": "l1", format: "f1" } }
      })
    );
    zip.file(
      "cb1.json",
      JSON.stringify({
        type: "spec/capture_base/1.0",
        attributes: { "Bird ID!": "Text", weight: "Numeric" }
      })
    );
    zip.file("m1.json", JSON.stringify({ type: "spec/overlays/meta/1.0", name: "Trial" }));
    zip.file(
      "l1.json",
      JSON.stringify({
        type: "spec/overlays/label/1.0",
        attribute_labels: { "Bird ID!": "Bird", weight: "Weight" }
      })
    );
    zip.file(
      "f1.json",
      JSON.stringify({
        type: "spec/overlays/format/1.0",
        attribute_formats: { weight: "^[0-9]+$" }
      })
    );
    const buffer = await zip.generateAsync({ type: "arraybuffer" });
    expect(await parseOcaZipArrayBuffer(buffer)).toMatchSnapshot();
  });

  test("rejects a zip without meta.json", async () => {
    const zip = new JSZip();
    zip.file("other.json", "{}");
    const buffer = await zip.generateAsync({ type: "arraybuffer" });
    await expect(parseOcaZipArrayBuffer(buffer)).rejects.toMatchObject({
      isSchemaValidationError: true
    });
  });
});

describe("attribute name sanitising", () => {
  test("rewrites disallowed characters in bundle attribute keys", () => {
    expect(
      replaceAttributeCharsInParsedJson({
        capture_base: { attributes: { "Bird ID!": "Text", "wt (g)": "Numeric" } },
        overlays: {
          label: [{ attribute_labels: { "Bird ID!": "Bird", "wt (g)": "Weight" } }],
          format: { attribute_formats: { "wt (g)": "^[0-9]+$" } }
        }
      })
    ).toMatchSnapshot();
    expect(collectInvalidAttributeNames(["ok_name", "bad name!", "fine-1.2"])).toEqual([
      "bad name!"
    ]);
  });
});

describe("UCUM unit search", () => {
  test.each(["kg", "g", "kilogram", "mg/dL", "degree"])("searchUnits(%p)", (query) => {
    const { firstMatch, results } = searchUnits(query);
    expect({
      firstMatch: firstMatch?.code ?? null,
      results: results.map((unit) => unit.code)
    }).toMatchSnapshot();
  });
});

describe("integrity verification wrapper", () => {
  test("skips cryptographic checks for LinkML and zip imports", () => {
    expect(shouldVerifyOcaPackageCryptographically({ __composerImportSource: "linkml" })).toBe(
      false
    );
    expect(shouldVerifyOcaPackageCryptographically({ __composerImportSource: "zip" })).toBe(
      false
    );
    expect(shouldVerifyOcaPackageCryptographically(examplePackage)).toBe(true);
  });

  test("checks the package digest, or every bundle digest when there is none", () => {
    expect(isOcaPackageIntegrityValid({ d: "valid-digest" })).toBe(true);
    expect(isOcaPackageIntegrityValid({ d: "tampered" })).toBe(false);
    expect(
      isOcaPackageIntegrityValid({ oca_bundle: { bundle: { d: "valid-digest" } } })
    ).toBe(true);
    expect(isOcaPackageIntegrityValid({})).toBe(false);
  });
});
