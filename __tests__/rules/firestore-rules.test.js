/**
 * Firestore security-rules tests (emulator).
 *
 * These run against the Firestore rules emulator, NOT against the live
 * project — no credentials and no read quota are involved. They are excluded
 * from the default `jest` run (see `testPathIgnorePatterns` in jest.config.js)
 * because the emulator is not running in the unit-test CI job.
 *
 *   npm run test:rules
 *
 * What they pin down, in the language of docs/PLAN-MULTIDOMAIN.md §7.1:
 *
 *  1. The seven previously-unruled user-write collections (`notes`,
 *     `contentReports`, `newsletter_subscribers`, `user_diagrams`,
 *     `userSettings`, `userIcons`, `content`) accept the writes the UI
 *     actually issues, instead of falling through to the admin-only
 *     catch-all and returning PERMISSION_DENIED to every normal user.
 *
 *  2. The catch-all `match /{collection}/{document=**} { allow read: if true }`
 *     no longer overrides the restrictive read rules above it. Firestore ORs
 *     every matching rule together, so before `isPrivateCollection()` was
 *     introduced a single permissive catch-all silently exposed every
 *     private collection. Each private collection is asserted unreadable by
 *     a non-owner AND still readable by its owner/admin, so a regression in
 *     either direction fails.
 */

const fs = require('fs');
const path = require('path');
const {
    initializeTestEnvironment,
    assertSucceeds,
    assertFails
} = require('@firebase/rules-unit-testing');

const PROJECT_ID = 'eyesofazrael-rules-test';
const RULES_PATH = path.resolve(__dirname, '../../firestore.rules');

/** The admin email hardcoded throughout firestore.rules (isSiteAdmin). */
const ADMIN_EMAIL = 'andrewkwatts@gmail.com';

const ALICE = 'user_alice';
const BOB = 'user_bob';

let testEnv;

/** A signed-in ordinary user. */
const asUser = (uid) => testEnv.authenticatedContext(uid, {
    email: `${uid}@example.com`,
    email_verified: true
}).firestore();

/** A signed-in admin, via the `admin: true` custom claim. */
const asAdminClaim = () => testEnv.authenticatedContext('user_admin', {
    email: 'someone@example.com',
    admin: true
}).firestore();

/** A signed-in admin, via the hardcoded email branch of isSiteAdmin(). */
const asAdminEmail = () => testEnv.authenticatedContext('user_owner', {
    email: ADMIN_EMAIL
}).firestore();

/** A signed-out visitor. */
const asVisitor = () => testEnv.unauthenticatedContext().firestore();

/** Seed a document bypassing rules, so read rules can be tested against it. */
const seed = (docPath, data) => testEnv.withSecurityRulesDisabled(
    (ctx) => ctx.firestore().doc(docPath).set(data)
);

const validNote = (uid, overrides = {}) => ({
    entityId: 'zeus',
    entityCollection: 'deities',
    entityName: 'Zeus',
    userId: uid,
    userName: 'Alice',
    content: 'A note long enough to clear the ten-character minimum.',
    status: 'active',
    upvoteCount: 0,
    downvoteCount: 0,
    netVotes: 0,
    ...overrides
});

beforeAll(async () => {
    if (!process.env.FIRESTORE_EMULATOR_HOST) {
        throw new Error(
            'FIRESTORE_EMULATOR_HOST is not set. Run these via `npm run test:rules`, ' +
            'which starts the Firestore emulator around them.'
        );
    }
    const [host, port] = process.env.FIRESTORE_EMULATOR_HOST.split(':');
    testEnv = await initializeTestEnvironment({
        projectId: PROJECT_ID,
        firestore: {
            rules: fs.readFileSync(RULES_PATH, 'utf8'),
            host,
            port: Number(port)
        }
    });
});

afterAll(async () => {
    if (testEnv) await testEnv.cleanup();
});

beforeEach(async () => {
    await testEnv.clearFirestore();
});

