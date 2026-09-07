/**
 * End-to-end validation of the user-submission path against LIVE Firestore,
 * as a genuinely authenticated user — not via the Admin SDK.
 *
 * This distinction is the whole point. The Admin SDK bypasses security rules, so
 * writing a submission with the service account proves the collection exists and
 * nothing else. It cannot tell you whether a real signed-in contributor is
 * allowed to submit, which is the thing that matters.
 *
 * So: mint a custom token for a throwaway UID with the Admin SDK, exchange it for
 * a real ID token through the Identity Toolkit REST API, and drive the Firestore
 * REST API with that token. Every write below is evaluated by the live rules
 * exactly as a browser's would be.
 *
 * Each of the eight submission types is created, read back, and deleted, and the
 * deletion is verified. Anything left behind is reported loudly at the end —
 * this writes to the production project, so it cleans up after itself and says
 * so.
 */
const admin = require('firebase-admin');

const PROJECT = 'eyesofazrael';
const API_KEY = 'AIzaSyB7bFdte6f81-bNMsdITgnnnWq7aBNMXRw'; // public web key, already in firebase-config.js
const TEST_UID = 'e2e-submission-probe';

const TYPES = ['deity', 'hero', 'creature', 'place', 'item', 'text', 'concept', 'event'];
const DOC_BASE = `projects/${PROJECT}/databases/(default)/documents`;

admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    projectId: PROJECT
});

/** Firestore REST wants typed values. */
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
        headers: {
            Authorization: `Bearer ${idToken}`,
            'Content-Type': 'application/json'
        },
        body: body ? JSON.stringify(body) : undefined
    });
    return { status: res.status, body: await res.json().catch(() => ({})) };
}

(async () => {
    const idToken = await idTokenFor(TEST_UID);
    console.log(`authenticated as "${TEST_UID}" via a real ID token (rules apply)\n`);

    const created = [];
    let pass = 0, fail = 0;
    const check = (ok, label, detail) => {
        console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${label}${detail ? ' — ' + detail : ''}`);
        ok ? pass++ : fail++;
    };

    for (const type of TYPES) {
        const docId = `e2e_probe_${type}`;
        const fields = toFields({
            id: docId,
            type,
            status: 'pending',
            data: { name: `E2E probe ${type}`, description: 'Automated submission-path check.' },
            submittedBy: TEST_UID,
            entityName: `E2E probe ${type}`
        });

        const c = await firestore('POST', `${DOC_BASE}/submissions?documentId=${docId}`, idToken, { fields });
        const ok = c.status === 200;
        check(ok, `create  ${type.padEnd(9)}`, ok ? '' : `HTTP ${c.status} ${JSON.stringify(c.body.error?.message || '').slice(0, 70)}`);
        if (ok) created.push(docId);
    }

    console.log('');
    for (const docId of created) {
        const r = await firestore('GET', `${DOC_BASE}/submissions/${docId}`, idToken);
        check(r.status === 200, `read     ${docId.replace('e2e_probe_', '').padEnd(9)}`,
            r.status === 200 ? `status=${r.body.fields?.status?.stringValue}` : `HTTP ${r.status}`);
    }

    console.log('');
    for (const docId of created) {
        const d = await firestore('DELETE', `${DOC_BASE}/submissions/${docId}`, idToken);
        check(d.status === 200, `delete   ${docId.replace('e2e_probe_', '').padEnd(9)}`, d.status === 200 ? '' : `HTTP ${d.status}`);
    }

    console.log('');
    let leftover = 0;
    for (const docId of created) {
        const r = await firestore('GET', `${DOC_BASE}/submissions/${docId}`, idToken);
        if (r.status === 200) { leftover++; console.log(`  LEFTOVER  ${docId} still exists`); }
    }
    check(leftover === 0, 'cleanup verified', leftover === 0 ? 'no probe documents remain' : `${leftover} left behind`);

    // Negative case: the rules must reject a submission attributed to someone else.
    const spoof = toFields({
        id: 'e2e_probe_spoof', type: 'deity', status: 'pending',
        data: { name: 'spoof' }, submittedBy: 'somebody-else', entityName: 'spoof'
    });
    const s = await firestore('POST', `${DOC_BASE}/submissions?documentId=e2e_probe_spoof`, idToken, { fields: spoof });
    check(s.status !== 200, 'rules reject a spoofed submittedBy', `HTTP ${s.status}`);
    if (s.status === 200) await firestore('DELETE', `${DOC_BASE}/submissions/e2e_probe_spoof`, idToken);

    console.log('');
    console.log(`${pass} passed, ${fail} failed`);
    await admin.auth().deleteUser(TEST_UID).catch(() => {});
    process.exit(fail === 0 ? 0 : 1);
})().catch(e => { console.error('ERROR:', e.message); process.exit(1); });
