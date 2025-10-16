import { LanguageUtils, LanguageConstants } from '../utils/languageUtils';

describe('LanguageUtils', () => {
  test('getSchemaLanguageFromUI should convert UI codes to schema names', () => {
    expect(LanguageUtils.getSchemaLanguageFromUI('en')).toBe('English');
    expect(LanguageUtils.getSchemaLanguageFromUI('fr')).toBe('French');
    expect(LanguageUtils.getSchemaLanguageFromUI('en-US')).toBe('English');
    expect(LanguageUtils.getSchemaLanguageFromUI('es')).toBe('Spanish');
    expect(LanguageUtils.getSchemaLanguageFromUI('invalid')).toBeNull();
  });

  test('getOCALanguageCode should convert schema names to OCA codes', () => {
    expect(LanguageUtils.getOCALanguageCode('English')).toBe('eng');
    expect(LanguageUtils.getOCALanguageCode('French')).toBe('fra');
    expect(LanguageUtils.getOCALanguageCode('Spanish')).toBe('spa');
    expect(LanguageUtils.getOCALanguageCode('')).toBe('eng');
    expect(LanguageUtils.getOCALanguageCode('invalid')).toBe('eng');
  });

  test('getBestSchemaLanguage should return best matching language', () => {
    const availableLanguages = ['English', 'French', 'Spanish'];
    
    expect(LanguageUtils.getBestSchemaLanguage('en', availableLanguages)).toBe('English');
    expect(LanguageUtils.getBestSchemaLanguage('fr', availableLanguages)).toBe('French');
    expect(LanguageUtils.getBestSchemaLanguage('de', availableLanguages)).toBe('English'); // Fallback to first
    expect(LanguageUtils.getBestSchemaLanguage('en', ['Spanish'])).toBe('Spanish'); // No match, use first
  });

  test('normalizeUILanguageCode should handle variants', () => {
    expect(LanguageUtils.normalizeUILanguageCode('en-US')).toBe('en');
    expect(LanguageUtils.normalizeUILanguageCode('en-CA')).toBe('en');
    expect(LanguageUtils.normalizeUILanguageCode('fr')).toBe('fr');
    expect(LanguageUtils.normalizeUILanguageCode('')).toBe('en');
  });

  test('Constants should have expected values', () => {
    expect(LanguageConstants.DEFAULT_SCHEMA_LANGUAGE).toBe('English');
    expect(LanguageConstants.DEFAULT_OCA_CODE).toBe('eng');
    expect(LanguageConstants.FALLBACK_LANGUAGES).toContain('English');
    expect(LanguageConstants.FALLBACK_LANGUAGES).toContain('French');
  });

});

describe('LanguageUtils Extended Functionality', () => {
  test('getPrioritizedSchemaLanguages should reorder languages correctly', () => {
    // Mock i18next.language to be 'fr'
    const originalLanguage = require('i18next').language;
    require('i18next').language = 'fr';
    
    const languages = ['English', 'French', 'Spanish'];
    const prioritized = LanguageUtils.getPrioritizedSchemaLanguages(languages);
    
    expect(prioritized[0]).toBe('French'); // French should be first
    expect(prioritized).toContain('English');
    expect(prioritized).toContain('Spanish');
    
    // Restore original language
    require('i18next').language = originalLanguage;
  });

  test('getEffectiveSchemaLanguage should handle overrides correctly', () => {
    const languages = ['English', 'French'];
    
    // With override
    expect(LanguageUtils.getEffectiveSchemaLanguage('French', languages)).toBe('French');
    
    // Without override should use best match logic
    const result = LanguageUtils.getEffectiveSchemaLanguage(null, languages);
    expect(['English', 'French']).toContain(result);
  });
});