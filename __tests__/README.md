# Eyes of Azrael - Unit Tests

## Overview

This directory contains comprehensive unit tests for the Eyes of Azrael project. The tests are written using Jest and provide extensive coverage of all core functionality.

## Test Structure

```
__tests__/
├── setup.js                      # Global test configuration and mocks
├── simple-theme-toggle.test.js   # Theme Toggle tests (47 tests) ✅
├── analytics.test.js             # Analytics module tests (80 tests)
└── README.md                     # This file
```

## Running Tests

### Install Dependencies

```bash
npm install
```

### Run All Tests

```bash
npm test
```

### Run Tests in Watch Mode

```bash
npm run test:watch
```

### Run Tests with Coverage

```bash
npm run test:coverage
```

### Run Tests in CI Mode

```bash
npm run test:ci
```

## Test Coverage

### Current Coverage

- **Theme Toggle Module**: 98.07% coverage ✅
  - 47 comprehensive tests
  - All functionality tested
  - Error handling validated
  - Accessibility verified

- **Analytics Module**: 90%+ coverage
  - 80 comprehensive tests
  - All critical paths tested
  - Error handling validated
  - Privacy compliance verified

### Coverage Targets

- Overall: 80%+
- Functions: 85%+
- Branches: 80%+
- Lines: 80%+

## Test Categories

### Analytics Tests (80 tests)

1. **Initialization (6 tests)**
   - Google Analytics 4 setup
   - Firebase Analytics integration
   - Configuration validation
   - Error handling

2. **Page View Tracking (8 tests)**
   - Path and title tracking
   - SPA navigation
   - Metadata inclusion
   - Load time tracking

3. **Entity View Tracking (10 tests)**
   - Entity ID and name tracking
   - Collection and mythology tracking
   - View duration
   - Scroll depth
   - Batch processing

4. **Search Tracking (8 tests)**
   - Query tracking
   - Result count
   - Filter application
   - Result clicks
   - No results handling

5. **Comparison Tracking (6 tests)**
   - Entity comparison
   - Export tracking
   - Share tracking
   - Metadata inclusion

6. **Contribution Tracking (8 tests)**
   - Create/Edit/Delete actions
   - Status tracking
   - User ID handling
   - Contribution time

7. **Navigation Tracking (8 tests)**
   - Route changes
   - Source/destination tracking
   - Navigation method
   - External links

8. **Error Tracking (10 tests)**
   - JavaScript errors
   - Firebase errors
   - Network errors
   - Stack trace capture
   - PII sanitization

9. **Performance Tracking (10 tests)**
   - Page load metrics
   - Core Web Vitals
   - Firebase performance
   - Performance API

10. **Privacy & Consent (6 tests)**
    - Consent checking
    - Do Not Track
    - IP anonymization
    - Opt-out functionality

## Writing Tests

### Test Structure (AAA Pattern)

```javascript
test('should do something', () => {
  // Arrange - Set up test data and mocks
  const input = 'test data';
  const expectedOutput = 'expected result';

  // Act - Execute the function under test
  const result = functionUnderTest(input);

  // Assert - Verify the results
  expect(result).toBe(expectedOutput);
});
```

### Mocking

All global objects are mocked in `setup.js`:
- `gtag` - Google Analytics
- `firebase` - Firebase SDK
- `localStorage` - Browser storage
- `performance` - Performance API
- `window`, `document` - DOM objects

### Best Practices

1. **Clear Test Names**: Use descriptive test names that explain what is being tested
2. **One Assertion Focus**: Each test should focus on one specific behavior
3. **Clean Setup**: Use `beforeEach` to ensure clean state
4. **Mock External Dependencies**: Always mock external services
5. **Test Edge Cases**: Include tests for error conditions and edge cases

## Debugging Tests

### Run Specific Test File

```bash
npm test -- analytics.test.js
```

### Run Specific Test

```bash
npm test -- -t "should track page view with path"
```

### Debug Mode

```bash
node --inspect-brk node_modules/.bin/jest --runInBand
```

## Coverage Reports

After running `npm run test:coverage`, view the HTML coverage report:

```bash
open coverage/lcov-report/index.html
```

## Continuous Integration

Tests are automatically run in CI/CD pipeline with:
- Maximum 2 workers for consistent results
- Coverage reporting
- Failure on coverage threshold violations

## Troubleshooting

### Tests Failing

1. Ensure all dependencies are installed: `npm install`
2. Clear Jest cache: `npx jest --clearCache`
3. Check Node.js version: `node --version` (requires 14+)

### Coverage Not Meeting Threshold

1. Run coverage report: `npm run test:coverage`
2. Check HTML report for uncovered lines
3. Add tests for uncovered code paths

### Mock Issues

1. Check `setup.js` for mock configuration
2. Ensure mocks are cleared in `beforeEach`
3. Verify mock implementation matches expected interface

## Contributing

When adding new tests:

1. Follow the AAA pattern
2. Add descriptive test names
3. Mock external dependencies
4. Ensure tests are isolated
5. Update this README if adding new test categories

## Resources

- [Jest Documentation](https://jestjs.io/)
- [Testing Library](https://testing-library.com/)
- [Unit Test Plan](../UNIT_TEST_PLAN.md)

---

**Last Updated**: 2025-12-28
**Test Coverage**: 98.07% (Theme Toggle), 90%+ (Analytics)
**Total Tests**: 127 (47 Theme Toggle + 80 Analytics)
