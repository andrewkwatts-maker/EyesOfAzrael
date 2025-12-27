# Eyes of Azrael Testing Guide

Comprehensive testing documentation for the Eyes of Azrael mythology platform.

---

## Table of Contents

1. [Overview](#overview)
2. [Quick Start](#quick-start)
3. [Test Structure](#test-structure)
4. [Running Tests](#running-tests)
5. [Writing Tests](#writing-tests)
6. [Mock System](#mock-system)
7. [Coverage Goals](#coverage-goals)
8. [CI/CD Integration](#cicd-integration)
9. [Best Practices](#best-practices)
10. [Troubleshooting](#troubleshooting)

---

## Overview

The Eyes of Azrael test suite provides comprehensive coverage of:

- **Unit Tests**: Individual component functionality
- **Integration Tests**: Feature workflows and interactions
- **E2E Tests**: Complete user journeys (planned)
- **Performance Tests**: Response times and optimization

### Test Framework

We use a custom lightweight test framework built specifically for browser environments:

- **Zero dependencies**: Runs in any modern browser
- **Jest-like syntax**: Familiar API (describe, it, expect)
- **Mock Firebase**: Complete Firebase simulation without network calls
- **Real-time results**: Visual test runner with live updates

---

## Quick Start

### Run All Tests (Browser)

1. Open `tests/test-runner.html` in your browser
2. Click "Run All Tests"
3. View results in real-time

### Run via URL

```
http://localhost:8080/tests/test-runner.html?autorun
```

### Run Specific Test Suites

- **Unit Tests Only**: Click "Run Unit Tests"
- **Integration Tests Only**: Click "Run Integration Tests"
- **Filter Results**: Use checkboxes to show/hide passed/failed/skipped tests

---

## Test Structure

```
tests/
├── test-framework.js           # Test framework & assertion library
├── test-runner.html            # Visual test runner
├── TESTING_GUIDE.md           # This file
│
├── mocks/
│   └── mock-firebase.js       # Complete Firebase mock
│
├── unit/
│   ├── firebase-cache-manager.test.js
│   ├── spa-navigation.test.js
│   ├── entity-renderer.test.js
│   └── performance-monitor.test.js
│
├── integration/
│   ├── login-flow.test.js
│   ├── mythology-browsing.test.js
│   ├── entity-detail.test.js
│   ├── search-functionality.test.js
│   └── comparison-features.test.js
│
└── e2e/
    ├── user-journey.test.js
    ├── cross-browser.test.js
    ├── mobile-experience.test.js
    └── offline-functionality.test.js
```

---

## Running Tests

### Browser (Recommended)

1. **Local Development Server**:
   ```bash
   # Using Python
   python -m http.server 8080

   # Using Node.js
   npx http-server -p 8080
   ```

2. **Navigate to**:
   ```
   http://localhost:8080/tests/test-runner.html
   ```

3. **Run tests using UI buttons**

### Command Line (Node.js)

```bash
# Install dependencies
npm install jsdom

# Run tests
node tests/run-tests.js
```

### CI/CD Pipeline

Tests automatically run on:
- Push to main branch
- Pull request creation
- Nightly builds

See [CI/CD Integration](#cicd-integration) for configuration.

---

## Writing Tests

### Basic Test Structure

```javascript
describe('Component Name', () => {
    let component;

    beforeEach(() => {
        // Setup before each test
        component = new Component();
    });

    afterEach(() => {
        // Cleanup after each test
        component.destroy();
    });

    describe('Feature Group', () => {
        it('should do something specific', () => {
            // Arrange
            const input = 'test';

            // Act
            const result = component.doSomething(input);

            // Assert
            expect(result).toBe('expected');
        });

        it('should handle errors', () => {
            expect(() => {
                component.doInvalidThing();
            }).toThrow('Expected error message');
        });
    });
});
```

### Assertions

```javascript
// Equality
expect(actual).toBe(expected);              // ===
expect(actual).toEqual(expected);           // Deep equal
expect(actual).not.toBe(expected);          // Negation

// Truthiness
expect(value).toBeTruthy();
expect(value).toBeFalsy();
expect(value).toBeNull();
expect(value).toBeUndefined();
expect(value).toBeDefined();

// Collections
expect(array).toContain(item);
expect(array).toHaveLength(3);

// Types
expect(obj).toBeInstanceOf(Constructor);
expect(obj).toHaveProperty('propertyName');

// Errors
expect(() => throwError()).toThrow();
expect(() => throwError()).toThrow('specific message');

// Promises
await expect(promise).toResolve();
await expect(promise).toReject();
```

### Async Tests

```javascript
it('should fetch data asynchronously', async () => {
    const data = await fetchData();
    expect(data).toBeDefined();
});

it('should handle async errors', async () => {
    try {
        await fetchInvalidData();
        throw new Error('Should have thrown');
    } catch (error) {
        expect(error.message).toContain('not found');
    }
});
```

### Using Mocks

```javascript
describe('Firebase Integration', () => {
    let mockDb;

    beforeEach(() => {
        mockDb = new MockFirestore();

        // Seed test data
        mockDb.seed('deities', {
            'zeus': {
                id: 'zeus',
                name: 'Zeus',
                mythology: 'greek'
            }
        });
    });

    it('should fetch deity from database', async () => {
        const doc = await mockDb.collection('deities').doc('zeus').get();
        expect(doc.exists).toBe(true);
        expect(doc.data().name).toBe('Zeus');
    });
});
```

---

## Mock System

### MockFirestore

Simulates Firestore database operations:

```javascript
const mockDb = new MockFirestore();

// Seed data
mockDb.seed('collection', {
    'doc-id': { field: 'value' }
});

// Query operations
const snapshot = await mockDb.collection('collection')
    .where('field', '==', 'value')
    .orderBy('importance', 'desc')
    .limit(10)
    .get();

// Document operations
const doc = await mockDb.collection('collection').doc('doc-id').get();
await doc.ref.set({ field: 'newValue' });
await doc.ref.update({ field: 'updated' });
await doc.ref.delete();

// Control query delay (default 50ms)
mockDb.queryDelay = 10; // Faster for tests
```

### MockAuth

Simulates Firebase Authentication:

```javascript
const mockAuth = new MockAuth();

// Sign in
const result = await mockAuth.signInWithEmailAndPassword(
    'user@example.com',
    'password123'
);

// Create user
await mockAuth.createUserWithEmailAndPassword(email, password);

// Sign out
await mockAuth.signOut();

// Auth state listener
mockAuth.onAuthStateChanged((user) => {
    console.log('User:', user);
});

// Mock user directly
mockAuth.mockUser({
    uid: 'test-user',
    email: 'test@example.com'
});

// Control sign-in delay
mockAuth.signInDelay = 50; // milliseconds
```

### MockStorage

Simulates Firebase Storage:

```javascript
const mockStorage = new MockStorage();

// Upload file
const ref = mockStorage.ref('path/to/file.jpg');
await ref.put(fileData);

// Get download URL
const url = await ref.getDownloadURL();

// Delete file
await ref.delete();

// Control upload delay
mockStorage.uploadDelay = 100; // milliseconds
```

---

## Coverage Goals

### Minimum Coverage Requirements

| Category | Target | Current |
|----------|--------|---------|
| Unit Tests | 80% | 75% |
| Integration Tests | 70% | 60% |
| Critical Paths | 100% | 95% |
| Overall | 75% | 70% |

### Critical Paths (100% Required)

1. **Authentication Flow**
   - Login/logout
   - User registration
   - Session persistence

2. **Data Loading**
   - Firebase queries
   - Cache hits/misses
   - Error handling

3. **Entity Rendering**
   - Deity pages
   - Related entities
   - Mythology styling

4. **Navigation**
   - Route matching
   - SPA transitions
   - Auth guards

---

## CI/CD Integration

### GitHub Actions

Create `.github/workflows/test.yml`:

```yaml
name: Test Suite

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
    - uses: actions/checkout@v2

    - name: Setup Node.js
      uses: actions/setup-node@v2
      with:
        node-version: '18'

    - name: Install dependencies
      run: npm install

    - name: Run tests
      run: npm test

    - name: Upload coverage
      uses: codecov/codecov-action@v2
      with:
        files: ./coverage/lcov.info
```

### Pre-commit Hook

Add to `.git/hooks/pre-commit`:

```bash
#!/bin/bash
npm test
if [ $? -ne 0 ]; then
    echo "Tests failed! Commit aborted."
    exit 1
fi
```

---

## Best Practices

### 1. Test Organization

- **One concept per test**: Each test should validate one specific behavior
- **Clear descriptions**: Use descriptive test names
- **Group related tests**: Use `describe` blocks effectively

### 2. Setup and Teardown

- **Use beforeEach/afterEach**: Reset state between tests
- **Clean up resources**: Remove DOM elements, clear timers
- **Isolate tests**: Each test should run independently

### 3. Async Testing

- **Always use async/await**: For promises
- **Don't forget to await**: Common source of flaky tests
- **Set timeouts appropriately**: For slow operations

### 4. Mock Data

- **Use realistic data**: Similar to production
- **Keep it minimal**: Only what's needed for test
- **Reuse fixtures**: Create shared test data

### 5. Error Testing

- **Test happy path AND error path**: Don't just test success
- **Verify error messages**: Ensure correct errors
- **Test edge cases**: Null, undefined, empty arrays

---

## Troubleshooting

### Common Issues

#### Tests Timeout

Increase timeout for slow operations in test framework settings.

#### Flaky Tests

- Check for race conditions
- Verify cleanup in afterEach
- Ensure test isolation

#### Mock Not Working

Ensure Firebase global is set before creating components.

#### DOM Not Ready

Create DOM elements in beforeEach, clean up in afterEach.

---

## Resources

- [Test Framework Documentation](tests/test-framework.js)
- [Mock Firebase Documentation](tests/mocks/mock-firebase.js)
- [Example Tests](tests/unit/)

---

**Last Updated**: December 2024
**Version**: 1.0.0
**Maintainer**: Eyes of Azrael Team
