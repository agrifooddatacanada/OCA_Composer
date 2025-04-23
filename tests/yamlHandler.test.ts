/**
 * Test for YAML handling in useHandleJsonDrop.js using the sample LinkML file
 */

import fs from "fs";
import path from "path";
import yaml from "js-yaml";
import { 
  validateForOCATranslation, 
  mapLinkMLToOCABundle, 
  transformToPackage, 
  translateLinkMLToOCA 
} from "../src/SchemaTranslator/index.ts";

describe("YAML handler with sample LinkML file", () => {
  let yamlContent: string;
  let parsedYaml: any;
  let bundle: any;
  let ocaBundle: any;
  
  // Load and parse YAML once before all tests
  beforeAll(async () => {
    // Read the sample YAML file directly
    const yamlPath = path.join(__dirname, "../dummyData/linkml.yaml");
    yamlContent = fs.readFileSync(yamlPath, "utf-8");
    
    // Parse the YAML content once
    parsedYaml = yaml.load(yamlContent);
    
    // Process through the pipeline once for multiple tests
    validateForOCATranslation(parsedYaml);
    bundle = mapLinkMLToOCABundle(parsedYaml);
    
    // Translate YAML to OCA once for tests that need it
    ocaBundle = await translateLinkMLToOCA(yamlContent);
  });

  test("can parse the sample LinkML YAML file", () => {
    // Verify basic structure
    expect(parsedYaml).toBeDefined();
    expect(parsedYaml.name).toBe("trout");
    expect(parsedYaml.description).toContain("trout-related biological and environmental data");
    expect(parsedYaml.classes).toHaveProperty("Trout");
  });

  test("processes the LinkML schema through the conversion pipeline", () => {
    // Create package from the pre-processed bundle
    const ocaPackage = transformToPackage(bundle);
    
    // Verify the resulting package structure
    expect(ocaPackage).toHaveProperty("type", "oca_package/1.0");
    expect(ocaPackage).toHaveProperty("oca_bundle.bundle");
    
    // Check that the bundle was processed correctly
    const resultBundle = ocaPackage.oca_bundle.bundle;
    expect(resultBundle).toHaveProperty("capture_base");
    expect(resultBundle).toHaveProperty("overlays");
  });

  test("identifies flagged attributes correctly", () => {
    // Check that flagged attributes are identified correctly from pre-processed bundle
    expect(bundle.capture_base.flagged_attributes).toContain("latitude");
    expect(bundle.capture_base.flagged_attributes).toContain("longitude");
    expect(bundle.capture_base.flagged_attributes).toContain("sex");
    expect(bundle.capture_base.flagged_attributes).toContain("weight");
    expect(bundle.capture_base.flagged_attributes).toContain("age");
  });
  
  // Group tests that use the same ocaBundle to avoid processing multiple times
  describe("OCA bundle content validation", () => {
    test("includes unit information in the OCA bundle", () => {
      // Check that the bundle structure is correct
      expect(ocaBundle).toHaveProperty("capture_base");
      expect(ocaBundle).toHaveProperty("overlays");
      
      // Check that the unit overlay exists
      expect(ocaBundle.overlays).toHaveProperty("unit");
      
      // The unit overlay is expected to be an array of unit overlay objects
      expect(Array.isArray(ocaBundle.overlays.unit)).toBe(true);
      expect(ocaBundle.overlays.unit.length).toBeGreaterThan(0);
      
      // Check the structure of the unit overlay
      const unitOverlay = ocaBundle.overlays.unit[0];
      expect(unitOverlay).toHaveProperty("type", "spec/overlays/unit/1.0");
      expect(unitOverlay).toHaveProperty("attribute_units");
      
      // Verify specific units from the LinkML schema
      const attributeUnits = unitOverlay.attribute_units;
      expect(attributeUnits).toHaveProperty("distance_from_m7", "km");
      expect(attributeUnits).toHaveProperty("mean_temp_year", "celsius");
      expect(attributeUnits).toHaveProperty("avg_discharge", "m2/sec");
      expect(attributeUnits).toHaveProperty("length", "cm");
      expect(attributeUnits).toHaveProperty("weight", "g");
      expect(attributeUnits).toHaveProperty("age", "year");
      expect(attributeUnits).toHaveProperty("gonad_weight", "g");
      expect(attributeUnits).toHaveProperty("liver_weight", "g");
    });
    
    test("verifies information overlay contains descriptions", () => {
      // Check that the information overlay exists
      expect(ocaBundle.overlays).toHaveProperty("information");
      expect(Array.isArray(ocaBundle.overlays.information)).toBe(true);
      const infoOverlay = ocaBundle.overlays.information[0];
      expect(infoOverlay).toHaveProperty("type", "spec/overlays/information/1.0");
      expect(infoOverlay).toHaveProperty("attribute_information");
      
      // Check specific descriptions from the LinkML schema
      const attrInfo = infoOverlay.attribute_information;
      expect(attrInfo).toHaveProperty("site", "Site from which the observations were collected");
      expect(attrInfo).toHaveProperty("distance_from_m7", "Distance from the most norther site, M7");
      expect(attrInfo).toHaveProperty("length", "Observed length in cm.");
    });
    
    test("verifies label overlay contains titles", () => {
      // Check that the label overlay exists
      expect(ocaBundle.overlays).toHaveProperty("label");
      expect(Array.isArray(ocaBundle.overlays.label)).toBe(true);
      expect(ocaBundle.overlays.label.length).toBeGreaterThan(0);
      
      // Verify the structure
      const labelOverlay = ocaBundle.overlays.label[0];
      expect(labelOverlay).toHaveProperty("type", "spec/overlays/label/1.0");
      expect(labelOverlay).toHaveProperty("attribute_labels");
      
      // Check specific titles from the LinkML schema
      const labels = labelOverlay.attribute_labels;
      expect(labels).toHaveProperty("distance_from_m7", "Distance from Site M7");
      expect(labels).toHaveProperty("mean_temp_year", "Mean water temperature grouped by year");
      expect(labels).toHaveProperty("avg_discharge", "Average discharge");
    });
    
    test("correctly maps LinkML data types to OCA types", () => {
      // Check data types in capture_base
      const { attributes } = ocaBundle.capture_base;
      
      // Text types
      expect(attributes.site).toBe("Text");
      expect(attributes.waterbody).toBe("Text");
      expect(attributes.date).toBe("Text");
      
      // Numeric types
      expect(attributes.latitude).toBe("Numeric");
      expect(attributes.longitude).toBe("Numeric");
      expect(attributes.distance_from_m7).toBe("Numeric");
      expect(attributes.mean_temp_year).toBe("Numeric");
      expect(attributes.avg_discharge).toBe("Numeric");
      expect(attributes.length).toBe("Numeric");
      expect(attributes.weight).toBe("Numeric");
      expect(attributes.year).toBe("Numeric");
      expect(attributes.age).toBe("Numeric");
    });
  });
});
