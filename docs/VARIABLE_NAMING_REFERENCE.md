# Variable Naming Standard

## Language Variables

| Variable Name | Type | Value Example | Usage |
|--------------|------|---------------|-------|
| `lang` or `language` | string | `"English"` | Language name |
| `langs` or `languages` | string[] | `["English", "French"]` | Array of language names |
| `ocaCode` | string | `"eng"` | OCA 3-letter code |
| `ocaCodes` | string[] | `["eng", "fra"]` | Array of OCA codes |

**Never use:** `langCode` (use `ocaCode`), `langName` (use `lang`)

## Entry Code Data

```javascript
// Internal data structure - use language names as keys
const entryCodeRow = {
  Code: "A",
  English: "Option A",
  French: "Option A"
};

// Access: row[lang]
```

## Converting Between Names and Codes

```javascript
// Import from OCA bundle (bundle uses codes)
const lang = getLangNameFromOCACode(ocaCode);

// Export to OCA bundle (bundle requires codes)  
const ocaCode = getOCACodeFromLangName(lang);
```

## Key Rule

**The issue isn't the variable name - it's using the correct data type:**
- When `overlay.language` gives you OCA code → store as `ocaCode`
- When accessing entry code data → use language name as key
- Variable name `lang` is fine if it holds a language name

See [LANGUAGE_NAMING_STANDARD.md](./LANGUAGE_NAMING_STANDARD.md) for complete details.
