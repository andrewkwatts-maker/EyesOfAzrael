/**
 * Mock Firebase for Testing
 * Provides a complete mock of Firebase services without network calls
 */

class MockFirestore {
    constructor() {
        this.collections = new Map();
        this.queryDelay = 50; // Simulate network delay
    }

    collection(name) {
        if (!this.collections.has(name)) {
            this.collections.set(name, new Map());
        }
        return new MockCollectionReference(name, this);
    }

    // Helper to seed data
    seed(collectionName, data) {
        const collection = this.collection(collectionName);
        Object.entries(data).forEach(([id, doc]) => {
            this.collections.get(collectionName).set(id, doc);
        });
    }

    // Helper to clear data
    clear() {
        this.collections.clear();
    }
}

class MockCollectionReference {
    constructor(path, firestore) {
        this.path = path;
        this.firestore = firestore;
        this.whereFilters = [];
        this.orderByField = null;
        this.orderDirection = 'asc';
        this.limitCount = null;
        this.startAfterDoc = null;
    }

    doc(id) {
        return new MockDocumentReference(`${this.path}/${id}`, this.firestore);
    }

    where(field, operator, value) {
        const newRef = new MockCollectionReference(this.path, this.firestore);
        newRef.whereFilters = [...this.whereFilters, { field, operator, value }];
        newRef.orderByField = this.orderByField;
        newRef.orderDirection = this.orderDirection;
        newRef.limitCount = this.limitCount;
        return newRef;
    }

    orderBy(field, direction = 'asc') {
        const newRef = new MockCollectionReference(this.path, this.firestore);
        newRef.whereFilters = [...this.whereFilters];
        newRef.orderByField = field;
        newRef.orderDirection = direction;
        newRef.limitCount = this.limitCount;
        return newRef;
    }

    limit(count) {
        const newRef = new MockCollectionReference(this.path, this.firestore);
        newRef.whereFilters = [...this.whereFilters];
        newRef.orderByField = this.orderByField;
        newRef.orderDirection = this.orderDirection;
        newRef.limitCount = count;
        return newRef;
    }

    startAfter(doc) {
        const newRef = new MockCollectionReference(this.path, this.firestore);
        newRef.whereFilters = [...this.whereFilters];
        newRef.orderByField = this.orderByField;
        newRef.orderDirection = this.orderDirection;
        newRef.limitCount = this.limitCount;
        newRef.startAfterDoc = doc;
        return newRef;
    }

    async get() {
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, this.firestore.queryDelay));

        const collection = this.firestore.collections.get(this.path) || new Map();
        let docs = Array.from(collection.entries()).map(([id, data]) => ({
            id,
            data: () => data,
            exists: true,
            ref: this.doc(id)
        }));

        // Apply where filters
        docs = docs.filter(doc => {
            const data = doc.data();
            return this.whereFilters.every(filter => {
                const fieldValue = data[filter.field];
                switch (filter.operator) {
                    case '==': return fieldValue === filter.value;
                    case '!=': return fieldValue !== filter.value;
                    case '<': return fieldValue < filter.value;
                    case '<=': return fieldValue <= filter.value;
                    case '>': return fieldValue > filter.value;
                    case '>=': return fieldValue >= filter.value;
                    case 'array-contains': return Array.isArray(fieldValue) && fieldValue.includes(filter.value);
                    case 'in': return Array.isArray(filter.value) && filter.value.includes(fieldValue);
                    default: return true;
                }
            });
        });

        // Apply orderBy
        if (this.orderByField) {
            docs.sort((a, b) => {
                const aVal = a.data()[this.orderByField];
                const bVal = b.data()[this.orderByField];
                const comparison = aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
                return this.orderDirection === 'desc' ? -comparison : comparison;
            });
        }

        // Apply limit
        if (this.limitCount) {
            docs = docs.slice(0, this.limitCount);
        }

        return new MockQuerySnapshot(docs);
    }

    async add(data) {
        const id = 'mock_' + Math.random().toString(36).substr(2, 9);
        const docRef = this.doc(id);
        await docRef.set(data);
        return docRef;
    }
}

class MockDocumentReference {
    constructor(path, firestore) {
        this.path = path;
        this.firestore = firestore;
        this.id = path.split('/').pop();
        this.collectionPath = path.split('/').slice(0, -1).join('/');
    }

    async get() {
        await new Promise(resolve => setTimeout(resolve, this.firestore.queryDelay));

        const collection = this.firestore.collections.get(this.collectionPath);
        if (!collection || !collection.has(this.id)) {
            return new MockDocumentSnapshot(this.id, null, false, this);
        }

        const data = collection.get(this.id);
        return new MockDocumentSnapshot(this.id, data, true, this);
    }

    async set(data, options = {}) {
        await new Promise(resolve => setTimeout(resolve, this.firestore.queryDelay));

        let collection = this.firestore.collections.get(this.collectionPath);
        if (!collection) {
            collection = new Map();
            this.firestore.collections.set(this.collectionPath, collection);
        }

        if (options.merge && collection.has(this.id)) {
            const existing = collection.get(this.id);
            collection.set(this.id, { ...existing, ...data });
        } else {
            collection.set(this.id, data);
        }
    }

