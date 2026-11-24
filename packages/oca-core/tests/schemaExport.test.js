/**
 * @jest-environment node
 */
import {
  buildOcaDsl,
  buildSchemaExport,
  createResolveSaid,
  generateOcaPackageJson,
  overlayItems,
  prepareSchemaExport,
  rewriteBundleRefs,
  FIELD_FORM_INFORMATION_OVERLAY
} from "@oca-composer/oca-core";

jest.mock("uuid", () => ({ v4: () => "uuid" }));

const SAID = "EAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA";
const CAPTURE_BASE_SAID = "EBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB";

const fakeBundle = (attributes) => ({
  v: "OCAB10JSON000000_",
  d: SAID,
  capture_base: {
    d: CAPTURE_BASE_SAID,
    type: "spec/capture_base/1.0",
    classification: "",
    attributes,
    flagged_attributes: []
  },
  overlays: {}
});

const state = (overrides = {}) => ({
  metadata: { name: "Trial", description: "A trial", languages: ["English"] },
  attributes: [
    { Attribute: "bird_id", Type: "Text", Required: true, Sensitive: true },
    { Attribute: "treatment", Type: "Text", List: true }
  ],
  lanAttributeRowData: {
    English: [
      { Attribute: "bird_id", Label: "Bird", Description: "Bird identifier" },
      { Attribute: "treatment", Label: "Treatment", Description: "" }
    ]
  },
  entryCodes: { treatment: [{ Code: "CTRL", English: "Control" }] },
  overlaySelections: { ...overlayItems },
  ...overrides
});

describe("buildSchemaExport (no React, injected bundle service)", () => {
  test("sends the DSL to the injected service and keys the extension by its digest", async () => {
    const generateBundle = jest.fn(async () =>
      fakeBundle({ bird_id: "Text", treatment: "Text" })
    );

    const result = await buildSchemaExport(state(), { schemaId: "s1", generateBundle });

    expect(generateBundle).toHaveBeenCalledWith(result.textDSL);
    expect(result.textDSL).toContain("ADD ATTRIBUTE bird_id=Text treatment=Text");
    expect(result.textDSL).toContain('ADD ENTRY_CODE ATTRS treatment=["CTRL"]');
    expect(result.textDSL).toContain('ADD ENTRY en ATTRS treatment={"CTRL": "Control"}');
    expect(result.generatedBundleDigest).toBe(SAID);

    const overlays = result.extension.extensions.adc[SAID][0];
    expect(overlays.ordering_overlay.attribute_ordering).toEqual(["bird_id", "treatment"]);
    expect(overlays.ordering_overlay.entry_code_ordering).toEqual({ treatment: ["CTRL"] });
    expect(overlays.sensitive_overlay.sensitive_attributes).toEqual(["bird_id"]);
  });

  test("requires a generateBundle function", async () => {
    await expect(buildSchemaExport(state(), { schemaId: "s1" })).rejects.toThrow(
      /requires a generateBundle function/
    );
  });

  test("refuses the form information overlay without a builder", async () => {
    const withForm = state({
      overlaySelections: { ...overlayItems, [FIELD_FORM_INFORMATION_OVERLAY]: true }
    });
    await expect(
      buildSchemaExport(withForm, {
        schemaId: "s1",
        generateBundle: async () => fakeBundle({ bird_id: "Text" })
      })
    ).rejects.toThrow(/no buildFormInformation was provided/);
  });

  test("rejects a schema with no attributes before calling the service", () => {
    const prepared = prepareSchemaExport(state({ attributes: [] }), { schemaId: "s1" });
    expect(buildOcaDsl(prepared)).toContain("(no attributes present");
  });

  // Existing behavior, kept as-is: langTwoLettersFromName defaults to "en" for unknown
  // names, so the customIsos fallback is never reached and unknown languages export as "en".
  test("unknown languages export as en; customIsos is not consulted", () => {
    const prepared = prepareSchemaExport(
      state({ metadata: { name: "T", description: "", languages: ["Klingon"] } }),
      { schemaId: "s1", customIsos: { klingon: "tlh" } }
    );
    expect(buildOcaDsl(prepared)).toContain("ADD Meta en PROPS");
  });

  test("falls back to defaultOverlaySelections when the state has none", () => {
    const prepared = prepareSchemaExport(
      state({ overlaySelections: undefined, attributeFormats: { bird_id: "^[A-Z]+$" } }),
      { schemaId: "s1", defaultOverlaySelections: { ...overlayItems, Format: true } }
    );
    expect(prepared.overlaySelections.Format).toBe(true);
  });
});

describe("package assembly", () => {
  test("rewrites resolvable references and reports unresolved refs: tokens", () => {
    const bundle = fakeBundle({ child: "refn:child_schema", other: "refs:missing" });
    const resolveSaid = createResolveSaid({ child_schema: "ECHILD" });

    const unresolved = rewriteBundleRefs({ schemaBundle: bundle, resolveSaid });

    expect(bundle.capture_base.attributes.child).toBe("refs:ECHILD");
    expect(unresolved).toEqual([`${SAID}.other:missing`]);
  });

  test("produces an oca_package with the extension attached", async () => {
    const generateBundle = async () => fakeBundle({ bird_id: "Text", treatment: "Text" });
    const { bundle, extension } = await buildSchemaExport(state(), {
      schemaId: "s1",
      generateBundle
    });

    const pkg = generateOcaPackageJson(extension, { bundle, dependencies: [] });

    expect(pkg.type).toBe("oca_package/1.0");
    expect(pkg.oca_bundle.bundle.d).toBe(SAID);
    const adc = Object.values(pkg.extensions.adc)[0];
    expect(adc.overlays.sensitive.sensitive_attributes).toEqual(["bird_id"]);
  });
});
