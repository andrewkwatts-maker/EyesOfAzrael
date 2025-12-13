/**
 * Upload Mythology Fixes to Firestore
 * This script uses the Firebase web SDK (not Admin SDK)
 * Run this in the browser console on the website
 */

const fs = require('fs');
const path = require('path');

// Load the fixes
const fixesPath = path.join(__dirname, '../FIREBASE/transformed_data/mythology_fixes.json');
const fixes = JSON.parse(fs.readFileSync(fixesPath, 'utf8'));

// Generate JavaScript code to run in browser console
const browserScript = `
// Run this in the browser console on https://www.eyesofazrael.com

async function uploadMythologyFixes() {
  if (typeof firebase === 'undefined') {
    console.error('Firebase not loaded!');
    return;
  }

  const db = firebase.firestore();
  const fixes = ${JSON.stringify(fixes, null, 2)};

  console.log('=== Uploading ' + fixes.length + ' Mythology Fixes ===\\n');

  let successCount = 0;
  let errorCount = 0;

  for (const fix of fixes) {
    try {
      const docRef = db.collection(fix.collection).doc(fix.id);
      await docRef.set(fix.data, { merge: true });
      console.log('✓ Updated ' + fix.id);
      successCount++;
    } catch (error) {
      console.error('✗ Error updating ' + fix.id + ':', error.message);
      errorCount++;
    }
  }

  console.log('\\n=== Upload Complete ===');
  console.log('✓ Success: ' + successCount);
  console.log('✗ Errors: ' + errorCount);
}

uploadMythologyFixes();
`;

// Save the browser script
const browserScriptPath = path.join(__dirname, '../FIREBASE/transformed_data/upload-in-browser.js');
fs.writeFileSync(browserScriptPath, browserScript);

console.log('✓ Browser script created!');
console.log('\nTo upload the fixes:');
console.log('1. Open https://www.eyesofazrael.com in your browser');
console.log('2. Open browser console (F12)');
console.log('3. Copy and paste the contents of:');
console.log('   FIREBASE/transformed_data/upload-in-browser.js');
console.log('4. Press Enter to run');
console.log('\nAlternatively, use the Firestore console to manually update the documents.');