    async update(data) {
        await new Promise(resolve => setTimeout(resolve, this.firestore.queryDelay));

        const collection = this.firestore.collections.get(this.collectionPath);
        if (!collection || !collection.has(this.id)) {
            throw new Error('Document does not exist');
        }

        const existing = collection.get(this.id);
        collection.set(this.id, { ...existing, ...data });
    }

    async delete() {
        await new Promise(resolve => setTimeout(resolve, this.firestore.queryDelay));

        const collection = this.firestore.collections.get(this.collectionPath);
        if (collection) {
            collection.delete(this.id);
        }
    }

    collection(name) {
        return new MockCollectionReference(`${this.path}/${name}`, this.firestore);
    }
}

class MockDocumentSnapshot {
    constructor(id, data, exists, ref) {
        this.id = id;
        this._data = data;
        this.exists = exists;
        this.ref = ref;
    }

    data() {
        return this._data;
    }

    get(field) {
        return this._data?.[field];
    }
}

class MockQuerySnapshot {
    constructor(docs) {
        this.docs = docs;
        this.size = docs.length;
        this.empty = docs.length === 0;
    }

    forEach(callback) {
        this.docs.forEach(callback);
    }
}

class MockAuth {
    constructor() {
        this.currentUser = null;
        this.authStateListeners = [];
        this.signInDelay = 100;
    }

    async signInWithEmailAndPassword(email, password) {
        await new Promise(resolve => setTimeout(resolve, this.signInDelay));

        // Mock validation
        if (!email || !password) {
            throw new Error('auth/invalid-email');
        }

        if (password.length < 6) {
            throw new Error('auth/weak-password');
        }

        this.currentUser = {
            uid: 'mock_user_' + Math.random().toString(36).substr(2, 9),
            email,
            displayName: email.split('@')[0],
            emailVerified: true
        };

        this.notifyAuthStateListeners(this.currentUser);
        return { user: this.currentUser };
    }

    async createUserWithEmailAndPassword(email, password) {
        await new Promise(resolve => setTimeout(resolve, this.signInDelay));

        if (!email || !password) {
            throw new Error('auth/invalid-email');
        }

        if (password.length < 6) {
            throw new Error('auth/weak-password');
        }

        this.currentUser = {
            uid: 'mock_user_' + Math.random().toString(36).substr(2, 9),
            email,
            displayName: email.split('@')[0],
            emailVerified: false
        };

        this.notifyAuthStateListeners(this.currentUser);
        return { user: this.currentUser };
    }

    async signOut() {
        await new Promise(resolve => setTimeout(resolve, this.signInDelay));
        this.currentUser = null;
        this.notifyAuthStateListeners(null);
    }

    onAuthStateChanged(callback) {
        this.authStateListeners.push(callback);
        // Immediately call with current user
        setTimeout(() => callback(this.currentUser), 0);
        // Return unsubscribe function
        return () => {
            const index = this.authStateListeners.indexOf(callback);
            if (index > -1) {
                this.authStateListeners.splice(index, 1);
            }
        };
    }

    notifyAuthStateListeners(user) {
        this.authStateListeners.forEach(callback => callback(user));
    }

    // Helper to mock user
    mockUser(user) {
        this.currentUser = user;
        this.notifyAuthStateListeners(user);
    }
}

class MockStorage {
    constructor() {
        this.files = new Map();
        this.uploadDelay = 100;
    }

    ref(path) {
        return new MockStorageReference(path, this);
    }
}

class MockStorageReference {
    constructor(path, storage) {
        this.fullPath = path;
        this.storage = storage;
    }

    async put(data) {
        await new Promise(resolve => setTimeout(resolve, this.storage.uploadDelay));
        this.storage.files.set(this.fullPath, data);
        return new MockUploadTaskSnapshot(this);
    }

    async getDownloadURL() {
        await new Promise(resolve => setTimeout(resolve, 50));
        if (!this.storage.files.has(this.fullPath)) {
            throw new Error('storage/object-not-found');
        }
        return `https://mock-storage.com/${this.fullPath}`;
    }

    async delete() {
        await new Promise(resolve => setTimeout(resolve, 50));
        this.storage.files.delete(this.fullPath);
    }
}

class MockUploadTaskSnapshot {
    constructor(ref) {
        this.ref = ref;
        this.state = 'success';
    }
}

// Create mock Firebase instance
const mockFirebase = {
    firestore: () => new MockFirestore(),
    auth: () => new MockAuth(),
    storage: () => new MockStorage(),
    initializeApp: (config) => {
        console.log('[MockFirebase] App initialized with config:', config);
        return mockFirebase;
    }
};

// Export for use in tests
if (typeof window !== 'undefined') {
    window.mockFirebase = mockFirebase;
    window.MockFirestore = MockFirestore;
    window.MockAuth = MockAuth;
    window.MockStorage = MockStorage;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        mockFirebase,
        MockFirestore,
        MockAuth,
        MockStorage
    };
}
