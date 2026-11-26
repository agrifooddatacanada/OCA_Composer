/**
 * @jest-environment node
 */
import {
  BundleServiceError,
  buildSchemaExport,
  createBundleClient,
  formatBundleServiceError,
  generateOcaBundle,
  overlayItems
} from "@oca-composer/oca-core";

jest.mock("uuid", () => ({ v4: () => "uuid" }));

const BASE_URL = "https://bundles.test";
const SAID = "EHBbGPlmU3HDibUOewgcbXi7T107HCvWVJ7eeAbPc51V";

// Response bodies recorded from the hosted service (api.adc.oca-repo.semanticengine.org).
const CREATED = { success: true, said: SAID };
const REJECTED = {
  success: false,
  errors: [
    { ln: 1, col: 24, c: "ADD ATTRIBUTE probe_id=Txt", e: "parsing error: expected _attr_type" }
  ]
};
const NOT_FOUND = { success: false, errors: [`No OCA Bundle found for said: ${SAID}`] };
const BUNDLE_RESPONSE = {
  v: "OCAA11JSON0001f7_",
  bundle: {
    v: "OCAS11JSON0001da_",
    d: SAID,
    capture_base: {
      d: "EBMhXJBLiG6E3C7myssdoueKPNS8w9Ddzm5OBmnjNxhu",
      type: "spec/capture_base/1.1",
      attributes: { probe_id: "Text" },
      classification: "",
      flagged_attributes: []
    },
    overlays: {}
  },
  dependencies: []
};

const reply = (body, { status = 200 } = {}) => ({
  ok: status >= 200 && status < 300,
  status,
  text: async () => (typeof body === "string" ? body : JSON.stringify(body))
});

// Routes by method: { POST: response, GET: response }; records every call.
const fakeFetch = (routes) => {
  const calls = [];
  const fetch = jest.fn(async (url, init = {}) => {
    calls.push({ url, method: init.method, body: init.body, headers: init.headers });
    const route = routes[init.method || "GET"];
    if (route instanceof Error) throw route;
    return route;
  });
  return { fetch, calls };
};

const expectBundleError = async (promise, kind) => {
  let caught;
  try {
    await promise;
  } catch (error) {
    caught = error;
  }
  expect(caught).toBeInstanceOf(BundleServiceError);
  expect(caught.kind).toBe(kind);
  return caught;
};

