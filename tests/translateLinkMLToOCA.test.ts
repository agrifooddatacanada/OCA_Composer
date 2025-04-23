import fs from "fs";
import path from "path";
import { translateLinkMLToOCA } from "../src/SchemaTranslator/linkMLToOCA.ts";

describe("translateLinkMLToOCA", () => {
  it("should include units in the OCA bundle after translation", async () => {
    // Load the LinkML YAML file
    const yamlFilePath = path.resolve(__dirname, "../dummyData/linkml.yaml");
    const yamlContent = fs.readFileSync(yamlFilePath, "utf-8");

    // Translate the YAML to an OCA bundle
    const ocaBundle = await translateLinkMLToOCA(yamlContent);

    // Check that the unit overlay exists
    expect(ocaBundle.overlays).toHaveProperty("unit");

    // Check that the unit overlay contains the expected units
    const unitOverlay = ocaBundle.overlays.unit[0];
    expect(unitOverlay).toHaveProperty("attribute_units");

    // Verify specific units
    const attributeUnits = unitOverlay.attribute_units;
    expect(attributeUnits).toMatchObject({
      distance_from_m7: "km",
      mean_temp_year: "celsius",
      avg_discharge: "m2/sec",
      length: "cm",
      weight: "g",
      age: "year",
      gonad_weight: "g",
      liver_weight: "g",
    });
  });
});
