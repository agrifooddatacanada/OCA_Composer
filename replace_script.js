const fs = require('fs');

const path = 'src/CreateManually/CreateManually.js';
let content = fs.readFileSync(path, 'utf8');

// Replace standard styles with 'ag-theme-balham' and new grid styles
const newStyles = `const gridStyle = \`
  .create-schema-grid .ag-cell {
    border-right: 1px solid \${CustomPalette.GREY_300};
  }
  .create-schema-grid .ag-header-cell-label {
    display: flex;
    justify-content: center;
    align-items: center;
  }
  .ag-cell {
    line-height: 1.5;
  }
  .ag-cell-wrapper > *:not(.ag-cell-value):not(.ag-group-value) {
    height: 100%;
  }
  .ag-header-cell:last-child,
  .ag-header-cell[col-id="Delete"] {
    border-right: none !important;
    --ag-header-column-separator-display: none !important;
  }
  .ag-header-cell:last-child *,
  .ag-header-cell[col-id="Delete"] * {
    border-right: none !important;
    box-shadow: none !important;
  }
  .ag-header-viewport .ag-header-cell:last-child {
    border-right: none !important;
  }
  .ag-header-container {
    border-right: none !important;
  }
  .create-schema-grid .ag-cell:last-child {
    border-right: none !important;
  }
  .ag-header-row .ag-header-cell:last-child::after {
    display: none !important;
  }
  .ag-header-viewport {
    overflow-x: hidden;
  }
  .create-schema-grid .ag-body-horizontal-scroll {
    display: none !important;
  }
  .create-schema-grid .ag-center-cols-clipper {
    min-height: unset !important;
  }
  .create-schema-grid .ag-root-wrapper-body.ag-layout-auto-height {
    min-height: unset !important;
  }
  .create-schema-grid .ag-root-wrapper:has(.ag-overlay-no-rows-wrapper) .ag-root-wrapper-body {
    min-height: 88px !important;
  }
  .ag-row .delete-icon-solid {
    display: none;
  }
  .ag-row:hover .delete-icon-outline {
    display: none;
  }
  .ag-row:hover .delete-icon-solid {
    display: inline-flex;
  }
  .ag-row:hover .ag-cell {
    background-color: \${CustomPalette.PINK_200} !important;
  }
  .ag-cell-value {
    display: flex;
    justify-content: center;
    align-items: center;
  }
  .ag-cell, .ag-full-width-row .ag-cell-wrapper.ag-row-group {
    line-height: 1.5;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .ag-cell .ag-drag-handle {
    margin-right: 0;
  }
  .ag-overlay-no-rows-center {
    font-size: 14px;
    padding-top: 15px;
  }
\`;`;

// Replace ag-theme-alpine with ag-theme-balham
content = content.replace('ag-theme-alpine.css', 'ag-theme-balham.css');

// Replace the gridStyle variable
const gridStyleStart = content.indexOf('const gridStyle = `');
const gridStyleEnd = content.indexOf('`;', gridStyleStart) + 2;
content = content.substring(0, gridStyleStart) + newStyles + content.substring(gridStyleEnd);

// Replace "ag-theme-alpine" in JSX with "create-schema-grid ag-theme-balham"
content = content.replace(/className="ag-theme-alpine"/g, 'className="create-schema-grid ag-theme-balham"');

fs.writeFileSync(path, content, 'utf8');
