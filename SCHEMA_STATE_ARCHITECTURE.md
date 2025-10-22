# Schema State Management Architecture

This document explains how schema state is managed across the OCA Composer application.

## Quick Reference

### Key Concepts

1. **`schemaStates`** (in MultiSchemaContext): Map of `schemaId → schemaState`
2. **`completeSchema`**: Read-only reference to original OCA data
3. **`attributes`**: Working copy of attributes being edited
4. **`initialized`**: Flag that prevents re-parsing after first load
5. **`lanAttributeRowData`**: Language-specific labels/descriptions

### Lifecycle Flows

#### A. Manual Creation
```
1. User enters attribute names → CreateManually
2. currentSchemaId = null (internally: "manual-creation-schema")
3. attributes = [] initially
4. User edits in AttributeDetails
5. On save: initialized = true (prevents re-population)
```

#### B. File Upload
```
1. User uploads OCA file → initializeFromOCAPackage()
2. For each schema: addSchemaFromOCA()
   ├─ OCAParser.parseSchemaData() extracts data
   ├─ attributes = [...] (even if empty)
   ├─ lanAttributeRowData = {language: [{Attribute, Label, Description}]}
   └─ initialized = true
3. Components load and display parsed data
```

#### C. Attribute Deletion
```
1. User deletes attributes in AttributeDetails
2. attributes array shrinks (can become [])
3. initialized = true (prevents re-population from completeSchema)
4. Deleted names tracked in deletedAttributes[]
```

#### D. Export
```
1. exportSchemaChanges() called
2. For each schema where initialized = true:
   ├─ Rebuild capture_base.attributes from attributes array
   ├─ If attributes = [], export empty attributes {}
   └─ Apply overlay changes
3. Return modified OCA package
```

## Critical Checks

### When to Initialize from completeSchema?

```javascript
// In AttributeDetails.js initialization logic:
const hasAttributesArray = schemaState?.attributes !== undefined;
if (completeSchema && !hasAttributesArray && !schemaState?.initialized) {
  // OK to initialize - schema is brand new
}
```

**Why this works:**
- `attributes = []` (empty but defined) → hasAttributesArray = true → Skip init
- `attributes = undefined` (never set) → hasAttributesArray = false → Can init
- `initialized = true` → Never init regardless

### When to Export Schema Changes?

```javascript
// In exportSchemaChanges():
if (!schemaState.initialized) return; // Skip untouched schemas
```

**Why this works:**
- Only exports schemas the user has worked on
- Preserves original data for untouched schemas

## Common Pitfalls

### ❌ Wrong: Checking only length
```javascript
if (schemaState.attributes.length > 0) {
  // This fails when user deletes all attributes!
}
```

### ✅ Correct: Checking if defined
```javascript
if (schemaState.attributes !== undefined) {
  // Works for both empty [] and populated [...] arrays
}
```

### ❌ Wrong: Ignoring initialized flag
```javascript
if (completeSchema && !schemaState.attributes) {
  // This can overwrite user deletions!
}
```

### ✅ Correct: Respecting initialized flag
```javascript
if (completeSchema && !schemaState.attributes && !schemaState.initialized) {
  // Safe - won't overwrite user's intentional changes
}
```

## Data Flow Diagram

```
┌─────────────────────┐
│  User Uploads File  │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────────────────┐
│ initializeFromOCAPackage()      │
│  ├─ Extract all schema IDs      │
│  └─ Call addSchemaFromOCA()     │
└──────────┬──────────────────────┘
           │
           ▼
┌─────────────────────────────────┐
│ addSchemaFromOCA()              │
│  ├─ initializeSchemaFromOCA()  │
│  │   └─ OCAParser.parseSchemaData()
│  │       ├─ attributes = [...]  │
│  │       └─ lanAttributeRowData │
│  └─ initialized = true          │
└──────────┬──────────────────────┘
           │
           ▼
┌─────────────────────────────────┐
│ Component (e.g. AttributeDetails)│
│  ├─ Loads schemaState.attributes│
│  ├─ Displays in grid            │
│  └─ User edits/deletes          │
└──────────┬──────────────────────┘
           │
           ▼
┌─────────────────────────────────┐
│ handleSave() / updateSchemaState│
│  ├─ Updates attributes array    │
│  └─ initialized = true          │
└──────────┬──────────────────────┘
           │
           ▼
┌─────────────────────────────────┐
│ exportSchemaChanges()           │
│  ├─ Check initialized = true    │
│  ├─ Rebuild attributes map      │
│  └─ Apply overlay changes       │
└──────────┬──────────────────────┘
           │
           ▼
┌─────────────────────┐
│  Export OCA Package │
└─────────────────────┘
```

## Key Files

| File | Purpose |
|------|---------|
| `MultiSchemaContext.js` | Central state management, initialization, export |
| `OCAParser.js` | Converts OCA format → schemaState structure |
| `AttributeDetails.js` | Displays/edits attributes, handles initialization logic |
| `ViewSchema.js` | Visualizes schemas, triggers exports |

## When in Doubt

1. **Is this a new schema?** → Check `initialized === false` AND `attributes === undefined`
2. **Should I preserve this state?** → Check `initialized === true`
3. **Are labels missing?** → Verify `lanAttributeRowData` from OCAParser isn't being overwritten
4. **Empty vs. never-set?** → `[] !== undefined` (empty is intentional, undefined is uninitialized)

