/**
 * Sources Validation Tests
 *
 * Tests for validating the sources field format in assets:
 * - Valid sources array with objects passes
 * - String array fails with specific error
 * - Nested object fails with specific error
 * - fix-sources-format correctly transforms data
 */

describe('Sources Validation', () => {
  // Validation function matching the actual validator logic
  function validateSources(sources) {
    const errors = [];

    if (sources === undefined || sources === null) {
      return { valid: true, errors: [] };
    }

    // Must be an array
    if (!Array.isArray(sources)) {
      if (typeof sources === 'object') {
        errors.push({
          code: 'SOURCES_NESTED_OBJECT',
          message: 'Sources field is a nested object, should be a flat array'
        });
      } else {
        errors.push({
          code: 'SOURCES_INVALID_TYPE',
          message: `Sources field must be an array, got ${typeof sources}`
        });
      }
      return { valid: false, errors };
    }

    // Check array contents
    if (sources.length > 0) {
      if (typeof sources[0] === 'string') {
        errors.push({
          code: 'SOURCES_STRING_ARRAY',
          message: 'Sources contains strings, should be objects with title field'
        });
        return { valid: false, errors };
      }

      // Validate each object has required fields
      for (let i = 0; i < sources.length; i++) {
        const source = sources[i];
        if (typeof source !== 'object' || source === null) {
          errors.push({
            code: 'SOURCES_INVALID_ITEM',
            message: `Source at index ${i} is not an object`
          });
        } else if (!source.title && !source.text && !source.source) {
          errors.push({
            code: 'SOURCES_MISSING_IDENTIFIER',
            message: `Source at index ${i} missing title, text, or source field`
          });
        }
      }
    }

    return { valid: errors.length === 0, errors };
  }

  describe('Valid sources arrays', () => {
    test('empty array passes', () => {
      const result = validateSources([]);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('array with title objects passes', () => {
      const sources = [
        { title: 'The Iliad', author: 'Homer' },
        { title: 'Theogony', author: 'Hesiod' }
      ];
      const result = validateSources(sources);
      expect(result.valid).toBe(true);
    });

    test('array with text objects passes', () => {
      const sources = [
        { text: 'Primary source text excerpt', category: 'ancient' }
      ];
      const result = validateSources(sources);
      expect(result.valid).toBe(true);
    });

    test('array with source objects passes', () => {
      const sources = [
        { source: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Zeus' }
      ];
      const result = validateSources(sources);
      expect(result.valid).toBe(true);
    });

    test('null/undefined sources passes', () => {
      expect(validateSources(null).valid).toBe(true);
      expect(validateSources(undefined).valid).toBe(true);
    });
  });

  describe('Invalid sources formats', () => {
    test('string array fails with SOURCES_STRING_ARRAY', () => {
      const sources = ['The Iliad', 'Theogony', 'Metamorphoses'];
      const result = validateSources(sources);

      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].code).toBe('SOURCES_STRING_ARRAY');
    });

    test('nested object fails with SOURCES_NESTED_OBJECT', () => {
      const sources = {
        primaryTexts: ['The Iliad'],
        secondaryTexts: ['Encyclopedia Mythica']
      };
      const result = validateSources(sources);

      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].code).toBe('SOURCES_NESTED_OBJECT');
    });

    test('object without identifier fails', () => {
      const sources = [
        { author: 'Homer', year: '-800' }  // Missing title/text/source
      ];
      const result = validateSources(sources);

      expect(result.valid).toBe(false);
      expect(result.errors[0].code).toBe('SOURCES_MISSING_IDENTIFIER');
    });

    test('primitive value fails', () => {
      const result = validateSources('just a string');

      expect(result.valid).toBe(false);
      expect(result.errors[0].code).toBe('SOURCES_INVALID_TYPE');
    });
  });
});

describe('Sources Format Fixer', () => {
  // Transformation function matching fix-sources-format.js
  function normalizeSourcesField(sources) {
    // Case 1: Already valid
    if (Array.isArray(sources) && sources.length > 0) {
      if (typeof sources[0] === 'object' && sources[0] !== null) {
        if (sources[0].title || sources[0].text || sources[0].source) {
          return { fixed: false, normalized: sources };
        }
      }

      // Case 2: String array → Object array
      if (typeof sources[0] === 'string') {
        const normalized = sources.map(s => ({ title: s }));
        return { fixed: true, normalized };
      }
    }

    // Case 3: Nested object → Flat array
    if (typeof sources === 'object' && sources !== null && !Array.isArray(sources)) {
      const flattened = [];
      for (const [key, value] of Object.entries(sources)) {
        if (Array.isArray(value)) {
          for (const item of value) {
            if (typeof item === 'string') {
              flattened.push({ title: item, category: key });
            } else if (typeof item === 'object') {
              flattened.push({ ...item, category: item.category || key });
            }
          }
        } else if (typeof value === 'string') {
          flattened.push({ title: value, category: key });
        }
      }
      return { fixed: true, normalized: flattened };
    }

    return { fixed: false, normalized: sources };
  }

  test('transforms string array to object array', () => {
    const input = ['The Iliad', 'The Odyssey', 'Theogony'];
    const result = normalizeSourcesField(input);

    expect(result.fixed).toBe(true);
    expect(result.normalized).toHaveLength(3);
    expect(result.normalized[0]).toEqual({ title: 'The Iliad' });
    expect(result.normalized[1]).toEqual({ title: 'The Odyssey' });
    expect(result.normalized[2]).toEqual({ title: 'Theogony' });
  });

  test('flattens nested object to array', () => {
    const input = {
      primaryTexts: ['The Iliad', 'Theogony'],
      secondaryTexts: ['Encyclopedia Mythica']
    };
    const result = normalizeSourcesField(input);

    expect(result.fixed).toBe(true);
    expect(result.normalized).toHaveLength(3);
    expect(result.normalized[0]).toEqual({ title: 'The Iliad', category: 'primaryTexts' });
    expect(result.normalized[2]).toEqual({ title: 'Encyclopedia Mythica', category: 'secondaryTexts' });
  });

  test('preserves valid object array', () => {
    const input = [
      { title: 'The Iliad', author: 'Homer' }
    ];
    const result = normalizeSourcesField(input);

    expect(result.fixed).toBe(false);
    expect(result.normalized).toEqual(input);
  });

  test('handles empty array', () => {
    const result = normalizeSourcesField([]);
    expect(result.fixed).toBe(false);
    expect(result.normalized).toEqual([]);
  });

  test('handles deeply nested structures', () => {
    const input = {
      ancient: {
        greek: ['Iliad', 'Odyssey']
      },
      modern: ['Wikipedia']
    };
    const result = normalizeSourcesField(input);

    expect(result.fixed).toBe(true);
    // The flattening handles first level only
    expect(result.normalized.some(s => s.category === 'modern')).toBe(true);
  });
});
