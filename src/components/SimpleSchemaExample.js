import React, { useCallback } from "react";
import { useMultiSchema } from "../context/MultiSchemaContext";

/**
 * Example component showing the simplified single-context approach
 * Compare this to the old dual-context pattern
 */
export const SimpleSchemaExample = () => {
  // OLD WAY (dual context):
  // const { globalData, setGlobalData } = useContext(Context);
  // const { activeSchemaId, getSchemaState, updateSchemaState } = useMultiSchema();
  // const currentSchemaId = activeSchemaId || editingSchemaId;
  // const currentSchemaState = getSchemaState(currentSchemaId);
  // const data = useMemo(() => 
  //   currentSchemaId && currentSchemaState 
  //     ? currentSchemaState.someData || []
  //     : globalData
  // , [currentSchemaId, currentSchemaState, globalData]);
  // const setData = useCallback((newData) => {
  //   if (currentSchemaId) {
  //     updateSchemaState(currentSchemaId, { someData: newData });
  //   } else {
  //     setGlobalData(newData);
  //   }
  // }, [currentSchemaId, updateSchemaState, setGlobalData]);

  // NEW WAY (single context):
  // Use MultiSchema context with standard pattern
  const { activeSchemaId, editingSchemaId, getSchemaState, updateSchemaState } = useMultiSchema();
  
  const currentSchemaId = activeSchemaId || editingSchemaId;
  const schemaState = getSchemaState(currentSchemaId);
  const isTempSchema = currentSchemaId === "temp-schema";
  
  const updateCurrentSchema = useCallback((updates) => {
    if (currentSchemaId) {
      updateSchemaState(currentSchemaId, updates);
    }
  }, [currentSchemaId, updateSchemaState]);
  
  // Always get data from schema state - no fallback logic needed
  const attributes = schemaState?.attributes || [];
  const metadata = schemaState?.metadata || {};
  
  // Always update schema state - no dual logic needed
  const addAttribute = (newAttribute) => {
    updateCurrentSchema({
      attributes: [...attributes, newAttribute]
    });
  };
  
  const updateMetadata = (newMetadata) => {
    updateCurrentSchema({
      metadata: { ...metadata, ...newMetadata }
    });
  };

  return (
    <div>
      <h3>Schema: {currentSchemaId}</h3>
      <p>Status: {isTempSchema ? "Temporary/New" : "Saved"}</p>
      <p>Schema Name: {metadata.name || "Untitled"}</p>
      <p>Attributes: {attributes.length}</p>
      
      <button 
        type="button"
        onClick={() => addAttribute({ 
          Attribute: `attr_${Date.now()}`, 
          Type: "Text",
          List: false 
        })}
      >
        Add Attribute
      </button>
      
      <button 
        type="button"
        onClick={() => updateMetadata({ 
          name: `Schema_${Date.now()}` 
        })}
      >
        Update Name
      </button>
    </div>
  );
};

export default SimpleSchemaExample;
