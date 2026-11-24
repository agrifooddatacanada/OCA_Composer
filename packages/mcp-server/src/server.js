import { writeFile, access } from "node:fs/promises";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import {
  findMissingLinkMLEnums,
  mapLinkMLToOCABundle,
  transformToPackage
} from "@oca-composer/oca-core";
import {
  InputError,
  loadDataset,
  loadLinkMLSchema,
  loadOcaPackage,
  resolveUserPath
} from "./lib/inputs.js";
import { summarizePackage } from "./lib/schemaSummary.js";
import { validateDataset } from "./lib/validation.js";
import {
  FORMAT_RULE_TYPES,
  listFormatRules,
  searchFormatRules,
  searchUcumUnits
} from "./lib/lookups.js";
import { VALIDATION_ERROR_CODES_MARKDOWN } from "./resources/validationErrorCodes.js";

export const SERVER_NAME = "oca-composer";
export const SERVER_VERSION = "0.1.0";

function log(message) {
  process.stderr.write(`[oca-composer-mcp] ${message}\n`);
}

function asJsonResult(data) {
  return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
}

function asErrorResult(err) {
  if (!(err instanceof InputError)) {
    log(err.stack ?? String(err));
  }
  return {
    isError: true,
    content: [{ type: "text", text: err.message || "The OCA Composer tool failed." }]
  };
}

function withErrors(handler) {
  return async (args) => {
    try {
      return await handler(args);
    } catch (err) {
      return asErrorResult(err);
    }
  };
}

const packageInput = {
  package_path: z
    .string()
    .optional()
    .describe("Absolute path to an OCA package JSON file, as exported by OCA Composer."),
  package_json: z
    .string()
    .optional()
    .describe(
      "The OCA package JSON as text. Use instead of package_path when there is no file."
    )
};

const READ_ONLY = { readOnlyHint: true, destructiveHint: false, openWorldHint: false };

