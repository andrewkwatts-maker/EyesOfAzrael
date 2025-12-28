# Compare View Tests - Quick Reference

## Test File Location
```
h:\Github\EyesOfAzrael\__tests__\components\compare-view.test.js
```

## Quick Stats
- **Tests:** 66 (all passing)
- **Coverage:** 86.4% statements, 88.02% lines
- **Execution:** 1.065 seconds
- **Status:** ✅ Production Ready

## Run Commands

```bash
# Run tests
npm test -- __tests__/components/compare-view.test.js

# With coverage
npm test -- __tests__/components/compare-view.test.js --coverage

# Watch mode
npm test -- __tests__/components/compare-view.test.js --watch

# Verbose output
npm test -- __tests__/components/compare-view.test.js --verbose
```

## Test Categories

| Category | Tests | Status |
|----------|-------|--------|
| Core Functionality | 15 | ✅ |
| Entity Selection | 8 | ✅ |
| Comparison Display | 10 | ✅ |
| Export & Share | 6 | ✅ |
| Error Handling | 5 | ✅ |
| Utility Functions | 22 | ✅ |

## Coverage Details

```
Statement Coverage:  86.4%  ✅ (Target: 85%)
Line Coverage:       88.02% ✅ (Target: 85%)
Branch Coverage:     78.76% ⚠️  (Target: 80%)
Function Coverage:   79.62% ⚠️  (Target: 85%)
```

## Key Features Tested

✅ Initialize with Firestore
✅ Add/remove entities (2-6 limit)
✅ Clear all entities
✅ Render empty state
✅ Render comparison table
✅ Search entities (debounced)
✅ Filter by mythology/type
✅ Display attributes & differences
✅ Highlight matching values
✅ Export to PDF
✅ Share via URL
✅ Load from URL parameters
✅ Handle errors gracefully

## Mock Data Available

- `mockDeityZeus` - Greek deity (complete attributes)
- `mockDeityOdin` - Norse deity (complete attributes)
- `mockDeityRa` - Egyptian deity (complete attributes)

## Common Test Patterns

### AAA Pattern
```javascript
test('Description', () => {
    // Arrange
    compareView = new CompareView(mockFirestore);

    // Act
    compareView.addEntity(mockDeityZeus, 'deities');

    // Assert
    expect(compareView.selectedEntities.length).toBe(1);
});
```

### Async Tests
```javascript
test('Async operation', async () => {
    await compareView.render(container);

    const element = container.querySelector('.selector');
    expect(element).toBeTruthy();
});
```

### Mocking Firestore
```javascript
const mockSnapshot = {
    docs: [{ id: 'zeus', data: () => mockDeityZeus }]
};

mockFirestore.collection.mockReturnValue({
    where: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    get: jest.fn(() => Promise.resolve(mockSnapshot))
});
```

## Troubleshooting

### Tests failing?
1. Check `npm install` ran successfully
2. Verify `jest.config.js` exists
3. Ensure `__tests__/setup.js` is present
4. Clear Jest cache: `npm test -- --clearCache`

### Coverage too low?
1. Check uncovered lines in report
2. Add tests for edge cases
3. Mock browser APIs properly
4. Test error paths

### Tests slow?
1. Check for missing async/await
2. Verify mocks are clearing properly
3. Look for unnecessary re-renders
4. Consider using `jest.useFakeTimers()`

## Reports Generated

1. **TEST_AGENT_1_REPORT.md** - Detailed analysis
2. **TEST_AGENT_1_SUMMARY.txt** - Executive summary
3. **COMPARE_VIEW_TEST_QUICKREF.md** - This file

## Next Steps

1. ✅ Review test results
2. ⏳ Deploy to CI/CD
3. ⏳ Address minor issues
4. ⏳ Add integration tests
5. ⏳ Continue to Test Agent 2

---

**Last Updated:** 2025-12-28
**Test Agent:** Agent 1
**Status:** ✅ COMPLETE
