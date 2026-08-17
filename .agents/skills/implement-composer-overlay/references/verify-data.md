# Touchpoint 6: Verify Data

Data verification is the semantic engine's core function: the user uploads a data file and every cell is checked against the schema's rules. Your overlay's MUST/SHOULD rules from the Step 1 draft must be enforced here.

There is no plugin registry — validators are **methods on the `OCABundle` class** in `src/OCADataValidator/validator.js`, invoked in fixed order from `validate()`:

```js
validate(dataset, decimalSeparator = ".", arrayDelimiterData = {}) {
  const rslt = this.ErrorBuilder;
  rslt.attErr.errs = this.validateAttribute(dataset);
  rslt.formatErr.errs = this.validateFormat(dataset, decimalSeparator);
  rslt.entryCodeErr.errs = this.validateEntryCodes(dataset);
  rslt.characterEcodeErr.errs = this.validateCharacterEncoding(dataset);
  rslt.rangeErr.errs = this.validateRange(dataset, decimalSeparator);
  rslt.warningErr.errs = this.validateArrayDelimiter(dataset, arrayDelimiterData);
  return rslt.updateErr();
}
```

`dataset` is `{ attributeName: [cellRow0, cellRow1, ...] }`. The caller is `handleValidate` in `src/OCADataValidator/OCADataValidatorCheck.js`, which builds that map and passes overlay config from schema state (`schemaState?.decimalSeparator`, `schemaState?.arrayDelimiterData`).

## Getting the overlay configuration

Two established routes — pick the one matching your overlay:

- **From schema state via `validate()` parameters** (like `arrayDelimiterData`): add a parameter to `validate()` and pass `schemaState?.myOverlayData || {}` from `handleValidate`. Works because `OCAParser` hydrated the state on upload (touchpoint 1e).
- **From the package directly inside the validator** (like `validateRange`): `this.ocaPackage?.extensions?.[ADC]?.[getRootCaptureBaseId(this.ocaPackage)]?.overlays?.[MY_OVERLAY]`.

## Writing the validator method

Model on `validateArrayDelimiter` — it shows the full shape including the no-op behavior:

```js
validateMyOverlay(dataset, myOverlayData) {
  const rslt = this.ErrorBuilder.myOverlayErr;   // or an existing bucket, see below
  const attributes = this.getAttributes();
  for (const attr in attributes) {
    if (!Object.prototype.hasOwnProperty.call(attributes, attr)) continue;

    const config = myOverlayData[attr];
    if (!config) continue;                       // attribute not covered → skip entirely

    rslt.errs[attr] = {};
    for (let i = 0; i < dataset[attr]?.length; i++) {
      const dataEntry = dataset[attr][i];
      if (dataEntry === undefined || dataEntry === null) continue;   // empty cells: usually pass

      if (violatesRule(dataEntry, config)) {
        rslt.errs[attr][i] = {
          type: errorCode.MyOverlay,
          detail: "Human-readable message explaining what is wrong and what was expected."
        };
      }
    }
  }
  return rslt.errs;
}
```

The result shape is non-negotiable: `errs[attributeName][rowIndex] = { type, detail }`. The shared reporting logic (`OCADataSetErr.updateErr()` in `src/OCADataValidator/utils/Err.js`) aggregates these buckets into `errCollection[rowIndex] = { [column]: [{ type, detail }] }`, which drives cell highlighting and tooltips without modification.

**No-op when absent.** When the overlay isn't in the schema, the config map is empty and every attribute is skipped — zero errors, zero cost. Preserve this: schemas without the overlay must not be penalized or slowed.

**Edge cases to handle deliberately** (decide each against the Step 1 draft):
- null/undefined/empty cells — usually pass (emptiness is the conformance overlay's job, not yours)
- cells with unexpected types — validate, don't crash; string-coerce like existing validators do
- attributes the overlay doesn't cover — skip, never error
- interactions with other overlays (e.g. array delimiter detection excludes the decimal separator character) — put nontrivial matching logic in a helper under `src/OCADataValidator/utils/` (see `arrayDelimiterOverlay.js`) so it's testable

## Error severity and surfacing

Decide error vs warning from the draft's MUST (error) vs SHOULD (warning) language:

- **Warning**: reuse the `warningErr` bucket with `type: errorCode.Warning` (what `validateArrayDelimiter` does). Cells render yellow.
- **Hard error**: add a code to `errorCode` in `src/constants/constants.js` (e.g. `Format: "FE"`, `Range: "RE"`), add a bucket class + instance in `Err.js` following `RangeErr`, wire the bucket into `updateErr()`/`getAllErrs()`, and add the category to the filter dropdown in `src/OCADataValidator/ErrorFilterSelect.jsx`. Cells render pink.

Tooltips (`src/OCADataValidator/CustomTooltip.jsx`) display `detail` verbatim — write messages that name the expected value and the found value, e.g. `Warning: Array delimiter in data is "," but the schema specifies ";".`

## Checklist

- [ ] Validator method added and invoked from `validate()`; config passed from `handleValidate` or read from the package
- [ ] Result shape `errs[attr][rowIndex] = { type, detail }` — aggregation and UI work unchanged
- [ ] Every MUST/SHOULD rule from the Step 1 draft is enforced with the right severity
- [ ] No-op when the overlay is absent; uncovered attributes skipped
- [ ] Edge cases: empty cells, type mismatches, cross-overlay interactions
- [ ] Messages are clear and name expected vs actual; new error categories appear in the filter dropdown
