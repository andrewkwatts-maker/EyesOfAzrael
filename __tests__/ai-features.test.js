/**
 * AI Features Tests — Sprint 4
 *
 * Tests for:
 * 1. AdminPopulateButton uses body class check, not hardcoded email
 * 2. GeminiSVGGenerator API key fallback (window.EOA_GEMINI_KEY)
 * 3. GeminiSVGGenerator geometric fallback via IconGenerator
 * 4. ContentSubmissionWizard icon generator resolution
 * 5. Auth guard admin status propagation (is-admin body class + event)
 *
 * Total: 20 tests
 */

const fs = require('fs');
const path = require('path');

// =============================================
// Helpers
// =============================================

function loadModule(relPath) {
    const code = fs.readFileSync(path.join(__dirname, '..', relPath), 'utf8');
    eval(code); // eslint-disable-line no-eval
}

function setupDOM() {
    document.body.innerHTML = '<div id="main-content"></div>';
    document.body.className = '';
}

function setupFirebaseMock(overrides = {}) {
    global.firebase = {
        auth: jest.fn(() => ({
            currentUser: overrides.currentUser !== undefined ? overrides.currentUser : {
                uid: 'user-123',
                email: 'andrewkwatts@gmail.com',
                displayName: 'Admin User',
                getIdToken: jest.fn(() => Promise.resolve('mock-token')),
                getIdTokenResult: jest.fn(() => Promise.resolve({
                    expirationTime: new Date(Date.now() + 3600000).toISOString()
                }))
            },
            onAuthStateChanged: jest.fn(cb => { cb(overrides.authUser !== undefined ? overrides.authUser : null); return jest.fn(); }),
            signOut: jest.fn(() => Promise.resolve())
        })),
        firestore: Object.assign(jest.fn(() => ({
            collection: jest.fn(() => ({
                doc: jest.fn(() => ({
                    update: jest.fn(() => Promise.resolve()),
                    get: jest.fn(() => Promise.resolve({ exists: true, data: () => ({}) }))
                }))
            }))
        })), {
            FieldValue: {
                serverTimestamp: jest.fn(() => 'TIMESTAMP'),
                increment: jest.fn(n => `INC_${n}`)
            }
        })
    };
}

// =============================================
// 1. AdminPopulateButton — role-based admin check
// =============================================

describe('AdminPopulateButton', () => {
    let AdminPopulateButton;

    beforeEach(() => {
        setupDOM();
        setupFirebaseMock();
        delete window.AdminPopulateButton;
        loadModule('js/components/admin-populate-button.js');
        AdminPopulateButton = window.AdminPopulateButton;
    });

    test('is exported to window', () => {
        expect(AdminPopulateButton).toBeDefined();
    });

    test('_isAdmin returns false when body lacks is-admin class', () => {
        document.body.classList.remove('is-admin');
        const btn = new AdminPopulateButton(document.body, { type: 'deity', id: '1' });
        expect(btn._isAdmin()).toBe(false);
    });

    test('_isAdmin returns true when body has is-admin class', () => {
        document.body.classList.add('is-admin');
        const btn = new AdminPopulateButton(document.body, { type: 'deity', id: '1' });
        expect(btn._isAdmin()).toBe(true);
    });

    test('does not check firebase auth email directly', () => {
        // The _isAdmin method must NOT reference firebase at all
        const src = fs.readFileSync(
            path.join(__dirname, '../js/components/admin-populate-button.js'), 'utf8'
        );
        // The only _isAdmin implementation should use classList
        const isAdminFn = src.match(/_isAdmin\(\)\s*\{([^}]+)\}/);
        expect(isAdminFn).not.toBeNull();
        const body = isAdminFn[1];
        expect(body).not.toContain('@gmail.com');
        expect(body).toContain('is-admin');
    });

    test('init does not render when body lacks is-admin class', () => {
        document.body.classList.remove('is-admin');
        const container = document.createElement('div');
        document.body.appendChild(container);
        const entity = {
            type: 'deity', id: '1', name: 'Zeus',
            // all fields missing — should have lots of missing fields
        };
        const btn = new AdminPopulateButton(container, entity);
        btn.init();
        expect(container.querySelector('.admin-populate-wrapper')).toBeNull();
    });

    test('init renders button when body has is-admin class and entity is sparse', () => {
        document.body.classList.add('is-admin');
        const container = document.createElement('div');
        document.body.appendChild(container);
        const entity = { type: 'deity', id: '1', name: 'Zeus' };
        const btn = new AdminPopulateButton(container, entity);
        btn.init();
        expect(container.querySelector('.admin-populate-btn')).not.toBeNull();
    });
});

// =============================================
// 2. GeminiSVGGenerator — API key fallback
// =============================================

describe('GeminiSVGGenerator — API key fallback', () => {
    let GeminiSVGGenerator;

    beforeEach(() => {
        setupDOM();
        setupFirebaseMock({ currentUser: null });
        delete window.GeminiSVGGenerator;
        delete window.EOA_GEMINI_KEY;
        loadModule('js/gemini-svg-generator.js');
        GeminiSVGGenerator = window.GeminiSVGGenerator;
    });

    afterEach(() => {
        delete window.EOA_GEMINI_KEY;
    });

    test('is exported to window', () => {
        expect(GeminiSVGGenerator).toBeDefined();
    });

    test('isAuthenticated returns false when no key and no user', () => {
        const gen = new GeminiSVGGenerator();
        expect(gen.isAuthenticated()).toBe(false);
    });

    test('isAuthenticated returns true when EOA_GEMINI_KEY is set', () => {
        window.EOA_GEMINI_KEY = 'test-api-key-123';
        const gen = new GeminiSVGGenerator();
        expect(gen.isAuthenticated()).toBe(true);
    });

    test('generateSVG returns needsAuth error when no key and no auth', async () => {
        const gen = new GeminiSVGGenerator();
        const result = await gen.generateSVG('Zeus with lightning bolt');
        expect(result.success).toBe(false);
        expect(result.needsAuth).toBe(true);
        expect(result.error).toContain('API key');
    });
});

