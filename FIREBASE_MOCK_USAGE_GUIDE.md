# Firebase Mock Usage Guide

## Quick Start

Import the mock factory from test-utils:

```javascript
const { createMockFirestore } = require('../test-utils.js');
```

## Basic Usage

### 1. Create a Simple Mock

```javascript
const mockDb = createMockFirestore();

// Use in your tests
await mockDb.collection('deities').where('name', '==', 'Zeus').get();
```

### 2. Custom Data

```javascript
const mockDb = createMockFirestore({
    data: {
        name: 'Zeus',
        mythology: 'greek',
        type: 'deity',
        importance: 100
    }
});
```

### 3. Multiple Documents

```javascript
const zeus = {
    id: 'zeus',
    exists: true,
    data: () => ({ name: 'Zeus', mythology: 'greek' })
};

const hera = {
    id: 'hera',
    exists: true,
    data: () => ({ name: 'Hera', mythology: 'greek' })
};

const mockDb = createMockFirestore({
    docs: [zeus, hera]
});
```

## Advanced Usage

### Dynamic Mock Updates

Update mock behavior mid-test:

```javascript
// Setup
const mockDb = createMockFirestore();

// Update document data
mockDb._mockDoc.data = () => ({ name: 'Hera', type: 'deity' });
mockDb._mockDoc.id = 'hera';

// Update snapshot results
mockDb._mockSnapshot.docs = [newDoc1, newDoc2];
```

### Non-Existent Documents

```javascript
const mockDb = createMockFirestore({
    exists: false
});

const doc = await mockDb.collection('deities').doc('nonexistent').get();
console.log(doc.exists); // false
```

### Empty Query Results

```javascript
const mockDb = createMockFirestore({
    docs: []
});

const snapshot = await mockDb.collection('deities').where('name', '==', 'Unknown').get();
console.log(snapshot.empty); // true
console.log(snapshot.size); // 0
```

## Supported Operations

### Collection Methods
- `collection(path)` - Get collection reference
- `where(field, op, value)` - Filter documents (chainable)
- `orderBy(field, direction)` - Sort results (chainable)
- `limit(count)` - Limit results (chainable)
- `startAfter(doc)` - Pagination (chainable)
- `endBefore(doc)` - Pagination (chainable)
- `get()` - Execute query and get snapshot
- `onSnapshot(callback)` - Real-time listener

### Document Methods
- `doc(id)` - Get document reference
- `get()` - Fetch document
- `set(data)` - Set document data
- `update(data)` - Update document fields
- `delete()` - Delete document
- `onSnapshot(callback)` - Real-time listener

### Advanced Operations
- `runTransaction(callback)` - Execute transaction
- `batch()` - Batch write operations

## Common Patterns

### Pattern 1: Search Workflow

```javascript
const mockDb = createMockFirestore({
    data: { name: 'Zeus', mythology: 'greek' }
});

const snapshot = await mockDb
    .collection('deities')
    .where('mythology', '==', 'greek')
    .orderBy('importance', 'desc')
    .limit(10)
    .get();

snapshot.docs.forEach(doc => {
    console.log(doc.id, doc.data());
});
```

### Pattern 2: Document CRUD

```javascript
const mockDb = createMockFirestore();

// Create
await mockDb.collection('deities').add({ name: 'Zeus' });

// Read
const doc = await mockDb.collection('deities').doc('zeus').get();

// Update
await mockDb.collection('deities').doc('zeus').update({ importance: 100 });

// Delete
await mockDb.collection('deities').doc('zeus').delete();
```

### Pattern 3: Test Isolation

```javascript
describe('My Test Suite', () => {
    let mockDb;

    beforeEach(() => {
        // Create fresh mock for each test
        mockDb = createMockFirestore({
            data: { name: 'Zeus' }
        });
    });

    test('should query documents', async () => {
        const snapshot = await mockDb.collection('deities').get();
        expect(snapshot.docs.length).toBeGreaterThan(0);
    });
});
```

### Pattern 4: Error Handling

```javascript
const mockDb = createMockFirestore({
    exists: false
});

try {
    const doc = await mockDb.collection('deities').doc('unknown').get();
    if (!doc.exists) {
        throw new Error('Document not found');
    }
} catch (error) {
    expect(error.message).toBe('Document not found');
}
```

### Pattern 5: Multiple Entity Types

```javascript
beforeEach(() => {
    mockDb = createMockFirestore({
        docs: [
            { id: 'zeus', data: () => ({ name: 'Zeus', type: 'deity' }) },
            { id: 'achilles', data: () => ({ name: 'Achilles', type: 'hero' }) }
        ]
    });
});

test('should filter by type', async () => {
    const snapshot = await mockDb
        .collection('entities')
        .where('type', '==', 'deity')
        .get();

    expect(snapshot.docs[0].data().name).toBe('Zeus');
});
```

## Access Internal Mocks

For advanced test scenarios, you can access internal mock objects:

```javascript
const mockDb = createMockFirestore();

// Access mocks directly
mockDb._mockCollection  // Collection reference mock
mockDb._mockDocRef      // Document reference mock
mockDb._mockDoc         // Document snapshot mock
mockDb._mockSnapshot    // Query snapshot mock

// Example: Change document mid-test
mockDb._mockDoc.id = 'new-id';
mockDb._mockDoc.exists = false;
mockDb._mockDoc.data = () => ({ name: 'New Data' });
```

## Tips & Best Practices

1. **Create Fresh Mocks**: Always create a new mock in `beforeEach()` to avoid test pollution
2. **Use Options**: Customize the mock with options rather than modifying internals when possible
3. **Test Query Chains**: The mock supports full Firestore query chaining
4. **Check jest.fn() Calls**: All methods are Jest mocks, so you can verify they were called:
   ```javascript
   expect(mockDb.collection).toHaveBeenCalledWith('deities');
   expect(mockDb._mockCollection.where).toHaveBeenCalledWith('name', '==', 'Zeus');
   ```

5. **Reset Between Tests**: Use `jest.clearAllMocks()` in `beforeEach()` to reset call counts

## Troubleshooting

### "Cannot read properties of undefined"
- Ensure you're creating a new mock with `createMockFirestore()`
- Check that you're importing from the correct path: `require('../test-utils.js')`

### Mock Not Returning Expected Data
- Verify you're passing the right options to `createMockFirestore()`
- Check if you need to update `_mockDoc.data` or `_mockSnapshot.docs` mid-test

### Query Chain Not Working
- All query methods (`where`, `orderBy`, `limit`) return `this` for chaining
- Make sure to call `.get()` at the end to execute the query

### Test Isolation Issues
- Always create a fresh mock in `beforeEach()`
- Call `jest.clearAllMocks()` to reset call counts
- Avoid reusing mock instances across tests
