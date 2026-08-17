# Touchpoint 2: View Schema

The View Schema page (`src/ViewSchema/ViewSchema.js`) renders a read-only summary of an uploaded or in-progress schema. Its attribute table is an AG Grid built by `src/ViewSchema/ViewGrid.js`: one row per attribute, one column per configured overlay property. The data comes from the same schema state populated by `OCAParser.parseSchemaData` on upload, so touchpoint 1's import work must be done first.

## Attribute-level configuration → a grid column

Two edits in `ViewGrid.js`, both keyed off the overlay selection map (`getListOfSelectedOverlays(overlay)` iterates the selected `FIELD_*` keys):

**1. Column definition.** In the `getColumns` effect, add an `else if (overlayKey === FIELD_MY_OVERLAY)` branch pushing a column def. The Array Delimiter branch is the model — note how it returns early (hides the column) when its sub-feature is disabled, and how raw values are prettified for display:

```js
} else if (overlayKey === FIELD_DATA_SEPARATOR_OVERLAY) {
  if (!schemaState?.enableArrayDelimiter) return;   // hide column when not enabled
  predefinedColumns.push({
    field: "ArrayDelimiter",
    width: 160,
    autoHeight: true,
    headerComponent: CellHeader,
    headerComponentParams: {
      headerText: t("Array Delimiter"),
      helpText: t("Delimiter used between values inside this array attribute")
    },
    valueFormatter: (params) => arrayDelimiterLabel(params.value)
  });
}
```

Use a short, descriptive header label matching the Step 1 draft's terminology, and a `helpText` tooltip explaining the value. One column per attribute-level field (an overlay with two per-attribute fields gets two columns).

**2. Row values.** In the row-data effect below (`newRowData.forEach((item) => {...})`), populate `item.<Field>` from schema state, mirroring the column's `field` name:

```js
if (overlay[FIELD_DATA_SEPARATOR_OVERLAY] && schemaState?.enableArrayDelimiter) {
  const isArrayType = typeof item.Type === "string" && item.Type.startsWith("Array[");
  item.ArrayDelimiter = isArrayType
    ? (schemaState?.arrayDelimiterData || {})[item.Attribute] ?? ""
    : "";
}
```

Attributes not covered by the overlay get an empty string, consistent with other optional overlays. Add any schema-state fields you read to both effects' dependency arrays (see `schemaState?.arrayDelimiterData` / `schemaState?.enableArrayDelimiter` in the existing lists).

## Schema-level configuration → metadata display

Purely schema-level values (like the file delimiter or decimal separator) do **not** get attribute-table columns. They are displayed in the schema metadata area instead — `src/ViewSchema/SchemaDescription.js` renders the name/description/classification header. If there is an established section for global values, add yours there following its layout; if not, follow whatever the current pattern is for schema-wide overlay values on this page (as of the delimiter release, file/decimal delimiter values surface in READMEs and Excel rather than View Schema — check with the user if the Step 2 design expects them here).

## Checklist

- [ ] Attribute-level fields appear as columns with concise headers and help tooltips
- [ ] Column hidden (or consistently empty) when the overlay is absent or disabled
- [ ] Row values render prettified where raw values are unreadable (e.g. `\t` → "Tab (\\t)")
- [ ] Schema-level values shown in the metadata area if the design calls for it
- [ ] New state reads added to the effects' dependency arrays
