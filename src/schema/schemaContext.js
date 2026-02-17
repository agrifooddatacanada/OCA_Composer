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
  useMemo,
  useEffect
} from "react";
import { MANUAL_CREATION_SCHEMA_ID } from "../constants/constants";
import { makeSchemaStore } from "./schemaStore";
import { canonicalizeSchemaId } from "../utils/schemaId";
import { buildPkgFromState } from "./ocaBuilder";
import { useCreateChildSchemaPlaceholder } from "./createChildSchemaPlaceholder";

/** factories */
import { createOcaLoader } from "./ocaLoader";

const MultiSchemaContext = createContext();

/**
 * Multi-Schema Provider
 * @param {Object} props
 * @param {React.ReactNode} props.children - Child components
 * @param {Object} [props.packageOCA] - Optional OCA package for backward compatibility (deprecated - use setPkgUpload instead)
 */
export const MultiSchemaProvider = ({ children, packageOCA = null }) => {
  // Store the original OCA package (source of truth for schema structure)
  // Initialize from prop if provided (for backward compatibility)
  const [pkgUpload, setPkgUpload] = useState(packageOCA);

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
    (schemaId, pkgUpload) => {
      const resolvedId = canonicalizeSchemaId(pkgUpload, schemaId);
      setCurrentSchemaId(resolvedId);
    },
    [pkgUpload]
  );

  const pkgBuildFromState = useCallback(
    (pkgUpload) =>
      buildPkgFromState({
        pkgUpload,
        schemaStates,
        getSchemaById,
      }),
    [schemaStates, getSchemaById, pkgUpload]
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
      pkgUpload,
      setPkgUpload,

      // Core actions
      getCurrentSchemaId,
      switchToSchema,
      pkgBuildFromState,
      clearAllSchemas,
      createChildSchemaPlaceholder,

      ...store,
      ...oca,

    }),
    [
      schemaStates,
      currentSchemaId,
      pkgUpload,
      getCurrentSchemaId,
      store,
      oca,
      switchToSchema,
      pkgBuildFromState,
      clearAllSchemas,
      createChildSchemaPlaceholder
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
