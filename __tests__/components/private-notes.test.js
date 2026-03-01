/**
 * Private Notes Tests
 *
 * Tests for PrivateNotesService and PrivateNotesPanel.
 *
 * Test Categories:
 * 1. PrivateNotesService initialization (3 tests)
 * 2. Note creation & validation (5 tests)
 * 3. Note updates (4 tests)
 * 4. Note deletion (3 tests)
 * 5. Note retrieval & sorting (5 tests)
 * 6. Caching (3 tests)
 * 7. PrivateNotesPanel rendering (6 tests)
 * 8. Panel interactions (4 tests)
 * 9. Content formatting (3 tests)
 *
 * Total: 36 tests
 */

const fs = require('fs');
const path = require('path');

function createNotesFirebaseMock(mockNoteDocs = []) {
    const mockNotesQuery = {
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        get: jest.fn(() => Promise.resolve({
            forEach: (cb) => mockNoteDocs.forEach(doc => cb(doc)),
            docs: mockNoteDocs,
            size: mockNoteDocs.length
        })),
        add: jest.fn(() => Promise.resolve({ id: 'new-note-123' })),
        doc: jest.fn((id) => ({
            get: jest.fn(() => Promise.resolve({
                exists: true,
                id: id,
                data: () => ({
                    userId: 'user-123',
                    entityCollection: 'deities',
                    entityId: 'zeus',
                    content: 'Test note',
                    priority: 3,
                    order: 1,
                    status: 'active'
                })
            })),
            update: jest.fn(() => Promise.resolve()),
            delete: jest.fn(() => Promise.resolve())
        }))
    };

    const mockBatch = {
        update: jest.fn(),
        commit: jest.fn(() => Promise.resolve())
    };

    const firebase = {
        auth: jest.fn(() => ({
            currentUser: {
                uid: 'user-123',
                email: 'test@example.com',
                displayName: 'Test User',
                photoURL: null
            }
        })),
        firestore: Object.assign(jest.fn(() => ({
            collection: jest.fn(() => mockNotesQuery),
            batch: jest.fn(() => mockBatch)
        })), {
            FieldValue: {
                serverTimestamp: jest.fn(() => 'SERVER_TIMESTAMP'),
                increment: jest.fn(n => `INCREMENT_${n}`)
            }
        })
    };

    return { firebase, mockNotesQuery, mockBatch };
}

beforeEach(() => {
    document.body.innerHTML = '<div id="main-content"></div>';
    const mocks = createNotesFirebaseMock();
    global.firebase = mocks.firebase;
});


// ==========================================
// PrivateNotesService Tests
// ==========================================

