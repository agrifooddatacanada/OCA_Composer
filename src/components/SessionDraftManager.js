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

  // Opened from ContextHub's "Write Schema" flow, either as a popup (window.open, no
  // noopener — window.opener is set) or embedded in an iframe (window.parent !== window).
  // Either way, sync the in-progress schema back to it on every autosave tick instead of
  // a manual download/upload. The two cases are mutually exclusive in practice (a popup's
  // window.parent is itself; an iframe has no window.opener), so preferring opener first
  // is just a tiebreaker, not meaningful precedence.
  const contextHubMode = searchParams.get("contexthub") === "true";
  const contextHubTarget = !contextHubMode
    ? null
    : window.opener || (window.parent !== window ? window.parent : null);

  const syncToContextHub = useCallback(async () => {
    if (!contextHubTarget) return;
    try {
      const pkg = await exportData({ download: false });
      if (!pkg) return;
      contextHubTarget.postMessage({ type: "SCHEMA_SAVED", content: JSON.stringify(pkg) }, "*");
    } catch (err) {
      console.error("Auto-sync to ContextHub failed:", err);
    }
  }, [contextHubTarget, exportData]);

  useSessionDraft({
    schemaStates,
    currentSchemaId,
    ocaPackage,
    currentPage,
    onAutoSave: syncToContextHub
  });

  return <DraftRestoreDialog />;
}
