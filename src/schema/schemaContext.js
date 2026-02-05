/**
 * Multi-Schema Context
 * 
 * Manages multiple OCA schemas within a single editing session.
 * Users can:
 * - Load an OCA package with root + child schemas
 * - Switch between schemas for editing (switchToSchema)
 * - Edit one schema at a time (currentSchemaId tracks which one)
 * - Export all changes back to OCA package format
 * 
 * Architecture:
 * - schemaStates: Map of schemaId -> editing state
 * - currentSchemaId: Which schema is being edited right now
 * - store: All state operations (from schemaStore.js)
 * - oca: OCA package loading operations (from ocaLoader.js)
 */

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  useMemo
} from "react";
import { MANUAL_CREATION_SCHEMA_ID } from "../constants/constants";
import { makeSchemaStore } from "./schemaStore";
import { canonicalizeSchemaId } from "../utils/schemaId";
import { buildOcaPackageFromState } from "./ocaBuilder";
import { useSchemaPersistence } from "./schemaPersistence";
import { useCreateChildSchemaPlaceholder } from "./createChildSchemaPlaceholder";

/** factories */
import { createOcaLoader } from "./ocaLoader";

const MultiSchemaContext = createContext();

export const MultiSchemaProvider = ({ children, OCAPackage }) => {
  const PERSIST_VERSION = 2;

  // Multi-schema state - Use ref to persist across StrictMode remounts
  const schemaStatesRef = useRef({});
  const [schemaStates, _setSchemaStates] = useState({});
  const [currentSchemaId, setCurrentSchemaId] = useState();
  
  // Wrapper to keep ref in sync with state
  const setSchemaStates = useCallback((updater) => {
    _setSchemaStates(prevState => {
      const newState = typeof updater === 'function' ? updater(prevState) : updater;
      schemaStatesRef.current = newState; // Keep ref in sync
      return newState;
    });
  }, []);
  
  // Persist schemaStates to localStorage (debounced) + load on demand
  const { saveToLocalStorage, loadFromLocalStorage } = useSchemaPersistence({
    schemaStatesRef,
    setSchemaStates,
    storageKey: "oca_composer_multischema",
    persistVersion: PERSIST_VERSION,
    saveSignal: schemaStates,
    debounceMs: 1000,
  });

  // Get current working schema ID (with fallback to temp)
  const getCurrentSchemaId = useCallback(() => 
    currentSchemaId || MANUAL_CREATION_SCHEMA_ID
  , [currentSchemaId]);

  const store = useMemo(
    () =>
      makeSchemaStore({
        getAllSchemaStates: () => schemaStatesRef.current,
        setSchemaStates,
        getCurrentSchemaId,
      }),
    [setSchemaStates, getCurrentSchemaId]
  );

  const getSchema = useCallback(
    () => store.getSchema(),
    [store]
  );

  const getSchemaById = useCallback(
    (schemaId) => store.getSchemaById(schemaId),
    [store]
  );

  // Switch to editing a different schema
  const switchToSchema = useCallback(
    (schemaId, ocaPackage) => {
      const resolvedId = canonicalizeSchemaId(ocaPackage, schemaId);
      setCurrentSchemaId(resolvedId);
    },
    []
  );  

  const exportSchemaChanges = useCallback(
    (ocaPackage) =>
      buildOcaPackageFromState({
        ocaPackage,
        schemaStates,
        getSchemaById,
      }),
    [schemaStates, getSchemaById]
  );

  // Clear all schema states
  const clearAllSchemas = useCallback(() => {
    setSchemaStates({});
    setCurrentSchemaId();

    // Clear localStorage for all multi-schema data
    try {
      // Clear all multi-schema entries (in case there are old ones)
      const keys = Object.keys(localStorage);
      keys.forEach((key) => {
        if (key.startsWith("oca_composer_multischema_")) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      // console.warn("Failed to clear localStorage:", error);
    }
  }, []);

  const createChildSchemaPlaceholder =
    useCreateChildSchemaPlaceholder({
      schemaStatesRef,
      setSchemaStates,
      MANUAL_CREATION_SCHEMA_ID,
    });

  const oca = useMemo(
    () => createOcaLoader({getSchemaById, setSchemaStates}),
    [getSchemaById, setSchemaStates]
  );

  // Context value
  const contextValue = useMemo(
    () => ({
      // State
      schemaStates,
      currentSchemaId,

      // Core actions
      getCurrentSchemaId,
      switchToSchema,
      exportSchemaChanges,
      clearAllSchemas,
      createChildSchemaPlaceholder,

      ...store,
      ...oca,

      // Persistence
      saveToLocalStorage,
      loadFromLocalStorage
    }),
    [
      schemaStates,
      currentSchemaId,
      getCurrentSchemaId,
      store,
      oca,
      switchToSchema,
      exportSchemaChanges,
      clearAllSchemas,
      createChildSchemaPlaceholder,
      saveToLocalStorage,
      loadFromLocalStorage
    ]
  );

  return (
    <MultiSchemaContext.Provider value={contextValue}>
      {children}
    </MultiSchemaContext.Provider>
  );
};

// Hook to use the multi-schema context
export const useMultiSchema = () => {
  const context = useContext(MultiSchemaContext);
  if (!context) {
    throw new Error("useMultiSchema must be used within a MultiSchemaProvider");
  }
  return context;
};
