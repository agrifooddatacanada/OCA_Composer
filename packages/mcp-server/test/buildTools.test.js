import { after, before, describe, test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { createServer } from "../dist/server.js";
import { RECORDED_BASE_URL, createRecordedBundleService } from "./helpers/recordedBundleService.js";
import { frenchOnlySpec, richSpec } from "./fixtures/specs.js";

// Bundle service responses are replayed from test/fixtures/recordings/build-tools.json.
// After changing what a spec turns into, re-record with OCA_RECORD_BUNDLES=1.
const service = createRecordedBundleService("build-tools");
const config = { bundleServiceUrl: RECORDED_BASE_URL, bundleTimeoutMs: 5000 };

const clients = [];
let tmp;

async function connect(fetch) {
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  await createServer({ config, fetch }).connect(serverTransport);
  const client = new Client({ name: "test", version: "0.0.0" });
  await client.connect(clientTransport);
  clients.push(client);
  const call = async (name, args) => {
    const result = await client.callTool({ name, arguments: args });
    const { text } = result.content[0];
    return result.isError ? { error: text } : JSON.parse(text);
  };
  return call;
}

const failIfCalled = async () => {
  throw new Error("the bundle service must not be called");
};

let call;
let offline;

before(async () => {
  tmp = await mkdtemp(path.join(tmpdir(), "oca-mcp-build-"));
  call = await connect(service.bundleService.fetch);
  offline = await connect(failIfCalled);
});

after(async () => {
  service.save();
  await Promise.all(clients.map((client) => client.close()));
  await rm(tmp, { recursive: true, force: true });
});

describe("validate_schema_spec", () => {
  test("accepts a valid spec and previews its DSL without contacting the service", async () => {
    const result = await offline("validate_schema_spec", { spec: richSpec });
    assert.equal(result.valid, true);
    assert.deepEqual(result.errors, []);
    assert.deepEqual(result.warnings, []);
    assert.match(result.dsl_preview, /^ADD ENTRY_CODE ATTRS treatment=\["CTRL", "HIGH"\]$/m);
    assert.match(result.dsl_preview, /^ADD Unit ATTRS live_weight="g" temperatures="Cel"$/m);
  });

  test("reports errors and warnings with paths", async () => {
    const result = await offline("validate_schema_spec", {
      spec: {
        name: { en: "Trial", fr: "Essai" },
        languages: ["en", "fr"],
        attributes: [{ name: "weight", type: "Numeric", label: { en: "Weight" }, unit: "grams" }]
      }
    });
    assert.equal(result.valid, false);
    assert.equal(result.dsl_preview, undefined);
    assert.deepEqual(
      result.errors.map((e) => e.path),
      ["attributes[0].unit"]
    );
    assert.match(result.warnings[0].message, /No French label for 1 attribute: weight/);
  });

  test("structural problems are reported by the input schema", async () => {
    const result = await offline("validate_schema_spec", {
      spec: { ...frenchOnlySpec, attributes: [{ name: "a", type: "Integer" }] }
    });
    assert.match(result.error, /Input validation error/);
    assert.match(result.error, /attributes/);
  });

  test("reads specs from files", async () => {
    const specPath = path.join(tmp, "spec.json");
    await writeFile(specPath, JSON.stringify(richSpec));
    assert.equal((await offline("validate_schema_spec", { spec_path: specPath })).valid, true);

    const badPath = path.join(tmp, "bad-spec.json");
    await writeFile(
      badPath,
      JSON.stringify({ ...frenchOnlySpec, colour: "red", attributes: [{ name: "a", type: "Integer" }] })
    );
    const bad = await offline("validate_schema_spec", { spec_path: badPath });
    assert.match(bad.error, /does not match the spec format/);
    assert.match(bad.error, /^- attributes\[0\]\.type: /m);
    assert.match(bad.error, /colour/);

    const both = await offline("validate_schema_spec", { spec: richSpec, spec_path: specPath });
    assert.match(both.error, /exactly one of "spec" or "spec_path"/);
  });
});

describe("build_oca_package", () => {
  test("builds a verifiable package and writes it", async () => {
    const outputPath = path.join(tmp, "hives.json");
    const result = await call("build_oca_package", { spec: frenchOnlySpec, output_path: outputPath });
    assert.equal(result.error, undefined);
    assert.match(result.said, /^E[\w-]{43}$/);
    assert.equal(result.written_to, outputPath);
    assert.equal(result.package, undefined);
    assert.deepEqual(result.warnings, []);
    assert.deepEqual(result.summary.integrity, { checked: true, valid: true });
    assert.deepEqual(result.summary.languages, ["French"]);

    const written = JSON.parse(await readFile(outputPath, "utf8"));
    assert.equal(written.oca_bundle.bundle.d, result.said);

    const again = await offline("build_oca_package", { spec: frenchOnlySpec, output_path: outputPath });
    assert.match(again.error, /already exists/);
  });

  test("returns the package inline with the spec's rules", async () => {
    const result = await call("build_oca_package", { spec: richSpec });
    assert.equal(result.package.oca_bundle.bundle.d, result.said);
    assert.equal(result.summary.attribute_count, 12);
    const byName = Object.fromEntries(result.summary.attributes.map((a) => [a.name, a]));
    assert.equal(byName.bird_id.required, true);
    assert.equal(byName.bird_id.sensitive, true);
    assert.equal(byName.live_weight.unit, "g");
    assert.deepEqual(byName.treatment.entry_codes, ["CTRL", "HIGH"]);
  });

  test("the built package validates the data it describes", async () => {
    const { package: pkg } = await call("build_oca_package", { spec: frenchOnlySpec });
    const report = await call("validate_dataset", {
      package_json: JSON.stringify(pkg),
      dataset_csv: "ruche,etat\nR1,B\n,M\nR3,X\n"
    });
    assert.equal(report.passed, false);
    const issues = report.issues.items.map((i) => `${i.row}:${i.attribute}:${i.type}`);
    assert.deepEqual(issues.sort(), ["2:ruche:FE", "3:etat:EC"]);
  });

  test("refuses a spec with errors without contacting the service", async () => {
    const result = await offline("build_oca_package", {
      spec: { ...frenchOnlySpec, languages: ["fr", "xx"] }
    });
    assert.match(result.error, /The spec has 1 error, so nothing was built/);
    assert.match(result.error, /^- languages\[1\]: "xx" is not a supported language code/m);
  });

  test("passes on bundle service rejections readably", async () => {
    const rejecting = await connect(
      async () =>
        new Response(
          JSON.stringify({
            success: false,
            errors: [{ ln: 1, col: 15, c: "ADD ATTRIBUTE =Text", e: "parsing error: expected attr_key" }]
          }),
          { status: 200 }
        )
    );
    const result = await rejecting("build_oca_package", { spec: frenchOnlySpec });
    assert.match(result.error, /rejected the schema \(1 error reported\)/);
    assert.match(result.error, /Line 1, column 15: parsing error: expected attr_key/);
  });

  test("explains how to point at another service when it cannot be reached", async () => {
    const unreachable = await connect(async () => {
      throw new TypeError("fetch failed");
    });
    const result = await unreachable("build_oca_package", { spec: frenchOnlySpec });
    assert.match(result.error, /Could not reach the OCA bundle service at https:\/\/bundle-service/);
    assert.match(result.error, /OCA_REPOSITORY_API_URL/);
  });

  test("warns when the package does not read back as the spec", async () => {
    const droppingUnits = await connect(async (url, init) => {
      const response = await service.bundleService.fetch(url, init);
      if ((init?.method || "GET") !== "GET") return response;
      const body = await response.json();
      delete body.bundle.overlays.unit;
      return new Response(JSON.stringify(body), { status: 200 });
    });
    const result = await droppingUnits("build_oca_package", { spec: richSpec });
    assert.equal(result.warnings.length, 1);
    assert.match(
      result.warnings[0].message,
      /reads the built package back differently from the spec \(attribute live_weight, attribute temperatures\)/
    );
  });
});

describe("schema spec reference", () => {
  test("lists languages and classification codes from the checks' own tables", async () => {
    const [client] = clients;
    const { contents } = await client.readResource({ uri: "oca://reference/schema-spec" });
    assert.match(contents[0].text, /^\| `fr` \| `fra` \| French \|$/m);
    assert.match(contents[0].text, /^\| `RDF401` \| .+ \| group \|$/m);
    assert.match(contents[0].text, /`Array\[Numeric\]`/);
  });
});

describe("live bundle service", { skip: process.env.OCA_LIVE_BUNDLE_SERVICE !== "1" }, () => {
  test("builds the rich spec against the hosted service", async () => {
    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
    await createServer().connect(serverTransport);
    const client = new Client({ name: "live", version: "0.0.0" });
    await client.connect(clientTransport);
    clients.push(client);
    const result = await client.callTool({ name: "build_oca_package", arguments: { spec: richSpec } });
    const body = JSON.parse(result.content[0].text);
    assert.equal(result.isError, undefined);
    assert.deepEqual(body.summary.integrity, { checked: true, valid: true });
    assert.deepEqual(body.warnings, []);
  });
});