describe('PrivateNotesService', () => {
    let service;

    beforeEach(() => {
        delete window.privateNotesService;
        const code = fs.readFileSync(
            path.join(__dirname, '../../js/services/private-notes-service.js'), 'utf8'
        );
        eval(code);
        service = window.privateNotesService;
    });

    describe('Initialization', () => {
        test('initializes with firebase', async () => {
            await service.init();
            expect(service.initialized).toBe(true);
        });

        test('only initializes once', async () => {
            await service.init();
            const db1 = service.db;
            await service.init();
            expect(service.db).toBe(db1);
        });

        test('requires authentication for operations', async () => {
            firebase.auth.mockReturnValue({ currentUser: null });
            await service.init();
            await expect(service.createNote({
                entityCollection: 'deities', entityId: 'zeus',
                content: 'Test note'
            })).rejects.toThrow('logged in');
        });
    });

    describe('Note creation & validation', () => {
        test('rejects empty content', async () => {
            await expect(service.createNote({
                entityCollection: 'deities', entityId: 'zeus',
                content: ''
            })).rejects.toThrow('empty');
        });

        test('rejects content exceeding 5000 characters', async () => {
            await expect(service.createNote({
                entityCollection: 'deities', entityId: 'zeus',
                content: 'x'.repeat(5001)
            })).rejects.toThrow('5000');
        });

        test('creates note successfully', async () => {
            await service.init();
            const result = await service.createNote({
                entityCollection: 'deities',
                entityId: 'zeus',
                entityName: 'Zeus',
                content: 'My private note about Zeus',
                priority: 4,
                color: '#ff7eb6'
            });
            expect(result.id).toBe('new-note-123');
            expect(result.content).toBe('My private note about Zeus');
        });

        test('clamps priority to 1-5 range', async () => {
            await service.init();
            const result = await service.createNote({
                entityCollection: 'deities', entityId: 'zeus',
                content: 'Note with extreme priority',
                priority: 10
            });
            expect(result.priority).toBe(5);
        });

        test('filters invalid tags', async () => {
            await service.init();
            const result = await service.createNote({
                entityCollection: 'deities', entityId: 'zeus',
                content: 'Note with tags',
                tags: ['valid', '', null, 123, 'also-valid']
            });
            expect(result.tags).toEqual(['valid', 'also-valid']);
        });
    });

    describe('Note updates', () => {
        test('only allows whitelisted fields', async () => {
            await service.init();

            // Spy on the actual update call
            const mockUpdate = jest.fn(() => Promise.resolve());
            service.db.collection = jest.fn(() => ({
                doc: jest.fn(() => ({
                    get: jest.fn(() => Promise.resolve({
                        exists: true,
                        data: () => ({ userId: 'user-123', entityCollection: 'deities', entityId: 'zeus' })
                    })),
                    update: mockUpdate
                }))
            }));

            await service.updateNote('note-1', {
                content: 'Updated content',
                userId: 'hacker-id',
                status: 'deleted'
            });

            expect(mockUpdate).toHaveBeenCalledWith(
                expect.objectContaining({ content: 'Updated content' })
            );
            expect(mockUpdate).toHaveBeenCalledWith(
                expect.not.objectContaining({ userId: 'hacker-id' })
            );
        });

        test('validates content on update', async () => {
            await service.init();
            await expect(service.updateNote('note-1', { content: '' }))
                .rejects.toThrow('empty');
        });

        test('validates content length on update', async () => {
            await service.init();
            await expect(service.updateNote('note-1', { content: 'x'.repeat(5001) }))
                .rejects.toThrow('5000');
        });

        test('clamps priority on update', async () => {
            await service.init();

            const mockUpdate = jest.fn(() => Promise.resolve());
            service.db.collection = jest.fn(() => ({
                doc: jest.fn(() => ({
                    get: jest.fn(() => Promise.resolve({
                        exists: true,
                        data: () => ({ userId: 'user-123', entityCollection: 'deities', entityId: 'zeus' })
                    })),
                    update: mockUpdate
                }))
            }));

            await service.updateNote('note-1', { priority: 0 });

            expect(mockUpdate).toHaveBeenCalledWith(
                expect.objectContaining({ priority: 1 })
            );
        });
    });

    describe('Note deletion', () => {
        test('deletes note successfully', async () => {
            await service.init();

            const mockDelete = jest.fn(() => Promise.resolve());
            service.db.collection = jest.fn(() => ({
                doc: jest.fn(() => ({
                    get: jest.fn(() => Promise.resolve({
                        exists: true,
                        data: () => ({ userId: 'user-123', entityCollection: 'deities', entityId: 'zeus' })
                    })),
                    delete: mockDelete
                }))
            }));

            await service.deleteNote('note-1');
            expect(mockDelete).toHaveBeenCalled();
        });

        test('rejects deletion of non-existent note', async () => {
            // Override mock for this test
            const db = firebase.firestore();
            const col = db.collection('private_notes');
            col.doc = jest.fn(() => ({
                get: jest.fn(() => Promise.resolve({ exists: false })),
                delete: jest.fn()
            }));

            await service.init();
            await expect(service.deleteNote('nonexistent')).rejects.toThrow('not found');
        });

        test('rejects deletion by non-owner', async () => {
            const db = firebase.firestore();
            const col = db.collection('private_notes');
            col.doc = jest.fn(() => ({
                get: jest.fn(() => Promise.resolve({
                    exists: true,
                    data: () => ({ userId: 'other-user' })
                })),
                delete: jest.fn()
            }));

            await service.init();
            await expect(service.deleteNote('note-1')).rejects.toThrow('Not authorized');
        });
    });

    describe('Note retrieval & sorting', () => {
        test('returns empty array when no notes', async () => {
            await service.init();
            const notes = await service.getNotes('deities', 'zeus');
            expect(notes).toEqual([]);
        });

        test('sorts by order (default)', async () => {
            // Setup mock with docs
            const mocks = createNotesFirebaseMock([
                { id: 'n2', data: () => ({ order: 2, priority: 1 }) },
                { id: 'n1', data: () => ({ order: 1, priority: 3 }) }
            ]);
            global.firebase = mocks.firebase;

            delete window.privateNotesService;
            eval(fs.readFileSync(path.join(__dirname, '../../js/services/private-notes-service.js'), 'utf8'));
            service = window.privateNotesService;

            await service.init();
            const notes = await service.getNotes('deities', 'zeus');
            expect(notes[0].id).toBe('n1');
            expect(notes[1].id).toBe('n2');
        });

        test('sorts by priority', async () => {
            const mocks = createNotesFirebaseMock([
                { id: 'n1', data: () => ({ order: 1, priority: 1 }) },
                { id: 'n2', data: () => ({ order: 2, priority: 5 }) }
            ]);
            global.firebase = mocks.firebase;

            delete window.privateNotesService;
            eval(fs.readFileSync(path.join(__dirname, '../../js/services/private-notes-service.js'), 'utf8'));
            service = window.privateNotesService;

            await service.init();
            const notes = await service.getNotes('deities', 'zeus', { sortBy: 'priority' });
            expect(notes[0].id).toBe('n2');
        });

        test('sorts by date', async () => {
            const older = new Date('2024-01-01');
            const newer = new Date('2024-06-01');

            const mocks = createNotesFirebaseMock([
                { id: 'n1', data: () => ({ order: 1, createdAt: older }) },
                { id: 'n2', data: () => ({ order: 2, createdAt: newer }) }
            ]);
            global.firebase = mocks.firebase;

            delete window.privateNotesService;
            eval(fs.readFileSync(path.join(__dirname, '../../js/services/private-notes-service.js'), 'utf8'));
            service = window.privateNotesService;

            await service.init();
            const notes = await service.getNotes('deities', 'zeus', { sortBy: 'date' });
            expect(notes[0].id).toBe('n2');
        });

        test('sorts by section', async () => {
            const mocks = createNotesFirebaseMock([
                { id: 'n1', data: () => ({ order: 1, sectionRef: 'behavior' }) },
                { id: 'n2', data: () => ({ order: 2, sectionRef: 'appearance' }) }
            ]);
            global.firebase = mocks.firebase;

            delete window.privateNotesService;
            eval(fs.readFileSync(path.join(__dirname, '../../js/services/private-notes-service.js'), 'utf8'));
            service = window.privateNotesService;

            await service.init();
            const notes = await service.getNotes('deities', 'zeus', { sortBy: 'section' });
            expect(notes[0].id).toBe('n2');
        });
    });

    describe('Caching', () => {
        test('caches note results', async () => {
            await service.init();
            await service.getNotes('deities', 'zeus');
            const db = firebase.firestore();
            const col = db.collection('private_notes');
            const callCount = col.get.mock.calls.length;

            await service.getNotes('deities', 'zeus');
            // Should use cache - no additional get call
            expect(col.get.mock.calls.length).toBe(callCount);
        });

        test('invalidates cache on note creation', async () => {
            await service.init();
            const cacheKey = 'user-123_deities_zeus_order_all_all';
            service.cache.set(cacheKey, { data: [], timestamp: Date.now() });

            await service.createNote({
                entityCollection: 'deities', entityId: 'zeus',
                content: 'New note here'
            });

            expect(service.cache.has(cacheKey)).toBe(false);
        });

        test('invalidates cache on note deletion', async () => {
            await service.init();
            const cacheKey = 'user-123_deities_zeus_order_all_all';
            service.cache.set(cacheKey, { data: [], timestamp: Date.now() });

            await service.deleteNote('note-1');

            expect(service.cache.has(cacheKey)).toBe(false);
        });
    });

    describe('Timestamp formatting', () => {
        test('formats timestamps correctly', () => {
            const date = new Date('2024-03-15');
            const result = service.formatTimestamp(date);
            expect(result).toContain('Mar');
            expect(result).toContain('15');
        });

        test('handles null timestamp', () => {
            expect(service.formatTimestamp(null)).toBe('');
        });

        test('handles Firestore timestamps', () => {
            const firestoreTimestamp = {
                toDate: () => new Date('2024-06-01')
            };
            const result = service.formatTimestamp(firestoreTimestamp);
            expect(result).toContain('Jun');
        });
    });
});


