/**
 * Dev-only: inspect ag-grid layout under an overlay wrapper.
 *
 * 1. Open Format Rules or Unit overlay in the app.
 * 2. Open DevTools → Console.
 * 3. Run:
 *    __ocpDebugAgGridLayout('.format-rule-v2-grid')
 *    __ocpDebugAgGridLayout('.unit-framing-grid')
 *
 * Or pass an Element: document.querySelector('.format-rule-v2-grid')
 */

function pickComputed(el, keys) {
  if (!el) return null;
  const c = getComputedStyle(el);
  const o = {};
  keys.forEach((k) => {
    o[k] = c[k];
  });
  return o;
}

function rect(el) {
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return {
    width: Math.round(r.width * 100) / 100,
    height: Math.round(r.height * 100) / 100,
    top: Math.round(r.top * 100) / 100
  };
}

const FLEX_KEYS = [
  "display",
  "flex",
  "flexDirection",
  "flexGrow",
  "flexShrink",
  "flexBasis",
  "alignItems",
  "alignSelf",
  "height",
  "minHeight",
  "maxHeight",
  "width",
  "overflow"
];

export function debugAgGridLayout(root) {
  const el =
    typeof root === "string" ? document.querySelector(root) : root;
  if (!el) {
    console.warn("[ocp] debugAgGridLayout: no element (wrong page or selector?)");
    return;
  }

  console.group("[ocp] ag-grid layout debug");
  console.log("root tag/class:", el.tagName, el.className);
  console.log("root rect:", rect(el));
  const host = [...el.children].find((c) => c.tagName !== "STYLE");
  if (host) {
    console.log(
      "ag-grid-react host (first non-style child) rect + height:",
      rect(host),
      pickComputed(host, ["height", "minHeight", "maxHeight"])
    );
  }

  const selectors = [
    [".ag-root-wrapper", "ag-root-wrapper"],
    [".ag-root-wrapper-body", "ag-root-wrapper-body"],
    [".ag-root", "ag-root"],
    [".ag-body-clipper", "ag-body-clipper"],
    [".ag-body-viewport", "ag-body-viewport"],
    [".ag-center-cols-clipper", "ag-center-cols-clipper"],
    [".ag-center-cols-container", "ag-center-cols-container"],
    [".ag-header", "ag-header"],
    [".ag-body", "ag-body"]
  ];

  const rows = [];
  for (const [sel, name] of selectors) {
    const node = el.querySelector(sel);
    rows.push({
      part: name,
      found: Boolean(node),
      rect: rect(node),
      ...pickComputed(node, FLEX_KEYS)
    });
  }
  console.table(rows);

  const rowsVisible = el.querySelectorAll(".ag-row");
  console.log("row count (DOM):", rowsVisible.length);
  if (rowsVisible.length > 0) {
    const last = rowsVisible[rowsVisible.length - 1];
    console.log("last .ag-row rect:", rect(last));
  }

  console.log(
    "Tip: ag-grid-react defaults host to height:100% — use containerStyle={{ height:'auto', width:'100%' }} for autoHeight."
  );
  console.groupEnd();
}

if (process.env.NODE_ENV === "development" && typeof window !== "undefined") {
  window.__ocpDebugAgGridLayout = debugAgGridLayout;
  // One-time hint when this module loads (first visit to an overlay that imports it)
  if (!window.__ocpDebugAgGridLayoutHintShown) {
    window.__ocpDebugAgGridLayoutHintShown = true;
    console.info(
      "%c[OCA Composer]%c dev: on Format/Unit overlay run %c__ocpDebugAgGridLayout('.format-rule-v2-grid')%c or %c'.unit-framing-grid'",
      "font-weight:bold",
      "",
      "font-family:monospace",
      "",
      "font-family:monospace",
      ""
    );
  }
}
