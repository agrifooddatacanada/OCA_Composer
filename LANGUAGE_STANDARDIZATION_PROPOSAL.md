# Language Standardization Proposal for OCA Composer

## Problem Analysis

The current codebase has inconsistent language handling that led to debugging issues and complex fallback logic. Here's what we found:

### Current Inconsistencies

1. **Mixed Language Formats**: 
   - ISO 639-1 (2-letter): `"en"`, `"fr"`
   - ISO 639-2 (3-letter): `"eng"`, `"fra"`
   - Full Names: `"English"`, `"French"`
   - Inconsistent Casing: `"english"`, `"English"`, `"ENGLISH"`

2. **Component-Specific Patterns**:
   - **LDAD**: Stores data under full names (`"English"`, `"French"`)
   - **Visualization**: Expects 3-letter codes (`"eng"`, `"fra"`)
   - **i18n**: Uses 2-letter codes (`"en"`, `"fr"`)
   - **Schema Overlays**: Mixed usage

3. **Problematic Areas Found**:
   ```javascript
   // ViewSchema.js - Manual conversion
   l === "English" ? "eng" : l === "French" ? "fra" : l;
   
   // Multiple fallback patterns in dataUtils.js
   langData[language] || langData.English || langData.eng
   
   // Different defaults across components
   DEFAULT_LANGUAGE = "English"
   DEFAULT_THREE_LETTER_LANGUAGE_CODE = "eng"
   ```

## Recommended Standardization Approach

### 1. **Single Source of Truth**: ISO 639-2 (3-letter codes)

**Why 3-letter codes?**
- ✅ More languages supported (639-2 vs 639-1)
- ✅ OCA standard appears to use 3-letter codes
- ✅ No ambiguity (avoids `zh` vs `zh-CN` issues)
- ✅ Already have conversion utilities in place

### 2. **Standardized Language Utilities**

Create centralized language handling utilities:

```javascript
// src/utils/languageUtils.js

// Standard format: ISO 639-2 (3-letter)
export const STANDARD_LANGUAGES = {
  ENGLISH: 'eng',
  FRENCH: 'fra',
  SPANISH: 'spa',
  // ... etc
};

export const DEFAULT_LANGUAGE = STANDARD_LANGUAGES.ENGLISH;

// Conversion utilities
export const toStandardCode = (input) => {
  if (!input) return DEFAULT_LANGUAGE;
  
  const normalized = String(input).toLowerCase().trim();
  
  // If already 3-letter code
  if (normalized.length === 3) return normalized;
  
  // From 2-letter
  if (normalized.length === 2) {
    return alpha3CodesToTwoLetterCodes[normalized] || DEFAULT_LANGUAGE;
  }
  
  // From full name
  return languageNameToAlpha3Codes[normalized] || DEFAULT_LANGUAGE;
};

export const toDisplayName = (code) => {
  // Convert 3-letter code to human readable name
  return alpha3CodesToLanguageNames[code] || 'Unknown';
};

export const validateLanguageCode = (code) => {
  return Object.values(STANDARD_LANGUAGES).includes(code);
};
```

### 3. **Migration Strategy**

#### Phase 1: Infrastructure
- [ ] Create `src/utils/languageUtils.js` with standardized utilities
- [ ] Update constants to use 3-letter codes as primary
- [ ] Add validation functions

#### Phase 2: Data Layer
- [ ] Update Context providers to store languages as 3-letter codes
- [ ] Migrate schema state to use 3-letter keys
- [ ] Update import/export functions to normalize on load/save

#### Phase 3: Component Updates
- [ ] Update LDAD to use 3-letter codes internally
- [ ] Update visualization components to expect standard format
- [ ] Update all language selection dropdowns
- [ ] Add display name conversion in UI components

#### Phase 4: Cleanup
- [ ] Remove manual conversion logic
- [ ] Simplify fallback patterns
- [ ] Update tests and documentation

### 4. **Implementation Benefits**

1. **Eliminates Debug Complexity**: No more `eng` vs `English` mismatches
2. **Simplified Logic**: Single conversion point instead of scattered fallbacks
3. **Better Maintainability**: Clear language handling patterns
4. **Future-Proof**: Easy to add new languages
5. **Performance**: No more complex fallback chains

### 5. **Breaking Changes**

This would be a breaking change for:
- Saved schema files that use full language names
- API consumers expecting specific formats
- Existing import/export workflows

**Mitigation**: Maintain backward compatibility in import functions while standardizing internal representation.

### 6. **Proposed File Structure**

```
src/
├── utils/
│   └── languageUtils.js          # New: Centralized language handling
├── constants/
│   ├── isoCodes.js              # Keep: ISO code mappings
│   └── constants.js             # Update: Use 3-letter defaults
└── components/                   # Update: All use standard format
```

## Implementation Priority

Given the debugging complexity we just experienced, I recommend:

1. **High Priority**: Create the utilities and update the visualization pipeline (dataUtils.js, SchemaVisualizationEmbed.js)
2. **Medium Priority**: Update LDAD and Context providers
3. **Low Priority**: Update remaining UI components and import/export

This would prevent future issues like the `eng`/`English` mismatch we just debugged.

## Next Steps

Would you like me to:
1. Implement the standardization utilities?
2. Start with a specific component migration?
3. Create a more detailed migration plan?
4. Focus on a different approach?