/**
 * Fix Celtic Deity Family Data
 *
 * The Celtic deity files have corrupted family data (strings split into character arrays).
 * This script restores them to empty arrays for now.
 */

const fs = require('fs');
const path = require('path');

const CELTIC_DIR = path.join(__dirname, '..', 'firebase-assets-enhanced', 'deities', 'celtic');

const celticFiles = [
  'aengus.json',
  'brigid.json',
  'cernunnos.json',
  'dagda.json',
  'lugh.json',
  'manannan.json',
  'nuada.json',
  'ogma.json',
];

console.log('\nFixing Celtic deity family data...\n');

let fixed = 0;

for (const fileName of celticFiles) {
  const filePath = path.join(CELTIC_DIR, fileName);

  try {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

    // Reset family to empty arrays
    if (data.family) {
      data.family = {
        parents: [],
        siblings: [],
        consorts: [],
        children: []
      };
    }

    // Also remove relatedEntities if it has issues
    if (data.relatedEntities && Array.isArray(data.relatedEntities)) {
      data.relatedEntities = data.relatedEntities.filter(entity => {
        return entity && typeof entity === 'object' && entity.id && entity.name;
      });
    }

    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
    console.log(`✓ Fixed: ${fileName}`);
    fixed++;
  } catch (error) {
    console.error(`✗ Error fixing ${fileName}: ${error.message}`);
  }
}

console.log(`\n✓ Fixed ${fixed} Celtic deity files`);
