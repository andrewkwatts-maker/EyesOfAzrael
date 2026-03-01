/**
 * Entity Posts Tests
 *
 * Tests for PostsService and EntityPostsComponent.
 *
 * Test Categories:
 * 1. PostsService initialization (3 tests)
 * 2. Post creation & validation (6 tests)
 * 3. Rate limiting (4 tests)
 * 4. Voting logic (5 tests)
 * 5. Timestamp formatting (5 tests)
 * 6. Listener management (2 tests)
 * 7. EntityPostsComponent rendering (5 tests)
 * 8. Content formatting (4 tests)
 *
 * Total: 34 tests
 */

const fs = require('fs');
const path = require('path');

function createPostsFirebaseMock() {
    const mockPostsSubcol = {
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        get: jest.fn(() => Promise.resolve({
            forEach: jest.fn(),
            docs: []
        })),
        add: jest.fn(() => Promise.resolve({ id: 'new-post-123' })),
        doc: jest.fn((id) => ({
            get: jest.fn(() => Promise.resolve({
                exists: true,
                id: id,
                data: () => ({ authorId: 'user-123', status: 'published', parentId: null })
            })),
            update: jest.fn(() => Promise.resolve()),
            delete: jest.fn(() => Promise.resolve()),
            collection: jest.fn(() => ({
                doc: jest.fn(() => ({
                    get: jest.fn(() => Promise.resolve({ exists: false, data: () => ({}) })),
                    set: jest.fn(() => Promise.resolve()),
                    delete: jest.fn(() => Promise.resolve())
                }))
            }))
        })),
        onSnapshot: jest.fn((cb) => {
            cb({ forEach: jest.fn() });
            return jest.fn();
        })
    };

    const mockEntityDoc = {
        get: jest.fn(() => Promise.resolve({ exists: true, data: () => ({ postCount: 5 }) })),
        set: jest.fn(() => Promise.resolve()),
        update: jest.fn(() => Promise.resolve()),
        collection: jest.fn(() => mockPostsSubcol)
    };

    const firebase = {
        auth: jest.fn(() => ({
            currentUser: {
                uid: 'user-123',
                email: 'test@example.com',
                displayName: 'Test User',
                photoURL: 'https://example.com/photo.jpg'
            }
        })),
        firestore: Object.assign(jest.fn(() => ({
            collection: jest.fn((name) => {
                if (name === 'entity_posts') {
                    return { doc: jest.fn(() => mockEntityDoc) };
                }
                return {
                    doc: jest.fn(() => ({
                        get: jest.fn(() => Promise.resolve({ exists: true, data: () => ({}) })),
                        update: jest.fn(() => Promise.resolve())
                    })),
                    add: jest.fn(() => Promise.resolve({ id: 'log-123' }))
                };
            })
        })), {
            FieldValue: {
                serverTimestamp: jest.fn(() => 'SERVER_TIMESTAMP'),
                increment: jest.fn(n => `INCREMENT_${n}`)
            }
        })
    };

    return { firebase, mockPostsSubcol, mockEntityDoc };
}

beforeEach(() => {
    document.body.innerHTML = '<div id="main-content"></div>';
    const mocks = createPostsFirebaseMock();
    global.firebase = mocks.firebase;
});


// ==========================================
// PostsService Tests
// ==========================================

