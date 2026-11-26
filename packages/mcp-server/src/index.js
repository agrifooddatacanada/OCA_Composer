#!/usr/bin/env node
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { ConfigError, readConfig } from "./lib/config.js";
import { createServer, SERVER_VERSION } from "./server.js";

// stdout is the MCP JSON-RPC channel; any stray console output there corrupts the session.
console.log = console.error;
console.info = console.error;
console.debug = console.error;

let config;
try {
  config = readConfig();
} catch (err) {
  if (!(err instanceof ConfigError)) throw err;
  process.stderr.write(`[oca-composer-mcp] ${err.message}\n`);
  process.exit(1);
}

const server = createServer({ config });
await server.connect(new StdioServerTransport());
process.stderr.write(
  `[oca-composer-mcp] v${SERVER_VERSION} ready on stdio (bundle service ${config.bundleServiceUrl})\n`
);
