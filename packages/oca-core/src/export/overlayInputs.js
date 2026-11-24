/**
 * Pure builders for ADC extension overlay inputs (ordering, unit/attribute/entry-code
 * framing, range). Moved from src/utils/helpers.js, which re-exports them.
 */
import { CUSTOM_FORMAT_RULE, ENTRY_CODE_FRAMING } from "../constants/constants";

export const getTransformedEntryCodes = (entryCodes) => {
  const transformedEntryCodes = {};
  Object.entries(entryCodes).forEach(([attribute, codes]) => {
    transformedEntryCodes[attribute] = codes.map((item) => item.Code);
  });
  return transformedEntryCodes;
};

export const getUnitFramingInput = (unitFramingRowData) => {
  const unitFramingInput = {};
  for (const row of unitFramingRowData) {
    unitFramingInput[row.Unit] = {
      term_id: row["UCUM Code"],
      predicate_id: "skos:exactMatch",
      framing_justification: "semapv:ManualMappingCuration"
    };
  }
  return unitFramingInput;
};

export const getAttributeFramingInput = (
  attributeFramingRowData,
  attributesList = null
) => {
  const attributeFramingInput = {};
  // Create a Set of valid attributes if provided for O(1) lookup
  const validAttributes = attributesList ? new Set(attributesList) : null;

  for (const row of attributeFramingRowData) {
    if (!row.objectId) continue;

    // Skip if attribute doesn't exist in the schema
    if (validAttributes && !validAttributes.has(row.Attribute)) continue;

    attributeFramingInput[row.Attribute] = {
      description: row.description,
      framing_justification: row.mappingJustification,
      predicate_id: row.predicateId,
      term_id: row.objectId
    };
  }
  return attributeFramingInput;
};

// Entry code framing is edited per list, but the overlay is one instance per
// vocabulary (framing_metadata.id must be unique within the overlay type), so
// sources sharing an id across lists are merged into a single overlay.
export const getEntryCodeFramingInput = (
  entryCodeFramingSourcesByAttribute,
  entryCodesByAttribute
) => {
  const overlaysById = new Map();

  Object.entries(entryCodeFramingSourcesByAttribute || {}).forEach(
    ([attribute, sources]) => {
      if (!Array.isArray(sources)) return;
      const validCodes = new Set(
        (entryCodesByAttribute?.[attribute] || [])
          .map((entry) => String(entry?.Code ?? "").trim())
          .filter(Boolean)
      );
      if (validCodes.size === 0) return;

      sources.forEach((source) => {
        const metadata = source?.metadata || {};
        const id = String(metadata.id ?? "").trim();
        if (!id) return;

        const framedCodes = {};
        (source.rows || []).forEach((row) => {
          const code = String(row?.Code ?? "").trim();
          const termId = String(row?.objectId ?? "").trim();
          if (!termId || !validCodes.has(code)) return;
          const description = String(row.description ?? "").trim();
          framedCodes[code] = {
            ...(description ? { description } : {}),
            framing_justification: row.mappingJustification || "",
            predicate_id: row.predicateId || "",
            term_id: termId
          };
        });
        if (Object.keys(framedCodes).length === 0) return;

        let overlay = overlaysById.get(id);
        if (!overlay) {
          overlay = {
            type: ENTRY_CODE_FRAMING,
            framing_metadata: {
              id,
              label: metadata.label || "",
              location: metadata.location || "",
              version: metadata.version || ""
            },
            entry_codes: {}
          };
          overlaysById.set(id, overlay);
        }
        if (metadata.imports && Object.keys(metadata.imports).length > 0) {
          overlay.framing_metadata.imports = {
            ...(overlay.framing_metadata.imports || {}),
            ...metadata.imports
          };
        }
        overlay.entry_codes[attribute] = framedCodes;
      });
    }
  );

  return [...overlaysById.values()];
};

export const getRangeOverlayInput = (
  rangeRowData,
  formatRuleRowData,
  attributesList = null
) => {
  const rangeOverlayInput = {};
  // Create a Set of valid attributes if provided for O(1) lookup
  const validAttributes = attributesList ? new Set(attributesList) : null;

  rangeRowData.forEach((row) => {
    if (row.LowerBound === "" && row.UpperBound === "") return;

    // Skip if attribute doesn't exist in the schema
    if (validAttributes && !validAttributes.has(row.Attribute)) return;

    const attributeFormatData = formatRuleRowData.find(
      (item) => item.Attribute === row.Attribute
    );
    if (
      !attributeFormatData?.FormatText &&
      !attributeFormatData?.[CUSTOM_FORMAT_RULE] &&
      !attributeFormatData?.["Format Rule"]
    )
      return;

    rangeOverlayInput[row.Attribute] = {
      lower: row.LowerBound,
      lower_inclusive: row.LowerInclusive,
      upper: row.UpperBound,
      upper_inclusive: row.UpperInclusive
    };
  });
  return rangeOverlayInput;
};
