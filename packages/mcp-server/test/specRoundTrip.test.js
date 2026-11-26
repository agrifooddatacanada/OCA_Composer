import { after, describe, test } from "node:test";
import assert from "node:assert/strict";
import { checkSchemaSpec, schemaSpecSchema } from "../dist/lib/schemaSpec.js";
import { editorStateToSpec, specToEditorState } from "../dist/lib/specConversion.js";
import { buildPackageFromSpec, readSpecFromPackage } from "../dist/lib/specPackage.js";
import { summarizePackage } from "../dist/lib/schemaSummary.js";
import { createRecordedBundleService } from "./helpers/recordedBundleService.js";
import { frenchOnlySpec, germanJapaneseSpec, richSpec } from "./fixtures/specs.js";

// Bundle service responses are replayed from test/fixtures/recordings/spec-round-trip.json.
// After changing what a spec turns into, re-record with OCA_RECORD_BUNDLES=1.
const service = createRecordedBundleService("spec-round-trip");
after(() => service.save());

const canonical = (spec) => editorStateToSpec(specToEditorState(spec));
const sortLanguages = (spec) => ({ ...spec, languages: [...spec.languages].sort() });

describe("spec -> OCA package -> spec", () => {
  for (const [name, spec] of Object.entries({ richSpec, frenchOnlySpec, germanJapaneseSpec })) {
    test(name, async () => {
      const parsed = schemaSpecSchema.parse(spec);
      assert.deepEqual(checkSchemaSpec(parsed).errors, []);

      const { ocaPackage, said } = await buildPackageFromSpec(parsed, {
        bundleService: service.bundleService
      });
      assert.equal(ocaPackage.oca_bundle.bundle.d, said);
      assert.deepEqual(summarizePackage(ocaPackage).integrity, { checked: true, valid: true });

      // The importer orders languages English first, then alphabetically.
      assert.deepEqual(
        sortLanguages(readSpecFromPackage(ocaPackage)),
        sortLanguages(canonical(parsed))
      );
    });
  }
});
