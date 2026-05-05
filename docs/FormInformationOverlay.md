## Form Overlay – Implementation and Usage

> Last Updated: 2025-10-31  
> Version: 1.0  
> Related PR: [#462](https://github.com/agrifooddatacanada/OCA_Composer/pull/462)

## Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Architecture](#architecture)
- [UI Entry Point – Overlays](#ui-entry-point-–-overlays)
- [Gating](#gating)
- [Form Information Grid Editor](#form-information-grid-editor)
- [Form Builder](#form-builder)
- [Export: OCA Package Integration](#export-oca-package-integration)
- [App Wiring and Context](#app-wiring-and-context)
- [Internationalization (i18n)](#internationalization-i18n)
- [Data and State Model (Essentials)](#data-and-state-model-essentials)
- [Edge Cases and Validation](#edge-cases-and-validation)

This document explains the end‑to‑end implementation of the Form overlay, how the UI flows work, gating/validation logic, export pipeline, and how to extend or localize the feature.


### Overview

The Form overlay enables authors to:

- Define per‑attribute form labels and placeholders (multi‑language).
- Transition from a tabular Form Information editor to a visual Form Builder.
- Export the overlay into the OCA package as a form extension when present.

High‑level user flow:

1. User selects “Add Form Information” in `Overlays`.
2. User edits labels/placeholders in `FormInformation` (grid editor).
3. User continues to `FormBuilder` for page/section/question organization and per‑question instructions.
4. On export, the form overlay is generated and included when present.

---

## Prerequisites

Before working with the Form overlay, ensure:

- Format overlay is enabled.
- At least one attribute is defined.
- Familiarity with core OCA concepts.

---

## Architecture

High-level flow: Overlays → FormInformation → FormBuilder → Export.


---

## UI Entry Point – Overlays

File: `src/Overlays/Overlays.jsx`

- Renders selectable overlay features and already added features.
- Enforces prerequisites and shows disabled reasons via tooltips.
- Navigates to `FormInformation` when “Add Form Information” is selected.

Key logic:

```jsx
// Disabled reason composition (both Form Information and Range overlays)
const getDisabledReason = (featureName) => (
  getFormInformationDisabledReason(featureName, selectedFeatures) ||
  getRangeOverlayDisabledReason(
    featureName,
    selectedFeatures,
    attributeRowData,
    rangeRowData
  ) ||
  ""
);

// Gating selection
if (shouldDisableRangeOverlay(item, selectedFeatures, attributeRowData, rangeRowData)) return;
if (shouldDisableFormInformationOverlay(item, selectedFeatures)) return;

// Navigation
if (item === "Add Form Information") {
  setCurrentPage("FormInformation");
}
```

Prerequisite rules are defined in `src/constants/utils.js` (see below).

---

## Gating

- Form overlay requires the Format overlay to be selected first.
- Range overlay is available only when there’s a Numeric or DateTime attribute and the Format overlay is selected.
- Tooltip texts come from `i18next` keys in `utils.js`.

See `src/constants/utils.js` for the exact checks and messages.

---

## Form Information Grid Editor

File: `src/Overlays/FormInformation.jsx`

Purpose:

- Tabular editing for per‑attribute values.
- Multi‑language label and placeholder editing; first language is prioritized and the UI language can re‑order tabs.
- Placeholder editability is constrained by type (`Text`, `Array[Text]`, `DateTime`, `Array[DateTime]`, `Numeric`, `Array[Numeric]`).
- DateTime and Numeric placeholders can inherit sensible defaults from selected format rules.

Notable behavior:

- When UI language changes, the current tab updates if present in the schema languages.
- Drag & drop reorders attributes and syncs both base and language‑specific row data.
- “Forward” validates that labels are provided in the primary language, then navigates to the Form Builder.

Key constants and helpers:

- `PLACEHOLDER_EDITABLE_TYPES` controls placeholder editability.
- `getDateTimePickerConfig` derives display format for DateTime placeholders.
- `findDescription` renders human‑friendly descriptions of format rules per attribute type.

---

## Form Builder

Folder: `src/Overlays/FormBuilder/`

Purpose:

- Visual editor to structure forms by pages, sections, and questions.
- Drag & drop (unified DnD flows) to reorder pages, sections, and questions.
- Supports per‑question instructions and synchronization to persistent state.

Files:

- `index.jsx`: main orchestration; connects with context state and persists page/section/question structure.
- `dnd/types.js`: DnD constants.
- `dialogs/*`: Page/Section/Question editor dialogs.
- `utils/*`: conversion and helpers, including `convertToFormInformation.js` and `getDateTimePickerConfig.js`.

The Form Builder writes normalized `formBuilderPages` to context for export.

---

## Export: OCA Package Integration

File: `src/ViewSchema/useExportLogicV2.js`

Export flow includes multiple overlays and extensions. The Form Information overlay is conditionally added when selected and data exists.

Key integration points:

- `getFormInformationInput(formBuilderPages, languages, schemaDescription, captureBase)` – returns `{ form_overlays: [...] }` based on the builder output and schema metadata.
- Under `extension_overlay_object`, the form overlay is included when all of the following are true:
  - `overlay[FIELD_FORM_INFORMATION_OVERLAY].selected` is true
  - `formBuilderPages` is present and non‑empty

```js
...(overlay[FIELD_FORM_INFORMATION_OVERLAY].selected &&
  formBuilderPages &&
  formBuilderPages.length > 0 && {
    form_overlay: {
      type: FORM,
      ...getFormInformationInput(
        formBuilderPages,
        languages,
        schemaDescription,
        bundle.bundle.d
      )
    }
  })
```

Other overlays (ordering, range, unit framing, attribute framing, sensitive) are constructed in the same export step to produce a complete OCA package.

---

## App Wiring and Context

File: `src/App.js`

- Provides global context with all overlay states, row data collections, language data, and navigation helpers.
- Registers overlay items, including `FIELD_FORM_INFORMATION_OVERLAY` with feature name “Add Form Information”.
- Initializes default Form Information rows per attribute and language when `attributesList` changes.
- Navigation from `Overlays` → `FormInformation` → `FormBuilder` is driven via `setCurrentPage`.

---

## Internationalization (i18n)

Folder: `public/locales/`

- Uses `i18next` and locale resources under `en/` and `fr/`.
- Disabled reasons and tooltip strings are sourced via translation keys (e.g., `"Form Information prerequisite tooltip"`).
- The Form Information editor also respects global UI language for tab ordering.

---

## Data and State Model (Essentials)

- `attributesList`: ordered list of attribute names.
- `attributeRowData`: array of objects `{ Attribute, Type, Unit, Flagged, ... }`.
- `FormInformationRowData`: array of `{ Attribute, Label, Placeholder }` used as base values.
- `lanAttributeRowData`: map of language → array of per‑attribute records `{ Attribute, Label, Placeholder, ... }`.
- `formBuilderPages`: normalized structure from the builder (pages → sections → questions).
- `overlay`: map of overlay keys to `{ feature, selected }`.

Synchronization rules:

- Reordering attributes updates `FormInformationRowData` and all entries in `lanAttributeRowData`.
- Changes in format rules can influence default placeholders for DateTime/Numeric types.

---

## Edge Cases and Validation

- Label is required for each attribute in the primary language before moving to the builder.
- Placeholders are cleared for `Binary` and `Boolean` attribute types and are not editable.
- Disabled reasons are prioritized; Form Information/Range overlays will show specific guidance when prerequisites are unmet.


