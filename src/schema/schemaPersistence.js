/**
 * Schema Persistence Hook
 * 
 * Autosaves schema edits to localStorage with debouncing.
 * Prevents data loss on:
 * - Browser refresh
 * - Accidental tab close
 * - React StrictMode remounts (development)
 * 
 * Storage format: One key per schema for efficient updates
 */

import { useEffect, useRef, useCallback } from "react";

export function useSchemaPersistence({
  schemaStatesRef,
  setSchemaStates,
  storageKey,
  persistVersion,
  saveSignal,
  debounceMs = 1000
}) {
  const saveTimerRef = useRef(null);

  const saveToLocalStorage = useCallback(() => {
    // CRITICAL FIX: Use ref to get current value and don't save empty state during StrictMode remount
    const currentSchemaStates = schemaStatesRef.current;

    // Don't save if schemaStates is empty (likely during StrictMode remount)
    if (!currentSchemaStates || Object.keys(currentSchemaStates).length === 0) {
      return;
    }

    const stateToSave = {
      version: persistVersion,
      schemaStates: currentSchemaStates
    };

    try {
      localStorage.setItem(storageKey, JSON.stringify(stateToSave));
    } catch (error) {
      // ignore quota/private mode/etc
    }
  }, [schemaStatesRef, storageKey, persistVersion]);

  const loadFromLocalStorage = useCallback(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (!saved) return false;

      const parsed = JSON.parse(saved);
      if (parsed.version !== persistVersion) return false;

      const savedSchemas = parsed.schemaStates || {};
      const currentSchemas = schemaStatesRef.current || {};

      // CRITICAL FIX: Don't overwrite existing schemas with empty state
      if (
        Object.keys(savedSchemas).length === 0 &&
        Object.keys(currentSchemas).length > 0
      ) {
        return false;
      }

      setSchemaStates(savedSchemas);
      return true;
    } catch (error) {
      return false;
    }
  }, [schemaStatesRef, setSchemaStates, storageKey, persistVersion]);

  // Auto-save on changes (debounced)
  useEffect(() => {
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }

    saveTimerRef.current = setTimeout(() => {
      saveToLocalStorage();
    }, debounceMs);

    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
    };
  }, [saveSignal, saveToLocalStorage, debounceMs]);

  return { saveToLocalStorage, loadFromLocalStorage };
}