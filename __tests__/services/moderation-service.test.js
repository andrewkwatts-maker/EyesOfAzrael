/**
 * ModerationService Tests
 *
 * Tests for js/services/moderation-service.js
 *
 * Test Categories:
 * 1. Constructor & initialization (3 tests)
 * 2. Admin status checking (3 tests)
 * 3. Ban/unban users (4 tests)
 * 4. Content flagging (3 tests)
 * 5. Flag resolution & queries (3 tests)
 * 6. Moderation history & stats (3 tests)
 * 7. Content visibility filtering (3 tests)
 *
 * Total: ~22 tests
 */

// Must mock firebase before requiring the module, since it auto-initializes
const mockDocSet = jest.fn(() => Promise.resolve());
const mockDocUpdate = jest.fn(() => Promise.resolve());
const mockDocGet = jest.fn(() => Promise.resolve({ exists: false, data: () => ({}) }));
const mockDocDelete = jest.fn(() => Promise.resolve());
const mockAdd = jest.fn(() => Promise.resolve({ id: 'flag-123' }));

const mockCollection = jest.fn(() => ({
    doc: jest.fn(() => ({
        get: mockDocGet,
        set: mockDocSet,
        update: mockDocUpdate,
        delete: mockDocDelete
    })),
    add: mockAdd,
    where: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    get: jest.fn(() => Promise.resolve({
        docs: [],
        size: 0
    }))
}));

const mockAuth = {
    currentUser: {
        uid: 'admin-user-123',
        email: 'andrewkwatts@gmail.com'
    },
    onAuthStateChanged: jest.fn((cb) => {
        cb(mockAuth.currentUser);
        return jest.fn();
    })
};

global.firebase = {
    auth: jest.fn(() => mockAuth),
    firestore: Object.assign(jest.fn(() => ({
        collection: mockCollection
    })), {
        FieldValue: {
            serverTimestamp: jest.fn(() => 'SERVER_TIMESTAMP'),
            increment: jest.fn(n => `INCREMENT_${n}`)
        }
    }),
    apps: [{}]
};

const ModerationService = require('../../js/services/moderation-service.js');

