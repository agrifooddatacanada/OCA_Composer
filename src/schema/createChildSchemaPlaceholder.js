import { useCallback } from "react";
import { getOCACodeFromLangName } from "../utils/languageUtils";

/**
   * Create a placeholder child schema during manual schema creation
   * 
   * Called by: TypeRenderer when user sets attribute type to "Child Schema"
   * 
   * What it does:
   * - Creates an empty schema state for the child schema
   * - Inherits languages from parent schema
   * - Initializes with minimal metadata (name based on attribute name)
   * - Sets initialized=false (will be properly initialized when user navigates to it)
   * 
   * This enables users to immediately navigate to and edit child schemas during
   * manual creation, without needing to export and re-upload first.
   */
export function useCreateChildSchemaPlaceholder({
  schemaStatesRef,
  setSchemaStates,
  MANUAL_CREATION_SCHEMA_ID,
}) {
  return useCallback((childSchemaId, parentSchemaId) => {
    if (!childSchemaId) return;

    if (schemaStatesRef.current[childSchemaId]) return;

    const parentSchema =
      schemaStatesRef.current[parentSchemaId || MANUAL_CREATION_SCHEMA_ID];

    const parentLanguages =
      parentSchema?.metadata?.languages || ["English"];

    const childSchemaState = {
      metadata: {
        name: childSchemaId,
        description: `Child schema for ${childSchemaId}`,
        languages: parentLanguages,
        localized: {},
      },
      attributes: [],
      overlays: {},
      initialized: false,
    };

    parentLanguages.forEach((langName) => {
      const code = getOCACodeFromLangName(langName);
      childSchemaState.metadata.localized[code] = {
        name: childSchemaId,
        description: `Child schema for ${childSchemaId}`,
      };
    });

    setSchemaStates((prev) => ({
      ...prev,
      [childSchemaId]: childSchemaState,
    }));
  }, []);
}