describe('PostsService', () => {
    let service;

    beforeEach(() => {
        delete window.postsService;
        const code = fs.readFileSync(
            path.join(__dirname, '../../js/services/posts-service.js'), 'utf8'
        );
        eval(code);
        service = window.postsService;
    });

    describe('Initialization', () => {
        test('initializes with firebase', async () => {
            await service.init();
            expect(service.initialized).toBe(true);
            expect(service.db).toBeTruthy();
        });

        test('only initializes once', async () => {
            await service.init();
            const db1 = service.db;
            await service.init();
            expect(service.db).toBe(db1);
        });

        test('generates correct entity key', () => {
            expect(service._entityKey('deities', 'zeus')).toBe('deities_zeus');
            expect(service._entityKey('creatures', 'phoenix')).toBe('creatures_phoenix');
        });
    });

    describe('Post creation & validation', () => {
        test('rejects empty content', async () => {
            await expect(service.createPost({
                collection: 'deities', entityId: 'zeus', entityName: 'Zeus',
                content: ''
            })).rejects.toThrow();
        });

        test('rejects content shorter than minimum', async () => {
            await expect(service.createPost({
                collection: 'deities', entityId: 'zeus', entityName: 'Zeus',
                content: 'short'
            })).rejects.toThrow('at least 10');
        });

        test('rejects content exceeding maximum', async () => {
            const longContent = 'x'.repeat(5001);
            await expect(service.createPost({
                collection: 'deities', entityId: 'zeus', entityName: 'Zeus',
                content: longContent
            })).rejects.toThrow('cannot exceed 5000');
        });

        test('creates post successfully', async () => {
            await service.init();
            const result = await service.createPost({
                collection: 'deities', entityId: 'zeus', entityName: 'Zeus',
                content: 'This is a valid post'
            });
            expect(result.id).toBe('new-post-123');
            expect(result.content).toBe('This is a valid post');
        });

        test('requires authentication', async () => {
            firebase.auth.mockReturnValue({ currentUser: null });
            await expect(service.createPost({
                collection: 'deities', entityId: 'zeus', entityName: 'Zeus',
                content: 'Valid post content'
            })).rejects.toThrow('logged in');
        });

        test('trims whitespace', async () => {
            await service.init();
            const result = await service.createPost({
                collection: 'deities', entityId: 'zeus', entityName: 'Zeus',
                content: '   This is a valid post   '
            });
            expect(result.content).toBe('This is a valid post');
        });
    });

    describe('Rate limiting', () => {
        test('allows posts within limit', async () => {
            await service.init();
            expect(service._checkRateLimit()).toBe(true);
        });

        test('records rate limit entries', async () => {
            await service.init();
            service._recordRateLimit();
            expect(service.rateLimiter.get('user-123').length).toBe(1);
        });

        test('blocks when rate limit exceeded', async () => {
            await service.init();
            const entries = Array(15).fill(Date.now());
            service.rateLimiter.set('user-123', entries);
            expect(service._checkRateLimit()).toBe(false);
        });

        test('allows admin to bypass rate limit', async () => {
            // Override auth before init
            firebase.auth = jest.fn(() => ({
                currentUser: { uid: 'admin', email: 'andrewkwatts@gmail.com' }
            }));
            await service.init();
            service.rateLimiter.set('admin', Array(20).fill(Date.now()));
            expect(service._checkRateLimit()).toBe(true);
        });
    });

    describe('Voting logic', () => {
        test('creates new upvote', async () => {
            await service.init();
            const result = await service.vote('deities', 'zeus', 'post-1', 1);
            expect(result.userVote).toBe(1);
        });

        test('creates new downvote', async () => {
            await service.init();
            const result = await service.vote('deities', 'zeus', 'post-1', -1);
            expect(result.userVote).toBe(-1);
        });

        test('rejects invalid vote values', async () => {
            await service.init();
            await expect(service.vote('deities', 'zeus', 'post-1', 0)).rejects.toThrow('Invalid vote');
            await expect(service.vote('deities', 'zeus', 'post-1', 2)).rejects.toThrow('Invalid vote');
        });

        test('requires authentication for voting', async () => {
            firebase.auth.mockReturnValue({ currentUser: null });
            await service.init();
            await expect(service.vote('deities', 'zeus', 'post-1', 1)).rejects.toThrow('logged in');
        });

        test('getUserVote returns 0 when not logged in', async () => {
            firebase.auth.mockReturnValue({ currentUser: null });
            const vote = await service.getUserVote('deities', 'zeus', 'post-1');
            expect(vote).toBe(0);
        });
    });

    describe('Timestamp formatting', () => {
        test('formats recent timestamps as "just now"', () => {
            const now = new Date();
            expect(service.formatTimestamp(now)).toBe('just now');
        });

        test('formats minutes ago', () => {
            const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000);
            expect(service.formatTimestamp(fiveMinAgo)).toBe('5m ago');
        });

        test('formats hours ago', () => {
            const twoHrsAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
            expect(service.formatTimestamp(twoHrsAgo)).toBe('2h ago');
        });

        test('formats days ago', () => {
            const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
            expect(service.formatTimestamp(threeDaysAgo)).toBe('3d ago');
        });

        test('returns empty for null timestamp', () => {
            expect(service.formatTimestamp(null)).toBe('');
        });
    });

    describe('Listener management', () => {
        test('stops individual listener', () => {
            const unsubscribe = jest.fn();
            service.listeners.set('test-key', unsubscribe);
            service.stopListening('test-key');
            expect(unsubscribe).toHaveBeenCalled();
            expect(service.listeners.has('test-key')).toBe(false);
        });

        test('stops all listeners', () => {
            const unsub1 = jest.fn();
            const unsub2 = jest.fn();
            service.listeners.set('key1', unsub1);
            service.listeners.set('key2', unsub2);
            service.stopAllListeners();
            expect(unsub1).toHaveBeenCalled();
            expect(unsub2).toHaveBeenCalled();
            expect(service.listeners.size).toBe(0);
        });
    });
});