describe('contribution: a normal signed-in user can contribute', () => {
    test('creates their own note', async () => {
        await assertSucceeds(
            asUser(ALICE).collection('notes').doc('note1').set(validNote(ALICE))
        );
    });

    test('cannot create a note attributed to someone else', async () => {
        await assertFails(
            asUser(ALICE).collection('notes').doc('note2').set(validNote(BOB))
        );
    });

    test('cannot create a note pre-loaded with votes', async () => {
        await assertFails(
            asUser(ALICE).collection('notes').doc('note3')
                .set(validNote(ALICE, { netVotes: 99, upvoteCount: 99 }))
        );
    });

    test('cannot create a note below the content minimum', async () => {
        await assertFails(
            asUser(ALICE).collection('notes').doc('note4')
                .set(validNote(ALICE, { content: 'short' }))
        );
    });

    test('a signed-out visitor cannot create a note', async () => {
        await assertFails(
            asVisitor().collection('notes').doc('note5').set(validNote(ALICE))
        );
    });

    test('edits their own note but not another user\'s', async () => {
        await seed('notes/mine', validNote(ALICE));
        await seed('notes/theirs', validNote(BOB));

        await assertSucceeds(
            asUser(ALICE).collection('notes').doc('mine')
                .update({ content: 'An edited note, still over ten characters.' })
        );
        await assertFails(
            asUser(ALICE).collection('notes').doc('theirs')
                .update({ content: 'Rewriting somebody else\'s note entirely.' })
        );
    });

    test('files a content report, and cannot file one as someone else', async () => {
        await assertSucceeds(
            asUser(ALICE).collection('contentReports').doc('r1').set({
                contentType: 'note', contentId: 'note1',
                reportedBy: ALICE, status: 'pending'
            })
        );
        await assertFails(
            asUser(ALICE).collection('contentReports').doc('r2').set({
                contentType: 'note', contentId: 'note1',
                reportedBy: BOB, status: 'pending'
            })
        );
    });

    test('saves their own userSettings', async () => {
        await assertSucceeds(
            asUser(ALICE).collection('userSettings').doc(ALICE)
                .set({ contentFilter: 'moderate', updatedAt: Date.now() })
        );
    });

    test('saves a diagram and an icon they own', async () => {
        await assertSucceeds(
            asUser(ALICE).collection('user_diagrams').doc('d1')
                .set({ title: 'Pantheon map', userId: ALICE, nodes: [], links: [] })
        );
        await assertSucceeds(
            asUser(ALICE).collection('userIcons').doc('i1')
                .set({ userId: ALICE, prompt: 'a raven', svgCode: '<svg/>' })
        );
    });

    test('a signed-out visitor can subscribe to the newsletter', async () => {
        await assertSucceeds(
            asVisitor().collection('newsletter_subscribers').doc('a@b.com')
                .set({ email: 'a@b.com', subscribedAt: Date.now(), source: 'footer' })
        );
    });

    test('the newsletter collection cannot be used as free storage', async () => {
        await assertFails(
            asVisitor().collection('newsletter_subscribers').doc('junk')
                .set({ email: 'a@b.com', subscribedAt: 1, source: 'footer', payload: 'x' })
        );
        await assertFails(
            asVisitor().collection('newsletter_subscribers').doc('bad')
                .set({ email: 'not-an-email', subscribedAt: 1, source: 'footer' })
        );
    });

    test('creates a draft in /content but cannot publish or seed a default', async () => {
        await assertSucceeds(
            asUser(ALICE).collection('content').doc('c1')
                .set({ isDefault: false, authorId: ALICE, status: 'draft', body: 'x' })
        );
        await assertFails(
            asUser(ALICE).collection('content').doc('c2')
                .set({ isDefault: false, authorId: ALICE, status: 'published', body: 'x' })
        );
        await assertFails(
            asUser(ALICE).collection('content').doc('c3')
                .set({ isDefault: true, authorId: null, status: 'draft', body: 'x' })
        );
    });
});

