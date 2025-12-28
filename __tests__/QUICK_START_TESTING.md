# Eyes of Azrael - Testing Quick Start

Get up and running with testing in 5 minutes!

## Installation

```bash
npm install
```

## Run Tests

```bash
# Run all tests
npm test

# Watch mode (for development)
npm run test:watch

# With coverage
npm run test:coverage
```

## View Results

```bash
# Generate coverage report
npm run coverage:report

# Open coverage in browser
npm run coverage:open

# Open metrics dashboard
npm run metrics:dashboard
```

## Write Your First Test

1. Create test file: `__tests__/components/MyComponent.test.js`

2. Write test using AAA pattern:

```javascript
describe('MyComponent', () => {
  test('should do something', () => {
    // Arrange - Set up test data
    const input = 'test';

    // Act - Perform action
    const result = myComponent.doSomething(input);

    // Assert - Verify result
    expect(result).toBe('expected');
  });
});
```

3. Run tests:

```bash
npm run test:watch
```

## Check Coverage

```bash
# Run tests with coverage
npm run test:coverage

# View detailed report
npm run coverage:open
```

## Resources

- [Full Testing Guide](./__tests__/TESTING_GUIDE.md)
- [Component Checklist](./__tests__/COMPONENT_TEST_CHECKLIST.md)
- [Metrics Dashboard](./__tests__/metrics-dashboard.html)

## Need Help?

See [TESTING_GUIDE.md](./TESTING_GUIDE.md) for:
- Detailed examples
- Mocking strategies
- Debugging tips
- Best practices
- Troubleshooting

---

**That's it! You're ready to start testing. Happy testing!**
