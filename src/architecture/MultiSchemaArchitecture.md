# Multi-Schema Architecture Design

## Overview
This document outlines the fundamental changes needed to support editing nested schemas in the OCA Composer application.

## Current Problems

### 1. Single Global State
- All schema data is stored in global context variables
- Switching between schemas overwrites previous schema's data
- No isolation between different schemas in the OCA package

### 2. Data Loss Issues
- Editing schema A, then switching to schema B, loses all changes to schema A
- No persistence of changes across schema switches
- Export logic regenerates from global state, losing schema-specific changes

### 3. Component Assumptions
- All editor components assume they're working with "the" schema
- No concept of schema-specific data loading/saving
- Navigation doesn't preserve schema context

## New Architecture

### 1. Schema-Specific State Management

```javascript
// Instead of global state:
const [attributeRowData, setAttributeRowData] = useState([]);
const [overlay, setOverlay] = useState({});

// New schema-specific state:
const [schemaStates, setSchemaStates] = useState({
  [schemaId]: {
    metadata: { name: "", description: "", languages: [] },
    attributes: [],
    overlays: {},
    entryCodes: {},
    // ... all schema-specific data
  }
});
const [activeSchemaId, setActiveSchemaId] = useState(null);
```

### 2. Schema State Management Functions

```javascript
// Get state for a specific schema
const getSchemaState = (schemaId) => schemaStates[schemaId] || defaultState;

// Update state for a specific schema
const updateSchemaState = (schemaId, updates) => {
  setSchemaStates(prev => ({
    ...prev,
    [schemaId]: { ...getSchemaState(schemaId), ...updates }
  }));
};

// Switch to editing a different schema
const switchToSchema = (schemaId) => {
  setActiveSchemaId(schemaId);
  // Initialize schema if needed
  if (!schemaStates[schemaId]) {
    initializeSchemaFromOCA(schemaId, OCAPackage);
  }
};
```

### 3. Schema-Specific Editor Components

Each editor component needs to be updated to work with schema-specific data:

```javascript
// Before (global state):
const { attributeRowData, setAttributeRowData } = useContext(Context);

// After (schema-specific):
const { activeSchemaId, getSchemaState, updateSchemaState } = useContext(Context);
const schemaState = getSchemaState(activeSchemaId);

// Load data from specific schema
useEffect(() => {
  const state = getSchemaState(activeSchemaId);
  // Use state.attributes instead of global attributeRowData
}, [activeSchemaId]);

// Save changes to specific schema
const handleSave = (newData) => {
  updateSchemaState(activeSchemaId, { attributes: newData });
};
```

### 4. Smart Export Logic

```javascript
const exportOCAPackage = () => {
  const originalPackage = OCAPackage;
  const modifiedPackage = { ...originalPackage };
  
  // Apply changes from each modified schema
  Object.entries(schemaStates).forEach(([schemaId, state]) => {
    if (hasChanges(state)) {
      applySchemaChanges(modifiedPackage, schemaId, state);
    }
  });
  
  return modifiedPackage;
};
```

## Implementation Plan

### Phase 1: Core Infrastructure (Week 1)
1. **Update Context Structure**
   - Add schema-specific state management
   - Create schema switching functions
   - Update context provider

2. **Schema Initialization**
   - Create functions to initialize schema state from OCA package
   - Handle root, dependency, and placeholder schemas
   - Preserve original data structure

### Phase 2: Editor Components (Week 2)
1. **Step 1: Schema Metadata**
   - Update to use schema-specific metadata
   - Handle schema name/description per schema

2. **Step 2: Attribute Details**
   - Update to use schema-specific attributes
   - Handle empty schemas (placeholders)
   - Preserve changes across schema switches

3. **Step 3: Language Details**
   - Update to use schema-specific labels
   - Handle language-specific data per schema

4. **Steps 4-6: Overlays**
   - Update all overlay components to use schema-specific data
   - Handle overlay data isolation

### Phase 3: Navigation & Export (Week 3)
1. **Navigation State**
   - Track which schemas have been modified
   - Preserve changes across page navigation
   - Handle schema switching from visualization

2. **Export Logic**
   - Merge changes from all modified schemas
   - Preserve cross-schema references
   - Validate nested structure integrity

3. **Testing & Validation**
   - Test all schema editing workflows
   - Validate data persistence
   - Test export functionality

## Benefits

### 1. Data Integrity
- Changes to one schema don't affect others
- All changes are preserved across navigation
- Export maintains nested structure

### 2. User Experience
- Seamless switching between schemas
- Visual feedback on which schema is being edited
- Consistent editing experience for all schemas

### 3. Maintainability
- Clear separation of concerns
- Schema-specific logic isolation
- Easier to test and debug

## Migration Strategy

### 1. Backward Compatibility
- Maintain existing single-schema functionality
- Add multi-schema as opt-in feature
- Gradual migration of components

### 2. Data Migration
- Convert existing global state to schema-specific state
- Preserve user's current work
- Handle legacy data formats

### 3. Testing Strategy
- Unit tests for schema state management
- Integration tests for schema switching
- End-to-end tests for complete workflows

## Risk Mitigation

### 1. Data Loss Prevention
- Automatic state persistence
- Change tracking and validation
- Backup/restore functionality

### 2. Performance Considerations
- Lazy loading of schema data
- Efficient state updates
- Memory management for large schemas

### 3. User Experience
- Clear visual indicators
- Intuitive navigation
- Error handling and recovery

## Conclusion

This architecture provides a solid foundation for multi-schema editing while maintaining the existing functionality. The phased approach allows for incremental implementation and testing, reducing risk while delivering value.
