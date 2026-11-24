import { OCA_REPOSITORY_API_URL } from "../constants/constants";
import { getApiGeneratedBundle } from "../package/packageUtils";

export const DEFAULT_BUNDLE_TIMEOUT_MS = 30000;

const EXCERPT_RADIUS = 60;
const PREVIEW_LENGTH = 200;

export class BundleServiceError extends Error {
  /**
   * @param {string} message
   * @param {object} details
   * @param {"rejected"|"not_found"|"http"|"network"|"timeout"|"invalid_response"} details.kind
   * @param {number} [details.status] HTTP status, when the service answered
   * @param {Array} [details.errors] Errors as returned by the service
   */
  constructor(message, { kind, status, errors, cause } = {}) {
    super(message);
    this.name = "BundleServiceError";
    this.kind = kind;
    this.status = status;
    this.errors = errors || [];
    if (cause) this.cause = cause;
  }
}

// DSL lines can hold every attribute of a schema, so show a window around the column.
const excerptWithCaret = (line, col) => {
  const index = Math.max(0, Math.min(col - 1, line.length));
  const start = Math.max(0, index - EXCERPT_RADIUS);
  const end = Math.min(line.length, index + EXCERPT_RADIUS);
  const prefix = start > 0 ? "..." : "";
  const suffix = end < line.length ? "..." : "";
  const caretOffset = prefix.length + (index - start);
  return `    ${prefix}${line.slice(start, end)}${suffix}\n    ${" ".repeat(caretOffset)}^`;
};

/**
 * Turn one error from the bundle service into readable text. Parser errors arrive as
 * `{ ln, col, c, e }` (line, 1-based column, line content, message); others are strings.
 */
export const formatBundleServiceError = (error) => {
  if (error && typeof error === "object" && "e" in error) {
    const location = [
      Number.isInteger(error.ln) ? `Line ${error.ln}` : null,
      Number.isInteger(error.col) ? `column ${error.col}` : null
    ]
      .filter(Boolean)
      .join(", ");
    const heading = location ? `${location}: ${error.e}` : String(error.e);
    if (typeof error.c !== "string" || !Number.isInteger(error.col)) return heading;
    return `${heading}\n${excerptWithCaret(error.c, error.col)}`;
  }
  if (typeof error === "string") return error;
  return JSON.stringify(error);
};

const toErrorList = (errors) => {
  if (Array.isArray(errors)) return errors;
  return errors ? [errors] : [];
};

const describeErrors = (errors) =>
  errors.map((error) => `- ${formatBundleServiceError(error)}`).join("\n");

const preview = (text) => {
  const trimmed = String(text || "").trim();
  return trimmed.length > PREVIEW_LENGTH ? `${trimmed.slice(0, PREVIEW_LENGTH)}...` : trimmed;
};

/**
 * Client for the OCA bundle service: POST /oca-bundles turns OCA DSL into a bundle and
 * returns its SAID, GET /oca-bundles/{said} returns the bundle.
 *
 * @param {object} [options]
 * @param {string} [options.baseUrl] Service root, without the /oca-bundles path
 * @param {Function} [options.fetch] fetch implementation, defaults to the global one
 * @param {number} [options.timeoutMs] Per-request timeout
 */
export function createBundleClient({
  baseUrl = OCA_REPOSITORY_API_URL,
  fetch: fetchImpl = globalThis.fetch,
  timeoutMs = DEFAULT_BUNDLE_TIMEOUT_MS
} = {}) {
  if (typeof fetchImpl !== "function") {
    throw new TypeError("createBundleClient needs a fetch implementation");
  }
  const root = String(baseUrl).replace(/\/+$/, "");

  const request = async (path, init, action) => {
    const url = `${root}${path}`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      let response;
      let text;
      try {
        response = await fetchImpl(url, { ...init, signal: controller.signal });
        text = await response.text();
      } catch (cause) {
        if (controller.signal.aborted) {
          throw new BundleServiceError(
            `The OCA bundle service at ${root} did not respond within ${timeoutMs} ms while ${action}.`,
            { kind: "timeout", cause }
          );
        }
        throw new BundleServiceError(
          `Could not reach the OCA bundle service at ${root} while ${action}: ${cause?.message || cause}`,
          { kind: "network", cause }
        );
      }

      let data;
      try {
        data = text ? JSON.parse(text) : null;
      } catch (parseError) {
        // Left undefined: reported below as an HTTP or invalid-response error.
      }

      if (!response.ok) {
        const errors = toErrorList(data?.errors);
        const detail = errors.length ? `\n${describeErrors(errors)}` : ` ${preview(text)}`;
        throw new BundleServiceError(
          `The OCA bundle service returned HTTP ${response.status} while ${action}:${detail}`,
          { kind: "http", status: response.status, errors }
        );
      }
      if (data === undefined || data === null || typeof data !== "object") {
        throw new BundleServiceError(
          `The OCA bundle service returned a response that is not JSON while ${action}: ${preview(text)}`,
          { kind: "invalid_response", status: response.status }
        );
      }
      return { data, status: response.status };
    } finally {
      clearTimeout(timer);
    }
  };

  /** POST the DSL; resolves to the bundle SAID. */
  const createBundle = async (dsl) => {
    const { data, status } = await request(
      "/oca-bundles",
      { method: "POST", headers: { "Content-Type": "text/plain" }, body: dsl },
      "creating the bundle"
    );
    const errors = toErrorList(data.errors);
    if (data.success === false || errors.length > 0) {
      throw new BundleServiceError(
        `The OCA bundle service rejected the schema (${errors.length || "no"} error${
          errors.length === 1 ? "" : "s"
        } reported):\n${describeErrors(errors)}`,
        { kind: "rejected", status, errors }
      );
    }
    if (typeof data.said !== "string" || !data.said) {
      throw new BundleServiceError(
        "The OCA bundle service accepted the schema but did not return a SAID.",
        { kind: "invalid_response", status }
      );
    }
    return data.said;
  };

  /** GET a bundle by SAID; resolves to the service response ({ bundle, dependencies }). */
  const fetchBundle = async (said) => {
    const { data, status } = await request(
      `/oca-bundles/${encodeURIComponent(said)}`,
      { method: "GET" },
      `fetching bundle ${said}`
    );
    const errors = toErrorList(data.errors);
    if (data.success === false || errors.length > 0) {
      throw new BundleServiceError(
        `The OCA bundle service could not return bundle ${said}:\n${describeErrors(errors)}`,
        { kind: "not_found", status, errors }
      );
    }
    if (!getApiGeneratedBundle(data)) {
      throw new BundleServiceError(
        `The OCA bundle service returned an unexpected response for bundle ${said}: ${preview(
          JSON.stringify(data)
        )}`,
        { kind: "invalid_response", status }
      );
    }
    return data;
  };

  /** DSL in, bundle response out: the `generateBundle` contract of buildSchemaExport. */
  const generateBundle = async (dsl) => fetchBundle(await createBundle(dsl));

  return { baseUrl: root, timeoutMs, createBundle, fetchBundle, generateBundle };
}

export const generateOcaBundle = (dsl, options) => createBundleClient(options).generateBundle(dsl);
