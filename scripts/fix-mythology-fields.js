/**
 * Fix Mythology Fields
 *
 * Fixes deities with "general" mythology to their correct tradition
 * Also fixes Ra's name field from "The Sun God | Egyptian Mythology" to "Ra"
 */

const fs = require('fs').promises;
const path = require('path');

const DEITIES_DIR = path.join(__dirname, '..', 'firebase-assets-downloaded', 'deities');

// Mapping of deity IDs to their correct mythology
const MYTHOLOGY_FIXES = {
  // Norse deities
  'odin': 'norse',
  'thor': 'norse',
  'tyr': 'norse',
  'heimdall': 'norse',
  'freyja': 'norse',
  'frigg': 'norse',
  'baldr': 'norse',
  'loki': 'norse',

  // Buddhist deities
  'buddha': 'buddhist',
  'gautama_buddha': 'buddhist',
  'avalokiteshvara': 'buddhist',
  'manjushri': 'buddhist',
  'guanyin': 'buddhist',

  // Sumerian deities
  'an': 'sumerian'
};

// Name fixes
const NAME_FIXES = {
  'ra': 'Ra'
};

async function fixMythologyFields() {
  console.log('Fixing mythology and name fields...\n');

  let mythologyFixed = 0;
  let namesFixed = 0;

  for (const [deityId, correctMythology] of Object.entries(MYTHOLOGY_FIXES)) {
    const filePath = path.join(DEITIES_DIR, `${deityId}.json`);

    try {
      const content = await fs.readFile(filePath, 'utf8');
      const data = JSON.parse(content);

      if (data.mythology === 'general') {
        data.mythology = correctMythology;
        await fs.writeFile(filePath, JSON.stringify(data, null, 2));
        console.log(`  Fixed ${deityId}: general -> ${correctMythology}`);
        mythologyFixed++;
      }
    } catch (err) {
      console.log(`  Skipped ${deityId}: ${err.message}`);
    }
  }

  // Fix Ra's name
  for (const [deityId, correctName] of Object.entries(NAME_FIXES)) {
    const filePath = path.join(DEITIES_DIR, `${deityId}.json`);

    try {
      const content = await fs.readFile(filePath, 'utf8');
      const data = JSON.parse(content);

      if (data.name && data.name.includes('|')) {
        const oldName = data.name;
        data.name = correctName;
        await fs.writeFile(filePath, JSON.stringify(data, null, 2));
        console.log(`  Fixed ${deityId} name: "${oldName}" -> "${correctName}"`);
        namesFixed++;
      }
    } catch (err) {
      console.log(`  Skipped ${deityId} name fix: ${err.message}`);
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log('SUMMARY');
  console.log('='.repeat(50));
  console.log(`Mythology fields fixed: ${mythologyFixed}`);
  console.log(`Name fields fixed: ${namesFixed}`);
}

fixMythologyFields().catch(console.error);
