---
name: implement-composer-overlay
description: Implement a new overlay end-to-end in the OCA Composer (this repo). Use this skill whenever the user asks to implement, add, or wire up a new overlay in the Composer — e.g. "implement the <name> overlay", "add the new overlay to the composer", "wire the overlay through the UI", "Step 4 of the overlay process" — or mentions ADC extension overlays, community overlays, OCA package extensions, the semantic engine, or making an overlay configurable/visible/validated in the Composer. Also use it when only a subset of touchpoints is requested (e.g. "show the overlay in the README" or "validate data against the overlay"), since the conventions here apply to each touchpoint individually.
---

# Implement a New Overlay in OCA Composer

A new overlay must be wired through **six user-facing touchpoints** — one per button on the Composer landing page. An overlay that works in only some of them is a broken feature: users would configure it in Edit Schema but never see it in their README, or export it in the package but lose it on re-upload.

| # | Touchpoint | What the overlay needs | Reference file |
|---|------------|------------------------|----------------|
| 1 | Edit Schema | Config page, serialize to package JSON, restore on upload | `references/edit-schema.md` |
| 2 | View Schema | Column in attribute table and/or metadata display | `references/view-schema.md` |
| 3 | Generate Text README | Section in the plain-text schema docs | `references/readmes.md` |
| 4 | Generate Markdown README | Section in the Markdown schema docs | `references/readmes.md` |
| 5 | Generate Data Entry Excel | Rows/columns in the "Schema Description" sheet | `references/data-entry-excel.md` |
| 6 | Verify Data | Validator enforcing the overlay's rules | `references/verify-data.md` |

Work through them **in order** — touchpoint 1 defines the state shape and package keys that all the others read. Read the matching reference file before starting each touchpoint; each one names the exact files, functions, and conventions, with the recently shipped Data Separator overlays as a worked example.

## Before writing any code: gather the three inputs

Every overlay is unique — it solves a different problem — so you cannot implement one from this skill alone. Ask the user for whatever is missing:

