/**
 * ModerationService — admin gating and ban enforcement
 *
 * Every mutating method here is gated on `isUserAdmin()`, and the gate is the
 * only thing standing between a signed-in visitor and banning other people. The
 * tests below pin that each one refuses rather than throws, so a caller sees a
 * clear `{ success: false }` instead of an unhandled rejection.
 *
 * `filterBannedContent` gets particular attention because its error path
 * deliberately fails *open* — a Firestore outage returns the unfiltered list
 * rather than an empty page. That is the right call for a read path, and it is
 * exactly the kind of decision that gets "tidied" into failing closed later.
 */

global.console = { ...console, log: jest.fn(), warn: jest.fn(), error: jest.fn() };

const ADMIN = 'andrewkwatts@gmail.com';

/** A Firestore double covering doc get/set/update and simple collection queries. */
function makeDb({ docs = {}, queryDocs = [], failOn = null } = {}) {
    const collections = {};

    const makeQuery = () => {
        const q = {
            where: jest.fn(() => q),
            orderBy: jest.fn(() => q),
            limit: jest.fn(() => q),
            get: jest.fn(() => failOn === 'query'
                ? Promise.reject(new Error('unavailable'))
                : Promise.resolve({
                    docs: queryDocs.map(d => ({ id: d.id, data: () => d })),
                    empty: queryDocs.length === 0,
                })),
        };
        return q;
    };

    const db = {
        collection: jest.fn(name => {
            const q = makeQuery();
            collections[name] = q;
            q.doc = jest.fn(id => ({
                get: jest.fn(() => failOn === 'get'
                    ? Promise.reject(new Error('unavailable'))
                    : Promise.resolve({
                        exists: Object.prototype.hasOwnProperty.call(docs, id),
                        data: () => docs[id],
                    })),
                set: jest.fn(() => failOn === 'set'
                    ? Promise.reject(new Error('denied'))
                    : Promise.resolve()),
                update: jest.fn(() => failOn === 'update'
                    ? Promise.reject(new Error('denied'))
                    : Promise.resolve()),
            }));
            return q;
        }),
    };

    return db;
}

/** A service wired to a stub db and a given signed-in user. */
function makeService(ModerationService, { email = null, db = makeDb() } = {}) {
    const service = new ModerationService();
    service.db = db;
    service.auth = {
        currentUser: email ? { uid: 'uid-1', email } : null,
        onAuthStateChanged: jest.fn(),
    };
    return service;
}

let ModerationService;

beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
    global.firebase = {
        firestore: Object.assign(() => makeDb(), {
            FieldValue: { serverTimestamp: () => 'SERVER_TS' },
        }),
        auth: () => ({ onAuthStateChanged: jest.fn(), currentUser: null }),
        apps: [],
    };
    ModerationService = require('../../js/services/moderation-service.js');
});

describe('admin status', () => {
    test('recognises the admin account', () => {
        const s = makeService(ModerationService, { email: ADMIN });
        expect(s.isUserAdmin()).toBe(true);
    });

    test('rejects any other signed-in account', () => {
        const s = makeService(ModerationService, { email: 'someone@example.com' });
        expect(s.isUserAdmin()).toBe(false);
    });

    test('rejects a signed-out visitor', () => {
        expect(makeService(ModerationService).isUserAdmin()).toBe(false);
        expect(makeService(ModerationService).checkAdminStatus(null)).toBe(false);
        expect(makeService(ModerationService).checkAdminStatus(undefined)).toBe(false);
    });

    test('getAdminStatus resolves immediately for a signed-in user', async () => {
        const s = makeService(ModerationService, { email: ADMIN });
        await expect(s.getAdminStatus()).resolves.toBe(true);
    });

    test('getAdminStatus waits for auth to settle when nobody is signed in yet', async () => {
        const s = makeService(ModerationService);
        const unsubscribe = jest.fn();
        s.auth.onAuthStateChanged = jest.fn(cb => {
            // Fire asynchronously, as Firebase does.
            setTimeout(() => cb({ email: ADMIN }), 0);
            return unsubscribe;
        });

        await expect(s.getAdminStatus()).resolves.toBe(true);
        expect(unsubscribe).toHaveBeenCalled();
    });
});

