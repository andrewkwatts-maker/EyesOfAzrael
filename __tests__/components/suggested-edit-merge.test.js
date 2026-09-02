/**
 * Suggested Edit Merge Tests
 *
 * Regression tests for the "approved suggested edits are silently discarded"
 * bug (docs/PLAN-MULTIDOMAIN.md section 7, item 2).
 *
 * Approving a suggested edit used to update only the suggestedEdits document
 * and write an editHistory record. The entity itself was never written, so the
 * contribution was approved and then thrown away. Even once the entity write
 * exists it must stamp `updatedAt` with a Firestore server timestamp, because
 * the static+delta merge finds changed documents with
 * where('updatedAt', '>', <bake time>) — an unstamped document stays invisible
 * to the whole site until the next base export.
 *
 * Test Categories:
 * 1. Entity write on explicit merge (6 tests)
 * 2. Entity write on community auto-approve (3 tests)
 * 3. Failure atomicity (3 tests)
 * 4. onEditMerge callback compatibility (3 tests)
 *
 * Total: 15 tests
 */

const SuggestedEditDiff = require('../../js/components/suggested-edit-diff');

const SERVER_TIMESTAMP = { __sentinel: 'serverTimestamp' };

/**
 * Firestore double that records every write, keyed by collection, so tests can
 * assert *which* collection was written to rather than just that something was.
 */
function createFirestoreMock() {
    const writes = { updates: [], adds: [], sets: [] };
    const failCollections = {};

    const collection = jest.fn((name) => ({
        doc: jest.fn((id) => ({
            update: jest.fn((data) => {
                if (failCollections[name]) return Promise.reject(failCollections[name]);
                writes.updates.push({ collection: name, id, data });
                return Promise.resolve();
            }),
            set: jest.fn((data) => {
                if (failCollections[name]) return Promise.reject(failCollections[name]);
                writes.sets.push({ collection: name, id, data });
                return Promise.resolve();
            }),
            delete: jest.fn(() => Promise.resolve()),
            get: jest.fn(() => Promise.resolve({ exists: true, id, data: () => ({}) })),
            collection: jest.fn(() => ({
                doc: jest.fn(() => ({
                    set: jest.fn(() => Promise.resolve()),
                    delete: jest.fn(() => Promise.resolve())
                }))
            }))
        })),
        add: jest.fn((data) => {
            if (failCollections[name]) return Promise.reject(failCollections[name]);
            writes.adds.push({ collection: name, data });
            return Promise.resolve({ id: `${name}-generated-id` });
        }),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        get: jest.fn(() => Promise.resolve({ docs: [], forEach: jest.fn() }))
    }));

    return { writes, failCollections, db: { collection } };
}

function installFirebase(mock) {
    global.firebase = {
        auth: jest.fn(() => ({
            currentUser: { uid: 'mod-uid', email: 'mod@example.com', displayName: 'Moderator' }
        })),
        firestore: Object.assign(jest.fn(() => mock.db), {
            FieldValue: {
                serverTimestamp: jest.fn(() => SERVER_TIMESTAMP),
                increment: jest.fn((n) => ({ __increment: n }))
            }
        })
    };
}

function makeEdit(overrides = {}) {
    return {
        id: 'edit-1',
        entityId: 'zeus',
        entityCollection: 'deities',
        authorId: 'user-7',
        authorName: 'Contributor',
        authorPhoto: null,
        field: 'description',
        fieldLabel: 'Description',
        diff: {
            oldValue: 'King of the Gods',
            newValue: 'King of the Olympian gods and ruler of Mount Olympus'
        },
        summary: 'Expanded the description',
        status: 'pending',
        upvotes: 0,
        downvotes: 0,
        ...overrides
    };
}

/**
 * Build a component without triggering init()/render() — the merge paths under
 * test are pure data flow — then hand it a detached container so the DOM
 * refresh after a merge has something to query.
 */
