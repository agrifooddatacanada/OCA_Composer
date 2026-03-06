let measureEl = null;
let measureElCompact = null;

function getMeasureEl(compact = false) {
  if (compact) {
    if (!measureElCompact && typeof document !== "undefined") {
      measureElCompact = document.createElement("div");
      measureElCompact.style.cssText = "position:absolute;left:-9999px;top:0;visibility:hidden;font-size:12px;line-height:1;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;white-space:pre-wrap;word-break:break-word;overflow-wrap:break-word;padding:0;box-sizing:border-box;";
      document.body.appendChild(measureElCompact);
    }
    return measureElCompact;
  }
  if (!measureEl && typeof document !== "undefined") {
    measureEl = document.createElement("div");
    measureEl.style.cssText = "position:absolute;left:-9999px;top:0;visibility:hidden;font-size:12px;line-height:1.5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;white-space:pre-wrap;word-break:break-word;overflow-wrap:break-word;padding:8px;box-sizing:border-box;";
    document.body.appendChild(measureEl);
  }
  return measureEl;
}

export function measureTextHeight(text, maxWidthPx, options = {}) {
  if (!text || typeof text !== "string") return 0;
  const str = String(text).trim();
  if (!str) return 0;
  if (typeof document === "undefined") return 0;

  const compact = options.compact === true;
  const el = getMeasureEl(compact);
  el.style.width = `${maxWidthPx}px`;
  el.textContent = str;
  const height = el.offsetHeight;
  el.textContent = "";
  return height;
}
