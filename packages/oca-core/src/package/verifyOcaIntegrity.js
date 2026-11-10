import { VerifyOcaPackage } from "oca_package";
import { getPackageBundle, getPackageDependencies } from "./packageUtils";

const COMPOSER_IMPORT = "__composerImportSource";

export function shouldVerifyOcaPackageCryptographically(pkg) {
  if (!pkg || typeof pkg !== "object") return false;
  const src = pkg[COMPOSER_IMPORT];
  return src !== "linkml" && src !== "zip";
}

function verifyBundleSad(bundle) {
  if (!bundle?.d) return false;
  try {
    return VerifyOcaPackage(bundle, bundle.d);
  } catch {
    return false;
  }
}

export function isOcaPackageIntegrityValid(pkg) {
  if (!pkg || typeof pkg !== "object") return false;
  if (pkg.d) {
    try {
      return VerifyOcaPackage(pkg, pkg.d);
    } catch {
      return false;
    }
  }
  const root = getPackageBundle(pkg);
  const deps = getPackageDependencies(pkg);
  const bundles = [root, ...deps].filter(Boolean);
  if (bundles.length === 0) return false;
  return bundles.every((b) => verifyBundleSad(b));
}
