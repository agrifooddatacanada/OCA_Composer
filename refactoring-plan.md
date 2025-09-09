# Multi-Schema Context Refactoring Plan

## Current State Analysis

### Issues Identified:

1. **Massive Context File**: 1,176 lines with 25+ useCallback hooks
2. **State Duplication**: Same data stored in multiple formats
3. **Complex Initialization**: 300+ lines just for parsing OCA data
4. **Memory Inefficiency**: Each schema stores duplicate overlay arrays
5. **Poor Separation**: UI state mixed with data state

### Current Context API Surface (40+ methods):
```javascript
// State getters (6)
getSchemaState, getCurrentSchemaId, getDeletedAttributes, 
getModifiedSchemas, getNavigationHistory, getCompleteSchema

// State setters (8)  
updateSchemaState, ensureSchemaExists, addDeletedAttributes,
setSelectedOverlay, updateOverlaySelection, clearAllSchemas

// Schema lifecycle (6)
initializeSchemaFromOCA, switchToSchema, addSchemaFromOCA,
initializeFromOCAPackage, exportSchemaToOCA, exportSchemaChanges

// Navigation (2)
navigateBack, isSchemaModified

// Overlay management (4)
getOverlaySelections, getSelectedOverlay

// Persistence (3)
saveToLocalStorage, loadFromLocalStorage, setCurrentPackageId

// Plus: 16 arrays of overlay-specific data
// Plus: schemaStates, activeSchemaId, navigationHistory, etc.
```

## Immediate Cleanup Opportunities

### 1. Eliminate Duplicate Overlay Arrays

**Current Problem:**
```javascript
// In createDefaultSchemaState()
characterEncodingData: [],
formatRuleData: [],
cardinalityData: [],
dataStandardsData: [],
rangeData: [],
unitData: [],
unitFramedData: [],
attributeFramingData: [],
// ... repeated 16 times
```

**Solution:** Replace with computed getters
```javascript
// Remove all overlay data arrays from state
// Add utility functions:
const getOverlayDisplayData = (schemaId, overlayType) => {
  const schema = getSchemaState(schemaId);
  return transformOverlayData(schema.overlays[overlayType]);
};
```

### 2. Simplify Schema Initialization

**Current:** 300+ lines of parsing logic mixed with state management
**Solution:** Extract into separate utility

```javascript
// Extract to: src/utils/ocaParser.js
class OCAParser {
  static parseSchemaData(ocaPackage, schemaId) {
    // All the normalization logic
  }
  
  static normalizeAttributeType(rawType) {
    // Type normalization
  }
  
  static parseOverlays(overlayData) {
    // Overlay parsing
  }
}
```

### 3. Consolidate State Operations

**Current:** Separate methods for each state piece
```javascript
addDeletedAttributes()
getDeletedAttributes() 
updateSchemaState()
getSchemaState()
// etc...
```

**Solution:** Single state manager
```javascript
// Use Immer for immutable updates
const updateSchema = useCallback((schemaId, updater) => {
  setSchemaStates(produce(draft => {
    if (!draft[schemaId]) draft[schemaId] = createDefaultState();
    updater(draft[schemaId]);
  }));
  setModifiedSchemas(prev => new Set([...prev, schemaId]));
}, []);
```

### 4. Split Context by Concern

Instead of one massive context, create focused contexts:

```javascript
// 1. Core schema data
export const SchemaDataProvider = ({ children }) => {
  const [schemas, setSchemas] = useState({});
  // Only data operations
};

// 2. Navigation state  
export const NavigationProvider = ({ children }) => {
  const [activeSchemaId, setActiveSchemaId] = useState(null);
  const [history, setHistory] = useState([]);
  // Only navigation
};

// 3. UI state
export const SchemaUIProvider = ({ children }) => {
  const [selectedOverlays, setSelectedOverlays] = useState({});
  // Only UI state
};

// 4. Change tracking
export const ChangeTrackingProvider = ({ children }) => {
  const [modifiedSchemas, setModifiedSchemas] = useState(new Set());
  // Only change tracking
};
```

## Phase 1: Quick Wins (Low Risk)

### 1.1 Remove Duplicate Arrays ⭐ **START HERE**
- Delete 8 overlay data arrays from default state
- Replace usage with computed getters
- **Impact:** Reduces state size by ~60%, simpler debugging

### 1.2 Extract OCA Parser
- Move 300 lines of parsing logic to `src/utils/ocaParser.js`
- **Impact:** Context file size -25%, better testability

### 1.3 Consolidate Simple Getters
- Replace 6 simple getters with direct state access or single helper
- **Impact:** Reduces API surface, simpler usage

## Phase 2: Architecture Improvements (Medium Risk)

### 2.1 Split Context by Concern
- Create 4 focused contexts instead of 1 massive context
- **Impact:** Better performance, cleaner separation

### 2.2 Introduce State Manager Pattern
- Use Immer for immutable updates
- Single `updateSchema` method instead of 8 specialized ones
- **Impact:** More predictable updates, easier debugging

## Phase 3: Advanced Optimization (Higher Risk)

### 3.1 Lazy Schema Loading
- Only load/parse schemas when needed
- **Impact:** Faster initial load, lower memory usage

### 3.2 Normalized State Structure
- Store schemas in normalized format closer to OCA spec
- Transform for UI display only when needed
- **Impact:** Eliminates sync issues, simpler export

## Estimated Impact

**After Phase 1:**
- Context file: 1,176 → ~800 lines (-32%)
- API methods: 40+ → ~25 (-37%)
- State memory: ~60% reduction
- Complexity: Significantly reduced

**After Phase 2:**  
- Context files: 1 → 4 focused contexts
- Performance: Better (fewer re-renders)
- Maintainability: Much better

**After Phase 3:**
- Memory usage: ~80% reduction for large packages
- Load time: ~50% faster
- Complexity: Minimal

## Migration Strategy

1. **Backward Compatible**: All changes maintain existing API initially
2. **Incremental**: Each phase can be done separately  
3. **Test Coverage**: Add tests before refactoring
4. **Feature Flags**: Use flags to enable new implementation gradually

Would you like me to start with Phase 1.1 (removing duplicate arrays)?
