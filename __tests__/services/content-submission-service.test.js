/**
 * Content Submission Service Tests
 * Tests for js/services/content-submission-service.js
 */

describe('ContentSubmissionService', () => {
    let ContentSubmissionService;
    let mockFirestore;
    let mockAuth;

    beforeEach(() => {
        document.body.innerHTML = '';

        mockFirestore = {
            collection: jest.fn().mockReturnThis(),
            doc: jest.fn().mockReturnThis(),
            add: jest.fn().mockResolvedValue({ id: 'sub123' }),
            get: jest.fn().mockResolvedValue({
                exists: true,
                data: () => ({}),
                id: 'sub123',
                empty: true,
                docs: []
            }),
            set: jest.fn().mockResolvedValue({}),
            update: jest.fn().mockResolvedValue({}),
            where: jest.fn().mockReturnThis(),
            orderBy: jest.fn().mockReturnThis(),
            limit: jest.fn().mockReturnThis(),
        };

        mockAuth = {
            currentUser: {
                uid: 'user123',
                displayName: 'Test User',
                email: 'test@example.com'
            }
        };

        global.firebase = {
            firestore: jest.fn(() => mockFirestore),
            auth: jest.fn(() => mockAuth),
            storage: jest.fn(() => ({})),
        };
        global.firebase.firestore.FieldValue = {
            serverTimestamp: jest.fn(() => new Date()),
            increment: jest.fn((n) => n),
        };

        jest.resetModules();
        const mod = require('../../js/services/content-submission-service.js');
        ContentSubmissionService = mod.ContentSubmissionService || mod;
    });

    afterEach(() => {
        jest.restoreAllMocks();
        delete global.firebase;
    });

    describe('constructor', () => {
        test('should define collection mappings', () => {
            const service = new ContentSubmissionService();
            expect(service.collectionMap.deity).toBe('deities');
            expect(service.collectionMap.hero).toBe('heroes');
            expect(service.collectionMap.creature).toBe('creatures');
        });

        test('should define required fields', () => {
            const service = new ContentSubmissionService();
            expect(service.requiredFields.common).toContain('name');
            expect(service.requiredFields.common).toContain('type');
        });
    });

    describe('init', () => {
        test('should initialize with Firebase', async () => {
            const service = new ContentSubmissionService();
            await service.init();
            expect(service.initialized).toBe(true);
        });

        test('should handle missing Firebase gracefully', async () => {
            delete global.firebase;
            global.firebase = undefined;
            const service = new ContentSubmissionService();
            service.initialized = false;
            const result = await service.init();
            expect(result).toBe(false);
        });
    });

    describe('validateSubmission', () => {
        test('should accept valid submission', () => {
            const service = new ContentSubmissionService();
            const data = {
                name: 'Zeus',
                primaryMythology: 'greek',
                shortDescription: 'King of the Gods',
                longDescription: 'Zeus is the sky and thunder god in Greek mythology',
                type: 'deity',
                domains: ['sky', 'thunder']
            };
            const result = service.validateSubmission(data, 'deity');
            expect(result.valid).toBe(true);
        });

        test('should reject missing required fields', () => {
            const service = new ContentSubmissionService();
            const data = { name: 'Zeus' }; // missing most required fields
            const result = service.validateSubmission(data, 'deity');
            expect(result.valid).toBe(false);
            expect(result.errors.length).toBeGreaterThan(0);
        });

        test('should reject empty name', () => {
            const service = new ContentSubmissionService();
            const data = {
                name: '',
                primaryMythology: 'greek',
                shortDescription: 'Desc',
                longDescription: 'Long desc',
                type: 'deity'
            };
            const result = service.validateSubmission(data, 'deity');
            expect(result.valid).toBe(false);
        });
    });

    describe('submitContent', () => {
        test('should require authentication', async () => {
            mockAuth.currentUser = null;
            const service = new ContentSubmissionService();
            await service.init();
            const result = await service.submitContent({
                name: 'Zeus',
                primaryMythology: 'greek',
                shortDescription: 'King',
                longDescription: 'King of the Gods',
                type: 'deity'
            }, 'deity');
            expect(result.success).toBe(false);
            expect(result.error).toContain('signed in');
        });

        test('should validate before submitting', async () => {
            const service = new ContentSubmissionService();
            await service.init();
            const result = await service.submitContent({ name: '' }, 'deity');
            expect(result.success).toBe(false);
            expect(result.error).toContain('Validation');
        });
    });

    describe('sanitizeContentData', () => {
        test('should sanitize text fields', () => {
            const service = new ContentSubmissionService();
            const result = service.sanitizeContentData({
                name: 'Zeus<script>alert(1)</script>',
                shortDescription: 'King of Gods',
                longDescription: 'A powerful deity'
            });
            expect(result.name).not.toContain('<script>');
            expect(result.shortDescription).toBe('King of Gods');
        });

        test('should sanitize tags', () => {
            const service = new ContentSubmissionService();
            const result = service.sanitizeContentData({
                name: 'Zeus',
                tags: ['Greek Mythology', 'GODS', 'invalid!@#']
            });
            expect(result.tags).toContain('greekmythology');
        });
    });

    describe('generateSlug', () => {
        test('should create URL-safe slug', () => {
            const service = new ContentSubmissionService();
            const slug = service.generateSlug('Zeus the Thunderer');
            expect(slug).toBe('zeus-the-thunderer');
        });

        test('should handle special characters', () => {
            const service = new ContentSubmissionService();
            const slug = service.generateSlug('Héracles & Iolaus');
            expect(slug).not.toContain('&');
            expect(slug).not.toContain(' ');
        });

        test('should return empty string for null', () => {
            const service = new ContentSubmissionService();
            expect(service.generateSlug(null)).toBe('');
            expect(service.generateSlug('')).toBe('');
        });
    });

    describe('generateSubmissionId', () => {
        test('should generate unique IDs', () => {
            const service = new ContentSubmissionService();
            const id1 = service.generateSubmissionId('deity');
            const id2 = service.generateSubmissionId('deity');
            expect(id1).not.toBe(id2);
        });

        test('should include content type prefix', () => {
            const service = new ContentSubmissionService();
            const id = service.generateSubmissionId('deity');
            expect(id).toContain('deity');
        });
    });

    describe('getCollection', () => {
        test('should return mapped collection name', () => {
            const service = new ContentSubmissionService();
            expect(service.collectionMap['deity']).toBe('deities');
            expect(service.collectionMap['hero']).toBe('heroes');
            expect(service.collectionMap['creature']).toBe('creatures');
        });
    });
});
