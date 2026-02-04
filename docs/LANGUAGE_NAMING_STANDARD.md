# Language Naming Standard

## Standard

**Internal data structures use language names (e.g., "English", "French") as keys, NOT OCA codes (e.g., "eng", "fra").**

Conversion to/from OCA codes happens only at boundaries (import from/export to OCA bundles).

## Variable Names

- **`lang`** or **`language`** - Language name ("English", "French")
- **`langs`** or **`languages`** - Array of language names
- **`langCodeOCA`** - OCA 3-letter code ("eng", "fra")
- **`langCodeOCAs`** - Array of OCA codes

## OCA Bundle Structure
When parsing OCA bundles, `overlay.language` contains the OCA code ("eng"), not the language name.
Always assign to a variable named `langCodeOCA`:
```javascript
const langCodeOCA = overlay.language; // "eng", "fra", etc.

**Never use:** `langCode` (use `langCodeOCA`), `langName` (use `lang`)

## Data Structures

### Entry Codes
```javascript
// Language names as keys
{ Code: "A", English: "Label", French: "Étiquette" }
```

## Conversion Functions

```javascript
// Import (OCA bundle → app)
const lang = langNameFromCodeOCA(langCodeOCA); // "eng" → "English"

// Export (app → OCA bundle)
const langCodeOCA = langCodeOCAFromName(lang); // "English" → "eng"
```

## Files Using Language Names Correctly

- `src/utils/ocaParser.js` - Normalizes at import
- `src/EntryCodes/EntryCodes.js`
- `src/EntryCodes/CodeGrid.js`
- `src/LanguageDetails/LanGrid.js`
- `src/ViewSchema/ViewSchema.js`

## Files That Export (Use OCA Codes)

- `src/hooks/useOCAExport.js`
- `src/LanguageDetails/LanGrid.js` (when building overlays)

## Related

- [Variable Naming Reference](./VARIABLE_NAMING_REFERENCE.md) - Quick lookup table
