# Touchpoint 1: Edit Schema

The largest touchpoint, with three concerns: (a) register the overlay and build its configuration page, (b) serialize the configuration into the exported OCA package, (c) restore the configuration when a package is re-uploaded. Everything downstream (View Schema, READMEs, Excel, validator) reads the state shape and package keys you define here, so get this right first.

## 1a. Register the overlay

Four files make an overlay exist in the Composer:

**`src/constants/constants.js`** — add a display-name constant and register it in `overlayItems` (the registry the "Add feature" hub iterates). Also add the snake_case type constant used in the package JSON:

```js
export const FIELD_MY_OVERLAY = "My Overlay";        // display name, ~line 100

export const overlayItems = {
  // ...existing overlays...
  [FIELD_MY_OVERLAY]: false                          // false = not added by default
};

export const MY_OVERLAY = "my_overlay";              // snake_case type, near FILE_DELIMITER etc.
```

**`src/Overlays/Overlays.jsx`** — map the constant to a page name in `OVERLAY_TO_PAGE`:

```js
const OVERLAY_TO_PAGE = {
  // ...
  [FIELD_MY_OVERLAY]: "MyOverlay"
};
```

Adding/removing then works automatically: `addToSelected` flips the flag in `overlaySelections` via `updateSchema` and navigates to your page; the hub's remove button calls `deleteOverlayData`.

**`src/Home.js`** — import your component, add the page name to the overlay pages set (near `"DataSeparator"`), and render it:

```js
{currentPage === "MyOverlay" && <MyOverlay />}
```

**`src/utils/overlayUtils.js`** — add the overlay's reset shape to `overlayConfig` inside `resetOverlayValues`. This is what removal restores, so it must clear every state field you introduce:

```js
[FIELD_MY_OVERLAY]: {
  myOverlayData: {},        // whatever fields you add to schema state
  enableMyOverlay: false
}
```

If an overlay should only be addable under certain conditions (e.g. Range requires numeric attributes), add a gate in `isOverlayAddDisabled` in `src/utils/helpers.js`.

## 1b. Schema state defaults

Add your fields with defaults to `createDefaultSchemaState` in `src/schema/schemaStore.js`, next to the existing overlay fields (`decimalSeparator`, `fileDelimiterData`, `arrayDelimiterData`, `exampleData`, ...). Choose the shape by configuration level:

- Attribute-level: a map keyed by attribute name, e.g. `arrayDelimiterData: {}` → `{ "TreatmentCodes": "|" }`
- Schema-level: a small object or scalar with sensible defaults, e.g. `fileDelimiterData: { fieldDelimiter: ",", quoteChar: '"', ... }`

Defaults here must equal the reset shape in `resetOverlayValues` — divergence causes "removed" overlays to leave stale state behind.

## 1c. The configuration page

Create `src/Overlays/<MyOverlay>.jsx`. Use `src/Overlays/DataSeparator.jsx` as the structural template (a recent overlay with both schema-level forms and an attribute-level grid) and `src/Overlays/ExampleOverlay.jsx` for a purely attribute-level grid. The standard skeleton:

```jsx
const MyOverlay = () => {
  const { t } = useTranslation();
  const { setCurrentPage } = useContext(Context);
  const { getSchema, updateSchema } = useMultiSchema();
  const schemaState = getSchema();
  const deleteHandler = useDeleteOverlayHandler(FIELD_MY_OVERLAY);
  // read fields from schemaState, write with updateSchema({ myOverlayData: ... })
  return (
    <BackNextSkeleton /* back navigates to "Overlays" */>
      {/* DeleteConfirmation modal wired to deleteHandler */}
      {/* config UI per the Step 2 design */}
    </BackNextSkeleton>
  );
};
```

Conventions to follow (all visible in `DataSeparator.jsx`):