describe('ModerationService', () => {
    let service;

    beforeEach(() => {
        jest.clearAllMocks();

        // Reset mockCollection to return default chain
        mockCollection.mockReturnValue({
            doc: jest.fn(() => ({
                get: mockDocGet,
                set: mockDocSet,
                update: mockDocUpdate,
                delete: mockDocDelete
            })),
            add: mockAdd,
            where: jest.fn().mockReturnThis(),
            orderBy: jest.fn().mockReturnThis(),
            limit: jest.fn().mockReturnThis(),
            get: jest.fn(() => Promise.resolve({
                docs: [],
                size: 0
            }))
        });

        // Reset default mock behaviors
        mockDocGet.mockResolvedValue({ exists: false, data: () => ({}) });
        mockDocSet.mockResolvedValue(undefined);
        mockDocUpdate.mockResolvedValue(undefined);
        mockAdd.mockResolvedValue({ id: 'flag-123' });

        service = new ModerationService();
        service.db = {
            collection: mockCollection
        };
        service.auth = mockAuth;
        service.initialized = true;

        // Default: set as admin
        mockAuth.currentUser = {
            uid: 'admin-user-123',
            email: 'andrewkwatts@gmail.com'
        };
        service.isAdmin = true;
    });

    // ==========================================
    // 1. Constructor & initialization
    // ==========================================

    describe('constructor', () => {
        test('should initialize with default values', () => {
            const s = new ModerationService();
            expect(s.db).toBeNull();
            expect(s.auth).toBeNull();
            expect(s.isAdmin).toBe(false);
            expect(s.initialized).toBe(false);
        });

        test('should have admin email configured', () => {
            const s = new ModerationService();
            expect(s.adminEmail).toBe('andrewkwatts@gmail.com');
        });

        test('should skip re-initialization if already initialized', async () => {
            service.initialized = true;
            const result = await service.init();
            expect(result).toBe(true);
        });
    });

    // ==========================================
    // 2. Admin status checking
    // ==========================================

    describe('checkAdminStatus', () => {
        test('should return true for admin email', () => {
            const user = { email: 'andrewkwatts@gmail.com' };
            expect(service.checkAdminStatus(user)).toBe(true);
        });

        test('should return false for non-admin email', () => {
            const user = { email: 'someone@example.com' };
            expect(service.checkAdminStatus(user)).toBe(false);
        });

        test('should return false for null user', () => {
            expect(service.checkAdminStatus(null)).toBe(false);
        });
    });

    describe('isUserAdmin', () => {
        test('should check current user admin status', () => {
            expect(service.isUserAdmin()).toBe(true);
        });

        test('should return false when no current user', () => {
            mockAuth.currentUser = null;
            expect(service.isUserAdmin()).toBe(false);
        });
    });

    // ==========================================
    // 3. Ban/unban users
    // ==========================================

    describe('banUser', () => {
        test('should fail when not admin', async () => {
            mockAuth.currentUser = { uid: 'user', email: 'nobody@example.com' };
            const result = await service.banUser('target-user');
            expect(result.success).toBe(false);
            expect(result.error).toBe('Admin access required');
        });

        test('should ban user successfully', async () => {
            const result = await service.banUser('bad-user', 'Spam');
            expect(result.success).toBe(true);
            expect(mockDocSet).toHaveBeenCalled();
        });

        test('should handle errors gracefully', async () => {
            mockDocSet.mockRejectedValueOnce(new Error('DB error'));
            const result = await service.banUser('bad-user', 'Spam');
            expect(result.success).toBe(false);
            expect(result.error).toBe('DB error');
        });
    });

    describe('unbanUser', () => {
        test('should fail when not admin', async () => {
            mockAuth.currentUser = { uid: 'user', email: 'nobody@example.com' };
            const result = await service.unbanUser('target-user');
            expect(result.success).toBe(false);
        });

        test('should unban user successfully', async () => {
            const result = await service.unbanUser('bad-user');
            expect(result.success).toBe(true);
            expect(mockDocUpdate).toHaveBeenCalled();
        });
    });

    describe('isUserBanned', () => {
        test('should return false when no ban document exists', async () => {
            mockDocGet.mockResolvedValueOnce({ exists: false });
            const result = await service.isUserBanned('clean-user');
            expect(result).toBe(false);
        });

        test('should return true when ban status is active', async () => {
            mockDocGet.mockResolvedValueOnce({
                exists: true,
                data: () => ({ status: 'active' })
            });
            const result = await service.isUserBanned('bad-user');
            expect(result).toBe(true);
        });

        test('should return false when ban status is lifted', async () => {
            mockDocGet.mockResolvedValueOnce({
                exists: true,
                data: () => ({ status: 'lifted' })
            });
            const result = await service.isUserBanned('former-bad-user');
            expect(result).toBe(false);
        });
    });

    // ==========================================
    // 4. Content flagging
    // ==========================================

    describe('flagContent', () => {
        test('should fail when not admin', async () => {
            mockAuth.currentUser = { uid: 'user', email: 'nobody@example.com' };
            const result = await service.flagContent('submission', 'content-1', 'Inappropriate');
            expect(result.success).toBe(false);
        });

        test('should flag content successfully and return flagId', async () => {
            mockAdd.mockResolvedValueOnce({ id: 'new-flag-456' });
            const result = await service.flagContent('comment', 'comment-1', 'Offensive language');
            expect(result.success).toBe(true);
            expect(result.flagId).toBe('new-flag-456');
        });

        test('should handle errors when flagging', async () => {
            mockAdd.mockRejectedValueOnce(new Error('Permission denied'));
            const result = await service.flagContent('comment', 'comment-1', 'Test');
            expect(result.success).toBe(false);
            expect(result.error).toBe('Permission denied');
        });
    });

    // ==========================================
    // 5. Flag resolution & queries
    // ==========================================

    describe('resolveFlag', () => {
        test('should fail when not admin', async () => {
            mockAuth.currentUser = { uid: 'user', email: 'nobody@example.com' };
            const result = await service.resolveFlag('flag-1', 'dismissed');
            expect(result.success).toBe(false);
        });

        test('should resolve flag successfully', async () => {
            const result = await service.resolveFlag('flag-1', 'removed', 'Content was spam');
            expect(result.success).toBe(true);
            expect(mockDocUpdate).toHaveBeenCalled();
        });
    });

    describe('getFlags', () => {
        test('should return empty array when not admin', async () => {
            mockAuth.currentUser = { uid: 'user', email: 'nobody@example.com' };
            const result = await service.getFlags();
            expect(result).toEqual([]);
        });

        test('should return flags with status filter', async () => {
            const mockDocs = [
                { id: 'f1', data: () => ({ reason: 'Spam', status: 'pending' }) },
                { id: 'f2', data: () => ({ reason: 'Offensive', status: 'pending' }) }
            ];
            mockCollection.mockReturnValueOnce({
                where: jest.fn().mockReturnThis(),
                orderBy: jest.fn().mockReturnThis(),
                limit: jest.fn().mockReturnValue({
                    get: jest.fn(() => Promise.resolve({ docs: mockDocs }))
                })
            });

            const result = await service.getFlags('pending');
            expect(result.length).toBe(2);
            expect(result[0].id).toBe('f1');
        });
    });

    // ==========================================
    // 6. Moderation history & stats
    // ==========================================

    describe('getModerationHistory', () => {
        test('should return empty array when not admin', async () => {
            mockAuth.currentUser = { uid: 'user', email: 'nobody@example.com' };
            const result = await service.getModerationHistory();
            expect(result).toEqual([]);
        });
    });

    describe('getModerationStats', () => {
        test('should return null when not admin', async () => {
            mockAuth.currentUser = { uid: 'user', email: 'nobody@example.com' };
            const result = await service.getModerationStats();
            expect(result).toBeNull();
        });

        test('should return stats with counts', async () => {
            // Mock three parallel queries
            const mockQuery = {
                where: jest.fn().mockReturnThis(),
                get: jest.fn(() => Promise.resolve({ size: 3 }))
            };
            mockCollection.mockReturnValue(mockQuery);

            const result = await service.getModerationStats();
            expect(result).not.toBeNull();
            expect(result).toHaveProperty('activeBans');
            expect(result).toHaveProperty('pendingFlags');
            expect(result).toHaveProperty('resolvedFlags');
            expect(result).toHaveProperty('lastUpdated');
        });
    });

    describe('logModerationAction', () => {
        test('should log action to moderation_history collection', async () => {
            await service.logModerationAction('test_action', { foo: 'bar' });
            expect(mockAdd).toHaveBeenCalled();
        });
    });

    // ==========================================
    // 7. Content visibility filtering
    // ==========================================

    describe('shouldHideContent', () => {
        test('should return true for banned author', async () => {
            mockDocGet.mockResolvedValueOnce({
                exists: true,
                data: () => ({ status: 'active' })
            });
            const result = await service.shouldHideContent('banned-user');
            expect(result).toBe(true);
        });

        test('should return false for non-banned author', async () => {
            mockDocGet.mockResolvedValueOnce({ exists: false });
            const result = await service.shouldHideContent('clean-user');
            expect(result).toBe(false);
        });
    });

    describe('filterBannedContent', () => {
        test('should remove content from banned users', async () => {
            const bannedDocs = [
                { id: 'banned-user-1' },
                { id: 'banned-user-2' }
            ];

            mockCollection.mockReturnValueOnce({
                where: jest.fn().mockReturnThis(),
                get: jest.fn(() => Promise.resolve({
                    docs: bannedDocs
                }))
            });

            const content = [
                { id: 'post1', authorId: 'banned-user-1' },
                { id: 'post2', authorId: 'clean-user' },
                { id: 'post3', authorId: 'banned-user-2' }
            ];

            const result = await service.filterBannedContent(content);
            expect(result.length).toBe(1);
            expect(result[0].id).toBe('post2');
        });

        test('should return original content on error', async () => {
            mockCollection.mockReturnValueOnce({
                where: jest.fn().mockReturnThis(),
                get: jest.fn(() => Promise.reject(new Error('DB error')))
            });

            const content = [{ id: 'post1', authorId: 'user1' }];
            const result = await service.filterBannedContent(content);
            expect(result).toEqual(content);
        });

        test('should support custom author ID field name', async () => {
            mockCollection.mockReturnValueOnce({
                where: jest.fn().mockReturnThis(),
                get: jest.fn(() => Promise.resolve({
                    docs: [{ id: 'banned-user' }]
                }))
            });

            const content = [
                { id: 'c1', submittedBy: 'banned-user' },
                { id: 'c2', submittedBy: 'good-user' }
            ];

            const result = await service.filterBannedContent(content, 'submittedBy');
            expect(result.length).toBe(1);
            expect(result[0].id).toBe('c2');
        });
    });

    describe('getBannedUsers', () => {
        test('should return empty array when not admin', async () => {
            mockAuth.currentUser = { uid: 'user', email: 'nobody@example.com' };
            const result = await service.getBannedUsers();
            expect(result).toEqual([]);
        });
    });
});
