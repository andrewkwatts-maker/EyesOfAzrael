/**
 * Admin Inline Edit Tests
 *
 * Tests for AdminInlineEditPanel and AdminFieldEditIcons components.
 *
 * Test Categories:
 * 1. AdminInlineEditPanel lifecycle (6 tests)
 * 2. Editor rendering (6 tests)
 * 3. Value extraction (5 tests)
 * 4. Save flow (5 tests)
 * 5. AdminFieldEditIcons injection (6 tests)
 * 6. Field detection (5 tests)
 *
 * Total: 33 tests
 */

const fs = require('fs');
const path = require('path');

const MOCK_DOC_DATA = {
    name: 'Zeus',
    description: 'King of the Gods',
    appearance: 'Tall, bearded figure',
    keyMyths: [
        { title: 'Birth', description: 'Born to Rhea and Cronus', source: 'Theogony' }
    ],
    extendedContent: [
        { title: 'Legacy', content: 'Enduring influence on Western culture' }
    ],
    sources: [
        { source: 'Theogony', text: 'Hesiod account', reference: 'Line 453' }
    ],
    type: 'deity'
};

function createFirebaseMock() {
    const mockDocRef = {
        get: jest.fn(() => Promise.resolve({
            exists: true,
            id: 'zeus',
            data: () => ({ ...MOCK_DOC_DATA })
        })),
        update: jest.fn(() => Promise.resolve()),
        set: jest.fn(() => Promise.resolve())
    };

    const mockCollection = {
        doc: jest.fn(() => mockDocRef),
        add: jest.fn(() => Promise.resolve({ id: 'log-123' })),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        get: jest.fn(() => Promise.resolve({ docs: [], forEach: jest.fn() }))
    };

    return {
        mockDocRef,
        mockCollection,
        firebase: {
            auth: jest.fn(() => ({
                currentUser: {
                    uid: 'admin-uid',
                    email: 'andrewkwatts@gmail.com',
                    displayName: 'Admin'
                }
            })),
            firestore: Object.assign(jest.fn(() => ({
                collection: jest.fn(() => mockCollection)
            })), {
                FieldValue: {
                    serverTimestamp: jest.fn(() => 'SERVER_TIMESTAMP'),
                    increment: jest.fn(n => `INCREMENT_${n}`)
                }
            })
        }
    };
}

// Override firebase mock for these tests
beforeEach(() => {
    document.body.innerHTML = '<div id="main-content"></div>';
    document.body.className = '';
    const mocks = createFirebaseMock();
    global.firebase = mocks.firebase;
});


// ==========================================
// AdminInlineEditPanel Tests
// ==========================================

