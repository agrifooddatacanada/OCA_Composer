/**
 * Framework-free package assembly for exports: resolving refs:/refn: reference tokens
 * to SAIDs, and generating the final OCA package with oca_package. Moved from
 * src/hooks/useOCAExport.js.
 *
 * A schema's "materialization key" (its English name when it has one) is an alias
 * used to resolve references; callers that can look up schema names pass
 * getMaterializationKey, otherwise the schema id is used.
 */
import { OcaPackage } from "oca_package";
import {
  alignAdcExtensionKeysToPackageBundles,
  normalizeNonSaidBundleDigestsForOcaPackage
} from "../package/packageUtils";

export const throwUnresolvedReferenceError = (unresolvedTokens) => {
  if (!unresolvedTokens?.length) return;
  throw new Error(
    `Unresolved reference tokens from UI state: ${unresolvedTokens.slice(0, 6).join(", ")}`
  );
};

export const setResolvedSaidForSchema = (
  saidByReferenceToken,
  schemaId,
  said,
  getMaterializationKey = (id) => id
) => {
  if (!schemaId || !said) return;
  saidByReferenceToken[schemaId] = said;
  saidByReferenceToken[getMaterializationKey(schemaId)] = said;
};

export const createResolveSaid =
  (saidByReferenceToken, getMaterializationKey = (id) => id) =>
  (token) => {
    if (!token) return null;
    if (saidByReferenceToken[token]) return saidByReferenceToken[token];
    const byMaterializationKey = saidByReferenceToken[getMaterializationKey(token)];
    if (byMaterializationKey) return byMaterializationKey;
    return null;
  };

export const getReferenceToken = (rawValue) => {
  const value = Array.isArray(rawValue) ? rawValue[0] : rawValue;
  if (typeof value !== "string") return null;
  if (value.startsWith("refs:") || value.startsWith("refn:")) return value.slice(5);
  return null;
};

export const seedResolvedAliasTokensFromBundles = (
  schemaBundles,
  saidByReferenceToken,
  getMaterializationKey = (id) => id
) => {
  const resolveSaid = createResolveSaid(saidByReferenceToken, getMaterializationKey);
  (schemaBundles || []).filter(Boolean).forEach((schemaBundle) => {
    const attrs = schemaBundle?.capture_base?.attributes;
    if (!attrs || typeof attrs !== "object") return;
    Object.entries(attrs).forEach(([attrName, rawValue]) => {
      const token = getReferenceToken(rawValue);
      if (!token) return;
      const resolvedSaid = resolveSaid(token);
      if (resolvedSaid) {
        saidByReferenceToken[attrName] = resolvedSaid;
      }
    });
  });
};

export const rewriteBundleRefs = ({ schemaBundle, resolveSaid }) => {
  const attrs = schemaBundle?.capture_base?.attributes;
  if (!attrs || typeof attrs !== "object") return [];

  const unresolvedTokens = [];

  Object.keys(attrs).forEach((attrName) => {
    const value = attrs[attrName];
    const token = getReferenceToken(value);
    if (!token) return;

    const isRefn = (Array.isArray(value) ? value[0] : value)?.startsWith("refn:");
    const resolvedSaid = resolveSaid(token);
    if (!resolvedSaid) {
      if (isRefn) return;
      unresolvedTokens.push(`${schemaBundle?.d || "bundle"}.${attrName}:${token}`);
      return;
    }

    attrs[attrName] = Array.isArray(value)
      ? [`refs:${resolvedSaid}`]
      : `refs:${resolvedSaid}`;
  });

  return unresolvedTokens;
};

export const validateExtension = (ext) => {
  if (!ext || typeof ext !== "object") throw new Error("extension must be an object");
  const adc = ext.extensions?.adc;
  if (!adc || typeof adc !== "object") return;
  Object.entries(adc).forEach(([schemaKey, overlays]) => {
    if (!overlays || (typeof overlays !== "object" && !Array.isArray(overlays))) {
      throw new Error(`extensions.adc.${schemaKey} must be an object or array`);
    }
    const overlayArray = Array.isArray(overlays) ? overlays : [overlays];
    overlayArray.forEach((ov, idx) => {
      if (!ov || typeof ov !== "object")
        throw new Error(
          `overlay at extensions.adc.${schemaKey}[${idx}] is not an object`
        );
      if (ov.form_overlay) {
        const fo = ov.form_overlay.form_overlays;
        if (!Array.isArray(fo))
          throw new Error("form_overlay.form_overlays must be an array");
        fo.forEach((page, pidx) => {
          if (!page || typeof page !== "object")
            throw new Error(`form_overlays[${pidx}] must be an object`);
          if (page.labels && typeof page.labels === "object") {
            Object.entries(page.labels).forEach(([lang, label]) => {
              if (typeof lang !== "string")
                throw new Error("form overlay page label language key is not a string");
              if (typeof label !== "string")
                throw new Error(`form overlay page label for ${lang} must be a string`);
            });
          }
        });
      }
    });
  });
};

export const prepareExtensionForOcaPackage = (extension, bundlePayload) => {
  const adcMerged = { ...(extension?.extensions?.adc || {}) };
  alignAdcExtensionKeysToPackageBundles(adcMerged, bundlePayload);
  normalizeNonSaidBundleDigestsForOcaPackage(bundlePayload, adcMerged);
  return { extensions: { adc: adcMerged } };
};

export const generateOcaPackageJson = (extension, bundlePayload) => {
  const alignedExtension = prepareExtensionForOcaPackage(extension, bundlePayload);
  validateExtension(alignedExtension);
  try {
    const ocaPackageService = new OcaPackage(alignedExtension, bundlePayload);
    return JSON.parse(ocaPackageService.GenerateOcaPackage());
  } catch (e) {
    console.error("Failed to generate OCA package from extension:", e, alignedExtension);
    throw new Error(`Failed to parse Extension JSON: ${e.message}`);
  }
};
