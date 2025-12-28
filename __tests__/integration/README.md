# Integration Tests

This directory contains integration tests that verify how different components of the Eyes of Azrael application work together in realistic scenarios.

## Test Structure

### 1. Search to View Integration (`search-to-view.test.js`)
Tests complete user workflows from search through viewing entities.

**Coverage:**
- ✅ Search → Quick View → Favorite workflow
- ✅ Search → Compare → Export workflow
- ✅ Search → Edit → Refresh workflow
- ✅ URL sharing and navigation
- ✅ Error propagation across components
- ✅ Component lifecycle management

**Total Tests:** 18

### 2. State Management Integration (`state-management.test.js`)
Tests application-wide state management and persistence.

**Coverage:**
- ✅ Global state synchronization
- ✅ LocalStorage persistence
- ✅ URL state management
- ✅ Cross-component data sharing
- ✅ State recovery after errors
- ✅ State cleanup on logout

**Total Tests:** 22

### 3. Performance Testing (`performance.test.js`)
Tests application performance under realistic load conditions.

**Coverage:**
- ✅ Concurrent operations (10+ simultaneous searches)
- ✅ Large dataset handling (1000+ items)
- ✅ Memory management and cleanup
- ✅ Network resilience and retry logic
- ✅ Debouncing and throttling
- ✅ Cache effectiveness
- ✅ Pagination and infinite scroll
- ✅ Offline mode support

**Total Tests:** 18

### 4. Cross-Component Communication (`cross-component.test.js`)
Tests how components communicate through events and shared state.

**Coverage:**
- ✅ Theme changes across all components
- ✅ Entity updates refresh all views
- ✅ Modal interactions and stacking
- ✅ Event propagation and ordering
- ✅ Error isolation between components
- ✅ CRUD operations with event notifications

**Total Tests:** 15

## Running Integration Tests

### Run all integration tests:
```bash
npm test -- __tests__/integration
```

### Run specific test suite:
```bash
npm test -- __tests__/integration/search-to-view.test.js
npm test -- __tests__/integration/state-management.test.js
npm test -- __tests__/integration/performance.test.js
npm test -- __tests__/integration/cross-component.test.js
```

### Run with coverage:
```bash
npm test -- --coverage __tests__/integration
```

### Watch mode for development:
```bash
npm test -- --watch __tests__/integration
```

## Key Testing Patterns

### 1. Mock Component Architecture
Integration tests use lightweight mock components that simulate real component behavior without requiring the full implementation:

```javascript
class MockSearchView {
    constructor(db) {
        this.db = db;
        this.state = { query: '', results: [] };
    }

    async search(query) {
        // Simulate search operation
    }
}
```

### 2. Event-Driven Testing
Tests verify event propagation across components:

```javascript
eventBus.on('entity-updated', (data) => {
    // Verify all components receive update
});
```

### 3. State Verification
Tests ensure state remains consistent across operations:

```javascript
// Perform operations
await searchView.search('zeus');
await quickViewModal.open('zeus', 'deities');

// Verify all components have consistent state
expect(searchView.state.results[0].id).toBe('zeus');
expect(quickViewModal.currentEntity.id).toBe('zeus');
```

### 4. Performance Monitoring
Tests track performance metrics:

```javascript
const perfMonitor = new PerformanceMonitor();
const timer = perfMonitor.startTimer('search');

await searchEngine.search('query');

perfMonitor.endTimer(timer);
expect(timer.duration).toBeLessThan(200);
```

## Test Coverage Goals

| Test Suite | Current Coverage | Target |
|------------|------------------|--------|
| Search to View | 95% | 90%+ |
| State Management | 92% | 85%+ |
| Performance | 88% | 80%+ |
| Cross-Component | 94% | 90%+ |
| **Overall** | **92%** | **85%+** |

## Common Test Scenarios

### Complete User Workflows
1. User searches for entity
2. User views entity in quick view modal
3. User adds entity to favorites
4. Analytics tracks all actions

### State Persistence
1. User sets search filters
2. User navigates away
3. User returns to search
4. Filters are restored from localStorage/URL

### Error Recovery
1. Network request fails
2. Error is caught and logged
3. UI shows error message
4. User can retry operation
5. Other components remain functional

### Performance Under Load
1. Perform 10 concurrent searches
2. All searches complete successfully
3. Average response time < 200ms
4. 95th percentile < 300ms
5. No memory leaks

## Debugging Integration Tests

### Enable verbose logging:
```javascript
beforeEach(() => {
    global.DEBUG = true;
});
```

### Inspect component state:
```javascript
test('debugging example', () => {
    console.log('Search state:', searchView.state);
    console.log('Modal state:', quickViewModal);
});
```

### Use Jest's debugging tools:
```bash
node --inspect-brk node_modules/.bin/jest __tests__/integration
```

## Best Practices

1. **Test Real Workflows**: Integration tests should mirror actual user behavior
2. **Verify End-to-End**: Test complete flows from user action to final result
3. **Check Side Effects**: Verify all components update correctly
4. **Test Error Paths**: Include error scenarios in workflows
5. **Performance Matters**: Include realistic performance constraints
6. **Clean Up**: Always unmount components and clear state between tests

## Future Enhancements

### Planned Tests:
- [ ] WebSocket real-time updates
- [ ] Progressive Web App (PWA) features
- [ ] Service worker cache strategies
- [ ] Authentication flows
- [ ] Multi-tab synchronization
- [ ] Drag-and-drop interactions
- [ ] Keyboard navigation
- [ ] Accessibility (a11y) integration

### Recommended E2E Framework:
For full end-to-end testing in a real browser, consider:

**Playwright** (Recommended):
- Cross-browser testing
- Auto-wait for elements
- Network interception
- Parallel execution
- Video recording

```bash
npm install --save-dev @playwright/test
```

**Cypress** (Alternative):
- Great developer experience
- Time-travel debugging
- Real-time reloads
- Network stubbing

```bash
npm install --save-dev cypress
```

## Contributing

When adding new integration tests:

1. Follow the existing test structure
2. Use descriptive test names
3. Include setup and teardown
4. Add documentation to this README
5. Update coverage targets
6. Run all tests before committing

## Support

For questions or issues with integration tests:
- Review existing test examples
- Check Jest documentation
- Consult the main project README
- Open an issue on GitHub
