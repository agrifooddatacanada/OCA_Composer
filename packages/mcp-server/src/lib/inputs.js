import { access, readFile, stat, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import path from "node:path";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import yaml from "js-yaml";
import {
  acceptOcaPackageOrNull,
  decodeBytesToString,
  normalizeInvertedExclamationAsDegree
} from "@oca-composer/oca-core";
import { schemaSpecSchema } from "./schemaSpec.js";

const MAX_FILE_BYTES = 50 * 1024 * 1024;

/** An error caused by the caller's input; its message is returned to the assistant as-is. */
export class InputError extends Error {}

export function resolveUserPath(filePath) {
  const expanded = filePath.startsWith("~")
    ? path.join(homedir(), filePath.slice(1))
    : filePath;
  if (!path.isAbsolute(expanded)) {
    throw new InputError(
      `"${filePath}" is not an absolute path. Pass the full path to the file.`
    );
  }
  return expanded;
}

async function readUserFile(filePath) {
  const resolved = resolveUserPath(filePath);
  let info;
  try {
    info = await stat(resolved);
  } catch {
    throw new InputError(`File not found: ${resolved}`);
  }
  if (!info.isFile()) {
    throw new InputError(`Not a file: ${resolved}`);
  }
  if (info.size > MAX_FILE_BYTES) {
    throw new InputError(
      `${resolved} is ${(info.size / 1024 / 1024).toFixed(1)} MB; the limit is ${MAX_FILE_BYTES / 1024 / 1024} MB.`
    );
  }
  return { resolved, bytes: await readFile(resolved) };
}

function requireExactlyOne(args, pathKey, inlineKey) {
  const hasPath = typeof args[pathKey] === "string" && args[pathKey] !== "";
  const hasInline = typeof args[inlineKey] === "string" && args[inlineKey] !== "";
  if (hasPath === hasInline) {
    throw new InputError(`Provide exactly one of "${pathKey}" or "${inlineKey}".`);
  }
  return hasPath;
}

/**
 * Loads an OCA package from a JSON file path or inline JSON text.
 * Legacy top-level { bundle, dependencies } packages are coerced to the canonical shape.
 */
export async function loadOcaPackage({ package_path, package_json }) {
  let text;
  let source;
  if (requireExactlyOne({ package_path, package_json }, "package_path", "package_json")) {
    const { resolved, bytes } = await readUserFile(package_path);
    text = decodeBytesToString(new Uint8Array(bytes));
    source = resolved;
  } else {
    text = package_json;
    source = "inline JSON";
  }

  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch (err) {
    throw new InputError(`The OCA package (${source}) is not valid JSON: ${err.message}`);
  }

  const pkg = acceptOcaPackageOrNull(parsed);
  if (!pkg) {
    throw new InputError(
      `The JSON from ${source} is not an OCA package: no root bundle found at oca_bundle.bundle.`
    );
  }
  return pkg;
}

/** A zod issue path as checkSchemaSpec writes it: attributes[3].type */
export const formatIssuePath = (issuePath) =>
  issuePath.reduce(
    (text, key) => (typeof key === "number" ? `${text}[${key}]` : text ? `${text}.${key}` : key),
    ""
  );

/**
 * Returns the schema spec passed inline (already checked against schemaSpecSchema by the
 * tool's input schema) or read from a JSON file.
 */
export async function loadSchemaSpec({ spec, spec_path }) {
  const hasPath = typeof spec_path === "string" && spec_path !== "";
  if (hasPath === (spec !== undefined)) {
    throw new InputError("Provide exactly one of \"spec\" or \"spec_path\".");
  }
  if (!hasPath) return spec;

  const { resolved, bytes } = await readUserFile(spec_path);
  let parsed;
  try {
    parsed = JSON.parse(decodeBytesToString(new Uint8Array(bytes)));
  } catch (err) {
    throw new InputError(`The schema spec (${resolved}) is not valid JSON: ${err.message}`);
  }
  const result = schemaSpecSchema.safeParse(parsed);
  if (!result.success) {
    const problems = result.error.issues.map((issue) =>
      issue.path.length ? `- ${formatIssuePath(issue.path)}: ${issue.message}` : `- ${issue.message}`
    );
    throw new InputError(
      `The schema spec in ${resolved} does not match the spec format:\n${problems.join("\n")}`
    );
  }
  return result.data;
}

/** Resolves an output path and fails if the file exists, unless overwrite is set. */
export async function prepareOutputPath(outputPath, { overwrite = false } = {}) {
  const resolved = resolveUserPath(outputPath);
  if (!overwrite) {
    const exists = await access(resolved).then(
      () => true,
      () => false
    );
    if (exists) {
      throw new InputError(
        `${resolved} already exists. Choose another path or set overwrite to true.`
      );
    }
  }
  return resolved;
}

export async function writeJsonFile(resolvedPath, data) {
  try {
    await writeFile(resolvedPath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
  } catch (err) {
    throw new InputError(`Could not write ${resolvedPath}: ${err.message}`);
  }
}

/** Loads a LinkML schema (YAML or JSON) from a file path or inline text. */
export async function loadLinkMLSchema({ linkml_path, linkml_text }) {
  let text;
  let source;
  if (requireExactlyOne({ linkml_path, linkml_text }, "linkml_path", "linkml_text")) {
    const { resolved, bytes } = await readUserFile(linkml_path);
    text = decodeBytesToString(new Uint8Array(bytes));
    source = resolved;
  } else {
    text = linkml_text;
    source = "inline text";
  }

  let schema;
  try {
    schema = yaml.load(text);
  } catch (err) {
    throw new InputError(
      `The LinkML schema (${source}) is not valid YAML or JSON: ${err.message}`
    );
  }
  if (!schema || typeof schema !== "object" || (!schema.slots && !schema.classes)) {
    throw new InputError(
      `The document from ${source} does not look like a LinkML schema (no "slots" or "classes").`
    );
  }
  return schema;
}

function parseDelimitedText(text, delimiter) {
  const result = Papa.parse(text, {
    delimiter,
    header: true,
    skipEmptyLines: "greedy",
    transform: normalizeInvertedExclamationAsDegree,
    transformHeader: (header, index) =>
      normalizeInvertedExclamationAsDegree(
        header !== "" ? header : `header_empty_placeholder_${index}`
      )
  });
  return { headers: result.meta.fields ?? [], rows: result.data };
}

// Matches the Composer's Excel handling: cells are read as formatted text, and trailing empty
// rows and columns are ignored.
function parseWorksheet(worksheet) {
  if (!worksheet?.["!ref"]) {
    return { headers: [], rows: [] };
  }
  const range = XLSX.utils.decode_range(worksheet["!ref"]);
  let lastRow = range.s.r;
  let lastCol = range.s.c;
  for (let row = range.s.r; row <= range.e.r; row++) {
    for (let col = range.s.c; col <= range.e.c; col++) {
      const cell = worksheet[XLSX.utils.encode_cell({ r: row, c: col })];
      if (cell && cell.v !== undefined && cell.v !== "") {
        if (row > lastRow) lastRow = row;
        if (col > lastCol) lastCol = col;
      }
    }
  }

  const matrix = XLSX.utils.sheet_to_json(worksheet, {
    raw: false,
    header: 1,
    defval: "",
    range: { s: range.s, e: { r: lastRow, c: lastCol } }
  });
  const headers = (matrix[0] ?? []).map((h, i) =>
    h !== "" ? String(h) : `header_empty_placeholder_${i}`
  );
  const rows = matrix.slice(1).map((cells) => {
    const row = {};
    headers.forEach((header, i) => {
      row[header] = cells[i] ?? "";
    });
    return row;
  });
  return { headers, rows };
}

/**
 * Reads a dataset from a CSV/TSV/Excel file or inline CSV text.
 * Excel workbooks use `sheet` when given, otherwise "Schema Conformant Data", otherwise the
 * first sheet.
 */
export async function loadDataset({ dataset_path, dataset_csv, sheet }) {
  if (!requireExactlyOne({ dataset_path, dataset_csv }, "dataset_path", "dataset_csv")) {
    return { source: "inline CSV", ...parseDelimitedText(dataset_csv, "") };
  }

  const { resolved, bytes } = await readUserFile(dataset_path);
  const ext = path.extname(resolved).toLowerCase();

  if (ext === ".csv" || ext === ".tsv" || ext === ".txt") {
    const text = decodeBytesToString(new Uint8Array(bytes));
    const delimiter = ext === ".tsv" ? "\t" : ext === ".csv" ? "," : "";
    return { source: resolved, ...parseDelimitedText(text, delimiter) };
  }

  if (ext === ".xlsx" || ext === ".xls") {
    const workbook = XLSX.read(bytes, { type: "buffer" });
    let sheetName = sheet;
    if (sheetName && !workbook.SheetNames.includes(sheetName)) {
      throw new InputError(
        `Sheet "${sheetName}" not found. Available sheets: ${workbook.SheetNames.join(", ")}`
      );
    }
    if (!sheetName) {
      sheetName = workbook.SheetNames.includes("Schema Conformant Data")
        ? "Schema Conformant Data"
        : workbook.SheetNames[0];
    }
    return {
      source: `${resolved} (sheet "${sheetName}")`,
      sheetNames: workbook.SheetNames,
      ...parseWorksheet(workbook.Sheets[sheetName])
    };
  }

  throw new InputError(
    `Unsupported dataset type "${ext || "(none)"}". Use .csv, .tsv, .xlsx or .xls.`
  );
}