describe('banUser', () => {
    test('refuses a non-admin rather than throwing', async () => {
        const s = makeService(ModerationService, { email: 'someone@example.com' });
        await expect(s.banUser('victim')).resolves.toEqual({
            success: false, error: 'Admin access required',
        });
    });

    test('refuses a signed-out visitor', async () => {
        const s = makeService(ModerationService);
        expect((await s.banUser('victim')).success).toBe(false);
    });

    test('an admin ban succeeds and is logged', async () => {
        const s = makeService(ModerationService, { email: ADMIN });
        const log = jest.spyOn(s, 'logModerationAction').mockResolvedValue();

        await expect(s.banUser('victim', 'spam')).resolves.toEqual({ success: true });
        expect(log).toHaveBeenCalledWith('ban_user', { targetUserId: 'victim', reason: 'spam' });
    });

    test('a write failure is reported, not thrown', async () => {
        const s = makeService(ModerationService, {
            email: ADMIN, db: makeDb({ failOn: 'set' }),
        });
        jest.spyOn(s, 'logModerationAction').mockResolvedValue();

        const result = await s.banUser('victim');
        expect(result.success).toBe(false);
        expect(result.error).toBe('denied');
    });
});

describe('unbanUser', () => {
    test('refuses a non-admin', async () => {
        const s = makeService(ModerationService, { email: 'someone@example.com' });
        expect((await s.unbanUser('victim')).success).toBe(false);
    });

    test('an admin unban succeeds and is logged', async () => {
        const s = makeService(ModerationService, { email: ADMIN });
        const log = jest.spyOn(s, 'logModerationAction').mockResolvedValue();

        await expect(s.unbanUser('victim')).resolves.toEqual({ success: true });
        expect(log).toHaveBeenCalledWith('unban_user', { targetUserId: 'victim' });
    });

    test('a write failure is reported, not thrown', async () => {
        const s = makeService(ModerationService, {
            email: ADMIN, db: makeDb({ failOn: 'update' }),
        });
        jest.spyOn(s, 'logModerationAction').mockResolvedValue();

        expect((await s.unbanUser('victim')).success).toBe(false);
    });
});

describe('isUserBanned', () => {
    test('true only for an active ban', async () => {
        const s = makeService(ModerationService, {
            db: makeDb({ docs: { victim: { status: 'active' } } }),
        });
        await expect(s.isUserBanned('victim')).resolves.toBe(true);
    });

    test('false for a lifted ban', async () => {
        const s = makeService(ModerationService, {
            db: makeDb({ docs: { victim: { status: 'lifted' } } }),
        });
        await expect(s.isUserBanned('victim')).resolves.toBe(false);
    });

    test('false when there is no ban record at all', async () => {
        const s = makeService(ModerationService, { db: makeDb({ docs: {} }) });
        await expect(s.isUserBanned('nobody')).resolves.toBe(false);
    });

    test('false — not a throw — when the lookup fails', async () => {
        const s = makeService(ModerationService, { db: makeDb({ failOn: 'get' }) });
        await expect(s.isUserBanned('victim')).resolves.toBe(false);
    });

    test('shouldHideContent follows the ban', async () => {
        const s = makeService(ModerationService, {
            db: makeDb({ docs: { victim: { status: 'active' } } }),
        });
        await expect(s.shouldHideContent('victim')).resolves.toBe(true);
    });
});

describe('getBannedUsers', () => {
    test('returns nothing for a non-admin', async () => {
        const s = makeService(ModerationService, { email: 'someone@example.com' });
        await expect(s.getBannedUsers()).resolves.toEqual([]);
    });

    test('lists active bans for an admin', async () => {
        const s = makeService(ModerationService, {
            email: ADMIN,
            db: makeDb({ queryDocs: [{ id: 'victim', status: 'active', reason: 'spam' }] }),
        });

        const banned = await s.getBannedUsers();
        expect(banned).toHaveLength(1);
    });
});

describe('filterBannedContent', () => {
    test('drops items authored by a banned user', async () => {
        const s = makeService(ModerationService, {
            db: makeDb({ queryDocs: [{ id: 'villain' }] }),
        });

        const out = await s.filterBannedContent([
            { id: 1, authorId: 'villain' },
            { id: 2, authorId: 'citizen' },
        ]);

        expect(out.map(i => i.id)).toEqual([2]);
    });

    test('honours a custom author field', async () => {
        const s = makeService(ModerationService, {
            db: makeDb({ queryDocs: [{ id: 'villain' }] }),
        });

        const out = await s.filterBannedContent([
            { id: 1, userId: 'villain' },
            { id: 2, userId: 'citizen' },
        ], 'userId');

        expect(out.map(i => i.id)).toEqual([2]);
    });

    test('fails open, returning the unfiltered list', async () => {
        // Deliberate: a Firestore outage on a read path should not blank the
        // page. Do not "fix" this into failing closed without deciding that
        // an empty page is the better outcome.
        const s = makeService(ModerationService, { db: makeDb({ failOn: 'query' }) });

        const list = [{ id: 1, authorId: 'villain' }];
        await expect(s.filterBannedContent(list)).resolves.toBe(list);
    });

    test('an empty list stays empty', async () => {
        const s = makeService(ModerationService, { db: makeDb({ queryDocs: [] }) });
        await expect(s.filterBannedContent([])).resolves.toEqual([]);
    });
});
