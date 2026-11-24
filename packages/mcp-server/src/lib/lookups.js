import {
  descriptionToFormatCodeBinary,
  descriptionToFormatCodeDate,
  descriptionToFormatCodeNumeric,
  descriptionToFormatCodeText,
  matchFormat,
  searchUnits
} from "@oca-composer/oca-core";

export const FORMAT_RULE_TYPES = ["Text", "Numeric", "DateTime", "Binary"];

const RULES_BY_TYPE = {
  Text: descriptionToFormatCodeText,
  Numeric: descriptionToFormatCodeNumeric,
  DateTime: descriptionToFormatCodeDate,
  Binary: descriptionToFormatCodeBinary
};

export function listFormatRules() {
  return FORMAT_RULE_TYPES.flatMap((type) =>
    Object.entries(RULES_BY_TYPE[type])
      .filter(([description, rule]) => description !== "" && rule !== "")
      .map(([description, rule]) => ({ type, description, rule }))
  );
}

/**
 * Finds the Composer's predefined format rules. With sample values, each rule reports how
 * many samples it accepts (using the validator's matching), best matches first.
 */
export function searchFormatRules({ type, query, sampleValues }) {
  const needle = query?.toLowerCase();
  let rules = listFormatRules().filter(
    (rule) =>
      (!type || rule.type === type) &&
      (!needle ||
        rule.description.toLowerCase().includes(needle) ||
        rule.rule.toLowerCase().includes(needle))
  );

  if (sampleValues?.length) {
    rules = rules
      .map((rule) => {
        const matched = sampleValues.filter((value) =>
          matchFormat(rule.type, rule.rule, String(value), false)
        ).length;
        return {
          ...rule,
          samples_matched: matched,
          samples_total: sampleValues.length,
          matches_all_samples: matched === sampleValues.length
        };
      })
      .sort((a, b) => b.samples_matched - a.samples_matched);
  }
  return rules;
}

export function searchUcumUnits(query, limit) {
  const { results } = searchUnits(query);
  return results.slice(0, limit).map(({ code, label, description }) => ({
    code,
    label,
    description
  }));
}
