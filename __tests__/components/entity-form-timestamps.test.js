/**
 * Entity Form Timestamp Tests
 *
 * Regression tests for the "string where a Timestamp is required" bug
 * (docs/PLAN-MULTIDOMAIN.md section 7, item 3).
 *
 * collectFormData() used to set `data.updatedAt = new Date().toISOString()`.
 * The static+delta merge finds changed documents with
 * where('updatedAt', '>', <bake time>), which compares against a Firestore
 * Timestamp. A string field never matches that inequality, so every document
 * saved through this form was permanently invisible to the delta layer.
 *
 * Test Categories:
 * 1. collectFormData metadata (5 tests)
 * 2. Save path through the CRUD manager (3 tests)
 * 3. Draft persistence (2 tests)
 *
 * Total: 10 tests
 */

const EntityForm = require('../../js/components/entity-form');

const SERVER_TIMESTAMP = { __sentinel: 'serverTimestamp' };

function createCrudManagerMock() {
    return {
        read: jest.fn(() => Promise.resolve({ success: true, data: { name: 'Zeus' } })),
        create: jest.fn(() => Promise.resolve({ success: true, id: 'new-id' })),
        update: jest.fn(() => Promise.resolve({ success: true, id: 'zeus' })),
        delete: jest.fn(() => Promise.resolve({ success: true }))
    };
}

function installFirebaseFieldValue() {
    global.firebase = {
        auth: jest.fn(() => ({ currentUser: { uid: 'u1', email: 'u1@example.com' } })),
        firestore: Object.assign(jest.fn(() => ({ collection: jest.fn() })), {
            FieldValue: {
                serverTimestamp: jest.fn(() => SERVER_TIMESTAMP),
                increment: jest.fn((n) => ({ __increment: n }))
            }
        })
    };
}

/**
 * Render and mount a real form so collectFormData()/saveDraft() run against
 * actual DOM, the way they do in the browser.
 */
async function mountForm(options = {}) {
    const form = new EntityForm({
        crudManager: createCrudManagerMock(),
        collection: 'deities',
        onSuccess: jest.fn(),
        onCancel: jest.fn(),
        ...options
    });

    const container = document.createElement('div');
    container.innerHTML = await form.render();
    document.body.appendChild(container);
    form.initialize(container);

    return form;
}

describe('EntityForm timestamp metadata', () => {
    beforeEach(() => {
        document.body.innerHTML = '';
        localStorage.clear();
        installFirebaseFieldValue();
        jest.spyOn(console, 'warn').mockImplementation(() => {});
        jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    // ==========================================
    // 1. collectFormData metadata
    // ==========================================

    describe('collectFormData', () => {
        test('never sets updatedAt to a string', async () => {
            const form = await mountForm();

            const data = form.collectFormData();

            expect(typeof data.updatedAt).not.toBe('string');
        });

        test('sets updatedAt to a Firestore server timestamp sentinel', async () => {
            const form = await mountForm();

            const data = form.collectFormData();

            expect(data.updatedAt).toBe(SERVER_TIMESTAMP);
            expect(firebase.firestore.FieldValue.serverTimestamp).toHaveBeenCalled();
        });

        test('sets createdAt to a server timestamp on create', async () => {
            const form = await mountForm();

            const data = form.collectFormData();

            expect(form.isEditing).toBe(false);
            expect(data.createdAt).toBe(SERVER_TIMESTAMP);
            expect(typeof data.createdAt).not.toBe('string');
            expect(data.status).toBe('pending_review');
        });

        test('omits createdAt when editing an existing entity', async () => {
            const form = await mountForm({ entityId: 'zeus' });

            const data = form.collectFormData();

            expect(form.isEditing).toBe(true);
            expect(data.createdAt).toBeUndefined();
            expect(data.updatedAt).toBe(SERVER_TIMESTAMP);
        });

        test('falls back to a Date, not a string, when the Firebase SDK is absent', async () => {
            const form = await mountForm();
            delete global.firebase;

            const data = form.collectFormData();

            expect(typeof data.updatedAt).not.toBe('string');
            expect(data.updatedAt instanceof Date).toBe(true);
        });
    });

    // ==========================================
    // 2. Save path through the CRUD manager
    // ==========================================

    describe('save path', () => {
        test('create receives a non-string updatedAt', async () => {
            const form = await mountForm();
            jest.spyOn(form, 'validateCurrentStep').mockReturnValue(true);

            await form.handleSubmit({ preventDefault: jest.fn() });

            expect(form.crudManager.create).toHaveBeenCalledTimes(1);
            const [collection, payload] = form.crudManager.create.mock.calls[0];
            expect(collection).toBe('deities');
            expect(typeof payload.updatedAt).not.toBe('string');
            expect(payload.updatedAt).toBe(SERVER_TIMESTAMP);
        });

        test('update receives a non-string updatedAt', async () => {
            const form = await mountForm({ entityId: 'zeus' });
            jest.spyOn(form, 'validateCurrentStep').mockReturnValue(true);

            await form.handleSubmit({ preventDefault: jest.fn() });

            expect(form.crudManager.update).toHaveBeenCalledTimes(1);
            const [collection, id, payload] = form.crudManager.update.mock.calls[0];
            expect(collection).toBe('deities');
            expect(id).toBe('zeus');
            expect(typeof payload.updatedAt).not.toBe('string');
            expect(payload.updatedAt).toBe(SERVER_TIMESTAMP);
        });

        test('the submitted updatedAt is not an ISO date string', async () => {
            const form = await mountForm();
            jest.spyOn(form, 'validateCurrentStep').mockReturnValue(true);

            await form.handleSubmit({ preventDefault: jest.fn() });

            const payload = form.crudManager.create.mock.calls[0][1];
            // The original bug produced e.g. "2026-08-30T12:00:00.000Z", which
            // the delta query where('updatedAt','>',Date) can never match.
            expect(typeof payload.updatedAt).not.toBe('string');
            expect(String(payload.updatedAt)).not.toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:/);
        });
    });

    // ==========================================
    // 3. Draft persistence
    // ==========================================

    describe('saveDraft', () => {
        test('persists valid JSON without leaking timestamp sentinels', async () => {
            const form = await mountForm();

            form.saveDraft(false);

            const raw = localStorage.getItem('draft_deities_new');
            expect(raw).toBeTruthy();
            const parsed = JSON.parse(raw);
            expect(parsed.updatedAt).toBeUndefined();
            expect(parsed.createdAt).toBeUndefined();
        });

        test('still persists the user-entered field values', async () => {
            const form = await mountForm();
            const nameInput = form.form.querySelector('[name="name"]');
            expect(nameInput).toBeTruthy();
            nameInput.value = 'Zeus';

            form.saveDraft(false);

            const parsed = JSON.parse(localStorage.getItem('draft_deities_new'));
            expect(parsed.name).toBe('Zeus');
        });
    });
});
