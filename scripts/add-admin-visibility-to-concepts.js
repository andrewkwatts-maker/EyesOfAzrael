#!/usr/bin/env node
/**
 * Add visibility: "admin" to all concept files
 * This makes conspiracy/concept content only visible to admins
 */

const fs = require('fs');
const path = require('path');

const conceptsDir = path.join(__dirname, '../firebase-assets-downloaded/concepts');

if (!fs.existsSync(conceptsDir)) {
  console.log('No concepts directory found');
  process.exit(0);
}

const files = fs.readdirSync(conceptsDir).filter(f => f.endsWith('.json'));
let updated = 0;

for (const file of files) {
  const filePath = path.join(conceptsDir, file);
  try {
    const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));

    if (!content.visibility) {
      content.visibility = 'admin';
      fs.writeFileSync(filePath, JSON.stringify(content, null, 2));
      updated++;
    }
  } catch (e) {
    console.error(`Error processing ${file}:`, e.message);
  }
}

console.log(`Updated ${updated} concept files with visibility: "admin"`);
console.log(`Total files checked: ${files.length}`);
