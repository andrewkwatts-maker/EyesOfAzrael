# Component Test Checklist

Use this checklist when adding tests for new components or reviewing existing test coverage.

## Pre-Testing Setup

- [ ] Component code is complete and functional
- [ ] Component documentation exists
- [ ] Test file created: `__tests__/components/ComponentName.test.js`
- [ ] Required test utilities imported
- [ ] Mock data created in `test-fixtures.js` (if needed)

---

## Unit Tests

### Initialization & Constructor

- [ ] Component initializes without errors
- [ ] Constructor accepts correct parameters
- [ ] Default values are set correctly
- [ ] Invalid constructor parameters are handled
- [ ] Component state is initialized properly

### Public Methods

For each public method:

- [ ] Method executes successfully with valid inputs
- [ ] Method returns expected output type
- [ ] Method handles invalid inputs gracefully
- [ ] Method throws appropriate errors for edge cases
- [ ] Method side effects are tested (DOM changes, state updates)
- [ ] Async methods resolve/reject correctly

### State Management

- [ ] Initial state is correct
- [ ] State updates work as expected
- [ ] State transitions are valid
- [ ] Invalid state changes are prevented
- [ ] State persistence works (if applicable)
- [ ] State reset functionality works

### Event Handling

- [ ] Event listeners are attached correctly
- [ ] Events trigger expected handlers
- [ ] Event handlers receive correct parameters
- [ ] Custom events are dispatched properly
- [ ] Event delegation works correctly
- [ ] Event listeners are cleaned up on destroy

### DOM Manipulation

- [ ] Elements are created correctly
- [ ] Elements are added to DOM properly
- [ ] Elements have correct attributes
- [ ] Elements have correct CSS classes
- [ ] Elements have correct content/text
- [ ] Elements are removed/cleaned up properly

### Data Validation

- [ ] Required fields are validated
- [ ] Optional fields are handled
- [ ] Data type validation works
- [ ] Format validation works (email, phone, etc.)
- [ ] Range validation works (min/max)
- [ ] Custom validation rules work

### Error Handling

- [ ] Null/undefined inputs are handled
- [ ] Empty values are handled
- [ ] Invalid data types are handled
- [ ] Network errors are handled (if applicable)
- [ ] API errors are handled (if applicable)
- [ ] User-friendly error messages are shown
- [ ] Errors are logged appropriately

### Edge Cases

- [ ] Empty strings/arrays/objects are handled
- [ ] Very large inputs are handled
- [ ] Special characters are handled
- [ ] Unicode/international text is handled
- [ ] Concurrent operations are handled
- [ ] Race conditions are prevented

### Cleanup & Destroy

- [ ] `destroy()` method removes event listeners
- [ ] `destroy()` method cleans up DOM elements
- [ ] `destroy()` method clears timers/intervals
- [ ] `destroy()` method releases resources
- [ ] No memory leaks after destroy
- [ ] Component can be re-initialized after destroy

---

## Integration Tests

### Component Interaction

- [ ] Component works with other components
- [ ] Data flows correctly between components
- [ ] Events propagate correctly
- [ ] Shared state is managed correctly
- [ ] Dependencies are initialized in correct order

### Data Flow

- [ ] Data is fetched correctly
- [ ] Data is transformed correctly
- [ ] Data is displayed correctly
- [ ] Data updates trigger UI updates
- [ ] Data persistence works

### API Integration

- [ ] API calls are made correctly
- [ ] API responses are handled
- [ ] API errors are handled
- [ ] Loading states are shown
- [ ] Retry logic works (if applicable)

---

## Accessibility Tests

### Keyboard Navigation

- [ ] All interactive elements are keyboard accessible
- [ ] Tab order is logical
- [ ] Enter/Space activate buttons/links
- [ ] Arrow keys work for navigation (if applicable)
- [ ] Escape key closes modals/menus (if applicable)
- [ ] Focus is visible and clear

### ARIA Attributes

- [ ] `role` attributes are correct
- [ ] `aria-label` is present where needed
- [ ] `aria-labelledby` is used correctly
- [ ] `aria-describedby` is used for descriptions
- [ ] `aria-live` regions are used for dynamic content
- [ ] `aria-hidden` is used appropriately
- [ ] `aria-expanded` is used for expandable elements
- [ ] `aria-selected` is used for selectable elements

### Focus Management

- [ ] Focus is set correctly on component mount
- [ ] Focus is trapped in modals (if applicable)
- [ ] Focus returns to trigger element on close
- [ ] Focus indicators are visible
- [ ] Focus order is logical

### Screen Reader Support

- [ ] All content is readable by screen readers
- [ ] Images have alt text
- [ ] Links have descriptive text
- [ ] Form fields have labels
- [ ] Error messages are announced
- [ ] Dynamic content updates are announced

### Color & Contrast

