const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Initialize Firebase Admin (if not already initialized)
if (!admin.apps.length) {
  // Try to load service account key if available
  try {
    const serviceAccount = require('../serviceAccountKey.json');
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    console.log('✓ Firebase Admin initialized with service account');
  } catch (error) {
    // Fall back to application default credentials
    admin.initializeApp();
    console.log('✓ Firebase Admin initialized with default credentials');
  }
}

const db = admin.firestore();

async function uploadFixes() {
  const fixesPath = path.join(__dirname, '../FIREBASE/transformed_data/mythology_fixes.json');
  const fixes = JSON.parse(fs.readFileSync(fixesPath, 'utf8'));

  console.log(`\n=== Uploading ${fixes.length} Mythology Fixes to Firestore ===\n`);

  let successCount = 0;
  let errorCount = 0;

  for (const fix of fixes) {
    try {
      const docRef = db.collection(fix.collection).doc(fix.id);

      // Update only the fields that changed
      await docRef.set(fix.data, { merge: true });

      console.log(`✓ Updated ${fix.id}`);
      successCount++;
    } catch (error) {
      console.error(`✗ Error updating ${fix.id}:`, error.message);
      errorCount++;
    }
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