// ==========================================
// EntityPostsComponent Tests
// ==========================================

describe('EntityPostsComponent', () => {
    let component;

    beforeEach(() => {
        delete window.postsService;
        delete window.EntityPostsComponent;

        const serviceCode = fs.readFileSync(
            path.join(__dirname, '../../js/services/posts-service.js'), 'utf8'
        );
        eval(serviceCode);

        const componentCode = fs.readFileSync(
            path.join(__dirname, '../../js/components/entity-posts.js'), 'utf8'
        );
        eval(componentCode);
    });

    describe('Rendering', () => {
        test('renders discussion section with title', () => {
            const container = document.createElement('div');
            const entity = { id: 'zeus', type: 'deity', name: 'Zeus' };
            component = new EntityPostsComponent(container, entity);
            component.render();
            expect(container.querySelector('.entity-posts-title').textContent).toContain('Discussion');
        });

        test('shows compose form when authenticated', () => {
            const container = document.createElement('div');
            const entity = { id: 'zeus', type: 'deity', name: 'Zeus' };
            component = new EntityPostsComponent(container, entity);
            component.render();
            expect(container.querySelector('#entityPostsCompose')).toBeTruthy();
            expect(container.querySelector('.compose-user-name').textContent).toBe('Test User');
        });

        test('shows login prompt when not authenticated', () => {
            firebase.auth.mockReturnValue({ currentUser: null });
            const container = document.createElement('div');
            const entity = { id: 'zeus', type: 'deity', name: 'Zeus' };
            component = new EntityPostsComponent(container, entity);
            component.render();
            expect(container.querySelector('.entity-posts-login-prompt')).toBeTruthy();
            expect(container.querySelector('#entityPostsCompose')).toBeNull();
        });

        test('populates section filter options from entity', () => {
            const container = document.createElement('div');
            document.body.appendChild(container);
            const entity = {
                id: 'zeus', type: 'deity', name: 'Zeus',
                description: 'A god', appearance: 'Tall'
            };
            component = new EntityPostsComponent(container, entity);
            component.render();
            const filter = document.getElementById('entityPostsFilter');
            expect(filter.options.length).toBeGreaterThan(1);
        });

        test('renders sort options', () => {
            const container = document.createElement('div');
            document.body.appendChild(container);
            const entity = { id: 'zeus', type: 'deity', name: 'Zeus' };
            component = new EntityPostsComponent(container, entity);
            component.render();
            const sort = document.getElementById('entityPostsSort');
            expect(sort.options.length).toBe(3);
        });
    });

    describe('Content formatting', () => {
        test('escapes HTML in content', () => {
            const container = document.createElement('div');
            component = new EntityPostsComponent(container, { id: 'test', type: 'deity' });
            const result = component._formatContent('<script>alert("xss")</script>');
            expect(result).not.toContain('<script>');
            expect(result).toContain('&lt;script&gt;');
        });

        test('converts bold markdown', () => {
            const container = document.createElement('div');
            component = new EntityPostsComponent(container, { id: 'test', type: 'deity' });
            const result = component._formatContent('This is **bold** text');
            expect(result).toContain('<strong>bold</strong>');
        });

        test('converts italic markdown', () => {
            const container = document.createElement('div');
            component = new EntityPostsComponent(container, { id: 'test', type: 'deity' });
            const result = component._formatContent('This is *italic* text');
            expect(result).toContain('<em>italic</em>');
        });

        test('converts newlines to br tags', () => {
            const container = document.createElement('div');
            component = new EntityPostsComponent(container, { id: 'test', type: 'deity' });
            const result = component._formatContent('Line 1\nLine 2');
            expect(result).toContain('<br>');
        });
    });

    describe('Collection mapping', () => {
        test('maps entity types to collection names', () => {
            const container = document.createElement('div');
            const c = new EntityPostsComponent(container, { id: 'test', type: 'deity' });
            expect(c.collection).toBe('deities');
            const c2 = new EntityPostsComponent(container, { id: 'test', type: 'hero' });
            expect(c2.collection).toBe('heroes');
            const c3 = new EntityPostsComponent(container, { id: 'test', type: 'creature' });
            expect(c3.collection).toBe('creatures');
        });
    });
});
