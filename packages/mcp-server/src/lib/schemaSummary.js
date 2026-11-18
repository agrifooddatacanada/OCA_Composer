import {
  OCAParser,
  getFormatRuleDescription,
  getPackageBundle,
  getPackageBundleId,
  getPackageDependencies,
  isOcaPackageIntegrityValid,
  shouldVerifyOcaPackageCryptographically
} from "@oca-composer/oca-core";

/**
 * Parses a package with the Composer's own parser. Returns the editor-state object the UI
 * would show, or null when the package can't be parsed.
 */
export function parseSchemaState(pkg) {
  try {
    return OCAParser.parseSchemaData(getPackageBundleId(pkg), pkg);
  } catch (err) {
    process.stderr.write(
      `[oca-composer-mcp] could not parse schema state: ${err.message}\n`
    );
    return null;
  }
}

function checkIntegrity(pkg) {
  if (!shouldVerifyOcaPackageCryptographically(pkg)) {
    return {
      checked: false,
      valid: null,
      note: "Imported from LinkML or a legacy zip, so it has no digests to verify yet."
    };
  }
  return { checked: true, valid: isOcaPackageIntegrityValid(pkg) };
}

function describeAttribute(attr, state) {
  const name = attr.Attribute;
  const format = state.attributeFormats?.[name] ?? null;
  const entryCodes = (state.entryCodes?.[name] ?? []).map((row) => row.Code);
  const labels = {};
  for (const [language, rows] of Object.entries(state.lanAttributeRowData ?? {})) {
    const label = rows.find((row) => row.Attribute === name)?.Label;
    if (label) labels[language] = label;
  }

  const summary = {
    name,
    type: attr.Type,
    required: Boolean(attr.Required),
    sensitive: Boolean(attr.Sensitive)
  };
  if (attr.Description) summary.description = attr.Description;
  if (Object.keys(labels).length > 0) summary.labels = labels;
  if (format) {
    summary.format = format;
    const formatDescription = getFormatRuleDescription(attr.Type, format);
    if (formatDescription) summary.format_description = formatDescription;
  }
  if (entryCodes.length > 0) summary.entry_codes = entryCodes;
  if (attr.Unit) summary.unit = attr.Unit;
  if (state.attributeRanges?.[name]) summary.range = state.attributeRanges[name];
  if (state.attributeCardinality?.[name])
    summary.cardinality = state.attributeCardinality[name];
  if (state.arrayDelimiterData?.[name])
    summary.array_delimiter = state.arrayDelimiterData[name];
  return summary;
}

/** A compact, assistant-friendly description of an OCA package's root schema. */
export function summarizePackage(pkg) {
  const bundle = getPackageBundle(pkg);
  const state = parseSchemaState(pkg);
  const localized = state?.metadata?.localized ?? {};
  const firstLanguage = localized.eng ?? Object.values(localized)[0] ?? {};

  const summary = {
    schema_said: bundle?.d ?? null,
    package_said: pkg.d ?? null,
    name: firstLanguage.name ?? null,
    description: firstLanguage.description ?? null,
    languages: state?.metadata?.languages ?? [],
    classification: bundle?.capture_base?.classification ?? null,
    integrity: checkIntegrity(pkg)
  };

  if (state) {
    summary.decimal_separator = state.decimalSeparator || ".";
    summary.attribute_count = state.attributes.length;
    summary.attributes = state.attributes.map((attr) => describeAttribute(attr, state));
  } else {
    const attributes = bundle?.capture_base?.attributes ?? {};
    summary.attribute_count = Object.keys(attributes).length;
    summary.attributes = Object.entries(attributes).map(([name, type]) => ({
      name,
      type
    }));
    summary.note =
      "The Composer parser could not read this package; showing capture base only.";
  }

  const dependencies = getPackageDependencies(pkg);
  if (dependencies.length > 0) {
    summary.child_schemas = dependencies.map((dep) => ({
      schema_said: dep.d ?? null,
      attribute_count: Object.keys(dep.capture_base?.attributes ?? {}).length
    }));
  }
  return summary;
}
