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
import { buildOcaPackageJsonFromEditorState } from "./ocaBuilder";
import { acceptOcaPackageOrNull } from "../utils/packageUtils";
import { useCreateChildSchemaPlaceholder } from "./createChildSchemaPlaceholder";
import { collectDescendantSchemaIds } from "./childSchemaSubtree";

/** factories */
import { createOcaLoader } from "./ocaLoader";

const MultiSchemaContext = createContext();

/**
 * Multi-Schema Provider
 * @param {Object} props
 * @param {React.ReactNode} props.children - Child components
 * @param {Object} [props.initialOcaPackage] - Optional OCA package for initial state (use setOcaPackage to update)
 */
function ocaPackageFromInitialProp(initialOcaPackage) {
  if (!initialOcaPackage) return null;
  const accepted = acceptOcaPackageOrNull(initialOcaPackage);
  if (accepted) return accepted;
  console.warn(
    "MultiSchemaProvider initialOcaPackage: expected oca_bundle.bundle; starting with null"
  );
  return null;
}

export const MultiSchemaProvider = ({ children, initialOcaPackage = null }) => {
  const [ocaPackage, _setOcaPackage] = useState(() =>
    ocaPackageFromInitialProp(initialOcaPackage)
  );

  const setOcaPackage = useCallback((value) => {
    if (value == null) {
      _setOcaPackage(null);
      return;
    }
    const accepted = acceptOcaPackageOrNull(value);
    if (!accepted) {
      console.warn(
        "setOcaPackage: value has no oca_bundle.bundle after legacy coercion; clearing package state"
      );
      _setOcaPackage(null);
      return;
    }
    _setOcaPackage(accepted);
  }, []);

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
    [ocaPackage]
  );

  const rebuildOcaPackageFromEditorState = useCallback(
    (ocaPackageArg) =>
      buildOcaPackageJsonFromEditorState({
        ocaPackage: ocaPackageArg,
        schemaStates,
        getSchemaById,
      }),
    [schemaStates, getSchemaById, ocaPackage]
  );

  // Clear all schema states
  const clearAllSchemas = useCallback(() => {
    setSchemaStates({});
    setCurrentSchemaId();
  }, []);

  const createChildSchemaPlaceholder =
    useCreateChildSchemaPlaceholder({
      schemaStatesRef,
      setSchemaStates,
      MANUAL_CREATION_SCHEMA_ID,
    });

  const removeChildSchemaSubtree = useCallback((rootSchemaId) => {
    if (!rootSchemaId) return;
    setSchemaStates((prev) => {
      const ids = collectDescendantSchemaIds(rootSchemaId, prev);
      if (ids.size === 0) return prev;
      const next = { ...prev };
      ids.forEach((id) => delete next[id]);
      return next;
    });
  }, [setSchemaStates]);

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
      ocaPackage,
      setOcaPackage,

      // Core actions
      getCurrentSchemaId,
      switchToSchema,
      rebuildOcaPackageFromEditorState,
      clearAllSchemas,
      createChildSchemaPlaceholder,
      removeChildSchemaSubtree,

      ...store,
      ...oca,

    }),
    [
      schemaStates,
      currentSchemaId,
      ocaPackage,
      setOcaPackage,
      getCurrentSchemaId,
      store,
      oca,
      switchToSchema,
      rebuildOcaPackageFromEditorState,
      clearAllSchemas,
      createChildSchemaPlaceholder,
      removeChildSchemaSubtree
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
