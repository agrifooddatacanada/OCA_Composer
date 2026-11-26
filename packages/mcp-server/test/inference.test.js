import { after, before, describe, test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { createServer } from "../dist/server.js";
import { RECORDED_BASE_URL, createRecordedBundleService } from "./helpers/recordedBundleService.js";

// Bundle service responses are replayed from test/fixtures/recordings/inference.json.
// After changing what the inferred spec turns into, re-record with OCA_RECORD_BUNDLES=1.
const service = createRecordedBundleService("inference");
const config = { bundleServiceUrl: RECORDED_BASE_URL, bundleTimeoutMs: 5000 };

const here = path.dirname(fileURLToPath(import.meta.url));
const SURVEY = path.join(here, "fixtures", "pollinator_survey.csv");

let client;
let tmp;

async function call(name, args) {
  const result = await client.callTool({ name, arguments: args });
  const { text } = result.content[0];
  return result.isError ? { error: text } : JSON.parse(text);
}

const columnsByName = (result) =>
  Object.fromEntries(result.columns.map((column) => [column.column, column]));
const attributesByName = (result) =>
  Object.fromEntries(result.draft_spec.attributes.map((attribute) => [attribute.name, attribute]));

before(async () => {
  tmp = await mkdtemp(path.join(tmpdir(), "oca-mcp-infer-"));
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  await createServer({ config, fetch: service.bundleService.fetch }).connect(serverTransport);
  client = new Client({ name: "test", version: "0.0.0" });
  await client.connect(clientTransport);
});

after(async () => {
  service.save();
  await client.close();
  await rm(tmp, { recursive: true, force: true });
});

describe("infer_schema_from_dataset", () => {
  test("drafts a spec with types, rules, flags and evidence", async () => {
    const result = await call("infer_schema_from_dataset", {
      dataset_path: SURVEY,
      languages: ["en", "fr"]
    });
    assert.equal(result.error, undefined);
    assert.equal(result.rows_analyzed, 12);
    assert.deepEqual(result.draft_spec.name, { en: "pollinator_survey" });
    assert.deepEqual(result.draft_spec.languages, ["en", "fr"]);
    assert.deepEqual(result.check.errors, []);
    assert.deepEqual(result.column_mapping, {
      "Plot ID": "Plot_ID",
      "Survey date": "Survey_date",
      "Observed at": "Observed_at",
      "Weight (g)": "Weight_g",
      "Observer email": "Observer_email"
    });

    const attributes = attributesByName(result);
    assert.deepEqual(
      Object.values(attributes).map((a) => [a.name, a.type]),
      [
        ["Plot_ID", "Text"],
        ["Survey_date", "DateTime"],
        ["Observed_at", "DateTime"],
        ["Species", "Text"],
        ["Count", "Numeric"],
        ["Weight_g", "Numeric"],
        ["Healthy", "Boolean"],
        ["Flagged", "Numeric"],
        ["Observer_email", "Text"],
        ["Latitude", "Numeric"],
        ["Temp", "Numeric"],
        ["Notes", "Text"]
      ]
    );
    assert.deepEqual(attributes.Plot_ID.label, { en: "Plot ID" });
    assert.equal(attributes.Plot_ID.required, true);
    assert.equal(attributes.Weight_g.required, undefined);
    assert.equal(attributes.Notes.required, undefined);
    const columns = columnsByName(result);
    assert.deepEqual(
      Object.fromEntries(result.columns.map((c) => [c.attribute, c.format])),
      {
        Plot_ID: undefined,
        Survey_date: "DD/MM/YYYY: day, month, year",
        Observed_at: "ISO: HH:MM: hour, minutes in 24 hour notation",
        Species: undefined,
        Count: "any integer",
        Weight_g: "any integer or decimal number, may begin with + or -",
        Healthy: undefined,
        Flagged: "any integer",
        Observer_email: "Email address",
        Latitude: "any integer or decimal number, may begin with + or -",
        Temp: undefined,
        Notes: undefined
      }
    );
    assert.equal(attributes.Survey_date.format, "^(0[1-9]|[12]\\d|3[01])/(0[1-9]|1[0-2])/\\d{4}$");
    assert.equal(attributes.Temp.format, undefined);
    assert.deepEqual(attributes.Species.entry_codes, [
      { code: "Bee", label: { en: "Bee", fr: "Bee" } },
      { code: "Wasp", label: { en: "Wasp", fr: "Wasp" } },
      { code: "Fly", label: { en: "Fly", fr: "Fly" } }
    ]);
    assert.equal(attributes.Notes.entry_codes, undefined);
    assert.deepEqual(
      Object.values(attributes)
        .filter((a) => a.sensitive)
        .map((a) => a.name),
      ["Observer_email", "Latitude"]
    );
    assert.equal(attributes.Healthy.example, undefined);

    assert.match(columns["Plot ID"].notes[0], /leading zeros/);
    assert.deepEqual(columns["Survey date"].format_alternatives, [
      "MM/DD/YYYY: month, day, year"
    ]);
    assert.match(columns["Survey date"].notes[0], /ask which one the data uses/);
    assert.match(columns["Observer email"].sensitive_reason, /an email address/);
    assert.match(columns.Latitude.sensitive_reason, /an exact location/);
    assert.match(columns.Temp.notes[0], /Missing values are written as "NA"/);
    assert.deepEqual(columns.Flagged.distinct_values, ["0", "1"]);
    assert.equal(columns["Weight (g)"].empty, 1);
    assert.match(
      result.check.warnings.map((w) => w.message).join("\n"),
      /No French label for 12 attributes/
    );
  });

  test("names awkward headers and handles messy values", async () => {
    const result = await call("infer_schema_from_dataset", {
      dataset_csv:
        ",Name,name,Price,Year,Flag,When,Contact,Mixed\n" +
        "x,Ana,a,\" 1.5\",2021,true,2024-01-05,see a@b.org,1\n" +
        "y,Ben,b,\"1,25\",2022,false,2024-01-05T10:00:00Z,call me,two\n" +
        "z,Cleo,c,3,2023,true,2024-02-01,n/a,3\n",
      schema_name: "Messy"
    });
    assert.equal(result.error, undefined);
    assert.deepEqual(result.draft_spec.name, { en: "Messy" });
    assert.deepEqual(
      result.draft_spec.attributes.map((a) => a.name),
      ["column_1", "Name", "name_2", "Price", "Year", "Flag", "When", "Contact", "Mixed"]
    );
    assert.deepEqual(result.check.errors, []);

    const attributes = attributesByName(result);
    const columns = Object.fromEntries(result.columns.map((c) => [c.attribute, c]));
    assert.deepEqual(attributes.column_1.label, { en: "column_1" });
    assert.match(columns.Name.sensitive_reason, /a person's name/);
    assert.equal(attributes.Price.type, "Numeric");
    assert.equal(attributes.Price.format, undefined);
    assert.match(columns.Price.notes.join(" "), /leading or trailing spaces/);
    assert.match(columns.Price.notes.join(" "), /commas/);
    assert.equal(attributes.Year.type, "Numeric");
    assert.match(columns.Year.notes[0], /look like years/);
    assert.equal(attributes.Flag.type, "Boolean");
    assert.equal(attributes.When.type, "Text");
    assert.match(columns.When.notes[0], /no single predefined format fits/);
    assert.equal(attributes.Contact.format, undefined);
    assert.equal(attributes.Mixed.type, "Text");
  });

  test("entry codes need repeated values and can be turned off", async () => {
    const csv = "status\nopen\nclosed\nopen\nopen\nclosed\n";
    const withCodes = await call("infer_schema_from_dataset", { dataset_csv: csv });
    assert.deepEqual(
      withCodes.draft_spec.attributes[0].entry_codes.map((c) => c.code),
      ["open", "closed"]
    );
    const without = await call("infer_schema_from_dataset", { dataset_csv: csv, max_entry_codes: 0 });
    assert.equal(without.draft_spec.attributes[0].entry_codes, undefined);

    const unique = await call("infer_schema_from_dataset", { dataset_csv: "id\nA1\nB2\nC3\n" });
    assert.equal(unique.draft_spec.attributes[0].entry_codes, undefined);
    assert.deepEqual(unique.columns[0].distinct_values, ["A1", "B2", "C3"]);
  });

  test("0/1 columns stay Numeric; boolean words become Boolean", async () => {
    const result = await call("infer_schema_from_dataset", {
      dataset_csv: "a,b\n0,yes\n1,No\n1,Y\n"
    });
    assert.deepEqual(
      result.draft_spec.attributes.map((a) => a.type),
      ["Numeric", "Boolean"]
    );
  });

  test("writes the draft and refuses to overwrite it", async () => {
    const outputPath = path.join(tmp, "draft.json");
    const first = await call("infer_schema_from_dataset", {
      dataset_path: SURVEY,
      output_path: outputPath
    });
    assert.equal(first.written_to, outputPath);
    assert.deepEqual(JSON.parse(await readFile(outputPath, "utf8")), first.draft_spec);

    const second = await call("infer_schema_from_dataset", {
      dataset_path: SURVEY,
      output_path: outputPath
    });
    assert.match(second.error, /already exists/);
  });

  test("rejects unknown or repeated languages and empty datasets", async () => {
    const unknown = await call("infer_schema_from_dataset", { dataset_path: SURVEY, languages: ["xx"] });
    assert.match(unknown.error, /Unknown language "xx"/);
    const repeated = await call("infer_schema_from_dataset", {
      dataset_path: SURVEY,
      languages: ["en", "eng"]
    });
    assert.match(repeated.error, /"en" is listed twice/);
    const empty = await call("infer_schema_from_dataset", { dataset_csv: "" });
    assert.ok(empty.error);
  });
});

describe("inferred schemas", () => {
  test("build into packages that accept the data they were inferred from", async () => {
    const inferred = await call("infer_schema_from_dataset", { dataset_path: SURVEY });
    const built = await call("build_oca_package", { spec: inferred.draft_spec });
    assert.equal(built.error, undefined);
    assert.deepEqual(built.summary.integrity, { checked: true, valid: true });

    const report = await call("validate_dataset", {
      package_json: JSON.stringify(built.package),
      dataset_path: SURVEY,
      column_mapping: inferred.column_mapping
    });
    assert.equal(report.passed, true);
    assert.equal(report.error_count, 0);
    assert.deepEqual(report.unmatched_columns, []);
    assert.deepEqual(report.missing_attributes, []);

    const bad = await call("validate_dataset", {
      package_json: JSON.stringify(built.package),
      dataset_csv:
        "Plot ID,Survey date,Observed at,Species,Count,Weight (g),Healthy,Flagged,Observer email,Latitude,Temp,Notes\n" +
        "013,2024-04-12,9am,Moth,lots,1.5,maybe,0,ana@example.org,45.42,18,\n",
      column_mapping: inferred.column_mapping
    });
    assert.equal(bad.passed, false);
    assert.deepEqual(
      bad.issues.items.map((i) => `${i.attribute}:${i.type}`).sort(),
      ["Count:FE", "Healthy:FE", "Observed_at:FE", "Species:EC", "Survey_date:FE"]
    );
  });
});

describe("draft_schema_from_dataset prompt", () => {
  test("walks through infer, review, check, build and validate", async () => {
    const { messages } = await client.getPrompt({
      name: "draft_schema_from_dataset",
      arguments: { dataset_path: SURVEY, output_path: "/tmp/survey.json", languages: "en, fr" }
    });
    const { text } = messages[0].content;
    assert.match(text, /infer_schema_from_dataset with dataset_path and languages \["en","fr"\]/);
    assert.match(text, /validate_schema_spec/);
    assert.match(text, /build_oca_package with output_path "\/tmp\/survey.json"/);
    assert.match(text, /validate_dataset .* column_mapping/s);
  });
});