1. **The overlay draft (Step 1 of the overlay process).** A Markdown spec defining the overlay's `type` string, its keys with types and constraints, canonicalization rules, and MUST/SHOULD/MAY rules. The validator in touchpoint 6 must enforce exactly these rules; the labels and terminology across all six touchpoints must match this document.
2. **The UI design (Step 2).** Screens showing how the configuration page should look. Follow it; use existing MUI components and patterns from `src/Overlays/` rather than inventing new UI.
3. **The Step 3 implementation** in the OCA Package library ([OCA_package repo](https://github.com/agrifooddatacanada/oca_package)). The Composer's export must emit **exactly the input shape the Step 3 generator class expects** (the `<overlay_name>_overlay` key and its fields). If Step 3 isn't done or published yet, flag this to the user — the export touchpoint can't be finished against a guessed shape.

## The one decision that shapes everything: attribute-level vs schema-level

Determine from the draft whether the overlay's configuration is:

- **Attribute-level** — a value per schema attribute (e.g. Array Delimiter: `{ attributes: { TreatmentCodes: "|" } }`). This means: a per-attribute grid on the config page, a column in the View Schema table, per-attribute lines/rows in READMEs and Excel, and a validator that runs per-attribute.
- **Schema-level** — one global value (e.g. File Delimiter: delimiter, quote char, line terminator). This means: a compact form on the config page, display in metadata/"Global Schema Values" sections (not the attribute table), a single block in READMEs and Excel.

Some overlays are both (Data Separator houses schema-level file/decimal settings plus the attribute-level array delimiter). Each reference file describes both variants.

## Architecture primer

State and data flow you'll touch everywhere:

- **Schema state** lives in a React context: `src/schema/schemaContext.js` (`MultiSchemaProvider`, `useMultiSchema()`) with per-schema defaults in `createDefaultSchemaState` in `src/schema/schemaStore.js`. Components read via `getSchema()` and write via `updateSchema({...})`.
- **Overlay registry**: `src/constants/constants.js` defines a `FIELD_<NAME>_OVERLAY` display-name constant per overlay, the `overlayItems` map (which overlays exist), and snake_case type constants (e.g. `FILE_DELIMITER = "file_delimiter"`). The add/remove hub is `src/Overlays/Overlays.jsx` (`OVERLAY_TO_PAGE`); page routing is in `src/Home.js`.
- **Export**: `buildPackageFromTextDSL` in `src/hooks/useOCAExport.js` builds an `extensionOverlayPayload` object of `<overlay_name>_overlay` inputs and nests it under `extensions.adc[<bundle digest>]`. The OCA Package library (Step 3) turns each input into a saidified overlay.
- **Import**: `OCAParser.parseSchemaData` in `src/utils/ocaParser.js` reads `extensions.adc[<captureBaseId>]`, maps overlays back into UI state, and flips the overlay's selection flag so it shows as "already added".
- **Downstream consumers** (View Schema, READMEs, Excel, validator) read either the parsed schema state or `pkg.extensions.adc[<captureBaseId>].overlays.<overlay_name>` directly.

**The package has two shapes — handle both.** Before saidification the ADC extension entry is an *array* of input objects keyed `<overlay_name>_overlay`; after processing by the OCA Package library it is an object `{ overlays: { <overlay_name>: { d, capture_base, type, ...fields } } }`. The parser and README generators support both (see `_parseDataSeparatorOverlays` and `getNormalizedExtensionOverlays`). Note the input field names may differ from the output field names — always cross-check both against Step 3.

## Cross-cutting rules

- **Absent overlay leaves zero trace.** If the user did not add the overlay, its key must be omitted from the export (never `null` or `{}`), its README/Excel sections must not appear, its View Schema column must be hidden, and its validator must not run. This matters beyond tidiness: extra keys change the canonical JSON and therefore the SAIDs, breaking reproducibility.
- **Round-trip fidelity.** Create schema with overlay → export → re-upload → the config page must look identical and re-export must produce the same JSON. Test this explicitly; it's where most overlay bugs hide.
- **Consistent terminology.** The overlay's name, field labels, column headers, and error messages must match across all six touchpoints and the Step 1 draft. Wrap all user-facing strings in `t(...)` (react-i18next).
- **Grep, don't trust line numbers.** This codebase evolves. The reference files cite functions and show real snippets, but verify locations by searching for the named symbols and for the delimiter overlay constants (`FILE_DELIMITER`, `ARRAY_DELIMITER`, `FIELD_DATA_SEPARATOR_OVERLAY`) — the Data Separator implementation touches every file you need to touch, so it's a reliable map.

## Workflow

1. Read the Step 1 draft; confirm the Step 3 input shape; classify attribute-level vs schema-level.
2. Touchpoint 1 (`references/edit-schema.md`): constants → state defaults → config page → add/remove wiring → export branch → import parsing. Verify round-trip before moving on.
3. Touchpoints 2–5 (`references/view-schema.md`, `references/readmes.md`, `references/data-entry-excel.md`): thread the parsed data through each generator, matching existing formatting conventions.
4. Touchpoint 6 (`references/verify-data.md`): implement and register the validator; cover every MUST/SHOULD rule in the draft.
5. Run the final checklist below.

## Final checklist

- [ ] Round-trip: configure → export → upload → Edit Schema shows identical config; re-export produces identical JSON
- [ ] Export payload matches the Step 3 generator's expected input exactly
- [ ] View Schema shows the overlay (column and/or metadata) when present, nothing when absent
- [ ] Text and Markdown READMEs include the overlay section when configured, omit it entirely when not
- [ ] Data Entry Excel "Schema Description" sheet includes the overlay info; file opens cleanly in Excel and LibreOffice
- [ ] Verify Data flags violating data with clear messages; conforming data passes; schemas without the overlay are unaffected
- [ ] A schema without the overlay produces no trace of it in any generated artifact
- [ ] Names, labels, and error messages are consistent across all six touchpoints and match the Step 1 draft
- [ ] All user-facing strings are translated via `t(...)`
