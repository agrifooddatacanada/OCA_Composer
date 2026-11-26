import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";

const LIVE_URL = "https://api.adc.oca-repo.semanticengine.org";
export const RECORDED_BASE_URL = "https://bundle-service.recorded.invalid";

const sha256 = (text) => createHash("sha256").update(text).digest("hex");

const toRecording = async (response) => {
  const text = await response.text();
  try {
    return { status: response.status, json: JSON.parse(text) };
  } catch {
    return { status: response.status, text };
  }
};

const toResponse = ({ status, json, text }) =>
  new Response(json !== undefined ? JSON.stringify(json) : text, {
    status,
    headers: { "content-type": "application/json" }
  });

/**
 * A fetch for createBundleClient that replays responses of the hosted OCA bundle service
 * from test/fixtures/recordings/<name>.json, keyed by the posted DSL.
 *
 * With OCA_RECORD_BUNDLES=1 it calls the live service for anything not recorded yet, and
 * save() rewrites the file with exactly the responses the test used.
 */
export function createRecordedBundleService(name) {
  const file = new URL(`../fixtures/recordings/${name}.json`, import.meta.url);
  const record = process.env.OCA_RECORD_BUNDLES === "1";
  const stored = existsSync(file)
    ? JSON.parse(readFileSync(file, "utf8"))
    : { created: {}, bundles: {} };
  const used = { created: {}, bundles: {} };

  async function fetch(url, init = {}) {
    const { pathname } = new URL(url);
    const method = init.method || "GET";

    if (method === "POST" && pathname === "/oca-bundles") {
      const key = sha256(init.body);
      if (!stored.created[key]) {
        if (!record) {
          throw new Error(
            `No recorded bundle service response for this DSL (sha256 ${key}). ` +
              `Re-run with OCA_RECORD_BUNDLES=1 to record it.\n${init.body}`
          );
        }
        const live = await globalThis.fetch(`${LIVE_URL}/oca-bundles`, {
          method: "POST",
          headers: init.headers,
          body: init.body
        });
        stored.created[key] = { dsl: init.body, ...(await toRecording(live)) };
      }
      used.created[key] = stored.created[key];
      return toResponse(stored.created[key]);
    }

    const said = pathname.match(/^\/oca-bundles\/([^/]+)$/)?.[1];
    if (method === "GET" && said) {
      if (!stored.bundles[said]) {
        if (!record) {
          throw new Error(
            `No recorded bundle ${said}. Re-run with OCA_RECORD_BUNDLES=1 to record it.`
          );
        }
        stored.bundles[said] = await toRecording(
          await globalThis.fetch(`${LIVE_URL}/oca-bundles/${said}`)
        );
      }
      used.bundles[said] = stored.bundles[said];
      return toResponse(stored.bundles[said]);
    }

    throw new Error(`Unexpected bundle service request: ${method} ${url}`);
  }

  function save() {
    if (!record) return;
    mkdirSync(new URL(".", file), { recursive: true });
    writeFileSync(file, `${JSON.stringify(used, null, 2)}\n`);
  }

  return { bundleService: { baseUrl: RECORDED_BASE_URL, fetch }, save };
}
