/**
 * Firestore security-rules tests for /submissions — the user-contribution path.
 *
 * Runs against the rules emulator, not the live project:
 *
 *   npm run test:rules
 *
 * This is the feature the whole site exists to enable, and it had no rules
 * coverage at all. The Admin SDK bypasses security rules entirely, so writing a
 * submission with a service account proves nothing about whether a real signed-in
 * user can actually contribute — only the emulator, with a genuine auth context,
 * answers that.
 *
 * Every one of the eight submission types firestore.rules accepts is exercised
 * through its whole life: create, read back, update while pending, and delete.
 * A type that can be created but not withdrawn is a worse bug than one that
 * cannot be created, because it is invisible until someone tries.
 *
 * The negative cases matter as much: an anonymous visitor must not be able to
 * write, and a signed-in user must not be able to attribute a submission to
 * somebody else or self-approve it.
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

const ALICE = 'user_alice';
const BOB = 'user_bob';

/** Every type the rules' isValidSubmission() whitelist accepts. */
const SUBMISSION_TYPES = [
    'deity', 'hero', 'creature', 'place',
    'item', 'text', 'concept', 'event'
];

let testEnv;

const asUser = (uid) => testEnv.authenticatedContext(uid, {
    email: `${uid}@example.com`,
    email_verified: true
}).firestore();

const asAnon = () => testEnv.unauthenticatedContext().firestore();

const asAdminClaim = () => testEnv.authenticatedContext('user_admin', {
    email: 'admin@example.com',
    admin: true
}).firestore();

/** A submission shaped exactly as isValidSubmission() requires. */
function submission(type, uid = ALICE, overrides = {}) {
    return {
        id: `sub_${type}_1`,
        type,
        status: 'pending',
        data: { name: `Test ${type}`, description: 'Fixture for rules tests.' },
        submittedBy: uid,
        entityName: `Test ${type}`,
        ...overrides
    };
}

beforeAll(async () => {
    testEnv = await initializeTestEnvironment({
        projectId: PROJECT_ID,
        firestore: { rules: fs.readFileSync(RULES_PATH, 'utf8') }
    });
});

afterAll(async () => {
    if (testEnv) await testEnv.cleanup();
});

beforeEach(async () => {
    await testEnv.clearFirestore();
});

describe('/submissions — every type round-trips', () => {
    test.each(SUBMISSION_TYPES)('a signed-in user can submit a "%s"', async (type) => {
        const db = asUser(ALICE);
        await assertSucceeds(
            db.collection('submissions').doc(`sub_${type}_1`).set(submission(type))
        );
    });

    test.each(SUBMISSION_TYPES)('the submitter can read back their pending "%s"', async (type) => {
        const id = `sub_${type}_1`;
        await testEnv.withSecurityRulesDisabled(async (ctx) => {
            await ctx.firestore().collection('submissions').doc(id).set(submission(type));
        });

        await assertSucceeds(asUser(ALICE).collection('submissions').doc(id).get());
    });

    test.each(SUBMISSION_TYPES)('the submitter can withdraw their pending "%s"', async (type) => {
        // The half of the lifecycle that is easy to leave broken: a contribution
        // you can make but cannot take back.
        const id = `sub_${type}_1`;
        await testEnv.withSecurityRulesDisabled(async (ctx) => {
            await ctx.firestore().collection('submissions').doc(id).set(submission(type));
        });

        await assertSucceeds(asUser(ALICE).collection('submissions').doc(id).delete());
    });

    test.each(SUBMISSION_TYPES)('the submitter can edit their pending "%s"', async (type) => {
        const id = `sub_${type}_1`;
        await testEnv.withSecurityRulesDisabled(async (ctx) => {
            await ctx.firestore().collection('submissions').doc(id).set(submission(type));
        });

        await assertSucceeds(
            asUser(ALICE).collection('submissions').doc(id)
                .set(submission(type, ALICE, { entityName: 'Corrected name' }))
        );
    });
});

describe('/submissions — who may not write', () => {
    test('an anonymous visitor cannot submit', async () => {
        await assertFails(
            asAnon().collection('submissions').doc('sub_anon').set(submission('deity', ALICE))
        );
    });

    test('a user cannot attribute a submission to someone else', async () => {
        // submittedBy is what every ownership check downstream keys on.
        await assertFails(
            asUser(ALICE).collection('submissions').doc('sub_spoof')
                .set(submission('deity', BOB))
        );
    });

    test('a user cannot create a submission that is already approved', async () => {
        await assertFails(
            asUser(ALICE).collection('submissions').doc('sub_selfapprove')
                .set(submission('deity', ALICE, { status: 'approved' }))
        );
    });

    test('a user cannot approve their own pending submission', async () => {
        const id = 'sub_pending';
        await testEnv.withSecurityRulesDisabled(async (ctx) => {
            await ctx.firestore().collection('submissions').doc(id).set(submission('deity'));
        });

        await assertFails(
            asUser(ALICE).collection('submissions').doc(id)
                .set(submission('deity', ALICE, { status: 'approved' }))
        );
    });

    test('a user cannot delete someone else\'s submission', async () => {
        const id = 'sub_alice';
        await testEnv.withSecurityRulesDisabled(async (ctx) => {
            await ctx.firestore().collection('submissions').doc(id).set(submission('deity', ALICE));
        });

        await assertFails(asUser(BOB).collection('submissions').doc(id).delete());
    });

    test('a type outside the whitelist is rejected', async () => {
        await assertFails(
            asUser(ALICE).collection('submissions').doc('sub_bad')
                .set(submission('spaceship', ALICE))
        );
    });

    test('a submission missing a required field is rejected', async () => {
        const incomplete = submission('deity');
        delete incomplete.entityName;

        await assertFails(
            asUser(ALICE).collection('submissions').doc('sub_incomplete').set(incomplete)
        );
    });

    test('an empty entityName is rejected', async () => {
        await assertFails(
            asUser(ALICE).collection('submissions').doc('sub_empty')
                .set(submission('deity', ALICE, { entityName: '' }))
        );
    });
});

describe('/submissions — moderation', () => {
    test('an admin can approve a pending submission', async () => {
        const id = 'sub_to_approve';
        await testEnv.withSecurityRulesDisabled(async (ctx) => {
            await ctx.firestore().collection('submissions').doc(id).set(submission('deity'));
        });

        await assertSucceeds(
            asAdminClaim().collection('submissions').doc(id)
                .set(submission('deity', ALICE, { status: 'approved' }))
        );
    });

    test('an admin can delete any submission', async () => {
        const id = 'sub_to_delete';
        await testEnv.withSecurityRulesDisabled(async (ctx) => {
            await ctx.firestore().collection('submissions').doc(id).set(submission('deity'));
        });

        await assertSucceeds(asAdminClaim().collection('submissions').doc(id).delete());
    });

    test('an approved submission is readable by anyone', async () => {
        const id = 'sub_approved';
        await testEnv.withSecurityRulesDisabled(async (ctx) => {
            await ctx.firestore().collection('submissions').doc(id)
                .set(submission('deity', ALICE, { status: 'approved' }));
        });

        await assertSucceeds(asAnon().collection('submissions').doc(id).get());
    });

    test('a pending submission is NOT readable by a stranger', async () => {
        const id = 'sub_private';
        await testEnv.withSecurityRulesDisabled(async (ctx) => {
            await ctx.firestore().collection('submissions').doc(id).set(submission('deity', ALICE));
        });

        await assertFails(asUser(BOB).collection('submissions').doc(id).get());
    });
});
