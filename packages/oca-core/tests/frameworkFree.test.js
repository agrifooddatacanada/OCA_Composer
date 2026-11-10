/**
 * @jest-environment node
 */
import fs from "fs";
import path from "path";
import pkg from "../package.json";

jest.mock("react", () => {
  throw new Error("oca-core must not import react");
});
jest.mock("react-dom", () => {
  throw new Error("oca-core must not import react-dom");
});
jest.mock("react-router-dom", () => {
  throw new Error("oca-core must not import react-router-dom");
});
jest.mock("@mui/material", () => {
  throw new Error("oca-core must not import @mui/material");
});
jest.mock("i18next", () => {
  throw new Error("oca-core must not import i18next");
});
jest.mock("uuid", () => ({ v4: () => "uuid" }));
jest.mock("oca_package", () => ({ VerifyOcaPackage: jest.fn(), OcaPackage: jest.fn() }));

const SRC_ROOT = path.resolve(__dirname, "../src");

const listSourceFiles = (dir) =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return listSourceFiles(full);
    return entry.name.endsWith(".js") ? [full] : [];
  });

const importSpecifiers = (source) =>
  [...source.matchAll(/(?:^|\n)\s*(?:import|export)\b[^;]*?from\s+"([^"]+)"/g)].map(
    (match) => match[1]
  );

const packageNameOf = (specifier) =>
  specifier.startsWith("@") ? specifier.split("/").slice(0, 2).join("/") : specifier.split("/")[0];

const resolveRelative = (fromFile, specifier) => {
  const base = path.resolve(path.dirname(fromFile), specifier);
  return [base, `${base}.js`, path.join(base, "index.js")].find(
    (candidate) => fs.existsSync(candidate) && fs.statSync(candidate).isFile()
  );
};

describe("oca-core stays framework-free", () => {
  test("the public entry point loads in Node without React, MUI or i18next", () => {
    const core = require("@oca-composer/oca-core");
    expect(typeof core.OCABundle).toBe("function");
    expect(typeof core.OCAParser.parseSchemaData).toBe("function");
    expect(typeof core.mapLinkMLToOCABundle).toBe("function");
    expect(typeof core.parseOcaZipArrayBuffer).toBe("function");
    expect(typeof core.searchUnits).toBe("function");
  });

  test("source files only import within the package or from declared dependencies", () => {
    const declared = new Set(Object.keys(pkg.dependencies || {}));
    const violations = [];

    listSourceFiles(SRC_ROOT).forEach((file) => {
      const relativeFile = path.relative(SRC_ROOT, file);
      importSpecifiers(fs.readFileSync(file, "utf8")).forEach((specifier) => {
        if (specifier.startsWith(".")) {
          const resolved = resolveRelative(file, specifier);
          if (!resolved) {
            violations.push(`${relativeFile}: unresolved import "${specifier}"`);
          } else if (!resolved.startsWith(SRC_ROOT + path.sep)) {
            violations.push(`${relativeFile}: imports outside oca-core "${specifier}"`);
          }
        } else if (!declared.has(packageNameOf(specifier))) {
          violations.push(`${relativeFile}: undeclared dependency "${specifier}"`);
        }
      });
    });

    expect(violations).toEqual([]);
  });
});
