// schemaId.js
//
// Canonicalizes schema IDs to handle root schema aliases.
// Problem: The root schema can be referenced by multiple identifiers:
//   - "root" (string literal)
//   - digest (e.g., "EJNfvCh1PK8qqUa52RcZ73uwxJRQZrFo2LGmwhxDRrC3")
//   - schema name from meta overlay (e.g., "Data Request Schema")
// Solution: Map all aliases to a single canonical ID (the digest) so they reference the same state.

import { getPackageBundle, getPackageBundleId } from "./packageUtils";

export const canonicalizeSchemaId = (pkg, id) => {
        if (!pkg) return id;
        // Canonical package: oca_bundle.bundle.d (legacy top-level bundle normalized on load)
        const rootDigest = getPackageBundleId(pkg);
        // Collect possible root names from meta overlays if present (handle array or object)
        const rootNames = new Set();
        const bundle = getPackageBundle(pkg);
        const metaOverlay = bundle?.overlays?.meta;
        if (Array.isArray(metaOverlay)) {
          metaOverlay.forEach((m) => {
            if (m && typeof m.name === "string") {
              rootNames.add(m.name);
            }
          });
        } else if (metaOverlay && typeof metaOverlay === "object") {
          Object.keys(metaOverlay).forEach((lang) => {
            const metaForLang = metaOverlay[lang];
            if (
              metaForLang &&
              typeof metaForLang === "object" &&
              typeof metaForLang.name === "string"
            ) {
              rootNames.add(metaForLang.name);
            }
          });
        }
        if (id === "root" || (rootDigest && id === rootDigest) || rootNames.has(id)) {
          return rootDigest || "root";
        }
        return id;
      };