function makeComponent(options = {}) {
    const component = new SuggestedEditDiff({
        entityId: 'zeus',
        entityType: 'deity',
        entityCollection: 'deities',
        userId: 'mod-uid',
        userName: 'Moderator',
        isModerator: true,
        ...options
    });

    component.options.container = document.createElement('div');
    return component;
}

describe('SuggestedEditDiff merge writes to the entity', () => {
    let mock;

    beforeEach(() => {
        document.body.innerHTML = '';
        mock = createFirestoreMock();
        installFirebase(mock);
        global.confirm = jest.fn(() => true);
        jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    // ==========================================
    // 1. Entity write on explicit merge
    // ==========================================

    describe('handleMerge', () => {
        test('writes the approved value to the target entity collection', async () => {
            const component = makeComponent();
            const edit = makeEdit();
            component.pendingEdits = [edit];

            await component.handleMerge('edit-1');

            const entityWrite = mock.writes.updates.find(w => w.collection === 'deities');
            expect(entityWrite).toBeDefined();
            expect(entityWrite.id).toBe('zeus');
            expect(entityWrite.data.description).toBe(edit.diff.newValue);
        });

        test('stamps updatedAt with a Firestore server timestamp, not a string', async () => {
            const component = makeComponent();
            component.pendingEdits = [makeEdit()];

            await component.handleMerge('edit-1');

            const entityWrite = mock.writes.updates.find(w => w.collection === 'deities');
            expect(entityWrite.data.updatedAt).toBe(SERVER_TIMESTAMP);
            expect(typeof entityWrite.data.updatedAt).not.toBe('string');
            expect(firebase.firestore.FieldValue.serverTimestamp).toHaveBeenCalled();
        });

        test('writes only the changed field, never a wholesale entity overwrite', async () => {
            const component = makeComponent();
            component.pendingEdits = [makeEdit()];

            await component.handleMerge('edit-1');

            const entityWrite = mock.writes.updates.find(w => w.collection === 'deities');
            const dataFields = Object.keys(entityWrite.data)
                .filter(k => !['updatedAt', 'lastModified', 'lastModifiedBy'].includes(k));

            expect(dataFields).toEqual(['description']);
            // A wholesale write would also carry unrelated fields.
            expect(entityWrite.data.name).toBeUndefined();
            expect(mock.writes.sets).toHaveLength(0);
        });

        test('still updates the suggestedEdits status', async () => {
            const component = makeComponent();
            component.pendingEdits = [makeEdit()];

            await component.handleMerge('edit-1');

            const statusWrite = mock.writes.updates.find(w => w.collection === 'suggestedEdits');
            expect(statusWrite).toBeDefined();
            expect(statusWrite.id).toBe('edit-1');
            expect(statusWrite.data.status).toBe('approved');
            expect(statusWrite.data.resolvedBy).toBe('Moderator');
        });

        test('still writes the editHistory record', async () => {
            const component = makeComponent();
            const edit = makeEdit();
            component.pendingEdits = [edit];

            await component.handleMerge('edit-1');

            const history = mock.writes.adds.find(w => w.collection === 'editHistory');
            expect(history).toBeDefined();
            expect(history.data).toMatchObject({
                entityId: 'zeus',
                entityCollection: 'deities',
                editId: 'edit-1',
                field: 'description',
                oldValue: edit.diff.oldValue,
                newValue: edit.diff.newValue,
                authorId: 'user-7',
                approvedBy: 'Moderator'
            });
        });

        test('does nothing when the moderator cancels the confirm prompt', async () => {
            global.confirm = jest.fn(() => false);
            const component = makeComponent();
            component.pendingEdits = [makeEdit()];

            await component.handleMerge('edit-1');

            expect(mock.writes.updates).toHaveLength(0);
            expect(mock.writes.adds).toHaveLength(0);
        });
    });

    // ==========================================
    // 2. Entity write on community auto-approve
    // ==========================================

    describe('handleAutoApprove', () => {
        test('writes the approved value to the entity', async () => {
            const component = makeComponent();
            const edit = makeEdit({ upvotes: 10 });

            await component.handleAutoApprove(edit);

            const entityWrite = mock.writes.updates.find(w => w.collection === 'deities');
            expect(entityWrite).toBeDefined();
            expect(entityWrite.data.description).toBe(edit.diff.newValue);
        });

        test('stamps updatedAt with a server timestamp', async () => {
            const component = makeComponent();

            await component.handleAutoApprove(makeEdit({ upvotes: 10 }));

            const entityWrite = mock.writes.updates.find(w => w.collection === 'deities');
            expect(entityWrite.data.updatedAt).toBe(SERVER_TIMESTAMP);
            expect(typeof entityWrite.data.updatedAt).not.toBe('string');
        });

        test('marks the suggestion approved after the entity lands', async () => {
            const component = makeComponent();
            const edit = makeEdit({ upvotes: 10 });

            await component.handleAutoApprove(edit);

            expect(edit.status).toBe('approved');
            const statusWrite = mock.writes.updates.find(w => w.collection === 'suggestedEdits');
            expect(statusWrite.data.status).toBe('approved');
        });
    });

    // ==========================================
    // 3. Failure atomicity
    // ==========================================

    describe('failure handling', () => {
        test('does not mark the suggestion approved when the entity write fails', async () => {
            mock.failCollections.deities = new Error('permission-denied');
            const component = makeComponent();
            const edit = makeEdit();
            component.pendingEdits = [edit];

            await component.handleMerge('edit-1');

            expect(edit.status).toBe('pending');
            expect(mock.writes.updates.find(w => w.collection === 'suggestedEdits')).toBeUndefined();
            expect(mock.writes.adds.find(w => w.collection === 'editHistory')).toBeUndefined();
        });

        test('auto-approve leaves the edit pending when the entity write fails', async () => {
            mock.failCollections.deities = new Error('permission-denied');
            const component = makeComponent();
            const edit = makeEdit({ upvotes: 10 });

            await component.handleAutoApprove(edit);

            expect(edit.status).toBe('pending');
            expect(mock.writes.updates.find(w => w.collection === 'suggestedEdits')).toBeUndefined();
        });

        test('refuses to approve when no entity target and no onEditMerge handler exist', async () => {
            const component = makeComponent({ entityId: null, entityCollection: null });
            const edit = makeEdit({ entityId: null, entityCollection: null });
            component.pendingEdits = [edit];

            await component.handleMerge('edit-1');

            expect(edit.status).toBe('pending');
            expect(mock.writes.updates).toHaveLength(0);
        });
    });

    // ==========================================
    // 4. onEditMerge callback compatibility
    // ==========================================

    describe('onEditMerge callback', () => {
        test('is still invoked with the approved edit', async () => {
            const onEditMerge = jest.fn();
            const component = makeComponent({ onEditMerge });
            component.pendingEdits = [makeEdit()];

            await component.handleMerge('edit-1');

            expect(onEditMerge).toHaveBeenCalledTimes(1);
            expect(onEditMerge.mock.calls[0][0]).toMatchObject({
                id: 'edit-1',
                status: 'approved'
            });
        });

        test('is not required for the entity write to happen', async () => {
            const component = makeComponent({ onEditMerge: null });
            component.pendingEdits = [makeEdit()];

            await component.handleMerge('edit-1');

            expect(mock.writes.updates.find(w => w.collection === 'deities')).toBeDefined();
        });

        test('a throwing callback does not undo the completed merge', async () => {
            const onEditMerge = jest.fn(() => { throw new Error('consumer blew up'); });
            const component = makeComponent({ onEditMerge });
            const edit = makeEdit();
            component.pendingEdits = [edit];

            await component.handleMerge('edit-1');

            expect(edit.status).toBe('approved');
            expect(mock.writes.updates.find(w => w.collection === 'deities')).toBeDefined();
        });
    });
});
