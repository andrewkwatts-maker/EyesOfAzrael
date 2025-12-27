# Test Suite Quick Reference

## Run Tests

```bash
# Start server
python -m http.server 8080

# Open in browser
http://localhost:8080/tests/test-runner.html

# Auto-run
http://localhost:8080/tests/test-runner.html?autorun
```

## Write a Test

```javascript
describe('Component Name', () => {
    beforeEach(() => {
        // Setup
    });

    it('should do something', () => {
        // Arrange
        const input = 'test';

        // Act
        const result = doSomething(input);

        // Assert
        expect(result).toBe('expected');
    });
});
```

## Common Assertions

```javascript
expect(value).toBe(expected)           // ===
expect(value).toEqual(expected)        // deep equal
expect(value).toBeTruthy()             // truthy
expect(value).toBeDefined()            // not undefined
expect(array).toContain(item)          // includes
expect(array).toHaveLength(3)          // length check
expect(obj).toHaveProperty('prop')     // has property
expect(() => fn()).toThrow()           // throws error
await expect(promise).toResolve()      // resolves
```

## Mock Firebase

```javascript
const mockDb = new MockFirestore();
const mockAuth = new MockAuth();

// Seed data
mockDb.seed('collection', {
    'id': { field: 'value' }
});

// Query
const snapshot = await mockDb.collection('collection')
    .where('field', '==', 'value')
    .get();

// Auth
await mockAuth.signInWithEmailAndPassword(
    'user@example.com',
    'password123'
);
```

## File Structure

```
tests/
├── test-framework.js           # Framework
├── test-runner.html            # Runner
├── mocks/mock-firebase.js      # Mocks
├── unit/*.test.js              # Unit tests
└── integration/*.test.js       # Integration tests
```

## Test Counts

- **Unit Tests**: 110+
- **Integration Tests**: 25+
- **Total**: 135+

## Key Components Tested

✅ FirebaseCacheManager (30+ tests)
✅ SPANavigation (25+ tests)
✅ EntityRenderer (35+ tests)
✅ PerformanceMonitor (20+ tests)
✅ Login Flow (10+ tests)
✅ Mythology Browsing (15+ tests)

## Performance

- Average test: < 10ms
- Full suite: < 2 seconds
- Zero network calls

## Resources

- Full Guide: `TESTING_GUIDE.md`
- Summary: `TEST_SUITE_SUMMARY.md`
- Examples: `unit/*.test.js`

## Quick Commands

```bash
# View test files
ls tests/unit/

# Count tests
grep -r "it('should" tests/ | wc -l

# Run specific suite
# (filter in browser UI)
```

## Status

✅ Framework: Complete
✅ Mocks: Complete
✅ Unit Tests: 110+
✅ Integration Tests: 25+
✅ Documentation: Complete
⏳ E2E Tests: Planned
⏳ CI/CD: Planned