// ==========================================
// PrivateNotesPanel Tests
// ==========================================

describe('PrivateNotesPanel', () => {
    let panel;

    beforeEach(() => {
        delete window.privateNotesService;
        delete window.PrivateNotesPanel;

        const serviceCode = fs.readFileSync(
            path.join(__dirname, '../../js/services/private-notes-service.js'), 'utf8'
        );
        eval(serviceCode);

        const componentCode = fs.readFileSync(
            path.join(__dirname, '../../js/components/private-notes-panel.js'), 'utf8'
        );
        eval(componentCode);
    });

    describe('Rendering', () => {
        test('renders notes section with lock icon', () => {
            const container = document.createElement('div');
            document.body.appendChild(container);
            const entity = { id: 'zeus', type: 'deity', name: 'Zeus' };
            panel = new PrivateNotesPanel(container, entity);
            panel.render();
            expect(container.querySelector('.private-notes-lock')).toBeTruthy();
            expect(container.querySelector('.private-notes-title').textContent).toContain('My Notes');
        });

        test('shows "Only visible to you" badge', () => {
            const container = document.createElement('div');
            document.body.appendChild(container);
            const entity = { id: 'zeus', type: 'deity', name: 'Zeus' };
            panel = new PrivateNotesPanel(container, entity);
            panel.render();
            expect(container.querySelector('.private-notes-badge').textContent).toContain('Only visible to you');
        });

        test('starts collapsed', () => {
            const container = document.createElement('div');
            document.body.appendChild(container);
            const entity = { id: 'zeus', type: 'deity', name: 'Zeus' };
            panel = new PrivateNotesPanel(container, entity);
            panel.render();
            const body = document.getElementById('privateNotesBody');
            expect(body.style.display).toBe('none');
            expect(panel.isCollapsed).toBe(true);
        });

        test('hides section when not authenticated', async () => {
            firebase.auth.mockReturnValue({ currentUser: null });
            const container = document.createElement('div');
            const entity = { id: 'zeus', type: 'deity', name: 'Zeus' };
            panel = new PrivateNotesPanel(container, entity);
            await panel.init();
            expect(container.innerHTML).toBe('');
        });

        test('renders sort options', () => {
            const container = document.createElement('div');
            document.body.appendChild(container);
            const entity = { id: 'zeus', type: 'deity', name: 'Zeus' };
            panel = new PrivateNotesPanel(container, entity);
            panel.render();
            const sort = document.getElementById('privateNotesSort');
            expect(sort.options.length).toBe(4);
        });

        test('renders color swatches in form', () => {
            const container = document.createElement('div');
            document.body.appendChild(container);
            const entity = { id: 'zeus', type: 'deity', name: 'Zeus' };
            panel = new PrivateNotesPanel(container, entity);
            panel.render();
            const swatches = document.querySelectorAll('#privateNoteColor .color-swatch');
            expect(swatches.length).toBe(6);
        });
    });

    describe('Interactions', () => {
        test('toggle expands and collapses', () => {
            const container = document.createElement('div');
            document.body.appendChild(container);
            const entity = { id: 'zeus', type: 'deity', name: 'Zeus' };
            panel = new PrivateNotesPanel(container, entity);
            panel.render();

            const toggle = document.getElementById('privateNotesToggle');
            toggle.click();
            expect(panel.isCollapsed).toBe(false);
            expect(document.getElementById('privateNotesBody').style.display).toBe('');

            toggle.click();
            expect(panel.isCollapsed).toBe(true);
            expect(document.getElementById('privateNotesBody').style.display).toBe('none');
        });

        test('add button shows form', () => {
            const container = document.createElement('div');
            document.body.appendChild(container);
            const entity = { id: 'zeus', type: 'deity', name: 'Zeus' };
            panel = new PrivateNotesPanel(container, entity);
            panel.render();
            document.getElementById('privateNotesAddBtn').click();
            expect(document.getElementById('privateNotesForm').style.display).toBe('');
        });

        test('cancel button hides form', () => {
            const container = document.createElement('div');
            document.body.appendChild(container);
            const entity = { id: 'zeus', type: 'deity', name: 'Zeus' };
            panel = new PrivateNotesPanel(container, entity);
            panel.render();
            document.getElementById('privateNotesAddBtn').click();
            document.getElementById('privateNoteCancel').click();
            expect(document.getElementById('privateNotesForm').style.display).toBe('none');
        });

        test('priority stars toggle correctly', () => {
            const container = document.createElement('div');
            document.body.appendChild(container);
            const entity = { id: 'zeus', type: 'deity', name: 'Zeus' };
            panel = new PrivateNotesPanel(container, entity);
            panel.render();
            const stars = document.querySelectorAll('#privateNotePriority .priority-star');
            stars[4].click();
            const activeStars = document.querySelectorAll('#privateNotePriority .priority-star.active');
            expect(activeStars.length).toBe(5);
        });
    });

    describe('Content formatting', () => {
        test('escapes HTML in notes', () => {
            const container = document.createElement('div');
            panel = new PrivateNotesPanel(container, { id: 'test', type: 'deity' });
            const result = panel._formatContent('<img src=x onerror=alert(1)>');
            expect(result).not.toContain('<img');
        });

        test('renders bold and italic markdown', () => {
            const container = document.createElement('div');
            panel = new PrivateNotesPanel(container, { id: 'test', type: 'deity' });
            expect(panel._formatContent('**bold**')).toContain('<strong>bold</strong>');
            expect(panel._formatContent('*italic*')).toContain('<em>italic</em>');
        });

        test('handles empty content', () => {
            const container = document.createElement('div');
            panel = new PrivateNotesPanel(container, { id: 'test', type: 'deity' });
            expect(panel._formatContent('')).toBe('');
            expect(panel._formatContent(null)).toBe('');
        });
    });

    describe('Collection mapping', () => {
        test('maps entity types correctly', () => {
            const container = document.createElement('div');
            const p = new PrivateNotesPanel(container, { id: 'test', type: 'deity' });
            expect(p.collection).toBe('deities');
            const p2 = new PrivateNotesPanel(container, { id: 'test', type: 'creature' });
            expect(p2.collection).toBe('creatures');
        });
    });

    describe('Note card rendering', () => {
        test('shows empty state when no notes', () => {
            const container = document.createElement('div');
            document.body.appendChild(container);
            const entity = { id: 'zeus', type: 'deity', name: 'Zeus' };
            panel = new PrivateNotesPanel(container, entity);
            panel.render();
            panel.notes = [];
            panel._renderNotes();
            const listEl = document.getElementById('privateNotesList');
            expect(listEl.querySelector('.private-notes-empty')).toBeTruthy();
        });
    });
});
