# Touchpoints 3 and 4: Text README and Markdown README

Both READMEs document the full schema for readers without Composer access. They are separate generators with the same rule: every configured overlay gets a section; an absent overlay gets nothing (no empty sections, no placeholders).

Both read ADC overlays from the **processed** package — `pkg.extensions.adc[<captureBaseId>].overlays.<overlay_name>` — where each overlay carries `d` (SAID), `capture_base`, `type`, and the spec fields. Each generator has a legacy ZIP-based sibling (`useGenerateReadMe.js`, `useGenerateMarkdownReadMe.js`) that does not handle ADC extensions; only touch those if the user asks.

## Touchpoint 3: Text README

File: `src/ViewSchema/useGenerateTextReadmeFromJson.js` (exported hook provides `jsonToTextFile`, wired to the landing button in `src/Landing/UseASchemaAccordionItem.js` / `AccordionList.js`).

Extension overlays are normalized by `getNormalizedExtensionOverlays(ocaPackage, captureBaseId)` — it flattens both package shapes into a `{ <overlay_name>: overlay }` map, stripping the `_overlay` suffix from array-shape keys. Your overlay lands in that map automatically; you only add the rendering.

Add a block to `getExtensionSectionLines(extensionOverlays, schemaBundle)` following the established format — `Layer name:` / `SAID/digest:` header, labeled values, and the `***` divider line. Schema-level example (file delimiter):

```js
if (Object.prototype.hasOwnProperty.call(extensionOverlays, FILE_DELIMITER)) {
  const fileOverlay = extensionOverlays[FILE_DELIMITER];
  if (fileOverlay?.delimiter !== undefined) {
    lines.push(
      `Layer name: ${fileOverlay.type}\n`,
      ...(fileOverlay.d ? [`SAID/digest: ${fileOverlay.d}\n`] : []),
      "\n",
      `Field delimiter: ${prettyDelimiter(fileOverlay.delimiter)}\n`,
      // ...one line per field...
      "\n",
      "******************************************************************\n"
    );
  }
}
```

Attribute-level example (array delimiter) — a `Schema attributes:` heading, then one indented line per attribute:

```js
lines.push(`Schema attributes: ${arrayOverlay.type}\n`);
Object.entries(arrayAttributes).forEach(([attribute, delimiter]) => {
  lines.push(`   ${attribute}: ${prettyDelimiter(delimiter)}\n`);
});
```

Conventions:

- Guard on meaningful content, not just key presence (the array delimiter block also checks `Object.keys(arrayAttributes).length > 0`), so an empty overlay prints nothing.
- Guard the `d` line with `...(overlay.d ? [...] : [])` — the pre-processed shape has no SAID.
- Prettify unprintable characters (`prettyDelimiter` renders `"\t"` as `\t (tab)`), otherwise tabs and quotes make the text unreadable.
- The SAID manifest at the top of the README is built generically by `getExtensionManifestEntries` — overlays with `type` and `d` are included automatically.

## Touchpoint 4: Markdown README

Files: `src/ViewSchema/useGenerateMarkdownReadMeFromJson.js` (hook `generateMarkdownReadMeFromJson`) and the shared formatters in `src/ViewSchema/markdownReadmeUtils.js`.

The hook reads each ADC overlay at hook scope:

```js
const myOverlay = pkg?.extensions?.[ADC]?.[rootCaptureBaseId]?.overlays?.[MY_OVERLAY];
```

then passes it into the relevant `markdownReadmeUtils.js` section builder. Mirror the text README's content with Markdown formatting; prefer tables (`generateTable(columns, rows)`) over flat lists.

**Schema-level** values go into the "Global Schema Values" table inside `generateInternationalSchemaInformation` — one `[label, value]` row per field, table emitted only if at least one overlay is present:

```js
if (file_delimiter) {
  delimiterRows.push(["File delimiter", file_delimiter.delimiter]);
  delimiterRows.push(["Quote character", file_delimiter.quote_char]);
  // ...
}
```

**Attribute-level** values become an extra column in the language-independent schema details table (`generateLanguageIndependentSchemaDetailsTable` in `markdownReadmeUtils.js` — it takes an options object, so pass your overlay in from the hook alongside `arrayDelimiterOverlay`): push the header conditionally, then push each row's cell conditionally in the same order:

```js
if (arrayDelimiterOverlay) {
  columns.push("Array Delimiter");
}
// ...inside the per-attribute row builder:
if (arrayDelimiterOverlay?.attributes?.[attribute]) {
  row.push(prettyPrintDelimiter(arrayDelimiterOverlay.attributes[attribute]));
}
```

Watch the column/cell pairing: if the column is pushed but a row lacks the value, push an empty string so cells don't shift. Escape Markdown-significant characters in values (see `escapeMarkdownSpecialCharacters` used for formats).

The overlay also appears in the SAID table automatically — the hook iterates `pkg.extensions[ADC][rootCaptureBaseId].overlays` generically for `layersForSaidTable`.

## Checklist

- [ ] Text README: section with layer name, SAID, and all fields; per-attribute lines for attribute-level config
- [ ] Markdown README: schema-level values in the global values table; attribute-level values as a details-table column
- [ ] Both: section omitted entirely when the overlay is absent or empty
- [ ] Both: formatting (dividers, indentation, table style) matches the neighboring overlay sections
- [ ] Unprintable/special characters prettified or escaped