describe('the catch-all no longer overrides restrictive read rules', () => {
    test('a user cannot read another user\'s userSettings', async () => {
        await seed(`userSettings/${BOB}`, { contentFilter: 'strict' });
        await assertFails(asUser(ALICE).collection('userSettings').doc(BOB).get());
    });

    test('a user CAN read their own userSettings', async () => {
        await seed(`userSettings/${ALICE}`, { contentFilter: 'strict' });
        await assertSucceeds(asUser(ALICE).collection('userSettings').doc(ALICE).get());
    });

    test('a signed-out visitor cannot read userSettings at all', async () => {
        await seed(`userSettings/${ALICE}`, { contentFilter: 'strict' });
        await assertFails(asVisitor().collection('userSettings').doc(ALICE).get());
    });

    test('a normal user cannot read contentReports', async () => {
        await seed('contentReports/r1', {
            contentType: 'note', contentId: 'n1', reportedBy: BOB, status: 'pending'
        });
        await assertFails(asUser(ALICE).collection('contentReports').doc('r1').get());
    });

    test('a normal user cannot list contentReports either', async () => {
        await seed('contentReports/r1', {
            contentType: 'note', contentId: 'n1', reportedBy: BOB, status: 'pending'
        });
        await assertFails(asUser(ALICE).collection('contentReports').get());
    });

    test('the reporter cannot read back their own report', async () => {
        await seed('contentReports/r1', {
            contentType: 'note', contentId: 'n1', reportedBy: ALICE, status: 'pending'
        });
        await assertFails(asUser(ALICE).collection('contentReports').doc('r1').get());
    });

    test('an admin CAN read contentReports', async () => {
        await seed('contentReports/r1', {
            contentType: 'note', contentId: 'n1', reportedBy: BOB, status: 'pending'
        });
        await assertSucceeds(asAdminClaim().collection('contentReports').doc('r1').get());
        await assertSucceeds(asAdminEmail().collection('contentReports').doc('r1').get());
        await assertSucceeds(asAdminClaim().collection('contentReports').get());
    });

    test('newsletter email addresses are not world-readable', async () => {
        await seed('newsletter_subscribers/a@b.com', { email: 'a@b.com', source: 'footer' });
        await assertFails(asVisitor().collection('newsletter_subscribers').get());
        await assertFails(asUser(ALICE).collection('newsletter_subscribers').doc('a@b.com').get());
        await assertSucceeds(asAdminClaim().collection('newsletter_subscribers').doc('a@b.com').get());
    });

    test('private_notes stay private to their owner', async () => {
        await seed('private_notes/n1', { userId: BOB, content: 'secret' });
        await assertFails(asUser(ALICE).collection('private_notes').doc('n1').get());
        await assertFails(asVisitor().collection('private_notes').doc('n1').get());
        await seed('private_notes/n2', { userId: ALICE, content: 'mine' });
        await assertSucceeds(asUser(ALICE).collection('private_notes').doc('n2').get());
    });

    test('user_diagrams and userIcons are owner-scoped', async () => {
        await seed('user_diagrams/d1', { userId: BOB, title: 'theirs' });
        await seed('userIcons/i1', { userId: BOB, prompt: 'x', svgCode: '<svg/>' });
        await assertFails(asUser(ALICE).collection('user_diagrams').doc('d1').get());
        await assertFails(asUser(ALICE).collection('userIcons').doc('i1').get());

        await seed('user_diagrams/d2', { userId: ALICE, title: 'mine' });
        await assertSucceeds(asUser(ALICE).collection('user_diagrams').doc('d2').get());
        await assertSucceeds(asAdminClaim().collection('user_diagrams').doc('d1').get());
    });

    test('public content is still public — the catch-all was not over-tightened', async () => {
        // Unruled esoterica collections rely on the catch-all for public read.
        await seed('magic/m1', { name: 'Enochian', tradition: 'hermetic' });
        await seed('beings/b1', { name: 'Metatron' });
        await assertSucceeds(asVisitor().collection('magic').doc('m1').get());
        await assertSucceeds(asVisitor().collection('beings').doc('b1').get());
    });

    test('notes are public — they carry vote tallies on every entity page', async () => {
        await seed('notes/n1', validNote(BOB));
        await assertSucceeds(asVisitor().collection('notes').doc('n1').get());
    });
});

describe('the new domain collections are readable but not client-writable', () => {
    const HIST = ['hist_events', 'hist_figures', 'hist_periods', 'hist_cultures',
        'hist_wars', 'hist_discoveries', 'hist_artifacts'];
    const CON = ['con_theories', 'con_figures', 'con_organizations',
        'con_events', 'con_documents', 'con_concepts'];

    test.each([...HIST, ...CON])('%s is world-readable', async (collection) => {
        await seed(`${collection}/d1`, { name: 'Seed', era: 'classical', category: 'x' });
        await assertSucceeds(asVisitor().collection(collection).doc('d1').get());
    });

    test.each([...HIST, ...CON])('%s rejects a client write', async (collection) => {
        await assertFails(
            asUser(ALICE).collection(collection).doc('d2').set({ name: 'Injected' })
        );
    });

    test('an admin can write the new domain collections', async () => {
        await assertSucceeds(
            asAdminClaim().collection('hist_events').doc('d3').set({ name: 'Seed', era: 'classical' })
        );
    });
});
