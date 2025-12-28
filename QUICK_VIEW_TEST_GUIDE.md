# Quick View Modal - Testing Quick Reference

## Quick Start

### Run Tests
```bash
# All quick view tests
npm test -- entity-quick-view

# With coverage
npm test -- entity-quick-view --coverage

# Watch mode
npm test -- entity-quick-view --watch

# Specific test
npm test -- -t "should open modal with entity ID"
```

## Test Structure

### Entity Quick View Modal Tests
📁 `__tests__/components/entity-quick-view-modal.test.js`

#### Test Categories (64 tests)
1. **Modal Lifecycle** (8) - Opening, closing, destroying
2. **Entity Display** (12) - Rendering entity information
3. **Related Entities** (10) - Loading and displaying relations
4. **Actions** (8) - User interaction buttons
5. **Event Delegation** (8) - Click and event handling
6. **Animations** (6) - Transitions and motion
7. **Keyboard Navigation** (7) - Accessibility
8. **Error Handling** (5) - Error states

### Entity Card Quick View Tests
📁 `__tests__/components/entity-card-quick-view.test.js`

#### Test Categories (60 tests)
1. **Initialization** (8) - Setup and ready state
2. **Click Handler Detection** (8) - Card click detection
3. **Data Attribute Extraction** (8) - Data parsing
4. **Modal Integration** (8) - Modal opening
5. **Card Enrichment** (8) - Dynamic card enhancement
6. **Event Handling** (8) - Event delegation
7. **Error Handling** (5) - Error recovery
8. **Integration** (7) - End-to-end flows

## Common Test Patterns

### Testing Modal Open
```javascript
test('should open modal', async () => {
    // Arrange
    const modal = new EntityQuickViewModal(mockDb);

    // Act
    await modal.open('entity-123', 'deities', 'greek');

    // Assert
    const modalElement = document.getElementById('quick-view-modal');
    expect(modalElement).toBeTruthy();
});
```

### Testing Click Events
```javascript
test('should handle card click', () => {
    // Arrange
    document.body.innerHTML = `
        <div class="entity-card"
             data-entity-id="zeus-123"
             data-collection="deities"
             data-mythology="greek">
        </div>
    `;

    // Act
    const card = document.querySelector('.entity-card');
    card.click();

    // Assert
    expect(card.dataset.entityId).toBe('zeus-123');
});
```

### Testing Async Operations
```javascript
test('should load entity data', async () => {
    // Arrange
    mockDb.collection.mockReturnValue({
        doc: jest.fn(() => ({
            get: jest.fn(() => Promise.resolve({
                exists: true,
                id: 'zeus-123',
                data: () => ({ name: 'Zeus' })
            }))
        }))
    });

    // Act
    await modal.open('zeus-123', 'deities', 'greek');

    // Assert
    expect(modal.currentEntity.name).toBe('Zeus');
});
```

### Testing Error States
```javascript
test('should handle errors', async () => {
    // Arrange
    mockDb.collection.mockReturnValue({
        doc: jest.fn(() => ({
            get: jest.fn(() => Promise.resolve({ exists: false }))
        }))
    });

    // Act
    try {
        await modal.open('missing-123', 'deities', 'greek');
    } catch (error) {
        // Error handled internally
    }

    // Assert
    const errorMessage = document.querySelector('.error-message');
    expect(errorMessage).toBeTruthy();
});
```

## Mock Setup Examples

### Firestore Mock
```javascript
const mockDb = {
    collection: jest.fn(() => ({
        doc: jest.fn(() => ({
            get: jest.fn(() => Promise.resolve({
                exists: true,
                id: 'entity-123',
                data: () => ({ name: 'Entity Name' })
            }))
        }))
    }))
};
```

### DOM Mock
```javascript
beforeEach(() => {
    document.body.innerHTML = '';
    global.requestAnimationFrame = jest.fn(cb => setTimeout(cb, 0));
});

afterEach(() => {
    const modals = document.querySelectorAll('.quick-view-overlay');
    modals.forEach(m => m.remove());
});
```

### Window Mock
```javascript
global.window = {
    location: { hash: '' },
    EyesOfAzrael: { db: mockDb },
    EntityQuickViewModal: jest.fn()
};
```

## Debugging Tests

### Enable Verbose Output
```bash
npm test -- entity-quick-view --verbose
```

### Run Single Test
```bash
npm test -- -t "exact test name"
```

### Debug Specific File
```bash
npm test -- __tests__/components/entity-quick-view-modal.test.js
```

### Check Coverage
```bash
npm test -- entity-quick-view --coverage --collectCoverageFrom="js/components/entity-quick-view-modal.js"
```

## Common Issues & Solutions

### Issue: "Cannot find module"
**Solution:** Check jest.config.js moduleNameMapper

### Issue: "Timeout exceeded"
**Solution:** Increase timeout in test or jest.config.js
```javascript
test('slow test', async () => {
    // ...
}, 10000); // 10 second timeout
```

### Issue: "Memory leak detected"
**Solution:** Clean up in afterEach
```javascript
afterEach(() => {
    jest.clearAllTimers();
    document.body.innerHTML = '';
});
```

### Issue: "Mock not working"
**Solution:** Clear mocks in beforeEach
```javascript
beforeEach(() => {
    jest.clearAllMocks();
});
```

## Test Maintenance

### Adding New Tests
1. Follow AAA pattern (Arrange, Act, Assert)
2. Use descriptive test names
3. Keep tests focused and isolated
4. Mock external dependencies
5. Clean up after each test

### Updating Tests
1. Run tests before changes
2. Update test to match new behavior
3. Verify all tests still pass
4. Check coverage remains high

### Removing Tests
1. Ensure functionality is covered elsewhere
2. Remove related mocks
3. Update coverage thresholds if needed

## CI/CD Integration

### GitHub Actions Example
```yaml
- name: Run Quick View Tests
  run: npm test -- entity-quick-view --ci --coverage
```

### Pre-commit Hook
```bash
#!/bin/sh
npm test -- entity-quick-view --passWithNoTests
```

## Performance Guidelines

- Keep individual tests under 50ms
- Mock all network calls
- Use fake timers for animations
- Avoid real DOM rendering when possible

## Coverage Requirements

Minimum coverage thresholds:
- **Statements:** 80%
- **Branches:** 80%
- **Functions:** 85%
- **Lines:** 80%

---

**Quick Reference Created by Test Agent 7**
Last Updated: 2025-12-28
