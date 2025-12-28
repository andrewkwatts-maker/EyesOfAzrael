# Eyes of Azrael - Comprehensive Testing Guide

## Table of Contents

- [Quick Start](#quick-start)
- [Test Structure](#test-structure)
- [Writing Tests](#writing-tests)
- [Test Categories](#test-categories)
- [Best Practices](#best-practices)
- [Debugging](#debugging)
- [Coverage Reports](#coverage-reports)
- [CI/CD Integration](#cicd-integration)
- [Troubleshooting](#troubleshooting)

## Quick Start

### Installation

```bash
# Install all dependencies
npm install

# Verify Jest installation
npx jest --version
```

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode (for development)
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Run tests in CI mode (for continuous integration)
npm run test:ci

# Run specific test file
npm test -- analytics.test.js

# Run specific test by name
npm test -- -t "should track page view"

# Run tests for specific component directory
npm run test:unit

# Run integration tests
npm run test:integration

# Debug tests with Node inspector
npm run test:debug

# Update snapshots
npm run test:update
```

### Viewing Coverage Reports

```bash
# Generate and open HTML coverage report
npm run test:coverage
npm run coverage:open

# Generate markdown coverage report
npm run coverage:report
```

## Test Structure

```
__tests__/
├── setup.js                           # Global test setup and mocks
├── test-utils.js                      # Shared test utilities
├── test-fixtures.js                   # Shared test data
├── components/                        # Component unit tests
│   ├── entity-renderer.test.js
│   ├── theme-toggle.test.js
│   ├── search.test.js
│   └── ...
├── integration/                       # Integration tests
│   ├── firebase-integration.test.js
│   ├── entity-crud.test.js
│   └── ...
├── TESTING_GUIDE.md                   # This file
├── COMPONENT_TEST_CHECKLIST.md        # Testing checklist
├── report-template.md                 # Test report template
└── metrics-dashboard.html             # Test metrics visualization
```

### File Naming Conventions

- Test files: `ComponentName.test.js`
- Mock files: `__mocks__/moduleName.js`
- Fixtures: `test-fixtures.js`
- Utilities: `test-utils.js`

## Writing Tests

### AAA Pattern (Arrange-Act-Assert)

All tests should follow the Arrange-Act-Assert pattern for clarity:

```javascript
describe('EntityRenderer', () => {
  test('should render entity card with correct data', () => {
    // Arrange - Set up test data and mocks
    const mockEntity = {
      id: 'zeus',
      name: 'Zeus',
      type: 'deity',
      mythology: 'greek'
    };
    const container = document.createElement('div');

    // Act - Perform the action
    const renderer = new EntityRenderer();
    renderer.render(container, mockEntity);

    // Assert - Verify the result
    expect(container.querySelector('.entity-name').textContent).toBe('Zeus');
    expect(container.querySelector('.entity-type').textContent).toBe('deity');
  });
});
```

### Test Naming Conventions

Use descriptive test names that explain the expected behavior:

```javascript
// Good: Describes what should happen
test('should display error message when Firebase is unavailable', () => {
  // ...
});

// Bad: Vague or technical jargon
test('test error handling', () => {
  // ...
});

// Good: Clear context and outcome
test('should filter search results by mythology when filter is applied', () => {
  // ...
});

// Bad: Too brief
test('filters work', () => {
  // ...
});
```

### Organizing Tests with describe()

Use `describe()` blocks to organize related tests:

```javascript
describe('ThemeToggle', () => {
  describe('initialization', () => {
    test('should load saved theme preference from localStorage', () => {
      // ...
    });

    test('should default to light theme when no preference is saved', () => {
      // ...
    });
  });

  describe('theme switching', () => {
    test('should toggle between light and dark themes', () => {
      // ...
    });

    test('should save theme preference to localStorage', () => {
      // ...
    });
  });

  describe('error handling', () => {
    test('should gracefully handle localStorage errors', () => {
      // ...
    });
  });
});
```

### Setup and Teardown

Use lifecycle hooks for common setup and teardown:

```javascript
describe('EntityRenderer', () => {
  let container;
  let renderer;

  beforeEach(() => {
    // Run before each test
    container = document.createElement('div');
    renderer = new EntityRenderer();
    jest.clearAllMocks();
  });

  afterEach(() => {
    // Run after each test
    container.remove();
    jest.restoreAllMocks();
  });

  beforeAll(() => {
    // Run once before all tests in this describe block
    // Use for expensive setup
  });

  afterAll(() => {
    // Run once after all tests in this describe block
    // Use for cleanup of expensive resources
  });

  test('should render entity', () => {
    // Test code
  });
});
```

### Mocking

#### Mocking Functions

```javascript
// Create a mock function
const mockCallback = jest.fn();

// Call the mock
mockCallback('test', 123);

// Assertions
expect(mockCallback).toHaveBeenCalled();
expect(mockCallback).toHaveBeenCalledWith('test', 123);
expect(mockCallback).toHaveBeenCalledTimes(1);

// Mock return value
mockCallback.mockReturnValue(42);
expect(mockCallback()).toBe(42);

// Mock implementation
mockCallback.mockImplementation((a, b) => a + b);
expect(mockCallback(2, 3)).toBe(5);
```

#### Mocking Modules

```javascript
// Mock an entire module
jest.mock('../js/firebase-config.js');

// Import the mocked module
import { db } from '../js/firebase-config.js';

// Use the mock
test('should query Firebase', async () => {
  db.collection.mockReturnValue({
    where: jest.fn().mockReturnThis(),
    get: jest.fn().mockResolvedValue({ docs: [] })
  });

  // Test code using db
});
```

#### Mocking Firebase

```javascript
// Mock Firebase is already set up in setup.js
test('should save entity to Firebase', async () => {
  const mockEntity = { name: 'Zeus', type: 'deity' };

  // Mock Firestore methods
  global.firebase.firestore().collection().doc().set
    .mockResolvedValue(undefined);

  await saveEntity(mockEntity);

  expect(global.firebase.firestore().collection).toHaveBeenCalledWith('entities');
});
```

### Async Testing

```javascript
// Using async/await (preferred)
test('should load entity from Firebase', async () => {
  const mockData = { name: 'Zeus' };
  global.firebase.firestore().collection().doc().get
    .mockResolvedValue({ exists: true, data: () => mockData });

  const result = await loadEntity('zeus');

  expect(result.name).toBe('Zeus');
});

// Using promises
test('should load entity from Firebase', () => {
  const mockData = { name: 'Zeus' };
  global.firebase.firestore().collection().doc().get
    .mockResolvedValue({ exists: true, data: () => mockData });

  return loadEntity('zeus').then(result => {
    expect(result.name).toBe('Zeus');
  });
});

// Testing rejections
test('should handle Firebase errors', async () => {
  global.firebase.firestore().collection().doc().get
    .mockRejectedValue(new Error('Network error'));

  await expect(loadEntity('zeus')).rejects.toThrow('Network error');
});
```

### Testing DOM Manipulation

```javascript
test('should create entity card element', () => {
  const entity = { name: 'Zeus', type: 'deity' };
  const card = createEntityCard(entity);

  // Test element creation
  expect(card).toBeInstanceOf(HTMLElement);
  expect(card.classList.contains('entity-card')).toBe(true);

  // Test content
  expect(card.querySelector('.entity-name').textContent).toBe('Zeus');

  // Test attributes
  expect(card.getAttribute('data-entity-id')).toBe('zeus');

  // Test event listeners
  const button = card.querySelector('.view-details');
  const clickHandler = jest.fn();
  button.addEventListener('click', clickHandler);
  button.click();
  expect(clickHandler).toHaveBeenCalled();
});
```

## Test Categories

### 1. Unit Tests

Test individual components in isolation:

```javascript
// __tests__/components/entity-card.test.js
describe('EntityCard', () => {
  test('should render entity data correctly', () => {
    // Test single component
  });
});
```

### 2. Integration Tests

Test how components work together:

```javascript
// __tests__/integration/entity-crud.test.js
describe('Entity CRUD Operations', () => {
  test('should create, read, update, and delete entity', async () => {
    // Test full workflow
  });
});
```

### 3. Accessibility Tests

Test ARIA attributes and keyboard navigation:

```javascript
test('should have proper ARIA labels', () => {
  const button = document.querySelector('.theme-toggle');
  expect(button.getAttribute('aria-label')).toBeTruthy();
  expect(button.getAttribute('role')).toBe('button');
});

test('should be keyboard accessible', () => {
  const button = document.querySelector('.theme-toggle');
  const event = new KeyboardEvent('keydown', { key: 'Enter' });
  const handler = jest.fn();
  button.addEventListener('keydown', handler);
  button.dispatchEvent(event);
  expect(handler).toHaveBeenCalled();
});
```

### 4. Error Handling Tests

Test error scenarios:

```javascript
test('should display error message when API fails', async () => {
  global.fetch.mockRejectedValue(new Error('API Error'));

  const result = await fetchData();

  expect(result.error).toBe('API Error');
});

test('should gracefully handle missing data', () => {
  const result = renderEntity(null);
  expect(result).toBeNull();
});
```

### 5. Performance Tests

Test performance characteristics:

```javascript
test('should render large entity list efficiently', () => {
  const entities = Array.from({ length: 1000 }, (_, i) => ({
    id: `entity-${i}`,
    name: `Entity ${i}`
  }));

  const start = performance.now();
  renderEntityList(entities);
  const end = performance.now();

  expect(end - start).toBeLessThan(1000); // Should complete in < 1 second
});
```

## Best Practices

### 1. One Assertion Per Test (When Possible)

```javascript
// Good: Focused test
test('should set theme to dark', () => {
  setTheme('dark');
  expect(document.body.classList.contains('theme-dark')).toBe(true);
});

test('should save theme preference', () => {
  setTheme('dark');
  expect(localStorage.getItem('theme')).toBe('dark');
});

// Acceptable: Related assertions
test('should initialize theme from localStorage', () => {
  localStorage.setItem('theme', 'dark');
  initTheme();
  expect(document.body.classList.contains('theme-dark')).toBe(true);
  expect(getTheme()).toBe('dark');
});
```

### 2. Use Descriptive Test Names

```javascript
// Good
test('should display loading spinner while fetching entities', () => {});

// Bad
test('loading test', () => {});
```

### 3. Clean Up After Tests

```javascript
afterEach(() => {
  // Clear mocks
  jest.clearAllMocks();

  // Clean up DOM
  document.body.innerHTML = '';

  // Clear localStorage
  localStorage.clear();

  // Reset global state
  window.currentUser = null;
});
```

### 4. Mock External Dependencies

```javascript
// Always mock external services
jest.mock('../js/firebase-config.js');
jest.mock('../js/analytics.js');

// Don't test external libraries
// Test YOUR code that uses them
```

### 5. Test Both Happy Path and Error Cases

```javascript
describe('fetchEntity', () => {
  test('should return entity when found', async () => {
    // Happy path
  });

  test('should return null when not found', async () => {
    // Error case 1
  });

  test('should throw error when Firebase is unavailable', async () => {
    // Error case 2
  });
});
```

### 6. Keep Tests Fast

```javascript
// Fast: Use mocks
test('should fetch entity', async () => {
  mockFirestore.get.mockResolvedValue({ data: mockEntity });
  // Fast test
});

// Slow: Real database calls (avoid in unit tests)
test('should fetch entity', async () => {
  const entity = await realFirestore.collection('entities').doc('zeus').get();
  // Slow test - save for integration tests
});
```

### 7. Use Test Fixtures

```javascript
// test-fixtures.js
export const mockEntities = {
  zeus: {
    id: 'zeus',
    name: 'Zeus',
    type: 'deity',
    mythology: 'greek'
  },
  // ... more fixtures
};

// In test file
import { mockEntities } from './test-fixtures.js';

test('should render Zeus', () => {
  render(mockEntities.zeus);
  // ...
});
```

## Debugging

### Debug Specific Test

```bash
# Run one test file
npm test -- entity-renderer.test.js

# Run specific test by name
npm test -- -t "should render entity card"

# Run in watch mode
npm run test:watch
```

### Use Node Debugger

```bash
# Start debugger
npm run test:debug

# Then open chrome://inspect in Chrome
# Click "Open dedicated DevTools for Node"
# Set breakpoints and debug
```

### Console Logging

```javascript
test('should process data', () => {
  const data = processData(input);
  console.log('Processed data:', data); // Will show in test output
  expect(data).toBeDefined();
});
```

### Only Run One Test

```javascript
// Use .only to focus on one test
test.only('should do something', () => {
  // This is the only test that will run
});

// Or with describe
describe.only('EntityRenderer', () => {
  // Only tests in this block will run
});
```

### Skip Tests

```javascript
// Temporarily skip a test
test.skip('should do something', () => {
  // This test won't run
});

// Or with describe
describe.skip('EntityRenderer', () => {
  // No tests in this block will run
});
```

## Coverage Reports

### Generate Coverage

```bash
npm run test:coverage
```

### View HTML Report

```bash
# On macOS/Linux
open coverage/lcov-report/index.html

# On Windows
start coverage/lcov-report/index.html

# Or use npm script
npm run coverage:open
```

### Understanding Coverage Metrics

- **Statements**: Percentage of code statements executed
- **Branches**: Percentage of if/else branches taken
- **Functions**: Percentage of functions called
- **Lines**: Percentage of lines executed

### Coverage Thresholds

Current thresholds (from jest.config.js):

```javascript
coverageThreshold: {
  global: {
    branches: 80,
    functions: 85,
    lines: 80,
    statements: 80
  }
}
```

### Improving Coverage

1. Run coverage report: `npm run test:coverage`
2. Open HTML report: `npm run coverage:open`
3. Click on files with low coverage
4. Add tests for uncovered lines (highlighted in red)
5. Focus on critical paths first

## CI/CD Integration

Tests run automatically in GitHub Actions on:
- Push to main/develop branches
- Pull requests to main/develop
- Daily at 2 AM UTC

### CI Test Command

```bash
npm run test:ci
```

This runs tests with:
- `--ci` flag for CI environment optimizations
- `--coverage` for coverage reporting
- `--maxWorkers=2` for consistent results

### Viewing CI Results

1. Go to GitHub repository
2. Click "Actions" tab
3. Select latest workflow run
4. View test results and coverage

## Troubleshooting

### Tests Failing Locally But Passing in CI

- Clear Jest cache: `npx jest --clearCache`
- Delete node_modules and reinstall: `rm -rf node_modules && npm install`
- Check Node version matches CI: `node --version`

### Mock Not Working

```javascript
// Ensure mock is before imports
jest.mock('../js/module.js');
import { func } from '../js/module.js';

// Clear mocks between tests
beforeEach(() => {
  jest.clearAllMocks();
});
```

### Async Test Timeout

```javascript
// Increase timeout for slow tests
test('should handle slow operation', async () => {
  // Test code
}, 10000); // 10 second timeout

// Or globally in jest.config.js
testTimeout: 10000
```

### localStorage Not Defined

This is already mocked in setup.js. If you're seeing this error:

```javascript
// Ensure setup.js is loaded
// Check jest.config.js:
setupFilesAfterEnv: ['<rootDir>/__tests__/setup.js']
```

### Module Not Found

```javascript
// Check module path is correct
import { func } from '../js/module.js'; // ✓ Correct
import { func } from 'js/module.js';    // ✗ Wrong
```

## Quick Reference

### Common Jest Matchers

```javascript
// Equality
expect(value).toBe(42);                    // Strict equality (===)
expect(value).toEqual({ a: 1 });           // Deep equality
expect(value).toStrictEqual({ a: 1 });     // Strict deep equality

// Truthiness
expect(value).toBeTruthy();
expect(value).toBeFalsy();
expect(value).toBeDefined();
expect(value).toBeUndefined();
expect(value).toBeNull();

// Numbers
expect(value).toBeGreaterThan(3);
expect(value).toBeLessThan(5);
expect(value).toBeCloseTo(0.3);           // For floating point

// Strings
expect(value).toMatch(/pattern/);
expect(value).toContain('substring');

// Arrays
expect(array).toContain('item');
expect(array).toHaveLength(3);

// Objects
expect(obj).toHaveProperty('key');
expect(obj).toHaveProperty('key', 'value');

// Functions
expect(fn).toHaveBeenCalled();
expect(fn).toHaveBeenCalledWith(arg1, arg2);
expect(fn).toHaveBeenCalledTimes(2);
expect(() => fn()).toThrow();
expect(() => fn()).toThrow('error message');

// Async
await expect(promise).resolves.toBe(value);
await expect(promise).rejects.toThrow();
```

### Common Jest Functions

```javascript
// Test definition
test('description', () => {});
it('description', () => {});               // Alias for test

// Test grouping
describe('group', () => {});

// Lifecycle hooks
beforeAll(() => {});      // Once before all tests
beforeEach(() => {});     // Before each test
afterEach(() => {});      // After each test
afterAll(() => {});       // Once after all tests

// Test modifiers
test.only('description', () => {});  // Run only this test
test.skip('description', () => {});  // Skip this test
test.todo('description');            // Placeholder for future test

// Mocking
jest.fn();                           // Create mock function
jest.mock('./module');              // Mock entire module
jest.spyOn(obj, 'method');          // Spy on method
jest.clearAllMocks();               // Clear all mock data
jest.resetAllMocks();               // Reset all mocks
jest.restoreAllMocks();             // Restore original implementations
```

## Additional Resources

- [Jest Documentation](https://jestjs.io/)
- [Testing Library](https://testing-library.com/)
- [JavaScript Testing Best Practices](https://github.com/goldbergyoni/javascript-testing-best-practices)
- [Test Coverage Guide](./COVERAGE_REPORT.md)
- [Component Test Checklist](./COMPONENT_TEST_CHECKLIST.md)

---

**Last Updated**: 2025-12-28
**Project**: Eyes of Azrael
**Test Framework**: Jest 29.7.0
