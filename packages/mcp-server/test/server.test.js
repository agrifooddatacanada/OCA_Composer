import { after, before, describe, test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { createServer } from "../dist/server.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const fixture = (name) => path.join(here, "fixtures", name);
const TRIAL_PACKAGE = fixture("trial_package.json");
const TRIAL_DATA = fixture("trial_data.csv");
const EXAMPLE_PACKAGE = path.join(
  here,
  "../../oca-core/tests/fixtures/Package_example.json"
);

let client;
let tmp;

async function call(name, args) {
  const result = await client.callTool({ name, arguments: args });
  const { text } = result.content[0];
  return result.isError ? { error: text } : JSON.parse(text);
}

before(async () => {
  tmp = await mkdtemp(path.join(tmpdir(), "oca-mcp-test-"));
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  await createServer().connect(serverTransport);
  client = new Client({ name: "test", version: "0.0.0" });
  await client.connect(clientTransport);
});

after(async () => {
  await client.close();
  await rm(tmp, { recursive: true, force: true });
});

describe("server capabilities", () => {
  test("lists tools, resources and prompts", async () => {
    const { tools } = await client.listTools();
    assert.deepEqual(tools.map((t) => t.name).sort(), [
      "convert_linkml_to_oca",
      "inspect_oca_package",
      "search_format_rules",
      "search_ucum_units",
      "validate_dataset"
    ]);
    const validate = tools.find((t) => t.name === "validate_dataset");
    assert.equal(validate.annotations.readOnlyHint, true);
    assert.ok(validate.inputSchema.properties.column_mapping);

    const { resources } = await client.listResources();
    assert.deepEqual(resources.map((r) => r.uri).sort(), [
      "oca://reference/format-rules",
      "oca://reference/validation-error-codes"
    ]);

    const { prompts } = await client.listPrompts();
    assert.deepEqual(
      prompts.map((p) => p.name),
      ["validate_and_explain"]
    );
  });

  test("reads the error code reference", async () => {
    const { contents } = await client.readResource({
      uri: "oca://reference/validation-error-codes"
    });
    assert.match(contents[0].text, /\| EC \| Entry Codes \|/);
  });
});

describe("inspect_oca_package", () => {
  test("summarizes attributes with their rules", async () => {
    const summary = await call("inspect_oca_package", { package_path: TRIAL_PACKAGE });
    assert.equal(summary.name, "Broiler trial");
    assert.equal(summary.attribute_count, 6);
    const byName = Object.fromEntries(summary.attributes.map((a) => [a.name, a]));
    assert.equal(byName.bird_id.required, true);
    assert.equal(byName.farmer_name.sensitive, true);
    assert.deepEqual(byName.treatment.entry_codes, ["CTRL", "HIGH"]);
    assert.equal(byName.live_weight.unit, "g");
    assert.equal(byName.live_weight.range.upper, "4000");
    assert.equal(byName.tags.array_delimiter, ";");
    assert.deepEqual(summary.integrity, { checked: true, valid: false });
  });

  test("verifies real digests and prefers the English name", async () => {
    const summary = await call("inspect_oca_package", { package_path: EXAMPLE_PACKAGE });
    assert.deepEqual(summary.integrity, { checked: true, valid: true });
    assert.deepEqual(summary.languages.sort(), ["English", "French"]);
    assert.ok(summary.name);
    assert.doesNotMatch(summary.name, /santée/);
  });

  test("accepts inline JSON", async () => {
    const summary = await call("inspect_oca_package", {
      package_json: await readFile(TRIAL_PACKAGE, "utf8")
    });
    assert.equal(summary.schema_said, "Etrial_bundle_provisional");
  });
});

describe("validate_dataset", () => {
  test("reports issues the way the Composer validator does", async () => {
    const report = await call("validate_dataset", {
      package_path: TRIAL_PACKAGE,
      dataset_path: TRIAL_DATA
    });
    assert.equal(report.passed, false);
    assert.equal(report.rows_checked, 4);
    assert.equal(report.error_count, 8);
    assert.equal(report.warning_count, 1);
    assert.deepEqual(report.unmatched_columns, ["notes"]);
    assert.deepEqual(report.missing_attributes, []);
    assert.deepEqual(report.errors_by_type, {
      Format: 5,
      Range: 2,
      "Entry Codes": 1,
      Warning: 1
    });

    const find = (row, attribute) =>
      report.issues.items.find((i) => i.row === row && i.attribute === attribute);
    assert.equal(find(2, "treatment").type, "EC");
    assert.equal(find(2, "treatment").value, "LOW");
    assert.match(find(2, "live_weight").message, /non-inclusive/);
    assert.match(find(3, "bird_id").message, /mandatory/);
    assert.equal(find(4, "live_weight").type, "RE");
    assert.equal(find(4, "tags").type, "W");
  });

  test("withholds values of sensitive attributes", async () => {
    const report = await call("validate_dataset", {
      package_path: TRIAL_PACKAGE,
      dataset_path: TRIAL_DATA
    });
    const issue = report.issues.items.find((i) => i.attribute === "farmer_name");
    assert.equal(issue.value, "[withheld: sensitive attribute]");
    assert.doesNotMatch(JSON.stringify(report), /Christopher/);
  });

  test("pages and filters issues without changing the summary", async () => {
    const page = await call("validate_dataset", {
      package_path: TRIAL_PACKAGE,
      dataset_path: TRIAL_DATA,
      limit: 3
    });
    assert.equal(page.issues.items.length, 3);
    assert.equal(page.issues.next_offset, 3);

    const filtered = await call("validate_dataset", {
      package_path: TRIAL_PACKAGE,
      dataset_path: TRIAL_DATA,
      attribute: "live_weight",
      include_warnings: false
    });
    assert.equal(filtered.error_count, 8);
    assert.equal(filtered.issues.total, 3);
    assert.ok(filtered.issues.items.every((i) => i.attribute === "live_weight"));
  });

  test("maps renamed columns and skips columns mapped to null", async () => {
    const report = await call("validate_dataset", {
      package_path: TRIAL_PACKAGE,
      dataset_csv:
        "Bird ID,live_weight,treatment,hatch_date,farmer_name,tags,notes\n" +
        "AB123,2500,CTRL,2024-01-15,Al,a;b,ok\n",
      column_mapping: { "Bird ID": "bird_id", notes: null }
    });
    assert.equal(report.passed, true);
    assert.deepEqual(report.unmatched_columns, []);
    assert.deepEqual(report.missing_attributes, []);
  });

  test("passes a clean dataset and lists missing attributes", async () => {
    const report = await call("validate_dataset", {
      package_path: TRIAL_PACKAGE,
      dataset_csv: "bird_id,live_weight\nAB123,150\nCD456,3999.5\n"
    });
    assert.equal(report.passed, true);
    assert.equal(report.error_count, 0);
    assert.deepEqual(report.missing_attributes.sort(), [
      "farmer_name",
      "hatch_date",
      "tags",
      "treatment"
    ]);
  });

  test("reads Excel workbooks, preferring the Schema Conformant Data sheet", async () => {
    const rows = Papa.parse(await readFile(TRIAL_DATA, "utf8"), {
      skipEmptyLines: true
    }).data;
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(
      workbook,
      XLSX.utils.aoa_to_sheet([["ignored"]]),
      "Notes"
    );
    XLSX.utils.book_append_sheet(
      workbook,
      XLSX.utils.aoa_to_sheet(rows),
      "Schema Conformant Data"
    );
    const xlsxPath = path.join(tmp, "trial.xlsx");
    await writeFile(xlsxPath, XLSX.write(workbook, { type: "buffer", bookType: "xlsx" }));

    const report = await call("validate_dataset", {
      package_path: TRIAL_PACKAGE,
      dataset_path: xlsxPath
    });
    assert.match(report.dataset, /Schema Conformant Data/);
    assert.equal(report.rows_checked, 4);
    assert.equal(report.error_count, 8);

    const missingSheet = await call("validate_dataset", {
      package_path: TRIAL_PACKAGE,
      dataset_path: xlsxPath,
      sheet: "Nope"
    });
    assert.match(missingSheet.error, /Available sheets: Notes, Schema Conformant Data/);
  });

  test("returns readable errors for bad input", async () => {
    const both = await call("validate_dataset", {
      package_path: TRIAL_PACKAGE,
      package_json: "{}",
      dataset_path: TRIAL_DATA
    });
    assert.match(both.error, /exactly one of "package_path" or "package_json"/);

    const relative = await call("validate_dataset", {
      package_path: "trial_package.json",
      dataset_path: TRIAL_DATA
    });
    assert.match(relative.error, /not an absolute path/);

    const missing = await call("validate_dataset", {
      package_path: path.join(tmp, "nope.json"),
      dataset_path: TRIAL_DATA
    });
    assert.match(missing.error, /File not found/);

    const notPackage = await call("validate_dataset", {
      package_json: JSON.stringify({ hello: "world" }),
      dataset_path: TRIAL_DATA
    });
    assert.match(notPackage.error, /not an OCA package/);

    const badMapping = await call("validate_dataset", {
      package_path: TRIAL_PACKAGE,
      dataset_path: TRIAL_DATA,
      column_mapping: { "No such column": "bird_id" }
    });
    assert.match(badMapping.error, /not a column in the dataset/);
  });
});

describe("lookups", () => {
  test("search_ucum_units finds exact codes first", async () => {
    const { results } = await call("search_ucum_units", { query: "kg" });
    assert.equal(results[0].code, "kg");
    assert.ok(results[0].label);
  });

  test("search_format_rules ranks rules by how many samples they accept", async () => {
    const rules = await call("search_format_rules", {
      type: "DateTime",
      sample_values: ["2024-01-15", "2023-12-31"]
    });
    assert.ok(rules.every((r) => r.type === "DateTime"));
    assert.equal(rules[0].matches_all_samples, true);
    assert.match(rules[0].description, /YYYY-MM-DD/);
    assert.equal(rules.at(-1).samples_matched, 0);
  });

  test("search_format_rules filters by keyword", async () => {
    const rules = await call("search_format_rules", { query: "email" });
    assert.deepEqual(
      rules.map((r) => r.description),
      ["Email address"]
    );
  });
});

describe("convert_linkml_to_oca", () => {
  test("returns a package and warns about undefined enums", async () => {
    const result = await call("convert_linkml_to_oca", {
      linkml_text: await readFile(fixture("trial.linkml.yaml"), "utf8")
    });
    assert.equal(result.package.__composerImportSource, "linkml");
    assert.equal(result.summary.integrity.checked, false);
    const byName = Object.fromEntries(result.summary.attributes.map((a) => [a.name, a]));
    assert.deepEqual(byName.treatment.entry_codes, ["CTRL", "HIGH"]);
    assert.equal(result.warnings.length, 1);
    assert.match(result.warnings[0], /Enum "ColourEnum" is referenced but not defined/);
  });

  test("a converted package validates (list-shaped entry_code overlay)", async () => {
    // Regression: the converter emits entry_code as a list, which used to crash
    // the validator with "Cannot read properties of undefined (reading 'bird_id')".
    const { package: pkg } = await call("convert_linkml_to_oca", {
      linkml_text: await readFile(fixture("trial.linkml.yaml"), "utf8")
    });
    const result = await call("validate_dataset", {
      package_json: JSON.stringify(pkg),
      dataset_csv: "bird_id,live_weight,treatment,colour\nAB123,10,NOPE,red\nzz,20,CTRL,blue\n"
    });
    assert.equal(result.error, undefined);
    assert.equal(result.passed, false);
    const issues = JSON.stringify(result);
    assert.match(issues, /treatment/);
    assert.match(issues, /bird_id/);
  });

  test("writes to output_path and refuses to overwrite by default", async () => {
    const outputPath = path.join(tmp, "from_linkml.json");
    const first = await call("convert_linkml_to_oca", {
      linkml_path: fixture("trial.linkml.yaml"),
      output_path: outputPath
    });
    assert.equal(first.written_to, outputPath);
    assert.equal(first.package, undefined);
    const written = JSON.parse(await readFile(outputPath, "utf8"));
    assert.equal(written.type, "oca_package/1.0");

    const second = await call("convert_linkml_to_oca", {
      linkml_path: fixture("trial.linkml.yaml"),
      output_path: outputPath
    });
    assert.match(second.error, /already exists/);
  });
});

describe("stdio binary", () => {
  test("starts, keeps stdout clean, and answers over stdio", async () => {
    const transport = new StdioClientTransport({
      command: process.execPath,
      args: [path.join(here, "../dist/index.js")],
      stderr: "pipe"
    });
    const stdioClient = new Client({ name: "stdio-test", version: "0.0.0" });
    await stdioClient.connect(transport);
    try {
      const { tools } = await stdioClient.listTools();
      assert.equal(tools.length, 5);
      const result = await stdioClient.callTool({
        name: "validate_dataset",
        arguments: { package_path: TRIAL_PACKAGE, dataset_path: TRIAL_DATA }
      });
      assert.equal(JSON.parse(result.content[0].text).error_count, 8);
    } finally {
      await stdioClient.close();
    }
  });
});