- Read state with `getSchema()`, write with `updateSchema({...})` — never local-only state for anything that must persist.
- Follow the Step 2 UI design; build from existing MUI components (`Select`, `TextField`, `Checkbox`, AG Grid for attribute tables) and `BackNextSkeleton` for page chrome.
- Include the remove/delete control via `useDeleteOverlayHandler(FIELD_MY_OVERLAY)` + the shared `DeleteConfirmation` modal, consistent with other overlay pages.
- Validate inline. Show field-level errors for wrong type / out-of-range / empty required values so a malformed configuration can't be saved. Enforce the constraints from the Step 1 draft here, not just in the validator.
- Wrap every user-facing string in `t(...)` and add the keys to translation files under `public/locales/` (check how existing overlay strings are registered).
- For attribute-level config, render one row per attribute from `schemaState.attributes`; only offer the config where it applies (e.g. Array Delimiter only renders for `Array[...]`-typed attributes).

## 1d. Serialize into the exported package

In `buildPackageFromTextDSL` in `src/hooks/useOCAExport.js`, add a conditional-spread branch to the `extensionOverlayPayload` object. Model it on the delimiter overlays:

```js
...(overlaySelections[FIELD_DATA_SEPARATOR_OVERLAY] && enableFileDelimiter
  ? {
      file_delimiter_overlay: {
        type: FILE_DELIMITER,
        delimiter: fileDelimiterData.fieldDelimiter,
        quote_char: fileDelimiterData.quoteChar,
        escape_char: fileDelimiterData.escapeChar,
        line_terminator: fileDelimiterData.lineTerminator,
        data_start_row: fileDelimiterData.dataStartRow
      }
    }
  : {}),
```

Rules:

- The key is `<overlay_name>_overlay` and the object's fields must match **exactly** what the Step 3 generator class in the OCA Package library reads from its `DynOverlay` input. Cross-reference the Step 3 class and its dispatcher case — do not guess field names. (Input names can differ from the saidified output: e.g. the decimal separator is exported as `decimal_separator` but appears as `delimiter` in the processed overlay.)
- Guard the spread with the overlay's selection flag **and** a non-empty check on the data (see the `array_delimiter_overlay` branch, which also requires `Object.keys(arrayDelimiterData).length > 0`). An unconfigured overlay must contribute nothing — no key, not `null`, not `{}` — because extra keys change the canonical JSON and the SAIDs.
- Destructure your state fields near the top of the function where `fileDelimiterData`, `arrayDelimiterData`, etc. are pulled from `schemaState`.

The payload is wrapped as `extensions.adc[<generated bundle digest>] = [extensionOverlayPayload]` and sent to the OCA Package library, which saidifies each overlay.

## 1e. Restore on upload

In `OCAParser.parseSchemaData` in `src/utils/ocaParser.js`:

1. **Write a parse helper** modeled on `_parseDataSeparatorOverlays` (~line 989). It must accept both ADC extension shapes:

```js
if (Array.isArray(adcExtensions)) {
  // pre-processed input: [{ my_overlay_overlay: {...} }, ...]
  overlay = adcExtensions.find((ov) => ov?.my_overlay_overlay)?.my_overlay_overlay;
} else {
  // post-processed package: { overlays: { my_overlay: { d, capture_base, type, ... } } }
  overlay = adcExtensions?.overlays?.my_overlay_overlay || adcExtensions?.overlays?.[MY_OVERLAY];
}
```

   Map the overlay fields back to your UI state shape, apply the same defaults as `createDefaultSchemaState` for missing fields, and return a `hasAny` boolean.

2. **Call it** in `parseSchemaData` near the `_parseDataSeparatorOverlays` / `_parseExampleOverlay` calls (~line 218), spread the resulting fields into the returned state object (~line 256), and pass `hasAny` into `_buildOverlaySelections` (~line 946) with a new parameter that sets `[FIELD_MY_OVERLAY]: hasMyOverlayExtension`. That flag is what makes the overlay show as "already added" in the Edit Schema hub.

3. **Absent key = not added.** When the overlay key is missing (older schemas), the helper's defaults must leave the overlay off: selection flag false, state at defaults, page empty. No special-casing needed if your defaults are right.

## Verify before moving on

- [ ] Overlay appears in the "Add feature" list; adding navigates to your page; removing clears all state
- [ ] All fields from the Step 1 draft are configurable and validated inline
- [ ] Exported JSON contains the `<overlay_name>_overlay` input exactly as Step 3 expects; absent overlay contributes no key
- [ ] Upload of an exported package restores the page identically; save → re-upload → re-save produces identical JSON
- [ ] Uploading an old schema without the overlay shows the overlay as not added
