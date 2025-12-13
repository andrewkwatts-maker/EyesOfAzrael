const fs = require('fs');
const path = require('path');
const https = require('https');

// Firebase config from firebase-config.js
const PROJECT_ID = 'eyesofazrael';
const API_KEY = 'AIzaSyB7bFdte6f81-bNMsdITgnnnWq7aBNMXRw';

// Load the fixes
const fixesPath = path.join(__dirname, '../FIREBASE/transformed_data/mythology_fixes.json');
const fixes = JSON.parse(fs.readFileSync(fixesPath, 'utf8'));

async function updateDocument(collection, docId, data) {
  return new Promise((resolve, reject) => {
    // Convert data to Firestore format
    const firestoreData = {
      fields: {}
    };

    for (const [key, value] of Object.entries(data)) {
      if (typeof value === 'string') {
        firestoreData.fields[key] = { stringValue: value };
      } else if (typeof value === 'number') {
        firestoreData.fields[key] = { integerValue: value };
      } else if (typeof value === 'boolean') {
        firestoreData.fields[key] = { booleanValue: value };
      } else if (Array.isArray(value)) {
        firestoreData.fields[key] = {
          arrayValue: {
            values: value.map(v => ({ stringValue: String(v) }))
          }
        };
      } else if (value === null) {
        firestoreData.fields[key] = { nullValue: null };
      } else {
        // Skip complex objects for now
        continue;
      }
    }

    const postData = JSON.stringify(firestoreData);

    const options = {
      hostname: 'firestore.googleapis.com',
      port: 443,
      path: `/v1/projects/${PROJECT_ID}/databases/(default)/documents/${collection}/${docId}?key=${API_KEY}&updateMask.fieldPaths=description&updateMask.fieldPaths=title&updateMask.fieldPaths=displayName`,
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': postData.length
      }
    };

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(JSON.parse(data));
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(postData);
    req.end();
  });
}

async function uploadFixes() {
  console.log(`\n=== Uploading ${fixes.length} Mythology Fixes via REST API ===\n`);

  let successCount = 0;
  let errorCount = 0;

  for (const fix of fixes) {
    try {
      await updateDocument(fix.collection, fix.id, fix.data);
      console.log(`✓ Updated ${fix.id}`);
      successCount++;
    } catch (error) {
      console.error(`✗ Error updating ${fix.id}:`, error.message);
      errorCount++;
    }

    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 200));
  }

  console.log(`\n=== Upload Complete ===`);
  console.log(`✓ Success: ${successCount}`);
  console.log(`✗ Errors: ${errorCount}`);

  process.exit(errorCount > 0 ? 1 : 0);
}

uploadFixes().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