export function createServer() {
  const server = new McpServer(
    { name: SERVER_NAME, version: SERVER_VERSION },
    {
      instructions:
        "Tools for OCA (Overlays Capture Architecture) schemas, backed by OCA Composer's own " +
        "logic. Never write OCA JSON, digests or validation results yourself: call these tools. " +
        "File arguments must be absolute paths on the user's machine."
    }
  );

  server.registerTool(
    "inspect_oca_package",
    {
      title: "Inspect an OCA package",
      description:
        "Summarize an OCA schema package: name, languages, digest integrity, and every " +
        "attribute with its type, required flag, sensitivity, format rule, entry codes, unit " +
        "and range. Use this before validating data or explaining a schema.",
      inputSchema: packageInput,
      annotations: READ_ONLY
    },
    withErrors(async (args) => asJsonResult(summarizePackage(await loadOcaPackage(args))))
  );

  server.registerTool(
    "validate_dataset",
    {
      title: "Validate a dataset against an OCA schema",
      description:
        "Validate a CSV, TSV or Excel dataset against an OCA package with the same validator " +
        "OCA Composer uses (format, entry codes, required entries, character encoding, ranges, " +
        "array delimiters). Returns counts by error type and attribute plus a page of " +
        "individual issues; page through more with offset. Rows are numbered from 1, " +
        "excluding the header row. Values of sensitive attributes are withheld. 'passed' " +
        "ignores warnings, as the Composer does.",
      inputSchema: {
        ...packageInput,
        dataset_path: z
          .string()
          .optional()
          .describe("Absolute path to a .csv, .tsv, .xlsx or .xls file."),
        dataset_csv: z
          .string()
          .optional()
          .describe(
            "Comma-separated data as text, with a header row. Use instead of dataset_path."
          ),
        sheet: z.string().optional().describe(
          // eslint-disable-next-line quotes -- Prettier formats strings containing double quotes as single-quoted
          'Excel sheet name. Defaults to the "Schema Conformant Data" sheet if present, else the first sheet.'
        ),
        column_mapping: z
          .record(z.string(), z.string().nullable())
          .optional()
          .describe(
            "Map dataset column names to schema attribute names when they differ. Map a column " +
              "to null to skip it. Unmapped columns are matched by name."
          ),
        attribute: z
          .string()
          .optional()
          .describe(
            "Only list issues for this attribute. Summary counts still cover everything."
          ),
        include_warnings: z.boolean().default(true),
        offset: z.number().int().min(0).default(0),
        limit: z.number().int().min(1).max(500).default(50)
      },
      annotations: READ_ONLY
    },
    withErrors(async (args) => {
      const pkg = await loadOcaPackage(args);
      const dataset = await loadDataset(args);
      if (dataset.headers.length === 0) {
        throw new InputError(`No header row found in ${dataset.source}.`);
      }
      const report = await validateDataset(pkg, dataset, {
        columnMapping: args.column_mapping,
        attribute: args.attribute,
        includeWarnings: args.include_warnings,
        offset: args.offset,
        limit: args.limit
      });
      return asJsonResult(report);
    })
  );

  server.registerTool(
    "search_ucum_units",
    {
      title: "Search UCUM units",
      description:
        "Look up valid UCUM unit codes by code, name or description (e.g. 'kg', 'gram', " +
        "'milligrams per decilitre'). Use the returned code in schemas; never invent unit codes.",
      inputSchema: {
        query: z.string().min(1),
        limit: z.number().int().min(1).max(20).default(10)
      },
      annotations: READ_ONLY
    },
    withErrors(async ({ query, limit }) =>
      asJsonResult({ query, results: searchUcumUnits(query, limit) })
    )
  );

  server.registerTool(
    "search_format_rules",
    {
      title: "Search predefined format rules",
      description:
        "Find OCA Composer's predefined format rules (regular expressions, date formats and " +
        "media types) by data type and keyword. Pass sample_values to see which rules accept " +
        "real data, best matches first, using the validator's own matching.",
      inputSchema: {
        type: z.enum(FORMAT_RULE_TYPES).optional(),
        query: z
          .string()
          .optional()
          .describe("Keyword, e.g. 'date', 'email', 'integer'."),
        sample_values: z
          .array(z.string())
          .max(200)
          .optional()
          .describe("Example values from the data to test each rule against.")
      },
      annotations: READ_ONLY
    },
    withErrors(async ({ type, query, sample_values }) =>
      asJsonResult(searchFormatRules({ type, query, sampleValues: sample_values }))
    )
  );

  server.registerTool(
    "convert_linkml_to_oca",
    {
      title: "Convert a LinkML schema to an OCA package",
      description:
        "Translate a LinkML schema (YAML or JSON) into an OCA package with OCA Composer's " +
        "LinkML translator. The result has provisional identifiers, not final digests: open " +
        "it in OCA Composer to review and publish it. Writes to output_path when given, " +
        "otherwise returns the package JSON.",
      inputSchema: {
        linkml_path: z
          .string()
          .optional()
          .describe("Absolute path to a LinkML .yaml/.json file."),
        linkml_text: z.string().optional().describe("The LinkML schema as text."),
        output_path: z
          .string()
          .optional()
          .describe("Absolute path to write the OCA package JSON to."),
        overwrite: z.boolean().default(false)
      },
      annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false }
    },
    withErrors(async (args) => {
      const linkml = await loadLinkMLSchema(args);
      const missingEnums = findMissingLinkMLEnums(linkml);
      const pkg = transformToPackage(mapLinkMLToOCABundle(linkml));
      const result = {
        summary: summarizePackage(pkg),
        warnings: missingEnums.map(
          (name) =>
            `Enum "${name}" is referenced but not defined; its entry codes are missing.`
        )
      };

      if (!args.output_path) {
        return asJsonResult({ ...result, package: pkg });
      }

      const outputPath = resolveUserPath(args.output_path);
      if (!args.overwrite) {
        const exists = await access(outputPath).then(
          () => true,
          () => false
        );
        if (exists) {
          throw new InputError(
            `${outputPath} already exists. Choose another path or set overwrite to true.`
          );
        }
      }
      await writeFile(outputPath, `${JSON.stringify(pkg, null, 2)}\n`, "utf8");
      return asJsonResult({ ...result, written_to: outputPath });
    })
  );

  server.registerResource(
    "validation-error-codes",
    "oca://reference/validation-error-codes",
    {
      title: "Validation error codes",
      description: "What each validate_dataset error type means and how to fix it.",
      mimeType: "text/markdown"
    },
    async (uri) => ({
      contents: [
        {
          uri: uri.href,
          mimeType: "text/markdown",
          text: VALIDATION_ERROR_CODES_MARKDOWN
        }
      ]
    })
  );

  server.registerResource(
    "format-rules",
    "oca://reference/format-rules",
    {
      title: "Predefined format rules",
      description: "Every predefined format rule in OCA Composer, by data type.",
      mimeType: "application/json"
    },
    async (uri) => ({
      contents: [
        {
          uri: uri.href,
          mimeType: "application/json",
          text: JSON.stringify(listFormatRules(), null, 2)
        }
      ]
    })
  );

  server.registerPrompt(
    "validate_and_explain",
    {
      title: "Validate a dataset and explain the problems",
      description:
        "Validate a dataset against an OCA schema and walk through how to fix it.",
      argsSchema: {
        package_path: z.string().describe("Absolute path to the OCA package JSON"),
        dataset_path: z
          .string()
          .describe("Absolute path to the CSV, TSV or Excel dataset")
      }
    },
    ({ package_path, dataset_path }) => ({
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text:
              `Validate the dataset at ${dataset_path} against the OCA schema at ${package_path}.\n\n` +
              "1. Call inspect_oca_package to understand the schema.\n" +
              "2. Call validate_dataset. If columns are reported as unmatched and they clearly " +
              "correspond to schema attributes, call it again with column_mapping.\n" +
              "3. Summarize the result: whether it passed, the most common problems, and which " +
              "attributes are affected. Read oca://reference/validation-error-codes for what " +
              "each error type means.\n" +
              "4. For each kind of problem, show a few example rows and propose a concrete fix. " +
              "Do not modify any files."
          }
        }
      ]
    })
  );

  return server;
}
