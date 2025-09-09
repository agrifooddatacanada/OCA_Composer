# Proposed Multi-Schema Architecture Improvements

## 1. Simplified State Structure

```javascript
// Simplified per-schema state
{
  // Core schema data (single source of truth)
  schema: {
    id: string,
    metadata: { name, description, languages, digest },
    attributes: Map<string, AttributeDefinition>,
    overlays: Map<string, OverlayData>
  },
  
  // UI-specific state only
  ui: {
    selectedOverlay: string,
    overlaySelections: Map<string, boolean>,
    activeLanguage: string
  },
  
  // Change tracking
  changes: {
    modified: boolean,
    deletedAttributes: Set<string>,
    addedAttributes: Set<string>,
    modifiedOverlays: Set<string>
  }
}
```

## 2. Normalized Data Access

Instead of storing duplicate overlay data in separate arrays, use computed properties:

```javascript
// Current: Multiple arrays
characterEncodingData: []
formatRuleData: []
cardinalityData: []

// Proposed: Single source with computed access
const getOverlayData = (schemaId, overlayType) => {
  const schema = getSchema(schemaId);
  return transformOverlayForUI(schema.overlays.get(overlayType));
};
```

## 3. Simplified API Surface

```javascript
// Current: 40+ context methods
// Proposed: ~15 focused methods

// Schema management
createSchema(id, data)
getSchema(id)
updateSchema(id, updates)
deleteSchema(id)

// Navigation
setActiveSchema(id)
getActiveSchema()
getNavigationHistory()

// Changes
hasChanges(id?)
getChanges(id?)
applyChanges(id)
discardChanges(id)

// Export/Import
exportPackage()
importPackage(data)
```

## 4. Better Separation of Concerns

### Core Schema Service
```javascript
class SchemaService {
  // Pure OCA operations
  parseOCAPackage(data)
  exportOCAPackage(schemas)
  validateSchema(schema)
  resolveReferences(schemas)
}
```

### UI State Service  
```javascript
class UIStateService {
  // UI-specific operations
  setSelectedOverlay(schemaId, overlay)
  getDisplayData(schemaId, overlayType)
  updateFormData(schemaId, field, value)
}
```

### Change Tracking Service
```javascript
class ChangeTracker {
  // Change management
  trackChange(schemaId, type, data)
  hasUnsavedChanges(schemaId?)
  createChangeSet(schemaId)
  applyChangeSet(schemaId, changes)
}
```

## 5. Reduced Context Provider Complexity

Instead of one massive context with 40+ methods, use composition:

```javascript
function MultiSchemaProvider({ children }) {
  return (
    <SchemaProvider>
      <NavigationProvider>
        <ChangeTrackingProvider>
          <UIStateProvider>
            {children}
          </UIStateProvider>
        </ChangeTrackingProvider>
      </NavigationProvider>
    </SchemaProvider>
  );
}
```

## 6. Hook Simplification

```javascript
// Current: One massive hook
const { 
  getSchemaState,
  updateSchemaState,
  initializeSchemaFromOCA,
  switchToSchema,
  exportSchemaChanges,
  getOverlaySelections,
  // ... 30+ more methods
} = useMultiSchema();

// Proposed: Focused hooks
const schema = useSchema(schemaId);
const { setActive, active } = useNavigation();
const { hasChanges, apply, discard } = useChanges(schemaId);
const overlays = useOverlays(schemaId);
```

## Benefits of Proposed Architecture

1. **Reduced Complexity**: Single source of truth for schema data
2. **Better Performance**: Fewer re-renders, computed properties
3. **Easier Testing**: Smaller, focused services
4. **Better Type Safety**: Clearer data structures
5. **Simpler Debugging**: Clear separation of concerns
6. **Reduced Bundle Size**: Less duplicate code and state
