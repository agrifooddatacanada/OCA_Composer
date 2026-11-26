import { build } from "esbuild";
import { fileURLToPath } from "node:url";

// oca-core is plain ESM source with extensionless relative imports (written for webpack and
// Jest), which Node cannot load directly. It is bundled into the server; every npm package
// stays external and is resolved from node_modules at runtime.
const ocaCoreEntry = fileURLToPath(new URL("../oca-core/src/index.js", import.meta.url));

const bundleOcaCore = {
  name: "bundle-oca-core",
  setup(pluginBuild) {
    pluginBuild.onResolve({ filter: /^@oca-composer\/oca-core$/ }, () => ({
      path: ocaCoreEntry
    }));
  }
};

// lib modules are built as entry points too so tests can import them from dist.
await build({
  entryPoints: ["src/index.js", "src/server.js", "src/lib/*.js"],
  outdir: "dist",
  bundle: true,
  platform: "node",
  format: "esm",
  target: "node20",
  packages: "external",
  plugins: [bundleOcaCore],
  sourcemap: true,
  logLevel: "warning"
});
