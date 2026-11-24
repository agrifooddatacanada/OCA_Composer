#!/usr/bin/env node
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createServer, SERVER_VERSION } from "./server.js";

// stdout is the MCP JSON-RPC channel; any stray console output there corrupts the session.
console.log = console.error;
console.info = console.error;
console.debug = console.error;

const server = createServer();
await server.connect(new StdioServerTransport());
process.stderr.write(`[oca-composer-mcp] v${SERVER_VERSION} ready on stdio\n`);
