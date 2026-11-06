import { useEffect } from "react";
import useOCAExport from "../hooks/useOCAExport";

/**
 * Always-mounted bridge (regardless of wizard step) that lets ContextHub
 * request a save before closing the embedded editor. Responds to a
 * { type: "REQUEST_SAVE" } message with either SCHEMA_SAVED (content is the
 * built OCA package, stringified) or SAVE_FAILED.
 */
const EmbeddedSaveBridge = () => {
  const { exportData } = useOCAExport();

  useEffect(() => {
    const handleMessage = async (event) => {
      if (event.data?.type !== "REQUEST_SAVE") return;
      if (window.parent === window) return;

      try {
        const pkg = await exportData({ download: false });
        if (!pkg) {
          window.parent.postMessage(
            { type: "SAVE_FAILED", message: "Could not save changes." },
            "*"
          );
          return;
        }
        window.parent.postMessage(
          { type: "SCHEMA_SAVED", content: JSON.stringify(pkg) },
          "*"
        );
      } catch (err) {
        window.parent.postMessage(
          { type: "SAVE_FAILED", message: err?.message || "Could not save changes." },
          "*"
        );
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [exportData]);

  return null;
};

export default EmbeddedSaveBridge;