describe("createBundleClient", () => {
  test("posts the DSL, then fetches the bundle by SAID", async () => {
    const { fetch, calls } = fakeFetch({ POST: reply(CREATED), GET: reply(BUNDLE_RESPONSE) });
    const client = createBundleClient({ baseUrl: `${BASE_URL}/`, fetch });

    await expect(client.generateBundle("ADD ATTRIBUTE probe_id=Text")).resolves.toEqual(
      BUNDLE_RESPONSE
    );
    expect(calls).toEqual([
      {
        url: `${BASE_URL}/oca-bundles`,
        method: "POST",
        body: "ADD ATTRIBUTE probe_id=Text",
        headers: { "Content-Type": "text/plain" }
      },
      { url: `${BASE_URL}/oca-bundles/${SAID}`, method: "GET", body: undefined, headers: undefined }
    ]);
  });

  test("generateOcaBundle is a one-shot shorthand", async () => {
    const { fetch } = fakeFetch({ POST: reply(CREATED), GET: reply(BUNDLE_RESPONSE) });
    await expect(generateOcaBundle("ADD ATTRIBUTE a=Text", { baseUrl: BASE_URL, fetch })).resolves
      .toEqual(BUNDLE_RESPONSE);
  });

  test("defaults to the hosted service", () => {
    const client = createBundleClient({ fetch: jest.fn() });
    expect(client.baseUrl).toBe("https://api.adc.oca-repo.semanticengine.org");
  });

  test("reports parser rejections with line, column and a caret", async () => {
    const { fetch } = fakeFetch({ POST: reply(REJECTED) });
    const error = await expectBundleError(
      createBundleClient({ baseUrl: BASE_URL, fetch }).generateBundle("ADD ATTRIBUTE probe_id=Txt"),
      "rejected"
    );
    expect(error.errors).toEqual(REJECTED.errors);
    expect(error.message).toBe(
      [
        "The OCA bundle service rejected the schema (1 error reported):",
        "- Line 1, column 24: parsing error: expected _attr_type",
        "    ADD ATTRIBUTE probe_id=Txt",
        "                           ^"
      ].join("\n")
    );
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  test("reports an unknown SAID", async () => {
    const { fetch } = fakeFetch({ GET: reply(NOT_FOUND) });
    const error = await expectBundleError(
      createBundleClient({ baseUrl: BASE_URL, fetch }).fetchBundle(SAID),
      "not_found"
    );
    expect(error.message).toContain(`No OCA Bundle found for said: ${SAID}`);
  });

  test("reports HTTP errors with the status and body", async () => {
    const { fetch } = fakeFetch({ POST: reply("<html>Bad Gateway</html>", { status: 502 }) });
    const error = await expectBundleError(
      createBundleClient({ baseUrl: BASE_URL, fetch }).createBundle("ADD ATTRIBUTE a=Text"),
      "http"
    );
    expect(error.status).toBe(502);
    expect(error.message).toBe(
      "The OCA bundle service returned HTTP 502 while creating the bundle: <html>Bad Gateway</html>"
    );
  });

  test("reports network failures with the service URL", async () => {
    const { fetch } = fakeFetch({ POST: new TypeError("fetch failed") });
    const error = await expectBundleError(
      createBundleClient({ baseUrl: BASE_URL, fetch }).createBundle("ADD ATTRIBUTE a=Text"),
      "network"
    );
    expect(error.message).toBe(
      `Could not reach the OCA bundle service at ${BASE_URL} while creating the bundle: fetch failed`
    );
  });

  test("times out a request that never answers", async () => {
    const fetch = jest.fn(
      (url, { signal }) =>
        new Promise((resolve, reject) => {
          signal.addEventListener("abort", () => reject(new Error("aborted")));
        })
    );
    const error = await expectBundleError(
      createBundleClient({ baseUrl: BASE_URL, fetch, timeoutMs: 20 }).createBundle("x"),
      "timeout"
    );
    expect(error.message).toContain("did not respond within 20 ms while creating the bundle");
  });

  test.each([
    ["non-JSON body", reply("OK"), "is not JSON"],
    ["empty body", reply(""), "is not JSON"],
    ["no SAID", reply({ success: true }), "did not return a SAID"]
  ])("reports an invalid create response (%s)", async (_, response, message) => {
    const { fetch } = fakeFetch({ POST: response });
    const error = await expectBundleError(
      createBundleClient({ baseUrl: BASE_URL, fetch }).createBundle("x"),
      "invalid_response"
    );
    expect(error.message).toContain(message);
  });

  test("reports a fetched response that holds no bundle", async () => {
    const { fetch } = fakeFetch({ GET: reply({ something: "else" }) });
    const error = await expectBundleError(
      createBundleClient({ baseUrl: BASE_URL, fetch }).fetchBundle(SAID),
      "invalid_response"
    );
    expect(error.message).toContain(`unexpected response for bundle ${SAID}`);
  });

  test("requires a fetch implementation", () => {
    expect(() => createBundleClient({ fetch: null })).toThrow("needs a fetch implementation");
  });
});

describe("formatBundleServiceError", () => {
  test("keeps the caret aligned in long lines", () => {
    const line = `ADD ATTRIBUTE ${Array.from({ length: 40 }, (_, i) => `attr_${i}=Text`).join(" ")}`;
    const col = line.indexOf("attr_20") + 1;
    const [, excerpt, caret] = formatBundleServiceError({ ln: 3, col, c: line, e: "bad" }).split(
      "\n"
    );
    expect(excerpt.startsWith("    ...")).toBe(true);
    expect(excerpt.endsWith("...")).toBe(true);
    expect(excerpt.slice(caret.indexOf("^"))).toMatch(/^attr_20=Text/);
  });

  test("passes plain strings and unknown shapes through", () => {
    expect(formatBundleServiceError("boom")).toBe("boom");
    expect(formatBundleServiceError({ code: 1 })).toBe('{"code":1}');
    expect(formatBundleServiceError({ e: "no position" })).toBe("no position");
  });
});

test("plugs into buildSchemaExport as the bundle generator", async () => {
  const { fetch, calls } = fakeFetch({ POST: reply(CREATED), GET: reply(BUNDLE_RESPONSE) });
  const client = createBundleClient({ baseUrl: BASE_URL, fetch });
  const result = await buildSchemaExport(
    {
      metadata: { name: "Probe", description: "", languages: ["English"] },
      attributes: [{ Attribute: "probe_id", Type: "Text" }],
      lanAttributeRowData: { English: [{ Attribute: "probe_id", Label: "Probe", Description: "" }] },
      entryCodes: {},
      overlaySelections: { ...overlayItems }
    },
    { schemaId: "s1", generateBundle: client.generateBundle }
  );

  expect(calls[0].body).toBe(result.textDSL);
  expect(result.generatedBundleDigest).toBe(SAID);
});