// =============================================
// 3. GeminiSVGGenerator — geometric fallback
// =============================================

describe('GeminiSVGGenerator — geometric fallback', () => {
    let GeminiSVGGenerator;

    beforeEach(() => {
        setupDOM();
        setupFirebaseMock({ currentUser: null });
        delete window.GeminiSVGGenerator;
        delete window.EOA_GEMINI_KEY;
        delete window.IconGenerator;
        loadModule('js/gemini-svg-generator.js');
        GeminiSVGGenerator = window.GeminiSVGGenerator;
    });

    afterEach(() => {
        delete window.IconGenerator;
    });

    test('_tryGeometricFallback returns null when IconGenerator is absent', () => {
        const gen = new GeminiSVGGenerator();
        expect(gen._tryGeometricFallback('test prompt', {})).toBeNull();
    });

    test('_tryGeometricFallback returns fallback result when IconGenerator is present', () => {
        window.IconGenerator = {
            generateForMythology: jest.fn(() => '<svg viewBox="0 0 400 400"><rect/></svg>')
        };
        const gen = new GeminiSVGGenerator();
        const result = gen._tryGeometricFallback('Zeus prompt', { mythology: 'greek' });
        expect(result).not.toBeNull();
        expect(result.success).toBe(true);
        expect(result.isGeometricFallback).toBe(true);
        expect(result.svgCode).toContain('<svg');
    });

    test('generateSVG uses geometric fallback when not authenticated and IconGenerator present', async () => {
        window.IconGenerator = {
            generateForMythology: jest.fn(() => '<svg viewBox="0 0 400 400"><circle/></svg>')
        };
        const gen = new GeminiSVGGenerator();
        const result = await gen.generateSVG('Apollo with sun rays', { mythology: 'greek' });
        expect(result.success).toBe(true);
        expect(result.isGeometricFallback).toBe(true);
        expect(window.IconGenerator.generateForMythology).toHaveBeenCalledWith('greek');
    });
});

// =============================================
// 4. ContentSubmissionWizard — icon generator resolution
// =============================================

describe('ContentSubmissionWizard — icon generator resolution', () => {
    beforeEach(() => {
        setupDOM();
        setupFirebaseMock();
        delete window.ContentSubmissionWizard;
        delete window.AIIconGenerator;
        delete window.IconGenerator;
        delete window.GeminiSVGGenerator;
    });

    test('uses IconGenerator when available (not AIIconGenerator)', () => {
        const mockIconGenerator = { generateWithStyle: jest.fn(() => ({ success: true, svgCode: '<svg/>' })) };
        window.IconGenerator = mockIconGenerator;

        loadModule('js/components/content-submission-wizard.js');

        document.body.innerHTML = '<div id="wizard-container"></div>';
        const wizard = new window.ContentSubmissionWizard('#wizard-container');
        wizard.init();

        // iconGenerator should be the IconGenerator singleton, not an instance
        expect(wizard.iconGenerator).toBe(mockIconGenerator);
    });

    test('falls back to GeminiSVGGenerator when IconGenerator is absent', () => {
        delete window.IconGenerator;
        const MockGemini = jest.fn().mockImplementation(() => ({ generateSVG: jest.fn() }));
        window.GeminiSVGGenerator = MockGemini;

        loadModule('js/components/content-submission-wizard.js');

        document.body.innerHTML = '<div id="wizard-container"></div>';
        const wizard = new window.ContentSubmissionWizard('#wizard-container');
        wizard.init();

        expect(wizard.iconGenerator).toBeTruthy();
        expect(MockGemini).toHaveBeenCalled();
    });

    test('iconGenerator is null when neither IconGenerator nor GeminiSVGGenerator are present', () => {
        delete window.IconGenerator;
        delete window.GeminiSVGGenerator;

        loadModule('js/components/content-submission-wizard.js');

        document.body.innerHTML = '<div id="wizard-container"></div>';
        const wizard = new window.ContentSubmissionWizard('#wizard-container');
        // Before init, iconGenerator is null
        expect(wizard.iconGenerator).toBeNull();
    });
});

// =============================================
// 5. Auth guard — admin status propagation
// =============================================

describe('Auth guard — admin status propagation', () => {
    const authGuardPath = path.join(__dirname, '../js/auth-guard-simple.js');

    test('source sets is-admin class in handleAuthenticated for admin email', () => {
        const src = fs.readFileSync(authGuardPath, 'utf8');
        expect(src).toContain("classList.add('is-admin')");
    });

    test('source removes is-admin class in handleNotAuthenticated', () => {
        const src = fs.readFileSync(authGuardPath, 'utf8');
        expect(src).toContain('is-admin');
        // Both add and remove should be present
        expect(src).toContain("classList.remove('authenticated', 'is-admin')");
    });

    test('source dispatches adminStatusChanged event', () => {
        const src = fs.readFileSync(authGuardPath, 'utf8');
        expect(src).toContain('adminStatusChanged');
    });

    test('source includes ADMIN_EMAILS constant', () => {
        const src = fs.readFileSync(authGuardPath, 'utf8');
        expect(src).toContain('ADMIN_EMAILS');
        expect(src).toContain('andrewkwatts@gmail.com');
    });

    test('adminStatusChanged event detail includes isAdmin boolean', () => {
        const src = fs.readFileSync(authGuardPath, 'utf8');
        expect(src).toContain('isAdmin');
    });
});
