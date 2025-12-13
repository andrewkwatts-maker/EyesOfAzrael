/**
 * Firebase Upload Script using REST API
 * Uploads migrated content to Firestore using REST API (no SDK required)
 *
 * Usage: node scripts/upload-via-rest-api.js <collection> <import-file>
 * Example: node scripts/upload-via-rest-api.js items data/firebase-imports/items-import.json
 */

const fs = require('fs');
const https = require('https');

// Firebase configuration
const PROJECT_ID = 'eyesofazrael';
const API_KEY = 'AIzaSyAa9KV0pZqXFzE8H9T7gJNx2mY5RlvKj3w';

// Parse command line arguments
const collectionName = process.argv[2];
const importFilePath = process.argv[3];

if (!collectionName || !importFilePath) {
    console.error('Usage: node upload-via-rest-api.js <collection> <import-file>');
    console.error('Example: node upload-via-rest-api.js items data/firebase-imports/items-import.json');
    process.exit(1);
}

// Helper function to make REST API calls
function firestoreRequest(method, path, data = null) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'firestore.googleapis.com',
            port: 443,
            path: `/v1/projects/${PROJECT_ID}/databases/(default)/documents/${path}?key=${API_KEY}`,
            method: method,
            headers: {
                'Content-Type': 'application/json'
            }
        };

        const req = https.request(options, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    resolve(JSON.parse(body || '{}'));
                } else {
                    reject(new Error(`HTTP ${res.statusCode}: ${body}`));
                }
            });
        });

        req.on('error', reject);

        if (data) {
            req.write(JSON.stringify(data));
        }

        req.end();
    });
}

// Convert JavaScript object to Firestore value format
function toFirestoreValue(value) {
    if (value === null) {
        return { nullValue: null };
    } else if (typeof value === 'boolean') {
        return { booleanValue: value };
    } else if (typeof value === 'number') {
        if (Number.isInteger(value)) {
            return { integerValue: value.toString() };
        } else {
            return { doubleValue: value };
        }
    } else if (typeof value === 'string') {
        return { stringValue: value };
    } else if (Array.isArray(value)) {
        return {
            arrayValue: {
                values: value.map(toFirestoreValue)
            }
        };
    } else if (typeof value === 'object') {
        const fields = {};
        for (const [key, val] of Object.entries(value)) {
            fields[key] = toFirestoreValue(val);
        }
        return { mapValue: { fields } };
    }
    return { stringValue: String(value) };
}

// Convert document to Firestore format
function toFirestoreDocument(doc) {
    const fields = {};
    for (const [key, value] of Object.entries(doc)) {
        if (key !== 'id') {  // Skip ID field, it's in the document path
            fields[key] = toFirestoreValue(value);
        }
    }
    return { fields };
}

// Upload documents
async function uploadToFirestore() {
    console.log(`\n=== Firebase Upload via REST API ===\n`);
    console.log(`Collection: ${collectionName}`);
    console.log(`Import file: ${importFilePath}\n`);

    // Load import data
    if (!fs.existsSync(importFilePath)) {
        throw new Error(`Import file not found: ${importFilePath}`);
    }

    const data = JSON.parse(fs.readFileSync(importFilePath, 'utf8'));
    console.log(`Loaded ${data.length} documents\n`);

    console.log('Starting upload...\n');
    let uploaded = 0;
    let failed = 0;
    const errors = [];

    for (let i = 0; i < data.length; i++) {
        const item = data[i];
        const docId = item.id;

        try {
            const firestoreDoc = toFirestoreDocument(item);
            await firestoreRequest('PATCH', `${collectionName}/${docId}`, firestoreDoc);
            uploaded++;

            // Progress indicator
            if ((i + 1) % 10 === 0) {
                console.log(`Progress: ${uploaded}/${data.length} documents uploaded`);
            }

            // Rate limiting - wait 100ms between requests
            await new Promise(resolve => setTimeout(resolve, 100));

        } catch (error) {
            console.error(`✗ Failed to upload ${docId}:`, error.message);
            failed++;
            errors.push({ id: docId, error: error.message });
        }
    }

    // Summary
    console.log('\n=== Upload Summary ===');
    console.log(`Total documents: ${data.length}`);
    console.log(`✓ Successful: ${uploaded}`);
    console.log(`✗ Failed: ${failed}`);

    if (errors.length > 0) {
        console.log('\nErrors (first 10):');
        errors.slice(0, 10).forEach(err => console.log(`  - ${err.id}: ${err.error}`));
    }

    // Verify upload
    console.log('\n=== Verification ===');
    try {
        const result = await firestoreRequest('GET', `${collectionName}`);
        const documents = result.documents || [];
        console.log(`✓ Collection ${collectionName} now contains ${documents.length} documents (sample)`);

        if (documents.length > 0) {
            console.log('\nSample documents:');
            documents.slice(0, 3).forEach(doc => {
                const name = doc.name.split('/').pop();
                console.log(`  - ${name}`);
            });
        }
    } catch (error) {
        console.error('✗ Verification failed:', error.message);
    }

    console.log('\n✅ Upload complete!\n');
}

// Run upload
uploadToFirestore().catch(error => {
    console.error('\n✗ Upload failed:', error);
    console.error(error.stack);
    process.exit(1);
});