- [ ] Text has sufficient contrast
- [ ] Interactive elements are distinguishable
- [ ] Information is not conveyed by color alone
- [ ] Focus indicators have sufficient contrast

---

## Performance Tests

### Render Performance

- [ ] Initial render completes quickly (<100ms)
- [ ] Re-renders are optimized
- [ ] Large lists use virtualization
- [ ] Images are lazy-loaded
- [ ] Expensive calculations are memoized

### Memory Management

- [ ] No memory leaks detected
- [ ] Event listeners are cleaned up
- [ ] Intervals/timeouts are cleared
- [ ] DOM references are released
- [ ] Large data structures are garbage collected

### Optimization

- [ ] Debouncing is used for frequent events
- [ ] Throttling is used for scroll/resize
- [ ] Batch DOM updates are used
- [ ] Unnecessary re-renders are prevented
- [ ] Code splitting is used (if applicable)

---

## Browser Compatibility

- [ ] Works in Chrome (latest)
- [ ] Works in Firefox (latest)
- [ ] Works in Safari (latest)
- [ ] Works in Edge (latest)
- [ ] Graceful degradation for older browsers

---

## Mobile/Responsive

- [ ] Works on mobile devices
- [ ] Touch events work correctly
- [ ] Responsive layout adapts properly
- [ ] No horizontal scroll issues
- [ ] Text is readable on small screens

---

## Security

- [ ] XSS prevention is implemented
- [ ] User input is sanitized
- [ ] SQL injection is prevented (if applicable)
- [ ] CSRF protection is in place (if applicable)
- [ ] Sensitive data is not exposed
- [ ] Authentication is checked (if applicable)

---

## Coverage Goals

### Minimum Thresholds

- [ ] Statement coverage ≥90%
- [ ] Branch coverage ≥85%
- [ ] Function coverage ≥90%
- [ ] Line coverage ≥90%

### Coverage Analysis

- [ ] All public methods are tested
- [ ] All code paths are covered
- [ ] All error scenarios are tested
- [ ] All edge cases are tested

---

## Documentation

- [ ] Test descriptions are clear
- [ ] Complex tests have comments
- [ ] Test fixtures are documented
- [ ] Mock data is realistic
- [ ] Test coverage is documented

---

## Code Quality

- [ ] Tests follow AAA pattern
- [ ] Tests are independent
- [ ] Tests are repeatable
- [ ] Tests are fast (<100ms each)
- [ ] No console errors/warnings
- [ ] Linter passes with no warnings

---

## Example Test Structure

```javascript
describe('ComponentName', () => {
  // Setup
  let component;
  let container;

  beforeEach(() => {
    container = document.createElement('div');
    component = new ComponentName(container);
  });

  afterEach(() => {
    component.destroy();
    container.remove();
    jest.clearAllMocks();
  });

  // Initialization Tests
  describe('initialization', () => {
    test('should initialize with default options', () => {
      // Test
    });
  });

  // Method Tests
  describe('public methods', () => {
    describe('methodName()', () => {
      test('should do something with valid input', () => {
        // Test
      });

      test('should handle invalid input', () => {
        // Test
      });
    });
  });

  // Event Tests
  describe('event handling', () => {
    test('should handle click events', () => {
      // Test
    });
  });

  // Error Tests
  describe('error handling', () => {
    test('should handle errors gracefully', () => {
      // Test
    });
  });

  // Accessibility Tests
  describe('accessibility', () => {
    test('should be keyboard accessible', () => {
      // Test
    });

    test('should have correct ARIA attributes', () => {
      // Test
    });
  });

  // Performance Tests
  describe('performance', () => {
    test('should render quickly', () => {
      // Test
    });
  });
});
```

---

## Review Checklist

Before submitting:

- [ ] All tests pass locally
- [ ] Coverage meets thresholds
- [ ] No skipped/disabled tests (without good reason)
- [ ] No test warnings or errors
- [ ] Tests are well-organized
- [ ] Tests have clear descriptions
- [ ] Code is reviewed
- [ ] Documentation is updated

---

## Common Pitfalls to Avoid

1. **Don't test implementation details** - Test behavior, not internal structure
2. **Don't write brittle tests** - Tests should be resilient to refactoring
3. **Don't skip error cases** - Error handling is critical
4. **Don't forget cleanup** - Always clean up after tests
5. **Don't use real external services** - Always mock external dependencies
6. **Don't test third-party libraries** - Trust they're already tested
7. **Don't ignore accessibility** - A11y is not optional
8. **Don't have slow tests** - Keep tests fast (<100ms)

---

## Resources

- [Testing Guide](./TESTING_GUIDE.md)
- [Test Utils](./test-utils.js)
- [Test Fixtures](./test-fixtures.js)
- [Jest Documentation](https://jestjs.io/)
- [Testing Library](https://testing-library.com/)

---

**Last Updated**: 2025-12-28
**Version**: 1.0.0