describe('AdminInlineEditPanel', () => {
    let panel;

    beforeEach(() => {
        // Clear previous instance so auto-init re-creates it
        delete window._adminEditPanel;
        delete window.AdminInlineEditPanel;

        const code = fs.readFileSync(
            path.join(__dirname, '../../js/components/admin-inline-edit-panel.js'), 'utf8'
        );
        eval(code);

        panel = window._adminEditPanel;
    });

    describe('Lifecycle', () => {
        test('creates panel DOM element on init', () => {
            const panelEl = document.getElementById('adminEditPanel');
            expect(panelEl).toBeTruthy();
            expect(panelEl.classList.contains('admin-edit-panel')).toBe(true);
        });

        test('starts inactive', () => {
            expect(panel.isActive).toBe(false);
        });

        test('opens and adds body class', async () => {
            await panel.open('deities', 'zeus', 'description', 'string', 'Zeus');
            expect(panel.isActive).toBe(true);
            expect(document.body.classList.contains('admin-edit-active')).toBe(true);
        });

        test('close removes body class and resets state', async () => {
            await panel.open('deities', 'zeus', 'description', 'string', 'Zeus');
            panel.close();
            expect(panel.isActive).toBe(false);
            expect(panel.currentField).toBeNull();
            expect(document.body.classList.contains('admin-edit-active')).toBe(false);
        });

        test('displays field label when opened', async () => {
            await panel.open('deities', 'zeus', 'description', 'string', 'Zeus');
            const label = document.getElementById('adminEditFieldLabel');
            expect(label.textContent).toBe('Description');
        });

        test('displays entity info when opened', async () => {
            await panel.open('deities', 'zeus', 'description', 'string', 'Zeus');
            const info = document.getElementById('adminEditEntityInfo');
            expect(info.textContent).toBe('Zeus (deities/zeus)');
        });
    });

    describe('Editor rendering', () => {
        test('renders textarea for string fields', async () => {
            await panel.open('deities', 'zeus', 'description', 'string', 'Zeus');
            const textarea = document.getElementById('adminEditTextarea');
            expect(textarea).toBeTruthy();
            expect(textarea.value).toBe('King of the Gods');
        });

        test('renders array editor for array fields', async () => {
            await panel.open('deities', 'zeus', 'description', 'array', 'Zeus');
            const arrayList = document.getElementById('adminEditArrayList');
            expect(arrayList).toBeTruthy();
        });

        test('renders keyMyths editor for keyMyths type', async () => {
            await panel.open('deities', 'zeus', 'keyMyths', 'keyMyths', 'Zeus');
            const mythsList = document.getElementById('adminEditKeyMythsList');
            expect(mythsList).toBeTruthy();
            expect(mythsList.querySelectorAll('.admin-edit-myth-item').length).toBe(1);
        });

        test('renders extended content editor', async () => {
            await panel.open('deities', 'zeus', 'extendedContent', 'extendedContent', 'Zeus');
            const list = document.getElementById('adminEditExtendedList');
            expect(list).toBeTruthy();
            expect(list.querySelectorAll('.admin-edit-extended-item').length).toBe(1);
        });

        test('renders sources editor', async () => {
            await panel.open('deities', 'zeus', 'sources', 'sources', 'Zeus');
            const list = document.getElementById('adminEditSourcesList');
            expect(list).toBeTruthy();
            expect(list.querySelectorAll('.admin-edit-source-item').length).toBe(1);
        });

        test('shows footer after loading field', async () => {
            await panel.open('deities', 'zeus', 'description', 'string', 'Zeus');
            const footer = document.getElementById('adminEditFooter');
            expect(footer.style.display).toBe('');
        });
    });

    describe('Value extraction', () => {
        test('extracts text value from textarea', async () => {
            await panel.open('deities', 'zeus', 'description', 'string', 'Zeus');
            const textarea = document.getElementById('adminEditTextarea');
            textarea.value = 'Updated description';
            expect(panel._getEditorValue()).toBe('Updated description');
        });

        test('extracts array items', async () => {
            await panel.open('deities', 'zeus', 'description', 'array', 'Zeus');
            const list = document.getElementById('adminEditArrayList');
            list.innerHTML = `
                <div class="admin-edit-array-item"><span class="admin-edit-array-item-text">Item 1</span></div>
                <div class="admin-edit-array-item"><span class="admin-edit-array-item-text">Item 2</span></div>
            `;
            const items = panel._getEditorValue();
            expect(items).toEqual(['Item 1', 'Item 2']);
        });

        test('extracts keyMyths data', async () => {
            await panel.open('deities', 'zeus', 'keyMyths', 'keyMyths', 'Zeus');
            const data = panel._getEditorValue();
            expect(data.length).toBe(1);
            expect(data[0].title).toBe('Birth');
        });

        test('filters empty keyMyths entries', async () => {
            await panel.open('deities', 'zeus', 'keyMyths', 'keyMyths', 'Zeus');
            const addBtn = document.getElementById('adminEditAddMyth');
            addBtn.click();
            const data = panel._getEditorValue();
            expect(data.length).toBe(1);
        });

        test('returns null when no field is loaded', () => {
            panel.currentField = null;
            expect(panel._getEditorValue()).toBeNull();
        });
    });

    describe('Save flow', () => {
        test('saves and updates status', async () => {
            await panel.open('deities', 'zeus', 'description', 'string', 'Zeus');
            const textarea = document.getElementById('adminEditTextarea');
            textarea.value = 'New description';
            panel.hasUnsavedChanges = true;

            await panel._save();

            expect(panel.hasUnsavedChanges).toBe(false);
            const status = document.getElementById('adminEditStatus');
            expect(status.textContent).toBe('Saved successfully');
        });

        test('handles save errors gracefully', async () => {
            await panel.open('deities', 'zeus', 'description', 'string', 'Zeus');
            panel.hasUnsavedChanges = true;

            // Override the db to throw on update
            panel.db.collection = jest.fn(() => ({
                doc: jest.fn(() => ({
                    update: jest.fn(() => Promise.reject(new Error('Permission denied')))
                }))
            }));

            await panel._save();

            const status = document.getElementById('adminEditStatus');
            expect(status.textContent).toContain('Permission denied');
        });

        test('does not save when no field is loaded', async () => {
            panel.currentField = null;
            await panel._save();
            // Should just return without error
            expect(panel.hasUnsavedChanges).toBe(false);
        });
    });

    describe('Utility methods', () => {
        test('formatFieldName converts camelCase', () => {
            expect(panel._formatFieldName('keyMyths')).toBe('Key Myths');
            expect(panel._formatFieldName('fullDescription')).toBe('Full Description');
            expect(panel._formatFieldName('description')).toBe('Description');
        });

        test('escapeHtml prevents XSS', () => {
            expect(panel._escapeHtml('<script>alert("xss")</script>')).toBe('&lt;script&gt;alert("xss")&lt;/script&gt;');
        });

        test('escapeAttr escapes quotes', () => {
            expect(panel._escapeAttr('He said "hello"')).toBe('He said &quot;hello&quot;');
        });

        test('getNestedValue handles dot notation', () => {
            expect(panel._getNestedValue({ a: { b: 'val' } }, 'a.b')).toBe('val');
            expect(panel._getNestedValue({ a: 'val' }, 'a')).toBe('val');
        });
    });
});


