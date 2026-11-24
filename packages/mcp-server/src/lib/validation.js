import { OCABundle, errorCode, getPackageBundle } from "@oca-composer/oca-core";
import { InputError } from "./inputs.js";
import { parseSchemaState } from "./schemaSummary.js";

const ERROR_TYPE_NAMES = Object.fromEntries(
  Object.entries(errorCode).map(([name, code]) => [code, name])
);
const WITHHELD = "[withheld: sensitive attribute]";

/**
 * Turns parsed rows into the column-oriented input the validator expects, applying the
 * caller's column mapping. Columns mapped to null are skipped, like "do not verify" in the UI.
 */
function buildValidatorInput(headers, rows, columnMapping = {}) {
  for (const column of Object.keys(columnMapping)) {
    if (!headers.includes(column)) {
      throw new InputError(
        `column_mapping refers to "${column}", which is not a column in the dataset. Columns: ${headers.join(", ")}`
      );
    }
  }

  const columns = {};
  const columnSource = {};
  for (const header of headers) {
    const target = Object.hasOwn(columnMapping, header) ? columnMapping[header] : header;
    if (target === null || target === "") continue;
    if (Object.hasOwn(columns, target)) {
      throw new InputError(
        `Both "${columnSource[target]}" and "${header}" map to attribute "${target}".`
      );
    }
    columnSource[target] = header;
    columns[target] = rows.map((row) => row[header] ?? "");
  }
  return { columns, columnSource };
}

function normalizeIssue(raw) {
  if (typeof raw === "string") {
    return { type: errorCode.Format, message: raw };
  }
  return { type: raw?.type ?? "unknown", message: raw?.detail ?? String(raw) };
}

/**
 * Validates a dataset against the root schema of an OCA package using the Composer's
 * validator, and returns a summary plus a page of individual issues.
 */
export async function validateDataset(pkg, dataset, options = {}) {
  const {
    columnMapping,
    attribute,
    includeWarnings = true,
    offset = 0,
    limit = 50
  } = options;

  const bundle = getPackageBundle(pkg);
  const state = parseSchemaState(pkg);
  const sensitive = new Set(bundle.capture_base?.flagged_attributes ?? []);
  const decimalSeparator = state?.decimalSeparator || ".";
  const arrayDelimiterData = state?.arrayDelimiterData || {};

  const { columns, columnSource } = buildValidatorInput(
    dataset.headers,
    dataset.rows,
    columnMapping
  );

  const validator = new OCABundle();
  await validator.loadedBundle(bundle, pkg);
  const result = validator.validate(columns, decimalSeparator, arrayDelimiterData);

  const issues = [];
  for (const [rowIndex, rowErrors] of Object.entries(result.errCollection)) {
    for (const [attr, cellErrors] of Object.entries(rowErrors)) {
      for (const raw of cellErrors) {
        const { type, message } = normalizeIssue(raw);
        const value = columns[attr]?.[Number(rowIndex)];
        issues.push({
          row: Number(rowIndex) + 1,
          attribute: attr,
          column: columnSource[attr] ?? attr,
          type,
          type_name: ERROR_TYPE_NAMES[type] ?? type,
          message,
          value: sensitive.has(attr) ? WITHHELD : value
        });
      }
    }
  }
  issues.sort((a, b) => a.row - b.row || a.attribute.localeCompare(b.attribute));

  const byAttribute = {};
  const byType = {};
  let errorCount = 0;
  let warningCount = 0;
  const rowsWithErrors = new Set();
  for (const issue of issues) {
    const isWarning = issue.type === errorCode.Warning;
    if (isWarning) {
      warningCount += 1;
    } else {
      errorCount += 1;
      rowsWithErrors.add(issue.row);
    }
    byType[issue.type_name] = (byType[issue.type_name] ?? 0) + 1;
    byAttribute[issue.attribute] ??= { errors: 0, warnings: 0 };
    const counts = byAttribute[issue.attribute];
    if (isWarning) counts.warnings += 1;
    else counts.errors += 1;
  }

  const filtered = issues.filter(
    (issue) =>
      (!attribute || issue.attribute === attribute) &&
      (includeWarnings || issue.type !== errorCode.Warning)
  );
  const page = filtered.slice(offset, offset + limit);
  const nextOffset = offset + page.length < filtered.length ? offset + page.length : null;

  return {
    dataset: dataset.source,
    passed: errorCount === 0,
    rows_checked: dataset.rows.length,
    rows_with_errors: rowsWithErrors.size,
    error_count: errorCount,
    warning_count: warningCount,
    missing_attributes: [...result.missingAttrs],
    unmatched_columns: [...result.unmachedAttrs].map(
      (attr) => columnSource[attr] ?? attr
    ),
    errors_by_type: byType,
    errors_by_attribute: byAttribute,
    decimal_separator: decimalSeparator,
    sensitive_attributes_withheld: [...sensitive].filter((attr) => byAttribute[attr]),
    issues: {
      total: filtered.length,
      offset,
      limit,
      next_offset: nextOffset,
      items: page
    }
  };
}
