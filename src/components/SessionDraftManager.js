import React, { useCallback, useContext } from "react";
import { useSearchParams } from "react-router-dom";
import { useMultiSchema } from "../schema/schemaContext";
import { Context } from "../App";
import { useSessionDraft } from "../hooks/useSessionDraft";
import useOCAExport from "../hooks/useOCAExport";
import DraftRestoreDialog from "./DraftRestoreDialog";

export default function SessionDraftManager() {
  const { schemaStates, currentSchemaId, ocaPackage } = useMultiSchema();
  const { currentPage } = useContext(Context);
  const { exportData } = useOCAExport();
  const [searchParams] = useSearchParams();

  // Opened from ContextHub's "Write Schema" popup (window.open, no noopener): sync the
  // in-progress schema back to it on every autosave tick instead of a manual download/upload.
  const isContextHubPopup = searchParams.get("contexthub") === "true" && !!window.opener;

  const syncToContextHub = useCallback(async () => {
    if (!isContextHubPopup) return;
    try {
      const pkg = await exportData({ download: false });
      if (!pkg) return;
      window.opener.postMessage({ type: "SCHEMA_SAVED", content: JSON.stringify(pkg) }, "*");
    } catch (err) {
      console.error("Auto-sync to ContextHub failed:", err);
    }
  }, [isContextHubPopup, exportData]);

  useSessionDraft({
    schemaStates,
    currentSchemaId,
    ocaPackage,
    currentPage,
    onAutoSave: syncToContextHub
  });

  return <DraftRestoreDialog />;
}
