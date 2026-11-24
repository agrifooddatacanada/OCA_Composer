import { DEFAULT_BUNDLE_TIMEOUT_MS, OCA_REPOSITORY_API_URL } from "@oca-composer/oca-core";

export const DEFAULT_BUNDLE_SERVICE_URL = OCA_REPOSITORY_API_URL;
export { DEFAULT_BUNDLE_TIMEOUT_MS };

export class ConfigError extends Error {
  constructor(message) {
    super(message);
    this.name = "ConfigError";
  }
}

function readBundleServiceUrl(value) {
  if (value === undefined || value.trim() === "") return DEFAULT_BUNDLE_SERVICE_URL;
  let url;
  try {
    url = new URL(value.trim());
  } catch {
    throw new ConfigError(`OCA_REPOSITORY_API_URL is not a valid URL: "${value}".`);
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") {
    throw new ConfigError(`OCA_REPOSITORY_API_URL must be an http(s) URL, got "${value}".`);
  }
  return url.href.replace(/\/+$/, "");
}

function readTimeout(value) {
  if (value === undefined || value.trim() === "") return DEFAULT_BUNDLE_TIMEOUT_MS;
  const timeout = Number(value);
  if (!Number.isInteger(timeout) || timeout <= 0) {
    throw new ConfigError(
      `OCA_BUNDLE_TIMEOUT_MS must be a positive whole number of milliseconds, got "${value}".`
    );
  }
  return timeout;
}

/** Server settings from environment variables, set in the MCP client's server config. */
export function readConfig(env = process.env) {
  return {
    bundleServiceUrl: readBundleServiceUrl(env.OCA_REPOSITORY_API_URL),
    bundleTimeoutMs: readTimeout(env.OCA_BUNDLE_TIMEOUT_MS)
  };
}
