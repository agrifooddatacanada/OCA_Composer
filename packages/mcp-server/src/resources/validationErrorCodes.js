export const VALIDATION_ERROR_CODES_MARKDOWN = `# OCA Composer validation error codes

\`validate_dataset\` reports each problem with a \`type\` code. These are the same codes the
OCA Composer Data Validator uses.

| Code | Name | Meaning | Typical fix |
|---|---|---|---|
| FE | Format | The value doesn't match the attribute's format rule. Also used when a **required** attribute has an empty value ("Missing an entry for a mandatory attribute"). | Reformat the value to the rule (e.g. dates as YYYY-MM-DD), or fill in the missing required value. |
| DTE | Data Type | The attribute has no format rule and the value doesn't fit its type (e.g. text in a Numeric attribute). | Correct the value, or check the attribute's type in the schema. |
| EC | Entry Codes | The value isn't one of the attribute's allowed entry codes. Codes are case-sensitive. | Replace it with one of the listed codes. |
| CHE | Character Encoding | The value isn't valid for the attribute's character encoding (usually UTF-8). | Re-save the file as UTF-8, or fix the corrupted characters. |
| RE | Range | A Numeric or DateTime value is outside the schema's range. A non-inclusive bound means the bound itself is not allowed. | Correct the value, or check that the right unit was used. |
| W | Warning | An array value uses a different delimiter than the schema specifies. Warnings don't make validation fail. | Use the schema's array delimiter. |

## Column-level problems

- **missing_attributes**: schema attributes with no matching column in the dataset.
- **unmatched_columns**: dataset columns that don't match any schema attribute. If a column is
  just named differently, pass \`column_mapping\` (dataset column → attribute name). Map a column
  to \`null\` to skip it.

## Notes

- Empty values in optional attributes are always accepted.
- Array attributes (\`Array[...]\`) are split on \`,\`, \`;\` or \`|\` and each item is checked.
- Numeric values honour the schema's decimal separator (e.g. \`3,14\` when it is a comma).
`;
