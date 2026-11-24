import { describe, test } from "node:test";
import assert from "node:assert/strict";
import {
  ConfigError,
  DEFAULT_BUNDLE_SERVICE_URL,
  DEFAULT_BUNDLE_TIMEOUT_MS,
  readConfig
} from "../dist/server.js";

describe("readConfig", () => {
  test("defaults to the hosted bundle service used by OCA Composer", () => {
    assert.equal(DEFAULT_BUNDLE_SERVICE_URL, "https://api.adc.oca-repo.semanticengine.org");
    assert.deepEqual(readConfig({}), {
      bundleServiceUrl: DEFAULT_BUNDLE_SERVICE_URL,
      bundleTimeoutMs: DEFAULT_BUNDLE_TIMEOUT_MS
    });
    assert.deepEqual(readConfig({ OCA_REPOSITORY_API_URL: " ", OCA_BUNDLE_TIMEOUT_MS: "" }), {
      bundleServiceUrl: DEFAULT_BUNDLE_SERVICE_URL,
      bundleTimeoutMs: DEFAULT_BUNDLE_TIMEOUT_MS
    });
  });

  test("reads a custom service URL and timeout", () => {
    assert.deepEqual(
      readConfig({
        OCA_REPOSITORY_API_URL: "http://localhost:8000/",
        OCA_BUNDLE_TIMEOUT_MS: "5000"
      }),
      { bundleServiceUrl: "http://localhost:8000", bundleTimeoutMs: 5000 }
    );
  });

  test("rejects bad values with the variable name", () => {
    assert.throws(() => readConfig({ OCA_REPOSITORY_API_URL: "not a url" }), {
      name: "ConfigError",
      message: /OCA_REPOSITORY_API_URL is not a valid URL/
    });
    assert.throws(() => readConfig({ OCA_REPOSITORY_API_URL: "ftp://example.org" }), ConfigError);
    for (const value of ["0", "-1", "1.5", "soon"]) {
      assert.throws(() => readConfig({ OCA_BUNDLE_TIMEOUT_MS: value }), {
        message: /OCA_BUNDLE_TIMEOUT_MS must be a positive whole number/
      });
    }
  });
});