// ==========================================
// AdminFieldEditIcons Tests
// ==========================================

describe('AdminFieldEditIcons', () => {
    let icons;

    beforeEach(() => {
        // Clear previous instance
        delete window._adminFieldEditIcons;
        delete window.AdminFieldEditIcons;

        const code = fs.readFileSync(
            path.join(__dirname, '../../js/components/admin-field-edit-icon.js'), 'utf8'
        );
        eval(code);

        icons = window._adminFieldEditIcons;
    });

    describe('Injection', () => {
        test('inject adds pencil icons to container', () => {
            const container = document.createElement('div');
            container.innerHTML = '<section><h2>Appearance</h2><p>Tall figure</p></section>';
            document.body.appendChild(container);

            const entity = {
                id: 'zeus', type: 'deity', name: 'Zeus',
                appearance: 'Tall figure'
            };

            icons.isAdmin = true;
            icons.inject(container, entity);

            const editIcons = container.querySelectorAll('.admin-field-edit-icon');
            expect(editIcons.length).toBeGreaterThan(0);
        });

        test('icons have correct data attributes', () => {
            const container = document.createElement('div');
            container.innerHTML = '<section><h2>Appearance</h2><p>Tall</p></section>';
            document.body.appendChild(container);

            const entity = {
                id: 'zeus', type: 'deity', name: 'Zeus',
                appearance: 'Tall'
            };

            icons.isAdmin = true;
            icons.inject(container, entity);

            const icon = container.querySelector('.admin-field-edit-icon');
            expect(icon).toBeTruthy();
            expect(icon.dataset.fieldName).toBe('appearance');
            expect(icon.dataset.collection).toBe('deities');
            expect(icon.dataset.entityId).toBe('zeus');
        });

        test('icons injected regardless of admin status (CSS controls visibility)', () => {
            const container = document.createElement('div');
            container.innerHTML = '<section><h2>Appearance</h2></section>';

            const entity = {
                id: 'zeus', type: 'deity', name: 'Zeus',
                appearance: 'Tall'
            };

            icons.isAdmin = false;
            icons.inject(container, entity);

            // Icons are always injected — CSS body:not(.is-admin) hides them
            const editIcons = container.querySelectorAll('.admin-field-edit-icon');
            expect(editIcons.length).toBeGreaterThan(0);
        });

        test('does not duplicate icons on re-injection', () => {
            const container = document.createElement('div');
            container.innerHTML = '<section><h2>Appearance</h2></section>';
            document.body.appendChild(container);

            const entity = {
                id: 'zeus', type: 'deity', name: 'Zeus',
                appearance: 'Tall'
            };

            icons.isAdmin = true;
            icons.inject(container, entity);
            icons.inject(container, entity);

            const section = container.querySelector('section');
            const editIcons = section.querySelectorAll('.admin-field-edit-icon');
            expect(editIcons.length).toBe(1);
        });

        test('handles null container gracefully', () => {
            expect(() => icons.inject(null, { id: 'test' })).not.toThrow();
        });

        test('handles null entity gracefully', () => {
            const container = document.createElement('div');
            expect(() => icons.inject(container, null)).not.toThrow();
        });
    });

    describe('Field detection', () => {
        test('detects description field', () => {
            const entity = { type: 'deity', description: 'A god' };
            const fields = icons._getEditableFieldsForType('deity', entity);
            const descField = fields.find(f => f.name === 'description');
            expect(descField).toBeTruthy();
        });

        test('detects keyMyths field', () => {
            const entity = { type: 'deity', keyMyths: [{ title: 'test' }] };
            const fields = icons._getEditableFieldsForType('deity', entity);
            const mythsField = fields.find(f => f.name === 'keyMyths');
            expect(mythsField).toBeTruthy();
            expect(mythsField.type).toBe('keyMyths');
        });

        test('skips fields not present on entity', () => {
            const entity = { type: 'deity', description: 'A god' };
            const fields = icons._getEditableFieldsForType('deity', entity);
            const mythsField = fields.find(f => f.name === 'keyMyths');
            expect(mythsField).toBeUndefined();
        });

        test('maps entity types to collection names', () => {
            expect(icons._getCollectionName('deity')).toBe('deities');
            expect(icons._getCollectionName('hero')).toBe('heroes');
            expect(icons._getCollectionName('creature')).toBe('creatures');
            expect(icons._getCollectionName('item')).toBe('items');
            expect(icons._getCollectionName('place')).toBe('places');
        });

        test('returns type as-is for unmapped types', () => {
            expect(icons._getCollectionName('unknown')).toBe('unknown');
        });
    });
});
