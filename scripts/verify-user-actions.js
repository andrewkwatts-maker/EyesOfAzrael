#!/usr/bin/env node

/**
 * Verify the writes a signed-in visitor makes, against live Firestore rules.
 *
 * Companion to scripts/verify-submission-path.js, covering the other things a
 * contributor does: saving a favourite, and reading it back from the dashboard.
 *
 * As there, the Admin SDK is deliberately not used for the writes. It bypasses
 * security rules, so a service-account write proves the collection exists and
 * nothing about whether a real signed-in visitor is permitted. This mints a
 * custom token, exchanges it for an ID token through Identity Toolkit, and uses
 * the Firestore REST API with it, so the live rules evaluate every request
 * exactly as the browser's would.
 *
 * Everything written is removed again and the removal is checked.
 *
 * USAGE
 *   set GOOGLE_APPLICATION_CREDENTIALS=H:\Secrets\eyesofazrael-...json
 *   node scripts/verify-user-actions.js
 */

const admin = require('firebase-admin');

const PROJECT = 'eyesofazrael';
const API_KEY = 'AIzaSyB7bFdte6f81-bNMsdITgnnnWq7aBNMXRw'; // public web key, already in firebase-config.js
const TEST_UID = 'e2e-user-actions-probe';
const OTHER_UID = 'e2e-someone-else';
const DOC_BASE = `projects/${PROJECT}/databases/(default)/documents`;

admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    projectId: PROJECT
});

function toFields(obj) {
    const out = {};
    for (const [k, v] of Object.entries(obj)) {
        if (typeof v === 'string') out[k] = { stringValue: v };
        else if (typeof v === 'number') out[k] = { integerValue: String(v) };
        else if (typeof v === 'boolean') out[k] = { booleanValue: v };
        else if (v && typeof v === 'object') out[k] = { mapValue: { fields: toFields(v) } };
    }
    return out;
}

async function idTokenFor(uid) {
    const customToken = await admin.auth().createCustomToken(uid);
    const res = await fetch(
        `https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${API_KEY}`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: customToken, returnSecureToken: true })
        }
    );
    const body = await res.json();
    if (!body.idToken) throw new Error('token exchange failed: ' + JSON.stringify(body).slice(0, 200));
    return body.idToken;
}

async function firestore(method, path, idToken, body) {
    const res = await fetch(`https://firestore.googleapis.com/v1/${path}`, {
        method,
        headers: { Authorization: `Bearer ${idToken}`, 'Content-Type': 'application/json' },
        body: body ? JSON.stringify(body) : undefined
    });
    return { status: res.status, body: await res.json().catch(() => ({})) };
}

(async () => {
    const idToken = await idTokenFor(TEST_UID);
    const otherToken = await idTokenFor(OTHER_UID);
    console.log(`authenticated as "${TEST_UID}" with a real ID token (rules apply)\n`);

    let pass = 0, fail = 0;
    const check = (ok, label, detail) => {
        console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${label}${detail ? ' — ' + detail : ''}`);
        ok ? pass++ : fail++;
    };

    // ---- favourites ------------------------------------------------------
    const favId = 'probe_greek_zeus_deity';
    const favPath = `${DOC_BASE}/users/${TEST_UID}/user_favorites/${favId}`;
    const favFields = toFields({
        entityId: 'greek_zeus', entityType: 'deity', entityName: 'Zeus',
        entityMythology: 'greek', addedAt: new Date().toISOString()
    });

    const created = await firestore('PATCH', favPath, idToken, { fields: favFields });
    check(created.status === 200, 'save a favourite',
        created.status === 200 ? '' : `HTTP ${created.status} ${String(created.body.error?.message || '').slice(0, 70)}`);

    const readBack = await firestore('GET', favPath, idToken);
    check(readBack.status === 200, 'read it back (dashboard list)',
        readBack.status === 200 ? `entity=${readBack.body.fields?.entityName?.stringValue}` : `HTTP ${readBack.status}`);

    // Another signed-in user must not be able to read it.
    const snooped = await firestore('GET', favPath, otherToken);
    check(snooped.status !== 200, 'another user cannot read it', `HTTP ${snooped.status}`);

    // ...nor write into someone else's favourites.
    const intruded = await firestore('PATCH', favPath, otherToken, { fields: favFields });
    check(intruded.status !== 200, 'another user cannot write it', `HTTP ${intruded.status}`);

    const removed = await firestore('DELETE', favPath, idToken);
    check(removed.status === 200, 'remove the favourite', removed.status === 200 ? '' : `HTTP ${removed.status}`);

    const gone = await firestore('GET', favPath, idToken);
    check(gone.status !== 200, 'removal verified', gone.status !== 200 ? 'no probe data remains' : 'STILL PRESENT');

    console.log(`\n${pass} passed, ${fail} failed`);

    await admin.auth().deleteUser(TEST_UID).catch(() => {});
    await admin.auth().deleteUser(OTHER_UID).catch(() => {});
    process.exit(fail === 0 ? 0 : 1);
})().catch((e) => { console.error('ERROR:', e.message); process.exit(1); });
