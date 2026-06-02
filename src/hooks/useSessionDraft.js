import { useEffect, useRef, useCallback } from "react";

const DRAFT_KEY = "oca_composer_draft";
const DRAFT_VERSION = 1;
const DEBOUNCE_MS = 2000;

function hasAnyInitializedSchema(schemaStates) {
  if (!schemaStates || typeof schemaStates !== "object") return false;
  return Object.values(schemaStates).some((s) => s?.initialized);
}

export function loadDraft() {
  try {
    const raw = window.localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const draft = JSON.parse(raw);
    if (!draft || draft.version !== DRAFT_VERSION) return null;
    if (!draft.schemaStates || !hasAnyInitializedSchema(draft.schemaStates)) return null;
    return draft;
  } catch {
    return null;
  }
}

export function clearDraft() {
  try {
    window.localStorage.removeItem(DRAFT_KEY);
  } catch {
    // ignore
  }
}

export function useSessionDraft({ schemaStates, currentSchemaId, ocaPackage, currentPage }) {
  const timerRef = useRef(null);

  // Debounced autosave
  useEffect(() => {
    if (!hasAnyInitializedSchema(schemaStates)) return;

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      try {
        const draft = {
          version: DRAFT_VERSION,
          timestamp: Date.now(),
          schemaStates,
          currentSchemaId: currentSchemaId || null,
          ocaPackage: ocaPackage || null,
          currentPage: currentPage || null,
        };
        window.localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
      } catch (e) {
        console.warn("Session draft save failed:", e);
      }
    }, DEBOUNCE_MS);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [schemaStates, currentSchemaId, ocaPackage, currentPage]);

  // beforeunload warning
  useEffect(() => {
    if (!hasAnyInitializedSchema(schemaStates)) return;

    const handler = (e) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [schemaStates]);
}
